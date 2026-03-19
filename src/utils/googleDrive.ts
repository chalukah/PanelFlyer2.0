/**
 * Google Drive API integration for auto-importing event folder data.
 * Uses Google Identity Services (GIS) for OAuth and gapi for API calls.
 */

const CLIENT_ID = '480513141175-1l3o1oaaubm3b0glg0c6ddtpcmifcuj7.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/documents';

// Types for gapi / GIS (minimal declarations so TS is happy)
declare const gapi: {
  load: (api: string, cb: () => void) => void;
  client: {
    init: (opts: Record<string, unknown>) => Promise<void>;
    request: (opts: { path: string; params?: Record<string, string> }) => Promise<{ result: unknown }>;
  };
};

declare const google: {
  accounts: {
    oauth2: {
      initTokenClient: (opts: {
        client_id: string;
        scope: string;
        callback: (resp: { access_token?: string; error?: string }) => void;
      }) => { requestAccessToken: () => void };
    };
  };
};

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
};

let accessToken: string | null = (() => {
  try {
    const stored = localStorage.getItem('gd_access_token');
    const expiry = localStorage.getItem('gd_token_expiry');
    if (stored && expiry && Date.now() < parseInt(expiry)) return stored;
  } catch { /* ignore */ }
  return null;
})();
let gapiInited = false;
let tokenClient: ReturnType<typeof google.accounts.oauth2.initTokenClient> | null = null;

// ---------- init ----------

function waitForScript(check: () => boolean, timeout = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (check()) return resolve();
    const start = Date.now();
    const iv = setInterval(() => {
      if (check()) { clearInterval(iv); resolve(); }
      else if (Date.now() - start > timeout) { clearInterval(iv); reject(new Error('Script load timeout')); }
    }, 100);
  });
}

export async function initGoogleAuth(): Promise<void> {
  // Wait for gapi script to load
  await waitForScript(() => typeof gapi !== 'undefined');

  // Load gapi client
  await new Promise<void>((resolve) => gapi.load('client', resolve));
  await gapi.client.init({});
  gapiInited = true;

  // Wait for GIS script
  await waitForScript(() => typeof google !== 'undefined' && !!google?.accounts?.oauth2);

  // Create token client
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: () => {}, // overridden in signIn
  });
}

// ---------- auth ----------

export async function signIn(): Promise<string> {
  if (!gapiInited || !tokenClient) await initGoogleAuth();

  return new Promise((resolve, reject) => {
    tokenClient!.requestAccessToken();
    // GIS calls the callback we set on initTokenClient, but we need to override it per-call
    // The trick: re-create with a fresh callback
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp) => {
        if (resp.error) return reject(new Error(resp.error));
        accessToken = resp.access_token ?? null;
        if (accessToken) {
          try {
            localStorage.setItem('gd_access_token', accessToken);
            // Google tokens typically expire in 1 hour (3600 seconds)
            localStorage.setItem('gd_token_expiry', String(Date.now() + 3600 * 1000));
          } catch { /* ignore */ }
          resolve(accessToken);
        } else reject(new Error('No access token'));
      },
    });
    tokenClient.requestAccessToken();
  });
}

export function isSignedIn(): boolean {
  return !!accessToken;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearStoredToken(): void {
  accessToken = null;
  try {
    localStorage.removeItem('gd_access_token');
    localStorage.removeItem('gd_token_expiry');
  } catch { /* ignore */ }
}

// ---------- Drive helpers ----------

// Auto-refresh: silently request a new token and update stored state
async function refreshToken(): Promise<boolean> {
  if (!tokenClient) return false;
  return new Promise((resolve) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp) => {
        if (resp.error || !resp.access_token) { resolve(false); return; }
        accessToken = resp.access_token;
        try {
          localStorage.setItem('gd_access_token', accessToken);
          localStorage.setItem('gd_token_expiry', String(Date.now() + 3600 * 1000));
        } catch { /* ignore */ }
        resolve(true);
      },
    });
    tokenClient!.requestAccessToken();
  });
}

function isAuthError(err: unknown): boolean {
  const e = err as { result?: { error?: { code?: number } }; status?: number; message?: string };
  if (e?.status === 401 || e?.status === 403) return true;
  if (e?.result?.error?.code === 401 || e?.result?.error?.code === 403) return true;
  if (typeof e?.message === 'string' && e.message.includes('GOOGLE_AUTH_EXPIRED')) return true;
  return false;
}

