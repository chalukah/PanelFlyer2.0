import { useState, useRef, useCallback, useEffect } from 'react';
import {
  FileImage,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Upload,
  Plus,
  Trash2,
  RefreshCw,
  Image,
  Check,
  X,
  ZoomIn,
  ZoomOut,
  Loader2,
  PawPrint,
  Scale,
  Sparkles,
} from 'lucide-react';
import { usePanelStore } from '../panelStore';
import {
  generateBannersForPanelist,
  type BannerData,
  type GeneratedBanner,
  type BannerType,
} from '../utils/bannerTemplates';
import { VERTICALS, getVerticalConfig, type VerticalId } from '../utils/verticalConfig';
import html2canvas from 'html2canvas';

const PINK = '#FF90E8';
const PINK_LIGHT = '#FFF0FB';

// ============================================================
// Vertical icon helper
// ============================================================

function VerticalIcon({ id, className }: { id: VerticalId; className?: string }) {
  switch (id) {
    case 'vet':
      return <PawPrint className={className} />;
    case 'dental':
      // Lucide doesn't have a tooth icon; use a simple SVG inline
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C9.5 2 7 4 7 7c0 3-1 6-2 9s0 6 2 6c1.5 0 2.5-2 3-4 .5-2 1-2 2-2s1.5 0 2 2c.5 2 1.5 4 3 4 2 0 3-3 2-6s-2-6-2-9c0-3-2.5-5-5-5z" />
        </svg>
      );
    case 'law':
      return <Scale className={className} />;
    case 'aesthetics':
      return <Sparkles className={className} />;
  }
}

// ============================================================
// Headshot Upload Helper
// ============================================================

