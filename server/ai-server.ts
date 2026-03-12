import express from 'express';
import cors from 'cors';
import { spawn, execFileSync } from 'child_process';
import { homedir } from 'os';
import { join } from 'path';

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }));

// --- Claude Binary Resolution ---

function getClaudeBin(): string {
  const isWin = process.platform === 'win32';

  // Try PATH first
  try {
    const cmd = isWin ? 'where' : 'which';
    const result = execFileSync(cmd, ['claude'], { encoding: 'utf-8' }).trim();
    const lines = result.split('\n').map((l) => l.trim()).filter(Boolean);

    if (isWin) {
      // On Windows, prefer the .cmd version since spawn needs it
      const cmdVersion = lines.find((l) => l.endsWith('.cmd'));
      if (cmdVersion) return cmdVersion;
    }

    if (lines[0]) return lines[0];
  } catch {}

  // Common fallback locations
  const candidates = isWin
    ? [
        join(homedir(), 'AppData', 'Roaming', 'npm', 'claude.cmd'),
        'C:\\Program Files\\nodejs\\claude.cmd',
      ]
    : [
        '/usr/local/bin/claude',
        join(homedir(), '.local/bin/claude'),
        join(homedir(), '.npm-global/bin/claude'),
      ];

  for (const c of candidates) {
    try {
      execFileSync(c, ['--version'], { encoding: 'utf-8', timeout: 5000 });
      return c;
    } catch {}
  }

  throw new Error('claude CLI not found. Install Claude Code: https://claude.ai/code');
}

// --- Preferred Model ---

let preferredModel = 'claude-sonnet-4-6';

// --- Spawn Helper ---

