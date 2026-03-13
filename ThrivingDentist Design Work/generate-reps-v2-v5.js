'use strict';
const path = require('path');
const { E, P, wrap, write, photoCircle, qrBlock, tdLogo,
        svgV2, svgV3, svgV4, svgV5, PREV } = require('./generate-html');

// Each representative uses B2-style 3P layout (most information-rich)
// to showcase the theme fully. Unique background + colors + SVG motifs.

// ═══════════════════════════════════════════════
// V2 — Dark Authority
// Background: dark gradient #121213 → #343A40
// Motifs: smile arcs + sparkle stars, white
// ═══════════════════════════════════════════════
function repV2() {
  const ps = P.slice(0, 3);
  const pointsList = E.points.map(pt =>
    `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:9px;">
      <div style="width:20px;height:20px;border-radius:50%;background:#106EEA;flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center;">
        <svg width="10" height="8" viewBox="0 0 10 8"><path d="M1 4L3.5 7L9 1" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <span style="font-size:14px;font-weight:400;color:#E2EEFD;line-height:1.45;">${pt}</span>
    </div>`
  ).join('');

  const photosCol = ps.map(p =>
    `<div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">
      <div style="width:80px;height:80px;border-radius:50%;border:5px solid #106EEA;overflow:hidden;flex-shrink:0;box-shadow:0 0 0 3px rgba(16,110,234,0.25);">
        <img src="${p.img}" style="width:100%;height:100%;object-fit:cover;object-position:center top;" crossorigin="anonymous">
      </div>
      <div>
        <div style="font-size:16px;font-weight:700;color:#ffffff;">${p.name}</div>
        <div style="font-size:13px;font-weight:600;color:#17A2B8;margin-top:3px;">${p.title}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:2px;">${p.org}</div>
      </div>
    </div>`
  ).join('');

  const header = `<div style="background:#106EEA;padding:22px 40px;text-align:center;">
  <span style="font-size:28px;font-weight:800;color:#fff;letter-spacing:1.5px;text-transform:uppercase;">${E.category}</span>
</div>`;

  const main = `<div style="height:100%;display:grid;grid-template-columns:1fr 1fr;">
  <!-- LEFT: title + points -->
  <div style="padding:30px 28px 20px 44px;display:flex;flex-direction:column;justify-content:center;border-right:1px solid rgba(255,255,255,0.08);">
    <div style="font-size:12px;font-weight:700;color:#17A2B8;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">${E.category}</div>
    <div style="font-size:30px;font-weight:800;color:#ffffff;line-height:1.18;margin-bottom:18px;">${E.title}</div>
    <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:8px;">What We'll Cover</div>
    ${pointsList}
  </div>
  <!-- RIGHT: panelists -->
  <div style="padding:30px 40px 20px 28px;display:flex;flex-direction:column;justify-content:center;">
    <div style="font-size:12px;font-weight:700;color:#17A2B8;letter-spacing:2px;text-transform:uppercase;margin-bottom:16px;">Featured Panelists</div>
    ${photosCol}
  </div>
</div>`;

  const footer = `<div style="background:rgba(0,0,0,0.35);padding:18px 44px;display:flex;align-items:center;min-height:128px;border-top:1px solid rgba(255,255,255,0.08);">
  <div style="position:absolute;left:44px;">
    <div style="border:3px solid #106EEA;border-radius:10px;padding:7px;background:rgba(255,255,255,0.95);display:inline-block;">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(E.regUrl)}" style="width:90px;height:90px;display:block;" crossorigin="anonymous">
    </div>
  </div>
  <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:7px;">
    <div style="background:#106EEA;border-radius:9999px;padding:11px 50px;">
      <span style="font-size:20px;font-weight:800;color:#fff;">REGISTER NOW</span>
    </div>
    <div style="font-size:26px;font-weight:800;color:#ffffff;">📅 ${E.date}</div>
    <div style="font-size:21px;font-weight:700;color:#17A2B8;">🕗 ${E.time}</div>
  </div>
  <div style="position:absolute;right:44px;">${tdLogo('white')}</div>
</div>`;

  return wrap(
    'background:linear-gradient(135deg,#121213 0%,#343A40 100%);',
    svgV2(), header, main, footer
  );
}

