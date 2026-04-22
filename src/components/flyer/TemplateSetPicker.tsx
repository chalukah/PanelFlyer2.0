import type { BannerTemplateSet } from '../../utils/bannerTemplateSets';

export function TemplateSetPicker({
  sets,
  selectedId,
  onChange,
  darkMode,
}: {
  sets: BannerTemplateSet[];
  selectedId: string;
  onChange: (id: string) => void;
  darkMode: boolean;
}) {
  const labelColor = darkMode ? '#e5e5e5' : '#111';
  const cardBg = darkMode ? '#1f1f1f' : '#ffffff';
  const cardBorder = darkMode ? '#3a3a3a' : '#e5e5e5';
  const descColor = darkMode ? '#a0a0a0' : '#6b7280';
  const selectedRing = '#ec4899';

  return (
    <div>
      <div
        className="text-xs font-semibold uppercase tracking-wider mb-2"
        style={{ color: labelColor }}
      >
        Template Design
      </div>
      <div role="radiogroup" aria-label="Banner template design" className="grid grid-cols-2 gap-3">
        {sets.map((s) => {
          const selected = s.id === selectedId;
          return (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(s.id)}
              className="text-left rounded-lg overflow-hidden transition-all duration-150 focus:outline-none"
              style={{
                background: cardBg,
                border: `2px solid ${selected ? selectedRing : cardBorder}`,
                boxShadow: selected ? `0 0 0 3px ${selectedRing}33` : 'none',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  aspectRatio: '400 / 220',
                  background: `url('${s.thumbnail}') center/cover no-repeat`,
                  width: '100%',
                }}
              />
              <div className="p-3">
                <div
                  className="text-sm font-bold flex items-center gap-2"
                  style={{ color: labelColor }}
                >
                  {s.name}
                  {selected && (
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ background: selectedRing, color: '#fff' }}
                    >
                      Selected
                    </span>
                  )}
                </div>
                <div
                  className="text-xs mt-1 leading-snug"
                  style={{ color: descColor }}
                >
                  {s.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
