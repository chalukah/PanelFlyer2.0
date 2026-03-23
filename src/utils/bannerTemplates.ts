import { type VerticalConfig, getVerticalConfig } from './verticalConfig';
import { TD_LOGO_DATA_URI, DL_LOGO_DATA_URI, BOA_LOGO_DATA_URI } from './logoData';

// ——————————————————————————————————————————————
// Types
// ——————————————————————————————————————————————

export type BannerType = 'B1' | 'B2' | 'B3' | 'B4' | 'B5';

export type BannerTheme = {
  id: string;
  name: string;
  /** Swatch preview colors [primary, secondary] */
  swatch: [string, string];
  /** Header bar background */
  headerBg: string;
  /** Header bar text color */
  headerTextColor: string;
  /** Main background gradient */
  bgGradient: string;
  /** Accent color (borders, highlights) */
  accent: string;
  /** Lime/highlight color for titles, time, dates */
  lime: string;
  /** Neon glow border around headshot */
  neonBorder: string;
  /** Dark button/badge background */
  darkBg: string;
  /** Subtitle color on dark bg */
  subtitleColor: string;
  /** Subtitle color on light bg (B3) */
  subtitleColorLight: string;
  /** CTA button background */
  ctaBg: string;
  /** CTA button text color */
  ctaText: string;
  /** Accent gradient for topic card */
  accentGradient: string;
  /** Grid line overlay color */
  gridLineColor: string;
  /** Separator line color */
  separatorColor: string;
  /** B3 white section text color */
  b3TextColor: string;
  /** Background pattern SVG (paw prints / vet motifs) */
  bgPattern: string;
};

export const BANNER_THEMES: BannerTheme[] = [
  {
    id: 'classic-vet',
    name: 'Classic Vet',
    swatch: ['#0a4a44', '#DDE821'],
    headerBg: '#DDE821',
    headerTextColor: '#000',
    bgGradient: 'radial-gradient(ellipse at 68% 42%, #0a4a44 0%, #0d3530 22%, #0b2820 48%, #071510 78%, #050e0a 100%)',
    accent: '#00b09b',
    lime: '#DDE821',
    neonBorder: '#62E53E',
    darkBg: '#004D25',
    subtitleColor: '#c8f0a0',
    subtitleColorLight: '#333',
    ctaBg: '#004D25',
    ctaText: '#DDE821',
    accentGradient: 'linear-gradient(135deg,#00b09b,#0a4a44)',
    gridLineColor: 'rgba(0,180,160,0.04)',
    separatorColor: '#00b09b',
    b3TextColor: '#111827',
    bgPattern: '',
  },
  {
    id: 'thriving-dentist',
    name: 'Thriving Dentist',
    swatch: ['#1A7AED', '#0A4A9A'],
    headerBg: '#CC0000',
    headerTextColor: '#ffffff',
    bgGradient: 'linear-gradient(160deg, #1A7AED 0%, #0E5BBD 35%, #0A4A9A 65%, #063570 100%)',
    accent: '#106EEA',
    lime: '#FFFFFF',
    neonBorder: '#1E83D0',
    darkBg: '#0A4A9A',
    subtitleColor: 'rgba(255,255,255,0.85)',
    subtitleColorLight: '#555555',
    ctaBg: '#CC0000',
    ctaText: '#ffffff',
    accentGradient: 'linear-gradient(135deg, #106EEA, #0A4A9A)',
    gridLineColor: 'rgba(16,110,234,0.04)',
    separatorColor: '#1E83D0',
    b3TextColor: '#121213',
    bgPattern: '',
  },
  {
    id: 'dominate-law',
    name: 'Dominate Law',
    swatch: ['#3D2B1A', '#C8A74E'],
    headerBg: '#C8A74E',
    headerTextColor: '#1F1508',
    bgGradient: 'radial-gradient(ellipse at 68% 42%, #3D2B1A 0%, #2E200F 30%, #1F1508 60%, #110C04 100%)',
    accent: '#C8A74E',
    lime: '#C8A74E',
    neonBorder: '#D4B95E',
    darkBg: '#2E200F',
    subtitleColor: '#E8D5A0',
    subtitleColorLight: '#3D2B1A',
    ctaBg: '#CC0000',
    ctaText: '#ffffff',
    accentGradient: 'linear-gradient(135deg, #C8A74E, #2E200F)',
    gridLineColor: 'rgba(200,167,78,0.04)',
    separatorColor: '#C8A74E',
    b3TextColor: '#1F1508',
    bgPattern: '',
  },
  {
    id: 'business-aesthetics',
    name: 'Business of Aesthetics',
    swatch: ['#0D8A8E', '#064044'],
    headerBg: '#0D7377',
    headerTextColor: '#ffffff',
    bgGradient: 'linear-gradient(160deg, #0D8A8E 0%, #0B7074 30%, #095A5E 60%, #064044 100%)',
    accent: '#0D7377',
    lime: '#FFFFFF',
    neonBorder: '#15A0A5',
    darkBg: '#095A5E',
    subtitleColor: 'rgba(255,255,255,0.85)',
    subtitleColorLight: '#555555',
    ctaBg: '#CC0000',
    ctaText: '#ffffff',
    accentGradient: 'linear-gradient(135deg, #0D7377, #064044)',
    gridLineColor: 'rgba(13,115,119,0.04)',
    separatorColor: '#15A0A5',
    b3TextColor: '#064044',
    bgPattern: '',
  },
  {
    id: 'emerald-gold',
    name: 'Emerald Gold',
    swatch: ['#064e3b', '#f59e0b'],
    headerBg: '#f59e0b',
    headerTextColor: '#000',
    bgGradient: 'radial-gradient(ellipse at 68% 42%, #064e3b 0%, #053d30 22%, #042f25 48%, #021f18 78%, #01140f 100%)',
    accent: '#10b981',
    lime: '#f59e0b',
    neonBorder: '#34d399',
    darkBg: '#064e3b',
    subtitleColor: '#a7f3d0',
    subtitleColorLight: '#374151',
    ctaBg: '#064e3b',
    ctaText: '#f59e0b',
    accentGradient: 'linear-gradient(135deg,#10b981,#064e3b)',
    gridLineColor: 'rgba(16,185,129,0.04)',
    separatorColor: '#10b981',
    b3TextColor: '#111827',
    bgPattern: '',
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    swatch: ['#0c4a6e', '#38bdf8'],
    headerBg: '#38bdf8',
    headerTextColor: '#0c4a6e',
    bgGradient: 'radial-gradient(ellipse at 68% 42%, #0c4a6e 0%, #0a3d5c 22%, #083248 48%, #052030 78%, #03141e 100%)',
    accent: '#0ea5e9',
    lime: '#38bdf8',
    neonBorder: '#7dd3fc',
    darkBg: '#0c4a6e',
    subtitleColor: '#bae6fd',
    subtitleColorLight: '#1e3a5f',
    ctaBg: '#0c4a6e',
    ctaText: '#38bdf8',
    accentGradient: 'linear-gradient(135deg,#0ea5e9,#0c4a6e)',
    gridLineColor: 'rgba(14,165,233,0.04)',
    separatorColor: '#0ea5e9',
    b3TextColor: '#0c4a6e',
    bgPattern: '',
  },
  {
    id: 'sunset-coral',
    name: 'Sunset Coral',
    swatch: ['#7c2d12', '#fb923c'],
    headerBg: '#fb923c',
    headerTextColor: '#7c2d12',
    bgGradient: 'radial-gradient(ellipse at 68% 42%, #7c2d12 0%, #6b2710 22%, #5a200e 48%, #3d160a 78%, #2a0f06 100%)',
    accent: '#f97316',
    lime: '#fb923c',
    neonBorder: '#fdba74',
    darkBg: '#7c2d12',
    subtitleColor: '#fed7aa',
    subtitleColorLight: '#7c2d12',
    ctaBg: '#7c2d12',
    ctaText: '#fb923c',
    accentGradient: 'linear-gradient(135deg,#f97316,#7c2d12)',
    gridLineColor: 'rgba(249,115,22,0.04)',
    separatorColor: '#f97316',
    b3TextColor: '#7c2d12',
    bgPattern: '',
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    swatch: ['#3b0764', '#c084fc'],
    headerBg: '#c084fc',
    headerTextColor: '#3b0764',
    bgGradient: 'radial-gradient(ellipse at 68% 42%, #3b0764 0%, #320658 22%, #28054a 48%, #1c0335 78%, #120225 100%)',
    accent: '#a855f7',
    lime: '#c084fc',
    neonBorder: '#d8b4fe',
    darkBg: '#3b0764',
    subtitleColor: '#e9d5ff',
    subtitleColorLight: '#3b0764',
    ctaBg: '#3b0764',
    ctaText: '#c084fc',
    accentGradient: 'linear-gradient(135deg,#a855f7,#3b0764)',
    gridLineColor: 'rgba(168,85,247,0.04)',
    separatorColor: '#a855f7',
    b3TextColor: '#3b0764',
    bgPattern: '',
  },
  {
    id: 'midnight-rose',
    name: 'Midnight Rose',
    swatch: ['#1a1a2e', '#e11d48'],
    headerBg: '#e11d48',
    headerTextColor: '#fff',
    bgGradient: 'radial-gradient(ellipse at 68% 42%, #1a1a2e 0%, #161626 22%, #12121e 48%, #0c0c14 78%, #08080e 100%)',
    accent: '#f43f5e',
    lime: '#fb7185',
    neonBorder: '#fda4af',
    darkBg: '#881337',
    subtitleColor: '#fecdd3',
    subtitleColorLight: '#881337',
    ctaBg: '#881337',
    ctaText: '#fecdd3',
    accentGradient: 'linear-gradient(135deg,#f43f5e,#1a1a2e)',
    gridLineColor: 'rgba(244,63,94,0.04)',
    separatorColor: '#f43f5e',
    b3TextColor: '#881337',
    bgPattern: '',
  },
  {
    id: 'forest-mint',
    name: 'Forest Mint',
    swatch: ['#14532d', '#86efac'],
    headerBg: '#86efac',
    headerTextColor: '#14532d',
    bgGradient: 'radial-gradient(ellipse at 68% 42%, #14532d 0%, #114425 22%, #0e371e 48%, #092514 78%, #06190d 100%)',
    accent: '#22c55e',
    lime: '#86efac',
    neonBorder: '#bbf7d0',
    darkBg: '#14532d',
    subtitleColor: '#bbf7d0',
    subtitleColorLight: '#14532d',
    ctaBg: '#14532d',
    ctaText: '#86efac',
    accentGradient: 'linear-gradient(135deg,#22c55e,#14532d)',
    gridLineColor: 'rgba(34,197,94,0.04)',
    separatorColor: '#22c55e',
    b3TextColor: '#14532d',
    bgPattern: '',
  },
  {
    id: 'steel-slate',
    name: 'Steel Slate',
    swatch: ['#1e293b', '#94a3b8'],
    headerBg: '#e2e8f0',
    headerTextColor: '#1e293b',
    bgGradient: 'radial-gradient(ellipse at 68% 42%, #1e293b 0%, #1a2332 22%, #151d28 48%, #0f151c 78%, #0a0f14 100%)',
    accent: '#64748b',
    lime: '#94a3b8',
    neonBorder: '#cbd5e1',
    darkBg: '#1e293b',
    subtitleColor: '#cbd5e1',
    subtitleColorLight: '#334155',
    ctaBg: '#1e293b',
    ctaText: '#e2e8f0',
    accentGradient: 'linear-gradient(135deg,#64748b,#1e293b)',
    gridLineColor: 'rgba(100,116,139,0.04)',
    separatorColor: '#64748b',
    b3TextColor: '#1e293b',
    bgPattern: '',
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    swatch: ['#831843', '#f9a8d4'],
    headerBg: '#f9a8d4',
    headerTextColor: '#831843',
    bgGradient: 'radial-gradient(ellipse at 68% 42%, #831843 0%, #6f1539 22%, #5c122f 48%, #400d21 78%, #2d0917 100%)',
    accent: '#ec4899',
    lime: '#f9a8d4',
    neonBorder: '#fbcfe8',
    darkBg: '#831843',
    subtitleColor: '#fbcfe8',
    subtitleColorLight: '#831843',
    ctaBg: '#831843',
    ctaText: '#f9a8d4',
    accentGradient: 'linear-gradient(135deg,#ec4899,#831843)',
    gridLineColor: 'rgba(236,72,153,0.04)',
    separatorColor: '#ec4899',
    b3TextColor: '#831843',
    bgPattern: '',
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    swatch: ['#451a03', '#fbbf24'],
    headerBg: '#fbbf24',
    headerTextColor: '#451a03',
    bgGradient: 'radial-gradient(ellipse at 68% 42%, #451a03 0%, #3b1603 22%, #311202 48%, #220d02 78%, #180901 100%)',
    accent: '#d97706',
    lime: '#fbbf24',
    neonBorder: '#fde68a',
    darkBg: '#451a03',
    subtitleColor: '#fde68a',
    subtitleColorLight: '#451a03',
    ctaBg: '#451a03',
    ctaText: '#fbbf24',
    accentGradient: 'linear-gradient(135deg,#d97706,#451a03)',
    gridLineColor: 'rgba(217,119,6,0.04)',
    separatorColor: '#d97706',
    b3TextColor: '#451a03',
    bgPattern: '',
  },
];

