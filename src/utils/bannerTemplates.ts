/**
 * VBI Promo Banner Templates — 5 themed HTML banners per panelist
 * Design specs locked by Chaluka Mar 2026
 * Canvas: 1080×1080px
 * Supports multiple verticals (VET, Dental, Law, Aesthetics)
 */

import { type VerticalConfig, type WatermarkIcon, getVerticalConfig } from './verticalConfig';

export type BannerType = 'B1' | 'B2' | 'B3' | 'B4' | 'B5';

export type BannerData = {
  panelName: string;
  panelTopic: string;
  eventDate: string; // e.g. "SUNDAY, MARCH 23, 2026"
  eventTime: string; // e.g. "8:00 PM EST"
  websiteUrl: string;
  panelistName: string;
  panelistFirstName: string;
  panelistTitle: string;
  panelistOrg: string;
  headshotUrl: string; // data URL or path
  allPanelists: Array<{
    name: string;
    title: string;
    org: string;
    headshotUrl: string;
  }>;
  qrCodeUrl?: string;
  zoomRegistrationUrl?: string;
  verticalConfig?: VerticalConfig;
};

export type GeneratedBanner = {
  id: string;
  type: BannerType;
  label: string;
  fileName: string;
  html: string;
  panelistName: string;
};

function cfg(data: BannerData): VerticalConfig {
  return data.verticalConfig || getVerticalConfig('vet');
}

// Watermark SVG — unique icon per vertical
const WATERMARK_STYLE = `position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.055;pointer-events:none;z-index:1;`;

function watermarkSvg(config: VerticalConfig): string {
  const color = config.colors.accent;
  const icon = config.watermarkIcon;

  let iconSvg = '';
  switch (icon) {
    case 'paw':
      iconSvg = `<g transform="translate(800,200) scale(0.5)" fill="${color}">
        <circle cx="30" cy="0" r="18"/><circle cx="-30" cy="0" r="18"/><circle cx="0" cy="-30" r="18"/>
        <circle cx="55" cy="-30" r="18"/><circle cx="-55" cy="-30" r="18"/>
        <ellipse cx="0" cy="40" rx="28" ry="35"/>
      </g>`;
      break;
    case 'tooth':
      iconSvg = `<g transform="translate(800,200) scale(0.6)" fill="${color}">
        <path d="M0-50 C-20-50 -35-35 -35-15 C-35 5 -40 30 -25 50 C-15 65 -5 40 0 25 C5 40 15 65 25 50 C40 30 35 5 35-15 C35-35 20-50 0-50Z"/>
      </g>`;
      break;
    case 'scales':
      iconSvg = `<g transform="translate(800,200) scale(0.5)" fill="${color}">
        <rect x="-3" y="-50" width="6" height="100" rx="3"/>
        <rect x="-50" y="-50" width="100" height="6" rx="3"/>
        <path d="M-50-44 L-30 10 L-70 10 Z" fill="none" stroke="${color}" stroke-width="4"/>
        <path d="M50-44 L70 10 L30 10 Z" fill="none" stroke="${color}" stroke-width="4"/>
        <rect x="-20" y="48" width="40" height="6" rx="3"/>
      </g>`;
      break;
    case 'sparkle':
      iconSvg = `<g transform="translate(800,200) scale(0.5)" fill="${color}">
        <path d="M0-50 C5-15 15-5 50 0 C15 5 5 15 0 50 C-5 15 -15 5 -50 0 C-15-5 -5-15 0-50Z"/>
        <circle cx="35" cy="-35" r="6"/>
        <circle cx="-30" cy="30" r="4"/>
      </g>`;
      break;
  }

  // ECG/heartbeat line adapted per vertical
  const ecgLine = `<path d="M0 540 Q60 540 120 540 L180 540 L210 440 L240 640 L270 480 L300 560 L330 540 Q390 540 540 540 L600 540 L630 440 L660 640 L690 480 L720 560 L750 540 Q810 540 1080 540" stroke="${color}" fill="none" stroke-width="2"/>`;

  return `<div style="${WATERMARK_STYLE}">
    <svg viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
      ${ecgLine}
      ${iconSvg}
    </svg>
  </div>`;
}

