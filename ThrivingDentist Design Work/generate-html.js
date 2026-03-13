'use strict';
const fs   = require('fs');
const path = require('path');

const BASE  = __dirname;
const PREV  = path.join(BASE, 'preview');

// ─────────────────────────────────────────────
// EVENT DATA
// ─────────────────────────────────────────────
const E = {
  title    : 'Dental Practice Growth Summit',
  subtitle : 'Building a Thriving Practice in the Modern Age',
  category : 'Thriving Dentist Expert Panel',
  date     : 'Wednesday, April 9th, 2026',
  dateShort: 'April 9, 2026',
  dateMinus1:'Tuesday, April 8th, 2026',
  time     : '8:00 PM EST',
  url      : 'www.thrivingdentist.com',
  regUrl   : 'https://thrivingdentist.com/register',
  points   : [
    'How to attract and retain high-value patients',
    'Building a high-performance dental team',
    'Mastering case acceptance without pressure',
    'Leveraging technology to scale your practice',
    'Creating a practice culture that patients love',
  ],
};

const P = [
  { name:'Dr. Sarah Mitchell, DDS', first:'Sarah', title:'Founder & CEO',            org:'Apex Dental Coaching',    img:'https://randomuser.me/api/portraits/women/44.jpg' },
  { name:'Dr. James Thornton, DMD', first:'James', title:'Practice Growth Strategist',org:'ThriveSmile Consulting',  img:'https://randomuser.me/api/portraits/men/32.jpg'   },
  { name:'Dr. Priya Nair, DDS',     first:'Priya', title:'Clinical Director',         org:'Modern Smile Collective', img:'https://randomuser.me/api/portraits/women/68.jpg' },
  { name:'Dr. Marcus Webb, DMD',    first:'Marcus',title:'Patient Experience Expert', org:'Webb Dental Group',       img:'https://randomuser.me/api/portraits/men/75.jpg'   },
];

const QR = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(E.regUrl)}`;

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function write(dir, filename, html) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), html, 'utf8');
  console.log(`  ✓ ${path.relative(BASE, path.join(dir, filename))}`);
}

function wrap(posterStyle, svgBg, header, main, footer) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;">
<div class="poster" style="width:1080px;height:1080px;display:flex;flex-direction:column;overflow:hidden;position:relative;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,sans-serif;${posterStyle}">
${svgBg}
<div style="position:relative;z-index:3;flex-shrink:0;">${header}</div>
<div style="position:relative;z-index:3;flex:1;overflow:hidden;">${main}</div>
<div style="position:relative;z-index:3;flex-shrink:0;">${footer}</div>
</div></body></html>`;
}

