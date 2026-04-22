import {
  type BannerData,
  type BannerTheme,
  type BannerType,
  generateB1,
  generateB2,
  generateB3,
  generateB4,
  generateB5,
  getTheme,
  getQrUrl,
  qrPlaceholder,
  deduplicateFields,
  cleanTitle,
  formatDateTitleCase,
  formatTime,
  getPanelistVariant,
  uid,
  getLogoSvg,
} from './bannerTemplates';

export type BannerTemplateSet = {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  generators: {
    B1: (data: BannerData) => string;
    B2: (data: BannerData) => string;
    B3: (data: BannerData) => string;
    B4: (data: BannerData) => string;
    B5: (data: BannerData) => string;
  };
};

export const DEFAULT_TEMPLATE_SET_ID = 'classic';

const CLASSIC_THUMB =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220">
      <defs><radialGradient id="cg" cx="70%" cy="45%" r="70%"><stop offset="0%" stop-color="#0a4a44"/><stop offset="100%" stop-color="#050e0a"/></radialGradient></defs>
      <rect width="400" height="220" fill="url(#cg)"/>
      <rect x="0" y="0" width="400" height="28" fill="#DDE821"/>
      <text x="200" y="20" font-family="Arial" font-size="14" font-weight="900" fill="#000" text-anchor="middle">PANEL HEADER</text>
      <circle cx="300" cy="110" r="58" fill="#0d3530" stroke="#00b09b" stroke-width="4"/>
      <circle cx="300" cy="110" r="52" fill="#1e4a44"/>
      <text x="40" y="90" font-family="Arial" font-size="11" font-weight="700" fill="#DDE821">PANEL NAME</text>
      <text x="40" y="115" font-family="Arial" font-size="18" font-weight="900" fill="#ffffff">Panel Topic</text>
      <rect x="40" y="128" width="180" height="24" rx="12" fill="#00b09b"/>
      <text x="130" y="144" font-family="Arial" font-size="10" font-weight="800" fill="#fff" text-anchor="middle">Subtitle</text>
      <text x="40" y="175" font-family="Arial" font-size="14" font-weight="800" fill="#fff">Speaker Name</text>
      <rect x="0" y="192" width="400" height="28" fill="#050e0a"/>
      <rect x="150" y="198" width="100" height="16" rx="8" fill="#004D25"/>
      <text x="200" y="210" font-family="Arial" font-size="9" font-weight="900" fill="#DDE821" text-anchor="middle">REGISTER NOW</text>
    </svg>`
  );

const MODERN_THUMB =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220">
      <defs><radialGradient id="mg" cx="60%" cy="50%" r="75%"><stop offset="0%" stop-color="#0a4a44"/><stop offset="100%" stop-color="#050e0a"/></radialGradient></defs>
      <rect width="400" height="220" fill="url(#mg)"/>
      <rect x="24" y="24" width="30" height="3" fill="#DDE821"/>
      <text x="24" y="50" font-family="Georgia" font-size="9" font-weight="400" fill="#DDE821" letter-spacing="3">VETERINARY PANEL</text>
      <text x="24" y="82" font-family="Georgia" font-size="22" font-weight="700" fill="#ffffff">Leading</text>
      <text x="24" y="104" font-family="Georgia" font-size="22" font-weight="700" fill="#ffffff">Through Change</text>
      <rect x="24" y="120" width="40" height="1" fill="#ffffff" opacity="0.4"/>
      <text x="24" y="142" font-family="Arial" font-size="12" font-weight="800" fill="#ffffff">Dr. Speaker Name</text>
      <text x="24" y="156" font-family="Arial" font-size="9" fill="#DDE821">Title &middot; Organization</text>
      <circle cx="310" cy="105" r="62" fill="#1e4a44" stroke="#DDE821" stroke-width="2"/>
      <rect x="0" y="186" width="400" height="34" fill="#DDE821"/>
      <text x="24" y="208" font-family="Arial" font-size="10" font-weight="900" fill="#0a4a44">REGISTER NOW</text>
      <text x="220" y="208" font-family="Georgia" font-size="12" font-weight="700" fill="#0a4a44">May 20th, 2026</text>
    </svg>`
  );