// QR box component
function qrBox(qrUrl: string | undefined, onDark: boolean, config: VerticalConfig): string {
  const borderColor = onDark ? config.colors.lime : config.colors.darkBg;
  const textColor = config.colors.darkBg;

  if (!qrUrl) {
    return `<div style="width:140px;height:140px;border-radius:10px;background:#fff;border:3px solid ${borderColor};padding:9px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;">
      <div style="font-size:11px;font-weight:800;letter-spacing:2.5px;color:${textColor};text-transform:uppercase;">SCAN HERE</div>
      <div style="width:100px;height:100px;background:#f0f0f0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#999;font-size:11px;">QR Code</div>
    </div>`;
  }
  return `<div style="width:140px;border-radius:10px;background:#fff;border:3px solid ${borderColor};padding:9px;display:flex;flex-direction:column;align-items:center;gap:4px;">
    <div style="font-size:11px;font-weight:800;letter-spacing:2.5px;color:${textColor};text-transform:uppercase;">SCAN HERE</div>
    <img src="${qrUrl}" style="width:110px;height:110px;border-radius:8px;" />
  </div>`;
}

// Footer component
function footerBar(data: BannerData, bgStyle: string, qrUrl: string | undefined, onDark: boolean = true): string {
  const c = cfg(data);
  return `<div style="position:absolute;bottom:0;left:0;right:0;${bgStyle};padding:20px 30px;display:flex;align-items:center;justify-content:space-between;z-index:10;">
    <div style="flex:1;">
      <div style="font-size:22px;font-weight:900;color:${onDark ? c.colors.lime : c.colors.darkBg};text-transform:uppercase;letter-spacing:2px;margin-bottom:6px;">REGISTER NOW</div>
      <div style="font-size:28px;font-weight:800;color:${onDark ? '#fff' : c.colors.darkBg};text-shadow:${onDark ? '0 1px 4px rgba(0,0,0,0.5)' : 'none'};">📅 ${data.eventDate}</div>
      <div style="font-size:26px;font-weight:800;color:${onDark ? '#fff' : c.colors.darkBg};text-shadow:${onDark ? '0 1px 4px rgba(0,0,0,0.5)' : 'none'};margin-top:2px;">🕗 ${data.eventTime}</div>
      <div style="font-size:18px;font-weight:600;color:${onDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)'};margin-top:6px;">${data.websiteUrl || c.websiteUrl}</div>
    </div>
    <div style="margin-left:16px;">${qrBox(qrUrl, onDark, c)}</div>
  </div>`;
}

// Logo positioned top-right
function logoTopRight(config: VerticalConfig): string {
  return `<div style="position:absolute;top:20px;right:20px;z-index:10;">${config.logoSvg}</div>`;
}

