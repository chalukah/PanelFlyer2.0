import express from 'express';
import cors from 'cors';
import { spawn, execFileSync } from 'child_process';
import { homedir } from 'os';
import { join, resolve } from 'path';
import { mkdtempSync, readFileSync, rmSync, readdirSync, writeFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import puppeteer from 'puppeteer';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'] }));

// ——————————————————————————————————————
// Puppeteer browser pool (lazy-init singleton)
// ——————————————————————————————————————
let _browser: puppeteer.Browser | null = null;
async function getBrowser(): Promise<puppeteer.Browser> {
  if (!_browser || !_browser.connected) {
    _browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    });
  }
  return _browser;
}

// ——————————————————————————————————————
// POST /api/render-png — Server-side HTML → PNG using real Chrome
// ——————————————————————————————————————
app.post('/api/render-png', async (req, res) => {
  try {
    const { html, format = 'jpeg', quality = 80 } = req.body;
    if (!html) return res.status(400).json({ error: 'html field required' });

    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Wait for all images to load (with a 10s max timeout)
    await page.evaluate(() => {
      return Promise.race([
        Promise.all(
          Array.from(document.querySelectorAll('img')).map((img) =>
            img.complete ? Promise.resolve() : new Promise((r) => { img.onload = r; img.onerror = r; })
          )
        ),
        new Promise((r) => setTimeout(r, 10000)),
      ]);
    });

    // Wait for fonts + background images to render
    await new Promise((r) => setTimeout(r, 1000));

    const screenshotOpts: any = { clip: { x: 0, y: 0, width: 1080, height: 1080 } };
    if (format === 'jpeg') {
      screenshotOpts.type = 'jpeg';
      screenshotOpts.quality = Math.min(100, Math.max(1, quality));
    } else {
      screenshotOpts.type = 'png';
    }

    const buffer = await page.screenshot(screenshotOpts);
    await page.close();

    res.set('Content-Type', format === 'jpeg' ? 'image/jpeg' : 'image/png');
    res.send(buffer);
  } catch (err) {
    console.error('render-png error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Render failed' });
  }
});

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

// Codex/ChatGPT removed — strictly Claude only

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

// spawnCodex removed — strictly Claude only

