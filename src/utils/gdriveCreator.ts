/**
 * Google Drive / Docs / Sheets write utilities for VET event folder creation.
 * Uses the existing access token from googleDrive.ts.
 */

import { getAccessToken, listFolderContents, DriveFile } from './googleDrive';
import {
  EventInfo,
  PanelistInfo,
  SheetData,
  generateZoomLandingTab,
  generatePanelistTab,
  generateCalendarNotesSheet,
  generateShortLinksSheet,
  generatePromoMaterialsContent,
  generateEmailDraftsContent,
  generateZoomChatDMs,
  generateReshanisPosting,
} from './eventContentTemplates';

// ─── Low-level API helpers ─────────────────────────────────────────────────

async function drivePost(path: string, body: unknown): Promise<unknown> {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');
  const resp = await fetch(`https://www.googleapis.com/drive/v3${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Drive API error ${resp.status}: ${text}`);
  }
  return resp.json();
}

async function drivePatch(path: string, body: unknown): Promise<unknown> {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');
  const resp = await fetch(`https://www.googleapis.com/drive/v3${path}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Drive API error ${resp.status}: ${text}`);
  }
  return resp.json();
}

async function docsPost(path: string, body: unknown): Promise<unknown> {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');
  const resp = await fetch(`https://docs.googleapis.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Docs API error ${resp.status}: ${text}`);
  }
  return resp.json();
}

async function sheetsPost(path: string, body: unknown): Promise<unknown> {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');
  const resp = await fetch(`https://sheets.googleapis.com/v4${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Sheets API error ${resp.status}: ${text}`);
  }
  return resp.json();
}

async function sheetsPut(path: string, body: unknown): Promise<unknown> {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');
  const resp = await fetch(`https://sheets.googleapis.com/v4${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Sheets API error ${resp.status}: ${text}`);
  }
  return resp.json();
}

// ─── Create / update file helpers ─────────────────────────────────────────

export async function createFolder(name: string, parentId: string): Promise<string> {
  const result = await drivePost('/files', {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId],
  }) as { id: string };
  return result.id;
}

export async function createGoogleDoc(name: string, parentId: string): Promise<string> {
  const result = await drivePost('/files', {
    name,
    mimeType: 'application/vnd.google-apps.document',
    parents: [parentId],
  }) as { id: string };
  return result.id;
}

export async function createGoogleSheet(name: string, parentId: string): Promise<string> {
  const result = await drivePost('/files', {
    name,
    mimeType: 'application/vnd.google-apps.spreadsheet',
    parents: [parentId],
  }) as { id: string };
  return result.id;
}

export async function renameFile(fileId: string, newName: string): Promise<void> {
  await drivePatch(`/files/${fileId}`, { name: newName });
}

// ─── Write content to existing Google Doc ─────────────────────────────────

/**
 * Writes content to a Google Doc by replacing all content.
 * Fetches the doc first to get the current end index, then deletes and rewrites.
 */
