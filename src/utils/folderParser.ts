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
import { ParsedPanelistSchema } from './schemas';
import { z } from 'zod';

// ---------- types ----------

export type ParsedFolder = {
  partnerDetailsDocId: string | null;
  headhotsFolderId: string | null;
  promoDocIds: string[];
  promoDocNames: string[]; // names extracted from promo doc filenames
  slidesDeckId: string | null;
  bannersFolderId: string | null;
  logosFolderId: string | null;
  qrCodesFolderId: string | null;
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
  let qrCodesFolderId: string | null = null;
  const promoDocIds: string[] = [];
  const promoDocNames: string[] = [];

  for (const f of files) {
    const lower = f.name.toLowerCase();

    // Partner Details doc
    if (f.mimeType === docMime && lower.includes('partner details')) {
      partnerDetailsDocId = f.id;
    }

    // Headshots folder — also match "head shots", "photos", "pics"
    if (f.mimeType === folderMime && (lower.includes('headshot') || lower.includes('head shot') || lower.includes('photos') || lower.includes('pics'))) {
      headhotsFolderId = f.id;
    }

    // Promotional Materials docs — match common typos too
    if (f.mimeType === docMime && (lower.includes('promotional material') || lower.includes('promotional matir') || lower.includes('promotional mater') || lower.includes('promo material'))) {
      promoDocIds.push(f.id);
      // Extract panelist name from filename: "Jessica Moore-Jones - Promotional Matirials"
      const nameFromFile = f.name.split(/\s*[-–—]\s*(?:promotional|promo)/i)[0]?.trim();
      if (nameFromFile && nameFromFile.length > 1) {
        promoDocNames.push(nameFromFile);
      }
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

    // QR Codes folder
    if (f.mimeType === folderMime && (lower.includes('qr') || lower.includes('q.r') || lower.includes('qr code'))) {
      qrCodesFolderId = f.id;
    }
  }

  return { partnerDetailsDocId, headhotsFolderId, promoDocIds, promoDocNames, slidesDeckId, bannersFolderId, logosFolderId, qrCodesFolderId, folderName };
}

// ---------- AI-powered panelist extraction ----------

export async function extractPanelistsWithAI(
  docContent: string,
  fileNames: string[],
  claudeApiKey?: string,
): Promise<ParsedPanelist[]> {
  // Build context about what names we see in file names
  const promoNames = fileNames
    .filter(n => /promotional|promo/i.test(n))
    .map(n => n.split(/\s*[-–—]\s*(?:promotional|promo)/i)[0]?.trim())
    .filter(Boolean);

  const shortLinkNames = fileNames
    .filter(n => /short\s*links?/i.test(n))
    .map(n => n.split(/\s*[-–—]?\s*short\s*links?/i)[0]?.trim())
    .filter(Boolean);

  const registrationNames = fileNames
    .filter(n => /registration\s*report/i.test(n))
    .map(n => n.split(/\s*[-–—]?\s*registration\s*report/i)[0]?.trim())
    .filter(Boolean);

  const allNameHints = [...new Set([...promoNames, ...shortLinkNames, ...registrationNames])];

  const prompt = `You are extracting panelist information from event documents for a professional expert panel.

Here are panelist names found in the folder's file names: ${allNameHints.length > 0 ? allNameHints.join(', ') : 'none found'}

Here is the document content (may include Partner Details with separate tabs per panelist, Promotional Materials, and bios).
The content may contain "--- TAB: <name> ---" markers indicating separate Google Doc tabs — each tab typically contains one panelist's details.

---
${docContent}
---

Extract ALL panelists mentioned. For each panelist, you MUST find:
- name: Full name with "Dr." prefix if they are a doctor, AND include credentials after name (e.g. "Dr. Dani McVety, DVM")
- firstName: First name only (without Dr.)
- title: Their job title / role / position (e.g. "Founder & CEO", "Practice Owner", "Hospital Director", "Consultant, Coach, Educator", "Chief Strategy Officer"). This is NOT their credentials — this is what they DO.
- org: Organization / company / practice / hospital / firm name they work at (e.g. "Ready Vet Go", "Smith Animal Hospital", "Keal Consulting", "ClearDent Group")
- email: Email address if found
- phone: Phone number if found

CRITICAL RULES:
1. You MUST extract title AND org for every panelist. Look EVERYWHERE — tabs, tables, bullet points, paragraphs, bios, labeled fields. NEVER leave title or org empty if the info exists anywhere in the document.
2. The "title" field should be their ROLE (e.g. "Founder & CEO", "Practice Owner", "Medical Director", "Financial Consultant") — NOT their degree credentials.
3. The "org" field should be the NAME of their business/practice/hospital/company/firm.
4. Include credentials like DVM, MBA, DACVIM, JD, CPA, LE, DDS etc. in the "name" field after their name (e.g. "Dr. John Smith, DVM, DACVIM").
5. Information may be spread across MULTIPLE TABS and sections of the document. Cross-reference all tabs, Partner Details, and Promotional Materials to get complete data.
6. Common patterns: "Title: ...", "Organization: ...", "Practice: ...", "Hospital: ...", "Company: ...", "Firm: ...", or just mentioned in a bio paragraph like "She is the founder of XYZ Hospital" or "CEO at ABC Corp".
7. If the document has table data separated by "|", each column may represent different fields (name, title, org, email, etc.).
8. Each "--- TAB: <name> ---" section usually contains that panelist's full details including their title and organization. Read each tab carefully.

Respond ONLY with a JSON array, no other text. Example:
[{"name":"Dr. John Smith, DVM","firstName":"John","title":"Founder & CEO","org":"Smith Animal Hospital","email":"john@example.com","phone":"555-1234"}]

If you cannot find any panelists, respond with: []`;

  // Helper to parse AI response into panelists (with Zod validation)
  const parseAIResponse = (text: string): ParsedPanelist[] | null => {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    try {
      const rawParsed = JSON.parse(jsonMatch[0]);
      const validated = z.array(ParsedPanelistSchema).safeParse(rawParsed);
      if (validated.success) {
        const result = validated.data.map(p => ({
          name: p.name || '',
          firstName: p.firstName || (p.name || '').split(' ')[0],
          title: p.title || '',
          org: p.org || '',
          email: p.email || '',
          phone: p.phone || '',
        }));
        return result.length > 0 ? result : null;
      }
      // Fallback: manual coercion if Zod fails
      console.warn('[folderParser] Zod validation warnings:', validated.error.issues.map(i => `${i.path.join('.')}: ${i.message}`));
    } catch { /* fall through */ }
    // Legacy fallback
    const parsed = JSON.parse(jsonMatch[0]) as ParsedPanelist[];
    const result = parsed.map(p => ({
      name: p.name || '',
      firstName: p.firstName || (p.name || '').split(' ')[0],
      title: p.title || '',
      org: p.org || '',
      email: p.email || '',
      phone: p.phone || '',
    }));
    return result.length > 0 ? result : null;
  };

  // 1. Try any local CLI provider first (Claude, then Codex)
  try {
    const { generateText } = await import('./aiService');
    const text = await generateText(prompt, { preferMode: 'claude', model: 'claude-opus-4-6' });
    const result = parseAIResponse(text);
    if (result) return result;
  } catch {
    // CLI server not available, try next method
  }

  // 2. Fallback: try using the user's Claude API key directly
  if (claudeApiKey) {
    try {
      const { sendToClaudeAI } = await import('./claudeClient');
      const text = await sendToClaudeAI(claudeApiKey, prompt);
      const result = parseAIResponse(text);
      if (result) return result;
    } catch {
      // API key method failed, fall back to regex
    }
  }

  // 3. Fallback: regex parser
  return extractPanelistsFromDoc(docContent);
}

// ---------- regex-based panelist extraction (fallback) ----------

export function extractPanelistsFromDoc(docContent: string): ParsedPanelist[] {
  const panelists: ParsedPanelist[] = [];

  const lines = docContent.split('\n').map((l) => l.trim()).filter(Boolean);

  let current: Partial<ParsedPanelist> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Strip emoji prefixes for matching
    const cleanLine = line.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu, '').trim();

    // Detect tab marker — "--- TAB: Name ---" indicates a new panelist section
    const tabMatch = cleanLine.match(/^-{2,}\s*TAB:\s*(.+?)\s*-{2,}$/);
    if (tabMatch) {
      if (current?.name) panelists.push(finalizePanelist(current));
      const tabName = tabMatch[1].trim();
      // Tab name is often the panelist's name
      if (tabName.length > 2 && !/^(overview|summary|template|instructions|details|partner)/i.test(tabName)) {
        current = { name: tabName, firstName: tabName.replace(/^Dr\.?\s*/i, '').split(' ')[0] };
      } else {
        current = null;
      }
      continue;
    }

    // Detect panelist name — 2-4 capitalized words, allow hyphens (e.g. Moore-Jones)
    const nameMatch = cleanLine.match(/^([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+){1,3})$/);
    if (nameMatch && !cleanLine.includes(':') && !cleanLine.includes('@') && cleanLine.length < 50) {
      if (current?.name) panelists.push(finalizePanelist(current));
      current = { name: nameMatch[1], firstName: nameMatch[1].split(' ')[0] };
      continue;
    }

    // Detect "Name:" or "Panelist:" pattern
    const namedMatch = cleanLine.match(/^(?:name|panelist|speaker|moderator)\s*[:\-]\s*(.+)/i);
    if (namedMatch) {
      if (current?.name) panelists.push(finalizePanelist(current));
      const n = namedMatch[1].trim();
      current = { name: n, firstName: n.split(' ')[0] };
      continue;
    }

    // Detect "Dr. Name" or "Name, DVM" patterns
    const drMatch = cleanLine.match(/^(?:Dr\.?\s+)([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+){1,3})/);
    if (drMatch && !current) {
      current = { name: drMatch[1], firstName: drMatch[1].split(' ')[0] };
      continue;
    }

    if (!current) continue;

    // Title / Designation
    const titleMatch = cleanLine.match(/^(?:title|designation|position|role|credentials)\s*[:\-]\s*(.+)/i);
    if (titleMatch) { current.title = titleMatch[1].trim(); continue; }

    // Organization / Company
    const orgMatch = cleanLine.match(/^(?:company|organization|org|institution|practice|hospital|clinic|business|firm|group|agency)\s*[:\-]\s*(.+)/i);
    if (orgMatch) { current.org = orgMatch[1].trim(); continue; }

    // Email
    const emailMatch = cleanLine.match(/^(?:email)\s*[:\-]\s*(.+)/i) || cleanLine.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch && !current.email) { current.email = emailMatch[1].trim(); continue; }

    // Phone
    const phoneMatch = cleanLine.match(/^(?:phone|cell|mobile|contact)\s*[:\-]\s*(.+)/i) || cleanLine.match(/(\+?[\d\s\-().]{7,})/);
    if (phoneMatch && !current.phone) { current.phone = phoneMatch[1].trim(); continue; }

    // If the line right after the name has no label, treat it as title
    if (!current.title && !cleanLine.includes(':') && !cleanLine.includes('@') && cleanLine.length < 100) {
      current.title = cleanLine;
      continue;
    }

    // If we have title but no org, next unlabeled line is org
    if (current.title && !current.org && !cleanLine.includes(':') && !cleanLine.includes('@') && cleanLine.length < 100) {
      current.org = cleanLine;
      continue;
    }
  }

  if (current?.name) panelists.push(finalizePanelist(current));

  return panelists;
}

