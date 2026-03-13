'use strict';
const path = require('path');
const { E, P, wrap, write, photoCircle, qrBlock, tdLogo,
        svgV1, headerV1, footerV1, PREV } = require('./generate-html');

const DIR = path.join(PREV, 'V1-Clinical-Blue', 'Banner');

// ─── headshot sizes by panelist count ───────────────────────
const SIZE = { 2: 330, 3: 255, 4: 205 };
const GAP  = { 2: 70,  3: 48,  4: 36  };

// ─── shared headshot row ─────────────────────────────────────
function headshotRow(count, size) {
  const ps = P.slice(0, count);
  const gap = GAP[count];
  return `<div style="display:flex;justify-content:center;gap:${gap}px;align-items:flex-start;margin-top:24px;">
  ${ps.map(p => `<div style="display:flex;flex-direction:column;align-items:center;flex:0 0 auto;">
    ${photoCircle(p, size, '#106EEA', '0 0 0 4px rgba(16,110,234,0.15),6px 6px 9px rgba(0,0,0,0.15)')}
    <div style="font-size:${count===4?18:20}px;font-weight:700;color:#121213;text-align:center;margin-top:14px;max-width:${size+10}px;line-height:1.2;">${p.name}</div>
    <div style="font-size:${count===4?13:15}px;font-weight:600;color:#106EEA;text-align:center;margin-top:4px;">${p.title}</div>
    <div style="font-size:${count===4?12:13}px;font-weight:400;color:#777;text-align:center;margin-top:2px;">${p.org}</div>
  </div>`).join('\n  ')}
</div>`;
}

// ═══════════════════════════════════════════════
// B1 — Panelist Intro: clean centred spotlight
// ═══════════════════════════════════════════════
function bannerB1(count) {
  const size = SIZE[count];
  const main = `
<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px 44px 10px;">
  <div style="background:#E2EEFD;border:1.5px solid #106EEA;border-radius:9999px;padding:8px 28px;margin-bottom:18px;">
    <span style="font-size:16px;font-weight:600;color:#106EEA;">${E.title}</span>
  </div>
  <div style="font-size:${count===4?36:42}px;font-weight:800;color:#121213;text-align:center;line-height:1.15;margin-bottom:6px;">${E.subtitle}</div>
  ${headshotRow(count, size)}
</div>`;
  return wrap(
    'background:#ffffff;',
    svgV1(),
    headerV1(),
    main,
    footerV1()
  );
}

// ═══════════════════════════════════════════════
// B2 — Panel Introduction 1: split layout with discussion points
// ═══════════════════════════════════════════════
function bannerB2(count) {
  const size = SIZE[count];
  const ps   = P.slice(0, count);

  const pointsList = E.points.map(pt =>
    `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
      <div style="width:22px;height:22px;border-radius:50%;background:#106EEA;flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:1px;">
        <svg width="12" height="10" viewBox="0 0 12 10"><path d="M1 5L4.5 8.5L11 1.5" stroke="white" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <span style="font-size:15px;font-weight:500;color:#495057;line-height:1.4;">${pt}</span>
    </div>`
  ).join('');

  const photosCol = ps.map(p =>
    `<div style="display:flex;align-items:center;gap:14px;margin-bottom:${count===4?8:12}px;">
      <div style="width:${size}px;height:${size}px;border-radius:50%;border:6px solid #106EEA;overflow:hidden;flex-shrink:0;box-shadow:0 0 0 3px rgba(16,110,234,0.12),4px 4px 8px rgba(0,0,0,0.12);">
        <img src="${p.img}" style="width:100%;height:100%;object-fit:cover;object-position:center top;" crossorigin="anonymous">
      </div>
      <div>
        <div style="font-size:${count===4?15:17}px;font-weight:700;color:#121213;line-height:1.2;">${p.name}</div>
        <div style="font-size:${count===4?13:14}px;font-weight:600;color:#106EEA;margin-top:3px;">${p.title}</div>
        <div style="font-size:${count===4?12:13}px;color:#777;margin-top:2px;">${p.org}</div>
      </div>
    </div>`
  ).join('');

  const main = `
<div style="height:100%;display:grid;grid-template-columns:1fr 1fr;gap:0;">
  <!-- LEFT: title + points -->
  <div style="padding:28px 32px 16px 44px;display:flex;flex-direction:column;justify-content:center;border-right:1.5px solid #E2EEFD;">
    <div style="font-size:13px;font-weight:700;color:#106EEA;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">${E.category}</div>
    <div style="font-size:${count===4?26:30}px;font-weight:800;color:#121213;line-height:1.18;margin-bottom:20px;">${E.title}</div>
    <div style="font-size:13px;font-weight:700;color:#495057;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;border-bottom:1px solid #E2EEFD;padding-bottom:8px;">What We'll Cover</div>
    ${pointsList}
  </div>
  <!-- RIGHT: panelists -->
  <div style="padding:28px 36px 16px 32px;display:flex;flex-direction:column;justify-content:center;">
    <div style="font-size:13px;font-weight:700;color:#106EEA;letter-spacing:2px;text-transform:uppercase;margin-bottom:16px;">Featured Panelists</div>
    ${photosCol}
  </div>
</div>`;

  return wrap('background:#ffffff;', svgV1(), headerV1(), main, footerV1());
}