// ═══════════════════════════════════════════════
// V3 — Brand Gradient
// Background: full brand gradient #106EEA → #0073AA
// Motifs: tooth silhouettes + crosses, white
// ═══════════════════════════════════════════════
function repV3() {
  const ps = P.slice(0, 3);
  const pointsList = E.points.map(pt =>
    `<div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:8px;">
      <div style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.7);flex-shrink:0;margin-top:6px;"></div>
      <span style="font-size:14px;font-weight:400;color:rgba(255,255,255,0.85);line-height:1.45;">${pt}</span>
    </div>`
  ).join('');

  const cards = ps.map(p =>
    `<div style="background:#ffffff;border-radius:16px;padding:20px 18px;display:flex;flex-direction:column;align-items:center;box-shadow:8px 8px 20px rgba(0,0,0,0.22);flex:1;">
      <div style="width:130px;height:130px;border-radius:50%;border:5px solid #106EEA;overflow:hidden;margin-bottom:12px;box-shadow:0 4px 12px rgba(0,0,0,0.18);">
        <img src="${p.img}" style="width:100%;height:100%;object-fit:cover;object-position:center top;" crossorigin="anonymous">
      </div>
      <div style="font-size:15px;font-weight:700;color:#121213;text-align:center;line-height:1.2;">${p.name}</div>
      <div style="font-size:12px;font-weight:600;color:#106EEA;text-align:center;margin-top:4px;">${p.title}</div>
      <div style="font-size:11px;color:#777;text-align:center;margin-top:2px;">${p.org}</div>
    </div>`
  ).join('\n');

  const header = `<div style="background:rgba(0,0,0,0.18);padding:22px 40px;text-align:center;backdrop-filter:blur(4px);">
  <span style="font-size:28px;font-weight:800;color:#fff;letter-spacing:1.5px;text-transform:uppercase;">${E.category}</span>
</div>`;

  const main = `<div style="height:100%;display:flex;flex-direction:column;">
  <!-- Title + points row -->
  <div style="display:grid;grid-template-columns:1fr 1fr;flex-shrink:0;padding:22px 44px 14px;">
    <div>
      <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.65);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">${E.category}</div>
      <div style="font-size:28px;font-weight:800;color:#ffffff;line-height:1.15;">${E.title}</div>
    </div>
    <div style="padding-left:28px;">
      <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.65);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">Discussion Topics</div>
      ${pointsList}
    </div>
  </div>
  <!-- Panelist white cards -->
  <div style="flex:1;display:flex;align-items:center;justify-content:center;gap:18px;padding:0 40px 10px;">
    ${cards}
  </div>
</div>`;

  const footer = `<div style="background:rgba(0,0,0,0.20);padding:18px 44px;display:flex;align-items:center;min-height:120px;border-top:1px solid rgba(255,255,255,0.15);">
  <div style="position:absolute;left:44px;">
    <div style="border:3px solid rgba(255,255,255,0.8);border-radius:10px;padding:7px;background:#fff;display:inline-block;">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(E.regUrl)}" style="width:90px;height:90px;display:block;" crossorigin="anonymous">
    </div>
  </div>
  <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:7px;">
    <div style="background:#ffffff;border-radius:9999px;padding:11px 50px;box-shadow:4px 4px 12px rgba(0,0,0,0.2);">
      <span style="font-size:20px;font-weight:800;color:#106EEA;">REGISTER NOW</span>
    </div>
    <div style="font-size:25px;font-weight:800;color:#ffffff;">📅 ${E.date}</div>
    <div style="font-size:20px;font-weight:700;color:rgba(255,255,255,0.85);">🕗 ${E.time}</div>
  </div>
  <div style="position:absolute;right:44px;">${tdLogo('white')}</div>
</div>`;

  return wrap(
    'background:linear-gradient(135deg,#106EEA 0%,#0073AA 100%);',
    svgV3(), header, main, footer
  );
}

