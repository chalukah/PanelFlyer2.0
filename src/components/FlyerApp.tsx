import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Download,
  Plus,
  Trash2,
  RefreshCw,
  Image,
  Loader2,
  PawPrint,
  Scale,
  Sparkles,
  FileImage,
  Wand2,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  FolderOpen,
  Unplug,
  Pencil,
  Users,
  Settings,
  Eye,
  EyeOff,
  Zap,
  QrCode,
  Upload,
} from 'lucide-react';
import {
  generateBannersForPanelist,
  type BannerData,
  type GeneratedBanner,
  type BannerType,
  type BannerTheme,
  BANNER_THEMES,
} from '../utils/bannerTemplates';
import { VERTICALS, getVerticalConfig, type VerticalId } from '../utils/verticalConfig';
import {
  initGoogleAuth,
  signIn,
  isSignedIn as checkGoogleSignedIn,
  listFolderContents,
  readGoogleDoc,
  getFileAsDataUrl,
  extractFolderIdFromUrl,
  clearStoredToken,
  type DriveFile,
} from '../utils/googleDrive';
import {
  parseEventFolder,
  extractPanelistsFromDoc,
  extractPanelistsWithAI,
  extractPanelistsFromFileNames,
  extractEventDetails,
} from '../utils/folderParser';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { sendToClaudeAI, testClaudeConnection, sendToClaudeCLI, checkClaudeCLIStatus } from '../utils/claudeClient';

// ============================================================
// Types
// ============================================================

type QrCodes = { B1?: string; B2?: string; B3?: string; B4?: string; B5?: string };

type PanelistFormData = {
  id: string;
  name: string;
  firstName: string;
  title: string;
  org: string;
  headshotUrl: string;
  zoomUrl: string;
  qrCodes: QrCodes;
};

// ============================================================
// Vertical icon helper
// ============================================================

function VerticalIcon({ id, className }: { id: VerticalId; className?: string }) {
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

// ============================================================
// Vertical emoji map
// ============================================================

const VERTICAL_EMOJI: Record<VerticalId, string> = {
  vet: '🐾',
  'thriving-dentist': '🦷',
  'dominate-law': '⚖️',
  aesthetics: '✨',
};

const BANNER_TYPE_LABELS: Record<BannerType, string> = {
  B1: 'Intro',
  B2: 'Panel 1',
  B3: 'Panel 2',
  B4: 'One More Day',
  B5: 'Today',
};

type PanelistCount = 2 | 3 | 4;

// ============================================================
// Pink accent constant
// ============================================================
const PINK = '#FF90E8';
const PINK_LIGHT = '#FFF0FB';
const CREAM = '#F4F4F0';
const WARM_BORDER = '#000000';

// ============================================================
// Headshot Upload (used in manual fallback)
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
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-14 h-14 rounded-full overflow-hidden shrink-0 cursor-pointer transition-all duration-200 hover:scale-105 border-2 border-black"
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
        className="text-xs hover:underline font-medium"
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
// Panelist Form Row (used in manual fallback)
// ============================================================

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
    <div className="bg-white rounded-2xl p-4 border-[2px] border-black">
      <div className="flex items-start gap-4">
        <HeadshotUpload
          url={panelist.headshotUrl}
          onChange={(url) => onChange({ ...panelist, headshotUrl: url })}
          name={panelist.name || panelist.firstName || '?'}
        />
        <div className="flex-1 grid grid-cols-2 gap-2.5">
          <input
            placeholder="Full Name"
            value={panelist.name}
            onChange={(e) => {
              const name = e.target.value;
              const firstName = name.split(' ')[0] || '';
              onChange({ ...panelist, name, firstName });
            }}
            className="col-span-2 px-3 py-2 rounded-lg border-[2px] border-black bg-white text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
          />
          <input
            placeholder="Title / Position"
            value={panelist.title}
            onChange={(e) => onChange({ ...panelist, title: e.target.value })}
            className="px-3 py-2 rounded-lg border-[2px] border-black bg-white text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
          />
          <input
            placeholder="Organization"
            value={panelist.org}
            onChange={(e) => onChange({ ...panelist, org: e.target.value })}
            className="px-3 py-2 rounded-lg border-[2px] border-black bg-white text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
          />
        </div>
        <button onClick={onRemove} className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Banner Thumbnail for Grid
// ============================================================

function BannerThumbnail({
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
        border: selected ? `3px solid ${PINK}` : '2px solid black',
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
          background: selected ? PINK : 'rgba(255,255,255,0.8)',
          borderColor: selected ? PINK : 'rgba(0,0,0,0.3)',
        }}
        onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
      >
        {selected && <Check className="w-3 h-3 text-black" />}
      </div>
    </div>
  );
}

// ============================================================
// Full Banner Preview Modal
// ============================================================