// ——————————————————————————————————————————————
// B1 — Intro (single panelist spotlight)
// ——————————————————————————————————————————————
function generateB1(data: BannerData): string {
  const c = cfg(data);
  return `<div style="position:relative;width:1080px;height:1080px;background:${c.colors.bgGradient};overflow:hidden;font-family:'Segoe UI',Arial,sans-serif;">
    ${watermarkSvg(c)}
    ${logoTopRight(c)}

    <!-- Header -->
    <div style="position:absolute;top:40px;left:40px;z-index:10;max-width:560px;">
      <div style="font-size:22px;font-weight:700;color:${c.colors.lime};text-transform:uppercase;letter-spacing:1px;">${data.panelName}</div>
      <div style="font-size:34px;font-weight:900;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.5);margin-top:12px;line-height:1.2;">${data.panelTopic}</div>
    </div>

    <!-- Panelist info left -->
    <div style="position:absolute;top:280px;left:40px;z-index:10;max-width:520px;">
      <div style="font-size:36px;font-weight:900;color:${c.colors.lime};line-height:1.1;">${data.panelistName}</div>
      <div style="font-size:20px;font-weight:600;color:#fff;margin-top:8px;text-shadow:0 1px 4px rgba(0,0,0,0.5);">${data.panelistTitle}</div>
      <div style="font-size:18px;font-weight:500;color:rgba(255,255,255,0.8);margin-top:4px;">${data.panelistOrg}</div>
    </div>

    <!-- Headshot right -->
    <div style="position:absolute;top:180px;right:60px;z-index:10;">
      <div style="width:380px;height:380px;border-radius:50%;overflow:hidden;box-shadow:
        0 0 0 6px rgba(${hexToRgb(c.colors.accent)},0.6),
        0 0 0 14px rgba(${hexToRgb(c.colors.accent)},0.3),
        0 0 0 22px rgba(${hexToRgb(c.colors.accent)},0.15),
        0 0 0 30px rgba(${hexToRgb(c.colors.accent)},0.08),
        0 0 40px 10px rgba(${hexToRgb(c.colors.accent)},0.3);">
        ${data.headshotUrl
          ? `<img src="${data.headshotUrl}" style="width:100%;height:100%;object-fit:cover;" />`
          : `<div style="width:100%;height:100%;background:linear-gradient(135deg,${c.colors.darkBg},${c.colors.accent});display:flex;align-items:center;justify-content:center;font-size:120px;color:rgba(255,255,255,0.3);">${data.panelistFirstName[0] || '?'}</div>`
        }
      </div>
    </div>

    <!-- Footer -->
    ${footerBar(data, `background:${c.colors.ctaGradient};`, data.qrCodeUrl)}
  </div>`;
}

