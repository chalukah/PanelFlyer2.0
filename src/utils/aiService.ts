/**
 * Unified AI Service — dual-mode: Claude CLI (local) + Anthropic SDK (API key).
 *
 * Auto-detects which mode is available:
 * 1. CLI mode: uses existing Express server endpoints (/api/ai/*)
 * 2. SDK mode: uses Anthropic API directly with user's API key
 *
 * Falls through: CLI → SDK → error
 */

import { withRetry } from './retry';

export type AIMode = 'cli' | 'sdk' | 'none';

export type AIServiceStatus = {
  mode: AIMode;
  cliConnected: boolean;
  sdkConfigured: boolean;
  cliBin?: string;
  error?: string;
};

// ——————————————————————————————————————
// State
// ——————————————————————————————————————

let _cachedStatus: AIServiceStatus | null = null;
let _apiKey: string = '';

// ——————————————————————————————————————
// API Key Management
// ——————————————————————————————————————

export function setApiKey(key: string) {
  _apiKey = key;
  localStorage.setItem('panel_flyer_claude_key', key);
  _cachedStatus = null; // Force re-check
}

export function getApiKey(): string {
  if (_apiKey) return _apiKey;
  _apiKey = localStorage.getItem('panel_flyer_claude_key') || '';
  return _apiKey;
}

export function clearApiKey() {
  _apiKey = '';
  localStorage.removeItem('panel_flyer_claude_key');
  _cachedStatus = null;
}

// ——————————————————————————————————————
// Status Check
// ——————————————————————————————————————

export async function checkAIStatus(forceRefresh = false): Promise<AIServiceStatus> {
  if (_cachedStatus && !forceRefresh) return _cachedStatus;

  let cliConnected = false;
  let cliBin: string | undefined;

  // Check CLI availability
  try {
    const res = await fetch('/api/ai/status', { signal: AbortSignal.timeout(35000) });
    if (res.ok) {
      const data = await res.json();
      cliConnected = data.connected === true && data.authVerified === true;
      cliBin = data.bin;
    }
  } catch {
    // Server not running
  }

  const sdkConfigured = Boolean(getApiKey());

  const mode: AIMode = cliConnected ? 'cli' : sdkConfigured ? 'sdk' : 'none';

  _cachedStatus = { mode, cliConnected, sdkConfigured, cliBin };
  return _cachedStatus;
}

export function getMode(): AIMode {
  return _cachedStatus?.mode || 'none';
}

// ——————————————————————————————————————
// Generate Text (single prompt)
// ——————————————————————————————————————

export async function generateText(
  prompt: string,
  options: {
    model?: string;
    context?: string;
    signal?: AbortSignal;
    onChunk?: (text: string) => void;
    preferMode?: AIMode;
  } = {}
): Promise<string> {
  const status = await checkAIStatus();
  const modes: AIMode[] = options.preferMode
    ? [options.preferMode, ...(options.preferMode === 'cli' ? ['sdk'] : ['cli']) as AIMode[]]
    : status.cliConnected ? ['cli', 'sdk'] : ['sdk', 'cli'];

  let lastError: unknown;

  for (const mode of modes) {
    try {
      if (mode === 'cli' && status.cliConnected) {
        return await generateViaCLI(prompt, options);
      }
      if (mode === 'sdk' && getApiKey()) {
        return await generateViaSDK(prompt, options);
      }
    } catch (err) {
      lastError = err;
      console.warn(`[aiService] ${mode} mode failed, trying next:`, err);
    }
  }

  throw lastError || new Error('No AI mode available. Connect Claude CLI or add an API key in Settings.');
}

// ——————————————————————————————————————
// CLI mode (via Express server)
// ——————————————————————————————————————

async function generateViaCLI(
  prompt: string,
  options: { model?: string; context?: string; signal?: AbortSignal; onChunk?: (text: string) => void }
): Promise<string> {
  return withRetry(async () => {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        model: options.model,
        context: options.context,
      }),
      signal: options.signal,
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error');
      throw new Error(`CLI AI error (${res.status}): ${err}`);
    }

    if (options.onChunk && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        options.onChunk(chunk);
      }
      return fullText;
    }

    return await res.text();
  }, {
    maxRetries: 1,
    signal: options.signal,
    isRetryable: (err) => {
      if (err instanceof Error && err.message.includes('503')) return true;
      return false;
    },
  });
}

// ——————————————————————————————————————
// SDK mode (direct Anthropic API from browser)
// ——————————————————————————————————————

async function generateViaSDK(
  prompt: string,
  options: { model?: string; context?: string; signal?: AbortSignal; onChunk?: (text: string) => void }
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('No Anthropic API key configured');

  const model = options.model || 'claude-sonnet-4-20250514';
  const messages: Array<{ role: string; content: string }> = [];

  if (options.context) {
    messages.push({ role: 'user', content: `Context:\n${options.context}\n\n${prompt}` });
  } else {
    messages.push({ role: 'user', content: prompt });
  }

  // Try server proxy first (avoids CORS), then direct
  let res: Response;
  try {
    res = await fetch('/api/ai/generate-sdk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, model, messages, max_tokens: 4096 }),
      signal: options.signal,
    });
    if (!res.ok || !(res.headers.get('content-type') || '').includes('json')) {
      throw new Error('Proxy not available');
    }
  } catch {
    // Direct browser call
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model, max_tokens: 4096, messages }),
      signal: options.signal,
    });
  }

  if (res.status === 401) throw new Error('Invalid API key. Check your Anthropic API key in Settings.');
  if (res.status === 429) throw new Error('Rate limited. Please wait and try again.');
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any).error?.message || `Anthropic API error (${res.status})`);
  }

  const data = await res.json();
  const text = data.content?.find((b: any) => b.type === 'text')?.text || '';

  if (options.onChunk) options.onChunk(text);
  return text;
}

// ——————————————————————————————————————
// Chat (multi-turn)
// ——————————————————————————————————————

export type ChatMsg = { role: 'user' | 'assistant'; content: string };

export async function chat(
  messages: ChatMsg[],
  options: {
    model?: string;
    context?: string;
    signal?: AbortSignal;
    onChunk?: (text: string) => void;
  } = {}
): Promise<string> {
  const status = await checkAIStatus();

  // CLI chat
  if (status.cliConnected) {
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          model: options.model,
          context: options.context,
        }),
        signal: options.signal,
      });

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          options.onChunk?.(chunk);
        }
        return fullText;
      }
    } catch {
      // Fall through to SDK
    }
  }

  // SDK chat
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('No AI available. Connect Claude CLI or add an API key.');

  const model = options.model || 'claude-sonnet-4-20250514';
  const apiMessages = messages.map(m => ({ role: m.role, content: m.content }));

  if (options.context) {
    apiMessages.unshift({ role: 'user', content: `Context:\n${options.context}` });
    apiMessages.splice(1, 0, { role: 'assistant', content: 'Understood, I have the context.' });
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model, max_tokens: 4096, messages: apiMessages }),
    signal: options.signal,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any).error?.message || `Chat failed (${res.status})`);
  }

  const data = await res.json();
  const text = data.content?.find((b: any) => b.type === 'text')?.text || '';
  options.onChunk?.(text);
  return text;
}

// ——————————————————————————————————————
// Test connection
// ——————————————————————————————————————

export async function testConnection(apiKey?: string): Promise<boolean> {
  if (apiKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Reply ok' }],
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  const status = await checkAIStatus(true);
  return status.mode !== 'none';
}