// ---------- extract panelists from filenames only ----------

export function extractPanelistsFromFileNames(files: DriveFile[]): ParsedPanelist[] {
  const names = new Set<string>();

  for (const f of files) {
    const lower = f.name.toLowerCase();

    // "Name - Promotional Materials/Matirials"
    if (/promotional|promo/i.test(f.name)) {
      const name = f.name.split(/\s*[-–—]\s*(?:promotional|promo)/i)[0]?.trim();
      if (name && name.length > 1 && !/^promotional/i.test(name)) names.add(name);
    }

    // "Name Short Links"
    if (/short\s*links?/i.test(f.name)) {
      const name = f.name.split(/\s*[-–—]?\s*short\s*links?/i)[0]?.trim();
      if (name && name.length > 1) names.add(name);
    }

    // "Name Registration Report"
    if (/registration\s*report/i.test(f.name) && !lower.includes('.csv')) {
      const name = f.name.split(/\s*[-–—]?\s*registration\s*report/i)[0]?.trim();
      if (name && name.length > 1 && !/^\d/.test(name)) names.add(name);
    }
  }

  return [...names].map(name => ({
    name,
    firstName: name.split(/[\s-]/)[0],
    title: '',
    org: '',
    email: '',
    phone: '',
  }));
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

export type ParsedEventDetailsEx = ParsedEventDetails & {
  eventTime: string;
  zoomRegistrationUrl: string;
  websiteUrl: string;
};

export function extractEventDetails(docContent: string, folderName: string): ParsedEventDetailsEx {
  let eventDate = '';
  let eventTime = '';
  let panelTopic = '';
  let panelName = '';
  let zoomRegistrationUrl = '';
  let websiteUrl = '';

  const lines = docContent.split('\n').map(l => l.trim()).filter(Boolean);
  // Clean lines: strip emojis
  const cleanLines = lines.map(l => l.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{2702}-\u{27B0}]/gu, '').trim()).filter(Boolean);

  // --- Zoom registration URL ---
  const zoomMatch = docContent.match(/(https?:\/\/[^\s]*zoom\.us\/(?:webinar\/register|j|w)\/[^\s"<)]+)/i);
  if (zoomMatch) zoomRegistrationUrl = zoomMatch[1].trim();

  // --- Website URL ---
  const websiteMatch = docContent.match(/(?:website|web)\s*[:\-]\s*((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*)/i);
  if (websiteMatch) websiteUrl = websiteMatch[1].trim();
  if (!websiteUrl) {
    const wwwMatch = docContent.match(/((?:www\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (wwwMatch) websiteUrl = wwwMatch[1].trim();
  }

  // --- Date extraction ---
  // Method 1: "Date:" or "📅" labeled field in doc (most reliable)
  const dateLabelMatch = docContent.match(
    /(?:📅\s*)?(?:date)\s*[:\-]\s*(?:(\w+day),?\s*)?((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})/i,
  );
  if (dateLabelMatch) {
    const dayOfWeek = dateLabelMatch[1] ? `${dateLabelMatch[1].toUpperCase()}, ` : '';
    eventDate = `${dayOfWeek}${dateLabelMatch[2].trim().toUpperCase()}`;
  }

  // Method 2: Full date with day of week anywhere in doc
  if (!eventDate) {
    const fullDateMatch = docContent.match(
      /(\w+day),?\s*((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})/i,
    );
    if (fullDateMatch) {
      eventDate = `${fullDateMatch[1].toUpperCase()}, ${fullDateMatch[2].trim().toUpperCase()}`;
    }
  }

  // Method 3: Any full month + day + year in doc
  if (!eventDate) {
    const anyDate = docContent.match(
      /((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})/i,
    );
    if (anyDate) eventDate = anyDate[1].trim().toUpperCase();
  }

  // Method 4: From folder name (e.g. "March 23")
  if (!eventDate) {
    const dateFromFolder = folderName.match(
      /((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:\s*,?\s*\d{4})?)/i,
    );
    if (dateFromFolder) {
      let d = dateFromFolder[1].trim().toUpperCase();
      // Add current year if missing
      if (!/\d{4}/.test(d)) d += ', 2026';
      eventDate = d;
    }
  }

  // --- Time extraction ---
  // Match "Time: 8:00 PM – 9:00 PM EST" or "🕗 Time: 8 PM EST"
  const timeFullMatch = docContent.match(
    /(?:🕗\s*)?(?:time)\s*[:\-]\s*([\d:]+\s*(?:AM|PM)\s*(?:[-–]\s*[\d:]+\s*(?:AM|PM))?\s*(?:EST|CST|MST|PST|ET|CT|MT|PT)?)/i,
  );
  if (timeFullMatch) eventTime = timeFullMatch[1].trim();

  // Fallback: any time pattern
  if (!eventTime) {
    const anyTime = docContent.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM)\s*(?:[-–]\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM))?\s*(?:EST|CST|MST|PST|ET|CT|MT|PT)?)/i);
    if (anyTime) eventTime = anyTime[1].trim();
  }

  // --- Panel name ---
  // Skip generic/junk first lines like "Zoom Landing Page", "Partner Details", etc.
  const junkPatterns = /^(zoom\s*landing\s*page|partner\s*details|event\s*details|promotional\s*material|registration|overview|agenda|schedule|notes|draft|template|untitled|document)/i;

  // Try explicit label
  const nameMatch = docContent.match(/(?:panel\s*name|event\s*name|panel\s*title)\s*[:\-]\s*(.+)/i);
  if (nameMatch) {
    panelName = nameMatch[1].trim();
  }

  // Try "Expert Panel" or "Panel" containing line
  if (!panelName) {
    for (const cl of cleanLines) {
      if (/panel/i.test(cl) && !junkPatterns.test(cl) && cl.length < 100 && !cl.includes(':')) {
        panelName = cl;
        break;
      }
    }
  }

  // Try the first non-junk line
  if (!panelName) {
    for (const cl of cleanLines) {
      if (!junkPatterns.test(cl) && cl.length > 3 && cl.length < 120 && !cl.includes('@') && !/^https?:/i.test(cl)) {
        panelName = cl;
        break;
      }
    }
  }

  // Fallback: use folder name
  if (!panelName) panelName = folderName;

  // --- Panel topic ---
  // Try explicit label
  const topicMatch = docContent.match(/(?:topic|panel\s*topic|discussion\s*topic|subject)\s*[:\-]\s*(.+)/i);
  if (topicMatch) {
    panelTopic = topicMatch[1].trim();
  }

  // Try quoted text (often the topic is in quotes)
  if (!panelTopic) {
    const quotedMatch = docContent.match(/["\u201C]([^"\u201D]{10,150})["\u201D]/);
    if (quotedMatch) panelTopic = quotedMatch[1].trim();
  }

  // Try the line after panelName
  if (!panelTopic) {
    const panelNameIdx = cleanLines.findIndex(l => l === panelName);
    if (panelNameIdx >= 0 && panelNameIdx + 1 < cleanLines.length) {
      const nextLine = cleanLines[panelNameIdx + 1];
      if (nextLine && nextLine.length < 150 && !nextLine.includes('Date') && !nextLine.includes('Time') && !junkPatterns.test(nextLine)) {
        panelTopic = nextLine;
      }
    }
  }

  // Keep date and time as separate fields — templates render them independently

  // Clean topic: strip emojis, "Preheader" artifacts, and CTA filler
  panelTopic = panelTopic
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{2702}-\u{27B0}]/gu, '')
    .replace(/\s*preheader\s*/gi, '')
    // Remove CTA after dashes: "– Join Our Panel", "– Save Your Seat"
    .replace(/\s*[–—-]+\s*(?:Join (?:Our|Us|the)|Save Your|Register Now|Sign Up|Don't Miss|RSVP|Reserve Your)[\s\S]*$/i, '')
    // Remove trailing CTA-only sentences
    .replace(/\.\s*(?:Free live|Join us|Save your seat|Register now|Sign up|Don't miss|RSVP|Limited spots|Click here|Learn more at)[\s\S]*$/i, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*[.,:;]+\s*$/, '')
    .trim();

  return { eventDate, eventTime, panelTopic, panelName, zoomRegistrationUrl, websiteUrl };
}