// Wrapper that detects 401/403 and auto-refreshes token once before failing
async function gapiRequest(opts: { path: string; params?: Record<string, string> }): Promise<{ result: unknown }> {
  const attempt = async () => {
    try {
      const resp = await gapi.client.request(opts);
      const r = resp.result as { error?: { code?: number; message?: string } };
      if (r?.error?.code === 401 || r?.error?.code === 403) {
        throw { status: r.error.code, result: resp.result };
      }
      return resp;
    } catch (err) {
      if (isAuthError(err)) throw Object.assign(new Error('AUTH_EXPIRED'), { original: err });
      throw err;
    }
  };

  try {
    return await attempt();
  } catch (err) {
    if (err instanceof Error && err.message === 'AUTH_EXPIRED') {
      // Try to auto-refresh token
      const refreshed = await refreshToken();
      if (refreshed) {
        return await attempt();
      }
      clearStoredToken();
      throw new Error('GOOGLE_AUTH_EXPIRED');
    }
    throw err;
  }
}

export async function listFolderContents(folderId: string): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params: Record<string, string> = {
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, parents)',
      pageSize: '100',
    };
    if (pageToken) params.pageToken = pageToken;

    const resp = await gapiRequest({ path: 'https://www.googleapis.com/drive/v3/files', params });
    const data = resp.result as { files?: DriveFile[]; nextPageToken?: string };
    if (data.files) files.push(...data.files);
    pageToken = data.nextPageToken;
  } while (pageToken);

  return files;
}

export async function readGoogleDoc(docId: string): Promise<string> {
  // Request with includeTabsContent=true to get ALL tabs (panelist tabs)
  const resp = await gapiRequest({
    path: `https://docs.googleapis.com/v1/documents/${docId}`,
    params: { includeTabsContent: 'true' },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = resp.result as any;
  let text = '';

  // Recursively extract text from all structural elements (paragraphs, tables, etc.)
  function extractFromElements(elements: any[]): void {
    if (!elements) return;
    for (const block of elements) {
      // Regular paragraph
      if (block.paragraph) {
        for (const el of block.paragraph.elements ?? []) {
          if (el.textRun?.content) text += el.textRun.content;
        }
      }
      // Table — iterate rows → cells → content (which contains paragraphs)
      if (block.table) {
        for (const row of block.table.tableRows ?? []) {
          const cellTexts: string[] = [];
          for (const cell of row.tableCells ?? []) {
            let cellText = '';
            for (const cellBlock of cell.content ?? []) {
              if (cellBlock.paragraph) {
                for (const el of cellBlock.paragraph.elements ?? []) {
                  if (el.textRun?.content) cellText += el.textRun.content.trim();
                }
              }
            }
            cellTexts.push(cellText);
          }
          // Join cells with " | " separator so table structure is readable
          text += cellTexts.join(' | ') + '\n';
        }
      }
      // Table of contents or other nested structures
      if (block.tableOfContents?.content) {
        extractFromElements(block.tableOfContents.content);
      }
    }
  }

  // Extract content from ALL tabs (Google Docs tabs feature)
  // Each tab has: tab.documentTab.body.content and optionally child tabs
  function extractFromTab(tab: any): void {
    const tabTitle = tab.tabProperties?.title;
    if (tabTitle) {
      text += `\n\n--- TAB: ${tabTitle} ---\n`;
    }
    const body = tab.documentTab?.body;
    if (body?.content) {
      extractFromElements(body.content);
    }
    // Recurse into child tabs
    for (const child of tab.childTabs ?? []) {
      extractFromTab(child);
    }
  }

  if (doc.tabs && doc.tabs.length > 0) {
    // New tabs-aware API response — read ALL tabs
    for (const tab of doc.tabs) {
      extractFromTab(tab);
    }
  } else {
    // Fallback: legacy response without tabs (or single-tab doc)
    extractFromElements(doc.body?.content ?? []);
  }

  return text;
}

export async function getFileAsDataUrl(fileId: string): Promise<string> {
  const doFetch = async () => {
    const token = accessToken;
    if (!token) throw new Error('Not signed in');
    const resp = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (resp.status === 401 || resp.status === 403) throw new Error('AUTH_EXPIRED');
    if (!resp.ok) throw new Error(`Failed to download file: ${resp.status}`);
    const blob = await resp.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read blob'));
      reader.readAsDataURL(blob);
    });
  };

  try {
    return await doFetch();
  } catch (err) {
    if (err instanceof Error && err.message === 'AUTH_EXPIRED') {
      const refreshed = await refreshToken();
      if (refreshed) return await doFetch();
      clearStoredToken();
      throw new Error('GOOGLE_AUTH_EXPIRED');
    }
    throw err;
  }
}

export function extractFolderIdFromUrl(url: string): string | null {
  // https://drive.google.com/drive/folders/FOLDER_ID
  // https://drive.google.com/drive/u/0/folders/FOLDER_ID
  // https://drive.google.com/drive/folders/FOLDER_ID?resourcekey=...
  const patterns = [
    /\/folders\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /^([a-zA-Z0-9_-]{20,})$/, // raw folder ID
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}
