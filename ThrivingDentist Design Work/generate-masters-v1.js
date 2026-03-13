'use strict';
const path = require('path');
const { E, P, wrap, write, photoCircle, qrBlock, tdLogo,
        svgV1, headerV1, footerV1, PREV } = require('./generate-html');

const DIR = path.join(PREV, 'V1-Clinical-Blue', 'Master');

// The Master style always features the FIRST panelist prominently on the right.
// The 2P/3P/4P count affects the "also featuring" list in the left column.

function alsoFeaturing(count) {
  const others = P.slice(1, count);
  if (!others.length) return '';
  return `<div style="margin-top:18px;padding-top:14px;border-top:1px solid #E2EEFD;">
    <div style="font-size:12px;font-weight:700;color:#777;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">Also Featuring</div>
    ${others.map(p =>
      `<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
        <div style="width:8px;height:8px;border-radius:50%;background:#106EEA;flex-shrink:0;"></div>
        <div>
          <span style="font-size:14px;font-weight:600;color:#121213;">${p.name}</span>
          <span style="font-size:13px;color:#777;"> · ${p.org}</span>
        </div>
      </div>`
    ).join('')}
  </div>`;
}

// ─── shared Master outer grid wrapper ────────────────────────
function masterWrap(count, leftContent) {
  const featured = P[0];
  return wrap(
    'background:#ffffff;',
    svgV1(),
    `<!-- header -->
<div style="background:linear-gradient(135deg,#106EEA 0%,#0073AA 100%);padding:20px 40px;display:flex;align-items:center;justify-content:space-between;">
  <span style="font-size:26px;font-weight:800;color:#fff;letter-spacing:1.5px;text-transform:uppercase;">${E.category}</span>
  ${tdLogo('white')}
</div>`,
    `<!-- main: 2-col grid -->
<div style="height:100%;display:grid;grid-template-columns:1fr 420px;">
  <!-- LEFT: text content -->
  <div style="padding:36px 32px 24px 44px;display:flex;flex-direction:column;justify-content:center;border-right:1.5px solid #E2EEFD;">
    ${leftContent}
    <div style="margin-top:20px;">
      <div style="font-size:28px;font-weight:800;color:#121213;">${featured.name}</div>
      <div style="font-size:17px;font-weight:600;color:#106EEA;margin-top:5px;">${featured.title}</div>
      <div style="font-size:15px;color:#777;margin-top:3px;">${featured.org}</div>
    </div>
    ${alsoFeaturing(count)}
  </div>
  <!-- RIGHT: featured headshot -->
  <div style="display:flex;align-items:center;justify-content:center;padding:24px 32px 24px 24px;">
    <div style="position:relative;">
      <div style="position:absolute;inset:-24px;border-radius:50%;background:radial-gradient(circle,rgba(16,110,234,0.10) 0%,transparent 70%);pointer-events:none;"></div>
      ${photoCircle(featured, 360, '#106EEA', '0 0 0 5px rgba(16,110,234,0.15),0 0 0 14px rgba(16,110,234,0.07),8px 8px 20px rgba(0,0,0,0.15)')}
    </div>
  </div>
</div>`,
    /* footer */
    `<div style="background:#F1F6FE;padding:16px 44px;display:flex;align-items:center;justify-content:space-between;border-top:2px solid #E2EEFD;min-height:115px;">
  <div style="display:flex;align-items:center;gap:16px;">
    ${qrBlock('#106EEA','#106EEA')}
    <div>
      <div style="font-size:13px;font-weight:600;color:#777;margin-bottom:4px;">SCAN TO REGISTER</div>
      <div style="font-size:13px;color:#495057;">${E.url}</div>
    </div>
  </div>
  <div style="text-align:center;">
    <div style="background:#106EEA;border-radius:9999px;padding:11px 44px;margin-bottom:8px;">
      <span style="font-size:20px;font-weight:800;color:#fff;">REGISTER NOW</span>
    </div>
    <div style="font-size:20px;font-weight:700;color:#121213;">📅 ${E.date}</div>
    <div style="font-size:17px;font-weight:600;color:#106EEA;margin-top:4px;">🕗 ${E.time}</div>
  </div>
  <div style="text-align:right;width:190px;"></div>
</div>`
  );
}

// ─── 5 left-column content variants (B1–B5) ─────────────────

function leftB1() {
  return `<div>
    <div style="font-size:12px;font-weight:700;color:#106EEA;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">Meet the Speaker</div>
    <div style="font-size:34px;font-weight:800;color:#121213;line-height:1.18;margin-bottom:16px;">${E.title}</div>
    <div style="background:#E2EEFD;border-left:4px solid #106EEA;border-radius:0 8px 8px 0;padding:14px 18px;font-size:15px;color:#495057;line-height:1.55;">${E.subtitle} — a conversation designed to help you grow a practice you're proud of.</div>
  </div>`;
}

