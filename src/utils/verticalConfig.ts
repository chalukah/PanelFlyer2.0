/**
 * Multi-vertical configuration for Banner Generator
 * Supports: VET, Dental, Law, Aesthetics
 */

export type VerticalId = 'vet' | 'dental' | 'law' | 'aesthetics';
export type WatermarkIcon = 'paw' | 'tooth' | 'scales' | 'sparkle';

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
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 693.3 232.5" width="165" height="56"><style>.st3{fill:#FFFFFF}</style><defs><radialGradient id="g1" cx="116.2" cy="116.2" r="116.2" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#C6F800"/><stop offset="1" stop-color="#3BAB00"/></radialGradient></defs><circle cx="116.2" cy="116.2" r="116.2" fill="url(#g1)"/><path class="st3" d="M116.2 30c-47.6 0-86.2 38.6-86.2 86.2s38.6 86.2 86.2 86.2 86.2-38.6 86.2-86.2S163.8 30 116.2 30zm0 155.2c-38.1 0-69-30.9-69-69s30.9-69 69-69 69 30.9 69 69-30.9 69-69 69z"/><text x="260" y="150" class="st3" style="font-size:96px;font-family:Arial,sans-serif;font-weight:700;letter-spacing:4px">${abbr}</text></svg>`;
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
    id: 'dental',
    name: 'Dental Business Institute',
    shortName: 'DENTAL',
    websiteUrl: 'dentalbusinessinstitute.com',
    colors: {
      bgGradient: 'radial-gradient(ellipse at 68% 42%, #0a2a4a 0%, #0d2540 30%, #071530 60%, #050a15 100%)',
      accent: '#0066CC',
      lime: '#4FC3F7',
      neonBorder: '#29B6F6',
      darkBg: '#0D47A1',
      headerText: '#4FC3F7',
      ctaGradient: 'linear-gradient(to right, rgba(10,42,74,0.95), rgba(13,37,64,0.95))',
    },
    logoSvg: makeLogo('DBI'),
    watermarkIcon: 'tooth',
    panelNameDefault: 'DBI Dental Panel',
  },
  {
    id: 'law',
    name: 'Law Business Institute',
    shortName: 'LAW',
    websiteUrl: 'lawbusinessinstitute.com',
    colors: {
      bgGradient: 'radial-gradient(ellipse at 68% 42%, #1a1a3e 0%, #141430 30%, #0e0e28 60%, #080818 100%)',
      accent: '#1a237e',
      lime: '#FFD54F',
      neonBorder: '#FFCA28',
      darkBg: '#1a237e',
      headerText: '#FFD54F',
      ctaGradient: 'linear-gradient(to right, rgba(26,26,62,0.95), rgba(20,20,48,0.95))',
    },
    logoSvg: makeLogo('LBI'),
    watermarkIcon: 'scales',
    panelNameDefault: 'LBI Law Panel',
  },
  {
    id: 'aesthetics',
    name: 'Aesthetics Business Institute',
    shortName: 'AESTHETICS',
    websiteUrl: 'aestheticsbusinessinstitute.com',
    colors: {
      bgGradient: 'radial-gradient(ellipse at 68% 42%, #3a0a3e 0%, #300830 30%, #200520 60%, #100210 100%)',
      accent: '#9C27B0',
      lime: '#F48FB1',
      neonBorder: '#CE93D8',
      darkBg: '#6A1B9A',
      headerText: '#F48FB1',
      ctaGradient: 'linear-gradient(to right, rgba(58,10,62,0.95), rgba(48,8,48,0.95))',
    },
    logoSvg: makeLogo('ABI'),
    watermarkIcon: 'sparkle',
    panelNameDefault: 'ABI Aesthetics Panel',
  },
];

export function getVerticalConfig(id: VerticalId): VerticalConfig {
  return VERTICALS.find((v) => v.id === id) || VERTICALS[0];
}