// ═══════════════════════════════════════════════
// V4 — Steel Precision
// Background: steel gradient #1E83D0 → #17A2B8
// Motifs: toothbrushes + water drops, white
// ═══════════════════════════════════════════════
function repV4() {
  const ps = P.slice(0, 3);
  const pointsList = E.points.map((pt, i) =>
    `<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
      <div style="font-size:13px;font-weight:800;color:#121213;min-width:20px;flex-shrink:0;margin-top:1px;">0${i+1}</div>
      <span style="font-size:14px;font-weight:400;color:rgba(255,255,255,0.88);line-height:1.45;">${pt}</span>
    </div>`
  ).join('');

  const photosCol = ps.map(p =>
    `<div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">
      <div style="width:82px;height:82px;border-radius:50%;border:5px solid #121213;overflow:hidden;flex-shrink:0;box-shadow:0 0 0 3px rgba(255,255,255,0.25),4px 4px 10px rgba(0,0,0,0.25);">
        <img src="${p.img}" style="width:100%;height:100%;object-fit:cover;object-position:center top;" crossorigin="anonymous">
      </div>
      <div>
        <div style="font-size:16px;font-weight:700;color:#ffffff;">${p.name}</div>
        <div style="font-size:13px;font-weight:600;color:#E2EEFD;margin-top:3px;">${p.title}</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:2px;">${p.org}</div>
      </div>
    </div>`
  ).join('');

  const header = `<div style="background:#121213;padding:22px 40px;text-align:center;">
  <span style="font-size:28px;font-weight:800;color:#fff;letter-spacing:1.5px;text-transform:uppercase;">${E.category}</span>
</div>`;

  const main = `<div style="height:100%;display:grid;grid-template-columns:1fr 1fr;">
  <!-- LEFT: title + numbered points -->
  <div style="padding:30px 28px 20px 44px;display:flex;flex-direction:column;justify-content:center;border-right:1px solid rgba(255,255,255,0.12);">
    <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.55);letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">${E.category}</div>
    <div style="font-size:30px;font-weight:800;color:#ffffff;line-height:1.18;margin-bottom:20px;">${E.title}</div>
    <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.4);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:8px;">Discussion Agenda</div>
    ${pointsList}
  </div>
  <!-- RIGHT: panelists -->
  <div style="padding:30px 40px 20px 28px;display:flex;flex-direction:column;justify-content:center;">
    <div style="font-size:12px;font-weight:700;color:rgba(255,255,255,0.55);letter-spacing:2px;text-transform:uppercase;margin-bottom:16px;">Featured Panelists</div>
    ${photosCol}
  </div>
</div>`;

  const footer = `<div style="background:#121213;padding:18px 44px;display:flex;align-items:center;min-height:124px;border-top:2px solid rgba(255,255,255,0.1);">
  <div style="position:absolute;left:44px;">
    <div style="border:3px solid #1E83D0;border-radius:10px;padding:7px;background:#fff;display:inline-block;">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(E.regUrl)}" style="width:90px;height:90px;display:block;" crossorigin="anonymous">
    </div>
  </div>
  <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:7px;">
    <div style="background:#121213;border:2px solid #fff;border-radius:9999px;padding:11px 50px;">
      <span style="font-size:20px;font-weight:800;color:#fff;">REGISTER NOW</span>
    </div>
    <div style="font-size:26px;font-weight:800;color:#ffffff;">📅 ${E.date}</div>
    <div style="font-size:20px;font-weight:700;color:#E2EEFD;">🕗 ${E.time}</div>
  </div>
  <div style="position:absolute;right:44px;">${tdLogo('white')}</div>
</div>`;

  return wrap(
    'background:linear-gradient(135deg,#1E83D0 0%,#17A2B8 100%);',
    svgV4(), header, main, footer
  );
}