function HeadshotUpload({
  url,
  onChange,
  name,
}: {
  url: string;
  onChange: (url: string) => void;
  name: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-200 shrink-0 cursor-pointer hover:border-[#FF90E8] transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {url ? (
          <img src={url} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400 text-lg font-bold">
            {name[0] || '?'}
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <button
        onClick={() => inputRef.current?.click()}
        className="text-xs font-medium hover:underline"
        style={{ color: PINK }}
      >
        {url ? 'Change' : 'Upload'}
      </button>
      {url && (
        <button onClick={() => onChange('')} className="text-xs text-red-500 hover:underline">
          Remove
        </button>
      )}
    </div>
  );
}

// ============================================================
// Panelist Form Row
// ============================================================

type PanelistFormData = {
  id: string;
  name: string;
  firstName: string;
  title: string;
  org: string;
  headshotUrl: string;
  zoomUrl: string;
};

function PanelistRow({
  panelist,
  onChange,
  onRemove,
}: {
  panelist: PanelistFormData;
  onChange: (updated: PanelistFormData) => void;
  onRemove: () => void;
}) {
  return (
    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
      <div className="flex items-start gap-4">
        <HeadshotUpload
          url={panelist.headshotUrl}
          onChange={(url) => onChange({ ...panelist, headshotUrl: url })}
          name={panelist.name || panelist.firstName || '?'}
        />
        <div className="flex-1 grid grid-cols-2 gap-3">
          <input
            placeholder="Full Name"
            value={panelist.name}
            onChange={(e) => {
              const name = e.target.value;
              const firstName = name.split(' ')[0] || '';
              onChange({ ...panelist, name, firstName });
            }}
            className="col-span-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF90E8]"
          />
          <input
            placeholder="Title / Position"
            value={panelist.title}
            onChange={(e) => onChange({ ...panelist, title: e.target.value })}
            className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF90E8]"
          />
          <input
            placeholder="Organization"
            value={panelist.org}
            onChange={(e) => onChange({ ...panelist, org: e.target.value })}
            className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF90E8]"
          />
          <input
            placeholder="Zoom Registration URL (optional)"
            value={panelist.zoomUrl}
            onChange={(e) => onChange({ ...panelist, zoomUrl: e.target.value })}
            className="col-span-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF90E8]"
          />
        </div>
        <button onClick={onRemove} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Banner Preview with Screenshot-to-PNG
// ============================================================

function BannerPreview({
  banner,
  zoom,
  onDownload,
  downloading,
}: {
  banner: GeneratedBanner;
  zoom: number;
  onDownload: () => void;
  downloading: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-3 px-1">
        <div>
          <h4 className="text-sm font-semibold text-black">
            {banner.label}
          </h4>
          <p className="text-[10px] text-gray-400">{banner.fileName}.png &middot; 1080×1080</p>
        </div>
        <button
          onClick={onDownload}
          disabled={downloading}
          className="flex items-center gap-1.5 px-4 py-1.5 text-black text-xs rounded-full font-bold transition-colors disabled:opacity-50"
          style={{ background: PINK }}
        >
          {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
          {downloading ? 'Exporting...' : 'Download PNG'}
        </button>
      </div>

      <div
        className="overflow-auto rounded-2xl border border-gray-200"
        style={{ maxWidth: '100%', maxHeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
      >
        <div
          ref={containerRef}
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          dangerouslySetInnerHTML={{ __html: banner.html }}
        />
      </div>
    </div>
  );
}

// ============================================================
// Main BannerGenerator Component
// ============================================================

export function BannerGenerator() {
  const panelEvents = usePanelStore((s) => s.panelEvents);

  // Vertical selection
  const [selectedVertical, setSelectedVertical] = useState<VerticalId>('vet');
  const verticalConfig = getVerticalConfig(selectedVertical);

  // Event selection
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  // Form state
  const [panelName, setPanelName] = useState(verticalConfig.panelNameDefault);
  const [panelTopic, setPanelTopic] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('8:00 PM EST');
  const [websiteUrl, setWebsiteUrl] = useState(verticalConfig.websiteUrl);
  const [panelists, setPanelists] = useState<PanelistFormData[]>([]);

  // Generated banners
  const [banners, setBanners] = useState<GeneratedBanner[]>([]);
  const [selectedPanelistFilter, setSelectedPanelistFilter] = useState<string>('all');
  const [selectedBannerType, setSelectedBannerType] = useState<BannerType | 'all'>('all');
  const [zoom, setZoom] = useState(0.45);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  // Hidden render container for html2canvas
  const renderRef = useRef<HTMLDivElement>(null);

  // Handle vertical change
  const handleVerticalChange = (id: VerticalId) => {
    setSelectedVertical(id);
    const config = getVerticalConfig(id);
    setPanelName(config.panelNameDefault);
    setWebsiteUrl(config.websiteUrl);
    setBanners([]);
  };

  // Auto-fill from selected event
  useEffect(() => {
    if (!selectedEventId) return;
    const event = panelEvents.find((e) => e.id === selectedEventId);
    if (!event) return;

    setPanelName(event.panelTitle || event.name || verticalConfig.panelNameDefault);
    setPanelTopic(event.panelSubtitle || event.briefTopicDescription || '');
    setEventDate(event.eventDateFull || event.eventDate || '');
    setPanelists(
      event.panelists.map((p) => ({
        id: p.id,
        name: p.fullName || p.firstName || '',
        firstName: p.firstName || '',
        title: p.title || '',
        org: '',
        headshotUrl: '',
        zoomUrl: p.registrationTrackingLink || '',
      }))
    );
    setBanners([]);
  }, [selectedEventId, panelEvents]);

  const addPanelist = () => {
    setPanelists((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: '', firstName: '', title: '', org: '', headshotUrl: '', zoomUrl: '' },
    ]);
  };

  const updatePanelist = (index: number, data: PanelistFormData) => {
    setPanelists((prev) => prev.map((p, i) => (i === index ? data : p)));
  };

  const removePanelist = (index: number) => {
    setPanelists((prev) => prev.filter((_, i) => i !== index));
  };

  const generateAllBanners = () => {
    if (panelists.length === 0) return;

    const allPanelistData = panelists.map((p) => ({
      name: p.name,
      title: p.title,
      org: p.org,
      headshotUrl: p.headshotUrl,
    }));

    const allBanners: GeneratedBanner[] = [];

    panelists.forEach((p) => {
      const data: BannerData = {
        panelName,
        panelTopic,
        eventDate,
        eventTime,
        websiteUrl,
        panelistName: p.name,
        panelistFirstName: p.firstName,
        panelistTitle: p.title,
        panelistOrg: p.org,
        headshotUrl: p.headshotUrl,
        allPanelists: allPanelistData,
        zoomRegistrationUrl: p.zoomUrl,
        verticalConfig,
      };

      allBanners.push(...generateBannersForPanelist(data));
    });

    setBanners(allBanners);
    setSelectedPanelistFilter('all');
    setSelectedBannerType('all');
  };

  // Download single banner as PNG
  const downloadBanner = useCallback(async (banner: GeneratedBanner) => {
    setDownloading(banner.id);
    try {
      // Create a temporary container off-screen
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '1080px';
      tempDiv.style.height = '1080px';
      tempDiv.innerHTML = banner.html;
      document.body.appendChild(tempDiv);

      // Wait for images to load
      const images = tempDiv.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map(
          (img) => new Promise<void>((resolve) => {
            if (img.complete) { resolve(); return; }
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
        )
      );

      const canvas = await html2canvas(tempDiv.firstElementChild as HTMLElement, {
        width: 1080,
        height: 1080,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });

      document.body.removeChild(tempDiv);

      const link = document.createElement('a');
      link.download = `${banner.fileName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export banner:', err);
    }
    setDownloading(null);
  }, []);

  // Download all banners
  const downloadAllBanners = useCallback(async () => {
    setDownloadingAll(true);
    for (const banner of filteredBanners) {
      await downloadBanner(banner);
      // Small delay between downloads
      await new Promise((r) => setTimeout(r, 300));
    }
    setDownloadingAll(false);
  }, [banners, downloadBanner]);

  // Filter banners
  const filteredBanners = banners.filter((b) => {
    if (selectedPanelistFilter !== 'all' && b.panelistName !== selectedPanelistFilter) return false;
    if (selectedBannerType !== 'all' && b.type !== selectedBannerType) return false;
    return true;
  });

  const uniquePanelistNames = [...new Set(banners.map((b) => b.panelistName))];

  return (
    <div className="p-6 max-w-[1400px]">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-black">Promo Banner Generator</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Generate 5 {verticalConfig.shortName}-branded promotional banners per panelist — 1080×1080px, {verticalConfig.name}.
          </p>
        </div>
        {banners.length > 0 && (
          <button
            onClick={downloadAllBanners}
            disabled={downloadingAll}
            className="flex items-center gap-2 px-4 py-2 text-black rounded-full text-sm font-bold transition-colors disabled:opacity-50"
            style={{ background: PINK }}
          >
            {downloadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloadingAll ? 'Downloading...' : `Download All (${filteredBanners.length})`}
          </button>
        )}
      </div>

      {/* Two column layout: form + preview */}
      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        {/* LEFT: Configuration Panel */}
        <div className="space-y-4">
          {/* Vertical Selector */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-black mb-3">
              Select Vertical
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {VERTICALS.map((v) => {
                const isSelected = selectedVertical === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => handleVerticalChange(v.id)}
                    className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-2xl border-2 text-xs font-semibold transition-all ${
                      isSelected
                        ? 'scale-[1.02]'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    style={isSelected ? { color: '#000', borderColor: PINK, background: PINK_LIGHT } : undefined}
                  >
                    <VerticalIcon id={v.id} className="w-5 h-5" />
                    <span>{v.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Event selector */}
          {panelEvents.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-black mb-3">
                Import from Event
              </h3>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF90E8]"
              >
                <option value="">— Select an event —</option>
                {panelEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({event.panelists.length} panelists)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Event Details */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-black">Event Details</h3>
            <div>
              <label className="text-xs font-medium text-gray-500">Panel Name</label>
              <input
                value={panelName}
                onChange={(e) => setPanelName(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF90E8]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Panel Topic</label>
              <input
                value={panelTopic}
                onChange={(e) => setPanelTopic(e.target.value)}
                placeholder="e.g. Building a Thriving Practice"
                className="w-full mt-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF90E8]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Event Date</label>
                <input
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  placeholder="SUNDAY, MARCH 23, 2026"
                  className="w-full mt-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF90E8]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Event Time</label>
                <input
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF90E8]"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Website URL</label>
              <input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF90E8]"
              />
            </div>
          </div>

          {/* Panelists */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-black">
                Panelists ({panelists.length})
              </h3>
              <button
                onClick={addPanelist}
                className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ color: '#000', background: PINK }}
              >
                <Plus className="w-3 h-3" /> Add Panelist
              </button>
            </div>

            {panelists.length === 0 ? (
              <div className="text-center py-6">
                <Image className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No panelists yet</p>
                <p className="text-xs text-gray-400 mt-1">Add panelists or import from an event above</p>
                <button
                  onClick={addPanelist}
                  className="mt-3 flex items-center gap-1.5 mx-auto px-4 py-1.5 text-black text-xs rounded-full font-bold transition-colors"
                  style={{ background: PINK }}
                >
                  <Plus className="w-3 h-3" /> Add First Panelist
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {panelists.map((p, i) => (
                  <PanelistRow
                    key={p.id}
                    panelist={p}
                    onChange={(data) => updatePanelist(i, data)}
                    onRemove={() => removePanelist(i)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={generateAllBanners}
            disabled={panelists.length === 0 || !panelTopic}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-black rounded-full text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: PINK }}
          >
            <RefreshCw className="w-4 h-4" />
            Generate {panelists.length * 5} Banners ({panelists.length} panelist{panelists.length !== 1 ? 's' : ''} × 5)
          </button>
        </div>

        {/* RIGHT: Banner Preview */}
        <div className="space-y-4">
          {banners.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <FileImage className="w-16 h-16 mx-auto text-gray-200 mb-4" />
              <h3 className="text-lg font-semibold text-black mb-2">
                No Banners Generated Yet
              </h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                Fill in the event details and add panelists on the left, then click "Generate Banners" to create
                5 promotional banners per panelist.
              </p>
              <div className="mt-6 grid grid-cols-5 gap-2 max-w-lg mx-auto">
                {['B1 — Intro', 'B2 — Panel 1', 'B3 — Panel 2', 'B4 — 1 More Day', 'B5 — Today!'].map((label) => (
                  <div
                    key={label}
                    className="aspect-square rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center p-2 text-center"
                  >
                    <span className="text-[9px] text-gray-400 font-medium leading-tight">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Filters bar */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4 flex-wrap">
                {/* Panelist filter */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Panelist:</label>
                  <select
                    value={selectedPanelistFilter}
                    onChange={(e) => setSelectedPanelistFilter(e.target.value)}
                    className="border border-gray-200 rounded-full px-3 py-1.5 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#FF90E8]"
                  >
                    <option value="all">All ({banners.length})</option>
                    {uniquePanelistNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                {/* Banner type filter */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Type:</label>
                  <div className="flex gap-1">
                    {(['all', 'B1', 'B2', 'B3', 'B4', 'B5'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedBannerType(type)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all border ${
                          selectedBannerType === type
                            ? 'bg-black text-white border-black'
                            : 'text-gray-500 bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {type === 'all' ? 'All' : type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zoom */}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.2, z - 0.05))}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <ZoomOut className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                  <span className="text-[10px] text-gray-400 w-8 text-center">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => setZoom((z) => Math.min(1, z + 0.05))}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <ZoomIn className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                </div>

                <span className="text-xs text-gray-400">
                  Showing {filteredBanners.length} of {banners.length}
                </span>
              </div>

              {/* Banner grid */}
              <div className="grid grid-cols-1 gap-6">
                {filteredBanners.map((banner) => (
                  <div
                    key={banner.id}
                    className="bg-white rounded-2xl border border-gray-200 p-5"
                  >
                    <BannerPreview
                      banner={banner}
                      zoom={zoom}
                      onDownload={() => downloadBanner(banner)}
                      downloading={downloading === banner.id}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hidden render container */}
      <div ref={renderRef} style={{ position: 'fixed', left: '-9999px', top: 0 }} />
    </div>
  );
}
