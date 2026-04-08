import fs from 'fs';
import path from 'path';
import https from 'https';
import puppeteer from 'puppeteer';

const DESKTOP = 'C:\\Users\\Bizycorp_Work\\Desktop\\Banner_Previews';

// Realistic professional headshot placeholder — person in blazer on green bg, waist-up
// skinTone: hex for face/hands, suitColor: hex for jacket, female: bool
function avatarUrl(initials, bg, opts = {}) {
  const {
    skinTone = '#c68642',
    suitColor = '#1a1a2e',
    female = false,
    hairColor = '#2c1810',
  } = opts;

  // Face & neck
  const face = female
    ? `<!-- female silhouette -->
       <!-- hair -->
       <ellipse cx="150" cy="95" rx="58" ry="70" fill="${hairColor}"/>
       <!-- neck -->
       <rect x="136" y="168" width="28" height="38" fill="${skinTone}"/>
       <!-- face -->
       <ellipse cx="150" cy="138" rx="52" ry="58" fill="${skinTone}"/>
       <!-- hair top/sides over face -->
       <ellipse cx="150" cy="88" rx="52" ry="38" fill="${hairColor}"/>
       <!-- shoulder/blazer - feminine cut -->
       <path d="M50,300 Q50,220 90,205 Q115,195 136,206 L136,220 Q150,240 164,220 L164,206 Q185,195 210,205 Q250,220 250,300 Z" fill="${suitColor}"/>
       <!-- blouse/shirt visible -->
       <path d="M136,206 Q150,230 164,206 L164,215 Q150,240 136,215 Z" fill="#e8e8e8"/>
       <!-- ears -->
       <ellipse cx="98" cy="142" rx="10" ry="13" fill="${skinTone}"/>
       <ellipse cx="202" cy="142" rx="10" ry="13" fill="${skinTone}"/>`
    : `<!-- male silhouette -->
       <!-- hair -->
       <ellipse cx="150" cy="92" rx="54" ry="44" fill="${hairColor}"/>
       <!-- neck -->
       <rect x="135" y="168" width="30" height="40" fill="${skinTone}"/>
       <!-- face -->
       <ellipse cx="150" cy="138" rx="52" ry="58" fill="${skinTone}"/>
       <!-- shirt collar -->
       <path d="M135,208 L150,228 L165,208 L165,215 L150,238 L135,215 Z" fill="#f0f0f0"/>
       <!-- tie -->
       <path d="M147,215 L150,222 L153,215 L151,238 L150,242 L149,238 Z" fill="#8b0000"/>
       <!-- suit/blazer shoulders -->
       <path d="M40,300 Q40,215 85,205 Q112,196 135,208 L135,215 L150,238 L165,215 L165,208 Q188,196 215,205 Q260,215 260,300 Z" fill="${suitColor}"/>
       <!-- lapels -->
       <path d="M135,208 L115,215 L135,245 Z" fill="${lighten(suitColor)}"/>
       <path d="M165,208 L185,215 L165,245 Z" fill="${lighten(suitColor)}"/>
       <!-- ears -->
       <ellipse cx="98" cy="142" rx="10" ry="13" fill="${skinTone}"/>
       <ellipse cx="202" cy="142" rx="10" ry="13" fill="${skinTone}"/>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <!-- background -->
  <rect width="300" height="300" fill="${bg}"/>
  <!-- subtle vignette -->
  <radialGradient id="vig" cx="50%" cy="50%" r="70%">
    <stop offset="60%" stop-color="transparent"/>
    <stop offset="100%" stop-color="rgba(0,0,0,0.25)"/>
  </radialGradient>
  <rect width="300" height="300" fill="url(#vig)"/>
  ${face}
  <!-- subtle highlight on face -->
  <ellipse cx="140" cy="125" rx="18" ry="22" fill="rgba(255,255,255,0.07)"/>
</svg>`;

  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

function lighten(hex) {
  // Slightly lighten a hex colour for lapel shading
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + 40);
  const g = Math.min(255, ((n >> 8) & 0xff) + 40);
  const b = Math.min(255, (n & 0xff) + 40);
  return `rgb(${r},${g},${b})`;
}

