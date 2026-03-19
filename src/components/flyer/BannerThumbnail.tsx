import { Download, Check } from 'lucide-react';
import type { GeneratedBanner } from '../../utils/bannerTemplates';
import { PINK } from './constants';

export function BannerThumbnail({
  banner,
  onClick,
  onDownload,
  onToggleSelect,
  selected,
  visible,
  delay,
}: {
  banner: GeneratedBanner;
  onClick: () => void;
  onDownload: () => void;
  onToggleSelect: () => void;
  selected: boolean;
  visible: boolean;
  delay: number;
}) {
  return (
    <div
      className="relative group cursor-pointer rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-md"
      style={{
        width: 180,
        height: 180,
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.85)',
        transitionDelay: `${delay}ms`,
        border: selected ? `3px solid var(--v-accent, ${PINK})` : '2px solid #555',
      }}
      onClick={onClick}
    >
      {/* Scaled banner via iframe */}
      <iframe
        srcDoc={banner.html}
        style={{
          width: 1080,
          height: 1080,
          transform: 'scale(0.1667)',
          transformOrigin: 'top left',
          pointerEvents: 'none',
          border: 'none',
        }}
        sandbox="allow-same-origin allow-scripts"
        title={banner.label}
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            className="p-2 bg-white rounded-full hover:bg-gray-50 transition-colors shadow-sm"
            title="Download this banner"
          >
            <Download className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>

      {/* Selection checkbox */}
      <div
        className="absolute top-1.5 left-1.5 w-5 h-5 rounded-md flex items-center justify-center cursor-pointer transition-all border-2"
        style={{
          background: selected ? 'var(--v-accent, #FF90E8)' : 'rgba(255,255,255,0.8)',
          borderColor: selected ? 'var(--v-accent, #FF90E8)' : 'rgba(0,0,0,0.3)',
        }}
        onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
      >
        {selected && <Check className="w-3 h-3 text-black" />}
      </div>
    </div>
  );
}
