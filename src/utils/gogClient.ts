/**
 * Client for the server-side gog (Google CLI) integration.
 * Falls back gracefully if gog is not available.
 */

export type GogDriveFile = {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
};

let gogAvailable: boolean | null = null;

/** Check if gog CLI is available on the server */
export async function checkGogStatus(): Promise<boolean> {
  if (gogAvailable !== null) return gogAvailable;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const resp = await fetch('/api/gog/status', { signal: controller.signal });
    clearTimeout(timer);
    if (!resp.ok) { gogAvailable = false; return false; }
    const data = await resp.json();
    gogAvailable = data.connected === true;
    return gogAvailable;
  } catch {
    gogAvailable = false;
    return false;
  }
}

/** List folder contents via gog */
export async function gogListFolder(folderId: string): Promise<GogDriveFile[]> {
  const resp = await fetch(`/api/gog/drive/ls?folderId=${encodeURIComponent(folderId)}`);
  if (!resp.ok) throw new Error(`gog list failed: ${resp.status}`);
  const data = await resp.json();
  // gog returns array of file objects — normalize to our DriveFile shape
  return (Array.isArray(data) ? data : []).map((f: any) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    parents: f.parents,
  }));
}

/** Export a Google Doc as plain text via gog */
export async function gogExportDoc(docId: string): Promise<string> {
  const resp = await fetch(`/api/gog/docs/export?docId=${encodeURIComponent(docId)}`);
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `gog export failed: ${resp.status}`);
  }
  return resp.text();
}

/** Download a file as base64 data URL via gog */
export async function gogDownloadFile(fileId: string): Promise<{ dataUrl: string; fileName: string }> {
  const resp = await fetch(`/api/gog/drive/download?fileId=${encodeURIComponent(fileId)}`);
  if (!resp.ok) throw new Error(`gog download failed: ${resp.status}`);
  return resp.json();
}

/** Full extraction result from gog + AI */
export type GogExtractResult = {
  success: boolean;
  panelName?: string;
  panelTopic?: string;
  panelSubtitle?: string;
  eventDate?: string;
  eventTime?: string;
  websiteUrl?: string;
  zoomRegistrationUrl?: string;
  headerText?: string;
  panelists?: Array<{
    name: string;
    firstName: string;
    title: string;
    org: string;
    email?: string;
    phone?: string;
    headshotUrl?: string;
    headshotMatch?: string;
  }>;
  error?: string;
};

/** Full folder extraction: gog reads all docs + Claude AI extracts structured banner data */
export async function gogExtractFolder(folderId: string): Promise<GogExtractResult> {
  const resp = await fetch('/api/gog/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderId }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `gog extract failed: ${resp.status}`);
  }
  return resp.json();
}
