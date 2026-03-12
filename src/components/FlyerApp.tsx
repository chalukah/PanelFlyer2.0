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
} from 'lucide-react';
import {
  generateBannersForPanelist,
  type BannerData,
  type GeneratedBanner,
  type BannerType,
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
  type DriveFile,
} from '../utils/googleDrive';
import {
  parseEventFolder,
  extractPanelistsFromDoc,
  extractEventDetails,
} from '../utils/folderParser';
import html2canvas from 'html2canvas';
import { sendToClaudeAI, testClaudeConnection } from '../utils/claudeClient';

// ============================================================
// Types
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

// ============================================================
// Vertical icon helper
// ============================================================

function VerticalIcon({ id, className }: { id: VerticalId; className?: string }) {
  switch (id) {
    case 'vet':
      return <PawPrint className={className} />;
    case 'dental':
      return <Plus className={className} />;
    case 'law':
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
  dental: '🦷',
  law: '⚖️',
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
  visible,
  delay,
}: {
  banner: GeneratedBanner;
  onClick: () => void;
  onDownload: () => void;
  visible: boolean;
  delay: number;
}) {
  return (
    <div
      className="relative group cursor-pointer rounded-2xl overflow-hidden border-[2px] border-black transition-all duration-500 hover:shadow-md"

      style={{
        width: 180,
        height: 180,
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.85)',
        transitionDelay: `${delay}ms`,
      }}
      onClick={onClick}
    >
      {/* Scaled banner */}
      <div
        style={{
          width: 1080,
          height: 1080,
          transform: 'scale(0.1667)',
          transformOrigin: 'top left',
          pointerEvents: 'none',
        }}
        dangerouslySetInnerHTML={{ __html: banner.html }}
      />

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(); }}
            className="p-2 bg-white rounded-full hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>

      {/* Completion checkmark */}
      {visible && (
        <div
          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center animate-pulse"
          style={{ background: PINK, animationIterationCount: 2, animationDuration: '0.5s' }}
        >
          <Check className="w-3 h-3 text-black" />
        </div>
      )}
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
  if (!banner) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl max-w-[95vw] max-h-[95vh] overflow-auto p-6 border-[2px] border-black"
        style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
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

        {/* Banner */}
        <div className="overflow-auto rounded-2xl border-[2px] border-black" style={{ maxHeight: 'calc(95vh - 120px)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div
            style={{ width: 1080, height: 1080, transformOrigin: 'top left' }}
            dangerouslySetInnerHTML={{ __html: banner.html }}
          />
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

  // Modal
  const [modalBannerIndex, setModalBannerIndex] = useState<number | null>(null);

  // Google Drive import state
  const [driveUrl, setDriveUrl] = useState('');
  const [driveSignedIn, setDriveSignedIn] = useState(false);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveStep, setDriveStep] = useState('');
  const [driveError, setDriveError] = useState('');
  const [driveImported, setDriveImported] = useState(false);

  // UI toggles
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showEditOverrides, setShowEditOverrides] = useState(false);

  // Generation progress
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);

  // Claude AI settings
  const [showSettings, setShowSettings] = useState(false);
  const [claudeKey, setClaudeKey] = useState(() => localStorage.getItem('panel_flyer_claude_key') || '');
  const [claudeModel, setClaudeModel] = useState(() => localStorage.getItem('panel_flyer_claude_model') || 'claude-sonnet-4-20250514');
  const [claudeConnected, setClaudeConnected] = useState(false);
  const [claudeTesting, setClaudeTesting] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [aiEnhancing, setAiEnhancing] = useState(false);

  // Hidden render container
  const renderRef = useRef<HTMLDivElement>(null);

  // Handle vertical change
  const handleVerticalChange = (id: VerticalId) => {
    setSelectedVertical(id);
    const config = getVerticalConfig(id);
    setPanelName(config.panelNameDefault);
    setWebsiteUrl(config.websiteUrl);
    setBanners([]);
    setVisibleBannerIds(new Set());
  };

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

  // Generate all banners with staggered animation
  const generateAllBanners = useCallback(() => {
    if (panelists.length === 0) return;

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

    // Staggered reveal animation
    allBanners.forEach((b, i) => {
      setTimeout(() => {
        setVisibleBannerIds((prev) => new Set([...prev, b.id]));
        setGenProgress(((i + 1) / allBanners.length) * 100);
        if (i === allBanners.length - 1) setGenerating(false);
      }, 100 * i);
    });
  }, [panelists, panelName, panelTopic, eventDate, eventTime, websiteUrl, verticalConfig]);

  // Download single banner as PNG
  const downloadBanner = useCallback(async (banner: GeneratedBanner) => {
    setDownloading(banner.id);
    try {
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'fixed';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '1080px';
      tempDiv.style.height = '1080px';
      tempDiv.innerHTML = banner.html;
      document.body.appendChild(tempDiv);

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

  // Filter banners
  const filteredBanners = banners.filter((b) => {
    if (selectedPanelistFilter !== 'all' && b.panelistName !== selectedPanelistFilter) return false;
    if (selectedBannerType !== 'all' && b.type !== selectedBannerType) return false;
    return true;
  });

  // Download all filtered banners
  const downloadAllBanners = useCallback(async () => {
    setDownloadingAll(true);
    for (const banner of filteredBanners) {
      await downloadBanner(banner);
      await new Promise((r) => setTimeout(r, 300));
    }
    setDownloadingAll(false);
  }, [filteredBanners, downloadBanner]);

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

    try {
      // Step 1: Read folder
      setDriveStep('Reading folder...');
      const files = await listFolderContents(folderId);

      let folderName = 'Event';
      try {
        const folderMeta = files.length > 0 ? files[0] : null;
        folderName = folderId;
      } catch {
        // ignore
      }

      const parsed = parseEventFolder(files, folderName);

      // Step 2: Read Partner Details doc
      let docText = '';
      if (parsed.partnerDetailsDocId) {
        setDriveStep('Found Partner Details doc...');
        docText = await readGoogleDoc(parsed.partnerDetailsDocId);
      }

      // Step 3: Extract panelists
      setDriveStep('Extracting panelist info...');
      const parsedPanelists = extractPanelistsFromDoc(docText);
      const eventDetails = extractEventDetails(docText, parsed.folderName);

      // Step 4: Download headshots
      const headshotMap = new Map<string, string>();
      if (parsed.headhotsFolderId) {
        setDriveStep('Downloading headshots...');
        const headshotFiles = await listFolderContents(parsed.headhotsFolderId);
        const imageFiles = headshotFiles.filter((f) =>
          f.mimeType.startsWith('image/'),
        );

        for (const img of imageFiles) {
          try {
            const dataUrl = await getFileAsDataUrl(img.id);
            const imgNameLower = img.name.toLowerCase();
            for (const p of parsedPanelists) {
              const firstLower = p.firstName.toLowerCase();
              const lastLower = p.name.split(' ').slice(-1)[0]?.toLowerCase() || '';
              if (imgNameLower.includes(firstLower) || imgNameLower.includes(lastLower)) {
                headshotMap.set(p.name, dataUrl);
                break;
              }
            }
            if (!headshotMap.has(img.name)) {
              headshotMap.set(img.name, dataUrl);
            }
          } catch {
            // skip failed downloads
          }
        }
      }

      // Step 5: Auto-fill internal state
      setDriveStep('Auto-filling data...');

      if (eventDetails.panelName && eventDetails.panelName !== folderId) {
        setPanelName(eventDetails.panelName);
      }
      if (eventDetails.panelTopic) setPanelTopic(eventDetails.panelTopic);
      if (eventDetails.eventDate) setEventDate(eventDetails.eventDate);

      // Build panelist form data
      let newPanelists: PanelistFormData[] = parsedPanelists.map((p) => ({
        id: crypto.randomUUID(),
        name: p.name,
        firstName: p.firstName,
        title: p.title,
        org: p.org,
        headshotUrl: headshotMap.get(p.name) || '',
        zoomUrl: '',
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

      // Auto-generate banners after import
      setTimeout(() => {
        setDriveStep('');
      }, 0);

    } catch (err: unknown) {
      setDriveError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setDriveLoading(false);
      setDriveStep('');
    }
  };

  // Auto-generate banners when import completes
  useEffect(() => {
    if (driveImported && panelists.length > 0 && banners.length === 0) {
      generateAllBanners();
    }
  }, [driveImported, panelists, banners.length, generateAllBanners]);

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

  const handleTestConnection = async () => {
    if (!claudeKey) return;
    setClaudeTesting(true);
    const ok = await testClaudeConnection(claudeKey, claudeModel);
    setClaudeConnected(ok);
    setClaudeTesting(false);
  };

  const handleAiEnhance = async () => {
    if (!claudeKey || !panelTopic) return;
    setAiEnhancing(true);
    try {
      const result = await sendToClaudeAI(
        claudeKey,
        `You are a marketing copywriter for professional industry panels. Improve this panel topic/title to be more compelling and engaging while keeping the same meaning. Return ONLY the improved title, nothing else.\n\nOriginal: ${panelTopic}`,
        claudeModel,
      );
      setPanelTopic(result.trim());
    } catch (err) {
      console.error('AI enhance failed:', err);
    } finally {
      setAiEnhancing(false);
    }
  };

  // Input class helper
  const inputClass = "w-full px-3 py-2.5 rounded-lg border-[2px] border-black bg-white text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all";

  // Organize banners by panelist for the grid
  const bannersByPanelist = new Map<string, GeneratedBanner[]>();
  for (const b of banners) {
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
            {/* Claude AI status dot */}
            <div className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${claudeConnected ? 'bg-green-500' : claudeKey ? 'bg-yellow-400' : 'bg-gray-300'}`} />
              <span className="text-[10px] text-gray-400 font-medium">AI</span>
            </div>
            {/* Settings gear */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-500" />
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
                    {claudeKey && panelTopic && (
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

            {/* Section 4: Auto-Detected Data Summary (read-only, shown after import) */}
            {driveImported && panelists.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border-[2px] border-black">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" style={{ color: PINK }} />
                    <h3 className="text-sm font-bold text-black">Detected Data</h3>
                  </div>
                  <button
                    onClick={() => setShowEditOverrides(!showEditOverrides)}
                    className="flex items-center gap-1 text-[11px] font-medium hover:underline transition-colors"
                    style={{ color: PINK }}
                  >
                    <Pencil className="w-3 h-3" />
                    {showEditOverrides ? 'Hide' : 'Edit'}
                  </button>
                </div>

                {/* Read-only summary */}
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="text-gray-400 text-xs font-medium min-w-[60px]">Event</span>
                    <span className="text-gray-700 text-xs">{panelName}{panelTopic ? ` — ${panelTopic}` : ''}</span>
                  </div>
                  {eventDate && (
                    <div className="flex gap-2">
                      <span className="text-gray-400 text-xs font-medium min-w-[60px]">Date</span>
                      <span className="text-gray-700 text-xs">{eventDate} &middot; {eventTime}</span>
                    </div>
                  )}
                  <div className="flex gap-2 items-start">
                    <span className="text-gray-400 text-xs font-medium min-w-[60px]">Panelists</span>
                    <div className="flex flex-wrap gap-2">
                      {panelists.map((p) => (
                        <div key={p.id} className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border-[2px] border-black">
                            {p.headshotUrl ? (
                              <img src={p.headshotUrl} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-400">
                                {p.name[0] || '?'}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-gray-600">{p.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Editable overrides (hidden by default) */}
                {showEditOverrides && (
                  <div className="mt-4 pt-4 border-t-[2px] border-black space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Panel Name</label>
                      <input value={panelName} onChange={(e) => setPanelName(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Panel Topic</label>
                      <input value={panelTopic} onChange={(e) => setPanelTopic(e.target.value)} className={inputClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Event Date</label>
                        <input value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inputClass} />
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
                    <button
                      onClick={generateAllBanners}
                      disabled={panelists.length === 0 || generating}
                      className="w-full flex items-center justify-center gap-2 px-8 py-3 bg-black text-white text-xs rounded-full font-bold transition-all hover:opacity-80 disabled:opacity-40"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Regenerate Banners
                    </button>
                  </div>
                )}
              </div>
            )}

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

            {/* Section 5: Download All (when banners exist) */}
            {banners.length > 0 && (
              <button
                onClick={downloadAllBanners}
                disabled={downloadingAll}
                className="w-full flex items-center justify-center gap-2 px-8 py-3 rounded-full text-sm font-bold border-2 border-black text-black bg-white transition-all hover:opacity-80 hover:scale-[1.01] disabled:opacity-50"
              >
                {downloadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {downloadingAll ? 'Downloading...' : `Download All (${filteredBanners.length} banners)`}
              </button>
            )}
          </div>

          {/* RIGHT PANEL — Quick preview (empty state or filters) */}
          <div className="space-y-4">
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
              <>
                {/* Filters bar */}
                <div className="bg-white rounded-2xl border-[2px] border-black p-4 flex items-center gap-4 flex-wrap">
                  {/* Panelist filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Panelist:</label>
                    <select
                      value={selectedPanelistFilter}
                      onChange={(e) => setSelectedPanelistFilter(e.target.value)}
                      className="border-[2px] border-black rounded-full px-3 py-1.5 bg-white text-xs focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                    >
                      <option value="all">All ({banners.length})</option>
                      {uniquePanelistNames.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Banner type pills */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Type:</label>
                    <div className="flex gap-1">
                      {(['all', 'B1', 'B2', 'B3', 'B4', 'B5'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setSelectedBannerType(type)}
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

                  <div className="ml-auto">
                    <div
                      className="text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: PINK_LIGHT, color: '#000' }}
                    >
                      {filteredBanners.length} of {banners.length}
                    </div>
                  </div>
                </div>

                {/* Generation progress bar */}
                {generating && (
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${genProgress}%`, background: PINK }}
                    />
                  </div>
                )}

                {/* Quick stats */}
                <div className="text-xs text-gray-400 px-1">
                  {uniquePanelistNames.length} panelist{uniquePanelistNames.length !== 1 ? 's' : ''} &middot; {banners.length} banners generated
                </div>
              </>
            )}
          </div>
        </div>

        {/* ===== LIVE BANNER PREVIEW GRID ===== */}
        {banners.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-2xl border-[2px] border-black p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-bold text-black">
                    Banner Preview
                  </h3>
                  <span
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ background: PINK_LIGHT, color: '#000' }}
                  >
                    {banners.length}
                  </span>
                </div>

                <button
                  onClick={downloadAllBanners}
                  disabled={downloadingAll}
                  className="flex items-center gap-1.5 text-xs font-bold px-5 py-2.5 rounded-full bg-black text-white transition-all hover:opacity-80 disabled:opacity-50"
                >
                  {downloadingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Download All
                </button>
              </div>

              {/* Grid header */}
              <div className="grid gap-3" style={{ gridTemplateColumns: '140px repeat(5, 180px)' }}>
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
                  return (
                    <div key={panelistName} className="contents">
                      {/* Row header */}
                      <div className="flex items-center gap-2 pr-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-black">
                          {panelist?.headshotUrl ? (
                            <img src={panelist.headshotUrl} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                              {panelistName[0] || '?'}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-black truncate">{panelistName}</div>
                          {panelist?.title && (
                            <div className="text-[10px] text-gray-400 truncate">{panelist.title}</div>
                          )}
                        </div>
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
              <h2 className="text-lg font-black text-black">Claude AI Settings</h2>
              <button onClick={() => setShowSettings(false)} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* API Key */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Claude API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={claudeKey}
                    onChange={(e) => { setClaudeKey(e.target.value); setClaudeConnected(false); }}
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
                <div className={`w-2.5 h-2.5 rounded-full ${claudeConnected ? 'bg-green-500' : claudeKey ? 'bg-red-400' : 'bg-gray-300'}`} />
                <span className="text-xs text-gray-500">
                  {claudeConnected ? 'Connected' : claudeKey ? 'Not verified' : 'No key set'}
                </span>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleTestConnection}
                  disabled={!claudeKey || claudeTesting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border-2 border-black transition-all hover:opacity-80 disabled:opacity-40"
                >
                  {claudeTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  Test Connection
                </button>
                <button
                  onClick={() => { handleSaveClaudeSettings(); setShowSettings(false); }}
                  className="flex-1 px-4 py-2.5 rounded-full text-sm font-bold text-white bg-black transition-all hover:opacity-80"
                >
                  Save
                </button>
              </div>
            </div>
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

      {/* Hidden render container for html2canvas */}
      <div ref={renderRef} style={{ position: 'fixed', left: '-9999px', top: 0 }} />
    </div>
  );
}