export async function writeDocContent(docId: string, content: string): Promise<void> {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');

  // Get doc to find existing content length (use first/default tab)
  const getResp = await fetch(
    `https://docs.googleapis.com/v1/documents/${docId}?includeTabsContent=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!getResp.ok) throw new Error(`Failed to get doc: ${getResp.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await getResp.json() as any;

  // Get the first tab's body (or fall back to legacy body)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let bodyContent: any[] = [];
  let tabId: string | undefined;
  if (doc.tabs && doc.tabs.length > 0) {
    const firstTab = doc.tabs[0];
    tabId = firstTab.tabProperties?.tabId;
    bodyContent = firstTab.documentTab?.body?.content ?? [];
  } else {
    bodyContent = doc.body?.content ?? [];
  }

  const endIndex = bodyContent.length > 0
    ? (bodyContent[bodyContent.length - 1]?.endIndex ?? 1) - 1
    : 1;

  const requests: unknown[] = [];

  if (endIndex > 1) {
    requests.push({
      deleteContentRange: {
        range: {
          startIndex: 1,
          endIndex,
          ...(tabId ? { tabId } : {}),
        },
      },
    });
  }

  if (content.trim()) {
    requests.push({
      insertText: {
        location: {
          index: 1,
          ...(tabId ? { tabId } : {}),
        },
        text: content,
      },
    });
  }

  if (requests.length === 0) return;
  await docsPost(`/documents/${docId}:batchUpdate`, { requests });
}

/**
 * Writes multi-section content to a Google Doc.
 * Since the Docs REST API does NOT support createTab, we write all sections
 * into the first tab with clear visual separators between sections.
 * Format: ═══ SECTION: {title} ═══ followed by content.
 */
export async function writeMultiTabDoc(
  docId: string,
  tabs: { title: string; content: string }[],
): Promise<void> {
  // Flatten all tabs into a single document with clear section headers
  const combined = tabs
    .filter(t => t.content.trim() || t.title)
    .map(t => {
      const header = `${'═'.repeat(60)}\nSECTION: ${t.title}\n${'═'.repeat(60)}`;
      return t.content.trim() ? `${header}\n\n${t.content}` : header;
    })
    .join('\n\n\n');

  await writeDocContent(docId, combined);
}

// ─── Write content to existing Google Sheet ───────────────────────────────

export async function writeSheetContent(sheetId: string, sheetData: SheetData[]): Promise<void> {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');

  // Get existing sheet metadata
  const getResp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!getResp.ok) throw new Error(`Failed to get sheet: ${getResp.status}`);
  const spreadsheet = await getResp.json() as {
    sheets: { properties: { sheetId: number; title: string } }[];
  };

  const existingSheets = spreadsheet.sheets.map(s => s.properties);

  // Create missing sheets
  const batchRequests: unknown[] = [];
  for (let i = 0; i < sheetData.length; i++) {
    const { tabName } = sheetData[i];
    const exists = existingSheets.find(s => s.title === tabName);
    if (!exists) {
      batchRequests.push({
        addSheet: {
          properties: { title: tabName, index: i },
        },
      });
    }
  }

  if (batchRequests.length > 0) {
    await sheetsPost(`/spreadsheets/${sheetId}:batchUpdate`, { requests: batchRequests });
  }

  // Write data to each tab
  for (const { tabName, rows } of sheetData) {
    if (rows.length === 0) continue;
    const range = `${tabName}!A1`;
    const values = rows.map(row => row.map(cell => cell === null ? '' : cell));
    await sheetsPut(
      `/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
      { range, majorDimension: 'ROWS', values },
    );
  }
}

// ─── Gap analysis ──────────────────────────────────────────────────────────

export interface ExpectedItem {
  name: string;
  type: 'folder' | 'doc' | 'sheet' | 'slides' | 'image';
  key: string; // logical key for gap analysis
}

export interface FolderScanResult {
  existing: DriveFile[];
  present: Set<string>; // keys of items found
  missing: ExpectedItem[];
}

function getExpectedItems(event: EventInfo, panelists: PanelistInfo[]): ExpectedItem[] {
  const items: ExpectedItem[] = [
    // Subfolders
    { name: 'Banner QR Codes', type: 'folder', key: 'folder_banner_qr' },
    { name: 'Panelist Headshots', type: 'folder', key: 'folder_headshots' },
    { name: 'Partner Logos', type: 'folder', key: 'folder_logos' },
    { name: 'Promo Banners', type: 'folder', key: 'folder_promo_banners' },
    { name: 'Reshani', type: 'folder', key: 'folder_reshani' },
    // Fixed docs
    { name: 'Partner Details/Zoom Landing Page Details', type: 'doc', key: 'doc_partner_details' },
    { name: 'Email Drafts', type: 'doc', key: 'doc_email_drafts' },
    { name: 'Promotional Materials', type: 'doc', key: 'doc_promo_materials' },
    { name: 'Zoom Chat DMs', type: 'doc', key: 'doc_zoom_chat' },
    { name: 'Reshanis Posting', type: 'doc', key: 'doc_reshani_posting' },
    // Fixed sheets
    { name: `Calendar Notes - ${event.panelName}`, type: 'sheet', key: 'sheet_calendar_notes' },
  ];

  // Per-panelist items
  for (const p of panelists) {
    items.push({ name: `${p.name} - Promotional Materials`, type: 'doc', key: `doc_promo_${p.name}` });
    items.push({ name: `${p.name} Short Links`, type: 'sheet', key: `sheet_links_${p.name}` });
  }

  return items;
}

function matchesItem(file: DriveFile, item: ExpectedItem): boolean {
  const fn = file.name.toLowerCase();
  const name = item.name.toLowerCase();

  // Exact match
  if (fn === name) return true;

  // Key-based fuzzy matching for common patterns
  if (item.key === 'doc_partner_details' && fn.includes('partner details')) return true;
  if (item.key === 'doc_email_drafts' && fn === 'email drafts') return true;
  if (item.key === 'doc_promo_materials' && fn === 'promotional materials') return true;
  if (item.key === 'doc_zoom_chat' && fn.includes('zoom chat')) return true;
  if (item.key === 'doc_reshani_posting' && fn.includes('reshani')) return true;
  if (item.key === 'sheet_calendar_notes' && fn.includes('calendar notes')) return true;
  if (item.key === 'folder_banner_qr' && fn.includes('banner qr')) return true;
  if (item.key === 'folder_headshots' && fn.includes('headshot')) return true;
  if (item.key === 'folder_logos' && fn.includes('partner logo')) return true;
  if (item.key === 'folder_promo_banners' && fn.includes('promo banner')) return true;
  if (item.key === 'folder_reshani' && fn === 'reshani') return true;

  return false;
}

export async function scanFolder(
  folderId: string,
  event: EventInfo,
  panelists: PanelistInfo[],
): Promise<FolderScanResult> {
  const existing = await listFolderContents(folderId);
  const expected = getExpectedItems(event, panelists);
  const present = new Set<string>();

  for (const file of existing) {
    for (const item of expected) {
      if (matchesItem(file, item)) {
        present.add(item.key);
      }
    }
  }

  const missing = expected.filter(item => !present.has(item.key));

  return { existing, present, missing };
}

// ─── Find existing file by key ─────────────────────────────────────────────

export function findExistingFile(
  existing: DriveFile[],
  key: string,
  event: EventInfo,
  panelists: PanelistInfo[],
): DriveFile | undefined {
  const expected = getExpectedItems(event, panelists);
  const item = expected.find(e => e.key === key);
  if (!item) return undefined;
  return existing.find(f => matchesItem(f, item));
}

// ─── High-level: create or fill all event documents ───────────────────────

export type ProgressCallback = (msg: string) => void;

export async function createOrFillEventFolder(
  folderId: string,
  event: EventInfo,
  panelists: PanelistInfo[],
  onProgress: ProgressCallback,
): Promise<void> {
  onProgress('Scanning existing folder...');
  const { existing, missing } = await scanFolder(folderId, event, panelists);

  const getExisting = (key: string) => findExistingFile(existing, key, event, panelists);

  // ── Create missing subfolders ──
  const folderKeys = ['folder_banner_qr', 'folder_headshots', 'folder_logos', 'folder_promo_banners', 'folder_reshani'];
  const folderNames: Record<string, string> = {
    folder_banner_qr: 'Banner QR Codes',
    folder_headshots: 'Panelist Headshots',
    folder_logos: 'Partner Logos',
    folder_promo_banners: 'Promo Banners',
    folder_reshani: 'Reshani',
  };
  for (const key of folderKeys) {
    if (missing.find(m => m.key === key)) {
      onProgress(`Creating folder: ${folderNames[key]}`);
      await createFolder(folderNames[key], folderId);
    }
  }

  // ── Partner Details / Zoom Landing Page Details ──
  onProgress('Writing Partner Details / Zoom Landing Page Details...');
  let partnerDetailsId = getExisting('doc_partner_details')?.id;
  if (!partnerDetailsId) {
    partnerDetailsId = await createGoogleDoc('Partner Details/Zoom Landing Page Details', folderId);
  }
  const partnerDetailsTabs = [
    { title: 'Zoom Landing', content: generateZoomLandingTab(event) },
    ...panelists.map(p => ({ title: p.name, content: generatePanelistTab(p) })),
  ];
  await writeMultiTabDoc(partnerDetailsId, partnerDetailsTabs);

  // ── Calendar Notes ──
  onProgress('Writing Calendar Notes...');
  let calNotesId = getExisting('sheet_calendar_notes')?.id;
  if (!calNotesId) {
    calNotesId = await createGoogleSheet(`Calendar Notes - ${event.panelName}`, folderId);
  }
  const calData = generateCalendarNotesSheet(event, panelists);
  await writeSheetContent(calNotesId, calData);

  // ── Email Drafts ──
  onProgress('Writing Email Drafts...');
  let emailDraftsId = getExisting('doc_email_drafts')?.id;
  if (!emailDraftsId) {
    emailDraftsId = await createGoogleDoc('Email Drafts', folderId);
  }
  const emailTabs = generateEmailDraftsContent(event, panelists);

  // Build tab structure: Invite (parent) → Followup, Schedule; Thrilled (parent) → per panelist; etc.
  const emailTabList = [
    { title: 'Invite', content: emailTabs['Invite'] ?? '' },
    { title: 'Followup', content: emailTabs['Followup'] ?? '' },
    { title: 'Schedule', content: emailTabs['Schedule'] ?? '' },
    { title: 'Thrilled To have you', content: '' },
    ...panelists.map(p => ({ title: `${p.firstName} Thrilled`, content: emailTabs[`${p.firstName} Thrilled`] ?? '' })),
    { title: 'Calendar Invite', content: '' },
    ...panelists.map(p => ({ title: `${p.firstName} Calendar`, content: emailTabs[`${p.firstName} Calendar`] ?? '' })),
    { title: 'Random Reg reminder', content: emailTabs['Random Reg reminder'] ?? '' },
    { title: `Questions Mail ${event.dateShort}`, content: '' },
    ...panelists.map(p => ({ title: `${p.firstName} Questions`, content: emailTabs[`${p.firstName} Questions`] ?? '' })),
    { title: 'Send Email: Boost Registrations', content: '' },
    ...panelists.map(p => ({ title: `${p.firstName} Boost`, content: emailTabs[`${p.firstName} Boost`] ?? '' })),
    { title: 'Few days left', content: '' },
    ...panelists.map(p => ({ title: `${p.firstName} Few days`, content: emailTabs[`${p.firstName} Few days`] ?? '' })),
    { title: 'Question Confirmation', content: '' },
    ...panelists.map(p => ({ title: `${p.firstName} Q Confirm`, content: emailTabs[`${p.firstName} Q Confirm`] ?? '' })),
    { title: '3 Days Left', content: '' },
    ...panelists.map(p => ({ title: `${p.firstName} 3 Days`, content: emailTabs[`${p.firstName} 3 Days`] ?? '' })),
    { title: 'Tmrw is the big day', content: '' },
    ...panelists.map(p => ({ title: `${p.firstName} Tmrw`, content: emailTabs[`${p.firstName} Tmrw`] ?? '' })),
    { title: 'Banner Reminder Final Day', content: '' },
    ...panelists.map(p => ({ title: `${p.firstName} Banner`, content: emailTabs[`${p.firstName} Banner`] ?? '' })),
    { title: 'Few hours away', content: '' },
    ...panelists.map(p => ({ title: `${p.firstName} Few Hours`, content: emailTabs[`${p.firstName} Few Hours`] ?? '' })),
    { title: 'Few Mins away', content: '' },
    ...panelists.map(p => ({ title: `${p.firstName} Few Away`, content: emailTabs[`${p.firstName} Few Away`] ?? '' })),
    { title: 'Text Reminders', content: emailTabs['Text Reminders'] ?? '' },
    { title: 'Text Reminder Panelists', content: emailTabs['Text Reminder Panelists'] ?? '' },
    { title: 'Thankyou to Panelists!', content: '' },
    ...panelists.map(p => ({ title: `${p.firstName} Thankyou`, content: emailTabs[`${p.firstName} Thankyou`] ?? '' })),
    { title: 'ICP Targeted mail', content: emailTabs['ICP Targeted mail'] ?? '' },
    { title: 'No shows', content: emailTabs['No shows'] ?? '' },
    { title: 'Tab 69', content: '' },
  ];
  await writeMultiTabDoc(emailDraftsId, emailTabList);

  // ── Shared Promotional Materials ──
  onProgress('Writing Promotional Materials...');
  let promoSharedId = getExisting('doc_promo_materials')?.id;
  if (!promoSharedId) {
    promoSharedId = await createGoogleDoc('Promotional Materials', folderId);
  }
  const promoSharedTabs = panelists.map(p => ({
    title: p.name,
    content: generatePromoMaterialsContent(event, p),
  }));
  await writeMultiTabDoc(promoSharedId, promoSharedTabs);

  // ── Per-panelist Promotional Materials + Short Links ──
  for (const p of panelists) {
    onProgress(`Writing ${p.name} - Promotional Materials...`);
    let promoId = getExisting(`doc_promo_${p.name}`)?.id;
    if (!promoId) {
      // Also check by name pattern
      promoId = existing.find(f =>
        f.name.toLowerCase().includes(p.name.toLowerCase()) &&
        f.name.toLowerCase().includes('promotional'),
      )?.id;
    }
    if (!promoId) {
      promoId = await createGoogleDoc(`${p.name} - Promotional Materials`, folderId);
    }
    await writeDocContent(promoId, generatePromoMaterialsContent(event, p));

    onProgress(`Writing ${p.name} Short Links...`);
    let linksId = getExisting(`sheet_links_${p.name}`)?.id;
    if (!linksId) {
      linksId = existing.find(f =>
        f.name.toLowerCase().includes(p.name.toLowerCase().split(' ')[0]) &&
        f.name.toLowerCase().includes('short link'),
      )?.id;
    }
    if (!linksId) {
      linksId = await createGoogleSheet(`${p.name} Short Links`, folderId);
    }
    await writeSheetContent(linksId, generateShortLinksSheet(event, p));
  }

  // ── Zoom Chat DMs ──
  onProgress('Writing Zoom Chat DMs...');
  let zoomChatId = getExisting('doc_zoom_chat')?.id;
  if (!zoomChatId) {
    zoomChatId = await createGoogleDoc('Zoom Chat DMs', folderId);
  }
  await writeDocContent(zoomChatId, generateZoomChatDMs(event, panelists));

  // ── Reshani's Posting ──
  onProgress('Writing Reshanis Posting...');
  let reshaniId = getExisting('doc_reshani_posting')?.id;
  if (!reshaniId) {
    // Look for any file with "reshani" in the name
    reshaniId = existing.find(f => f.name.toLowerCase().includes('reshani') && f.name.toLowerCase().includes('posting'))?.id;
  }
  if (!reshaniId) {
    reshaniId = await createGoogleDoc('Reshanis Posting', folderId);
  }
  await writeDocContent(reshaniId, generateReshanisPosting(event, panelists));

  onProgress('Done! All documents created/updated successfully.');
}