function BannerModal({
  banners,
  currentIndex,
  onClose,
  onNavigate,
  onDownload,
  downloading,
}: {
  banners: GeneratedBanner[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (idx: number) => void;
  onDownload: (banner: GeneratedBanner) => void;
  downloading: string | null;
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
        className="relative bg-white rounded-2xl border-[2px] border-black flex flex-col"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
          maxWidth: '95vw',
          maxHeight: '95vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-black">{banner.label}</h3>
            <p className="text-xs text-gray-400">{banner.panelistName} &middot; {banner.fileName}.png &middot; 1080x1080</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(banner)}
              disabled={downloading === banner.id}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-black text-white text-xs rounded-full font-bold transition-all hover:opacity-80 disabled:opacity-50"
            >
              {downloading === banner.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              Download PNG
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Banner — scaled to fit viewport */}
        <div className="flex items-center justify-center p-4 overflow-hidden">
          <div
            className="rounded-xl overflow-hidden border-[2px] border-black"
            style={{
              width: displaySize,
              height: displaySize,
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
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-md hover:scale-110 transition-transform border-[2px] border-black"
          >
            <ChevronLeft className="w-6 h-6 text-black" />
          </button>
        )}
        {currentIndex < banners.length - 1 && (
          <button
            onClick={() => onNavigate(currentIndex + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-md hover:scale-110 transition-transform border-[2px] border-black"
          >
            <ChevronRight className="w-6 h-6 text-black" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Main FlyerApp
// ============================================================

export default function FlyerApp() {
  // Vertical selection
  const [selectedVertical, setSelectedVertical] = useState<VerticalId>('vet');
  const verticalConfig = getVerticalConfig(selectedVertical);

  // Panelist count
  const [panelistCount, setPanelistCount] = useState<PanelistCount>(3);

  // Internal form state (populated by Drive import or manual entry)
  const [headerText, setHeaderText] = useState('Veterinary Business Institute Expert Panel');
  const [selectedTheme, setSelectedTheme] = useState<BannerTheme>(BANNER_THEMES[0]);
  const [panelName, setPanelName] = useState(verticalConfig.panelNameDefault);
  const [panelTopic, setPanelTopic] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('8:00 PM EST');
  const [websiteUrl, setWebsiteUrl] = useState(verticalConfig.websiteUrl);
  const [panelists, setPanelists] = useState<PanelistFormData[]>([]);

  // Generated banners
  const [banners, setBanners] = useState<GeneratedBanner[]>([]);
  const [visibleBannerIds, setVisibleBannerIds] = useState<Set<string>>(new Set());
  const [selectedPanelistFilter, setSelectedPanelistFilter] = useState<string>('all');
  const [selectedBannerType, setSelectedBannerType] = useState<BannerType | 'all'>('all');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);
  const [selectedBannerIds, setSelectedBannerIds] = useState<Set<string>>(new Set());

  // Modal
  const [modalBannerIndex, setModalBannerIndex] = useState<number | null>(null);

  // Google Drive import state
  const [driveUrl, setDriveUrl] = useState('');
  const [driveSignedIn, setDriveSignedIn] = useState(() => {
    try {
      const expiry = localStorage.getItem('gd_token_expiry');
      return !!(expiry && Date.now() < parseInt(expiry));
    } catch { return false; }
  });
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveStep, setDriveStep] = useState('');
  const [driveError, setDriveError] = useState('');
  const [driveImported, setDriveImported] = useState(false);

  // UI toggles
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showEditOverrides, setShowEditOverrides] = useState(true);

  // Generation progress
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);

  // Claude AI settings
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'cli' | 'apikey'>('cli');
  const [claudeKey, setClaudeKey] = useState(() => localStorage.getItem('panel_flyer_claude_key') || '');
  const [claudeModel, setClaudeModel] = useState(() => localStorage.getItem('panel_flyer_claude_model') || 'claude-sonnet-4-20250514');
  const [claudeConnected, setClaudeConnected] = useState(false);
  const [claudeTesting, setClaudeTesting] = useState(false);
  const [claudeChecking, setClaudeChecking] = useState(true); // starts true — checking on load
  const [cliConnected, setCliConnected] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [aiEnhancing, setAiEnhancing] = useState(false);

  // Init Google auth on load if we have a stored token
  useEffect(() => {
    if (driveSignedIn) {
      import('../utils/googleDrive').then(({ initGoogleAuth, clearStoredToken: clearToken }) => {
        initGoogleAuth().catch(() => {
          // Token expired or invalid, clear it
          clearToken();
          setDriveSignedIn(false);
        });
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check local Claude CLI status on app load
  useEffect(() => {
    setClaudeChecking(true);
    checkClaudeCLIStatus().then(status => {
      setCliConnected(status.connected);
      if (status.connected) {
        setClaudeConnected(true);
      } else {
        // Fallback: check saved API key
        const savedKey = localStorage.getItem('panel_flyer_claude_key');
        if (savedKey) {
          testClaudeConnection(savedKey, claudeModel).then(ok => setClaudeConnected(ok));
        }
      }
      setClaudeChecking(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle vertical change
  const handleVerticalChange = (id: VerticalId) => {
    setSelectedVertical(id);
    const config = getVerticalConfig(id);
    setHeaderText(`${config.name} Expert Panel`);
    setPanelName(config.panelNameDefault);
    setWebsiteUrl(config.websiteUrl);
    setBanners([]);
    setVisibleBannerIds(new Set());
    // Auto-select matching theme per vertical
    const themeMap: Record<string, string> = {
      'thriving-dentist': 'thriving-dentist',
      'dominate-law': 'dominate-law',
      'aesthetics': 'business-aesthetics',
    };
    const targetThemeId = themeMap[id];
    if (targetThemeId) {
      const match = BANNER_THEMES.find(t => t.id === targetThemeId);
      if (match) setSelectedTheme(match);
    } else if (['thriving-dentist', 'dominate-law', 'business-aesthetics'].includes(selectedTheme.id)) {
      // Switching to VET, reset to classic
      setSelectedTheme(BANNER_THEMES[0]);
    }
  };

  const addPanelist = () => {
    setPanelists((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: '', firstName: '', title: '', org: '', headshotUrl: '', zoomUrl: '', qrCodes: {} },
    ]);
  };

  const updatePanelist = (index: number, data: PanelistFormData) => {
    setPanelists((prev) => prev.map((p, i) => (i === index ? data : p)));
  };

  const removePanelist = (index: number) => {
    setPanelists((prev) => prev.filter((_, i) => i !== index));
  };

  // Generate all banners with staggered animation
  const generateAllBanners = useCallback(() => {
    if (panelists.length === 0) return;
    const incomplete = panelists.filter(p => !p.name.trim());
    if (incomplete.length > 0) {
      // Still generate, but fill in defaults for empty names
      panelists.forEach((p, i) => {
        if (!p.name.trim()) {
          setPanelists(prev => prev.map((pp, idx) => idx === i ? { ...pp, name: `Panelist ${i + 1}`, firstName: 'Panelist' } : pp));
        }
      });
    }

    lastGenSnapshot.current = getDataSnapshot();
    setGenerating(true);
    setGenProgress(0);
    setVisibleBannerIds(new Set());

    const allPanelistData = panelists.map((p) => ({
      name: p.name,
      title: p.title,
      org: p.org,
      headshotUrl: p.headshotUrl,
    }));

    const allBanners: GeneratedBanner[] = [];

    panelists.forEach((p) => {
      const data: BannerData = {
        headerText,
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
        qrCodeUrls: p.qrCodes,
        zoomRegistrationUrl: p.zoomUrl,
        verticalConfig,
        theme: selectedTheme,
      };

      allBanners.push(...generateBannersForPanelist(data));
    });

    setBanners(allBanners);
    setSelectedPanelistFilter('all');
    setSelectedBannerType('all');

    // Staggered reveal animation
    allBanners.forEach((b, i) => {
      setTimeout(() => {
        setVisibleBannerIds((prev) => new Set([...prev, b.id]));
        setGenProgress(((i + 1) / allBanners.length) * 100);
        if (i === allBanners.length - 1) setGenerating(false);
      }, 100 * i);
    });
  }, [panelists, headerText, panelName, panelTopic, eventDate, eventTime, websiteUrl, verticalConfig, selectedTheme]);

  // Track last-generated state to avoid unnecessary regeneration on blur
  const lastGenSnapshot = useRef('');
  const getDataSnapshot = useCallback(() => {
    return JSON.stringify({ headerText, panelName, panelTopic, eventDate, eventTime, websiteUrl, panelists: panelists.map(p => ({ name: p.name, title: p.title, org: p.org })) });
  }, [headerText, panelName, panelTopic, eventDate, eventTime, websiteUrl, panelists]);

  const regenerateIfChanged = useCallback(() => {
    const snap = getDataSnapshot();
    if (snap !== lastGenSnapshot.current && banners.length > 0) {
      lastGenSnapshot.current = snap;
      generateAllBanners();
    }
  }, [getDataSnapshot, banners.length, generateAllBanners]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSettings(false);
        setModalBannerIndex(null);
      }
      // Ctrl/Cmd + Enter = Generate banners
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && panelists.length > 0 && !generating) {
        e.preventDefault();
        generateAllBanners();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [panelists.length, generating, generateAllBanners]);

  // Render a banner to a canvas element using an iframe for proper CSS isolation
  const renderBannerToCanvas = useCallback(async (banner: GeneratedBanner): Promise<HTMLCanvasElement> => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = '1080px';
    iframe.style.height = '1080px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) throw new Error('Could not access iframe document');

    iframeDoc.open();
    iframeDoc.write(banner.html);
    iframeDoc.close();

    // Wait for fonts and images to load
    await new Promise<void>((resolve) => {
      const checkReady = () => {
        const images = iframeDoc.querySelectorAll('img');
        const allLoaded = Array.from(images).every((img) => img.complete);
        if (allLoaded) {
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      // Give fonts time to load, then check images
      setTimeout(checkReady, 500);
    });

    // Additional wait for Google Fonts to render
    await new Promise((r) => setTimeout(r, 300));

    const posterEl = (iframeDoc.querySelector('.poster') || iframeDoc.querySelector('body > div')) as HTMLElement;
    if (!posterEl) throw new Error('Could not find .poster element');

    const canvas = await html2canvas(posterEl, {
      width: 1080,
      height: 1080,
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      foreignObjectRendering: false,
    });

    document.body.removeChild(iframe);
    return canvas;
  }, []);

  // Download single banner as PNG + HTML in a zip
  const downloadBanner = useCallback(async (banner: GeneratedBanner) => {
    setDownloading(banner.id);
    try {
      const canvas = await renderBannerToCanvas(banner);
      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1];
      const safeName = banner.fileName.replace(/[<>:"/\\|?*]/g, '_');

      const zip = new JSZip();
      // PNG
      zip.file(`${safeName}.png`, base64, { base64: true });
      // HTML
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=1080">
<title>${banner.label} - ${banner.panelistName}</title>
<style>
  body { margin: 0; padding: 0; background: #000; display: flex; justify-content: center; }
</style>
</head>
<body>
${banner.html}
</body>
</html>`;
      zip.file(`${safeName}.html`, htmlContent);

      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.download = `${safeName}.zip`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Failed to export banner:', err);
      // Show user-visible error
      setDriveError('Download failed. Please try again.');
      setTimeout(() => setDriveError(''), 3000);
    }
    setDownloading(null);
  }, [renderBannerToCanvas]);

  // Filter banners
  const filteredBanners = banners.filter((b) => {
    if (selectedPanelistFilter !== 'all' && b.panelistName !== selectedPanelistFilter) return false;
    if (selectedBannerType !== 'all' && b.type !== selectedBannerType) return false;
    return true;
  });

  // Toggle banner selection
  const toggleBannerSelection = useCallback((bannerId: string) => {
    setSelectedBannerIds((prev) => {
      const next = new Set(prev);
      if (next.has(bannerId)) next.delete(bannerId);
      else next.add(bannerId);
      return next;
    });
  }, []);

  // Select / deselect all visible banners
  const selectAllVisible = useCallback(() => {
    const visibleIds = filteredBanners.map((b) => b.id);
    setSelectedBannerIds((prev) => {
      const allSelected = visibleIds.every((id) => prev.has(id));
      if (allSelected) return new Set(); // deselect all
      return new Set(visibleIds);
    });
  }, [filteredBanners]);

  // Download a set of banners as ZIP — organized by panelist folders, with PNGs + HTMLs
  const downloadBannersAsZip = useCallback(async (bannersToZip: GeneratedBanner[], zipLabel?: string) => {
    if (bannersToZip.length === 0) return;
    setDownloadingAll(true);
    try {
      const zip = new JSZip();

      // Group banners by panelist name
      const byPanelist = new Map<string, GeneratedBanner[]>();
      for (const banner of bannersToZip) {
        const arr = byPanelist.get(banner.panelistName) || [];
        arr.push(banner);
        byPanelist.set(banner.panelistName, arr);
      }

      let processedCount = 0;
      const totalBanners = bannersToZip.length;
      for (const [panelistName, pBanners] of byPanelist) {
        // Create a folder for each panelist
        const folderName = panelistName.replace(/[<>:"/\\|?*]/g, '_');
        const folder = zip.folder(folderName)!;

        for (const banner of pBanners) {
          processedCount++;
          setDownloadProgress({ current: processedCount, total: totalBanners });
          // Render PNG
          const canvas = await renderBannerToCanvas(banner);
          const dataUrl = canvas.toDataURL('image/png');
          const base64 = dataUrl.split(',')[1];
          const safeName = banner.fileName.replace(/[<>:"/\\|?*]/g, '_');

          // Add PNG
          folder.file(`${safeName}.png`, base64, { base64: true });

          // Add HTML — the banner html is already a full document
          folder.file(`${safeName}.html`, banner.html);
        }
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.download = `${zipLabel || panelName || 'banners'}.zip`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Failed to create zip:', err);
      setDriveError('ZIP creation failed. Please try again.');
      setTimeout(() => setDriveError(''), 3000);
    }
    setDownloadingAll(false);
    setDownloadProgress(null);
  }, [renderBannerToCanvas, panelName]);

  const downloadSelectedBanners = useCallback(() => {
    const selected = filteredBanners.filter((b) => selectedBannerIds.has(b.id));
    downloadBannersAsZip(selected, `${panelName || 'banners'}_selected`);
  }, [filteredBanners, selectedBannerIds, downloadBannersAsZip, panelName]);

  const downloadAllBanners = useCallback(() => {
    downloadBannersAsZip(filteredBanners);
  }, [filteredBanners, downloadBannersAsZip]);

  const uniquePanelistNames = [...new Set(banners.map((b) => b.panelistName))];

  // ============================================================
  // Google Drive Import
  // ============================================================

  const handleDriveConnect = async () => {
    setDriveError('');
    try {
      await signIn();
      setDriveSignedIn(true);
    } catch (err: unknown) {
      setDriveError(err instanceof Error ? err.message : 'Failed to connect');
    }
  };

  const handleDriveImportAndGenerate = async () => {
    if (!driveUrl) return;
    const folderId = extractFolderIdFromUrl(driveUrl);
    if (!folderId) {
      setDriveError('Invalid Google Drive folder URL');
      return;
    }

    setDriveLoading(true);
    setDriveError('');
    setDriveImported(false);
    setBanners([]);
    setVisibleBannerIds(new Set());
    setSelectedBannerIds(new Set());

    try {
      // Step 1: Read folder
      setDriveStep('Reading folder...');
      const files = await listFolderContents(folderId);

      let folderName = folderId;
      try {
        // Attempt to extract a readable folder name from promo doc filenames
        const promoFile = files.find(f => /promotional|promo/i.test(f.name));
        if (promoFile) {
          const extracted = promoFile.name.split(/\s*[-–—]\s*(?:promotional|promo)/i)[0]?.trim();
          if (extracted && extracted.length > 3) folderName = extracted;
        }
      } catch {
        // ignore
      }

      const parsed = parseEventFolder(files, folderName);

      // Step 2: Read Partner Details doc + Promotional Materials docs
      let docText = '';
      if (parsed.partnerDetailsDocId) {
        setDriveStep('Reading Partner Details doc...');
        docText = await readGoogleDoc(parsed.partnerDetailsDocId);
      }

      // Also read promotional materials docs — they often contain bios with titles/credentials/orgs
      if (parsed.promoDocIds && parsed.promoDocIds.length > 0) {
        setDriveStep('Reading Promotional Materials...');
        for (const promoId of parsed.promoDocIds) {
          try {
            const promoText = await readGoogleDoc(promoId);
            if (promoText.trim()) {
              docText += '\n\n--- PROMOTIONAL MATERIALS ---\n' + promoText;
            }
          } catch {
            // skip unreadable promo docs
          }
        }
      }

      // Step 3: Extract panelists — try AI first, fallback to regex, then filenames
      setDriveStep('Extracting panelist info with AI...');

      let parsedPanelists = await extractPanelistsWithAI(docText, files.map(f => f.name), claudeKey || undefined);

      // Filter out clearly invalid "panelist" names (doc headings, section titles, etc.)
      const JUNK_NAME_PATTERNS = /^(zoom|landing|page|partner|details|promotional|material|registration|overview|agenda|schedule|notes|draft|template|untitled|document|reducing|increasing|improving|building|how|what|why|when|the |this |our |your |panel|expert|topic|discussion|date|time|location|event|webinar|register)/i;
      parsedPanelists = parsedPanelists.filter(p =>
        p.name.trim().length > 2 &&
        !JUNK_NAME_PATTERNS.test(p.name.trim()) &&
        // Real names have 2+ words or a Dr. prefix
        (p.name.trim().includes(' ') || /^dr\./i.test(p.name.trim()))
      );

      // Fallback to filename extraction if AI found nothing valid
      if (parsedPanelists.length === 0) {
        parsedPanelists = extractPanelistsFromFileNames(files);
      }

      const eventDetails = extractEventDetails(docText, parsed.folderName);

      // Auto-detect vertical from doc/folder content
      const docLower = (docText + ' ' + driveUrl).toLowerCase();
      const folderLower = parsed.folderName.toLowerCase();
      const allText = docLower + ' ' + folderLower;
      let detectedVertical: VerticalId | null = null;
      if (/thriving\s*dentist|dental|dentist|dds|dmd|orthodont/i.test(allText)) detectedVertical = 'thriving-dentist';
      else if (/aesthetic|med\s*spa|medispa|botox|filler|skin\s*care|dermatolog|beauty/i.test(allText)) detectedVertical = 'aesthetics';
      else if (/dominate\s*law|law|attorney|legal|counsel|barrister|solicitor|esquire/i.test(allText)) detectedVertical = 'dominate-law';
      else if (/vet|veterinar|dvm|animal\s*hospital|animal\s*clinic|pet\s*care/i.test(allText)) detectedVertical = 'vet';

      if (detectedVertical && detectedVertical !== selectedVertical) {
        setSelectedVertical(detectedVertical);
        const newConfig = getVerticalConfig(detectedVertical);
        setHeaderText(`${newConfig.name} Expert Panel`);
        setWebsiteUrl(newConfig.websiteUrl);
      }

      // Step 4: Download headshots — check headshots folder, then root images
      const headshotMap = new Map<string, string>();
      let imageFiles: DriveFile[] = [];

      if (parsed.headhotsFolderId) {
        setDriveStep('Downloading headshots...');
        const headshotFiles = await listFolderContents(parsed.headhotsFolderId);
        imageFiles = headshotFiles.filter((f) => f.mimeType.startsWith('image/'));
      }

      // Also check for images in root folder (some events don't have a headshots subfolder)
      if (imageFiles.length === 0) {
        setDriveStep('Looking for headshot images...');
        imageFiles = files.filter((f) => f.mimeType.startsWith('image/'));
      }

      // Also check subfolders that might contain headshots (e.g. date-named folders)
      if (imageFiles.length === 0 && parsed.bannersFolderId) {
        try {
          const subFiles = await listFolderContents(parsed.bannersFolderId);
          imageFiles = subFiles.filter((f) => f.mimeType.startsWith('image/'));
        } catch { /* skip */ }
      }

      // Helper: extract last name from a panelist name (strip Dr. prefix and credentials after comma)
      const getLastName = (fullName: string): string => {
        // "Dr. Danielle Mercado, CVBL, FFCP" → "Danielle Mercado" → "Mercado"
        const withoutCredentials = fullName.split(',')[0].trim();
        const withoutPrefix = withoutCredentials.replace(/^Dr\.?\s*/i, '').trim();
        const parts = withoutPrefix.split(/[\s-]+/);
        return parts[parts.length - 1]?.toLowerCase() || '';
      };

      // Helper: extract first name
      const getFirstName = (p: { firstName: string; name: string }): string => {
        return (p.firstName || '').replace(/^Dr\.?\s*/i, '').trim().toLowerCase();
      };

      for (const img of imageFiles) {
        try {
          const dataUrl = await getFileAsDataUrl(img.id);
          const imgNameLower = img.name.toLowerCase();
          let matched = false;

          // Try last name first (more unique, avoids "Dani" matching "Danielle")
          for (const p of parsedPanelists) {
            const lastLower = getLastName(p.name);
            if (lastLower.length > 2 && imgNameLower.includes(lastLower) && !headshotMap.has(p.name)) {
              headshotMap.set(p.name, dataUrl);
              matched = true;
              break;
            }
          }

          // Fallback: try first name match but require word boundary (exact word, not substring)
          if (!matched) {
            for (const p of parsedPanelists) {
              const firstLower = getFirstName(p);
              if (firstLower.length > 2 && new RegExp(`\\b${firstLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(imgNameLower) && !headshotMap.has(p.name)) {
                headshotMap.set(p.name, dataUrl);
                matched = true;
                break;
              }
            }
          }

          // Last fallback: loose first name includes
          if (!matched) {
            for (const p of parsedPanelists) {
              const firstLower = getFirstName(p);
              if (firstLower.length > 2 && imgNameLower.includes(firstLower) && !headshotMap.has(p.name)) {
                headshotMap.set(p.name, dataUrl);
                matched = true;
                break;
              }
            }
          }

          // Last resort: assign to next panelist without a headshot
          if (!matched) {
            const unmatched = parsedPanelists.find(p => !headshotMap.has(p.name));
            if (unmatched) {
              headshotMap.set(unmatched.name, dataUrl);
            }
          }
        } catch {
          // skip failed downloads
        }
      }

      // Step 5: Auto-fill internal state
      setDriveStep('Auto-filling data...');

      if (eventDetails.panelName && eventDetails.panelName !== folderId) {
        setPanelName(eventDetails.panelName);
      }
      if (eventDetails.panelTopic) setPanelTopic(eventDetails.panelTopic);
      if (eventDetails.eventDate) setEventDate(eventDetails.eventDate);
      if (eventDetails.eventTime) setEventTime(eventDetails.eventTime);
      if (eventDetails.websiteUrl) setWebsiteUrl(eventDetails.websiteUrl);

      // Build panelist form data
      const zoomUrl = eventDetails.zoomRegistrationUrl || '';
      const qrCodes: QrCodes = zoomUrl ? {
        B1: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(zoomUrl)}`,
        B2: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(zoomUrl)}`,
        B3: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(zoomUrl)}`,
        B4: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(zoomUrl)}`,
        B5: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(zoomUrl)}`,
      } : {};

      let newPanelists: PanelistFormData[] = parsedPanelists.map((p) => ({
        id: crypto.randomUUID(),
        name: p.name,
        firstName: p.firstName,
        title: p.title,
        org: p.org,
        headshotUrl: headshotMap.get(p.name) || '',
        zoomUrl: zoomUrl,
        qrCodes: qrCodes,
      }));

      // If no panelists were extracted from the doc, assign unmatched headshots
      if (newPanelists.length === 0 && headshotMap.size > 0) {
        for (const [name, url] of headshotMap) {
          const cleanName = name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
          newPanelists.push({
            id: crypto.randomUUID(),
            name: cleanName,
            firstName: cleanName.split(' ')[0],
            title: '',
            org: '',
            headshotUrl: url,
            zoomUrl: '',
            qrCodes: {},
          });
        }
      }

      // Trim or pad to match selected panelist count
      if (newPanelists.length > panelistCount) {
        newPanelists = newPanelists.slice(0, panelistCount);
      }

      if (newPanelists.length > 0) {
        setPanelists(newPanelists);
        setPanelistCount(Math.min(Math.max(newPanelists.length, 2), 4) as PanelistCount);
      }

      setDriveImported(true);
      setDriveStep('');

      // Trigger banner regeneration after state has settled
      setTimeout(() => {
        setImportGenToken((t) => t + 1);
      }, 100);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      if (msg === 'GOOGLE_AUTH_EXPIRED') {
        // Token expired — clear state and prompt re-auth
        clearStoredToken();
        setDriveSignedIn(false);
        setDriveError('Google session expired. Please reconnect and try again.');
      } else {
        setDriveError(msg);
      }
    } finally {
      setDriveLoading(false);
      setDriveStep('');
    }
  };

  // Auto-generate banners when import completes
  const [importGenToken, setImportGenToken] = useState(0);
  useEffect(() => {
    if (importGenToken > 0 && panelists.length > 0) {
      generateAllBanners();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importGenToken]);

  // Auto-trigger import when URL is pasted and user is signed in
  useEffect(() => {
    if (driveUrl && driveSignedIn && !driveLoading && !driveImported) {
      const folderId = extractFolderIdFromUrl(driveUrl);
      if (folderId) {
        handleDriveImportAndGenerate();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driveUrl, driveSignedIn]);

  // Claude settings handlers
  const handleSaveClaudeSettings = () => {
    localStorage.setItem('panel_flyer_claude_key', claudeKey);
    localStorage.setItem('panel_flyer_claude_model', claudeModel);
  };

  const handleCheckCLIConnection = async () => {
    setClaudeChecking(true);
    const status = await checkClaudeCLIStatus();
    setCliConnected(status.connected);
    if (status.connected) {
      setClaudeConnected(true);
    }
    setClaudeChecking(false);
    return status.connected;
  };

  const handleTestConnection = async () => {
    // First try CLI
    const cliOk = await handleCheckCLIConnection();
    if (cliOk) return;

    // Then try API key
    if (!claudeKey) return;
    setClaudeTesting(true);
    const ok = await testClaudeConnection(claudeKey, claudeModel);
    setClaudeConnected(ok);
    setClaudeTesting(false);
  };

  const handleAiEnhance = async () => {
    if (!panelTopic) return;
    setAiEnhancing(true);
    const enhancePrompt = `You are a marketing copywriter for professional industry panels. Improve this panel topic/title to be more compelling and engaging while keeping the same meaning. Return ONLY the improved title, nothing else.\n\nOriginal: ${panelTopic}`;
    try {
      let result: string;
      if (cliConnected) {
        result = await sendToClaudeCLI(enhancePrompt);
      } else if (claudeKey) {
        result = await sendToClaudeAI(claudeKey, enhancePrompt, claudeModel);
      } else {
        throw new Error('No AI connection available');
      }
      setPanelTopic(result.trim());
    } catch (err) {
      console.error('AI enhance failed:', err);
    } finally {
      setAiEnhancing(false);
    }
  };

  // Input class helper
  const inputClass = "w-full px-3 py-2.5 rounded-lg border-[2px] border-black bg-white text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all";

  // Organize filtered banners by panelist for the grid
  const bannersByPanelist = new Map<string, GeneratedBanner[]>();
  for (const b of filteredBanners) {
    const arr = bannersByPanelist.get(b.panelistName) || [];
    arr.push(b);
    bannersByPanelist.set(b.panelistName, arr);
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: CREAM }}>
      {/* ===== TOP BAR ===== */}
      <header className="sticky top-0 z-50 bg-white" style={{ borderBottom: `2px solid ${WARM_BORDER}` }}>
        <div className="max-w-[1600px] mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-black">
                Panel Flyer Studio
              </h1>
              <p className="text-xs text-gray-400 mt-1">Paste a Drive URL, get banners</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Claude AI connection button */}
            <button
              onClick={() => setShowSettings(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all hover:scale-[1.02] ${
                claudeConnected
                  ? 'border-green-400 bg-green-50 text-green-700'
                  : claudeChecking
                    ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                    : 'border-black bg-white text-black animate-pulse'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${claudeConnected ? 'bg-green-500' : claudeChecking ? 'bg-yellow-400 animate-pulse' : 'bg-gray-400'}`} />
              {claudeConnected ? 'AI Connected' : claudeChecking ? 'AI Connecting...' : 'Connect AI'}
            </button>
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-black text-white"
            >
              <VerticalIcon id={selectedVertical} className="w-3.5 h-3.5" />
              {verticalConfig.name}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-8 py-10">

        {/* ===== MAIN CONTENT — Two column ===== */}
        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-8">

          {/* LEFT PANEL — Simplified Config */}
          <div className="space-y-5">

            {/* Section 1: Vertical Selector */}
            <div className="grid grid-cols-4 gap-3">
              {VERTICALS.map((v) => {
                const isSelected = selectedVertical === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => handleVerticalChange(v.id)}
                    className={`relative group flex flex-col items-center gap-2 px-4 py-5 rounded-2xl border-[2px] transition-all duration-200 ${
                      isSelected
                        ? 'scale-[1.02] shadow-sm'
                        : 'hover:shadow-sm opacity-70 hover:opacity-100'
                    }`}
                    style={isSelected ? {
                      borderColor: PINK,
                      background: PINK_LIGHT,
                      boxShadow: `0 0 0 3px ${PINK}20`,
                    } : {
                      borderColor: '#000',
                      background: '#fff',
                    }}
                  >
                    <span className="text-2xl">{VERTICAL_EMOJI[v.id]}</span>
                    <div className="text-center">
                      <div className={`text-sm font-bold ${isSelected ? 'text-black' : 'text-gray-600'}`}>
                        {v.shortName}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Section 2: Panelist Count Selector */}
            <div className="bg-white rounded-2xl p-5 border-[2px] border-black">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-bold text-black">Panelist Count</h3>
              </div>
              <div className="flex gap-2">
                {([2, 3, 4] as PanelistCount[]).map((count) => {
                  const isSelected = panelistCount === count;
                  return (
                    <button
                      key={count}
                      onClick={() => setPanelistCount(count)}
                      className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border-[2px] ${
                        isSelected
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black border-black hover:bg-gray-50'
                      }`}
                    >
                      {count} Panelists
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Drive Folder Import */}
            <div className="bg-white rounded-2xl p-5 border-[2px] border-black">
              <div className="flex items-center gap-2 mb-3">
                <FolderOpen className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-bold text-black">Google Drive Import</h3>
                {driveSignedIn && (
                  <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3" /> Connected
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <input
                  value={driveUrl}
                  onChange={(e) => { setDriveUrl(e.target.value); setDriveImported(false); }}
                  placeholder="Paste Google Drive Event Folder URL..."
                  className={inputClass}
                />

                {!driveSignedIn ? (
                  <button
                    onClick={handleDriveConnect}
                    className="w-full flex items-center justify-center gap-2 px-8 py-3 bg-black text-white text-sm rounded-full font-bold transition-all hover:opacity-80"
                  >
                    <Unplug className="w-4 h-4" />
                    Connect Google Drive
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleDriveImportAndGenerate}
                      disabled={driveLoading || !driveUrl}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-black text-sm rounded-full font-bold transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: PINK }}
                    >
                      {driveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                      {driveLoading ? 'Importing...' : 'Import & Generate'}
                    </button>
                    {claudeConnected && panelTopic && (
                      <button
                        onClick={handleAiEnhance}
                        disabled={aiEnhancing}
                        className="flex items-center justify-center gap-1.5 px-4 py-3 text-xs rounded-full font-bold border-2 border-black transition-all hover:opacity-80 disabled:opacity-40"
                        title="AI Enhance topic wording"
                      >
                        {aiEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                        AI
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Loading steps */}
              {driveStep && (
                <div className="mt-3 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                  <span className="text-xs text-gray-500">{driveStep}</span>
                </div>
              )}

              {/* Error */}
              {driveError && (
                <div className="mt-3 text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">
                  {driveError}
                  <button onClick={handleDriveConnect} className="ml-2 underline font-medium">
                    Reconnect
                  </button>
                </div>
              )}

              {/* Manual Entry fallback link */}
              {!showManualEntry && (
                <button
                  onClick={() => setShowManualEntry(true)}
                  className="mt-3 text-[11px] text-gray-400 hover:text-gray-600 underline transition-colors"
                >
                  Or enter details manually
                </button>
              )}
            </div>

            {/* Detected Data section moved to right panel */}

            {/* Manual Entry (collapsed by default, secondary flow) */}
            {showManualEntry && !driveImported && (
              <div className="bg-white rounded-2xl p-5 border-[2px] border-black space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileImage className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-bold text-black">Manual Entry</h3>
                  </div>
                  <button
                    onClick={() => setShowManualEntry(false)}
                    className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Panel Name</label>
                  <input value={panelName} onChange={(e) => setPanelName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Panel Topic</label>
                  <input value={panelTopic} onChange={(e) => setPanelTopic(e.target.value)} placeholder="e.g. Building a Thriving Practice" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Event Date</label>
                    <input value={eventDate} onChange={(e) => setEventDate(e.target.value)} placeholder="SUNDAY, MARCH 23, 2026" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Event Time</label>
                    <input value={eventTime} onChange={(e) => setEventTime(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Website URL</label>
                  <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className={inputClass} />
                </div>

                {/* Panelists */}
                <div className="pt-2 border-t-[2px] border-black">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-gray-700">Panelists ({panelists.length})</h4>
                    <button
                      onClick={addPanelist}
                      className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors hover:opacity-80"
                      style={{ color: '#000', background: PINK }}
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>

                  {panelists.length === 0 ? (
                    <button
                      onClick={addPanelist}
                      className="w-full flex items-center justify-center gap-1.5 py-3 text-xs font-semibold rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add First Panelist
                    </button>
                  ) : (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
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
                  disabled={panelists.length === 0 || !panelTopic || generating}
                  title="Generate banners (Ctrl+Enter)"
                  className="w-full flex items-center justify-center gap-2.5 px-8 py-3.5 bg-black text-white rounded-full text-sm font-bold transition-all duration-200 hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                  {generating
                    ? `Generating... ${Math.round(genProgress)}%`
                    : `Generate ${panelists.length * 5} Banners`
                  }
                </button>
              </div>
            )}

            {/* Section 5: Download buttons (when banners exist) */}
            {banners.length > 0 && (
              <div className="flex flex-col gap-2">
                {selectedBannerIds.size > 0 && (
                  <button
                    onClick={downloadSelectedBanners}
                    disabled={downloadingAll}
                    className="w-full flex items-center justify-center gap-2 px-8 py-3 rounded-full text-sm font-bold border-2 border-black text-white bg-black transition-all hover:opacity-80 hover:scale-[1.01] disabled:opacity-50"
                  >
                    {downloadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {downloadingAll ? 'Creating ZIP...' : `Download Selected (${selectedBannerIds.size}) as ZIP`}
                  </button>
                )}
                <button
                  onClick={downloadAllBanners}
                  disabled={downloadingAll}
                  className="w-full flex items-center justify-center gap-2 px-8 py-3 rounded-full text-sm font-bold border-2 border-black text-black bg-white transition-all hover:opacity-80 hover:scale-[1.01] disabled:opacity-50"
                >
                  {downloadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {downloadProgress
                    ? `Rendering ${downloadProgress.current}/${downloadProgress.total}...`
                    : downloadingAll ? 'Creating ZIP...' : `Download All (${filteredBanners.length}) as ZIP`
                  }
                </button>
              </div>
            )}
          </div>

          {/* RIGHT PANEL — Banner preview inline */}
          <div className="space-y-4">

            {/* Detected Data — editable, auto-syncs to banners */}
            {driveImported && panelists.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border-[2px] border-black">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" style={{ color: PINK }} />
                    <h3 className="text-sm font-bold text-black">Detected Data</h3>
                    <span className="text-[10px] text-gray-400">Press Enter to sync changes</span>
                  </div>
                  <button
                    onClick={() => setShowEditOverrides(!showEditOverrides)}
                    className="flex items-center gap-1 text-[11px] font-medium hover:underline transition-colors"
                    style={{ color: PINK }}
                  >
                    <Pencil className="w-3 h-3" />
                    {showEditOverrides ? 'Collapse' : 'Expand'}
                  </button>
                </div>

                {!showEditOverrides ? (
                  /* Compact view */
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                    <span className="text-gray-700"><span className="text-gray-400 font-medium">Header:</span> {headerText}</span>
                    <span className="text-gray-700"><span className="text-gray-400 font-medium">Event:</span> {panelName}</span>
                    <span className="text-gray-700"><span className="text-gray-400 font-medium">Topic:</span> {panelTopic}</span>
                    <span className="text-gray-700"><span className="text-gray-400 font-medium">Date:</span> {eventDate}</span>
                    <span className="text-gray-700"><span className="text-gray-400 font-medium">Time:</span> {eventTime}</span>
                    <div className="flex items-center gap-2">
                      {panelists.map((p) => (
                        <div key={p.id} className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-black">
                            {p.headshotUrl ? (
                              <img src={p.headshotUrl} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[7px] font-bold text-gray-400">{p.name[0] || '?'}</div>
                            )}
                          </div>
                          <span className="text-gray-500 text-[11px]">{p.firstName || p.name.split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Expanded edit view — horizontal layout */
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-medium text-gray-400 mb-0.5 block">Banner Header</label>
                      <input value={headerText} onChange={(e) => setHeaderText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && regenerateIfChanged()} onBlur={() => regenerateIfChanged()} placeholder="e.g. Veterinary Business Institute Expert Panel" className={inputClass + ' !text-xs !font-bold'} />
                    </div>
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] font-medium text-gray-400 mb-0.5 block">Panel Name</label>
                        <input value={panelName} onChange={(e) => setPanelName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && regenerateIfChanged()} onBlur={() => regenerateIfChanged()} className={inputClass + ' !text-xs'} />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-gray-400 mb-0.5 block">Panel Topic</label>
                        <input value={panelTopic} onChange={(e) => setPanelTopic(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && regenerateIfChanged()} onBlur={() => regenerateIfChanged()} className={inputClass + ' !text-xs'} />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-gray-400 mb-0.5 block">Event Date</label>
                        <input value={eventDate} onChange={(e) => setEventDate(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && regenerateIfChanged()} onBlur={() => regenerateIfChanged()} className={inputClass + ' !text-xs'} />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-gray-400 mb-0.5 block">Event Time</label>
                        <input value={eventTime} onChange={(e) => setEventTime(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && regenerateIfChanged()} onBlur={() => regenerateIfChanged()} className={inputClass + ' !text-xs'} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] font-medium text-gray-400 mb-0.5 block">Website URL</label>
                        <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && regenerateIfChanged()} onBlur={() => regenerateIfChanged()} className={inputClass + ' !text-xs'} />
                      </div>
                    </div>

                    {/* Per-panelist editing — horizontal cards */}
                    <div className="pt-3 border-t border-gray-200">
                      <h4 className="text-[10px] font-bold text-gray-400 mb-2">PANELISTS</h4>
                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                        {panelists.map((p, i) => (
                          <div key={p.id} className="flex gap-2.5 items-start bg-gray-50 rounded-xl p-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-[2px] border-black">
                              {p.headshotUrl ? (
                                <img src={p.headshotUrl} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-400">{p.name[0] || '?'}</div>
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <input
                                value={p.name}
                                onChange={(e) => updatePanelist(i, { ...p, name: e.target.value, firstName: e.target.value.replace(/^Dr\.?\s*/i, '').split(' ')[0] })}
                                onKeyDown={(e) => e.key === 'Enter' && regenerateIfChanged()}
                                onBlur={() => regenerateIfChanged()}
                                placeholder="Name"
                                className={inputClass + ' !text-[11px] !font-bold !py-1 !px-2'}
                              />
                              <input
                                value={p.title}
                                onChange={(e) => updatePanelist(i, { ...p, title: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && regenerateIfChanged()}
                                onBlur={() => regenerateIfChanged()}
                                placeholder="Title (e.g. Founder & CEO)"
                                className={inputClass + ' !text-[11px] !py-1 !px-2'}
                              />
                              <input
                                value={p.org}
                                onChange={(e) => updatePanelist(i, { ...p, org: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && regenerateIfChanged()}
                                onBlur={() => regenerateIfChanged()}
                                placeholder="Organization"
                                className={inputClass + ' !text-[11px] !py-1 !px-2'}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {banners.length === 0 ? (
              <div className="bg-white rounded-2xl border-[2px] border-black p-16 text-center">
                <div
                  className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6"
                  style={{ background: PINK_LIGHT }}
                >
                  <FileImage className="w-10 h-10" style={{ color: '#FF90E880' }} />
                </div>
                <h3 className="text-3xl font-black text-black mb-3">
                  No Banners Yet
                </h3>
                <p className="text-sm text-[#374151] max-w-md mx-auto leading-relaxed">
                  Select a vertical, choose panelist count, paste a Google Drive folder URL, and banners will appear here automatically.
                </p>
                <div className="mt-10 grid grid-cols-5 gap-3 max-w-lg mx-auto">
                  {['B1 — Intro', 'B2 — Panel 1', 'B3 — Panel 2', 'B4 — 1 More Day', 'B5 — Today!'].map((label) => (
                    <div
                      key={label}
                      className="aspect-square rounded-2xl flex items-center justify-center p-2 text-center bg-white border-[2px] border-black"
                    >
                      <span className="text-[9px] text-gray-400 font-semibold leading-tight">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border-[2px] border-black p-6">
                {/* Header with filters */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-bold text-black">Banner Preview</h3>
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: PINK_LIGHT, color: '#000' }}
                    >
                      {filteredBanners.length} of {banners.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={selectAllVisible}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border-2 border-black transition-all hover:bg-gray-50"
                    >
                      {filteredBanners.length > 0 && filteredBanners.every((b) => selectedBannerIds.has(b.id))
                        ? 'Deselect All'
                        : 'Select All'
                      }
                    </button>
                    {selectedBannerIds.size > 0 && (
                      <button
                        onClick={downloadSelectedBanners}
                        disabled={downloadingAll}
                        className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full text-white transition-all hover:opacity-80 disabled:opacity-50"
                        style={{ background: PINK }}
                      >
                        {downloadingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        Download Selected ({selectedBannerIds.size})
                      </button>
                    )}
                    <button
                      onClick={downloadAllBanners}
                      disabled={downloadingAll}
                      className="flex items-center gap-1.5 text-xs font-bold px-5 py-2.5 rounded-full bg-black text-white transition-all hover:opacity-80 disabled:opacity-50"
                    >
                      {downloadingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      Download All ZIP
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 flex-wrap mb-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Panelist:</label>
                    <select
                      value={selectedPanelistFilter}
                      onChange={(e) => { setSelectedPanelistFilter(e.target.value); setSelectedBannerIds(new Set()); }}
                      className="border-[2px] border-black rounded-full px-3 py-1.5 bg-white text-xs focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                    >
                      <option value="all">All ({banners.length})</option>
                      {uniquePanelistNames.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Type:</label>
                    <div className="flex gap-1">
                      {(['all', 'B1', 'B2', 'B3', 'B4', 'B5'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => { setSelectedBannerType(type); setSelectedBannerIds(new Set()); }}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border-[2px] ${
                            selectedBannerType === type
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-black border-black hover:bg-gray-50'
                          }`}
                        >
                          {type === 'all' ? 'All' : type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Theme:</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {BANNER_THEMES.map((theme) => (
                        <button
                          key={theme.id}
                          title={theme.name}
                          onClick={() => {
                            setSelectedTheme(theme);
                            if (banners.length > 0) {
                              setTimeout(() => generateAllBanners(), 0);
                            }
                          }}
                          className={`w-7 h-7 rounded-full border-2 transition-all flex-shrink-0 overflow-hidden ${
                            selectedTheme.id === theme.id
                              ? 'border-black ring-2 ring-black ring-offset-1 scale-110'
                              : 'border-gray-300 hover:border-gray-500 hover:scale-105'
                          }`}
                          style={{
                            background: `linear-gradient(135deg, ${theme.swatch[0]} 50%, ${theme.swatch[1]} 50%)`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Generation progress bar */}
                {generating && (
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-4">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${genProgress}%`, background: PINK }}
                    />
                  </div>
                )}

                {/* Banner grid */}
                <div className="overflow-x-auto">
                  <div className="grid gap-3" style={{ gridTemplateColumns: '120px repeat(5, 1fr)', minWidth: '700px' }}>
                    {/* Header row */}
                    <div /> {/* empty corner */}
                    {(['B1', 'B2', 'B3', 'B4', 'B5'] as const).map((type) => (
                      <div
                        key={type}
                        className="text-center text-[10px] font-bold uppercase tracking-wider text-gray-400 pb-2"
                      >
                        {type} {BANNER_TYPE_LABELS[type]}
                      </div>
                    ))}

                    {/* Panelist rows */}
                    {Array.from(bannersByPanelist.entries()).map(([panelistName, pBanners]) => {
                      const panelist = panelists.find((p) => p.name === panelistName);
                      const panelistIdx = panelists.findIndex((p) => p.name === panelistName);
                      return (
                        <div key={panelistName} className="contents">
                          {/* Row header */}
                          <div className="flex flex-col items-center gap-1.5 pr-2">
                            <div className="flex items-center gap-2 w-full">
                              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 border-black">
                                {panelist?.headshotUrl ? (
                                  <img src={panelist.headshotUrl} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                    {panelistName[0] || '?'}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-[11px] font-semibold text-black truncate max-w-[80px]">{panelistName}</div>
                              </div>
                            </div>
                            {/* QR Upload Button */}
                            <label
                              className="flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded-full cursor-pointer transition-all hover:opacity-80"
                              style={{ background: panelist?.qrCodes && Object.keys(panelist.qrCodes).length > 0 ? '#d4edda' : '#f0f0f0', color: panelist?.qrCodes && Object.keys(panelist.qrCodes).length > 0 ? '#155724' : '#666' }}
                            >
                              <QrCode className="w-3 h-3" />
                              {panelist?.qrCodes && Object.values(panelist.qrCodes).filter(Boolean).length > 0
                                ? `QR ${Object.values(panelist.qrCodes).filter(Boolean).length}/5`
                                : 'Upload QR'
                              }
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                  if (!e.target.files || panelistIdx === -1) return;
                                  const files = Array.from(e.target.files);
                                  const currentQr = { ...panelist?.qrCodes } as QrCodes;

                                  let processed = 0;
                                  const total = files.length;

                                  files.forEach((file) => {
                                    // Map filename to banner type: 1->B1, 2->B2, etc.
                                    const nameMatch = file.name.match(/^([1-5])/);
                                    if (!nameMatch) return;
                                    const bannerType = `B${nameMatch[1]}` as keyof QrCodes;

                                    const reader = new FileReader();
                                    reader.onload = () => {
                                      currentQr[bannerType] = reader.result as string;
                                      processed++;
                                      if (processed >= total) {
                                        updatePanelist(panelistIdx, { ...panelists[panelistIdx], qrCodes: { ...currentQr } });
                                        setTimeout(() => generateAllBanners(), 100);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  });
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          </div>

                          {/* Banner thumbnails */}
                          {(['B1', 'B2', 'B3', 'B4', 'B5'] as const).map((type) => {
                            const banner = pBanners.find((b) => b.type === type);
                            if (!banner) return <div key={type} />;
                            const globalIdx = banners.findIndex((b) => b.id === banner.id);
                            return (
                              <BannerThumbnail
                                key={banner.id}
                                banner={banner}
                                onClick={() => setModalBannerIndex(globalIdx)}
                                onDownload={() => downloadBanner(banner)}
                                onToggleSelect={() => toggleBannerSelection(banner.id)}
                                selected={selectedBannerIds.has(banner.id)}
                                visible={visibleBannerIds.has(banner.id)}
                                delay={0}
                              />
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="mt-16 py-8 border-t-[2px] border-black text-center">
        <p className="text-xs text-gray-400">
          Panel Flyer Studio &mdash; Built for{' '}
          <span style={{ color: PINK }}>{verticalConfig.name}</span>
          {' '}&amp; all verticals
        </p>
      </footer>

      {/* ===== SETTINGS MODAL ===== */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-2xl border-[2px] border-black p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-black">Connect AI</h2>
              <button onClick={() => setShowSettings(false)} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Connection status banner */}
            {claudeConnected && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-xs font-semibold text-green-700">
                  {cliConnected ? 'Connected via Claude Code CLI' : 'Connected via API Key'}
                </span>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSettingsTab('cli')}
                className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${
                  settingsTab === 'cli' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Claude Code (Recommended)
              </button>
              <button
                onClick={() => setSettingsTab('apikey')}
                className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${
                  settingsTab === 'apikey' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                API Key
              </button>
            </div>

            {/* CLI Tab */}
            {settingsTab === 'cli' && (
              <div className="space-y-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Use your Claude Code subscription — no API key needed. Make sure Claude Code is installed on your computer.
                </p>

                <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Install Claude Code</p>
                      <code className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded text-gray-600 mt-1 block">npm install -g @anthropic-ai/claude-code</code>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Run <code className="bg-gray-200 px-1 rounded text-[10px]">claude</code> in your terminal and complete login</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">3</div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Click "Check Connection" below to verify</p>
                    </div>
                  </div>
                </div>

                {/* CLI status */}
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${cliConnected ? 'bg-green-500' : claudeChecking ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'}`} />
                  <span className="text-xs text-gray-500">
                    {cliConnected ? 'Claude CLI connected and authenticated' : claudeChecking ? 'Checking...' : 'Not connected'}
                  </span>
                </div>

                <button
                  onClick={handleCheckCLIConnection}
                  disabled={claudeChecking}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border-2 border-black transition-all hover:opacity-80 disabled:opacity-40"
                >
                  {claudeChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  Check Connection
                </button>
              </div>
            )}

            {/* API Key Tab */}
            {settingsTab === 'apikey' && (
              <div className="space-y-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Connect your Anthropic API key as an alternative. Your key is stored locally in this browser only.
                </p>

                {/* API Key */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Anthropic API Key</label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={claudeKey}
                      onChange={(e) => { setClaudeKey(e.target.value); if (!cliConnected) setClaudeConnected(false); }}
                      placeholder="sk-ant-..."
                      className={inputClass + ' pr-10'}
                    />
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Model selector */}
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">Model</label>
                  <select
                    value={claudeModel}
                    onChange={(e) => setClaudeModel(e.target.value)}
                    className={inputClass}
                  >
                    <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                    <option value="claude-opus-4-0-20250514">Claude Opus 4</option>
                    <option value="claude-haiku-235-20250715">Claude Haiku 3.5</option>
                  </select>
                </div>

                {/* Connection status */}
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${claudeConnected && !cliConnected ? 'bg-green-500' : claudeKey ? 'bg-red-400' : 'bg-gray-300'}`} />
                  <span className="text-xs text-gray-500">
                    {claudeConnected && !cliConnected ? 'Connected via API key' : claudeKey ? 'Not verified' : 'No key set'}
                  </span>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={async () => {
                      if (!claudeKey) return;
                      setClaudeTesting(true);
                      const ok = await testClaudeConnection(claudeKey, claudeModel);
                      setClaudeConnected(ok);
                      setClaudeTesting(false);
                    }}
                    disabled={!claudeKey || claudeTesting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border-2 border-black transition-all hover:opacity-80 disabled:opacity-40"
                  >
                    {claudeTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    Test Connection
                  </button>
                  <button
                    onClick={async () => {
                      handleSaveClaudeSettings();
                      if (claudeKey) {
                        setClaudeTesting(true);
                        const ok = await testClaudeConnection(claudeKey, claudeModel);
                        setClaudeConnected(ok);
                        setClaudeTesting(false);
                      }
                      setShowSettings(false);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-full text-sm font-bold text-white bg-black transition-all hover:opacity-80"
                  >
                    Save & Connect
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== BANNER MODAL ===== */}
      {modalBannerIndex !== null && (
        <BannerModal
          banners={banners}
          currentIndex={modalBannerIndex}
          onClose={() => setModalBannerIndex(null)}
          onNavigate={setModalBannerIndex}
          onDownload={downloadBanner}
          downloading={downloading}
        />
      )}

    </div>
  );
}
