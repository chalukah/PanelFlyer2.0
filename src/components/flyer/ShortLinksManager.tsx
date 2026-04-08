import { useState, useEffect } from 'react';
import { QrCode, Check, Loader2, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';
import type { PanelistFormData, QrCodes } from './constants';
import type { VerticalId } from '../../utils/verticalConfig';

// ── Veterinary domain config (only supported vertical for now) ──
const VET_DOMAIN = {
  domain: 'go.veterinarybusinesinstitute.com',
  domainId: 1063343,
  prefix: 'VET',
};

// ── Helpers ──

function getInitials(name: string): string {
  const cleaned = name.replace(/^Dr\.?\s*/i, '').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  return parts.map((p) => p[0].toUpperCase()).join('');
}

function parseEventDateForSlug(eventDate: string): { month: string; day: string } | null {
  const match = eventDate.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})\b/i,
  );
  if (!match) return null;
  const month = match[1][0].toUpperCase() + match[1].slice(1, 3).toLowerCase();
  const day = match[2];
  return { month, day };
}

function generateSlugs(prefix: string, month: string, day: string, initials: string) {
  return {
    B1: `${prefix}${month}${day}${initials}1`,
    B2: `${prefix}${month}${day}${initials}2`,
    B3: `${prefix}${month}${day}${initials}3`,
    B4: `${prefix}${month}${day}${initials}4`,
    B5: `${prefix}${month}${day}${initials}5`,
  };
}

async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 400,
    margin: 1,
    errorCorrectionLevel: 'H',
    color: { dark: '#000000', light: '#FFFFFF' },
  });
}

// ── Props ──

interface ShortLinksManagerProps {
  panelists: PanelistFormData[];
  selectedVertical: VerticalId;
  eventDate: string;
  darkMode: boolean;
  textPrimary: string;
  textSecondary: string;
  surface: string;
  border: string;
  vColors: { accent: string; accentLight: string; accentDark: string; accentSoft: string };
  onUpdatePanelist: (index: number, data: PanelistFormData) => void;
  onRegenerateBanners: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}

// ── Component ──