function spawnClaude(prompt: string, model: string): ReturnType<typeof spawn> {
  // Build a clean env without any Claude Code session vars
  const env: Record<string, string> = {};
  for (const [key, val] of Object.entries(process.env)) {
    if (val !== undefined && !key.startsWith('CLAUDECODE') && !key.startsWith('CLAUDE_CODE')) {
      env[key] = val;
    }
  }

  const isWin = process.platform === 'win32';

  const args = [
    '--print',
    '--output-format', 'stream-json',
    '--verbose',
    '--model', model,
    '--no-session-persistence',
    '--dangerously-skip-permissions',
  ];

  // On Windows, run through cmd.exe explicitly to handle .cmd shims.
  // On Unix, use the resolved binary path directly.
  let proc;
  if (isWin) {
    const cmdLine = ['claude', ...args].join(' ');
    proc = spawn('cmd.exe', ['/c', cmdLine], {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } else {
    proc = spawn(getClaudeBin(), args, {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  }

  proc.stdin!.write(prompt);
  proc.stdin!.end();

  return proc;
}

// --- Routes ---

// Health check
app.get('/api/ai/status', (_req, res) => {
  try {
    const bin = getClaudeBin();
    res.json({ connected: true, model: preferredModel, bin });
  } catch (err) {
    res.json({
      connected: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// Set model preference
app.post('/api/ai/model', (req, res) => {
  const { model } = req.body;
  const valid = ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'];
  if (!valid.includes(model)) {
    return res.status(400).json({ error: 'Invalid model' });
  }
  preferredModel = model;
  res.json({ model: preferredModel });
});

// Streaming generate
app.post('/api/ai/generate', (req, res) => {
  const { prompt, model, context } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt required' });

  const fullPrompt = context
    ? `Here is context about the current panel event:\n\n${context}\n\n---\n\nUser request: ${prompt}`
    : prompt;

  const selectedModel = model || preferredModel;

  let proc: ReturnType<typeof spawn>;
  try {
    proc = spawnClaude(fullPrompt, selectedModel);
  } catch (err) {
    return res.status(503).json({
      error: err instanceof Error ? err.message : 'Failed to spawn claude',
    });
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Timeout: kill process after 120s
  const timeout = setTimeout(() => {
    proc.kill('SIGTERM');
    setTimeout(() => proc.kill('SIGKILL'), 5000);
  }, 120000);

  let buffer = '';
  let procDone = false;
  let clientDisconnected = false;

  proc.stdout!.on('data', (chunk: Buffer) => {
    if (clientDisconnected) return;
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        if (event.type === 'assistant' && Array.isArray(event.message?.content)) {
          for (const block of event.message.content) {
            if (block.type === 'text' && block.text) {
              res.write(block.text);
            }
          }
        }
      } catch {}
    }
  });

  proc.stderr!.on('data', (chunk: Buffer) => {
    const msg = chunk.toString();
    if (!msg.includes('Warning') && !msg.includes('warn')) {
      console.error('[claude stderr]', msg.slice(0, 200));
    }
  });

  proc.on('close', (code) => {
    procDone = true;
    clearTimeout(timeout);
    // Flush remaining buffer
    if (!clientDisconnected && buffer.trim()) {
      try {
        const event = JSON.parse(buffer);
        if (event.type === 'assistant') {
          for (const block of event.message?.content ?? []) {
            if (block.type === 'text' && block.text) {
              res.write(block.text);
            }
          }
        }
      } catch {}
    }
    if (code !== 0 && code !== null) {
      console.error(`claude CLI exited with code ${code}`);
    }
    res.end();
  });

  proc.on('error', (err) => {
    procDone = true;
    clearTimeout(timeout);
    console.error('[claude error]', err);
    res.end();
  });

  // Only kill on genuine client disconnect (e.g. user navigates away)
  res.on('close', () => {
    clientDisconnected = true;
    if (!procDone) {
      clearTimeout(timeout);
      proc.kill('SIGTERM');
    }
  });
});

// Multi-turn chat
app.post('/api/ai/chat', (req, res) => {
  const { messages, model, context } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages required' });
  }

  // Build multi-turn prompt
  const turns = messages
    .map((m: { role: string; content: string }) =>
      m.role === 'user' ? m.content : `[Assistant]: ${m.content}`
    )
    .join('\n\n');

  const systemContext = context
    ? `You are an AI assistant for VBI Panel Event Management. Here is context about the current panel event:\n\n${context}\n\n---\n\nConversation:\n`
    : 'You are an AI assistant for VBI Panel Event Management.\n\nConversation:\n';

  const fullPrompt = systemContext + turns;
  const selectedModel = model || preferredModel;

  let proc: ReturnType<typeof spawn>;
  try {
    proc = spawnClaude(fullPrompt, selectedModel);
  } catch (err) {
    return res.status(503).json({
      error: err instanceof Error ? err.message : 'Failed to spawn claude',
    });
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const timeout = setTimeout(() => {
    proc.kill('SIGTERM');
    setTimeout(() => proc.kill('SIGKILL'), 5000);
  }, 120000);

  let buffer = '';
  let procDone = false;
  let clientDisconnected = false;

  proc.stdout!.on('data', (chunk: Buffer) => {
    if (clientDisconnected) return;
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        if (event.type === 'assistant' && Array.isArray(event.message?.content)) {
          for (const block of event.message.content) {
            if (block.type === 'text' && block.text) {
              res.write(block.text);
            }
          }
        }
      } catch {}
    }
  });

  proc.stderr!.on('data', (chunk: Buffer) => {
    const msg = chunk.toString();
    if (!msg.includes('Warning') && !msg.includes('warn')) {
      console.error('[claude stderr]', msg.slice(0, 200));
    }
  });

  proc.on('close', (code) => {
    procDone = true;
    clearTimeout(timeout);
    if (!clientDisconnected && buffer.trim()) {
      try {
        const event = JSON.parse(buffer);
        if (event.type === 'assistant') {
          for (const block of event.message?.content ?? []) {
            if (block.type === 'text' && block.text) {
              res.write(block.text);
            }
          }
        }
      } catch {}
    }
    if (code !== 0 && code !== null) {
      console.error(`claude CLI exited with code ${code}`);
    }
    res.end();
  });

  proc.on('error', (err) => {
    procDone = true;
    clearTimeout(timeout);
    console.error('[claude error]', err);
    res.end();
  });

  res.on('close', () => {
    clientDisconnected = true;
    if (!procDone) {
      clearTimeout(timeout);
      proc.kill('SIGTERM');
    }
  });
});

// --- Start ---

const PORT = 3002;
const server = app.listen(PORT, () => {
  console.log(`AI server ready at http://localhost:${PORT}`);
  try {
    const bin = getClaudeBin();
    console.log(`Claude CLI found: ${bin}`);
  } catch (err) {
    console.warn('Claude CLI not found - AI features will be unavailable');
  }
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Run: npx kill-port ${PORT}`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});
