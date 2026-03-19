import type { BannerType } from '../../utils/bannerTemplates';
import type { VerticalId } from '../../utils/verticalConfig';

// ============================================================
// Types
// ============================================================

export type QrCodes = { B1?: string; B2?: string; B3?: string; B4?: string; B5?: string };

export type PanelistFormData = {
  id: string;
  name: string;
  firstName: string;
  title: string;
  org: string;
  headshotUrl: string;
  zoomUrl: string;
  qrCodes: QrCodes;
};

export type PanelistCount = 2 | 3 | 4;

// ============================================================
// Pink accent constant
// ============================================================
export const PINK = '#FF90E8';
export const PINK_LIGHT = '#FFF0FB';
export const CREAM = '#F4F4F0';
export const DARK_BG = '#0f0f0f';
export const DARK_SURFACE = '#1a1a1a';
export const DARK_BORDER = '#333333';
export const WARM_BORDER = '#000000';

// ============================================================
// Per-vertical accent colors
// ============================================================
export const VERTICAL_COLORS: Record<VerticalId, { accent: string; accentLight: string; accentDark: string; accentSoft: string }> = {
  vet:               { accent: '#00b09b', accentLight: '#e6f9f6', accentDark: '#0a2e29', accentSoft: '#00b09b30' },
  'thriving-dentist': { accent: '#106EEA', accentLight: '#e8f1fd', accentDark: '#0c1f3d', accentSoft: '#106EEA30' },
  'dominate-law':    { accent: '#C8A74E', accentLight: '#faf5e6', accentDark: '#2e2510', accentSoft: '#C8A74E30' },
  aesthetics:        { accent: '#0D7377', accentLight: '#e6f4f4', accentDark: '#0a2627', accentSoft: '#0D737730' },
};

export const BANNER_TYPE_LABELS: Record<BannerType, string> = {
  B1: 'The Intro',
  B2: 'Introduction to Panel One',
  B3: 'Introduction to Panel Two',
  B4: 'One More Day',
  B5: 'Happening Today',
};

// ============================================================
// Global CSS animations (injected once)
// ============================================================
const ANIMATION_STYLES = `
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeSlideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.92); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes gentlePulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.04); }
}
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
@keyframes verticalBorderGlow {
  0%, 100% { box-shadow: 0 0 0 3px var(--v-accent-soft, rgba(255,144,232,0.15)); }
  50%      { box-shadow: 0 0 0 6px var(--v-accent-soft, rgba(255,144,232,0.3)); }
}
@keyframes floatEmoji {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-4px); }
}
@keyframes googleDot {
  0%, 80%, 100% { transform: scale(0.4); opacity: 0.3; }
  40% { transform: scale(1); opacity: 1; }
}
@keyframes googleFlow {
  0% { transform: translateX(-100%); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateX(100%); opacity: 0; }
}
@keyframes googlePulseBar {
  0% { transform: scaleX(0); transform-origin: left; }
  50% { transform: scaleX(1); transform-origin: left; }
  50.01% { transform-origin: right; }
  100% { transform: scaleX(0); transform-origin: right; }
}
@keyframes cardPulse {
  0%, 100% { opacity: 0.4; transform: scale(0.97); }
  50% { opacity: 0.7; transform: scale(1); }
}
.anim-fade-up     { animation: fadeSlideUp 0.4s ease-out both; }
.anim-fade-down   { animation: fadeSlideDown 0.35s ease-out both; }
.anim-scale-in    { animation: scaleIn 0.35s ease-out both; }
.anim-pulse       { animation: gentlePulse 2s ease-in-out infinite; }
.anim-shimmer     { background: linear-gradient(90deg, transparent 30%, var(--v-accent-soft, rgba(255,144,232,0.08)) 50%, transparent 70%); background-size: 200% 100%; animation: shimmer 3s ease-in-out infinite; }
.anim-border-glow { animation: verticalBorderGlow 2s ease-in-out infinite; }
.anim-float       { animation: floatEmoji 3s ease-in-out infinite; }
.anim-stagger-1   { animation-delay: 0.05s; }
.anim-stagger-2   { animation-delay: 0.1s; }
.anim-stagger-3   { animation-delay: 0.15s; }
.anim-stagger-4   { animation-delay: 0.2s; }
.google-dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; animation: googleDot 1.4s ease-in-out infinite; }
.google-dot:nth-child(1) { animation-delay: 0s; }
.google-dot:nth-child(2) { animation-delay: 0.16s; }
.google-dot:nth-child(3) { animation-delay: 0.32s; }
.google-dot:nth-child(4) { animation-delay: 0.48s; }
.google-flow-bar { height: 4px; border-radius: 2px; overflow: hidden; position: relative; }
.google-flow-bar::after { content: ''; position: absolute; inset: 0; border-radius: 2px; animation: googlePulseBar 2s ease-in-out infinite; background: linear-gradient(90deg, var(--v-accent, #FF90E8), var(--v-c2, #106EEA), var(--v-c3, #C8A74E), var(--v-c4, #0D7377)); }
.placeholder-card-pulse { animation: cardPulse 2s ease-in-out infinite; }
.dm-input { background-color: var(--input-bg) !important; border-color: var(--input-border) !important; color: var(--input-text) !important; }
.dm-card { background-color: var(--input-bg) !important; border-color: var(--input-border) !important; }
.dm-card input { background-color: var(--input-bg) !important; border-color: var(--input-border) !important; color: var(--input-text) !important; }
`;

let stylesInjected = false;
export function injectAnimationStyles() {
  if (stylesInjected) return;
  const style = document.createElement('style');
  style.textContent = ANIMATION_STYLES;
  document.head.appendChild(style);
  stylesInjected = true;
}