function leftB2() {
  const pts = E.points.slice(0, 4);
  return `<div>
    <div style="font-size:12px;font-weight:700;color:#106EEA;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">Panel Discussion Topics</div>
    <div style="font-size:28px;font-weight:800;color:#121213;line-height:1.18;margin-bottom:16px;">${E.title}</div>
    ${pts.map(pt => `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
      <div style="width:20px;height:20px;border-radius:50%;background:#106EEA;flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:2px;">
        <svg width="10" height="8" viewBox="0 0 10 8"><path d="M1 4L3.5 7L9 1" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <span style="font-size:14px;font-weight:500;color:#495057;line-height:1.45;">${pt}</span>
    </div>`).join('')}
  </div>`;
}

function leftB3() {
  return `<div>
    <div style="font-size:12px;font-weight:700;color:#106EEA;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">Why Join This Panel</div>
    <div style="font-size:28px;font-weight:800;color:#121213;line-height:1.18;margin-bottom:18px;">${E.title}</div>
    <div style="font-size:20px;font-style:italic;color:#121213;border-left:4px solid #106EEA;padding-left:16px;line-height:1.5;margin-bottom:16px;">"The dental professionals thriving today aren't working harder — they've built smarter systems."</div>
    <div style="font-size:14px;color:#495057;line-height:1.6;">Join this expert conversation to discover the frameworks, strategies, and mindset shifts that separate surviving practices from truly thriving ones.</div>
  </div>`;
}

function leftB4() {
  return `<div>
    <div style="font-size:12px;font-weight:700;color:#106EEA;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">Tomorrow!</div>
    <div style="font-size:30px;font-weight:800;color:#121213;line-height:1.18;margin-bottom:16px;">${E.title}</div>
    <div style="display:flex;align-items:center;gap:18px;margin-bottom:18px;">
      <div style="background:#E2EEFD;border:2px solid #106EEA;border-radius:12px;padding:14px 22px;text-align:center;">
        <div style="font-size:56px;font-weight:900;color:#106EEA;line-height:1;">1</div>
        <div style="font-size:13px;font-weight:700;color:#0073AA;">DAY LEFT</div>
      </div>
      <div>
        <div style="font-size:18px;font-weight:700;color:#121213;margin-bottom:4px;">Don't miss it!</div>
        <div style="font-size:14px;color:#495057;line-height:1.5;">Register today and secure your spot. This panel only runs once — no replays without registration.</div>
      </div>
    </div>
    <div style="font-size:14px;font-weight:600;color:#106EEA;">Happening ${E.dateMinus1 ? 'tomorrow' : 'soon'}: ${E.date} · ${E.time}</div>
  </div>`;
}

function leftB5() {
  return `<div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
      <div style="width:14px;height:14px;border-radius:50%;background:#ef4444;box-shadow:0 0 0 4px rgba(239,68,68,0.22);flex-shrink:0;"></div>
      <div style="font-size:22px;font-weight:900;color:#121213;letter-spacing:0.5px;">LIVE NOW · HAPPENING TODAY</div>
    </div>
    <div style="font-size:28px;font-weight:800;color:#121213;line-height:1.18;margin-bottom:14px;">${E.title}</div>
    <div style="background:#FEF2F2;border:1.5px solid #fca5a5;border-radius:10px;padding:14px 18px;margin-bottom:14px;">
      <div style="font-size:16px;font-weight:700;color:#121213;">Starting at ${E.time}</div>
      <div style="font-size:14px;color:#495057;margin-top:4px;">Join now — the panel is live. Don't wait, seats are filling.</div>
    </div>
    <div style="font-size:14px;color:#495057;line-height:1.6;">${E.subtitle}</div>
  </div>`;
}

// ─────────────────────────────────────────────
// GENERATE ALL 15 V1 MASTER FILES
// ─────────────────────────────────────────────
const leftFns = [leftB1, leftB2, leftB3, leftB4, leftB5];
const labels  = ['B1_Intro','B2_Panel_Intro1','B3_Panel_Intro2','B4_One_More_Day','B5_Happening_Today'];

console.log('\n── V1 Master files ──');
for (const count of [2, 3, 4]) {
  leftFns.forEach((fn, i) => {
    write(DIR, `TD_V1_${count}P_Master_${labels[i]}.html`, masterWrap(count, fn()));
  });
}
console.log(`  → 15 V1 Master files written`);