// ————————————————————————————————————————————————
// Shared Modern primitives
// ————————————————————————————————————————————————

function modernBase(body: string, theme: BannerTheme): string {
  // Use the theme's gradient so dark themes render correctly.
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
.poster { width:1080px; height:1080px; margin:0; padding:0; overflow:hidden; position:relative; font-family: Inter, Arial, sans-serif; background:${theme.bgGradient}; }
.serif { font-family: 'Playfair Display', Georgia, serif; }
.eyebrow { font-family: Inter, Arial, sans-serif; font-weight:600; letter-spacing:4px; text-transform:uppercase; font-size:14px; }
</style>
</head><body style="margin:0;padding:0;">
<div class="poster">${body}</div>
</body></html>`;
}

/** Subtle geometric accent layer — thin lines + small blocks, theme-aware */
function modernAccents(theme: BannerTheme): string {
  const a = theme.accent;
  const l = theme.lime;
  return `<div style="position:absolute;inset:0;pointer-events:none;z-index:1;">
    <div style="position:absolute;top:0;left:0;right:0;height:6px;background:${l};"></div>
    <div style="position:absolute;top:120px;left:60px;width:48px;height:2px;background:${l};opacity:0.7;"></div>
    <div style="position:absolute;top:320px;right:60px;width:2px;height:120px;background:${a};opacity:0.3;"></div>
    <div style="position:absolute;bottom:260px;left:60px;width:2px;height:80px;background:${a};opacity:0.3;"></div>
  </div>`;
}

/** Top-left logo + top-right eyebrow label */
function modernTopBar(data: BannerData, theme: BannerTheme, rightLabel: string): string {
  const u = uid();
  return `<div style="position:absolute;top:40px;left:60px;z-index:6;">${getLogoSvg(data, u, 150, 50)}</div>
  ${rightLabel ? `<div style="position:absolute;top:54px;right:60px;z-index:6;" class="eyebrow" >
    <span style="color:${theme.lime};">${rightLabel}</span>
  </div>` : ''}`;
}

/** Round panelist portrait with thin accent ring — matches Classic's crop behaviour */
function modernCircle(url: string, size: number, ring: string, ringAlt: string): string {
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;border:5px solid ${ring};overflow:hidden;box-shadow:0 0 0 2px ${ringAlt}60, 0 10px 30px rgba(0,0,0,0.35);background:url('${url}') center 15%/cover no-repeat;"></div>`;
}