function photoCircle(p, size, borderColor, shadow) {
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;border:8px solid ${borderColor};overflow:hidden;box-shadow:${shadow};flex-shrink:0;">
  <img src="${p.img}" style="width:100%;height:100%;object-fit:cover;object-position:center top;" crossorigin="anonymous">
</div>`;
}

function qrBlock(borderColor, labelColor) {
  return `<div style="text-align:center;">
  <div style="border:3px solid ${borderColor};border-radius:10px;padding:8px;background:#fff;display:inline-block;">
    <img src="${QR}" style="width:96px;height:96px;display:block;" crossorigin="anonymous">
  </div>
  <div style="font-size:11px;font-weight:700;color:${labelColor};text-align:center;margin-top:4px;letter-spacing:1px;">SCAN</div>
</div>`;
}

// ─────────────────────────────────────────────
// TD LOGO SVG
// ─────────────────────────────────────────────
function tdLogo(variant) {
  // variant: 'color' | 'white'
  const tooth  = variant === 'white' ? '#ffffff' : '#106EEA';
  const label1 = variant === 'white' ? 'rgba(255,255,255,0.95)' : '#121213';
  const label2 = variant === 'white' ? 'rgba(255,255,255,0.65)' : '#495057';
  return `<svg viewBox="0 0 210 56" width="185" height="50" xmlns="http://www.w3.org/2000/svg">
  <rect x="1" y="13" width="38" height="24" rx="7" fill="${tooth}"/>
  <rect x="6"  y="4"  width="10" height="13" rx="3" fill="${tooth}"/>
  <rect x="22" y="4"  width="10" height="13" rx="3" fill="${tooth}"/>
  <ellipse cx="13" cy="43" rx="6" ry="9" fill="${tooth}"/>
  <ellipse cx="27" cy="43" rx="6" ry="9" fill="${tooth}"/>
  <text x="50" y="26" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="16" font-weight="700" fill="${label1}">THRIVING DENTIST</text>
  <text x="50" y="44" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="12" font-weight="400" fill="${label2}">Expert Panel Series</text>
</svg>`;
}

// ─────────────────────────────────────────────
// SVG BACKGROUND LAYERS (5 unique sets)
// ─────────────────────────────────────────────

// V1: Clinical Blue — molar teeth + dental mirrors in #106EEA (subtle on white)
function svgV1() {
  return `<div style="position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden;">
<svg width="1080" height="1080" viewBox="0 0 1080 1080" style="position:absolute;inset:0;">
  <!-- Molar 1: top-left -->
  <g transform="translate(95,180) rotate(-12) scale(2.2)" opacity="0.055">
    <rect x="-18" y="-22" width="36" height="26" rx="7" fill="#106EEA"/>
    <ellipse cx="-9" cy="11" rx="6" ry="12" fill="#106EEA"/>
    <ellipse cx="9"  cy="11" rx="6" ry="12" fill="#106EEA"/>
  </g>
  <!-- Dental mirror 1: top-right -->
  <g transform="translate(960,240) rotate(28)" opacity="0.045">
    <circle cx="0" cy="0" r="20" fill="none" stroke="#106EEA" stroke-width="5"/>
    <rect x="-3" y="20" width="6" height="34" rx="3" fill="#106EEA"/>
  </g>
  <!-- Molar 2: mid-left -->
  <g transform="translate(62,590) rotate(22) scale(1.7)" opacity="0.04">
    <rect x="-18" y="-22" width="36" height="26" rx="7" fill="#106EEA"/>
    <ellipse cx="-9" cy="11" rx="6" ry="12" fill="#106EEA"/>
    <ellipse cx="9"  cy="11" rx="6" ry="12" fill="#106EEA"/>
  </g>
  <!-- Dental mirror 2: bottom-right -->
  <g transform="translate(988,800) rotate(-22) scale(1.3)" opacity="0.05">
    <circle cx="0" cy="0" r="20" fill="none" stroke="#106EEA" stroke-width="5"/>
    <rect x="-3" y="20" width="6" height="34" rx="3" fill="#106EEA"/>
  </g>
  <!-- Molar 3: bottom-center -->
  <g transform="translate(515,946) rotate(-7) scale(1.9)" opacity="0.04">
    <rect x="-18" y="-22" width="36" height="26" rx="7" fill="#106EEA"/>
    <ellipse cx="-9" cy="11" rx="6" ry="12" fill="#106EEA"/>
    <ellipse cx="9"  cy="11" rx="6" ry="12" fill="#106EEA"/>
  </g>
</svg></div>`;
}

// V2: Dark Authority — smile arcs + 4-point sparkle stars in white
function svgV2() {
  return `<div style="position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden;">
<svg width="1080" height="1080" viewBox="0 0 1080 1080" style="position:absolute;inset:0;">
  <!-- Smile arc 1: top-left -->
  <g transform="translate(110,195) rotate(-8) scale(2.6)" opacity="0.08">
    <path d="M-30,0 Q0,24 30,0" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
  </g>
  <!-- Sparkle 1: top-right -->
  <g transform="translate(912,178) scale(1.3)" opacity="0.09">
    <path d="M0,-22 L3.5,-3.5 L22,0 L3.5,3.5 L0,22 L-3.5,3.5 L-22,0 L-3.5,-3.5 Z" fill="white"/>
  </g>
  <!-- Smile arc 2: mid-right -->
  <g transform="translate(960,660) rotate(14) scale(2.1)" opacity="0.07">
    <path d="M-30,0 Q0,24 30,0" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
  </g>
  <!-- Sparkle 2: mid-left -->
  <g transform="translate(75,700) scale(0.95)" opacity="0.08">
    <path d="M0,-22 L3.5,-3.5 L22,0 L3.5,3.5 L0,22 L-3.5,3.5 L-22,0 L-3.5,-3.5 Z" fill="white"/>
  </g>
  <!-- Smile arc 3: bottom-center -->
  <g transform="translate(500,888) rotate(-4) scale(1.9)" opacity="0.08">
    <path d="M-30,0 Q0,24 30,0" stroke="white" stroke-width="5" fill="none" stroke-linecap="round"/>
  </g>
  <!-- Sparkle 3: center-right, small -->
  <g transform="translate(720,420) scale(0.75)" opacity="0.10">
    <path d="M0,-22 L3.5,-3.5 L22,0 L3.5,3.5 L0,22 L-3.5,3.5 L-22,0 L-3.5,-3.5 Z" fill="white"/>
  </g>
</svg></div>`;
}

// V3: Brand Gradient — tooth silhouettes + medical crosses in white
function svgV3() {
  return `<div style="position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden;">
<svg width="1080" height="1080" viewBox="0 0 1080 1080" style="position:absolute;inset:0;">
  <!-- Tooth 1: top-left -->
  <g transform="translate(100,160) rotate(-14) scale(2.1)" opacity="0.10">
    <rect x="4"  y="0"  width="11" height="15" rx="4" fill="white"/>
    <rect x="20" y="0"  width="11" height="15" rx="4" fill="white"/>
    <rect x="0"  y="11" width="36" height="26" rx="8" fill="white"/>
    <ellipse cx="10" cy="44" rx="7" ry="11" fill="white"/>
    <ellipse cx="26" cy="44" rx="7" ry="11" fill="white"/>
  </g>
  <!-- Cross 1: top-right -->
  <g transform="translate(920,200) rotate(8)" opacity="0.12">
    <rect x="-8" y="-26" width="16" height="52" rx="4" fill="white"/>
    <rect x="-26" y="-8" width="52" height="16" rx="4" fill="white"/>
  </g>
  <!-- Tooth 2: bottom-right -->
  <g transform="translate(950,730) rotate(18) scale(1.6)" opacity="0.09">
    <rect x="4"  y="0"  width="11" height="15" rx="4" fill="white"/>
    <rect x="20" y="0"  width="11" height="15" rx="4" fill="white"/>
    <rect x="0"  y="11" width="36" height="26" rx="8" fill="white"/>
    <ellipse cx="10" cy="44" rx="7" ry="11" fill="white"/>
    <ellipse cx="26" cy="44" rx="7" ry="11" fill="white"/>
  </g>
  <!-- Cross 2: mid-left -->
  <g transform="translate(60,790) rotate(-13) scale(0.9)" opacity="0.11">
    <rect x="-8" y="-26" width="16" height="52" rx="4" fill="white"/>
    <rect x="-26" y="-8" width="52" height="16" rx="4" fill="white"/>
  </g>
  <!-- Tooth 3: bottom-center -->
  <g transform="translate(542,942) rotate(-5) scale(1.3)" opacity="0.10">
    <rect x="4"  y="0"  width="11" height="15" rx="4" fill="white"/>
    <rect x="20" y="0"  width="11" height="15" rx="4" fill="white"/>
    <rect x="0"  y="11" width="36" height="26" rx="8" fill="white"/>
    <ellipse cx="10" cy="44" rx="7" ry="11" fill="white"/>
    <ellipse cx="26" cy="44" rx="7" ry="11" fill="white"/>
  </g>
</svg></div>`;
}

// V4: Steel Precision — toothbrush shapes + water drops in white
function svgV4() {
  return `<div style="position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden;">
<svg width="1080" height="1080" viewBox="0 0 1080 1080" style="position:absolute;inset:0;">
  <!-- Toothbrush 1: top-left, angled -->
  <g transform="translate(85,205) rotate(-32) scale(1.9)" opacity="0.08">
    <rect x="-4" y="-52" width="8"  height="72" rx="4" fill="white"/>
    <rect x="-11" y="-62" width="22" height="18" rx="5" fill="white"/>
    <rect x="-9"  y="-60" width="4"  height="10" rx="1" fill="rgba(255,255,255,0.5)"/>
    <rect x="-2"  y="-60" width="4"  height="10" rx="1" fill="rgba(255,255,255,0.5)"/>
    <rect x="5"   y="-60" width="4"  height="10" rx="1" fill="rgba(255,255,255,0.5)"/>
  </g>
  <!-- Water drop 1: top-right -->
  <g transform="translate(938,250) scale(2.1)" opacity="0.07">
    <path d="M0,-24 C12,-11 20,2 20,11 C20,22 11,30 0,30 C-11,30 -20,22 -20,11 C-20,2 -12,-11 0,-24 Z" fill="white"/>
  </g>
  <!-- Toothbrush 2: right-mid, steeper angle -->
  <g transform="translate(988,710) rotate(48) scale(1.6)" opacity="0.07">
    <rect x="-4" y="-52" width="8"  height="72" rx="4" fill="white"/>
    <rect x="-11" y="-62" width="22" height="18" rx="5" fill="white"/>
  </g>
  <!-- Water drop 2: left-mid -->
  <g transform="translate(68,748) scale(1.6)" opacity="0.08">
    <path d="M0,-24 C12,-11 20,2 20,11 C20,22 11,30 0,30 C-11,30 -20,22 -20,11 C-20,2 -12,-11 0,-24 Z" fill="white"/>
  </g>
  <!-- Toothbrush 3: bottom-center -->
  <g transform="translate(502,958) rotate(-16) scale(1.4)" opacity="0.08">
    <rect x="-4" y="-52" width="8"  height="72" rx="4" fill="white"/>
    <rect x="-11" y="-62" width="22" height="18" rx="5" fill="white"/>
  </g>
</svg></div>`;
}

// V5: Light Authority — shield outlines + checkmarks in #0073AA (subtle on light)
function svgV5() {
  return `<div style="position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden;">
<svg width="1080" height="1080" viewBox="0 0 1080 1080" style="position:absolute;inset:0;">
  <!-- Shield 1: top-left -->
  <g transform="translate(82,162) rotate(-9) scale(2.2)" opacity="0.055">
    <path d="M0,-30 L24,-19 L24,5 C24,18 13,28 0,32 C-13,28 -24,18 -24,5 L-24,-19 Z" fill="#0073AA"/>
  </g>
  <!-- Checkmark 1: top-right -->
  <g transform="translate(955,220) rotate(8) scale(1.9)" opacity="0.065">
    <path d="M-20,0 L-7,15 L20,-15" stroke="#0073AA" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <!-- Shield 2: bottom-right -->
  <g transform="translate(975,710) rotate(14) scale(1.7)" opacity="0.05">
    <path d="M0,-30 L24,-19 L24,5 C24,18 13,28 0,32 C-13,28 -24,18 -24,5 L-24,-19 Z" fill="#0073AA"/>
  </g>
  <!-- Checkmark 2: left-mid -->
  <g transform="translate(58,725) rotate(-6) scale(1.5)" opacity="0.055">
    <path d="M-20,0 L-7,15 L20,-15" stroke="#0073AA" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <!-- Shield 3: bottom-center -->
  <g transform="translate(544,935) rotate(-7) scale(1.5)" opacity="0.06">
    <path d="M0,-30 L24,-19 L24,5 C24,18 13,28 0,32 C-13,28 -24,18 -24,5 L-24,-19 Z" fill="#0073AA"/>
  </g>
</svg></div>`;
}

// ─────────────────────────────────────────────
// COMMON HEADER / FOOTER BUILDERS
// ─────────────────────────────────────────────
function headerV1() {
  return `<div style="background:linear-gradient(135deg,#106EEA 0%,#0073AA 100%);padding:22px 40px;text-align:center;">
  <span style="font-size:28px;font-weight:800;color:#fff;letter-spacing:1.5px;text-transform:uppercase;">${E.category}</span>
</div>`;
}

function footerV1(ctaLabel='REGISTER NOW') {
  return `<div style="background:#F1F6FE;padding:18px 44px;display:flex;align-items:center;min-height:132px;border-top:2px solid #E2EEFD;position:relative;">
  <div style="position:absolute;left:44px;top:50%;transform:translateY(-50%);">${qrBlock('#106EEA','#106EEA')}</div>
  <div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:7px;">
    <div style="background:#106EEA;border-radius:9999px;padding:12px 52px;">
      <span style="font-size:21px;font-weight:800;color:#fff;">${ctaLabel}</span>
    </div>
    <div style="font-size:27px;font-weight:800;color:#121213;">📅 ${E.date}</div>
    <div style="font-size:22px;font-weight:700;color:#106EEA;">🕗 ${E.time}</div>
  </div>
  <div style="position:absolute;right:44px;top:50%;transform:translateY(-50%);">${tdLogo('color')}</div>
</div>`;
}

// ─────────────────────────────────────────────
// EXPORTS (attached below each generator)
// ─────────────────────────────────────────────
module.exports = { E, P, QR, wrap, write, photoCircle, qrBlock, tdLogo,
  svgV1, svgV2, svgV3, svgV4, svgV5,
  headerV1, footerV1, PREV };
