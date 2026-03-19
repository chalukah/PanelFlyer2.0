import { useState, useEffect, useRef } from 'react';
import { Download, Loader2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { GeneratedBanner } from '../../utils/bannerTemplates';
import { PINK, DARK_SURFACE, DARK_BORDER } from './constants';

export function BannerModal({
  banners,
  currentIndex,
  onClose,
  onNavigate,
  onDownload,
  downloading,
  darkMode,
}: {
  banners: GeneratedBanner[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (idx: number) => void;
  onDownload: (banner: GeneratedBanner) => void;
  downloading: string | null;
  darkMode: boolean;
}) {
  const banner = banners[currentIndex];
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const computeScale = () => {
      // Available space: 90vh for the banner (leave room for header), 90vw minus nav arrows
      const maxH = window.innerHeight * 0.85 - 70; // 70px for header bar
      const maxW = window.innerWidth * 0.85 - 80; // 80px for nav arrows
      const s = Math.min(maxH / 1080, maxW / 1080, 1); // never scale up
      setScale(s);
    };
    computeScale();
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < banners.length - 1) onNavigate(currentIndex + 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIndex, banners.length, onClose, onNavigate]);

  if (!banner) return null;

  const displaySize = Math.round(1080 * scale);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="anim-scale-in relative rounded-2xl border-[2px] flex flex-col"
        style={{
          background: darkMode ? DARK_SURFACE : '#ffffff',
          borderColor: darkMode ? DARK_BORDER : '#000000',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
          maxWidth: '95vw',
          maxHeight: '95vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0" style={{ borderBottom: `1px solid ${darkMode ? '#333' : '#f3f4f6'}` }}>
          <div>
            <h3 className="text-lg font-bold" style={{ color: darkMode ? '#f0f0f0' : '#000' }}>{banner.label}</h3>
            <p className="text-xs" style={{ color: darkMode ? '#888' : '#9ca3af' }}>{banner.panelistName} &middot; {banner.fileName}.png &middot; 1080x1080</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(banner)}
              disabled={downloading === banner.id}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs rounded-full font-bold transition-all hover:opacity-80 disabled:opacity-50"
              style={{ background: PINK, color: '#000' }}
            >
              {downloading === banner.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              Download PNG
            </button>
            <button onClick={onClose} className="p-2 rounded-full transition-colors" style={{ color: darkMode ? '#888' : '#6b7280' }}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Banner -- scaled to fit viewport */}
        <div className="flex items-center justify-center p-4 overflow-hidden">
          <div
            className="rounded-xl overflow-hidden border-[2px]"
            style={{
              width: displaySize,
              height: displaySize,
              borderColor: darkMode ? DARK_BORDER : '#000000',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <iframe
              srcDoc={banner.html}
              style={{
                width: 1080,
                height: 1080,
                border: 'none',
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
              sandbox="allow-same-origin allow-scripts"
              title={banner.label}
            />
          </div>
        </div>

        {/* Navigation arrows */}
        {currentIndex > 0 && (
          <button
            onClick={() => onNavigate(currentIndex - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full shadow-md hover:scale-110 transition-transform border-[2px]"
            style={{ background: darkMode ? DARK_SURFACE : '#fff', borderColor: darkMode ? DARK_BORDER : '#000', color: darkMode ? '#f0f0f0' : '#000' }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        {currentIndex < banners.length - 1 && (
          <button
            onClick={() => onNavigate(currentIndex + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full shadow-md hover:scale-110 transition-transform border-[2px]"
            style={{ background: darkMode ? DARK_SURFACE : '#fff', borderColor: darkMode ? DARK_BORDER : '#000', color: darkMode ? '#f0f0f0' : '#000' }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}
