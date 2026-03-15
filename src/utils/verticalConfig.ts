/**
 * Multi-vertical configuration for Banner Generator
 * Supports: VET (VBI), Thriving Dentist (TD), Dominate Law (DL), Business of Aesthetics (BOA)
 */

export type VerticalId = 'vet' | 'thriving-dentist' | 'dominate-law' | 'aesthetics';
export type WatermarkIcon = 'paw' | 'molar' | 'gavel' | 'syringe';

export type VerticalColors = {
  bgGradient: string;
  accent: string;
  lime: string;
  neonBorder: string;
  darkBg: string;
  headerText: string;
  ctaGradient: string;
};

export type VerticalConfig = {
  id: VerticalId;
  name: string;
  shortName: string;
  websiteUrl: string;
  colors: VerticalColors;
  logoSvg: string;
  watermarkIcon: WatermarkIcon;
  panelNameDefault: string;
};

function makeLogo(abbr: string): string {
  const gid = `g1_${abbr.toLowerCase()}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 693.3 232.5" width="165" height="56"><style>.st3_${abbr}{fill:#FFFFFF}</style><defs><radialGradient id="${gid}" cx="116.2" cy="116.2" r="116.2" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#C6F800"/><stop offset="1" stop-color="#3BAB00"/></radialGradient></defs><circle cx="116.2" cy="116.2" r="116.2" fill="url(#${gid})"/><path class="st3_${abbr}" d="M116.2 30c-47.6 0-86.2 38.6-86.2 86.2s38.6 86.2 86.2 86.2 86.2-38.6 86.2-86.2S163.8 30 116.2 30zm0 155.2c-38.1 0-69-30.9-69-69s30.9-69 69-69 69 30.9 69 69-30.9 69-69 69z"/><text x="260" y="150" class="st3_${abbr}" style="font-size:96px;font-family:Arial,sans-serif;font-weight:700;letter-spacing:4px">${abbr}</text></svg>`;
}

/** Thriving Dentist logo: "the" prefix, "Thriving" in red-like, "Dentist" in blue-bold */
function makeTDLogo(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 60" width="185" height="50">
  <text x="4" y="16" fill="#CC0000" style="font-size:11px;font-family:Georgia,serif;font-style:italic;">the</text>
  <text x="4" y="38" fill="#222222" style="font-size:24px;font-family:Arial,sans-serif;font-weight:900;letter-spacing:-0.5px;">Thriving</text>
  <text x="144" y="38" fill="#106EEA" style="font-size:24px;font-family:Arial,sans-serif;font-weight:900;letter-spacing:-0.5px;">Dentist</text>
</svg>`;
}

/** Dominate Law Podcast logo: gold text with gavel icon in the "O" */
function makeDLLogo(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 60" width="185" height="50">
  <text x="4" y="22" fill="#C8A74E" style="font-size:16px;font-family:Arial,sans-serif;font-weight:800;letter-spacing:2px;">DOMINATE LAW</text>
  <text x="4" y="46" fill="#C8A74E" style="font-size:20px;font-family:Arial,sans-serif;font-weight:900;letter-spacing:3px;">PODC<tspan fill="#C8A74E">A</tspan>ST</text>
  <circle cx="108" cy="39" r="9" fill="none" stroke="#C8A74E" stroke-width="1.5"/>
  <line x1="104" y1="32" x2="112" y2="32" stroke="#C8A74E" stroke-width="2.5" stroke-linecap="round"/>
  <rect x="106" y="32" width="4" height="10" rx="1" fill="#C8A74E"/>
</svg>`;
}

