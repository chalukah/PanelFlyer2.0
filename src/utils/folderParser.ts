/**
 * Parse a VET event Google Drive folder structure to extract panelist data.
 *
 * Typical folder layout:
 *   Event Folder/
 *   ├── Partner Details (Google Doc with tabs per panelist)
 *   ├── Headshots/ (folder with images)
 *   ├── [Name] - Promotional Materials (Google Doc per panelist)
 *   ├── [Name] Short Links (Google Sheet)
 *   ├── MArch DD/ or Banners/ (banner sub-folders)
 *   ├── Logos/ (logo sub-folders)
 *   └── Event Slides (Google Slides)
 */

import type { DriveFile } from './googleDrive';

// ---------- types ----------

export type ParsedFolder = {
  partnerDetailsDocId: string | null;
  headhotsFolderId: string | null;
  promoDocIds: string[];
  slidesDeckId: string | null;
  bannersFolderId: string | null;
  logosFolderId: string | null;
  folderName: string;
};

export type ParsedPanelist = {
  name: string;
  firstName: string;
  title: string;
  org: string;
  email: string;
  phone: string;
};

export type ParsedEventDetails = {
  eventDate: string;
  panelTopic: string;
  panelName: string;
};

// ---------- folder-level parsing ----------

export function parseEventFolder(files: DriveFile[], folderName: string): ParsedFolder {
  const folderMime = 'application/vnd.google-apps.folder';
  const docMime = 'application/vnd.google-apps.document';

  let partnerDetailsDocId: string | null = null;
  let headhotsFolderId: string | null = null;
  let slidesDeckId: string | null = null;
  let bannersFolderId: string | null = null;
  let logosFolderId: string | null = null;
  const promoDocIds: string[] = [];

  for (const f of files) {
    const lower = f.name.toLowerCase();

    // Partner Details doc
    if (f.mimeType === docMime && lower.includes('partner details')) {
      partnerDetailsDocId = f.id;
    }

    // Headshots folder
    if (f.mimeType === folderMime && (lower.includes('headshot') || lower.includes('head shot'))) {
      headhotsFolderId = f.id;
    }

    // Promotional Materials docs
    if (f.mimeType === docMime && lower.includes('promotional material')) {
      promoDocIds.push(f.id);
    }

    // Event Slides
    if (f.mimeType === 'application/vnd.google-apps.presentation' && lower.includes('slide')) {
      slidesDeckId = f.id;
    }

    // Banners folder
    if (f.mimeType === folderMime && (lower.includes('banner') || /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(lower))) {
      bannersFolderId = f.id;
    }

    // Logos folder
    if (f.mimeType === folderMime && lower.includes('logo')) {
      logosFolderId = f.id;
    }
  }

  return { partnerDetailsDocId, headhotsFolderId, promoDocIds, slidesDeckId, bannersFolderId, logosFolderId, folderName };
}

// ---------- panelist extraction from Partner Details doc ----------

export function extractPanelistsFromDoc(docContent: string): ParsedPanelist[] {
  const panelists: ParsedPanelist[] = [];

  // Split by common tab/section delimiters — the doc usually has one section per panelist
  // Look for blocks that contain name + title + org patterns
  const lines = docContent.split('\n').map((l) => l.trim()).filter(Boolean);

  let current: Partial<ParsedPanelist> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect panelist name — usually a line that is a proper name (2-4 capitalized words, no colons)
    const nameMatch = line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})$/);
    if (nameMatch && !line.includes(':') && !line.includes('@')) {
      // Save previous panelist
      if (current?.name) panelists.push(finalizePanelist(current));
      current = { name: nameMatch[1], firstName: nameMatch[1].split(' ')[0] };
      continue;
    }

    // Also detect "Name:" pattern
    const namedMatch = line.match(/^(?:name|panelist|speaker)\s*[:\-]\s*(.+)/i);
    if (namedMatch) {
      if (current?.name) panelists.push(finalizePanelist(current));
      const n = namedMatch[1].trim();
      current = { name: n, firstName: n.split(' ')[0] };
      continue;
    }

    if (!current) continue;

    // Title / Designation
    const titleMatch = line.match(/^(?:title|designation|position|role)\s*[:\-]\s*(.+)/i);
    if (titleMatch) { current.title = titleMatch[1].trim(); continue; }

    // Organization / Company
    const orgMatch = line.match(/^(?:company|organization|org|institution|practice|hospital|clinic)\s*[:\-]\s*(.+)/i);
    if (orgMatch) { current.org = orgMatch[1].trim(); continue; }

    // Email
    const emailMatch = line.match(/^(?:email)\s*[:\-]\s*(.+)/i) || line.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch && !current.email) { current.email = emailMatch[1].trim(); continue; }

    // Phone
    const phoneMatch = line.match(/^(?:phone|cell|mobile|contact)\s*[:\-]\s*(.+)/i) || line.match(/(\+?[\d\s\-().]{7,})/);
    if (phoneMatch && !current.phone) { current.phone = phoneMatch[1].trim(); continue; }

    // If the line right after the name has no label, treat it as title
    if (!current.title && !line.includes(':') && !line.includes('@') && line.length < 100) {
      current.title = line;
      continue;
    }

    // If we have title but no org, next unlabeled line is org
    if (current.title && !current.org && !line.includes(':') && !line.includes('@') && line.length < 100) {
      current.org = line;
      continue;
    }
  }

  // Push last panelist
  if (current?.name) panelists.push(finalizePanelist(current));

  return panelists;
}

function finalizePanelist(p: Partial<ParsedPanelist>): ParsedPanelist {
  return {
    name: p.name || '',
    firstName: p.firstName || (p.name || '').split(' ')[0],
    title: p.title || '',
    org: p.org || '',
    email: p.email || '',
    phone: p.phone || '',
  };
}

// ---------- event details extraction ----------

export function extractEventDetails(docContent: string, folderName: string): ParsedEventDetails {
  let eventDate = '';
  let panelTopic = '';
  let panelName = '';

  // Try to extract date from folder name — e.g. "March 23", "MAR 23", "March 23, 2026"
  const dateFromFolder = folderName.match(
    /(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}(?:\s*,?\s*\d{4})?/i,
  );
  if (dateFromFolder) {
    eventDate = dateFromFolder[0].toUpperCase();
  }

  // Try to get date from doc
  if (!eventDate) {
    const dateFromDoc = docContent.match(
      /(?:date|event date|panel date)\s*[:\-]\s*(.+)/i,
    );
    if (dateFromDoc) eventDate = dateFromDoc[1].trim().toUpperCase();
  }

  // Panel topic
  const topicMatch = docContent.match(/(?:topic|panel topic|discussion topic|subject)\s*[:\-]\s*(.+)/i);
  if (topicMatch) panelTopic = topicMatch[1].trim();

  // Panel name
  const nameMatch = docContent.match(/(?:panel name|event name|panel title)\s*[:\-]\s*(.+)/i);
  if (nameMatch) panelName = nameMatch[1].trim();

  // Fallback: use folder name as panel name
  if (!panelName) panelName = folderName;

  return { eventDate, panelTopic, panelName };
}