export type BannerData = {
  panelName: string;
  panelTopic: string;
  panelSubtitle?: string;
  eventDate: string;
  eventTime: string;
  websiteUrl: string;
  headerText: string;
  panelistName: string;
  panelistFirstName: string;
  panelistTitle: string;
  panelistOrg: string;
  headshotUrl: string;
  allPanelists: Array<{
    name: string;
    title: string;
    org: string;
    headshotUrl: string;
  }>;
  qrCodeUrl?: string;
  qrCodeUrls?: { B1?: string; B2?: string; B3?: string; B4?: string; B5?: string };
  zoomRegistrationUrl?: string;
  verticalConfig?: VerticalConfig;
  theme?: BannerTheme;
};

export type GeneratedBanner = {
  id: string;
  type: BannerType;
  label: string;
  fileName: string;
  html: string;
  panelistName: string;
};

// ——————————————————————————————————————————————
// Helpers
// ——————————————————————————————————————————————

/** Strip emojis and promotional filler from topic text */
function cleanTopic(topic: string): string {
  return topic
    // Remove emoji characters
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu, '')
    // Remove "Preheader" artifacts from email template data
    .replace(/\s*preheader\s*/gi, '')
    // Remove CTA phrases after dashes: "– Join Our Panel", "– Save Your Seat", "– Register Now"
    .replace(/\s*[–—-]+\s*(?:Join (?:Our|Us|the)|Save Your|Register Now|Sign Up|Don't Miss|RSVP|Reserve Your)[\s\S]*$/i, '')
    // Remove trailing CTA-only sentences (must match full marketing pattern, not topic content)
    .replace(/\.\s*(?:Free live|Join us|Save your seat|Register now|Sign up|Don't miss|RSVP|Limited spots|Click here|Learn more at)[\s\S]*$/i, '')
    // Clean up extra whitespace and trailing punctuation
    .replace(/\s+/g, ' ')
    .replace(/^\s*[.,:;–—-]+\s*/, '')
    .replace(/\s*[.,:;]+\s*$/, '')
    .trim();
}

/** Strip any appended time from eventDate (e.g. "WEDNESDAY, JANUARY 15, 2025 · 8:00 PM" → "WEDNESDAY, JANUARY 15, 2025") */
function cleanDate(dateStr: string): string {
  // Remove everything after · or after a time pattern like "8:00 PM"
  return dateStr.replace(/\s*[·•]\s*\d{1,2}:\d{2}\s*(AM|PM).*/i, '').trim();
}

function ordinalSuffix(d: number): string {
  if (d % 100 >= 11 && d % 100 <= 13) return 'TH';
  if (d % 10 === 1) return 'ST';
  if (d % 10 === 2) return 'ND';
  if (d % 10 === 3) return 'RD';
  return 'TH';
}

/** Convert "WEDNESDAY, JANUARY 15, 2025" → "WEDNESDAY, JANUARY 15TH, 2025" (add ordinal suffix to day only) */
function formatDateOrdinal(dateStr: string): string {
  const clean = cleanDate(dateStr);
  // Match: MONTH_NAME <space> DAY_NUMBER <comma or end>
  // This avoids matching numbers inside times like "8:00"
  return clean.replace(/([A-Za-z]+)\s+(\d{1,2})(,?\s)/g, (_match, month, day, after) => {
    const d = parseInt(day, 10);
    // Only add suffix if month looks like a real month name (3+ alpha chars, not a weekday alone before comma)
    if (month.length >= 3) {
      return `${month} ${day}${ordinalSuffix(d)}${after}`;
    }
    return _match;
  });
}

/** Simplify time range to start time: "8:00 PM – 9:00 PM EST" → "8:00 PM EST" */
function formatTime(timeStr: string): string {
  // Extract just the start time + timezone, dropping the range
  const m = timeStr.match(/^(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\s*[-–].+?(EST|CST|MST|PST|ET|CT|MT|PT)\s*$/i);
  if (m) return `${m[1]} ${m[2]}`;
  return timeStr;
}

/** Format date for B1 (title case): "Wednesday, January 15th, 2025" */
function formatDateTitleCase(dateStr: string): string {
  const ordinal = formatDateOrdinal(dateStr);
  // Title-case each word, but preserve ordinal suffixes (ST, ND, RD, TH) as lowercase
  return ordinal
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/(\d+)(St|Nd|Rd|Th)/g, (_m, num, suf) => `${num}${suf.toLowerCase()}`);
}

function getQrUrl(data: BannerData, bannerType?: BannerType): string {
  // Only show QR if user uploaded one for this specific banner type
  if (bannerType && data.qrCodeUrls?.[bannerType]) {
    return data.qrCodeUrls[bannerType]!;
  }
  return '';
}

function qrPlaceholder(size: number, borderColor: string): string {
  return `<div style="width:${size}px;height:${size}px;border:3px dashed ${borderColor};border-radius:12px;display:flex;align-items:center;justify-content:center;opacity:0.4;">
    <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="none" stroke="${borderColor}" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="4" height="4" rx="0.5"/><line x1="21" y1="14" x2="21" y2="21"/><line x1="14" y1="21" x2="21" y2="21"/></svg>
  </div>`;
}

/** Strip credential suffixes from title (DVM, DDS, MD, JD, MBA, etc.) */
function cleanTitle(title: string): string {
  if (!title) return '';
  // Remove leading credential patterns like "DVM, Founder" → "Founder"
  return title
    .replace(/^(?:Dr\.?\s*)?(?:DVM|DDS|DMD|MD|DO|JD|PhD|MBA|CPA|LE|RN|DACVIM|DACVS|DAVDC|CVT|RVT|LVT|BVSc|BVetMed|MRCVS|FRCVS)\s*[,;]\s*/gi, '')
    .replace(/\s*[,;]\s*(?:DVM|DDS|DMD|MD|DO|JD|PhD|MBA|CPA|LE|RN|DACVIM|DACVS|DAVDC|CVT|RVT|LVT|BVSc|BVetMed|MRCVS|FRCVS)\s*$/gi, '')
    .trim();
}

/** Deduplicate: if panelName and panelTopic are identical or one contains the other, separate them */
function deduplicateFields(data: BannerData): { panelName: string; panelTopic: string; panelSubtitle: string } {
  let name = (data.panelName || '').trim();
  let topic = cleanTopic(data.panelTopic || '');
  let subtitle = data.panelSubtitle ? cleanTopic(data.panelSubtitle) : '';

  const nameLower = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const topicLower = topic.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Case 1: panelName and panelTopic are identical → topic should be the subtitle, subtitle becomes empty
  if (nameLower && topicLower && nameLower === topicLower) {
    if (subtitle) {
      // Shift: topic ← subtitle, subtitle ← empty
      topic = subtitle;
      subtitle = '';
    } else {
      // No subtitle either — show name only, clear topic to avoid duplication
      topic = '';
    }
  }

  // Case 2: panelName contains the topic (e.g. name="Vet Ownership & Leadership Panel", topic="Vet Ownership & Leadership Panel")
  if (nameLower && topicLower && nameLower.includes(topicLower) && nameLower !== topicLower) {
    if (subtitle) {
      topic = subtitle;
      subtitle = '';
    }
  }

  // Case 3: Subtitle duplicates topic
  const subtitleLower = subtitle.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (topicLower && subtitleLower && topicLower === subtitleLower) {
    subtitle = '';
  }

  return { panelName: name, panelTopic: topic, panelSubtitle: subtitle };
}

function getTheme(data: BannerData): BannerTheme {
  return data.theme || BANNER_THEMES[0];
}

function isTwoPanelist(data: BannerData): boolean {
  return (data.allPanelists?.length || 0) <= 2;
}

function getPanelistVariant(data: BannerData): '2P' | '3P' | '4P' {
  const count = data.allPanelists?.length || 0;
  if (count >= 4) return '4P';
  if (count === 3) return '3P';
  return '2P';
}

function uid(): string {
  return Math.random().toString(36).substring(2, 10);
}

// ——————————————————————————————————————————————
// VBI Logo SVG with unique gradient IDs
// ——————————————————————————————————————————————

function vbiLogoSvg(u: string, w = 180, h = 60): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 693.3 232.5" style="enable-background:new 0 0 693.3 232.5;" xml:space="preserve" width="${w}" height="${h}">
<style type="text/css">.st3${u}{fill:#FFFFFF !important}
 .st0${u}{fill:url(#vbiG1_${u});}
 .st1${u}{fill:#FFFFFF;}
 .st2${u}{fill:#C6F800;}
 .st3${u}{fill:#1B1B1B;}
 .st4${u}{fill:url(#SVGID2_${u});}
 .st5${u}{fill:#3BAB00;}
 .st6${u}{fill:url(#vbiG3_${u});}
</style>
<radialGradient id="vbiG1_${u}" cx="124" cy="117.4016" r="113.1734" gradientTransform="matrix(1 0 0 -1 0 232.3638)" gradientUnits="userSpaceOnUse">
 <stop offset="0" style="stop-color:#C6F800"/>
 <stop offset="1" style="stop-color:#3BAB00"/>
</radialGradient>
<path class="st0${u}" d="M137.9,13.8H66.7C29.9,13.8,0,43.6,0,80.4l0,0v135.7h248V13.8H137.9z"/>
<path class="st1${u}" d="M63.1,160.9H45.9L9.4,70h17.2l28,67.9l28-67.9h17.2L63.1,160.9z M155.7,160.9h-39.8V70h35.4 c5.4-0.1,10.8,0.6,15.9,2.2c4.5,1.5,7.8,3.5,10,6c4,4.3,6.2,10,6.1,15.9c0,7.1-2.3,12.4-6.8,15.9c-1.1,0.8-2.2,1.6-3.3,2.3 c-0.6,0.3-1.7,0.8-3.2,1.5c5.2,1,9.9,3.6,13.4,7.6c3.4,4,5.2,9.1,5,14.4c0,6.2-2.3,12.2-6.5,16.8 C176.8,158.1,168.1,160.9,155.7,160.9z M131.2,107.7h19.5c11.1,0,16.6-3.8,16.6-11.3c0-4.3-1.3-7.4-4-9.4c-2.7-1.9-6.8-2.9-12.5-2.8 h-19.6V107.7z M131.2,146.7h24.1c5.6,0,9.9-0.9,12.9-2.7c3-1.8,4.5-5.1,4.5-10.1c0-8.1-6.5-12.1-19.4-12.1h-22.1L131.2,146.7z M210.9,70h15.3v90.9h-15.3V70z"/>
<rect x="267.7" y="0" class="st2${u}" width="6.2" height="232.5"/>
<path class="st3${u}" d="M354.6,7.5L333,57.9h-14L297.5,7.5h15.4l13.7,32.8l14-32.8L354.6,7.5z"/>
<path class="st3${u}" d="M391.3,41.8h-28.4c0.5,1.9,1.7,3.6,3.4,4.6c1.9,1.1,4,1.7,6.2,1.6c1.7,0,3.3-0.2,4.9-0.8 c1.5-0.6,2.9-1.5,4.1-2.6l7.2,7.5c-3.8,4.2-9.3,6.3-16.6,6.3c-4.1,0.1-8.3-0.8-12-2.6c-9.8-4.8-13.8-16.6-9-26.4 c1.8-3.8,4.8-6.8,8.6-8.8c6.8-3.4,14.8-3.5,21.6-0.2c3.1,1.6,5.7,4,7.5,7c1.9,3.3,2.9,7,2.8,10.8C391.5,38.5,391.4,39.7,391.3,41.8z M365.4,29.7c-1.4,1.3-2.4,3-2.7,4.9h16c-0.3-1.9-1.3-3.6-2.7-4.9C372.9,27.3,368.5,27.3,365.4,29.7L365.4,29.7z"/>
<path class="st3${u}" d="M423.3,56.3c-1.3,0.8-2.7,1.3-4.2,1.7c-1.7,0.4-3.5,0.6-5.3,0.6c-5.1,0-9-1.2-11.7-3.7 c-2.7-2.5-4.1-6.2-4.1-11.2V30.5h-5.7V20.3h5.7V10.2h13.7v10.1h8.9v10.2h-8.9v13c-0.1,1.2,0.3,2.4,1.1,3.3c0.8,0.8,1.9,1.2,3,1.2 c1.5,0,2.9-0.4,4.2-1.2L423.3,56.3z"/>
<path class="st3${u}" d="M465.7,41.8h-28.4c0.5,1.9,1.7,3.6,3.4,4.6c1.9,1.1,4,1.7,6.2,1.6c1.7,0,3.3-0.2,4.9-0.8 c1.5-0.6,2.9-1.5,4.1-2.6l7.2,7.5c-3.8,4.2-9.3,6.3-16.6,6.3c-4.1,0.1-8.3-0.8-12-2.6c-9.8-4.8-13.8-16.6-9-26.4 c1.8-3.8,4.8-6.8,8.6-8.8c6.8-3.4,14.8-3.5,21.6-0.2c3.1,1.6,5.7,4,7.5,7c1.9,3.3,2.9,7,2.8,10.8C465.9,38.5,465.8,39.7,465.7,41.8z M439.8,29.7c-1.5,1.3-2.4,3-2.7,4.9h16c-0.3-1.9-1.2-3.6-2.7-4.9C447.3,27.3,443,27.3,439.8,29.7L439.8,29.7z"/>
<path class="st3${u}" d="M489.3,19.6c2.4-0.9,5.1-1.4,7.7-1.3v12.3c-1-0.1-2.1-0.2-3.1-0.2c-2.5-0.2-5,0.7-6.9,2.4 c-1.7,1.6-2.5,4-2.5,7.3v17.9h-13.7v-39h13v4.7C485.3,21.8,487.2,20.4,489.3,19.6z"/>
<path class="st3${u}" d="M502,12.5c-2.9-2.6-3.1-7-0.5-9.9c0.1-0.2,0.3-0.3,0.5-0.5c1.7-1.4,3.8-2.2,6-2.1c2.2-0.1,4.3,0.6,6,2 c1.5,1.2,2.4,3.1,2.3,5.1c0.1,2-0.8,4-2.3,5.4C510.4,15.3,505.4,15.3,502,12.5L502,12.5z M501.2,18.9h13.7v39h-13.7V18.9z"/>
<path class="st3${u}" d="M559.4,22.5c3,2.9,4.4,7.2,4.4,13v22.3h-13.7v-20c0-5.3-2.1-8-6.4-8c-2.1-0.1-4.2,0.7-5.7,2.3 c-1.4,1.5-2.1,3.8-2.1,6.9v18.9h-13.7v-39h13v4.2c1.5-1.6,3.4-2.8,5.5-3.6c2.2-0.9,4.6-1.3,6.9-1.3 C552.5,18.2,556.4,19.7,559.4,22.5z"/>
<path class="st3${u}" d="M602.4,22.6c3.4,3,5.1,7.5,5.1,13.6v21.7h-12.7v-5c-2,3.8-5.8,5.7-11.5,5.7c-2.7,0.1-5.4-0.5-7.8-1.6 c-2-0.9-3.8-2.4-5-4.3c-1.1-1.8-1.7-4-1.7-6.2c-0.1-3.4,1.5-6.6,4.2-8.6c2.8-2,7.2-3.1,13.1-3.1h7.8c-0.2-4.1-3-6.2-8.3-6.2 c-1.9,0-3.8,0.3-5.7,0.9c-1.8,0.5-3.4,1.4-4.9,2.5l-4.6-9.3c2.4-1.6,5.1-2.7,7.9-3.4c3-0.8,6.2-1.2,9.3-1.2 C594.1,18.2,599,19.7,602.4,22.6z M591.3,48.7c1.2-0.8,2.1-2,2.6-3.4V42H588c-4,0-6,1.3-6,4c0,1.1,0.5,2.2,1.4,2.9 c1.1,0.8,2.4,1.2,3.8,1.1C588.6,50,590,49.5,591.3,48.7z"/>
<path class="st3${u}" d="M632.2,19.6c2.4-0.9,5.1-1.4,7.7-1.3v12.3c-1-0.1-2.1-0.2-3.1-0.2c-2.5-0.2-5,0.7-6.9,2.4 c-1.7,1.6-2.5,4-2.5,7.3v17.9h-13.7v-39h13v4.7C628.2,21.8,630.1,20.4,632.2,19.6z"/>
<path class="st3${u}" d="M688.6,18.9l-16.8,40.6c-2,4.8-4.4,8.2-7.2,10.1c-3.1,2-6.7,3-10.4,2.9c-2.1,0-4.2-0.4-6.2-1 c-1.8-0.5-3.6-1.4-5.1-2.6l4.8-9.6c0.8,0.7,1.7,1.3,2.8,1.7c1,0.4,2.2,0.6,3.3,0.6c1.1,0,2.2-0.2,3.2-0.8c0.9-0.6,1.7-1.5,2.1-2.5 l-16.7-39.5h14l9.6,23.8l9.6-23.8H688.6z"/>
<path class="st3${u}" d="M343,108.3c1.7,2.2,2.5,5,2.5,7.7c0.1,4.1-1.9,8-5.3,10.2c-3.5,2.4-8.7,3.6-15.4,3.6h-27.2V79.4h25.8 c6.4,0,11.3,1.2,14.7,3.6c3.2,2.1,5.1,5.8,5,9.6c0,2.3-0.6,4.5-1.8,6.4c-1.2,1.9-2.9,3.5-5,4.5C338.9,104.4,341.2,106.1,343,108.3z M311.6,89.8v9.7h9.8c4.8,0,7.2-1.6,7.2-4.9c0-3.3-2.4-4.9-7.2-4.8H311.6z M331,114.5c0-3.4-2.5-5.1-7.5-5.1h-12v10.2h12 C328.5,119.6,331,117.9,331,114.5L331,114.5z"/>
<path class="st3${u}" d="M400,90.9v39h-13v-4.2c-1.4,1.6-3.2,2.8-5.2,3.6c-2,0.8-4.2,1.2-6.4,1.2c-5,0-9.1-1.5-12.1-4.5 c-3-3-4.5-7.4-4.5-13.4V90.9h13.7v19.6c0,2.9,0.6,5.1,1.7,6.4c1.2,1.4,3,2.1,4.8,2c2,0.1,3.9-0.8,5.3-2.3c1.4-1.5,2.1-3.8,2-7V90.9 H400z"/>
<path class="st3${u}" d="M421.1,129.4c-2.7-0.6-5.3-1.5-7.6-2.9l4.1-9.4c2,1.2,4.1,2.1,6.3,2.6c2.4,0.6,4.8,1,7.3,1 c1.6,0.1,3.2-0.1,4.7-0.7c0.8-0.3,1.4-1.1,1.4-2c0-0.9-0.6-1.5-1.7-1.8c-1.7-0.5-3.5-0.8-5.3-1c-2.7-0.3-5.3-0.8-8-1.5 c-2.2-0.6-4.1-1.8-5.7-3.4c-1.7-2-2.5-4.5-2.4-7.1c0-2.4,0.8-4.8,2.2-6.7c1.7-2.1,4-3.7,6.5-4.6c3.3-1.2,6.7-1.8,10.2-1.7 c2.8,0,5.7,0.3,8.4,0.9c2.4,0.5,4.8,1.3,7,2.4l-4.1,9.3c-3.4-1.9-7.3-2.9-11.2-2.9c-1.6-0.1-3.2,0.2-4.8,0.8c-0.9,0.3-1.5,1.1-1.5,2 c0,0.9,0.5,1.5,1.7,1.9c1.8,0.5,3.6,0.9,5.5,1.1c2.7,0.4,5.4,0.9,8,1.7c2.1,0.6,4,1.8,5.5,3.4c1.7,1.9,2.5,4.4,2.3,6.9 c0,2.4-0.8,4.7-2.2,6.6c-1.7,2.1-4,3.7-6.6,4.6c-3.4,1.2-6.9,1.7-10.5,1.7C427.5,130.6,424.3,130.2,421.1,129.4z"/>
<path class="st3${u}" d="M464.5,84.4c-2.9-2.6-3.1-7-0.5-9.9c0.2-0.2,0.3-0.3,0.5-0.5c1.7-1.4,3.8-2.2,6-2.1c2.2-0.1,4.3,0.6,6,2 c1.5,1.3,2.3,3.1,2.3,5.1c0,2-0.8,4-2.3,5.4c-1.7,1.5-3.8,2.2-6,2.1C468.3,86.6,466.2,85.9,464.5,84.4z M463.7,90.9h13.7v39h-13.7 L463.7,90.9z"/>
<path class="st3${u}" d="M531.1,94.5c3,2.9,4.4,7.2,4.4,13v22.3h-13.7v-20.1c0-5.3-2.1-8-6.4-8c-2.1-0.1-4.2,0.7-5.7,2.3 c-1.4,1.5-2.1,3.9-2.1,6.9v18.9H494v-39h13v4.2c1.5-1.6,3.4-2.8,5.5-3.6c2.2-0.9,4.5-1.3,6.9-1.3C524.3,90.2,528.2,91.7,531.1,94.5z"/>
<path class="st3${u}" d="M592.1,113.8h-28.4c0.5,1.9,1.7,3.6,3.3,4.6c1.9,1.1,4,1.7,6.2,1.6c1.7,0,3.3-0.2,4.9-0.8 c1.5-0.6,2.9-1.5,4.1-2.6l7.2,7.5c-3.8,4.2-9.3,6.3-16.6,6.3c-4.1,0.1-8.3-0.8-12-2.6c-9.8-4.8-13.8-16.6-9-26.4 c1.8-3.7,4.8-6.8,8.5-8.7c6.8-3.4,14.8-3.5,21.6-0.2c3.1,1.6,5.7,4,7.5,7c1.9,3.3,2.9,7,2.8,10.8 C592.4,110.5,592.3,111.7,592.1,113.8z M566.3,101.7c-1.5,1.3-2.4,3-2.7,4.9h16c-0.3-1.9-1.2-3.6-2.7-4.9 C573.8,99.3,569.4,99.3,566.3,101.7L566.3,101.7z"/>
<path class="st3${u}" d="M611,129.4c-2.7-0.6-5.3-1.5-7.6-2.9l4.1-9.4c2,1.2,4.1,2.1,6.3,2.6c2.4,0.6,4.8,1,7.3,1 c1.6,0.1,3.2-0.1,4.7-0.7c0.8-0.3,1.4-1.1,1.4-2c0-0.9-0.6-1.5-1.7-1.8c-1.8-0.5-3.5-0.8-5.4-1.1c-2.7-0.3-5.4-0.8-8-1.5 c-2.2-0.6-4.1-1.8-5.7-3.4c-1.7-2-2.5-4.5-2.4-7.1c0-2.4,0.8-4.8,2.2-6.7c1.7-2.1,4-3.7,6.5-4.6c3.3-1.2,6.8-1.8,10.3-1.7 c2.8,0,5.6,0.3,8.4,0.9c2.4,0.5,4.8,1.3,7,2.4l-4.1,9.3c-3.4-1.9-7.3-2.9-11.2-2.9c-1.6-0.1-3.2,0.2-4.8,0.8c-0.9,0.3-1.5,1.1-1.5,2 c0,0.9,0.5,1.5,1.7,1.9c1.8,0.5,3.6,0.9,5.5,1.1c2.7,0.4,5.4,0.9,8,1.7c2.1,0.6,4,1.8,5.5,3.4c1.7,1.9,2.5,4.4,2.3,6.9 c0,2.4-0.8,4.7-2.2,6.6c-1.7,2.1-4,3.7-6.6,4.6c-3.4,1.2-6.9,1.7-10.5,1.7C617.4,130.6,614.2,130.2,611,129.4z"/>
<path class="st3${u}" d="M659.6,129.4c-2.7-0.6-5.3-1.5-7.6-2.9l4.1-9.4c2,1.2,4.1,2.1,6.3,2.6c2.4,0.6,4.8,1,7.3,1 c1.6,0.1,3.2-0.1,4.7-0.7c0.8-0.3,1.4-1.1,1.4-2c0-0.9-0.6-1.5-1.7-1.8c-1.8-0.5-3.6-0.8-5.4-1c-2.7-0.3-5.4-0.8-8-1.5 c-2.2-0.6-4.1-1.8-5.7-3.4c-1.7-2-2.5-4.5-2.4-7.1c0-2.4,0.8-4.8,2.2-6.7c1.7-2.1,4-3.7,6.5-4.6c3.3-1.2,6.8-1.8,10.3-1.7 c2.8,0,5.6,0.3,8.4,0.9c2.4,0.5,4.8,1.3,7,2.4l-4.1,9.3c-3.4-1.9-7.3-2.9-11.2-2.9c-1.6-0.1-3.2,0.2-4.8,0.8c-0.9,0.3-1.5,1.1-1.5,2 c0,0.9,0.5,1.5,1.7,1.9c1.8,0.5,3.6,0.9,5.5,1.1c2.7,0.4,5.4,0.9,8,1.7c2.1,0.6,4,1.8,5.5,3.4c1.7,1.9,2.5,4.4,2.3,6.9 c0,2.4-0.8,4.7-2.2,6.6c-1.7,2.1-4,3.7-6.6,4.6c-3.4,1.2-6.9,1.7-10.5,1.6C666.1,130.5,662.8,130.2,659.6,129.4z"/>
<radialGradient id="SVGID2_${u}" cx="587.11" cy="57.2666" r="21.6713" gradientTransform="matrix(1 0 0 -1 0 232.3638)" gradientUnits="userSpaceOnUse">
 <stop offset="0" style="stop-color:#C6F800"/>
 <stop offset="1" style="stop-color:#3BAB00"/>
</radialGradient>
<path class="st4${u}" d="M595.6,186.2c-0.8,0-1.5-0.7-1.5-1.5l0,0c0-0.8,0.7-1.5,1.5-1.5h7.8V180h-7.8c-0.8,0-1.5-0.7-1.5-1.5l0,0 c0-0.8,0.7-1.5,1.5-1.5h7.8v-3.1h-7.8c-0.9,0-1.5-0.7-1.5-1.5c0,0,0,0,0,0l0,0c0-0.8,0.7-1.5,1.5-1.5h7.8v-3.1h-7.8 c-0.8,0-1.5-0.7-1.5-1.5l0,0c0-0.8,0.7-1.5,1.5-1.5h7.7c-0.4-8.6-7.5-15.4-16.1-15.4H587c-8.5,0-15.6,6.6-16.1,15.1h7.9 c0.9,0,1.5,0.7,1.5,1.5l0,0c0,0.9-0.7,1.5-1.5,1.5h-8v3.1h8c0.9,0,1.5,0.7,1.5,1.5l0,0c0,0.9-0.7,1.5-1.5,1.5h-8v3.1h8 c0.9,0,1.5,0.7,1.5,1.6c0,0,0,0,0,0l0,0c0,0.9-0.7,1.5-1.5,1.5h-8v3.1h8c0.9,0,1.5,0.7,1.5,1.5l0,0c0,0.9-0.7,1.5-1.5,1.5h-7.9 c0.5,8.5,7.6,15.1,16.1,15.1h0.4c8.4,0,15.4-6.5,16.1-14.9L595.6,186.2"/>
<path class="st5${u}" d="M592.8,209.9v-0.5c10.9-2.5,18.6-12.2,18.6-23.4v-6.3c0-1.1-0.9-2-2-2l0,0c-1.1,0-2,0.9-2,2v6.4 c0,9.2-6.2,17.1-15.1,19.4c-0.5-0.9-1.5-1.5-2.6-1.5h-5.3c-1.1,0-2,0.5-2.6,1.5c-8.9-2.3-15.1-10.3-15.1-19.5v-6.3 c0-1.1-0.9-1.9-1.9-1.9c0,0,0,0,0,0l0,0c-1.1,0-2,0.9-2,2v6.4c0,11.1,7.7,20.8,18.6,23.3v0.5c0,1.4,1,2.7,2.4,3v2.9h-0.4 c-1.1,0-2,0.9-2,2l0,0c0,1.1,0.9,2,2,2h0.4v6.1h-13.2c-1.8,0-3.2,1.4-3.2,3.2c0,0,0,0,0,0v0c0,1.8,1.5,3.2,3.2,3.2c0,0,0,0,0,0h33.1 c1.8,0,3.2-1.4,3.2-3.2v-0.1c0-1.8-1.5-3.2-3.2-3.2h-13.3v-6.1h0.4c1.1,0,2-0.9,2-2l0,0c0-1.1-0.9-2-2-2h-0.4v-2.9 C591.8,212.6,592.8,211.4,592.8,209.9z"/>
<path class="st5${u}" d="M686.6,207.2L686.6,207.2c-1.1,0-2-0.9-2-2v-29c0-1.1,0.9-2,2-2l0,0c1.1,0,2,0.9,2,2v29 C688.6,206.3,687.7,207.2,686.6,207.2 M622,224.6c1.1,0,2-0.9,2-2v-63.6c0-1.1-0.9-2-2-2l0,0c-1.1,0-2,0.9-2,2v63.6 C620,223.7,620.9,224.6,622,224.6L622,224.6 M630,218.6L630,218.6c-1.1,0-2-0.9-2-2V165c0-1.1,0.9-2,2-2l0,0c1.1,0,2,0.9,2,2v51.6 C632,217.7,631.1,218.6,630,218.6 M638.1,212.4L638.1,212.4c-1.1,0-2-0.9-2-2v-39.3c0-1.1,0.9-2,2-2l0,0c1.1,0,2,0.9,2,2v39.3 C640.1,211.5,639.2,212.4,638.1,212.4 M646.2,207.2L646.2,207.2c-1.1,0-2-0.9-2-2v-29c0-1.1,0.9-2,2-2l0,0c1.1,0,2,0.9,2,2v29 C648.2,206.3,647.3,207.2,646.2,207.2 M654.3,218.5L654.3,218.5c-1.1,0-2-0.9-2-2V165c0-1.1,0.9-2,2-2l0,0c1.1,0,2,0.9,2,2v51.6 C656.3,217.7,655.4,218.6,654.3,218.5 M662.4,212.4L662.4,212.4c-1.1,0-2-0.9-2-2v-39.3c0-1.1,0.9-2,2-2l0,0c1.1,0,2,0.9,2,2v39.3 C664.4,211.5,663.5,212.4,662.4,212.4 M670.5,225.7L670.5,225.7c-1.1,0-2-0.9-2-2v-65.9c0-1.1,0.9-2,2-2l0,0c1.1,0,2,0.9,2,2v65.9 C672.5,224.8,671.6,225.7,670.5,225.7 M678.5,218.5L678.5,218.5c-1.1,0-2-0.9-2-2V165c0-1.1,0.9-2,2-2l0,0c1.1,0,2,0.9,2,2v51.6 C680.5,217.7,679.6,218.6,678.5,218.5"/>
<radialGradient id="vbiG3_${u}" cx="422.075" cy="41.6066" r="92.8986" gradientTransform="matrix(1 0 0 -1 0 232.3638)" gradientUnits="userSpaceOnUse">
 <stop offset="0" style="stop-color:#C6F800"/>
 <stop offset="1" style="stop-color:#3BAB00"/>
</radialGradient>
<path class="st6${u}" d="M305.1,191.1v-0.7c0-18.6,15.1-33.7,33.7-33.6h204c2.1,0,3.8-1.7,3.8-3.8v-0.1c0-2.1-1.7-3.8-3.8-3.8H338.3 c-22.5,0-40.8,18.2-40.8,40.8v0v1.8c0,22.5,18.3,40.8,40.8,40.8c0,0,0,0,0,0h204.5c2.1,0,3.8-1.7,3.8-3.8v-0.1 c0-2.1-1.7-3.8-3.8-3.8h-204C320.2,224.8,305.2,209.7,305.1,191.1L305.1,191.1"/>
<path class="st5${u}" d="M326.4,175.9h11.2c7.9,0,13.1,4.2,13.1,10.7s-5.2,10.9-13.1,10.9h-3.3v9.4h-8L326.4,175.9z M334.4,182.9v7.6 h3.9c2,0.2,3.8-1.4,4-3.4c0-0.1,0-0.3,0-0.4c0-2.2-1.6-3.7-4-3.7H334.4z"/>
<path class="st5${u}" d="M387.5,191.4c0,9-7.3,16.2-16.2,16.2c-9,0-16.2-7.3-16.2-16.2c0-9,7.3-16.2,16.2-16.2c0,0,0,0,0,0 C380.2,175.2,387.5,182.4,387.5,191.4z M378.9,191.4c0-4.5-3.4-8.3-7.7-8.3c-4.4,0.1-7.8,3.8-7.7,8.2c0,0,0,0,0,0 c0,4.5,3.4,8.2,7.7,8.2C375.6,199.4,379,195.7,378.9,191.4z"/>
<path class="st5${u}" d="M394.2,175.9h11.2c10.1,0,17.5,6.6,17.5,15.5s-7.4,15.4-17.5,15.4h-11.2V175.9z M402.4,183.3v16h2.9 c5.5,0,9.1-3.2,9.1-8s-3.6-8-9.1-8H402.4z"/>
<path class="st5${u}" d="M450.9,185.8c-1.7-1.7-4-2.7-6.5-2.7c-4.2,0-7.6,3.7-7.6,8.2c-0.1,4.4,3.3,8.1,7.7,8.2c0.1,0,0.2,0,0.3,0 c2.3,0,4.5-1,6.1-2.7l5.3,5.9c-2.6,3.1-6.5,4.8-11.9,4.8c-8.8,0-16-7.1-16-15.9c0-0.1,0-0.2,0-0.4c0-8.9,7.1-16.1,16-16.2 c5.6,0,9.4,1.8,11.9,4.6L450.9,185.8z"/>
<path class="st5${u}" d="M481.9,201h-12.1l-2.1,5.8h-8.4l12.1-30.9h9.4l12.1,30.9H484L481.9,201z M475.9,184.3l-3.5,9.6h7L475.9,184.3z"/>
<path class="st5${u}" d="M515.7,186.2c-1.5-2.2-4.1-3.5-6.8-3.6c-2,0-3,0.8-3,1.9c0,4,15.1,2.2,15.1,13c0,5.7-5.1,10-12.4,10 c-7,0-10.6-2.8-12.5-5.8l5.7-5.3c1.6,2.3,4.2,3.7,7,3.6c2.4,0,3.7-0.8,3.7-2.2c0-4.2-15.1-2.2-15.1-13.1c0-5.5,5-9.6,11.8-9.6 c5.4,0,9.5,2.3,11.8,5.6L515.7,186.2z"/>
<path class="st5${u}" d="M541.6,183.3v23.5h-8v-23.5h-8.4v-7.5h24.9v7.5H541.6z"/>
</svg>`;
}

// ——————————————————————————————————————————————
// Vet background overlays (from master templates)
// ——————————————————————————————————————————————

/** 2P vet background (B1 style - grid layout) */
const VET_BG_2P_B1 = `<div style="position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden;">
  <svg width="1080" height="1080" viewBox="0 0 1080 1080" style="position:absolute;inset:0;">
    <g transform="translate(80,250) rotate(-15)" opacity="0.1"><ellipse cx="0" cy="-22" rx="10" ry="14" fill="white"/><ellipse cx="22" cy="-30" rx="9" ry="13" fill="white"/><ellipse cx="44" cy="-22" rx="10" ry="14" fill="white"/><ellipse cx="22" cy="8" rx="18" ry="16" fill="white"/><ellipse cx="8" cy="-6" rx="7" ry="10" fill="white"/><ellipse cx="36" cy="-6" rx="7" ry="10" fill="white"/></g>
    <g transform="translate(920,400) rotate(20)" opacity="0.06"><ellipse cx="0" cy="-22" rx="10" ry="14" fill="white"/><ellipse cx="22" cy="-30" rx="9" ry="13" fill="white"/><ellipse cx="44" cy="-22" rx="10" ry="14" fill="white"/><ellipse cx="22" cy="8" rx="18" ry="16" fill="white"/></g>
    <g transform="translate(150,600) rotate(35) scale(0.7)" opacity="0.08"><ellipse cx="0" cy="-22" rx="10" ry="14" fill="white"/><ellipse cx="22" cy="-30" rx="9" ry="13" fill="white"/><ellipse cx="44" cy="-22" rx="10" ry="14" fill="white"/><ellipse cx="22" cy="8" rx="18" ry="16" fill="white"/></g>
  </svg>
</div>`;

/** 2P/3P vet background (flex-column layout style) */
const VET_BG_FLEX = `<div style="position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden;">
  <svg width="1080" height="1080" viewBox="0 0 1080 1080" style="position:absolute;inset:0;">
    <g transform="translate(80,180) rotate(-15)" opacity="0.12"><ellipse cx="0" cy="-22" rx="10" ry="14" fill="white"/><ellipse cx="22" cy="-30" rx="9" ry="13" fill="white"/><ellipse cx="44" cy="-22" rx="10" ry="14" fill="white"/><ellipse cx="22" cy="8" rx="18" ry="16" fill="white"/><ellipse cx="8" cy="-6" rx="7" ry="10" fill="white"/><ellipse cx="36" cy="-6" rx="7" ry="10" fill="white"/></g>
    <g transform="translate(920,320) rotate(20)" opacity="0.08"><ellipse cx="0" cy="-22" rx="10" ry="14" fill="white"/><ellipse cx="22" cy="-30" rx="9" ry="13" fill="white"/><ellipse cx="44" cy="-22" rx="10" ry="14" fill="white"/><ellipse cx="22" cy="8" rx="18" ry="16" fill="white"/></g>
    <g transform="translate(500,800) rotate(-30) scale(0.9)" opacity="0.1"><ellipse cx="0" cy="-22" rx="10" ry="14" fill="white"/><ellipse cx="22" cy="-30" rx="9" ry="13" fill="white"/><ellipse cx="44" cy="-22" rx="10" ry="14" fill="white"/><ellipse cx="22" cy="8" rx="18" ry="16" fill="white"/></g>
    <g transform="translate(850,700) rotate(-25)" opacity="0.08"><rect x="-28" y="-6" width="56" height="12" rx="4" fill="white"/><circle cx="-28" cy="-6" r="9" fill="white"/><circle cx="-28" cy="6" r="9" fill="white"/><circle cx="28" cy="-6" r="9" fill="white"/><circle cx="28" cy="6" r="9" fill="white"/></g>
    <g transform="translate(150,550) rotate(35) scale(0.7)" opacity="0.08"><ellipse cx="0" cy="-22" rx="10" ry="14" fill="white"/><ellipse cx="22" cy="-30" rx="9" ry="13" fill="white"/><ellipse cx="44" cy="-22" rx="10" ry="14" fill="white"/><ellipse cx="22" cy="8" rx="18" ry="16" fill="white"/></g>
  </svg>
</div>`;

// ——————————————————————————————————————————————
// Per-vertical background SVG helpers
// ——————————————————————————————————————————————

/** Dominate Law: gavel watermark icons */
const LAW_BG_B1 = `<div style="position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden;">
  <svg width="1080" height="1080" viewBox="0 0 1080 1080" style="position:absolute;inset:0;">
    <g transform="translate(80,250) rotate(-15)" opacity="0.08"><rect x="-20" y="-8" width="40" height="16" rx="4" fill="#C8A74E"/><rect x="-6" y="8" width="12" height="30" rx="3" fill="#C8A74E"/><rect x="-22" y="38" width="44" height="8" rx="2" fill="#C8A74E"/></g>
    <g transform="translate(920,400) rotate(20)" opacity="0.06"><rect x="-20" y="-8" width="40" height="16" rx="4" fill="#C8A74E"/><rect x="-6" y="8" width="12" height="30" rx="3" fill="#C8A74E"/><rect x="-22" y="38" width="44" height="8" rx="2" fill="#C8A74E"/></g>
    <g transform="translate(150,600) rotate(35) scale(0.7)" opacity="0.07"><rect x="-20" y="-8" width="40" height="16" rx="4" fill="#C8A74E"/><rect x="-6" y="8" width="12" height="30" rx="3" fill="#C8A74E"/><rect x="-22" y="38" width="44" height="8" rx="2" fill="#C8A74E"/></g>
  </svg>
</div>`;

const LAW_BG_FLEX = `<div style="position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden;">
  <svg width="1080" height="1080" viewBox="0 0 1080 1080" style="position:absolute;inset:0;">
    <g transform="translate(80,180) rotate(-15)" opacity="0.1"><rect x="-20" y="-8" width="40" height="16" rx="4" fill="#C8A74E"/><rect x="-6" y="8" width="12" height="30" rx="3" fill="#C8A74E"/><rect x="-22" y="38" width="44" height="8" rx="2" fill="#C8A74E"/></g>
    <g transform="translate(920,320) rotate(20)" opacity="0.07"><rect x="-20" y="-8" width="40" height="16" rx="4" fill="#C8A74E"/><rect x="-6" y="8" width="12" height="30" rx="3" fill="#C8A74E"/><rect x="-22" y="38" width="44" height="8" rx="2" fill="#C8A74E"/></g>
    <g transform="translate(500,800) rotate(-30) scale(0.9)" opacity="0.08"><rect x="-20" y="-8" width="40" height="16" rx="4" fill="#C8A74E"/><rect x="-6" y="8" width="12" height="30" rx="3" fill="#C8A74E"/><rect x="-22" y="38" width="44" height="8" rx="2" fill="#C8A74E"/></g>
    <g transform="translate(850,700) rotate(-25)" opacity="0.07"><rect x="-20" y="-8" width="40" height="16" rx="4" fill="#C8A74E"/><rect x="-6" y="8" width="12" height="30" rx="3" fill="#C8A74E"/><rect x="-22" y="38" width="44" height="8" rx="2" fill="#C8A74E"/></g>
    <g transform="translate(150,550) rotate(35) scale(0.7)" opacity="0.07"><rect x="-20" y="-8" width="40" height="16" rx="4" fill="#C8A74E"/><rect x="-6" y="8" width="12" height="30" rx="3" fill="#C8A74E"/><rect x="-22" y="38" width="44" height="8" rx="2" fill="#C8A74E"/></g>
  </svg>
</div>`;

/** Thriving Dentist: molar + dental mirror watermark icons (clinical style) */
const TD_BG_B1 = `<div style="position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden;">
  <svg width="1080" height="1080" viewBox="0 0 1080 1080" style="position:absolute;inset:0;">
    <g transform="translate(95,180) rotate(-12) scale(2.2)" opacity="0.055">
      <rect x="-18" y="-22" width="36" height="26" rx="7" fill="#106EEA"/>
      <ellipse cx="-9" cy="11" rx="6" ry="12" fill="#106EEA"/>
      <ellipse cx="9" cy="11" rx="6" ry="12" fill="#106EEA"/>
    </g>
    <g transform="translate(960,240) rotate(28)" opacity="0.045">
      <circle cx="0" cy="0" r="20" fill="none" stroke="#106EEA" stroke-width="5"/>
      <rect x="-3" y="20" width="6" height="34" rx="3" fill="#106EEA"/>
    </g>
    <g transform="translate(62,590) rotate(22) scale(1.7)" opacity="0.04">
      <rect x="-18" y="-22" width="36" height="26" rx="7" fill="#106EEA"/>
      <ellipse cx="-9" cy="11" rx="6" ry="12" fill="#106EEA"/>
      <ellipse cx="9" cy="11" rx="6" ry="12" fill="#106EEA"/>
    </g>
  </svg>
</div>`;

const TD_BG_FLEX = `<div style="position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden;">
  <svg width="1080" height="1080" viewBox="0 0 1080 1080" style="position:absolute;inset:0;">
    <g transform="translate(95,140) rotate(-12) scale(2.2)" opacity="0.055">
      <rect x="-18" y="-22" width="36" height="26" rx="7" fill="#106EEA"/>
      <ellipse cx="-9" cy="11" rx="6" ry="12" fill="#106EEA"/>
      <ellipse cx="9" cy="11" rx="6" ry="12" fill="#106EEA"/>
    </g>
    <g transform="translate(960,240) rotate(28)" opacity="0.045">
      <circle cx="0" cy="0" r="20" fill="none" stroke="#106EEA" stroke-width="5"/>
      <rect x="-3" y="20" width="6" height="34" rx="3" fill="#106EEA"/>
    </g>
    <g transform="translate(62,550) rotate(22) scale(1.7)" opacity="0.04">
      <rect x="-18" y="-22" width="36" height="26" rx="7" fill="#106EEA"/>
      <ellipse cx="-9" cy="11" rx="6" ry="12" fill="#106EEA"/>
      <ellipse cx="9" cy="11" rx="6" ry="12" fill="#106EEA"/>
    </g>
    <g transform="translate(988,800) rotate(-22) scale(1.3)" opacity="0.05">
      <circle cx="0" cy="0" r="20" fill="none" stroke="#106EEA" stroke-width="5"/>
      <rect x="-3" y="20" width="6" height="34" rx="3" fill="#106EEA"/>
    </g>
    <g transform="translate(515,946) rotate(-7) scale(1.9)" opacity="0.04">
      <rect x="-18" y="-22" width="36" height="26" rx="7" fill="#106EEA"/>
      <ellipse cx="-9" cy="11" rx="6" ry="12" fill="#106EEA"/>
      <ellipse cx="9" cy="11" rx="6" ry="12" fill="#106EEA"/>
    </g>
  </svg>
</div>`;

/** Business of Aesthetics: syringe/sparkle watermark icons */
const AESTHETICS_BG_B1 = `<div style="position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden;">
  <svg width="1080" height="1080" viewBox="0 0 1080 1080" style="position:absolute;inset:0;">
    <g transform="translate(80,250) rotate(-15)" opacity="0.08"><rect x="-4" y="-25" width="8" height="40" rx="3" fill="white"/><rect x="-10" y="-15" width="20" height="4" rx="1" fill="white"/><rect x="-10" y="-7" width="20" height="4" rx="1" fill="white"/><rect x="-10" y="1" width="20" height="4" rx="1" fill="white"/><polygon points="-5,15 5,15 0,25" fill="white"/></g>
    <g transform="translate(920,400) rotate(20)" opacity="0.06"><path d="M0,-28 L4,-4 L28,0 L4,4 L0,28 L-4,4 L-28,0 L-4,-4 Z" fill="white"/></g>
    <g transform="translate(150,600) rotate(35) scale(0.7)" opacity="0.07"><rect x="-4" y="-25" width="8" height="40" rx="3" fill="white"/><rect x="-10" y="-15" width="20" height="4" rx="1" fill="white"/><rect x="-10" y="-7" width="20" height="4" rx="1" fill="white"/><polygon points="-5,15 5,15 0,25" fill="white"/></g>
  </svg>
</div>`;

const AESTHETICS_BG_FLEX = `<div style="position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden;">
  <svg width="1080" height="1080" viewBox="0 0 1080 1080" style="position:absolute;inset:0;">
    <g transform="translate(80,180) rotate(-15)" opacity="0.1"><rect x="-4" y="-25" width="8" height="40" rx="3" fill="white"/><rect x="-10" y="-15" width="20" height="4" rx="1" fill="white"/><rect x="-10" y="-7" width="20" height="4" rx="1" fill="white"/><rect x="-10" y="1" width="20" height="4" rx="1" fill="white"/><polygon points="-5,15 5,15 0,25" fill="white"/></g>
    <g transform="translate(920,320) rotate(20)" opacity="0.06"><path d="M0,-28 L4,-4 L28,0 L4,4 L0,28 L-4,4 L-28,0 L-4,-4 Z" fill="white"/></g>
    <g transform="translate(500,800) rotate(-30) scale(0.9)" opacity="0.08"><rect x="-4" y="-25" width="8" height="40" rx="3" fill="white"/><rect x="-10" y="-15" width="20" height="4" rx="1" fill="white"/><polygon points="-5,15 5,15 0,25" fill="white"/></g>
    <g transform="translate(850,700) rotate(-25)" opacity="0.06"><path d="M0,-28 L4,-4 L28,0 L4,4 L0,28 L-4,4 L-28,0 L-4,-4 Z" fill="white"/></g>
    <g transform="translate(150,550) rotate(35) scale(0.7)" opacity="0.07"><rect x="-4" y="-25" width="8" height="40" rx="3" fill="white"/><rect x="-10" y="-15" width="20" height="4" rx="1" fill="white"/><polygon points="-5,15 5,15 0,25" fill="white"/></g>
  </svg>
</div>`;

/** Returns the correct institute logo SVG for the current vertical, with unique gradient IDs */
function getLogoSvg(data: BannerData, u: string, w = 180, h = 60): string {
  const vc = data.verticalConfig;
  // For vet (or no vertical), use the full-detail VBI logo
  if (!vc || vc.id === 'vet') return vbiLogoSvg(u, w, h);

  // For custom verticals, use the real brand logo images (base64 embedded)
  const logoMap: Record<string, string> = {
    'thriving-dentist': TD_LOGO_DATA_URI,
    'dominate-law': DL_LOGO_DATA_URI,
    'aesthetics': BOA_LOGO_DATA_URI,
  };

  const logoUri = logoMap[vc.id];
  if (logoUri) {
    return `<div style="background:rgba(255,255,255,0.92);border-radius:8px;padding:6px 12px;display:inline-block;">
      <img src="${logoUri}" style="width:${w - 24}px;height:auto;max-height:${h - 12}px;object-fit:contain;display:block;" crossorigin="anonymous">
    </div>`;
  }

  // Fallback: generic logo from verticalConfig with unique gradient IDs
  return vc.logoSvg
    .replace(/id="g1_[a-z]+"/g, `id="g1_${u}"`)
    .replace(/url\(#g1_[a-z]+\)/g, `url(#g1_${u})`)
    .replace(/width="\d+"/, `width="${w}"`)
    .replace(/height="\d+"/, `height="${h}"`);
}

/** Returns the original (dark) brand logo for light backgrounds like B3 */
function getLogoDark(data: BannerData, w = 180, h = 60): string {
  const vc = data.verticalConfig;
  const logoMap: Record<string, string> = {
    'thriving-dentist': TD_LOGO_DATA_URI,
    'dominate-law': DL_LOGO_DATA_URI,
    'aesthetics': BOA_LOGO_DATA_URI,
  };
  const logoUri = logoMap[vc?.id || ''];
  if (logoUri) {
    return `<img src="${logoUri}" style="width:${w}px;height:auto;max-height:${h}px;object-fit:contain;" crossorigin="anonymous">`;
  }
  return '';
}

/** Returns the B1-style background watermark SVG based on vertical */
function getBgB1(data: BannerData): string {
  const id = data.verticalConfig?.id;
  if (id === 'thriving-dentist') return TD_BG_B1;
  if (id === 'dominate-law') return LAW_BG_B1;
  if (id === 'aesthetics') return AESTHETICS_BG_B1;
  return VET_BG_2P_B1;
}

/** Returns the flex-layout background watermark SVG based on vertical */
function getBgFlex(data: BannerData): string {
  const id = data.verticalConfig?.id;
  if (id === 'thriving-dentist') return TD_BG_FLEX;
  if (id === 'dominate-law') return LAW_BG_FLEX;
  if (id === 'aesthetics') return AESTHETICS_BG_FLEX;
  return VET_BG_FLEX;
}

// ——————————————————————————————————————————————
// Panelist card renderers
// ——————————————————————————————————————————————

function renderPanelistCard2P(p: { name: string; title: string; org: string; headshotUrl: string }, textColor: string, subtitleColor: string, theme: BannerTheme): string {
  const title = cleanTitle(p.title);
  return `<div style="display:flex;flex-direction:column;align-items:center;flex:1;max-width:460px;">
    <div style="width:320px;height:320px;border-radius:50%;border:8px solid ${theme.accent};overflow:hidden;box-shadow:0 0 0 3px ${theme.neonBorder}40,0 8px 24px rgba(0,0,0,0.4);background:url('${p.headshotUrl}') center 15%/cover no-repeat;">
    </div>
    <div style="font-family:Montserrat,Arial,sans-serif;font-size:32px;font-weight:800;color:${textColor};text-align:center;margin-top:14px;line-height:1.25;max-width:420px;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>
    ${title ? `<div style="font-family:Montserrat,Arial,sans-serif;font-size:22px;font-weight:600;color:${subtitleColor};text-align:center;margin-top:6px;line-height:1.3;max-width:400px;">${title}</div>` : ''}
    ${p.org ? `<div style="font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:500;color:${subtitleColor};text-align:center;margin-top:2px;line-height:1.3;opacity:0.85;max-width:400px;">${p.org}</div>` : ''}
  </div>`;
}

function renderPanelistCard3P(p: { name: string; title: string; org: string; headshotUrl: string }, textColor: string, subtitleColor: string, theme: BannerTheme): string {
  const title = cleanTitle(p.title);
  return `<div style="display:flex;flex-direction:column;align-items:center;flex:1;max-width:340px;">
    <div style="width:270px;height:270px;border-radius:50%;border:8px solid ${theme.accent};overflow:hidden;box-shadow:0 0 0 3px ${theme.neonBorder}40,0 8px 24px rgba(0,0,0,0.4);background:url('${p.headshotUrl}') center 15%/cover no-repeat;">
    </div>
    <div style="font-family:Montserrat,Arial,sans-serif;font-size:28px;font-weight:800;color:${textColor};text-align:center;margin-top:14px;line-height:1.25;max-width:320px;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>
    ${title ? `<div style="font-family:Montserrat,Arial,sans-serif;font-size:20px;font-weight:600;color:${subtitleColor};text-align:center;margin-top:6px;line-height:1.3;max-width:300px;">${title}</div>` : ''}
    ${p.org ? `<div style="font-family:Montserrat,Arial,sans-serif;font-size:16px;font-weight:500;color:${subtitleColor};text-align:center;margin-top:2px;line-height:1.3;opacity:0.85;max-width:300px;">${p.org}</div>` : ''}
  </div>`;
}

function renderPanelistCard4P(p: { name: string; title: string; org: string; headshotUrl: string }, textColor: string, subtitleColor: string, theme: BannerTheme): string {
  const title = cleanTitle(p.title);
  return `<div style="display:flex;flex-direction:column;align-items:center;flex:1;max-width:260px;">
    <div style="width:220px;height:220px;border-radius:50%;border:6px solid ${theme.accent};overflow:hidden;box-shadow:0 0 0 3px ${theme.neonBorder}40,0 8px 24px rgba(0,0,0,0.4);background:url('${p.headshotUrl}') center 15%/cover no-repeat;">
    </div>
    <div style="font-family:Montserrat,Arial,sans-serif;font-size:26px;font-weight:800;color:${textColor};text-align:center;margin-top:12px;line-height:1.25;max-width:240px;overflow:hidden;text-overflow:ellipsis;">${p.name}</div>
    ${title ? `<div style="font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:600;color:${subtitleColor};text-align:center;margin-top:4px;line-height:1.3;max-width:240px;">${title}</div>` : ''}
    ${p.org ? `<div style="font-family:Montserrat,Arial,sans-serif;font-size:15px;font-weight:500;color:${subtitleColor};text-align:center;margin-top:2px;line-height:1.3;opacity:0.85;max-width:240px;">${p.org}</div>` : ''}
  </div>`;
}

// ——————————————————————————————————————————————
// B1 — Intro (per-panelist, text left + photo right, grid layout)
// ——————————————————————————————————————————————

function generateB1(data: BannerData): string {
  const u = uid();
  const t = getTheme(data);
  const qrUrl = getQrUrl(data, 'B1');
  const { panelName: dedupName, panelTopic: dedupTopic, panelSubtitle: dedupSubtitle } = deduplicateFields(data);
  const topic = dedupTopic;
  const subtitle = dedupSubtitle;
  const pTitle = cleanTitle(data.panelistTitle);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
.poster {
  width: 1080px; height: 1080px; margin: 0; padding: 0; overflow: hidden;
  display: grid; grid-template-rows: auto 1fr auto;
  font-family: Montserrat, Arial, sans-serif;
}
</style>
</head><body style="margin:0;padding:0;">
<div class="poster">
  <!-- HEADER -->
  <div style="background:${t.headerBg};padding:18px 32px;text-align:center;">
    <span style="font-size:34px;font-weight:900;color:${t.headerTextColor};letter-spacing:1px;text-transform:uppercase;">${data.headerText}</span>
  </div>

  <!-- MAIN -->
  <div style="background:${t.bgGradient};position:relative;display:grid;grid-template-columns:1fr 430px;padding:28px 40px 20px;">
    <!-- Grid lines overlay -->
    <div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 79px,${t.gridLineColor} 80px),repeating-linear-gradient(90deg,transparent,transparent 79px,${t.gridLineColor} 80px);pointer-events:none;"></div>
    <!-- Radial glow -->
    <div style="position:absolute;right:180px;top:50%;transform:translateY(-50%);width:500px;height:500px;background:radial-gradient(circle,${t.accent}38 0%,transparent 70%);pointer-events:none;"></div>
    <!-- Vertical background watermark -->
    ${getBgB1(data)}

    <!-- LEFT: Text -->
    <div style="display:flex;flex-direction:column;justify-content:center;z-index:3;padding-right:20px;">
      <!-- VBI Logo -->
      <div style="position:absolute;top:20px;right:32px;z-index:5;">${getLogoSvg(data, u, 165, 56)}</div>

      <div style="font-size:22px;font-weight:700;color:${t.lime};margin-bottom:14px;letter-spacing:0.5px;">${dedupName}</div>
      ${topic ? `<div style="font-size:44px;font-weight:900;color:#ffffff;line-height:1.1;margin-bottom:20px;">${topic}</div>` : ''}

      ${subtitle ? `<div style="background:${t.accentGradient};border-radius:20px;padding:24px 32px;max-width:480px;">
        <div style="font-size:30px;font-weight:800;color:#ffffff;line-height:1.2;">${subtitle}</div>
      </div>` : ''}

      <div style="margin-top:32px;">
        <div style="font-size:48px;font-weight:800;color:#ffffff;">${data.panelistName}</div>
        ${pTitle ? `<div style="font-size:30px;font-weight:600;color:${t.subtitleColor};margin-top:8px;">${pTitle}</div>` : ''}
        ${data.panelistOrg ? `<div style="font-size:24px;font-weight:500;color:${t.subtitleColor};margin-top:4px;opacity:0.85;">${data.panelistOrg}</div>` : ''}
      </div>
    </div>

    <!-- RIGHT: Photo -->
    <div style="display:flex;align-items:center;justify-content:center;z-index:3;">
      <div style="position:relative;">
        <!-- Glow behind -->
        <div style="position:absolute;inset:-30px;border-radius:50%;background:radial-gradient(circle,${t.accent}73 0%,transparent 70%);"></div>
        <div style="width:380px;height:380px;border-radius:50%;border:8px solid ${t.accent};overflow:hidden;position:relative;box-shadow:0 0 0 6px ${t.neonBorder}b3,0 0 0 16px ${t.neonBorder}66,0 0 0 26px ${t.neonBorder}40,0 0 0 36px ${t.neonBorder}1f,0 0 60px ${t.neonBorder}66;background:url('${data.headshotUrl}') center 15%/cover no-repeat;">
        </div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div style="background:${t.bgGradient};padding:16px 40px;display:flex;align-items:center;position:relative;min-height:140px;">
    <!-- QR -->
    <div style="position:absolute;left:40px;top:50%;transform:translateY(-50%);text-align:center;z-index:3;">
      ${qrUrl ? `<div style="border:3px solid ${t.accent};border-radius:12px;padding:8px;background:#fff;display:inline-block;">
        <img src="${qrUrl}" style="width:120px;height:120px;display:block;">
      </div>` : qrPlaceholder(120, t.accent)}
    </div>
    <!-- CTA centered -->
    <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:6px;z-index:3;">
      <div style="background:${t.ctaBg};border:2px solid ${t.accent};border-radius:40px;padding:12px 48px;display:inline-block;">
        <span style="font-size:24px;font-weight:900;color:${t.ctaText};">REGISTER NOW</span>
      </div>
      <div style="font-size:30px;font-weight:800;color:#ffffff;">&#128197; ${formatDateTitleCase(data.eventDate)}</div>
      <div style="font-size:26px;font-weight:800;color:${t.lime};">&#128343; ${formatTime(data.eventTime)}</div>
      ${data.websiteUrl ? `<div style="font-size:15px;font-weight:400;color:rgba(255,255,255,0.45);font-family:Arial,sans-serif;">${data.websiteUrl}</div>` : ''}
    </div>
  </div>
</div>
</body></html>`;
}

// ——————————————————————————————————————————————
// B2 — Introduction to Panel 1 (all panelists, dark bg with photos)
// ——————————————————————————————————————————————

function generateB2(data: BannerData): string {
  const u = uid();
  const t = getTheme(data);
  const qrUrl = getQrUrl(data, 'B2');
  const panelists = data.allPanelists || [];
  const { panelName: dedupName, panelTopic: dedupTopic, panelSubtitle: dedupSubtitle } = deduplicateFields(data);

  const variant = getPanelistVariant(data);
  const panelistsHtml = panelists.map(p =>
    variant === '4P' ? renderPanelistCard4P(p, '#ffffff', t.subtitleColor, t) :
    variant === '2P' ? renderPanelistCard2P(p, '#ffffff', t.subtitleColor, t) :
    renderPanelistCard3P(p, '#ffffff', t.subtitleColor, t)
  ).join('');

  const gap = variant === '2P' ? '80px' : '15px';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap" rel="stylesheet">
</head><body style="margin:0;padding:0;">
<div class="poster" style="width:1080px;height:1080px;display:flex;flex-direction:column;overflow:hidden;background:${t.bgGradient};">
  ${getBgFlex(data)}
  <div style="background:${t.headerBg};padding:22px 28px;text-align:center;flex-shrink:0;">
    <span style="font-family:Montserrat,Arial,sans-serif;font-size:32px;font-weight:900;color:${t.headerTextColor};letter-spacing:1px;text-transform:uppercase;">${data.headerText}</span>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;padding:22px 40px 18px;position:relative;">
    <div style="position:absolute;top:20px;right:34px;z-index:5;">${getLogoSvg(data, u, 180, 60)}</div>
    <div style="max-width:700px;">
      <div style="font-family:Montserrat,Arial,sans-serif;font-size:24px;font-weight:700;color:${t.lime};margin-bottom:10px;">${dedupName}</div>
      <div style="font-family:Montserrat,Arial,sans-serif;font-size:40px;font-weight:900;color:#ffffff;line-height:1.15;">${dedupTopic}${dedupSubtitle ? ': ' + dedupSubtitle : ''}</div>
    </div>
    <div style="display:flex;justify-content:center;gap:${gap};flex:1;align-items:center;margin-top:8px;">
      ${panelistsHtml}
    </div>
    <div style="position:relative;display:flex;align-items:center;min-height:155px;padding-top:12px;flex-shrink:0;">
      <div style="position:absolute;left:0;top:50%;transform:translateY(-50%);text-align:center;">
        ${qrUrl ? `<div style="border:4px solid ${t.lime};border-radius:14px;padding:10px;background:#fff;display:inline-block;"><img src="${qrUrl}" style="width:120px;height:120px;display:block;"></div>
        <div style="font-family:Montserrat,sans-serif;font-size:12px;font-weight:800;color:${t.headerTextColor};padding:6px 0;">SCAN HERE</div>` : qrPlaceholder(120, t.lime)}
      </div>
      <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:8px;">
        <div style="background:#ffffff;border-radius:40px;padding:14px 52px;"><span style="font-family:Montserrat,Arial,sans-serif;font-size:24px;font-weight:900;color:${t.darkBg};">REGISTER NOW</span></div>
        <div style="font-family:Montserrat,Arial,sans-serif;font-size:30px;font-weight:900;color:#ffffff;">&#128197; ${formatDateOrdinal(data.eventDate.toUpperCase())}</div>
        <div style="font-family:Montserrat,Arial,sans-serif;font-size:26px;font-weight:800;color:${t.lime};">&#128343; ${formatTime(data.eventTime)}</div>
        ${data.websiteUrl ? `<div style="font-family:Arial,sans-serif;font-size:12px;color:${t.subtitleColor};letter-spacing:1px;">${data.websiteUrl.toUpperCase()}</div>` : ''}
      </div>
    </div>
  </div>
</div></body></html>`;
}

// ——————————————————————————————————————————————
// B3 — Introduction to Panel 2 (all panelists, white panel bg, yellow footer)
// ——————————————————————————————————————————————

function generateB3(data: BannerData): string {
  const u = uid();
  const t = getTheme(data);
  const qrUrl = getQrUrl(data, 'B3');
  const panelists = data.allPanelists || [];
  const { panelName: dedupName, panelTopic: dedupTopic, panelSubtitle: dedupSubtitle } = deduplicateFields(data);

  const variant = getPanelistVariant(data);
  const panelistsHtml = panelists.map(p =>
    variant === '4P' ? renderPanelistCard4P(p, t.b3TextColor, t.subtitleColorLight, t) :
    variant === '2P' ? renderPanelistCard2P(p, t.b3TextColor, t.subtitleColorLight, t) :
    renderPanelistCard3P(p, t.b3TextColor, t.subtitleColorLight, t)
  ).join('');

  const gap = variant === '2P' ? '80px' : '15px';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>.dark-top{background:${t.bgGradient};position:relative;overflow:hidden;}</style>
</head><body style="margin:0;padding:0;">
<div class="poster" style="width:1080px;height:1080px;display:flex;flex-direction:column;overflow:hidden;">
  ${getBgFlex(data)}
  <div class="dark-top" style="flex-shrink:0;padding:20px 36px 24px;position:relative;">
    <div style="position:absolute;top:16px;right:30px;z-index:5;">${getLogoSvg(data, u, 180, 60)}</div>
    <div style="background:${t.headerBg};display:inline-block;padding:6px 20px;border-radius:6px;margin-bottom:12px;">
      <span style="font-family:Montserrat,Arial,sans-serif;font-size:15px;font-weight:800;color:${t.headerTextColor};letter-spacing:1px;text-transform:uppercase;">${data.headerText}</span>
    </div>
    <div style="font-family:Montserrat,Arial,sans-serif;font-size:22px;font-weight:700;color:${t.lime};margin-bottom:10px;">${dedupName}</div>
    <div style="font-family:Montserrat,Arial,sans-serif;font-size:36px;font-weight:900;color:#ffffff;line-height:1.2;max-width:800px;">${dedupTopic}${dedupSubtitle ? ': ' + dedupSubtitle : ''}</div>
  </div>
  <div style="flex:1;background:#ffffff;display:flex;align-items:center;justify-content:center;padding:18px 36px;">
    <div style="display:flex;justify-content:center;gap:${gap};width:100%;">${panelistsHtml}</div>
  </div>
  <div style="background:${t.headerBg};padding:20px 36px;display:flex;align-items:center;position:relative;flex-shrink:0;min-height:155px;">
    <div style="position:absolute;left:36px;top:50%;transform:translateY(-50%);text-align:center;">
      ${qrUrl ? `<div style="border:4px solid ${t.darkBg};border-radius:12px;padding:8px;background:#fff;display:inline-block;"><img src="${qrUrl}" style="width:115px;height:115px;display:block;"></div>
      <div style="font-family:Montserrat,sans-serif;font-size:12px;font-weight:800;color:${t.darkBg};margin-top:6px;">SCAN HERE</div>` : qrPlaceholder(115, t.darkBg)}
    </div>
    <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:8px;">
      <div style="background:${t.ctaBg};border-radius:40px;padding:14px 52px;"><span style="font-family:Montserrat,Arial,sans-serif;font-size:24px;font-weight:900;color:${t.ctaText};">REGISTER NOW</span></div>
      <div style="font-family:Montserrat,Arial,sans-serif;font-size:30px;font-weight:900;color:${t.headerTextColor};">&#128197; ${formatDateOrdinal(data.eventDate.toUpperCase())}</div>
      <div style="font-family:Montserrat,Arial,sans-serif;font-size:26px;font-weight:800;color:${t.darkBg};">&#128343; ${formatTime(data.eventTime)}</div>
      ${data.websiteUrl ? `<div style="font-family:Arial,sans-serif;font-size:12px;color:${t.subtitleColorLight};letter-spacing:1px;">${data.websiteUrl.toUpperCase()}</div>` : ''}
    </div>
  </div>
</div></body></html>`;
}

// ——————————————————————————————————————————————
// B4 — One More Day (per-panelist, countdown layout)
// ——————————————————————————————————————————————

function generateB4(data: BannerData): string {
  const u = uid();
  const t = getTheme(data);
  const qrUrl = getQrUrl(data, 'B4');
  const { panelName: dedupName, panelTopic: dedupTopic, panelSubtitle: dedupSubtitle } = deduplicateFields(data);
  const pTitle = cleanTitle(data.panelistTitle);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap" rel="stylesheet">
</head><body style="margin:0;padding:0;">
<div class="poster" style="width:1080px;height:1080px;display:flex;flex-direction:column;overflow:hidden;background:${t.bgGradient};">
  ${getBgFlex(data)}
  <div style="background:${t.headerBg};padding:20px 28px;text-align:center;flex-shrink:0;">
    <span style="font-family:Montserrat,Arial,sans-serif;font-size:32px;font-weight:900;color:${t.headerTextColor};letter-spacing:1px;text-transform:uppercase;">${data.headerText}</span>
  </div>
  <div style="background:${t.darkBg}66;padding:18px 40px;position:relative;flex-shrink:0;">
    <div style="position:absolute;top:14px;right:32px;">${getLogoSvg(data, u, 180, 60)}</div>
    <div style="font-family:Montserrat,Arial,sans-serif;font-size:22px;font-weight:700;color:${t.lime};margin-bottom:8px;">${dedupName}</div>
    <div style="font-family:Montserrat,Arial,sans-serif;font-size:34px;font-weight:900;color:#ffffff;line-height:1.2;max-width:680px;">${dedupTopic}${dedupSubtitle ? ': ' + dedupSubtitle : ''}</div>
  </div>
  <div style="height:4px;background:linear-gradient(90deg,${t.separatorColor},${t.separatorColor}1a);flex-shrink:0;"></div>
  <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:30px 50px;gap:0;">
    <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:360px;">
      <div style="width:320px;height:320px;border-radius:50%;border:8px solid ${t.accent};overflow:hidden;box-shadow:0 0 0 4px ${t.neonBorder}40,0 16px 48px rgba(0,0,0,0.6);background:url('${data.headshotUrl}') center 15%/cover no-repeat;">
      </div>
      <div style="font-family:Montserrat,Arial,sans-serif;font-size:32px;font-weight:800;color:#ffffff;text-align:center;margin-top:20px;">${data.panelistName}</div>
      ${pTitle ? `<div style="font-family:Montserrat,Arial,sans-serif;font-size:22px;font-weight:600;color:${t.lime};text-align:center;margin-top:8px;">${pTitle}</div>` : ''}
      ${data.panelistOrg ? `<div style="font-family:Montserrat,Arial,sans-serif;font-size:18px;font-weight:500;color:${t.lime};text-align:center;margin-top:4px;opacity:0.85;">${data.panelistOrg}</div>` : ''}
    </div>
    <div style="width:3px;height:320px;background:linear-gradient(180deg,transparent,${t.separatorColor},transparent);margin:0 40px;flex-shrink:0;"></div>
    <div style="display:flex;flex-direction:column;align-items:flex-start;flex-shrink:0;">
      <div style="font-family:Montserrat,Arial,sans-serif;font-size:230px;font-weight:900;color:${t.lime};line-height:0.8;text-shadow:0 0 80px ${t.lime}59,0 4px 24px rgba(0,0,0,0.6);">1</div>
      <div style="font-family:Montserrat,Arial,sans-serif;font-size:64px;font-weight:900;color:#ffffff;line-height:1.05;margin-top:4px;">MORE<br>DAY<br>TO GO</div>
    </div>
  </div>
  <div style="height:4px;background:linear-gradient(90deg,${t.separatorColor}1a,${t.separatorColor},${t.separatorColor}1a);flex-shrink:0;"></div>
  <div style="background:${t.darkBg}80;padding:18px 36px;position:relative;display:flex;align-items:center;flex-shrink:0;min-height:155px;">
    <div style="position:absolute;left:36px;top:50%;transform:translateY(-50%);text-align:center;">
      ${qrUrl ? `<div style="border:3px solid ${t.accent};border-radius:10px;padding:7px;background:#fff;display:inline-block;">
        <img src="${qrUrl}" style="width:110px;height:110px;display:block;">
      </div>
      <div style="font-family:Montserrat,sans-serif;font-size:11px;font-weight:800;color:${t.lime};text-align:center;margin-top:5px;letter-spacing:1px;">SCAN HERE</div>` : qrPlaceholder(110, t.accent)}
    </div>
    <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:8px;">
      <div style="background:${t.headerBg};border-radius:40px;padding:13px 50px;">
        <span style="font-family:Montserrat,Arial,sans-serif;font-size:24px;font-weight:900;color:${t.darkBg};">REGISTER NOW</span>
      </div>
      <div style="font-family:Montserrat,Arial,sans-serif;font-size:30px;font-weight:900;color:#ffffff;">&#128197; ${formatDateOrdinal(data.eventDate.toUpperCase())}</div>
      <div style="font-family:Montserrat,Arial,sans-serif;font-size:26px;font-weight:800;color:${t.lime};">&#128343; ${formatTime(data.eventTime)}</div>
      ${data.websiteUrl ? `<div style="font-family:Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.5);letter-spacing:1px;">${data.websiteUrl.toUpperCase()}</div>` : ''}
    </div>
  </div>
</div></body></html>`;
}

// ——————————————————————————————————————————————
// B5 — Happening Today (all panelists, red dot + urgency)
// ——————————————————————————————————————————————

function generateB5(data: BannerData): string {
  const u = uid();
  const t = getTheme(data);
  const qrUrl = getQrUrl(data, 'B5');
  const panelists = data.allPanelists || [];
  const { panelName: dedupName, panelTopic: dedupTopic, panelSubtitle: dedupSubtitle } = deduplicateFields(data);

  const variant = getPanelistVariant(data);
  const panelistsHtml = panelists.map(p =>
    variant === '4P' ? renderPanelistCard4P(p, '#ffffff', t.lime, t) :
    variant === '2P' ? renderPanelistCard2P(p, '#ffffff', t.lime, t) :
    renderPanelistCard3P(p, '#ffffff', t.lime, t)
  ).join('');

  const gap = variant === '2P' ? '80px' : '15px';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap" rel="stylesheet">
</head><body style="margin:0;padding:0;">
<div class="poster" style="width:1080px;height:1080px;display:flex;flex-direction:column;overflow:hidden;background:${t.bgGradient};">
  ${getBgFlex(data)}
  <div style="background:${t.headerBg};padding:20px 28px;text-align:center;flex-shrink:0;">
    <span style="font-family:Montserrat,Arial,sans-serif;font-size:32px;font-weight:900;color:${t.headerTextColor};letter-spacing:1px;text-transform:uppercase;">${data.headerText}</span>
  </div>
  <div style="background:${t.darkBg}66;padding:16px 40px;position:relative;flex-shrink:0;">
    <div style="position:absolute;top:12px;right:32px;z-index:5;">${getLogoSvg(data, u, 180, 60)}</div>
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:8px;">
      <div style="width:18px;height:18px;border-radius:50%;background:#ff3333;box-shadow:0 0 0 4px rgba(255,51,51,0.3);flex-shrink:0;"></div>
      <div style="font-family:Montserrat,Arial,sans-serif;font-size:42px;font-weight:900;color:${t.lime};letter-spacing:1px;">HAPPENING TODAY!</div>
    </div>
    <div style="font-family:Montserrat,Arial,sans-serif;font-size:24px;font-weight:700;color:#ffffff;">${dedupName}</div>
    <div style="font-family:Montserrat,Arial,sans-serif;font-size:22px;font-weight:600;color:rgba(255,255,255,0.85);max-width:780px;">${dedupTopic}${dedupSubtitle ? ': ' + dedupSubtitle : ''}</div>
  </div>
  <div style="height:4px;background:linear-gradient(90deg,${t.separatorColor},${t.separatorColor}1a);flex-shrink:0;"></div>
  <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:20px 40px;gap:${gap};">
    ${panelistsHtml}
  </div>
  <div style="height:4px;background:linear-gradient(90deg,${t.separatorColor}1a,${t.separatorColor},${t.separatorColor}1a);flex-shrink:0;"></div>
  <div style="background:${t.darkBg}80;padding:18px 36px;position:relative;display:flex;align-items:center;flex-shrink:0;min-height:155px;">
    <div style="position:absolute;left:36px;top:50%;transform:translateY(-50%);text-align:center;">
      ${qrUrl ? `<div style="border:3px solid ${t.accent};border-radius:10px;padding:7px;background:#fff;display:inline-block;">
        <img src="${qrUrl}" style="width:110px;height:110px;display:block;">
      </div>
      <div style="font-family:Montserrat,sans-serif;font-size:11px;font-weight:800;color:${t.lime};text-align:center;margin-top:5px;letter-spacing:1px;">SCAN HERE</div>` : qrPlaceholder(110, t.accent)}
    </div>
    <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:8px;">
      <div style="background:${t.headerBg};border-radius:40px;padding:13px 50px;">
        <span style="font-family:Montserrat,Arial,sans-serif;font-size:24px;font-weight:900;color:${t.darkBg};">REGISTER NOW</span>
      </div>
      <div style="font-family:Montserrat,Arial,sans-serif;font-size:30px;font-weight:900;color:#ffffff;">&#128197; ${formatDateOrdinal(data.eventDate.toUpperCase())}</div>
      <div style="font-family:Montserrat,Arial,sans-serif;font-size:26px;font-weight:800;color:${t.lime};">&#128343; ${formatTime(data.eventTime)}</div>
      ${data.websiteUrl ? `<div style="font-family:Arial,sans-serif;font-size:12px;color:rgba(255,255,255,0.5);letter-spacing:1px;">${data.websiteUrl.toUpperCase()}</div>` : ''}
    </div>
  </div>
</div></body></html>`;
}

// ——————————————————————————————————————————————
// Main export: generate all 5 banners per panelist
// ——————————————————————————————————————————————

export function generateBannersForPanelist(data: BannerData): GeneratedBanner[] {
  const safeName = data.panelistName.replace(/[^a-zA-Z0-9]/g, '_');
  const banners: GeneratedBanner[] = [];

  // The Intro (per-panelist)
  banners.push({
    id: `b1_${safeName}_${uid()}`,
    type: 'B1',
    label: `The Intro - ${data.panelistName}`,
    fileName: `The_Intro_${safeName}`,
    html: generateB1(data),
    panelistName: data.panelistName,
  });

  // Introduction to Panel One (all panelists)
  banners.push({
    id: `b2_${safeName}_${uid()}`,
    type: 'B2',
    label: `Introduction to Panel One - ${data.panelistName}`,
    fileName: `Introduction_to_Panel_One_${safeName}`,
    html: generateB2(data),
    panelistName: data.panelistName,
  });

  // Introduction to Panel Two (all panelists)
  banners.push({
    id: `b3_${safeName}_${uid()}`,
    type: 'B3',
    label: `Introduction to Panel Two - ${data.panelistName}`,
    fileName: `Introduction_to_Panel_Two_${safeName}`,
    html: generateB3(data),
    panelistName: data.panelistName,
  });

  // One More Day (per-panelist)
  banners.push({
    id: `b4_${safeName}_${uid()}`,
    type: 'B4',
    label: `One More Day - ${data.panelistName}`,
    fileName: `One_More_Day_${safeName}`,
    html: generateB4(data),
    panelistName: data.panelistName,
  });

  // Happening Today (all panelists)
  banners.push({
    id: `b5_${safeName}_${uid()}`,
    type: 'B5',
    label: `Happening Today - ${data.panelistName}`,
    fileName: `Happening_Today_${safeName}`,
    html: generateB5(data),
    panelistName: data.panelistName,
  });

  return banners;
}