async function generateWithLocalProvider(
  _provider: 'claude',
  prompt: string,
  model?: string,
): Promise<string> {
  const proc = spawnClaude(prompt, model || 'claude-opus-4-6');
  return await new Promise<string>((resolve, reject) => {
    let stdout = '';
    let stderr = '';
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
        reject(new Error(`claude CLI exited with code ${code}: ${stderr.slice(0, 500)}`));
        return;
      }
      resolve(stdout);
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// --- Routes ---

// Health / status check
app.get('/api/ai/status', (_req, res) => {
  const status: Record<string, any> = {
    connected: false,
    authVerified: false,
    claudeConnected: false,
  };

  try {
    const bin = getClaudeBin();
    status.claudeBin = bin;

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

// Codex status endpoint removed — strictly Claude only

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

// Codex generate endpoint removed — strictly Claude only

// --- gog (Google CLI) integration ---

function getGogBin(): string {
  const isWin = process.platform === 'win32';
  try {
    const cmd = isWin ? 'where' : 'which';
    const result = execFileSync(cmd, ['gog'], { encoding: 'utf-8' }).trim();
    const lines = result.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines[0]) return lines[0];
  } catch {}
  throw new Error('gog CLI not found. Install: pip install gog');
}

function runGog(args: string[], timeout = 30000): string {
  const bin = getGogBin();
  return execFileSync(bin, args, { encoding: 'utf-8', timeout, maxBuffer: 10 * 1024 * 1024 });
}

// Check gog status
app.get('/api/gog/status', (_req, res) => {
  try {
    const bin = getGogBin();
    // Quick test: list root with limit 1
    execFileSync(bin, ['drive', 'ls', '--parent', 'root', '-j', '--results-only'], { encoding: 'utf-8', timeout: 10000 });
    res.json({ connected: true, bin });
  } catch (err) {
    res.json({ connected: false, error: err instanceof Error ? err.message : 'gog not available' });
  }
});

// List folder contents
app.get('/api/gog/drive/ls', (req, res) => {
  const folderId = req.query.folderId as string;
  if (!folderId) return res.status(400).json({ error: 'folderId required' });
  try {
    const output = runGog(['drive', 'ls', '--parent', folderId, '-j', '--results-only', '--max', '100']);
    res.json(JSON.parse(output));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to list folder' });
  }
});

// Get file metadata
app.get('/api/gog/drive/get', (req, res) => {
  const fileId = req.query.fileId as string;
  if (!fileId) return res.status(400).json({ error: 'fileId required' });
  try {
    const output = runGog(['drive', 'get', fileId, '-j', '--results-only']);
    res.json(JSON.parse(output));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to get file' });
  }
});

// Export Google Doc as plain text
app.get('/api/gog/docs/export', (req, res) => {
  const docId = req.query.docId as string;
  if (!docId) return res.status(400).json({ error: 'docId required' });
  try {
    const tmpDir = mkdtempSync(join(tmpdir(), 'gog-'));
    const outPath = join(tmpDir, 'doc.txt');
    runGog(['docs', 'export', docId, '--format', 'txt', '--no-input', '--out', outPath], 60000);
    // gog may name the file differently, find it
    const files = readdirSync(tmpDir);
    const txtFile = files.find((f: string) => f.endsWith('.txt'));
    if (!txtFile) {
      rmSync(tmpDir, { recursive: true, force: true });
      return res.status(500).json({ error: 'Export produced no txt file' });
    }
    const text = readFileSync(join(tmpDir, txtFile), 'utf-8');
    rmSync(tmpDir, { recursive: true, force: true });
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(text);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to export doc' });
  }
});

// Download file as base64 data URL (for headshots)
app.get('/api/gog/drive/download', (req, res) => {
  const fileId = req.query.fileId as string;
  if (!fileId) return res.status(400).json({ error: 'fileId required' });
  try {
    const tmpDir = mkdtempSync(join(tmpdir(), 'gog-dl-'));
    runGog(['drive', 'download', fileId, '--no-input', '--out', tmpDir], 30000);
    const files = readdirSync(tmpDir);
    if (files.length === 0) {
      rmSync(tmpDir, { recursive: true, force: true });
      return res.status(500).json({ error: 'Download produced no file' });
    }
    const filePath = join(tmpDir, files[0]);
    const buffer = readFileSync(filePath);
    const ext = files[0].split('.').pop()?.toLowerCase() || 'png';
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : 'image/png';
    const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;
    rmSync(tmpDir, { recursive: true, force: true });
    res.json({ dataUrl, fileName: files[0] });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to download file' });
  }
});

// --- Full folder extraction: gog reads all docs + Claude AI extracts structured data ---

app.post('/api/gog/extract', async (req, res) => {
  const { folderId } = req.body;
  if (!folderId) return res.status(400).json({ error: 'folderId required' });

  try {

    // 0. Get the folder name (this often contains the full panel topic!)
    // Folder name pattern: "15th Jan - Veterinary Ownership & Leadership Panel – Leading Through Change: Practical Leadership for a Post-Pandemic Veterinary World"
    let folderName = '';
    let folderPanelName = '';
    let folderTopic = '';
    let folderSubtitle = '';
    try {
      const metaRaw = runGog(['drive', 'get', folderId, '-j', '--results-only'], 10000);
      const meta = JSON.parse(metaRaw);
      folderName = meta.name || '';
    } catch { /* skip */ }

    // Parse folder name: "Date - Panel Name – Topic: Subtitle" or "Date - Panel Name - Topic: Subtitle"
    if (folderName) {
      // Strip leading date: "15th Jan - ", "March 23 - ", "Feb 25 - ", "22nd Jan- ", "4th Feb - "
      const withoutDate = folderName.replace(/^\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*[-–—]\s*/i, '')
        .replace(/^(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?\s*[-–—]\s*/i, '');

      // Split on " – " or " - " (the dash between panel name and topic)
      // Pattern: "Panel Name – Topic: Subtitle" or "Panel Name – Topic"
      const dashParts = withoutDate.split(/\s*[–—]\s*/);
      if (dashParts.length >= 2) {
        folderPanelName = dashParts[0].trim();
        const topicFull = dashParts.slice(1).join(' – ').trim();
        // Split topic on ":" for subtitle
        if (topicFull.includes(':')) {
          folderTopic = topicFull.split(':')[0].trim();
          folderSubtitle = topicFull.split(':').slice(1).join(':').trim();
        } else {
          folderTopic = topicFull;
        }
      } else {
        // No dash separator — try just colon
        if (withoutDate.includes(':')) {
          folderTopic = withoutDate.split(':')[0].trim();
          folderSubtitle = withoutDate.split(':').slice(1).join(':').trim();
        } else {
          folderTopic = withoutDate;
        }
      }
      console.log('[gog extract] Parsed folder name → panelName:', folderPanelName, '| topic:', folderTopic, '| subtitle:', folderSubtitle);
    }

    // 1. List all files in the folder
    const filesRaw = runGog(['drive', 'ls', '--parent', folderId, '-j', '--results-only', '--max', '100'], 20000);
    const files = JSON.parse(filesRaw) as Array<{ id: string; name: string; mimeType: string }>;

    // 2. Find Google Docs and export them as text
    const docMime = 'application/vnd.google-apps.document';
    const docs = files.filter(f => f.mimeType === docMime);
    let allDocText = '';

    for (const doc of docs) {
      try {
        const tmpDir = mkdtempSync(join(tmpdir(), 'gog-doc-'));
        const outPath = join(tmpDir, 'doc.txt');
        runGog(['docs', 'export', doc.id, '--format', 'txt', '--no-input', '--out', outPath], 60000);
        const exportedFiles = readdirSync(tmpDir);
        const txtFile = exportedFiles.find((f: string) => f.endsWith('.txt'));
        if (txtFile) {
          const text = readFileSync(join(tmpDir, txtFile), 'utf-8');
          allDocText += `\n\n=== DOCUMENT: ${doc.name} ===\n${text}`;
        }
        rmSync(tmpDir, { recursive: true, force: true });
      } catch {
        // skip unreadable docs
      }
    }

    // 3. Also check subfolders for headshots
    const folderMime = 'application/vnd.google-apps.folder';
    const subfolders = files.filter(f => f.mimeType === folderMime);
    let headshotFolderId = '';
    for (const sf of subfolders) {
      if (/headshot|photo|image|picture|portrait/i.test(sf.name)) {
        headshotFolderId = sf.id;
        break;
      }
    }

    // 4. List image files (from headshot folder or root)
    let imageFiles: Array<{ id: string; name: string; mimeType: string }> = [];
    if (headshotFolderId) {
      try {
        const hfRaw = runGog(['drive', 'ls', '--parent', headshotFolderId, '-j', '--results-only', '--max', '100'], 15000);
        const hfFiles = JSON.parse(hfRaw) as Array<{ id: string; name: string; mimeType: string }>;
        imageFiles = hfFiles.filter(f => f.mimeType.startsWith('image/'));
      } catch { /* skip */ }
    }
    if (imageFiles.length === 0) {
      imageFiles = files.filter(f => f.mimeType.startsWith('image/'));
    }

    // 5. Use Claude AI to extract all banner data from the combined doc text
    const aiPrompt = `You are extracting ALL information needed to generate event promotional banners from Google Drive documents.

IMPORTANT — The Google Drive FOLDER NAME is: "${folderName}"
The folder name typically contains the FULL panel topic including both the main title and subtitle. For example:
- "Leading Through Change Practical Leadership for a Post-Pandemic Veterinary World" → panelTopic: "Leading Through Change", panelSubtitle: "Practical Leadership for a Post-Pandemic Veterinary World"
- "Rebuilding the Law Firm for the AI Era" → panelTopic: "Rebuilding the Law Firm for the AI Era", panelSubtitle: ""

Here is the content of ALL documents found in the event folder:
---
${allDocText.slice(0, 50000)}
---

File names in the folder: ${files.map(f => f.name).join(', ')}
Image files available: ${imageFiles.map(f => f.name).join(', ')}

Extract the following as a JSON object. Be thorough — search ALL documents, tabs, sections, tables, and bios:

{
  "panelName": "The panel/event series name (e.g. 'Veterinary Ownership & Leadership Panel', 'Thriving Dentist Annual Expert Panel')",
  "panelTopic": "The MAIN topic/title (short, e.g. 'Leading Through Change'). Do NOT include promotional CTA text.",
  "panelSubtitle": "The descriptive subtitle or tagline that expands on the topic (e.g. 'Practical Leadership for a Post-Pandemic Veterinary World'). This is the longer description that goes below the main title. Look for it in document headings, quoted text, landing page copy, or promotional materials. If none found, leave empty string.",
  "eventDate": "Full date string (e.g. 'WEDNESDAY, JANUARY 15, 2025')",
  "eventTime": "Time with timezone (e.g. '8:00 PM – 9:00 PM EST')",
  "websiteUrl": "Website URL if found",
  "zoomRegistrationUrl": "Zoom registration URL if found",
  "headerText": "Header text for the banner (e.g. 'Veterinary Business Institute Expert Panel')",
  "panelists": [
    {
      "name": "Full name with credentials EXACTLY as written in the document — do NOT add Dr. prefix unless the document explicitly has it (e.g. 'Amelia Knight Pinkston, VMD', 'Bob Murtaugh, DVM, MS, DACVIM')",
      "firstName": "First name only without Dr.",
      "title": "Job title/role (e.g. 'Director', 'Founder & CEO', 'Practice Owner'). This is their ROLE, not credentials.",
      "org": "Organization/company/practice name (e.g. 'Unleashed Coaching and Consulting')",
      "email": "Email if found",
      "phone": "Phone if found",
      "headshotMatch": "Best matching image filename from the available images (e.g. 'jessica_moore_jones.jpg')"
    }
  ]
}

CRITICAL RULES:
1. THE FOLDER NAME IS YOUR BEST SOURCE FOR THE TOPIC. Parse the folder name "${folderName}" to extract BOTH panelTopic (short main title) and panelSubtitle (longer descriptive tagline). The folder name usually concatenates them. For example "Leading Through Change Practical Leadership for a Post-Pandemic Veterinary World" should give panelTopic="Leading Through Change" and panelSubtitle="Practical Leadership for a Post-Pandemic Veterinary World". Also cross-reference with document headings, quoted text, "Topic:" labels to confirm.
2. Every panelist MUST have title and org. Search bios, tables, Partner Details, Promotional Materials, all documents.
3. Match each panelist to their most likely headshot image by comparing names to filenames.
4. Do NOT include CTA/marketing text in panelTopic (no "Join us", "Save your seat", "Free live panel", "Register now").
5. Look through ALL documents — information may be spread across Partner Details, Promotional Materials, and other docs.

Respond with ONLY the JSON object, no other text.`;

    let aiResult = '';
    let aiProvider = 'claude';
    try {
      aiResult = await generateWithLocalProvider('claude', aiPrompt, 'claude-sonnet-4-20250514');
      console.log('[gog extract] AI provider used: Claude');
    } catch (claudeErr) {
      console.warn('[gog extract] Claude failed:', claudeErr instanceof Error ? claudeErr.message : claudeErr);
      try {
        aiResult = await generateWithLocalProvider('codex', aiPrompt, 'gpt-5.4');
        aiProvider = 'codex';
        console.log('[gog extract] AI provider used: Codex (fallback)');
      } catch (aiErr) {
        return res.json({
          success: false,
          rawDocText: allDocText.slice(0, 100000),
          files: files.map(f => ({ id: f.id, name: f.name, mimeType: f.mimeType })),
          imageFiles: imageFiles.map(f => ({ id: f.id, name: f.name, mimeType: f.mimeType })),
          error: aiErr instanceof Error ? aiErr.message : 'AI extraction failed',
          fallbackError: claudeErr instanceof Error ? claudeErr.message : 'Claude extraction failed',
        });
      }
    }

    // Parse AI response
    const jsonMatch = aiResult.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.json({
        success: false,
        rawDocText: allDocText.slice(0, 100000),
        files: files.map(f => ({ id: f.id, name: f.name, mimeType: f.mimeType })),
        imageFiles: imageFiles.map(f => ({ id: f.id, name: f.name, mimeType: f.mimeType })),
        error: 'Could not parse AI response',
      });
    }

    let extracted = JSON.parse(jsonMatch[0]);

    // Zod validation — coerce missing fields to defaults
    try {
      const { z } = await import('zod');
      const ParsedPanelistSchema = z.object({
        name: z.string().default(''),
        firstName: z.string().default(''),
        title: z.string().default(''),
        org: z.string().default(''),
        email: z.string().default(''),
        phone: z.string().default(''),
        headshotMatch: z.string().optional(),
        headshotUrl: z.string().optional(),
      });
      const ExtractSchema = z.object({
        panelName: z.string().default(''),
        panelTopic: z.string().default(''),
        panelSubtitle: z.string().default(''),
        eventDate: z.string().default(''),
        eventTime: z.string().default(''),
        websiteUrl: z.string().default(''),
        zoomRegistrationUrl: z.string().default(''),
        headerText: z.string().default(''),
        panelists: z.array(ParsedPanelistSchema).default([]),
      });
      const validated = ExtractSchema.safeParse(extracted);
      if (validated.success) {
        extracted = validated.data;
      } else {
        console.warn('[gog extract] Zod validation warnings:', validated.error.issues.map(i => `${i.path.join('.')}: ${i.message}`));
      }
    } catch { /* zod not available, skip validation */ }

    console.log('[gog extract] AI → topic:', extracted.panelTopic, '| subtitle:', extracted.panelSubtitle);
    console.log('[gog extract] Folder → topic:', folderTopic, '| subtitle:', folderSubtitle);
    console.log('[gog extract] Panelists:', JSON.stringify((extracted.panelists || []).map((p: any) => ({ name: p.name, title: p.title, org: p.org }))));

    // Use folder-parsed values as fallback if AI missed them
    if (!extracted.panelTopic && folderTopic) extracted.panelTopic = folderTopic;
    if (!extracted.panelSubtitle && folderSubtitle) extracted.panelSubtitle = folderSubtitle;
    if (!extracted.panelName && folderPanelName) extracted.panelName = folderPanelName;
    // If AI returned topic but no subtitle, and folder has subtitle, use folder's
    if (extracted.panelTopic && !extracted.panelSubtitle && folderSubtitle) {
      extracted.panelSubtitle = folderSubtitle;
    }

    // 6. Download headshots and match to panelists
    const headshotDataUrls: Record<string, string> = {};
    for (const panelist of extracted.panelists || []) {
      const matchName = (panelist.headshotMatch || '').toLowerCase();
      const matchedImage = imageFiles.find(f => f.name.toLowerCase() === matchName)
        || imageFiles.find(f => f.name.toLowerCase().includes(matchName.split('.')[0]))
        || imageFiles.find(f => {
          const lastName = (panelist.name || '').split(/[\s,]+/).filter((w: string) => w.length > 2 && !/^(dr|dvm|dds|jd|md|phd|mba|cpa)$/i.test(w)).pop()?.toLowerCase() || '';
          return lastName.length > 2 && f.name.toLowerCase().includes(lastName);
        });

      if (matchedImage && !headshotDataUrls[matchedImage.id]) {
        try {
          const tmpDir = mkdtempSync(join(tmpdir(), 'gog-hs-'));
          runGog(['drive', 'download', matchedImage.id, '--no-input', '--out', tmpDir], 30000);
          const dlFiles = readdirSync(tmpDir);
          if (dlFiles.length > 0) {
            const buffer = readFileSync(join(tmpDir, dlFiles[0]));
            const ext = dlFiles[0].split('.').pop()?.toLowerCase() || 'png';
            const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : 'image/png';
            headshotDataUrls[matchedImage.id] = `data:${mime};base64,${buffer.toString('base64')}`;
          }
          rmSync(tmpDir, { recursive: true, force: true });
        } catch { /* skip */ }
      }

      if (matchedImage && headshotDataUrls[matchedImage.id]) {
        panelist.headshotUrl = headshotDataUrls[matchedImage.id];
      }
    }

    res.json({ success: true, folderName, ...extracted });

  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Extraction failed' });
  }
});

// ——————————————————————————————————————
// POST /api/ai/generate-sdk — Anthropic SDK (API key from client)
// ——————————————————————————————————————
app.post('/api/ai/generate-sdk', async (req, res) => {
  const { apiKey, model, messages, max_tokens } = req.body;
  if (!apiKey) return res.status(400).json({ error: 'apiKey required' });
  if (!messages) return res.status(400).json({ error: 'messages required' });

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: model || 'claude-sonnet-4-20250514',
      max_tokens: max_tokens || 4096,
      messages,
    });

    res.json(response);
  } catch (err: any) {
    const status = err?.status || 500;
    const message = err?.message || 'Anthropic SDK error';
    res.status(status).json({ error: { message } });
  }
});

// ——————————————————————————————————————
// POST /api/render-batch — Batch HTML → PNG rendering
// ——————————————————————————————————————
app.post('/api/render-batch', async (req, res) => {
  try {
    const { htmlList } = req.body;
    if (!Array.isArray(htmlList) || htmlList.length === 0) {
      return res.status(400).json({ error: 'htmlList array required' });
    }

    const browser = await getBrowser();
    const images: string[] = [];

    // Render in parallel (max 4 at a time)
    const concurrency = 4;
    for (let i = 0; i < htmlList.length; i += concurrency) {
      const batch = htmlList.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(async (html: string) => {
          const page = await browser.newPage();
          await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
          await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
          await page.evaluate(() =>
            Promise.all(
              Array.from(document.querySelectorAll('img')).map((img) =>
                img.complete ? Promise.resolve() : new Promise((r) => { img.onload = r; img.onerror = r; })
              )
            )
          );
          await new Promise((r) => setTimeout(r, 300));
          const buffer = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1080, height: 1080 } });
          await page.close();
          return Buffer.isBuffer(buffer) ? buffer.toString('base64') : Buffer.from(buffer).toString('base64');
        })
      );
      images.push(...batchResults);
    }

    res.json({ images });
  } catch (err) {
    console.error('render-batch error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Batch render failed' });
  }
});

// ——————————————————————————————————————
// GET /api/email-templates — Serve email HTML from disk
// ——————————————————————————————————————
app.get('/api/email-templates', (_req, res) => {
  try {
    const templatesDir = resolve(__dirname, '..', 'PANEL EMAIL TEMPLATES');
    if (!existsSync(templatesDir)) {
      return res.json({ templates: {} });
    }

    const files = readdirSync(templatesDir).filter((f: string) => f.endsWith('.html'));
    const templates: Record<string, string> = {};

    for (const file of files) {
      const content = readFileSync(join(templatesDir, file), 'utf-8');
      // Use filename (without .html) as key
      const key = file.replace(/\.html$/i, '');
      templates[key] = content;
    }

    res.json({ templates });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load templates' });
  }
});

export { app };
export const AI_SERVER_PORT = 3002;
