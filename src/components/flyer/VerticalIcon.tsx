import { PawPrint, Scale, Sparkles } from 'lucide-react';
import type { VerticalId } from '../../utils/verticalConfig';

export function VerticalIcon({ id, className }: { id: VerticalId; className?: string }) {
  switch (id) {
    case 'vet':
      return <PawPrint className={className} />;
    case 'thriving-dentist':
      return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><rect x="6" y="4" width="12" height="10" rx="3"/><path d="M8 14 L7 22"/><path d="M16 14 L17 22"/></svg>;
    case 'dominate-law':
      return <Scale className={className} />;
    case 'aesthetics':
      return <Sparkles className={className} />;
  }
}

export const VERTICAL_EMOJI: Record<VerticalId, string> = {
  vet: '\u{1F43E}',
  'thriving-dentist': '\u{1F9B7}',
  'dominate-law': '\u2696\uFE0F',
  aesthetics: '\u2728',
};