// Fetch a URL and return base64 data URI
function fetchImageAsDataUri(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        resolve('data:image/jpeg;base64,' + buf.toString('base64'));
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Fixed portrait URLs from randomuser.me (stable IDs)
const PORTRAIT_URLS = [
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/75.jpg',
  'https://randomuser.me/api/portraits/women/68.jpg',
  'https://randomuser.me/api/portraits/men/54.jpg',
  'https://randomuser.me/api/portraits/women/26.jpg',
];

const PANELIST_INFO = [
  { name: 'Daniel Reed',   title: 'Chief Veterinary Officer', org: 'PetCare Group'        },
  { name: 'Cleve King',    title: 'VP of Operations',         org: 'VetTech Inc.'         },
  { name: 'James Groves',  title: 'Head of Research',         org: 'Animal Health Labs'   },
  { name: 'Savah Collins', title: 'Practice Manager',         org: 'City Animal Hospital' },
  { name: 'Ryan Carter',   title: 'Veterinary Surgeon',       org: 'Blue Cross Vets'      },
  { name: 'Maria Santos',  title: 'Founder & CEO',            org: 'PetWell Solutions'    },
];

const BASE_DATA = {
  headerText: 'VETERINARY TECHNOLOGY & INNOVATION PANEL',
  panelName: 'Vet Innovation Summit 2026',
  panelTopic: 'The Future of Veterinary Care',
  panelSubtitle: 'Technology, Innovation & Leadership',
  eventDate: 'APRIL 22ND, 2026',
  eventTime: '12:00 PM EST',
  websiteUrl: 'www.vetinnovation.com',
  headshotUrl: avatarUrl('SP', '#0a4a44'),
  panelistName: 'Dr. Sarah Mitchell',
  panelistFirstName: 'Sarah',
  panelistTitle: 'Chief Veterinary Officer',
  panelistOrg: 'PetCare Group',
  qrCodeUrl: '',
  vertical: 'vet',
  theme: null,
};

// Inline the theme so we don't need to import TS
const CLASSIC_VET_THEME = {
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
};

function cleanTitle(t) { return (t || '').replace(/^(dr\.?\s*|mr\.?\s*|ms\.?\s*|mrs\.?\s*)/i, '').trim(); }

// Portrait card exactly matching reference:
// - Photo sits directly on dark bg (no frame/border on sides)
// - Green neon glow radiates from the BOTTOM of the photo (ground light)
// - Hard fade at bottom of photo to blend into dark bg
// - Name (white, bold) + title (green) in separate label BELOW the photo
function renderPortraitCard(p, w, h, nameFontSize, titleFontSize, theme) {
  const title = cleanTitle(p.title);
  return `<div style="display:flex;flex-direction:column;align-items:center;flex:0 0 auto;width:${w}px;">
    <!-- photo container: no border, fades into bg at bottom, green glow underneath -->
    <div style="position:relative;width:${w}px;height:${h}px;overflow:hidden;">
      <!-- actual photo -->
      <div style="width:100%;height:100%;background:url('${p.headshotUrl}') center top/cover no-repeat;"></div>
      <!-- fade bottom of photo into dark background -->
      <div style="position:absolute;bottom:0;left:0;right:0;height:35%;background:linear-gradient(to bottom,transparent,rgba(5,14,10,0.95));"></div>
      <!-- green ground glow at very bottom -->
      <div style="position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);width:80%;height:20px;background:${theme.neonBorder};filter:blur(14px);opacity:0.85;border-radius:50%;"></div>
    </div>
    <!-- name + title label below photo -->
    <div style="margin-top:8px;text-align:center;padding:0 4px;">
      <div style="font-family:Montserrat,Arial,sans-serif;font-size:${nameFontSize}px;font-weight:800;color:#ffffff;line-height:1.2;letter-spacing:0.3px;">${p.name}</div>
      ${title ? `<div style="font-family:Montserrat,Arial,sans-serif;font-size:${titleFontSize}px;font-weight:600;color:${theme.neonBorder};line-height:1.3;margin-top:3px;">${title}</div>` : ''}
    </div>
  </div>`;
}

function renderCard5P(p, textColor, subtitleColor, theme) {
  return renderPortraitCard(p, 185, 255, 16, 12, theme);
}

function renderCard6P(p, textColor, subtitleColor, theme) {
  return renderPortraitCard(p, 152, 220, 14, 11, theme);
}

function generateB2(panelists, renderCard, gap, t, data) {
  const panelistsHtml = panelists.map(p => renderCard(p, '#ffffff', t.subtitleColor, t)).join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap" rel="stylesheet">
</head><body style="margin:0;padding:0;">
<div style="width:1080px;height:1080px;display:flex;flex-direction:column;overflow:hidden;background:${t.bgGradient};">
  <div style="background:${t.headerBg};padding:22px 28px;text-align:center;flex-shrink:0;">
    <span style="font-family:Montserrat,Arial,sans-serif;font-size:32px;font-weight:900;color:${t.headerTextColor};letter-spacing:1px;text-transform:uppercase;">${data.headerText}</span>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;padding:22px 30px 18px;position:relative;">
    <div style="max-width:900px;">
      <div style="font-family:Montserrat,Arial,sans-serif;font-size:22px;font-weight:700;color:${t.lime};margin-bottom:8px;">${data.panelName}</div>
      <div style="font-family:Montserrat,Arial,sans-serif;font-size:36px;font-weight:900;color:#ffffff;line-height:1.15;">${data.panelTopic}: ${data.panelSubtitle}</div>
    </div>
    <div style="flex:1;display:flex;align-items:flex-end;justify-content:center;margin-top:12px;padding-bottom:4px;">
      <div style="display:flex;justify-content:center;gap:${gap};align-items:flex-end;">${panelistsHtml}</div>
    </div>
    <div style="position:relative;display:flex;align-items:center;min-height:140px;padding-top:12px;flex-shrink:0;">
      <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:8px;">
        <div style="background:#ffffff;border-radius:40px;padding:12px 52px;"><span style="font-family:Montserrat,Arial,sans-serif;font-size:22px;font-weight:900;color:${t.darkBg};">REGISTER NOW</span></div>
        <div style="font-family:Montserrat,Arial,sans-serif;font-size:26px;font-weight:900;color:#ffffff;">📅 ${data.eventDate}</div>
        <div style="font-family:Montserrat,Arial,sans-serif;font-size:22px;font-weight:800;color:${t.lime};">🕐 ${data.eventTime}</div>
        <div style="font-family:Arial,sans-serif;font-size:12px;color:${t.subtitleColor};letter-spacing:1px;">${data.websiteUrl.toUpperCase()}</div>
      </div>
    </div>
  </div>
</div></body></html>`;
}

function generateB3(panelists, renderCard, gap, t, data) {
  const panelistsHtml = panelists.map(p => renderCard(p, t.b3TextColor, t.subtitleColorLight, t)).join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap" rel="stylesheet">
</head><body style="margin:0;padding:0;">
<div style="width:1080px;height:1080px;display:flex;flex-direction:column;overflow:hidden;">
  <div style="background:${t.bgGradient};flex-shrink:0;padding:20px 36px 20px;position:relative;">
    <div style="background:${t.headerBg};display:inline-block;padding:6px 20px;border-radius:6px;margin-bottom:10px;">
      <span style="font-family:Montserrat,Arial,sans-serif;font-size:15px;font-weight:800;color:${t.headerTextColor};letter-spacing:1px;text-transform:uppercase;">${data.headerText}</span>
    </div>
    <div style="font-family:Montserrat,Arial,sans-serif;font-size:20px;font-weight:700;color:${t.lime};margin-bottom:8px;">${data.panelName}</div>
    <div style="font-family:Montserrat,Arial,sans-serif;font-size:32px;font-weight:900;color:#ffffff;line-height:1.2;max-width:800px;">${data.panelTopic}: ${data.panelSubtitle}</div>
  </div>
  <div style="flex:1;background:#f5f5f5;display:flex;align-items:flex-end;justify-content:center;padding:12px 30px 0;">
    <div style="display:flex;justify-content:center;gap:${gap};width:100%;align-items:flex-end;">${panelistsHtml}</div>
  </div>
  <div style="background:${t.headerBg};padding:18px 36px;display:flex;align-items:center;position:relative;flex-shrink:0;min-height:140px;">
    <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:8px;">
      <div style="background:${t.ctaBg};border-radius:40px;padding:12px 52px;"><span style="font-family:Montserrat,Arial,sans-serif;font-size:22px;font-weight:900;color:${t.ctaText};">REGISTER NOW</span></div>
      <div style="font-family:Montserrat,Arial,sans-serif;font-size:26px;font-weight:900;color:${t.headerTextColor};">📅 ${data.eventDate}</div>
      <div style="font-family:Montserrat,Arial,sans-serif;font-size:22px;font-weight:800;color:${t.darkBg};">🕐 ${data.eventTime}</div>
      <div style="font-family:Arial,sans-serif;font-size:12px;color:${t.subtitleColorLight};letter-spacing:1px;">${data.websiteUrl.toUpperCase()}</div>
    </div>
  </div>
</div></body></html>`;
}

function generateB5(panelists, renderCard, gap, t, data) {
  const panelistsHtml = panelists.map(p => renderCard(p, '#ffffff', t.lime, t)).join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap" rel="stylesheet">
</head><body style="margin:0;padding:0;">
<div style="width:1080px;height:1080px;display:flex;flex-direction:column;overflow:hidden;background:${t.bgGradient};">
  <div style="background:${t.headerBg};padding:20px 28px;text-align:center;flex-shrink:0;">
    <span style="font-family:Montserrat,Arial,sans-serif;font-size:32px;font-weight:900;color:${t.headerTextColor};letter-spacing:1px;text-transform:uppercase;">${data.headerText}</span>
  </div>
  <div style="background:${t.darkBg}66;padding:14px 40px;position:relative;flex-shrink:0;">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:6px;">
      <div style="width:18px;height:18px;border-radius:50%;background:#ff3333;box-shadow:0 0 0 4px rgba(255,51,51,0.3);flex-shrink:0;"></div>
      <div style="font-family:Montserrat,Arial,sans-serif;font-size:38px;font-weight:900;color:${t.lime};letter-spacing:1px;">HAPPENING TODAY!</div>
    </div>
    <div style="font-family:Montserrat,Arial,sans-serif;font-size:22px;font-weight:700;color:#ffffff;">${data.panelName}</div>
    <div style="font-family:Montserrat,Arial,sans-serif;font-size:19px;font-weight:600;color:rgba(255,255,255,0.85);max-width:780px;">${data.panelTopic}: ${data.panelSubtitle}</div>
  </div>
  <div style="height:3px;background:linear-gradient(90deg,${t.separatorColor},${t.separatorColor}1a);flex-shrink:0;"></div>
  <div style="flex:1;display:flex;align-items:flex-end;justify-content:center;padding:12px 30px 0;">
    <div style="display:flex;justify-content:center;gap:${gap};align-items:flex-end;">${panelistsHtml}</div>
  </div>
  <div style="height:3px;background:linear-gradient(90deg,${t.separatorColor}1a,${t.separatorColor},${t.separatorColor}1a);flex-shrink:0;"></div>
  <div style="background:${t.darkBg}80;padding:16px 36px;position:relative;display:flex;align-items:center;flex-shrink:0;min-height:120px;">
    <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:7px;">
      <div style="background:${t.headerBg};border-radius:40px;padding:12px 50px;"><span style="font-family:Montserrat,Arial,sans-serif;font-size:22px;font-weight:900;color:${t.darkBg};">REGISTER NOW</span></div>
      <div style="font-family:Montserrat,Arial,sans-serif;font-size:26px;font-weight:900;color:#ffffff;">📅 ${data.eventDate}</div>
      <div style="font-family:Montserrat,Arial,sans-serif;font-size:22px;font-weight:800;color:${t.lime};">🕐 ${data.eventTime}</div>
    </div>
  </div>
</div></body></html>`;
}

async function renderHtmlToPng(html, outputPath, browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: outputPath, type: 'png' });
  await page.close();
  console.log('  Saved:', outputPath);
}

async function main() {
  if (!fs.existsSync(DESKTOP)) fs.mkdirSync(DESKTOP, { recursive: true });

  console.log('Fetching sample headshots...');
  const headshotDataUris = await Promise.all(PORTRAIT_URLS.map(fetchImageAsDataUri));
  console.log('  Done.\n');

  const allPanelists = PANELIST_INFO.map((p, i) => ({ ...p, headshotUrl: headshotDataUris[i] }));
  const SAMPLE_PANELISTS_5 = allPanelists.slice(0, 5);
  const SAMPLE_PANELISTS_6 = allPanelists.slice(0, 6);

  const t = CLASSIC_VET_THEME;
  const data = BASE_DATA;

  const banners = [
    // 5P
    { file: '5P_B2_Panel_One.png',      html: generateB2(SAMPLE_PANELISTS_5, renderCard5P, '8px', t, data) },
    { file: '5P_B3_Panel_Two.png',      html: generateB3(SAMPLE_PANELISTS_5, renderCard5P, '8px', t, data) },
    { file: '5P_B5_Happening_Today.png', html: generateB5(SAMPLE_PANELISTS_5, renderCard5P, '8px', t, data) },
    // 6P
    { file: '6P_B2_Panel_One.png',      html: generateB2(SAMPLE_PANELISTS_6, renderCard6P, '8px', t, data) },
    { file: '6P_B3_Panel_Two.png',      html: generateB3(SAMPLE_PANELISTS_6, renderCard6P, '8px', t, data) },
    { file: '6P_B5_Happening_Today.png', html: generateB5(SAMPLE_PANELISTS_6, renderCard6P, '8px', t, data) },
  ];

  const browser = await puppeteer.launch({ headless: true });
  try {
    for (const b of banners) {
      console.log('Rendering', b.file, '...');
      await renderHtmlToPng(b.html, path.join(DESKTOP, b.file), browser);
    }
  } finally {
    await browser.close();
  }

  console.log('\nDone! 6 PNGs saved to:', DESKTOP);
}

main().catch(err => { console.error(err); process.exit(1); });