// ——————————————————————————————————————————————
// B2 — Introduction to the Panel 1
// ——————————————————————————————————————————————
function generateB2(data: BannerData): string {
  const c = cfg(data);
  const panelists = data.allPanelists.length > 0 ? data.allPanelists : [{ name: data.panelistName, title: data.panelistTitle, org: data.panelistOrg, headshotUrl: data.headshotUrl }];
  const circleSize = panelists.length <= 3 ? 270 : panelists.length <= 5 ? 220 : 180;

  return `<div style="position:relative;width:1080px;height:1080px;background:${c.colors.bgGradient};overflow:hidden;font-family:'Segoe UI',Arial,sans-serif;">
    ${watermarkSvg(c)}
    ${logoTopRight(c)}

    <!-- Gradient reveal overlay -->
    <div style="position:absolute;top:0;left:0;right:0;height:200px;background:linear-gradient(180deg, rgba(200,50,30,0.15) 0%, transparent 100%);z-index:2;"></div>

    <!-- Header -->
    <div style="position:absolute;top:40px;left:40px;z-index:10;max-width:800px;">
      <div style="font-size:22px;font-weight:700;color:${c.colors.lime};text-transform:uppercase;letter-spacing:1px;">${data.panelName}</div>
      <div style="font-size:28px;font-weight:700;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.5);margin-top:10px;line-height:1.2;">INTRODUCTION TO THE PANEL</div>
      <div style="font-size:20px;font-weight:500;color:rgba(255,255,255,0.8);margin-top:6px;">${data.panelTopic}</div>
    </div>

    <!-- Panelist circles row -->
    <div style="position:absolute;top:240px;left:0;right:0;display:flex;justify-content:center;gap:${panelists.length <= 3 ? 40 : 24}px;z-index:10;flex-wrap:wrap;padding:0 40px;">
      ${panelists.map(p => `
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
          <div style="width:${circleSize}px;height:${circleSize}px;border-radius:50%;overflow:hidden;border:4px solid ${c.colors.darkBg};box-shadow:0 4px 20px rgba(0,0,0,0.4);">
            ${p.headshotUrl
              ? `<img src="${p.headshotUrl}" style="width:100%;height:100%;object-fit:cover;" />`
              : `<div style="width:100%;height:100%;background:linear-gradient(135deg,${c.colors.darkBg},${c.colors.accent});display:flex;align-items:center;justify-content:center;font-size:${Math.floor(circleSize * 0.4)}px;color:rgba(255,255,255,0.3);">${p.name[0] || '?'}</div>`
            }
          </div>
          <div style="text-align:center;max-width:${circleSize + 20}px;">
            <div style="font-size:16px;font-weight:700;color:${c.colors.lime};">${p.name}</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:2px;">${p.title || ''}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Register button -->
    <div style="position:absolute;bottom:260px;left:50%;transform:translateX(-50%);z-index:10;">
      <div style="background:${c.colors.lime};color:${c.colors.darkBg};padding:14px 48px;border-radius:50px;font-size:20px;font-weight:900;text-transform:uppercase;letter-spacing:2px;box-shadow:0 4px 20px rgba(${hexToRgb(c.colors.lime)},0.3);">Register Now Free</div>
    </div>

    <!-- Footer -->
    ${footerBar(data, `background:${c.colors.ctaGradient};`, data.qrCodeUrl)}
  </div>`;
}

// ——————————————————————————————————————————————
// B3 — Introduction to the Panel 2
// ——————————————————————————————————————————————
function generateB3(data: BannerData): string {
  const c = cfg(data);
  const panelists = data.allPanelists.length > 0 ? data.allPanelists : [{ name: data.panelistName, title: data.panelistTitle, org: data.panelistOrg, headshotUrl: data.headshotUrl }];
  const circleSize = panelists.length <= 3 ? 270 : panelists.length <= 5 ? 220 : 180;

  return `<div style="position:relative;width:1080px;height:1080px;overflow:hidden;font-family:'Segoe UI',Arial,sans-serif;">
    <!-- Dark top -->
    <div style="position:absolute;top:0;left:0;right:0;height:600px;background:${c.colors.bgGradient};"></div>
    <!-- Highlight bottom -->
    <div style="position:absolute;bottom:0;left:0;right:0;height:520px;background:${c.colors.lime};"></div>

    ${watermarkSvg(c)}
    ${logoTopRight(c)}

    <!-- Header -->
    <div style="position:absolute;top:40px;left:40px;z-index:10;max-width:800px;">
      <div style="font-size:22px;font-weight:700;color:${c.colors.lime};text-transform:uppercase;letter-spacing:1px;">${data.panelName}</div>
      <div style="font-size:28px;font-weight:700;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.5);margin-top:10px;line-height:1.2;">INTRODUCTION TO THE PANEL</div>
      <div style="font-size:20px;font-weight:500;color:rgba(255,255,255,0.8);margin-top:6px;">${data.panelTopic}</div>
    </div>

    <!-- Panelist circles -->
    <div style="position:absolute;top:240px;left:0;right:0;display:flex;justify-content:center;gap:${panelists.length <= 3 ? 40 : 24}px;z-index:10;flex-wrap:wrap;padding:0 40px;">
      ${panelists.map(p => `
        <div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
          <div style="width:${circleSize}px;height:${circleSize}px;border-radius:50%;overflow:hidden;border:4px solid #f97316;box-shadow:0 4px 20px rgba(0,0,0,0.4);">
            ${p.headshotUrl
              ? `<img src="${p.headshotUrl}" style="width:100%;height:100%;object-fit:cover;" />`
              : `<div style="width:100%;height:100%;background:linear-gradient(135deg,${c.colors.darkBg},${c.colors.accent});display:flex;align-items:center;justify-content:center;font-size:${Math.floor(circleSize * 0.4)}px;color:rgba(255,255,255,0.3);">${p.name[0] || '?'}</div>`
            }
          </div>
          <div style="text-align:center;max-width:${circleSize + 20}px;">
            <div style="font-size:16px;font-weight:700;color:${c.colors.darkBg};">${p.name}</div>
            <div style="font-size:12px;color:rgba(0,0,0,0.6);margin-top:2px;">${p.title || ''}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Footer (highlight bg) -->
    ${footerBar(data, `background:${c.colors.lime};`, data.qrCodeUrl, false)}
  </div>`;
}

// ——————————————————————————————————————————————
// B4 — One More Day
// ——————————————————————————————————————————————
function generateB4(data: BannerData): string {
  const c = cfg(data);
  return `<div style="position:relative;width:1080px;height:1080px;background:${c.colors.bgGradient};overflow:hidden;font-family:'Segoe UI',Arial,sans-serif;">
    ${watermarkSvg(c)}
    ${logoTopRight(c)}

    <!-- Giant countdown text -->
    <div style="position:absolute;top:50px;left:40px;z-index:10;">
      <div style="font-size:22px;font-weight:700;color:${c.colors.lime};text-transform:uppercase;letter-spacing:1px;">${data.panelName}</div>
      <div style="font-size:100px;font-weight:900;color:${c.colors.lime};line-height:1;margin-top:20px;text-shadow:0 4px 20px rgba(${hexToRgb(c.colors.lime)},0.3);">1</div>
      <div style="font-size:48px;font-weight:900;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,0.5);line-height:1.1;">MORE DAY<br/>TO GO</div>
    </div>

    <!-- Featured panelist -->
    <div style="position:absolute;top:180px;right:60px;z-index:10;">
      <div style="width:340px;height:340px;border-radius:50%;overflow:hidden;box-shadow:
        0 0 0 6px rgba(${hexToRgb(c.colors.accent)},0.6),
        0 0 0 14px rgba(${hexToRgb(c.colors.accent)},0.3),
        0 0 40px 10px rgba(${hexToRgb(c.colors.accent)},0.3);">
        ${data.headshotUrl
          ? `<img src="${data.headshotUrl}" style="width:100%;height:100%;object-fit:cover;" />`
          : `<div style="width:100%;height:100%;background:linear-gradient(135deg,${c.colors.darkBg},${c.colors.accent});display:flex;align-items:center;justify-content:center;font-size:100px;color:rgba(255,255,255,0.3);">${data.panelistFirstName[0] || '?'}</div>`
        }
      </div>
      <div style="text-align:center;margin-top:12px;">
        <div style="font-size:20px;font-weight:700;color:${c.colors.lime};">${data.panelistName}</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.7);margin-top:2px;">${data.panelistTitle}</div>
      </div>
    </div>

    <!-- Topic -->
    <div style="position:absolute;top:560px;left:40px;z-index:10;max-width:500px;">
      <div style="font-size:22px;font-weight:700;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.5);line-height:1.3;">${data.panelTopic}</div>
    </div>

    <!-- Register button -->
    <div style="position:absolute;bottom:260px;left:40px;z-index:10;">
      <div style="background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;padding:14px 40px;border-radius:50px;font-size:18px;font-weight:900;text-transform:uppercase;letter-spacing:2px;box-shadow:0 4px 20px rgba(239,68,68,0.3);">Register Now</div>
    </div>

    <!-- Footer -->
    ${footerBar(data, `background:${c.colors.ctaGradient};`, data.qrCodeUrl)}
  </div>`;
}

// ——————————————————————————————————————————————
// B5 — Happening Today
// ——————————————————————————————————————————————
function generateB5(data: BannerData): string {
  const c = cfg(data);
  const panelists = data.allPanelists.length > 0 ? data.allPanelists : [{ name: data.panelistName, title: data.panelistTitle, org: data.panelistOrg, headshotUrl: data.headshotUrl }];
  const cardSize = 290;

  return `<div style="position:relative;width:1080px;height:1080px;background:linear-gradient(135deg, ${c.colors.darkBg} 0%, ${adjustBrightness(c.colors.darkBg, -30)} 50%, ${adjustBrightness(c.colors.darkBg, -60)} 100%);overflow:hidden;font-family:'Segoe UI',Arial,sans-serif;">
    ${watermarkSvg(c)}
    ${logoTopRight(c)}

    <!-- HAPPENING TODAY header -->
    <div style="position:absolute;top:40px;left:40px;z-index:10;">
      <div style="font-size:22px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1px;">${data.panelName}</div>
      <div style="font-size:52px;font-weight:900;color:${c.colors.lime};text-shadow:0 2px 10px rgba(${hexToRgb(c.colors.lime)},0.3);margin-top:8px;line-height:1;">HAPPENING<br/>TODAY!</div>
      <div style="font-size:20px;font-weight:600;color:#fff;margin-top:12px;text-shadow:0 1px 4px rgba(0,0,0,0.5);max-width:600px;line-height:1.3;">${data.panelTopic}</div>
    </div>

    <!-- Panelist rectangular cards -->
    <div style="position:absolute;top:340px;left:0;right:0;display:flex;justify-content:center;gap:20px;z-index:10;flex-wrap:wrap;padding:0 40px;">
      ${panelists.slice(0, 4).map(p => `
        <div style="width:${cardSize}px;border-radius:16px;overflow:hidden;background:rgba(${hexToRgb(c.colors.darkBg)},0.6);border:2px solid rgba(${hexToRgb(c.colors.accent)},0.3);backdrop-filter:blur(4px);">
          <div style="width:100%;height:${cardSize}px;overflow:hidden;">
            ${p.headshotUrl
              ? `<img src="${p.headshotUrl}" style="width:100%;height:100%;object-fit:cover;" />`
              : `<div style="width:100%;height:100%;background:linear-gradient(135deg,${c.colors.darkBg},${c.colors.accent});display:flex;align-items:center;justify-content:center;font-size:80px;color:rgba(255,255,255,0.2);">${p.name[0] || '?'}</div>`
            }
          </div>
          <div style="padding:12px;text-align:center;">
            <div style="font-size:15px;font-weight:700;color:${c.colors.lime};">${p.name}</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:2px;">${p.title || ''}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Big QR bottom-left -->
    <div style="position:absolute;bottom:30px;left:30px;z-index:10;">
      ${qrBox(data.qrCodeUrl, true, c)}
    </div>

    <!-- Footer info bottom-center -->
    <div style="position:absolute;bottom:30px;left:200px;right:200px;z-index:10;text-align:center;">
      <div style="font-size:22px;font-weight:900;color:${c.colors.lime};text-transform:uppercase;letter-spacing:2px;">JOIN NOW</div>
      <div style="font-size:24px;font-weight:800;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.5);margin-top:4px;">🕗 ${data.eventTime}</div>
      <div style="font-size:16px;font-weight:600;color:rgba(255,255,255,0.7);margin-top:4px;">${data.websiteUrl || c.websiteUrl}</div>
    </div>

    <!-- Logo bottom-right -->
    <div style="position:absolute;bottom:30px;right:30px;z-index:10;">${c.logoSvg}</div>
  </div>`;
}

// ——————————————————————————————————————————————
// Helpers
// ——————————————————————————————————————————————

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r},${g},${b}`;
}

function adjustBrightness(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(h.substring(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(h.substring(2, 4), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(h.substring(4, 6), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ——————————————————————————————————————————————
// Generator
// ——————————————————————————————————————————————

const BANNER_LABELS: Record<BannerType, string> = {
  B1: 'Intro',
  B2: 'Introduction to the Panel 1',
  B3: 'Introduction to the Panel 2',
  B4: 'One More Day',
  B5: 'Happening Today',
};

export function generateBannersForPanelist(data: BannerData): GeneratedBanner[] {
  const generators: Record<BannerType, (d: BannerData) => string> = {
    B1: generateB1,
    B2: generateB2,
    B3: generateB3,
    B4: generateB4,
    B5: generateB5,
  };

  return (Object.keys(generators) as BannerType[]).map((type) => ({
    id: `${data.panelistFirstName}-${type}-${Date.now()}`,
    type,
    label: BANNER_LABELS[type],
    fileName: `${data.panelistFirstName} ${BANNER_LABELS[type]}`,
    html: generators[type](data),
    panelistName: data.panelistName,
  }));
}
