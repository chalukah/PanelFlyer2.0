/**
 * Google Drive API integration for auto-importing event folder data.
 * Uses Google Identity Services (GIS) for OAuth and gapi for API calls.
 */

const CLIENT_ID = '480513141175-1l3o1oaaubm3b0glg0c6ddtpcmifcuj7.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/documents.readonly';

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

let accessToken: string | null = null;
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
        if (accessToken) resolve(accessToken);
        else reject(new Error('No access token'));
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

// ---------- Drive helpers ----------

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

    const resp = await gapi.client.request({ path: 'https://www.googleapis.com/drive/v3/files', params });
    const data = resp.result as { files?: DriveFile[]; nextPageToken?: string };
    if (data.files) files.push(...data.files);
    pageToken = data.nextPageToken;
  } while (pageToken);

  return files;
}

export async function readGoogleDoc(docId: string): Promise<string> {
  const resp = await gapi.client.request({
    path: `https://docs.googleapis.com/v1/documents/${docId}`,
  });
  const doc = resp.result as { body?: { content?: Array<{ paragraph?: { elements?: Array<{ textRun?: { content?: string } }> } }> } };
  let text = '';
  for (const block of doc.body?.content ?? []) {
    for (const el of block.paragraph?.elements ?? []) {
      if (el.textRun?.content) text += el.textRun.content;
    }
  }
  return text;
}

export async function getFileAsDataUrl(fileId: string): Promise<string> {
  const token = accessToken;
  if (!token) throw new Error('Not signed in');

  const resp = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!resp.ok) throw new Error(`Failed to download file: ${resp.status}`);
  const blob = await resp.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
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