// ═══════════════════════════════════════════════
// B3 — Panel Introduction 2: panelists in row with blue vertical separators
// ═══════════════════════════════════════════════
function bannerB3(count) {
  const size = SIZE[count];
  const ps   = P.slice(0, count);

  const panelItems = ps.map((p, i) => {
    const sep = i < count - 1
      ? `<div style="width:2px;height:${size + 20}px;background:linear-gradient(180deg,transparent,#106EEA,transparent);align-self:center;margin:0 ${GAP[count]/2}px;flex-shrink:0;"></div>`
      : '';
    return `<div style="display:flex;flex-direction:column;align-items:center;flex:0 0 auto;">
      ${photoCircle(p, size, '#106EEA', '0 0 0 4px rgba(16,110,234,0.15),6px 6px 12px rgba(0,0,0,0.12)')}
      <div style="font-size:${count===4?17:19}px;font-weight:700;color:#121213;text-align:center;margin-top:12px;max-width:${size+20}px;line-height:1.2;">${p.name}</div>
      <div style="font-size:${count===4?13:14}px;font-weight:600;color:#106EEA;text-align:center;margin-top:4px;">${p.title}</div>
      <div style="font-size:${count===4?12:13}px;color:#777;text-align:center;margin-top:2px;">${p.org}</div>
    </div>${sep}`;
  }).join('\n');

  const main = `
<div style="height:100%;display:flex;flex-direction:column;">
  <!-- Top accent strip -->
  <div style="background:#F1F6FE;border-bottom:2px solid #E2EEFD;padding:16px 44px;display:flex;align-items:center;gap:20px;flex-shrink:0;">
    <div style="flex:1;">
      <div style="font-size:13px;font-weight:700;color:#106EEA;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">${E.category}</div>
      <div style="font-size:${count===4?22:26}px;font-weight:800;color:#121213;line-height:1.15;">${E.subtitle}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:14px;font-weight:600;color:#495057;">📅 ${E.dateShort}</div>
      <div style="font-size:14px;font-weight:600;color:#106EEA;margin-top:4px;">🕗 ${E.time}</div>
    </div>
  </div>
  <!-- Panelists row -->
  <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:20px 40px;gap:0;">
    ${panelItems}
  </div>
</div>`;

  return wrap('background:#ffffff;', svgV1(), headerV1(), main, footerV1());
}