/** Business of Aesthetics logo: teal text with syringe icon */
function makeBOALogo(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 60" width="185" height="50">
  <text x="52" y="20" fill="#0D7377" style="font-size:13px;font-family:Arial,sans-serif;font-weight:700;letter-spacing:1px;">BUSINESS OF</text>
  <text x="52" y="44" fill="#0D7377" style="font-size:22px;font-family:Arial,sans-serif;font-weight:900;letter-spacing:0.5px;">AESTHETICS</text>
  <text x="52" y="56" fill="#0D7377" style="font-size:8px;font-family:Arial,sans-serif;font-style:italic;">Your Success Matters!</text>
  <!-- syringe icon -->
  <rect x="10" y="8" width="5" height="30" rx="2" fill="#0D7377"/>
  <rect x="7" y="14" width="11" height="3" rx="1" fill="#0D7377"/>
  <rect x="7" y="20" width="11" height="3" rx="1" fill="#0D7377"/>
  <rect x="7" y="26" width="11" height="3" rx="1" fill="#0D7377"/>
  <rect x="11" y="38" width="3" height="10" rx="1" fill="#0D7377"/>
  <polygon points="9,48 16,48 12.5,54" fill="#0D7377"/>
</svg>`;
}

export const VERTICALS: VerticalConfig[] = [
  {
    id: 'vet',
    name: 'Veterinary Business Institute',
    shortName: 'VET',
    websiteUrl: 'veterinarybusinessinstitute.com',
    colors: {
      bgGradient: 'radial-gradient(ellipse at 68% 42%, #0a4a44 0%, #0d3530 22%, #0b2820 48%, #071510 78%, #050e0a 100%)',
      accent: '#00b09b',
      lime: '#DDE821',
      neonBorder: '#62E53E',
      darkBg: '#004D25',
      headerText: '#DDE821',
      ctaGradient: 'linear-gradient(to right, rgba(10,74,68,0.95), rgba(13,53,48,0.95))',
    },
    logoSvg: makeLogo('VBI'),
    watermarkIcon: 'paw',
    panelNameDefault: 'VBI Veterinary Panel',
  },
  {
    id: 'thriving-dentist',
    name: 'Thriving Dentist',
    shortName: 'TD',
    websiteUrl: 'thrivingdentist.com',
    colors: {
      bgGradient: 'linear-gradient(160deg, #1A7AED 0%, #0E5BBD 35%, #0A4A9A 65%, #063570 100%)',
      accent: '#106EEA',
      lime: '#FFFFFF',
      neonBorder: '#1E83D0',
      darkBg: '#0A4A9A',
      headerText: '#FFFFFF',
      ctaGradient: 'linear-gradient(to right, #106EEA, #0073AA)',
    },
    logoSvg: makeTDLogo(),
    watermarkIcon: 'molar',
    panelNameDefault: 'Thriving Dentist Annual Expert Panel',
  },
  {
    id: 'dominate-law',
    name: 'Dominate Law',
    shortName: 'DL',
    websiteUrl: 'dominatelaw.com',
    colors: {
      bgGradient: 'radial-gradient(ellipse at 68% 42%, #3D2B1A 0%, #2E200F 30%, #1F1508 60%, #110C04 100%)',
      accent: '#C8A74E',
      lime: '#C8A74E',
      neonBorder: '#D4B95E',
      darkBg: '#2E200F',
      headerText: '#C8A74E',
      ctaGradient: 'linear-gradient(to right, rgba(61,43,26,0.95), rgba(46,32,15,0.95))',
    },
    logoSvg: makeDLLogo(),
    watermarkIcon: 'gavel',
    panelNameDefault: 'Dominate Law Annual Expert Panel',
  },
  {
    id: 'aesthetics',
    name: 'Business of Aesthetics',
    shortName: 'BOA',
    websiteUrl: 'businessofaesthetics.com',
    colors: {
      bgGradient: 'linear-gradient(160deg, #0D8A8E 0%, #0B7074 30%, #095A5E 60%, #064044 100%)',
      accent: '#0D7377',
      lime: '#FFFFFF',
      neonBorder: '#15A0A5',
      darkBg: '#095A5E',
      headerText: '#FFFFFF',
      ctaGradient: 'linear-gradient(to right, #0D7377, #095A5E)',
    },
    logoSvg: makeBOALogo(),
    watermarkIcon: 'syringe',
    panelNameDefault: 'Business of Aesthetics Expert Panel',
  },
];

export function getVerticalConfig(id: VerticalId): VerticalConfig {
  return VERTICALS.find((v) => v.id === id) || VERTICALS[0];
}
