import express from 'express';
import cors from 'cors';
import { spawn, execFileSync } from 'child_process';
import { homedir } from 'os';
import { join } from 'path';

const app = express();
app.use(express.json({ limit: '5mb' }));
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'] }));

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

  throw new Error('claude CLI not found. Install Claude Code: npm install -g @anthropic-ai/claude-code');
}

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
    '--output-format', 'text',
    '--model', model,
    '--no-session-persistence',
    '--dangerously-skip-permissions',
  ];

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

// Health / status check
app.get('/api/ai/status', (_req, res) => {
  try {
    const bin = getClaudeBin();

    // Quick auth test
    const isWin = process.platform === 'win32';
    const testEnv: Record<string, string> = {};
    for (const [key, val] of Object.entries(process.env)) {
      if (val !== undefined && !key.startsWith('CLAUDECODE') && !key.startsWith('CLAUDE_CODE')) {
        testEnv[key] = val;
      }
    }

    try {
      const testArgs = ['--print', '--output-format', 'text', '--no-session-persistence', '--dangerously-skip-permissions'];
      let testResult: string;

      if (isWin) {
        const cmdLine = ['claude', ...testArgs].join(' ');
        testResult = execFileSync('cmd.exe', ['/c', cmdLine], {
          encoding: 'utf-8',
          timeout: 30000,
          env: testEnv,
          input: 'reply ok',
        });
      } else {
        testResult = execFileSync(bin, testArgs, {
          encoding: 'utf-8',
          timeout: 30000,
          env: testEnv,
          input: 'reply ok',
        });
      }

      res.json({ connected: true, bin, authVerified: true });
    } catch (authErr) {
      // Binary found but auth test failed
      res.json({
        connected: false,
        bin,
        authVerified: false,
        error: authErr instanceof Error ? authErr.message : 'Auth test failed — run `claude` in your terminal to log in',
      });
    }
  } catch (err) {
    res.json({
      connected: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// Generate text from prompt
app.post('/api/ai/generate', (req, res) => {
  const { prompt, model } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt required' });

  const selectedModel = model || 'claude-opus-4-6';

  let proc: ReturnType<typeof spawn>;
  try {
    proc = spawnClaude(prompt, selectedModel);
  } catch (err) {
    return res.status(503).json({
      error: err instanceof Error ? err.message : 'Failed to spawn claude',
    });
  }

  // Collect all output then send as plain text
  let stdout = '';
  let stderr = '';

  // Timeout: kill process after 120s
  const timeout = setTimeout(() => {
    proc.kill('SIGTERM');
    setTimeout(() => proc.kill('SIGKILL'), 5000);
  }, 120000);

  proc.stdout!.on('data', (chunk: Buffer) => {
    stdout += chunk.toString();
  });

  proc.stderr!.on('data', (chunk: Buffer) => {
    stderr += chunk.toString();
  });

  proc.on('close', (code) => {
    clearTimeout(timeout);
    if (code !== 0 && !stdout.trim()) {
      console.error(`[claude] exited with code ${code}, stderr: ${stderr.slice(0, 500)}`);
      res.status(500).json({ error: `claude CLI exited with code ${code}` });
      return;
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(stdout);
  });

  proc.on('error', (err) => {
    clearTimeout(timeout);
    console.error('[claude error]', err);
    res.status(500).json({ error: err.message });
  });

  // Handle client disconnect
  res.on('close', () => {
    if (!proc.killed) {
      clearTimeout(timeout);
      proc.kill('SIGTERM');
    }
  });
});

export { app };
export const AI_SERVER_PORT = 3002;