// ═══════════════════════════════════════════════
// B4 — Countdown: featured panelist + big "1 MORE DAY" counter
// ═══════════════════════════════════════════════
function bannerB4(count) {
  // Always features first panelist prominently, others listed below
  const featured = P[0];
  const rest = P.slice(1, count);
  const featSize = count === 4 ? 280 : count === 3 ? 300 : 320;

  const alsoFeaturing = rest.length
    ? `<div style="margin-top:16px;padding-top:14px;border-top:1px solid #E2EEFD;">
        <div style="font-size:13px;font-weight:600;color:#777;margin-bottom:8px;">ALSO FEATURING</div>
        ${rest.map(p => `<div style="font-size:14px;font-weight:600;color:#495057;margin-bottom:4px;">· ${p.name}</div>`).join('')}
      </div>` : '';

  const main = `
<div style="height:100%;display:grid;grid-template-columns:1fr 1fr;align-items:center;">
  <!-- LEFT: featured panelist -->
  <div style="display:flex;flex-direction:column;align-items:center;padding:20px 20px 20px 44px;">
    ${photoCircle(featured, featSize, '#106EEA', '0 0 0 5px rgba(16,110,234,0.18),8px 8px 20px rgba(0,0,0,0.15)')}
    <div style="font-size:22px;font-weight:800;color:#121213;text-align:center;margin-top:18px;">${featured.name}</div>
    <div style="font-size:16px;font-weight:600;color:#106EEA;text-align:center;margin-top:5px;">${featured.title}</div>
    <div style="font-size:14px;color:#777;text-align:center;margin-top:3px;">${featured.org}</div>
    ${alsoFeaturing}
  </div>
  <!-- RIGHT: countdown -->
  <div style="display:flex;flex-direction:column;align-items:flex-start;padding:20px 44px 20px 20px;">
    <div style="font-size:190px;font-weight:900;color:#106EEA;line-height:0.85;letter-spacing:-4px;">1</div>
    <div style="font-size:54px;font-weight:900;color:#121213;line-height:1.05;margin-top:10px;">MORE<br>DAY<br>TO GO</div>
    <div style="margin-top:20px;background:#E2EEFD;border:1.5px solid #106EEA;border-radius:9999px;padding:8px 22px;">
      <span style="font-size:16px;font-weight:700;color:#0073AA;">${E.dateMinus1}</span>
    </div>
  </div>
</div>`;

  return wrap('background:#ffffff;', svgV1(), headerV1(), main, footerV1('REGISTER NOW'));
}

// ═══════════════════════════════════════════════
// B5 — Happening Today: urgency banner with live dot
// ═══════════════════════════════════════════════
function bannerB5(count) {
  const size = Math.round(SIZE[count] * 0.92);
  const ps   = P.slice(0, count);

  const panelRow = ps.map(p =>
    `<div style="display:flex;flex-direction:column;align-items:center;flex:0 0 auto;">
      ${photoCircle(p, size, '#106EEA', '0 0 0 4px rgba(16,110,234,0.15),4px 4px 10px rgba(0,0,0,0.12)')}
      <div style="font-size:${count===4?16:19}px;font-weight:700;color:#121213;text-align:center;margin-top:12px;max-width:${size+10}px;line-height:1.2;">${p.name}</div>
      <div style="font-size:${count===4?13:14}px;font-weight:600;color:#106EEA;text-align:center;margin-top:3px;">${p.title}</div>
    </div>`
  ).join('\n');

  const main = `
<div style="height:100%;display:flex;flex-direction:column;">
  <!-- Urgency strip -->
  <div style="background:#fff;border-bottom:2px solid #E2EEFD;padding:18px 44px 14px;flex-shrink:0;">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:6px;">
      <div style="width:16px;height:16px;border-radius:50%;background:#ef4444;box-shadow:0 0 0 4px rgba(239,68,68,0.25);flex-shrink:0;"></div>
      <div style="font-size:36px;font-weight:900;color:#121213;letter-spacing:0.5px;">HAPPENING TODAY!</div>
    </div>
    <div style="font-size:18px;font-weight:600;color:#495057;margin-left:30px;">${E.title} · <span style="color:#106EEA;">${E.time}</span></div>
  </div>
  <!-- Panelists -->
  <div style="flex:1;display:flex;align-items:center;justify-content:center;gap:${GAP[count]}px;padding:16px 40px;">
    ${panelRow}
  </div>
</div>`;

  return wrap('background:#ffffff;', svgV1(), headerV1(), main, footerV1('JOIN NOW'));
}

// ─────────────────────────────────────────────
// GENERATE ALL 15 V1 BANNER FILES
// ─────────────────────────────────────────────
console.log('\n── V1 Banner files ──');
for (const count of [2, 3, 4]) {
  write(DIR, `TD_V1_${count}P_B1_Panelist_Intro.html`,      bannerB1(count));
  write(DIR, `TD_V1_${count}P_B2_Panel_Intro1.html`,        bannerB2(count));
  write(DIR, `TD_V1_${count}P_B3_Panel_Intro2.html`,        bannerB3(count));
  write(DIR, `TD_V1_${count}P_B4_Countdown.html`,           bannerB4(count));
  write(DIR, `TD_V1_${count}P_B5_Happening_Today.html`,     bannerB5(count));
}
console.log(`  → 15 V1 Banner files written`);