/** Full-width CTA ribbon at the bottom — mirrors Classic semantics, modern styling */
function modernCta(data: BannerData, theme: BannerTheme, bannerType: BannerType): string {
  const qrUrl = getQrUrl(data, bannerType);
  return `<div style="position:absolute;left:0;right:0;bottom:0;height:180px;background:${theme.headerBg};z-index:5;display:flex;align-items:center;padding:0 60px;gap:28px;">
    <div style="flex-shrink:0;">
      ${qrUrl
        ? `<div style="border:3px solid ${theme.darkBg};background:#fff;padding:8px;"><img src="${qrUrl}" style="width:120px;height:120px;display:block;"></div>`
        : `<div style="width:144px;height:144px;border:3px dashed ${theme.darkBg};opacity:0.35;display:flex;align-items:center;justify-content:center;"><svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="${theme.darkBg}" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="4" height="4" rx="0.5"/></svg></div>`
      }
    </div>
    <div style="flex:1;display:flex;align-items:center;justify-content:space-between;gap:24px;">
      <div>
        <div class="eyebrow" style="color:${theme.darkBg};opacity:0.7;font-size:12px;letter-spacing:5px;">Register Now</div>
        <div class="serif" style="font-size:36px;font-weight:700;color:${theme.darkBg};line-height:1.05;margin-top:2px;letter-spacing:-0.5px;">${formatDateTitleCase(data.eventDate)}</div>
        <div style="font-size:20px;font-weight:600;color:${theme.darkBg};opacity:0.85;margin-top:4px;">${formatTime(data.eventTime)}${data.websiteUrl ? ` &middot; ${data.websiteUrl.replace(/^https?:\/\//, '')}` : ''}</div>
      </div>
      <div style="background:${theme.darkBg};color:${theme.lime};font-family:Inter,sans-serif;font-size:16px;font-weight:800;letter-spacing:3px;text-transform:uppercase;padding:18px 36px;flex-shrink:0;">Register</div>
    </div>
  </div>`;
}

// ————————————————————————————————————————————————
// B1 — Intro (per-panelist). Editorial split with round portrait + serif headline
// ————————————————————————————————————————————————

function modernB1(data: BannerData): string {
  const t = getTheme(data);
  const { panelName, panelTopic, panelSubtitle } = deduplicateFields(data);
  const pTitle = cleanTitle(data.panelistTitle);

  // Scale headline to fit in left column (480px wide) without crashing into the portrait.
  const topicLen = (panelTopic || '').length;
  const titleSize = topicLen > 80 ? 46 : topicLen > 55 ? 56 : topicLen > 35 ? 64 : 72;

  const body = `
    ${modernAccents(t)}
    ${modernTopBar(data, t, data.headerText)}

    <!-- LEFT: editorial headline (hard clipped to its column) -->
    <div style="position:absolute;left:60px;top:170px;width:480px;max-height:680px;overflow:hidden;z-index:3;">
      <div style="width:56px;height:3px;background:${t.lime};margin-bottom:20px;"></div>
      ${panelName ? `<div class="eyebrow" style="color:${t.lime};font-size:13px;letter-spacing:3px;margin-bottom:14px;">${panelName}</div>` : ''}
      ${panelTopic ? `<div class="serif" style="font-size:${titleSize}px;font-weight:700;line-height:1.04;color:#ffffff;letter-spacing:-0.8px;word-wrap:break-word;overflow-wrap:break-word;">${panelTopic}</div>` : ''}
      ${panelSubtitle ? `<div style="font-size:19px;font-weight:400;color:${t.lime};margin-top:14px;line-height:1.35;">${panelSubtitle}</div>` : ''}
      <div style="margin-top:28px;padding-top:18px;border-top:1px solid ${t.lime}40;">
        <div class="eyebrow" style="color:${t.lime};font-size:12px;letter-spacing:3px;">Featuring</div>
        <div style="font-size:34px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;margin-top:6px;line-height:1.1;">${data.panelistName}</div>
        ${pTitle ? `<div style="font-size:18px;font-weight:500;color:${t.lime};margin-top:4px;line-height:1.3;">${pTitle}</div>` : ''}
        ${data.panelistOrg ? `<div style="font-size:15px;font-weight:400;color:rgba(255,255,255,0.75);margin-top:2px;line-height:1.3;">${data.panelistOrg}</div>` : ''}
      </div>
    </div>

    <!-- RIGHT: circular portrait with soft accent halo (pulled right so text can't collide) -->
    <div style="position:absolute;right:70px;top:240px;z-index:3;">
      <div style="position:absolute;inset:-30px;border-radius:50%;background:radial-gradient(circle,${t.accent}55 0%,transparent 70%);z-index:-1;"></div>
      ${modernCircle(data.headshotUrl, 400, t.accent, t.neonBorder)}
    </div>

    ${modernCta(data, t, 'B1')}
  `;
  return modernBase(body, t);
}

// ————————————————————————————————————————————————
// B2 — Introduction to Panel One. Centred title + row of round portraits
// ————————————————————————————————————————————————

function panelistSizes(variant: string) {
  const map: Record<string, { photo: number; name: number; title: number; gap: number; max: number }> = {
    '2P': { photo: 260, name: 24, title: 16, gap: 80, max: 420 },
    '3P': { photo: 220, name: 22, title: 15, gap: 40, max: 280 },
    '4P': { photo: 185, name: 19, title: 14, gap: 28, max: 220 },
    '5P': { photo: 155, name: 17, title: 13, gap: 20, max: 180 },
    '6P': { photo: 130, name: 15, title: 12, gap: 16, max: 150 },
  };
  return map[variant] || map['3P'];
}

function modernPanelistRow(data: BannerData, textOnDark: boolean): string {
  const t = getTheme(data);
  const list = data.allPanelists || [];
  const s = panelistSizes(getPanelistVariant(data));
  const textColor = textOnDark ? '#ffffff' : t.b3TextColor;
  const subColor = textOnDark ? `${t.lime}` : t.subtitleColorLight;

  const cards = list
    .map((p) => {
      const title = cleanTitle(p.title);
      return `<div style="display:flex;flex-direction:column;align-items:center;max-width:${s.max}px;">
        ${modernCircle(p.headshotUrl, s.photo, t.accent, t.neonBorder)}
        <div style="font-size:${s.name}px;font-weight:800;color:${textColor};text-align:center;margin-top:14px;line-height:1.2;letter-spacing:-0.2px;max-width:${s.max}px;">${p.name}</div>
        ${title ? `<div style="font-size:${s.title}px;font-weight:500;color:${subColor};text-align:center;margin-top:4px;line-height:1.3;max-width:${s.max}px;">${title}</div>` : ''}
        ${p.org ? `<div style="font-size:${s.title - 2}px;font-weight:400;color:${textColor};opacity:0.6;text-align:center;margin-top:2px;line-height:1.3;max-width:${s.max}px;">${p.org}</div>` : ''}
      </div>`;
    })
    .join('');

  return `<div style="display:flex;justify-content:center;gap:${s.gap}px;align-items:flex-start;flex-wrap:nowrap;">${cards}</div>`;
}

function modernPanelHeader(data: BannerData, onDark: boolean): string {
  const t = getTheme(data);
  const { panelName, panelTopic, panelSubtitle } = deduplicateFields(data);
  const main = onDark ? '#ffffff' : t.b3TextColor;
  const accent = t.lime;
  const headline = panelTopic && panelSubtitle ? `${panelTopic}: ${panelSubtitle}` : (panelTopic || panelSubtitle || '');
  const topicLen = headline.length;
  const size = topicLen > 100 ? 40 : topicLen > 70 ? 46 : topicLen > 45 ? 52 : 58;
  return `<div style="text-align:center;max-width:960px;margin:0 auto;padding:0 60px;">
    ${panelName ? `<div class="eyebrow" style="color:${accent};">${panelName}</div>` : ''}
    ${panelName ? `<div style="width:56px;height:3px;background:${accent};margin:16px auto 22px;"></div>` : ''}
    ${headline ? `<div class="serif" style="font-size:${size}px;font-weight:700;line-height:1.08;color:${main};letter-spacing:-0.6px;">${headline}</div>` : ''}
  </div>`;
}

function modernB2(data: BannerData): string {
  const t = getTheme(data);
  const body = `
    ${modernAccents(t)}
    ${modernTopBar(data, t, data.headerText)}

    <div style="position:absolute;top:150px;left:0;right:0;z-index:3;">
      ${modernPanelHeader(data, true)}
    </div>

    <div style="position:absolute;left:0;right:0;top:450px;bottom:200px;z-index:3;padding:0 60px;display:flex;align-items:flex-start;justify-content:center;overflow:hidden;">
      ${modernPanelistRow(data, true)}
    </div>

    ${modernCta(data, t, 'B2')}
  `;
  return modernBase(body, t);
}

// ————————————————————————————————————————————————
// B3 — Introduction to Panel Two. Light background variant
// ————————————————————————————————————————————————

function modernB3(data: BannerData): string {
  const t = getTheme(data);
  const u = uid();
  const body = `
    <!-- Full white main area -->
    <div style="position:absolute;inset:0;background:#ffffff;z-index:0;"></div>
    <!-- Dark header band -->
    <div style="position:absolute;top:0;left:0;right:0;height:140px;background:${t.darkBg};z-index:1;"></div>
    <div style="position:absolute;top:0;left:0;right:0;height:6px;background:${t.lime};z-index:2;"></div>

    <div style="position:absolute;top:44px;left:60px;z-index:6;">${getLogoSvg(data, u, 140, 46)}</div>
    ${data.headerText ? `<div style="position:absolute;top:58px;right:60px;z-index:6;" class="eyebrow">
      <span style="color:${t.lime};">${data.headerText}</span>
    </div>` : ''}

    <!-- Title block -->
    <div style="position:absolute;top:180px;left:0;right:0;z-index:3;">
      ${modernPanelHeader(data, false)}
    </div>

    <!-- Panelist row -->
    <div style="position:absolute;left:0;right:0;top:440px;bottom:200px;z-index:3;padding:0 60px;display:flex;align-items:flex-start;justify-content:center;overflow:hidden;">
      ${modernPanelistRow(data, false)}
    </div>

    ${modernCta(data, t, 'B3')}
  `;
  // Override base background for B3 since we're on a light backdrop
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
.poster { width:1080px; height:1080px; margin:0; padding:0; overflow:hidden; position:relative; font-family: Inter, Arial, sans-serif; background:#ffffff; }
.serif { font-family: 'Playfair Display', Georgia, serif; }
.eyebrow { font-family: Inter, Arial, sans-serif; font-weight:600; letter-spacing:4px; text-transform:uppercase; font-size:14px; }
</style>
</head><body style="margin:0;padding:0;"><div class="poster">${body}</div></body></html>`;
}

// ————————————————————————————————————————————————
// B4 — One More Day (per-panelist, urgency countdown)
// ————————————————————————————————————————————————

function modernB4(data: BannerData): string {
  const t = getTheme(data);
  const { panelTopic, panelSubtitle } = deduplicateFields(data);
  const topicLine = panelTopic && panelSubtitle ? `${panelTopic}: ${panelSubtitle}` : (panelTopic || panelSubtitle || '');
  const pTitle = cleanTitle(data.panelistTitle);

  const body = `
    ${modernAccents(t)}
    ${modernTopBar(data, t, data.headerText)}

    <!-- RIGHT: round portrait -->
    <div style="position:absolute;right:90px;top:210px;z-index:3;">
      <div style="position:absolute;inset:-40px;border-radius:50%;background:radial-gradient(circle,${t.accent}55 0%,transparent 70%);z-index:-1;"></div>
      ${modernCircle(data.headshotUrl, 400, t.accent, t.neonBorder)}
    </div>

    <!-- LEFT: ONE MORE DAY headline -->
    <div style="position:absolute;left:60px;top:200px;width:540px;z-index:3;">
      <div class="eyebrow" style="color:${t.lime};font-size:14px;letter-spacing:6px;">Don&rsquo;t Miss It</div>
      <div class="serif" style="font-size:110px;font-weight:900;color:#ffffff;line-height:0.9;letter-spacing:-3px;margin-top:18px;">ONE</div>
      <div class="serif" style="font-size:110px;font-weight:900;color:${t.lime};line-height:0.9;letter-spacing:-3px;">MORE</div>
      <div class="serif" style="font-size:110px;font-weight:900;color:#ffffff;line-height:0.9;letter-spacing:-3px;">DAY</div>

      <div style="margin-top:36px;padding-top:22px;border-top:1px solid ${t.lime}40;">
        <div style="font-size:32px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">${data.panelistName}</div>
        ${pTitle ? `<div style="font-size:18px;font-weight:500;color:${t.lime};margin-top:4px;">${pTitle}</div>` : ''}
        ${data.panelistOrg ? `<div style="font-size:16px;font-weight:400;color:rgba(255,255,255,0.7);margin-top:2px;">${data.panelistOrg}</div>` : ''}
        ${topicLine ? `<div style="font-size:16px;font-weight:400;color:rgba(255,255,255,0.7);margin-top:10px;font-style:italic;max-width:500px;line-height:1.35;">on &ldquo;${topicLine}&rdquo;</div>` : ''}
      </div>
    </div>

    ${modernCta(data, t, 'B4')}
  `;
  return modernBase(body, t);
}

// ————————————————————————————————————————————————
// B5 — Happening Today (urgency + all panelists)
// ————————————————————————————————————————————————

function modernB5(data: BannerData): string {
  const t = getTheme(data);
  const u = uid();
  const { panelName, panelTopic, panelSubtitle } = deduplicateFields(data);
  const headline = panelTopic && panelSubtitle ? `${panelTopic}: ${panelSubtitle}` : (panelTopic || panelSubtitle || '');
  const headlineSize = headline.length > 100 ? 38 : headline.length > 70 ? 44 : headline.length > 45 ? 48 : 52;
  const list = data.allPanelists || [];
  const variant = getPanelistVariant(data);
  // Shrink panelist photos a notch so they fit above the CTA.
  const sMap: Record<string, { photo: number; name: number; title: number; gap: number; max: number }> = {
    '2P': { photo: 280, name: 26, title: 17, gap: 60, max: 320 },
    '3P': { photo: 220, name: 22, title: 15, gap: 40, max: 240 },
    '4P': { photo: 175, name: 19, title: 14, gap: 28, max: 200 },
    '5P': { photo: 145, name: 17, title: 13, gap: 20, max: 170 },
    '6P': { photo: 125, name: 15, title: 11, gap: 16, max: 145 },
  };
  const s = sMap[variant] || sMap['3P'];

  const cards = list
    .map((p) => {
      const title = cleanTitle(p.title);
      return `<div style="display:flex;flex-direction:column;align-items:center;max-width:${s.max}px;">
        ${modernCircle(p.headshotUrl, s.photo, t.accent, t.neonBorder)}
        <div style="font-size:${s.name}px;font-weight:800;color:#ffffff;text-align:center;margin-top:12px;line-height:1.2;letter-spacing:-0.2px;max-width:${s.max}px;">${p.name}</div>
        ${title ? `<div style="font-size:${s.title}px;font-weight:500;color:${t.lime};text-align:center;margin-top:3px;line-height:1.3;max-width:${s.max}px;">${title}</div>` : ''}
        ${p.org ? `<div style="font-size:${s.title - 2}px;font-weight:400;color:rgba(255,255,255,0.6);text-align:center;margin-top:1px;line-height:1.3;max-width:${s.max}px;">${p.org}</div>` : ''}
      </div>`;
    })
    .join('');

  const body = `
    ${modernAccents(t)}

    <div style="position:absolute;top:40px;left:60px;z-index:6;">${getLogoSvg(data, u, 150, 50)}</div>

    <!-- Big LIVE badge top-right -->
    <div style="position:absolute;top:44px;right:60px;z-index:6;display:flex;align-items:center;gap:12px;background:#ff3333;padding:14px 24px;">
      <div style="width:14px;height:14px;border-radius:50%;background:#ffffff;box-shadow:0 0 0 5px rgba(255,255,255,0.3);animation:none;"></div>
      <div class="eyebrow" style="color:#ffffff;font-size:16px;letter-spacing:5px;">Happening Today</div>
    </div>

    <!-- Title -->
    <div style="position:absolute;top:150px;left:0;right:0;z-index:3;text-align:center;padding:0 60px;">
      ${panelName ? `<div class="eyebrow" style="color:${t.lime};font-size:14px;">${panelName}</div>` : ''}
      ${panelName ? `<div style="width:56px;height:3px;background:${t.lime};margin:14px auto 20px;"></div>` : ''}
      ${headline ? `<div class="serif" style="font-size:${headlineSize}px;font-weight:700;line-height:1.08;color:#ffffff;letter-spacing:-0.5px;max-width:900px;margin:0 auto;">${headline}</div>` : ''}
    </div>

    <!-- Panelist row — positioned so it clears the CTA -->
    <div style="position:absolute;left:0;right:0;top:400px;z-index:3;padding:0 60px;">
      <div style="display:flex;justify-content:center;gap:${s.gap}px;align-items:flex-start;flex-wrap:nowrap;">${cards}</div>
    </div>

    ${modernCta(data, t, 'B5')}
  `;
  return modernBase(body, t);
}

// ————————————————————————————————————————————————
// Registry
// ————————————————————————————————————————————————

void qrPlaceholder;

export const BANNER_TEMPLATE_SETS: BannerTemplateSet[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Bold yellow header, circular photos, radial glow.',
    thumbnail: CLASSIC_THUMB,
    generators: {
      B1: generateB1,
      B2: generateB2,
      B3: generateB3,
      B4: generateB4,
      B5: generateB5,
    },
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Editorial serif headlines, circular portraits, accent ribbon.',
    thumbnail: MODERN_THUMB,
    generators: {
      B1: modernB1,
      B2: modernB2,
      B3: modernB3,
      B4: modernB4,
      B5: modernB5,
    },
  },
];

export function getTemplateSet(id?: string): BannerTemplateSet {
  if (!id) return BANNER_TEMPLATE_SETS[0];
  return BANNER_TEMPLATE_SETS.find((s) => s.id === id) || BANNER_TEMPLATE_SETS[0];
}