export function ShortLinksManager({
  panelists,
  selectedVertical,
  eventDate,
  darkMode,
  textPrimary,
  textSecondary,
  surface,
  border,
  vColors,
  onUpdatePanelist,
  onRegenerateBanners,
  showToast,
}: ShortLinksManagerProps) {
  const [zoomUrls, setZoomUrls] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [generated, setGenerated] = useState<Record<string, boolean>>({});

  // Sync zoom URLs from panelist data
  useEffect(() => {
    const init: Record<string, string> = {};
    for (const p of panelists) {
      if (p.zoomUrl && !zoomUrls[p.id]) init[p.id] = p.zoomUrl;
    }
    if (Object.keys(init).length > 0) setZoomUrls((prev) => ({ ...init, ...prev }));
  }, [panelists]);

  const cardStyle: React.CSSProperties = { backgroundColor: surface, borderColor: border };
  const inputClass =
    'w-full px-3 py-2.5 rounded-lg border-[2px] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 transition-all dm-input';

  const dateParts = parseEventDateForSlug(eventDate);

  const handleGenerate = async (panelistIndex: number) => {
    const panelist = panelists[panelistIndex];
    const zoomUrl = zoomUrls[panelist.id] || panelist.zoomUrl || '';

    if (!zoomUrl.trim()) {
      showToast('Enter a Zoom registration URL first', 'warning');
      return;
    }

    if (!dateParts) {
      showToast('Set event date above to generate QR codes', 'error');
      return;
    }

    const initials = getInitials(panelist.name);
    if (!initials) {
      showToast(`Could not extract initials from "${panelist.name}"`, 'error');
      return;
    }

    setGenerating((prev) => ({ ...prev, [panelist.id]: true }));

    try {
      const slugs = generateSlugs(VET_DOMAIN.prefix, dateParts.month, dateParts.day, initials);
      const qrCodes: QrCodes = {};

      for (const [key, slug] of Object.entries(slugs)) {
        const shortUrl = `https://${VET_DOMAIN.domain}/${slug}`;
        qrCodes[key as keyof QrCodes] = await generateQrDataUrl(shortUrl);
      }

      onUpdatePanelist(panelistIndex, { ...panelist, zoomUrl, qrCodes });
      setGenerated((prev) => ({ ...prev, [panelist.id]: true }));
      showToast(`Generated 5 QR codes for ${panelist.firstName || panelist.name}`, 'success');
      // Trigger banner regeneration after a tick so state has settled
      setTimeout(() => onRegenerateBanners(), 100);
    } catch (err) {
      showToast(`QR generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setGenerating((prev) => ({ ...prev, [panelist.id]: false }));
    }
  };

  // ── Render ──

  return (
    <div
      className="anim-fade-up rounded-2xl p-5 border-[2px] transition-all duration-300 hover:shadow-sm space-y-4"
      style={{ ...cardStyle, animationDelay: '0.25s' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <QrCode className="w-4 h-4" style={{ color: vColors.accent }} />
        <h3 className="text-sm font-bold" style={{ color: textPrimary }}>
          QR Code Generator
        </h3>
        <span
          className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: vColors.accentSoft, color: vColors.accent }}
        >
          Veterinary Only
        </span>
      </div>

      {/* Non-vet warning */}
      {selectedVertical !== 'vet' ? (
        <div
          className="flex items-center gap-2 text-xs p-3 rounded-lg"
          style={{ background: darkMode ? '#1a1a2e' : '#f0f4ff', color: textSecondary }}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Veterinary only — other verticals coming soon</span>
        </div>
      ) : !dateParts ? (
        <div className="flex items-center gap-2 text-xs p-3 rounded-lg" style={{ color: textSecondary }}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Set event date above to generate QR code slugs</span>
        </div>
      ) : (
        <div className="space-y-3">
          {panelists.map((p, i) => {
            const qrCount = Object.values(p.qrCodes).filter(Boolean).length;
            const hasAllQr = qrCount === 5;
            const initials = p.name ? getInitials(p.name) : '';
            const slugPreview = initials
              ? `${VET_DOMAIN.prefix}${dateParts.month}${dateParts.day}${initials}1–5`
              : '';

            return (
              <div
                key={p.id}
                className="rounded-xl p-3 border-[1.5px] transition-all"
                style={{ borderColor: hasAllQr ? (darkMode ? '#2d6a4f' : '#b7e4c7') : border }}
              >
                {/* Panelist name + status */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold" style={{ color: textPrimary }}>
                    {p.name || `Panelist ${i + 1}`}
                  </span>
                  {hasAllQr ? (
                    <span
                      className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: darkMode ? '#1b3a2a' : '#d4edda',
                        color: darkMode ? '#6ee7b7' : '#155724',
                      }}
                    >
                      <Check className="w-3 h-3" /> QR codes loaded
                    </span>
                  ) : qrCount > 0 ? (
                    <span className="text-[10px] font-medium" style={{ color: textSecondary }}>
                      {qrCount}/5 QR codes
                    </span>
                  ) : null}
                </div>

                {/* Input + Generate (only if missing QR codes) */}
                {!hasAllQr && (
                  <>
                    {slugPreview && (
                      <div className="text-[10px] mb-2 font-mono" style={{ color: textSecondary }}>
                        Slugs: {slugPreview}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        value={zoomUrls[p.id] || ''}
                        onChange={(e) => setZoomUrls((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        placeholder="Zoom registration URL..."
                        className={inputClass}
                        style={{ flex: 1 }}
                      />
                      <button
                        onClick={() => handleGenerate(i)}
                        disabled={generating[p.id]}
                        className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg transition-all hover:opacity-90 disabled:opacity-40"
                        style={{ background: vColors.accent, color: '#fff' }}
                      >
                        {generating[p.id] ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <QrCode className="w-3.5 h-3.5" />
                        )}
                        {generating[p.id] ? 'Generating...' : 'Generate'}
                      </button>
                    </div>
                    {generated[p.id] && hasAllQr && (
                      <div className="mt-2 text-[10px] font-medium" style={{ color: vColors.accent }}>
                        5 QR codes applied to banners
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <p className="text-[10px] leading-relaxed" style={{ color: textSecondary }}>
        QR codes point to {VET_DOMAIN.domain} short links. Create the actual short links in Short.io separately.
      </p>
    </div>
  );
}