// ═══════════════════════════════════════════════
// V5 — Light Authority
// Background: #F1F6FE (warm professional light)
// Motifs: deep blue shields + checkmarks, #0073AA
// ═══════════════════════════════════════════════
function repV5() {
  const ps = P.slice(0, 3);
  const pointsList = E.points.map(pt =>
    `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
      <div style="width:20px;height:20px;border-radius:50%;background:#0073AA;flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:2px;">
        <svg width="10" height="8" viewBox="0 0 10 8"><path d="M1 4L3.5 7L9 1" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <span style="font-size:14px;font-weight:500;color:#495057;line-height:1.45;">${pt}</span>
    </div>`
  ).join('');

  const photosCol = ps.map(p =>
    `<div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;background:#ffffff;border-radius:12px;padding:12px 16px;box-shadow:6px 6px 9px rgba(0,0,0,0.08);">
      <div style="width:80px;height:80px;border-radius:50%;border:5px solid #0073AA;overflow:hidden;flex-shrink:0;">
        <img src="${p.img}" style="width:100%;height:100%;object-fit:cover;object-position:center top;" crossorigin="anonymous">
      </div>
      <div>
        <div style="font-size:16px;font-weight:700;color:#121213;">${p.name}</div>
        <div style="font-size:13px;font-weight:600;color:#0073AA;margin-top:3px;">${p.title}</div>
        <div style="font-size:12px;color:#777;margin-top:2px;">${p.org}</div>
      </div>
    </div>`
  ).join('');

  const header = `<div style="background:#121213;padding:22px 40px;text-align:center;">
  <span style="font-size:28px;font-weight:800;color:#fff;letter-spacing:1.5px;text-transform:uppercase;">${E.category}</span>
</div>`;

  const main = `<div style="height:100%;display:grid;grid-template-columns:1fr 1fr;">
  <!-- LEFT: title + points -->
  <div style="padding:30px 28px 20px 44px;display:flex;flex-direction:column;justify-content:center;border-right:2px solid #E2EEFD;">
    <div style="font-size:12px;font-weight:700;color:#0073AA;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">${E.category}</div>
    <div style="font-size:30px;font-weight:800;color:#121213;line-height:1.18;margin-bottom:16px;">${E.title}</div>
    <div style="font-size:12px;font-weight:700;color:#495057;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px;border-bottom:1.5px solid #E2EEFD;padding-bottom:8px;">Discussion Topics</div>
    ${pointsList}
  </div>
  <!-- RIGHT: panelists -->
  <div style="padding:30px 40px 20px 28px;display:flex;flex-direction:column;justify-content:center;">
    <div style="font-size:12px;font-weight:700;color:#0073AA;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;">Featured Panelists</div>
    ${photosCol}
  </div>
</div>`;

  const footer = `<div style="background:#ffffff;padding:18px 44px;display:flex;align-items:center;min-height:128px;border-top:2px solid #E2EEFD;">
  <div style="position:absolute;left:44px;">
    <div style="border:3px solid #0073AA;border-radius:10px;padding:7px;background:#fff;display:inline-block;">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(E.regUrl)}" style="width:90px;height:90px;display:block;" crossorigin="anonymous">
    </div>
  </div>
  <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:7px;">
    <div style="background:#121213;border-radius:9999px;padding:11px 50px;">
      <span style="font-size:20px;font-weight:800;color:#fff;">REGISTER NOW</span>
    </div>
    <div style="font-size:26px;font-weight:800;color:#121213;">📅 ${E.date}</div>
    <div style="font-size:20px;font-weight:700;color:#0073AA;">🕗 ${E.time}</div>
  </div>
  <div style="position:absolute;right:44px;">${tdLogo('color')}</div>
</div>`;

  return wrap(
    'background:#F1F6FE;',
    svgV5(), header, main, footer
  );
}

// ─────────────────────────────────────────────
// GENERATE V2–V5 REPRESENTATIVE FILES
// ─────────────────────────────────────────────
console.log('\n── V2–V5 Representative files ──');
write(path.join(PREV, 'V2-Dark-Authority'),  'TD_V2_3P_B2_Dark_Authority.html',    repV2());
write(path.join(PREV, 'V3-Brand-Gradient'),  'TD_V3_3P_B2_Brand_Gradient.html',    repV3());
write(path.join(PREV, 'V4-Steel-Precision'), 'TD_V4_3P_B2_Steel_Precision.html',   repV4());
write(path.join(PREV, 'V5-Light-Authority'), 'TD_V5_3P_B2_Light_Authority.html',   repV5());
console.log('  → 4 representative files written');
