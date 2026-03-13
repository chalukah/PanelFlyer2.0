const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

async function callViaProxy(apiKey: string, prompt: string, model: string) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey,
      model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  return res;
}

async function callDirect(apiKey: string, prompt: string, model: string) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  return res;
}

export async function sendToClaudeAI(
  apiKey: string,
  prompt: string,
  model?: string
): Promise<string> {
  const m = model || DEFAULT_MODEL;

  // Try the serverless proxy first, fall back to direct API call
  let res: Response;
  try {
    res = await callViaProxy(apiKey, prompt, m);
    // If the proxy itself is missing (404 HTML page), fall back to direct
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      res = await callDirect(apiKey, prompt, m);
    }
  } catch {
    res = await callDirect(apiKey, prompt, m);
  }

  if (res.status === 401) {
    throw new Error('Invalid Claude API key. Please check your key in Settings.');
  }
  if (res.status === 429) {
    throw new Error('Rate limited. Please wait a moment and try again.');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Claude API error (${res.status})`);
  }

  const data = await res.json();

  // Extract text from Claude's response format
  const textBlock = data.content?.find(
    (block: { type: string; text?: string }) => block.type === 'text'
  );
  if (!textBlock?.text) {
    throw new Error('No text response from Claude');
  }

  return textBlock.text;
}

export async function testClaudeConnection(
  apiKey: string,
  model?: string
): Promise<boolean> {
  try {
    await sendToClaudeAI(apiKey, 'Reply with just "ok".', model);
    return true;
  } catch {
    return false;
  }
}

// --- Claude CLI (local subprocess via AI server) ---

export async function sendToClaudeCLI(prompt: string, model?: string): Promise<string> {
  const res = await fetch('http://localhost:3002/api/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model }),
  });
  if (!res.ok) throw new Error(`AI server error: ${res.status}`);
  return res.text();
}

export async function checkClaudeCLIStatus(): Promise<{ connected: boolean; bin?: string; error?: string }> {
  try {
    const res = await fetch('http://localhost:3002/api/ai/status');
    if (!res.ok) throw new Error('AI server not reachable');
    return await res.json();
  } catch {
    return { connected: false, error: 'AI server not running on localhost:3001' };
  }
}
