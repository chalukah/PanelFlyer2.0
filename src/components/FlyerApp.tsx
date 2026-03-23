import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Download,
  Plus,
  RefreshCw,
  Image,
  Loader2,
  FileImage,
  Wand2,
  X,
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
  Moon,
  Sun,
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
import { checkGogStatus, gogListFolder, gogExportDoc, gogDownloadFile, gogExtractFolder } from '../utils/gogClient';

import JSZip from 'jszip';
import { sendToClaudeAI, testClaudeConnection, sendToClaudeCLI, checkClaudeCLIStatus } from '../utils/claudeClient';
import { checkAIStatus as checkUnifiedAIStatus, generateText, setApiKey, getApiKey as getStoredApiKey } from '../utils/aiService';
import { parseSpreadsheet, csvRowsToPanelists } from '../utils/fileImport';

import { validateExtraction } from '../utils/schemas';
import { FileUp, Undo2, Redo2 } from 'lucide-react';

// Extracted helper components
import {
  type QrCodes,
  type PanelistFormData,
  type PanelistCount,
  PINK,
  PINK_LIGHT,
  CREAM,
  DARK_BG,
  DARK_SURFACE,
  DARK_BORDER,
  WARM_BORDER,
  VERTICAL_COLORS,
  BANNER_TYPE_LABELS,
  injectAnimationStyles,
} from './flyer/constants';
import { VerticalIcon, VERTICAL_EMOJI } from './flyer/VerticalIcon';
import { PanelistRow } from './flyer/PanelistRow';
import { BannerThumbnail } from './flyer/BannerThumbnail';
import { BannerModal } from './flyer/BannerModal';

// ============================================================
// Main FlyerApp
// ============================================================

export default function FlyerApp() {
  // Inject CSS animations once
  useEffect(() => { injectAnimationStyles(); }, []);

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('panel_dark_mode') === 'true'; } catch { return false; }
  });
  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      try { localStorage.setItem('panel_dark_mode', String(next)); } catch {}
      return next;
    });
  };

  // Theme-aware colors
  const bg = darkMode ? DARK_BG : CREAM;
  const surface = darkMode ? DARK_SURFACE : '#ffffff';
  const border = darkMode ? DARK_BORDER : '#000000';
  const textPrimary = darkMode ? '#f0f0f0' : '#000000';
  const textSecondary = darkMode ? '#999999' : '#6B7280';
  const inputBg = darkMode ? '#252525' : '#ffffff';
  const inputBorder = darkMode ? '#444444' : '#000000';

  // Vertical selection
  const [selectedVertical, setSelectedVertical] = useState<VerticalId>('vet');
  const [userPickedVertical, setUserPickedVertical] = useState(false); // tracks if user manually chose a vertical
  const verticalConfig = getVerticalConfig(selectedVertical);
  const vColors = VERTICAL_COLORS[selectedVertical];

  // Panelist count
  const [panelistCount, setPanelistCount] = useState<PanelistCount>(3);

  // Internal form state (populated by Drive import or manual entry)
  const [headerText, setHeaderText] = useState('Veterinary Business Institute Expert Panel');
  const [selectedTheme, setSelectedTheme] = useState<BannerTheme>(BANNER_THEMES[0]);
  const [panelName, setPanelName] = useState(verticalConfig.panelNameDefault);
  const [panelTopic, setPanelTopic] = useState('');
  const [panelSubtitle, setPanelSubtitle] = useState('');
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

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), type === 'error' ? 6000 : 4000);
  }, []);

  // UI toggles
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showEditOverrides, setShowEditOverrides] = useState(false);

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

  // Check AI status on app load (unified: CLI → SDK fallback)
  useEffect(() => {
    setClaudeChecking(true);
    checkUnifiedAIStatus(true).then(status => {
      setCliConnected(status.cliConnected);
      setClaudeConnected(status.mode !== 'none');
    }).catch(err => {
      console.error('[AI status check failed]', err);
    }).finally(() => {
      setClaudeChecking(false);
    });
  }, []);

  // Handle vertical change (called by user click or auto-detect)
  const handleVerticalChange = (id: VerticalId, isUserAction = false) => {
    if (isUserAction) setUserPickedVertical(true);
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
      panelists.forEach((p, i) => {
        if (!p.name.trim()) {
          setPanelists(prev => prev.map((pp, idx) => idx === i ? { ...pp, name: `Panelist ${i + 1}`, firstName: 'Panelist' } : pp));
        }
      });
    }

    // Warn about missing data (non-blocking)
    const warnings: string[] = [];
    const noHeadshot = panelists.filter(p => !p.headshotUrl);
    const noTitle = panelists.filter(p => !p.title.trim());
    const noQR = panelists.filter(p => Object.values(p.qrCodes).filter(Boolean).length === 0);
    if (noHeadshot.length > 0) warnings.push(`${noHeadshot.length} missing headshot${noHeadshot.length > 1 ? 's' : ''}`);
    if (noTitle.length > 0) warnings.push(`${noTitle.length} missing title${noTitle.length > 1 ? 's' : ''}`);
    if (noQR.length > 0) warnings.push(`${noQR.length} missing QR codes`);
    if (warnings.length > 0) showToast(`Generating with: ${warnings.join(', ')}`, 'warning');

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
        panelSubtitle,
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
  }, [panelists, headerText, panelName, panelTopic, panelSubtitle, eventDate, eventTime, websiteUrl, verticalConfig, selectedTheme]);

  // Track last-generated state to avoid unnecessary regeneration on blur
  const lastGenSnapshot = useRef('');
  const getDataSnapshot = useCallback(() => {
    return JSON.stringify({ headerText, panelName, panelTopic, panelSubtitle, eventDate, eventTime, websiteUrl, panelists: panelists.map(p => ({ name: p.name, title: p.title, org: p.org })) });
  }, [headerText, panelName, panelTopic, panelSubtitle, eventDate, eventTime, websiteUrl, panelists]);

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

  // Render a banner to image blob via Puppeteer server (pixel-perfect)
  const renderBannerToBlob = useCallback(async (banner: GeneratedBanner): Promise<Blob> => {
    const resp = await fetch('http://localhost:3002/api/render-png', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: banner.html, format: 'jpeg', quality: 80 }),
    });
    if (!resp.ok) throw new Error(`Render server error: ${resp.status}`);
    return await resp.blob();
  }, []);

  // Download single banner as image directly
  const downloadBanner = useCallback(async (banner: GeneratedBanner) => {
    setDownloading(banner.id);
    try {
      const imgBlob = await renderBannerToBlob(banner);
      const safeName = banner.fileName.replace(/[<>:"/\\|?*]/g, '_');
      const link = document.createElement('a');
      link.download = `${safeName}.jpg`;
      link.href = URL.createObjectURL(imgBlob);
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Failed to export banner:', err);
      showToast('Download failed — make sure the app was started with "npm run dev"', 'error');
    }
    setDownloading(null);
  }, [renderBannerToBlob]);

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

  // Download a set of banners as ZIP — organized by panelist folders
  const downloadBannersAsZip = useCallback(async (bannersToZip: GeneratedBanner[], zipLabel?: string) => {
    if (bannersToZip.length === 0) return;
    setDownloadingAll(true);
    try {
      const totalBanners = bannersToZip.length;

      // Phase 1: Render each banner one-by-one via Puppeteer
      const rendered: { safeName: string; panelistFolder: string; data: Uint8Array }[] = [];
      for (let i = 0; i < totalBanners; i++) {
        setDownloadProgress({ current: i + 1, total: totalBanners });
        const banner = bannersToZip[i];
        const blob = await renderBannerToBlob(banner);
        const buf = await blob.arrayBuffer();
        rendered.push({
          safeName: banner.fileName.replace(/[<>:"/\\|?*]/g, '_'),
          panelistFolder: banner.panelistName.replace(/[<>:"/\\|?*]/g, '_'),
          data: new Uint8Array(buf),
        });
      }

      // Phase 2: Build ZIP
      setDownloadProgress(null);
      console.log('Building ZIP with', rendered.length, 'images...');
      const zip = new JSZip();
      for (const item of rendered) {
        const folder = zip.folder(item.panelistFolder)!;
        folder.file(`${item.safeName}.jpg`, item.data, { binary: true });
      }

      console.log('Generating ZIP blob...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      console.log('ZIP blob size:', zipBlob.size);

      // Phase 3: Trigger download
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${zipLabel || panelName || 'banners'}.zip`;
      document.body.appendChild(a);
      a.click();
      // Clean up after a delay
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 5000);

      showToast(`Downloaded ${rendered.length} banners as ZIP`, 'success');
    } catch (err) {
      console.error('Failed to create zip:', err);
      showToast(`ZIP failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
    setDownloadingAll(false);
    setDownloadProgress(null);
  }, [renderBannerToBlob, panelName, showToast]);

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
      // Check if server-side gog CLI is available (better for folder name parsing)
      const useGog = await checkGogStatus();

      // === GOG: get folder name for topic/subtitle extraction ===
      let gogTopicData: { panelName?: string; panelTopic?: string; panelSubtitle?: string; eventDate?: string; eventTime?: string; websiteUrl?: string; headerText?: string; zoomRegistrationUrl?: string } = {};
      if (useGog) {
        try {
          setDriveStep('Reading folder metadata via gog + AI...');
          const result = await gogExtractFolder(folderId);
          console.log('[gog extract result]', JSON.stringify({
            panelTopic: result.panelTopic,
            panelSubtitle: result.panelSubtitle,
            panelName: result.panelName,
            panelists: result.panelists?.map(p => ({ name: p.name, title: p.title, org: p.org })),
          }, null, 2));
          if (result.success) {
            gogTopicData = {
              panelName: result.panelName,
              panelTopic: result.panelTopic,
              panelSubtitle: result.panelSubtitle,
              eventDate: result.eventDate,
              eventTime: result.eventTime,
              websiteUrl: result.websiteUrl,
              headerText: result.headerText,
              zoomRegistrationUrl: result.zoomRegistrationUrl,
            };
          }
        } catch (gogErr) {
          console.warn('gog extraction failed, continuing with legacy flow:', gogErr);
        }
      }

      // === MAIN FLOW: browser-side Google API (reads doc tabs for panelist title/org) ===

      // Step 1: Read folder
      setDriveStep(useGog ? 'Reading folder (via gog)...' : 'Reading folder...');
      let files: DriveFile[];
      if (useGog) {
        const gogFiles = await gogListFolder(folderId);
        files = gogFiles.map(f => ({ id: f.id, name: f.name, mimeType: f.mimeType, parents: f.parents }));
      } else {
        files = await listFolderContents(folderId);
      }

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

      // Helper: read a Google Doc (tries gog first for better tab support)
      const readDoc = async (docId: string): Promise<string> => {
        if (useGog) {
          try { return await gogExportDoc(docId); } catch { /* fall through */ }
        }
        return readGoogleDoc(docId);
      };

      if (parsed.partnerDetailsDocId) {
        setDriveStep(useGog ? 'Reading Partner Details (via gog)...' : 'Reading Partner Details doc...');
        docText = await readDoc(parsed.partnerDetailsDocId);
      }

      // Also read promotional materials docs — they often contain bios with titles/credentials/orgs
      if (parsed.promoDocIds && parsed.promoDocIds.length > 0) {
        setDriveStep('Reading Promotional Materials...');
        for (const promoId of parsed.promoDocIds) {
          try {
            const promoText = await readDoc(promoId);
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

      // Only auto-switch vertical if user hasn't manually selected one
      if (detectedVertical && detectedVertical !== selectedVertical && !userPickedVertical) {
        handleVerticalChange(detectedVertical);
        // Re-apply gog data that handleVerticalChange may have overwritten
        if (gogTopicData.panelName) setPanelName(gogTopicData.panelName);
        if (gogTopicData.websiteUrl) setWebsiteUrl(gogTopicData.websiteUrl);
        if (gogTopicData.headerText) setHeaderText(gogTopicData.headerText);
      }

      // Step 4: Download headshots — check headshots folder, then root images
      const headshotMap = new Map<string, string>();
      let imageFiles: DriveFile[] = [];

      // Helper: list subfolder contents (tries gog first)
      const listSubfolder = async (id: string): Promise<DriveFile[]> => {
        if (useGog) {
          try {
            const gogFiles = await gogListFolder(id);
            return gogFiles.map(f => ({ id: f.id, name: f.name, mimeType: f.mimeType, parents: f.parents }));
          } catch { /* fall through */ }
        }
        return listFolderContents(id);
      };

      if (parsed.headhotsFolderId) {
        setDriveStep('Downloading headshots...');
        const headshotFiles = await listSubfolder(parsed.headhotsFolderId);
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
          const subFiles = await listSubfolder(parsed.bannersFolderId);
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

      // Helper: download image as data URL with retry (tries gog first, then Drive API)
      const downloadImage = async (fileId: string, retries = 3): Promise<string> => {
        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            let dataUrl: string;
            if (useGog) {
              try {
                const result = await gogDownloadFile(fileId);
                dataUrl = result.dataUrl;
              } catch {
                dataUrl = await getFileAsDataUrl(fileId);
              }
            } else {
              dataUrl = await getFileAsDataUrl(fileId);
            }
            // Validate: must be a real data URL with actual content
            if (dataUrl && dataUrl.startsWith('data:image/') && dataUrl.length > 200) {
              return dataUrl;
            }
            throw new Error('Invalid image data');
          } catch (err) {
            if (attempt === retries) throw err;
            await new Promise((r) => setTimeout(r, 500 * attempt)); // backoff
          }
        }
        throw new Error('Download failed after retries');
      };

      for (const img of imageFiles) {
        try {
          const dataUrl = await downloadImage(img.id);
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

      // Step 4b: Download QR codes from QR Codes folder
      // Structure: QR Codes / <Panelist Name> / 1.png, 2.png, 3.png, 4.png, 5.png
      const qrCodesMap = new Map<string, QrCodes>(); // panelist name -> QR codes

      if (parsed.qrCodesFolderId) {
        setDriveStep('Downloading QR codes...');
        try {
          // List panelist subfolders inside QR Codes folder
          const qrSubfolders = await listSubfolder(parsed.qrCodesFolderId);
          const qrFolders = qrSubfolders.filter(f => f.mimeType === 'application/vnd.google-apps.folder');

          for (const qrFolder of qrFolders) {
            // Match folder name to panelist
            const qrFolderLower = qrFolder.name.toLowerCase();
            const matchedPanelist = parsedPanelists.find(p => {
              const lastName = p.name.split(/[\s,]+/).filter(w => w.length > 2 && !/^(dr|dvm|dds|jd|md|phd|mba|cpa)$/i.test(w)).pop()?.toLowerCase() || '';
              const firstName = (p.firstName || '').replace(/^Dr\.?\s*/i, '').toLowerCase();
              return (lastName.length > 2 && qrFolderLower.includes(lastName)) ||
                     (firstName.length > 2 && qrFolderLower.includes(firstName)) ||
                     qrFolderLower === p.name.toLowerCase();
            });

            if (!matchedPanelist) continue;

            // List QR images inside this panelist's folder
            try {
              const qrFiles = await listSubfolder(qrFolder.id);
              const qrImages = qrFiles.filter(f => f.mimeType.startsWith('image/'));
              const panelistQr: QrCodes = {};

              for (const qrImg of qrImages) {
                // Match the trailing number before extension: "...N1.png" → 1, "...N5.png" → 5
                // Pattern: QR_https___go.veterinarybusinesinstitute.com_VETMar02DMLDN1.png
                const trailingNum = qrImg.name.match(/(\d)(?:\.[^.]+)?$/);
                const bMatch = qrImg.name.match(/B([1-5])/i);
                const plainMatch = qrImg.name.match(/(?:^|[_\-\s])([1-5])(?:\.|[_\-\s]|$)/);
                const num = trailingNum ? trailingNum[1] : bMatch ? bMatch[1] : plainMatch ? plainMatch[1] : null;

                if (num && parseInt(num) >= 1 && parseInt(num) <= 5) {
                  const bannerType = `B${num}` as keyof QrCodes;
                  if (!panelistQr[bannerType]) {
                    try {
                      const dataUrl = await downloadImage(qrImg.id);
                      panelistQr[bannerType] = dataUrl;
                    } catch { /* skip */ }
                  }
                }
              }

              // Fallback: if no numbers detected, assign sequentially by sorted filename
              if (Object.keys(panelistQr).length === 0 && qrImages.length >= 5) {
                const sorted = [...qrImages].sort((a, b) => a.name.localeCompare(b.name));
                for (let i = 0; i < Math.min(sorted.length, 5); i++) {
                  const bannerType = `B${i + 1}` as keyof QrCodes;
                  try {
                    const dataUrl = await downloadImage(sorted[i].id);
                    panelistQr[bannerType] = dataUrl;
                  } catch { /* skip */ }
                }
              }

              if (Object.keys(panelistQr).length > 0) {
                qrCodesMap.set(matchedPanelist.name, panelistQr);
              }
            } catch { /* skip unreadable QR subfolder */ }
          }
        } catch {
          // QR codes folder not readable, skip
        }
      }

      // Step 5: Auto-fill internal state — gog data takes priority over legacy regex
      setDriveStep('Auto-filling data...');

      // Panel name: gog (from folder name) > legacy regex
      const finalPanelName = gogTopicData.panelName || (eventDetails.panelName && eventDetails.panelName !== folderId ? eventDetails.panelName : '');
      if (finalPanelName) setPanelName(finalPanelName);

      // Topic & subtitle: gog (from folder name parsing) > legacy regex
      const finalTopic = gogTopicData.panelTopic || eventDetails.panelTopic || '';
      if (finalTopic) setPanelTopic(finalTopic);
      if (gogTopicData.panelSubtitle) setPanelSubtitle(gogTopicData.panelSubtitle);

      // Other fields: gog > legacy
      const finalDate = gogTopicData.eventDate || eventDetails.eventDate || '';
      const finalTime = gogTopicData.eventTime || eventDetails.eventTime || '';
      const finalWebsite = gogTopicData.websiteUrl || eventDetails.websiteUrl || '';
      if (finalDate) setEventDate(finalDate);
      if (finalTime) setEventTime(finalTime);
      if (finalWebsite) setWebsiteUrl(finalWebsite);
      if (gogTopicData.headerText) setHeaderText(gogTopicData.headerText);

      // Build panelist form data — QR codes from Drive folder, or empty
      const zoomUrl = gogTopicData.zoomRegistrationUrl || eventDetails.zoomRegistrationUrl || '';

      let newPanelists: PanelistFormData[] = parsedPanelists.map((p) => ({
        id: crypto.randomUUID(),
        name: p.name,
        firstName: p.firstName,
        title: p.title,
        org: p.org,
        headshotUrl: headshotMap.get(p.name) || '',
        zoomUrl: zoomUrl,
        qrCodes: qrCodesMap.get(p.name) || {},
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

      // Warn about missing data
      const missingHeadshots = newPanelists.filter(p => !p.headshotUrl).map(p => p.name || 'Unknown');
      const missingQR = newPanelists.filter(p => Object.values(p.qrCodes).filter(Boolean).length === 0).map(p => p.name || 'Unknown');
      if (missingHeadshots.length > 0) showToast(`Missing headshots: ${missingHeadshots.join(', ')}`, 'warning');
      else if (missingQR.length > 0) showToast(`Missing QR codes: ${missingQR.join(', ')}`, 'warning');
      else showToast(`Imported ${newPanelists.length} panelists successfully`, 'success');

      // Trigger banner regeneration after state has settled
      setTimeout(() => {
        setImportGenToken((t) => t + 1);
      }, 100);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      if (msg === 'GOOGLE_AUTH_EXPIRED') {
        clearStoredToken();
        setDriveSignedIn(false);
        setDriveError('Google session expired. Please reconnect and try again.');
        showToast('Google session expired — please reconnect', 'error');
      } else {
        setDriveError(msg);
        showToast(`Import failed: ${msg}`, 'error');
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
    setApiKey(claudeKey); // Uses unified aiService (localStorage + Supabase if available)
    localStorage.setItem('panel_flyer_claude_model', claudeModel);
  };

  const handleCheckCLIConnection = async () => {
    setClaudeChecking(true);
    const status = await checkUnifiedAIStatus(true);
    setCliConnected(status.cliConnected);
    setClaudeConnected(status.mode !== 'none');
    setClaudeChecking(false);
    return status.cliConnected;
  };

  const handleTestConnection = async () => {
    setClaudeTesting(true);
    const status = await checkUnifiedAIStatus(true);
    setCliConnected(status.cliConnected);
    setClaudeConnected(status.mode !== 'none');
    setClaudeTesting(false);
  };

  const handleAiEnhance = async () => {
    if (!panelTopic) return;
    setAiEnhancing(true);
    const enhancePrompt = `You are a marketing copywriter for professional industry panels. Improve this panel topic/title to be more compelling and engaging while keeping the same meaning. Return ONLY the improved title, nothing else.\n\nOriginal: ${panelTopic}`;
    try {
      const result = await generateText(enhancePrompt, { model: claudeModel });
      setPanelTopic(result.trim());
    } catch (err) {
      console.error('AI enhance failed:', err);
    } finally {
      setAiEnhancing(false);
    }
  };

  // ============================================================
  // CSV/Excel Import
  // ============================================================
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvImporting, setCsvImporting] = useState(false);

  const handleCsvImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvImporting(true);
    try {
      const { rows, warnings } = await parseSpreadsheet(file);
      const imported = csvRowsToPanelists(rows);
      const newPanelists: PanelistFormData[] = imported.map((p, i) => ({
        id: crypto.randomUUID(),
        name: p.fullName || p.firstName || `Panelist ${i + 1}`,
        firstName: p.firstName || '',
        title: p.title || '',
        org: '',
        headshotUrl: '',
        zoomUrl: '',
        qrCodes: {},
      }));
      setPanelists(newPanelists);
      setDriveImported(true);
      if (warnings.length > 0) {
        showToast(`Imported ${rows.length} panelists (${warnings.length} warnings)`, 'warning');
      } else {
        showToast(`Imported ${rows.length} panelists from ${file.name}`, 'success');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to import file', 'error');
    } finally {
      setCsvImporting(false);
      if (csvInputRef.current) csvInputRef.current.value = '';
    }
  }, [showToast]);

  // Input class helper
  const inputClass = `w-full px-3 py-2.5 rounded-lg border-[2px] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 transition-all dm-input`;
  const inputStyle: React.CSSProperties = { backgroundColor: inputBg, borderColor: inputBorder, color: textPrimary };
  const cardStyle: React.CSSProperties = { backgroundColor: surface, borderColor: border };

  // Organize filtered banners by panelist for the grid
  const bannersByPanelist = new Map<string, GeneratedBanner[]>();
  for (const b of filteredBanners) {
    const arr = bannersByPanelist.get(b.panelistName) || [];
    arr.push(b);
    bannersByPanelist.set(b.panelistName, arr);
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`} style={{ backgroundColor: bg, color: textPrimary, '--input-bg': inputBg, '--input-border': inputBorder, '--input-text': textPrimary, '--v-accent': vColors.accent, '--v-accent-soft': vColors.accentSoft, '--v-c2': VERTICAL_COLORS['thriving-dentist'].accent, '--v-c3': VERTICAL_COLORS['dominate-law'].accent, '--v-c4': VERTICAL_COLORS['aesthetics'].accent } as React.CSSProperties}>
      {/* ===== TOP BAR ===== */}
      <header className="anim-fade-down sticky top-0 z-50 transition-colors duration-300" style={{ backgroundColor: surface, borderBottom: `2px solid ${border}` }}>
        <div className="max-w-[1600px] mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight" style={{ color: textPrimary }}>
                Panel Flyer Studio
              </h1>
              <p className="text-xs mt-1" style={{ color: textSecondary }}>Paste a Drive URL, get banners</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full transition-all hover:scale-105"
              style={{ background: darkMode ? '#333' : '#f0f0f0', color: darkMode ? '#fbbf24' : '#666' }}
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {/* Claude AI connection button */}
            <button
              onClick={() => setShowSettings(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all hover:scale-[1.02] ${
                claudeConnected
                  ? darkMode ? 'border-green-500 bg-green-900/30 text-green-400' : 'border-green-400 bg-green-50 text-green-700'
                  : claudeChecking
                    ? darkMode ? 'border-yellow-500 bg-yellow-900/30 text-yellow-400' : 'border-yellow-400 bg-yellow-50 text-yellow-700'
                    : darkMode ? 'border-gray-500 bg-gray-800 text-gray-300 animate-pulse' : 'border-black bg-white text-black animate-pulse'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${claudeConnected ? 'bg-green-500' : claudeChecking ? 'bg-yellow-400 animate-pulse' : 'bg-gray-400'}`} />
              {claudeConnected ? 'AI Connected' : claudeChecking ? 'AI Connecting...' : 'Connect AI'}
            </button>
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300"
              style={{ background: vColors.accent, color: '#fff' }}
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
              {VERTICALS.map((v, idx) => {
                const isSelected = selectedVertical === v.id;
                const vc = VERTICAL_COLORS[v.id];
                return (
                  <button
                    key={v.id}
                    onClick={() => handleVerticalChange(v.id, true)}
                    className={`anim-fade-up anim-stagger-${idx + 1} relative group flex flex-col items-center gap-2 px-4 py-5 rounded-2xl border-[2px] transition-all duration-300 hover:translate-y-[-2px] ${
                      isSelected
                        ? 'scale-[1.04] anim-border-glow'
                        : 'hover:shadow-md opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      '--v-accent-soft': vc.accentSoft,
                      borderColor: isSelected ? vc.accent : border,
                      background: isSelected ? (darkMode ? vc.accentDark : vc.accentLight) : surface,
                      boxShadow: isSelected ? `0 0 0 3px ${vc.accentSoft}` : 'none',
                    } as React.CSSProperties}
                  >
                    <span className={`text-2xl transition-transform duration-300 ${isSelected ? 'anim-float' : 'group-hover:scale-110'}`}>{VERTICAL_EMOJI[v.id]}</span>
                    <div className="text-center">
                      <div className="text-sm font-bold transition-colors duration-200" style={{ color: isSelected ? vc.accent : textSecondary }}>
                        {v.shortName}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ '--v-accent-soft': vc.accentSoft } as React.CSSProperties}>
                        <div className="absolute inset-0 rounded-2xl anim-shimmer" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Section 2: Panelist Count Selector */}
            <div className="anim-fade-up rounded-2xl p-5 border-[2px] transition-all duration-300 hover:shadow-sm" style={{ ...cardStyle, animationDelay: '0.15s' }}>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4" style={{ color: textSecondary }} />
                <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Panelist Count</h3>
              </div>
              <div className="flex gap-2">
                {([2, 3, 4] as PanelistCount[]).map((count) => {
                  const isSelected = panelistCount === count;
                  return (
                    <button
                      key={count}
                      onClick={() => setPanelistCount(count)}
                      className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border-[2px] hover:translate-y-[-1px] hover:shadow-sm ${isSelected ? 'scale-[1.03]' : ''}`}
                      style={isSelected
                        ? { background: vColors.accent, color: '#fff', borderColor: vColors.accent }
                        : { background: surface, color: textPrimary, borderColor: border }
                      }
                    >
                      {count} Panelists
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Drive Folder Import */}
            <div className="anim-fade-up rounded-2xl p-5 border-[2px] transition-all duration-300 hover:shadow-sm" style={{ ...cardStyle, animationDelay: '0.2s' }}>
              <div className="flex items-center gap-2 mb-3">
                <FolderOpen className="w-4 h-4" style={{ color: textSecondary }} />
                <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Google Drive Import</h3>
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
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white text-sm rounded-full font-bold transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: vColors.accent }}
                    >
                      {driveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                      {driveLoading ? 'Importing...' : 'Import & Generate'}
                    </button>
                    {claudeConnected && panelTopic && (
                      <button
                        onClick={handleAiEnhance}
                        disabled={aiEnhancing}
                        className="flex items-center justify-center gap-1.5 px-4 py-3 text-xs rounded-full font-bold border-2 transition-all hover:opacity-80 hover:translate-y-[-1px] disabled:opacity-40"
                        style={{ borderColor: border, color: textPrimary }}
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
                <div className="mt-3 flex items-center gap-2 anim-fade-up">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: textSecondary }} />
                  <span className="text-xs" style={{ color: textSecondary }}>{driveStep}</span>
                </div>
              )}

              {/* Error */}
              {driveError && (
                <div className="mt-3 text-xs rounded-xl px-3 py-2 anim-fade-up" style={{ background: darkMode ? '#3b1c1c' : '#fef2f2', color: darkMode ? '#fca5a5' : '#dc2626' }}>
                  {driveError}
                  <button onClick={handleDriveConnect} className="ml-2 underline font-medium">
                    Reconnect
                  </button>
                </div>
              )}

              {/* CSV/Excel upload + Manual entry links */}
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => csvInputRef.current?.click()}
                  disabled={csvImporting}
                  className="flex items-center gap-1.5 text-[11px] font-medium transition-colors hover:underline"
                  style={{ color: vColors.accent }}
                >
                  {csvImporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileUp className="w-3 h-3" />}
                  Import from CSV/Excel
                </button>
                <input ref={csvInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleCsvImport} />
                <span className="text-[10px]" style={{ color: textSecondary }}>|</span>
                {!showManualEntry && (
                  <button
                    onClick={() => setShowManualEntry(true)}
                    className="text-[11px] underline transition-colors"
                    style={{ color: textSecondary }}
                  >
                    Enter manually
                  </button>
                )}
              </div>
            </div>

            {/* Detected Data section moved to right panel */}

            {/* Manual Entry (collapsed by default, secondary flow) */}
            {showManualEntry && !driveImported && (
              <div className="anim-fade-up rounded-2xl p-5 border-[2px] space-y-4" style={cardStyle}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileImage className="w-4 h-4" style={{ color: textSecondary }} />
                    <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Manual Entry</h3>
                  </div>
                  <button
                    onClick={() => setShowManualEntry(false)}
                    className="p-1.5 rounded-xl transition-colors"
                    style={{ color: textSecondary }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: textSecondary }}>Panel Name</label>
                  <input value={panelName} onChange={(e) => setPanelName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: textSecondary }}>Panel Topic (Main Title)</label>
                  <input value={panelTopic} onChange={(e) => setPanelTopic(e.target.value)} placeholder="e.g. Leading Through Change" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: textSecondary }}>Subtitle (shown in gradient card on B1)</label>
                  <input value={panelSubtitle} onChange={(e) => setPanelSubtitle(e.target.value)} placeholder="e.g. Practical Leadership for a Post-Pandemic Veterinary World" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: textSecondary }}>Event Date</label>
                    <input value={eventDate} onChange={(e) => setEventDate(e.target.value)} placeholder="SUNDAY, MARCH 23, 2026" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: textSecondary }}>Event Time</label>
                    <input value={eventTime} onChange={(e) => setEventTime(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: textSecondary }}>Website URL</label>
                  <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className={inputClass} />
                </div>

                {/* Panelists */}
                <div className="pt-2" style={{ borderTop: `2px solid ${border}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold" style={{ color: textPrimary }}>Panelists ({panelists.length})</h4>
                    <button
                      onClick={addPanelist}
                      className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors hover:opacity-80"
                      style={{ color: '#fff', background: vColors.accent }}
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>

                  {panelists.length === 0 ? (
                    <button
                      onClick={addPanelist}
                      className="w-full flex items-center justify-center gap-1.5 py-3 text-xs font-semibold rounded-2xl border-2 border-dashed transition-colors"
                      style={{ borderColor: darkMode ? '#555' : '#d1d5db', color: textSecondary }}
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
              <div className="anim-fade-up flex flex-col gap-2" style={{ animationDelay: '0.25s' }}>
                {selectedBannerIds.size > 0 && (
                  <button
                    onClick={downloadSelectedBanners}
                    disabled={downloadingAll}
                    className="w-full flex items-center justify-center gap-2 px-8 py-3 rounded-full text-sm font-bold transition-all hover:opacity-80 hover:scale-[1.01] hover:translate-y-[-1px] disabled:opacity-50"
                    style={{ background: vColors.accent, color: '#fff' }}
                  >
                    {downloadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {downloadingAll ? 'Creating ZIP...' : `Download Selected (${selectedBannerIds.size}) as ZIP`}
                  </button>
                )}
                <button
                  onClick={downloadAllBanners}
                  disabled={downloadingAll}
                  className="w-full flex items-center justify-center gap-2 px-8 py-3 rounded-full text-sm font-bold border-2 transition-all hover:opacity-80 hover:scale-[1.01] disabled:opacity-50"
                  style={{ borderColor: border, color: textPrimary, background: surface }}
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
              <div className="anim-fade-up rounded-2xl p-5 border-[2px] transition-all duration-300" style={cardStyle}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4" style={{ color: vColors.accent }} />
                    <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Detected Data</h3>
                    <span className="text-[10px]" style={{ color: textSecondary }}>Press Enter to sync changes</span>
                  </div>
                  <button
                    onClick={() => setShowEditOverrides(!showEditOverrides)}
                    className="flex items-center gap-1 text-[11px] font-medium hover:underline transition-colors"
                    style={{ color: vColors.accent }}
                  >
                    <Pencil className="w-3 h-3" />
                    {showEditOverrides ? 'Collapse' : 'Expand'}
                  </button>
                </div>

                {!showEditOverrides ? (
                  /* Compact view */
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                    <span style={{ color: textPrimary }}><span style={{ color: textSecondary }} className="font-medium">Header:</span> {headerText}</span>
                    <span style={{ color: textPrimary }}><span style={{ color: textSecondary }} className="font-medium">Event:</span> {panelName}</span>
                    <span style={{ color: textPrimary }}><span style={{ color: textSecondary }} className="font-medium">Topic:</span> {panelTopic}</span>
                    {panelSubtitle && <span style={{ color: textPrimary }}><span style={{ color: textSecondary }} className="font-medium">Subtitle:</span> {panelSubtitle}</span>}
                    <span style={{ color: textPrimary }}><span style={{ color: textSecondary }} className="font-medium">Date:</span> {eventDate}</span>
                    <span style={{ color: textPrimary }}><span style={{ color: textSecondary }} className="font-medium">Time:</span> {eventTime}</span>
                    <div className="flex items-center gap-2">
                      {panelists.map((p) => (
                        <div key={p.id} className="flex items-center gap-1">
                          <div className="w-5 h-5 rounded-full overflow-hidden shrink-0" style={{ border: `1px solid ${border}` }}>
                            {p.headshotUrl ? (
                              <img src={p.headshotUrl} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[7px] font-bold" style={{ background: darkMode ? '#333' : '#f3f4f6', color: textSecondary }}>{p.name[0] || '?'}</div>
                            )}
                          </div>
                          <span className="text-[11px]" style={{ color: textSecondary }}>{p.firstName || p.name.split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Expanded edit view — horizontal layout */
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-medium mb-0.5 block" style={{ color: textSecondary }}>Banner Header</label>
                      <input value={headerText} onChange={(e) => setHeaderText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && regenerateIfChanged()} onBlur={() => regenerateIfChanged()} placeholder="e.g. Veterinary Business Institute Expert Panel" className={inputClass + ' !text-xs !font-bold'} />
                    </div>
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] font-medium mb-0.5 block" style={{ color: textSecondary }}>Panel Name</label>
                        <input value={panelName} onChange={(e) => setPanelName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && regenerateIfChanged()} onBlur={() => regenerateIfChanged()} className={inputClass + ' !text-xs'} />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium mb-0.5 block" style={{ color: textSecondary }}>Panel Topic</label>
                        <input value={panelTopic} onChange={(e) => setPanelTopic(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && regenerateIfChanged()} onBlur={() => regenerateIfChanged()} className={inputClass + ' !text-xs'} />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium mb-0.5 block" style={{ color: textSecondary }}>Event Date</label>
                        <input value={eventDate} onChange={(e) => setEventDate(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && regenerateIfChanged()} onBlur={() => regenerateIfChanged()} className={inputClass + ' !text-xs'} />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium mb-0.5 block" style={{ color: textSecondary }}>Event Time</label>
                        <input value={eventTime} onChange={(e) => setEventTime(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && regenerateIfChanged()} onBlur={() => regenerateIfChanged()} className={inputClass + ' !text-xs'} />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium mb-0.5 block" style={{ color: textSecondary }}>Panel Subtitle</label>
                      <input value={panelSubtitle} onChange={(e) => setPanelSubtitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && regenerateIfChanged()} onBlur={() => regenerateIfChanged()} placeholder="e.g. Practical Leadership for a Post-Pandemic Veterinary World" className={inputClass + ' !text-xs'} />
                    </div>
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] font-medium mb-0.5 block" style={{ color: textSecondary }}>Website URL</label>
                        <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && regenerateIfChanged()} onBlur={() => regenerateIfChanged()} className={inputClass + ' !text-xs'} />
                      </div>
                    </div>

                    {/* Per-panelist editing — horizontal cards */}
                    <div className="pt-3" style={{ borderTop: `1px solid ${darkMode ? '#333' : '#e5e7eb'}` }}>
                      <h4 className="text-[10px] font-bold mb-2" style={{ color: textSecondary }}>PANELISTS</h4>
                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                        {panelists.map((p, i) => (
                          <div key={p.id} className="flex gap-2.5 items-start rounded-xl p-3" style={{ background: darkMode ? '#252525' : '#f9fafb' }}>
                            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-[2px]" style={{ borderColor: border }}>
                              {p.headshotUrl ? (
                                <img src={p.headshotUrl} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ background: darkMode ? '#333' : '#e5e7eb', color: textSecondary }}>{p.name[0] || '?'}</div>
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
              <div className="anim-scale-in rounded-2xl border-[2px] p-16 text-center" style={cardStyle}>
                {generating ? (
                  /* ===== Google-flow loading state ===== */
                  <div className="space-y-8">
                    {/* Animated icon */}
                    <div className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center relative" style={{ background: darkMode ? vColors.accentDark : vColors.accentLight }}>
                      <FileImage className="w-12 h-12 anim-pulse" style={{ color: vColors.accent }} />
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: vColors.accent }}>
                        <Loader2 className="w-3 h-3 animate-spin text-white" />
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="text-2xl font-black mb-2" style={{ color: textPrimary }}>
                        Generating Banners...
                      </h3>
                      <p className="text-sm" style={{ color: textSecondary }}>
                        {Math.round(genProgress)}% complete
                      </p>
                    </div>

                    {/* Google-style flowing dots */}
                    <div className="flex items-center justify-center gap-2">
                      <span className="google-dot" style={{ background: VERTICAL_COLORS.vet.accent }} />
                      <span className="google-dot" style={{ background: VERTICAL_COLORS['thriving-dentist'].accent }} />
                      <span className="google-dot" style={{ background: VERTICAL_COLORS['dominate-law'].accent }} />
                      <span className="google-dot" style={{ background: VERTICAL_COLORS.aesthetics.accent }} />
                    </div>

                    {/* Google-style progress bar */}
                    <div className="max-w-xs mx-auto">
                      <div className="google-flow-bar" style={{ background: darkMode ? '#333' : '#e5e7eb' }} />
                    </div>

                    {/* Pulsing placeholder grid */}
                    <div className="mt-6 grid grid-cols-5 gap-3 max-w-lg mx-auto">
                      {(['B1', 'B2', 'B3', 'B4', 'B5'] as const).map((type, i) => (
                        <div
                          key={type}
                          className="aspect-square rounded-2xl placeholder-card-pulse border-[2px]"
                          style={{
                            ...cardStyle,
                            animationDelay: `${i * 0.2}s`,
                            background: darkMode
                              ? `linear-gradient(135deg, ${DARK_SURFACE} 0%, ${vColors.accentDark} 100%)`
                              : `linear-gradient(135deg, #fff 0%, ${vColors.accentLight} 100%)`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  /* ===== Idle empty state ===== */
                  <div>
                    <div
                      className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 transition-colors duration-300"
                      style={{ background: darkMode ? vColors.accentDark : vColors.accentLight }}
                    >
                      <FileImage className="w-10 h-10" style={{ color: `${vColors.accent}80` }} />
                    </div>
                    <h3 className="text-3xl font-black mb-3" style={{ color: textPrimary }}>
                      No Banners Yet
                    </h3>
                    <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: textSecondary }}>
                      Select a vertical, choose panelist count, paste a Google Drive folder URL, and banners will appear here automatically.
                    </p>

                    {/* Google-style 4 dots with vertical colors — subtle idle animation */}
                    <div className="flex items-center justify-center gap-3 mt-8">
                      {VERTICALS.map((v, i) => (
                        <div
                          key={v.id}
                          className="w-3 h-3 rounded-full transition-all duration-300"
                          style={{
                            background: selectedVertical === v.id ? VERTICAL_COLORS[v.id].accent : (darkMode ? '#444' : '#d1d5db'),
                            transform: selectedVertical === v.id ? 'scale(1.4)' : 'scale(1)',
                            boxShadow: selectedVertical === v.id ? `0 0 8px ${VERTICAL_COLORS[v.id].accentSoft}` : 'none',
                          }}
                        />
                      ))}
                    </div>

                    <div className="mt-10 grid grid-cols-5 gap-3 max-w-lg mx-auto">
                      {(['B1', 'B2', 'B3', 'B4', 'B5'] as const).map((type) => (
                        <div
                          key={type}
                          className="aspect-square rounded-2xl flex items-center justify-center p-2 text-center border-[2px] transition-colors duration-300"
                          style={cardStyle}
                        >
                          <span className="text-[9px] font-semibold leading-tight" style={{ color: textSecondary }}>{BANNER_TYPE_LABELS[type]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="anim-fade-up rounded-2xl border-[2px] p-6" style={cardStyle}>
                {/* Header with filters */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4" style={{ color: textSecondary }} />
                    <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Banner Preview</h3>
                    <span
                      className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: darkMode ? vColors.accentDark : vColors.accentLight, color: textPrimary }}
                    >
                      {filteredBanners.length} of {banners.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={selectAllVisible}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition-all"
                      style={{ borderColor: border, color: textPrimary, background: surface }}
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
                        style={{ background: vColors.accent }}
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
                <div className="flex items-center gap-4 flex-wrap mb-4 pb-4" style={{ borderBottom: `1px solid ${darkMode ? '#333' : '#f3f4f6'}` }}>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: textSecondary }}>Panelist:</label>
                    <select
                      value={selectedPanelistFilter}
                      onChange={(e) => { setSelectedPanelistFilter(e.target.value); setSelectedBannerIds(new Set()); }}
                      className="border-[2px] rounded-full px-3 py-1.5 text-xs focus:outline-none focus:ring-1"
                      style={{ borderColor: border, background: surface, color: textPrimary }}
                    >
                      <option value="all">All ({banners.length})</option>
                      {uniquePanelistNames.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: textSecondary }}>Type:</label>
                    <div className="flex gap-1">
                      {(['all', 'B1', 'B2', 'B3', 'B4', 'B5'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => { setSelectedBannerType(type); setSelectedBannerIds(new Set()); }}
                          className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border-[2px]"
                          style={selectedBannerType === type
                            ? { background: textPrimary, color: surface, borderColor: textPrimary }
                            : { background: surface, color: textPrimary, borderColor: border }
                          }
                        >
                          {type === 'all' ? 'All' : BANNER_TYPE_LABELS[type]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: textSecondary }}>Theme:</label>
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
                          className={`w-8 h-8 rounded-full border-2 transition-all flex-shrink-0 overflow-hidden ${
                            selectedTheme.id === theme.id
                              ? 'ring-2 ring-offset-1 scale-110'
                              : 'hover:scale-105'
                          }`}
                          style={{
                            borderColor: selectedTheme.id === theme.id ? vColors.accent : (darkMode ? '#555' : '#d1d5db'),
                            ...(selectedTheme.id === theme.id ? { boxShadow: `0 0 0 2px ${vColors.accent}` } : {}),
                            background: `linear-gradient(135deg, ${theme.swatch[0]} 50%, ${theme.swatch[1]} 50%)`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Generation progress bar */}
                {generating && (
                  <div className="w-full rounded-full h-2 overflow-hidden mb-4" style={{ background: darkMode ? '#333' : '#f3f4f6' }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${genProgress}%`, background: vColors.accent }}
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
                        className="text-center text-[10px] font-bold uppercase tracking-wider pb-2"
                        style={{ color: textSecondary }}
                      >
                        {BANNER_TYPE_LABELS[type]}
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
                              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border-2" style={{ borderColor: border }}>
                                {panelist?.headshotUrl ? (
                                  <img src={panelist.headshotUrl} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold" style={{ background: darkMode ? '#333' : '#f3f4f6', color: textSecondary }}>
                                    {panelistName[0] || '?'}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-[11px] font-semibold truncate max-w-[100px]" style={{ color: textPrimary }}>{panelistName}</div>
                              </div>
                            </div>
                            {/* QR status indicator */}
                            {panelist?.qrCodes && Object.values(panelist.qrCodes).filter(Boolean).length > 0 && (
                              <div className="flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#d4edda', color: '#155724' }}>
                                <QrCode className="w-3 h-3" />
                                QR {Object.values(panelist.qrCodes).filter(Boolean).length}/5
                              </div>
                            )}
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

      {/* ===== FOLDER STRUCTURE GUIDE ===== */}
      <section className="max-w-[1600px] mx-auto px-8 mt-16">
        <details className="rounded-2xl border-[2px] overflow-hidden" style={{ borderColor: border, backgroundColor: surface }}>
          <summary className="px-6 py-4 cursor-pointer select-none flex items-center gap-3 font-bold text-sm" style={{ color: textPrimary }}>
            <FolderOpen className="w-5 h-5" style={{ color: vColors.accent }} />
            Google Drive Folder Structure Guide
            <span className="text-xs font-normal ml-2" style={{ color: textSecondary }}>How to organize your event folders for best results</span>
          </summary>
          <div className="px-6 pb-6 pt-2 space-y-5 text-sm" style={{ color: textSecondary }}>
            {/* Folder naming */}
            <div>
              <h4 className="font-bold mb-2" style={{ color: textPrimary }}>1. Folder Naming Convention</h4>
              <p className="mb-2">Name your event folder using this format for automatic topic/subtitle detection:</p>
              <code className="block px-4 py-2.5 rounded-lg text-xs" style={{ backgroundColor: darkMode ? '#252525' : '#f5f5f0', color: vColors.accent }}>
                {'Date - Panel Name – Main Topic: Subtitle'}
              </code>
              <p className="text-xs mt-2" style={{ color: textSecondary }}>
                Examples: <em>"15th Jan - Veterinary Ownership &amp; Leadership Panel – Leading Through Change: Practical Leadership for a Post-Pandemic Veterinary World"</em>
              </p>
            </div>

            {/* Folder structure */}
            <div>
              <h4 className="font-bold mb-2" style={{ color: textPrimary }}>2. Required Folder Structure</h4>
              <pre className="px-4 py-3 rounded-lg text-xs leading-relaxed overflow-x-auto" style={{ backgroundColor: darkMode ? '#252525' : '#f5f5f0', color: textPrimary }}>{`Event Folder/
├── Partner Details                    (Google Doc - panelist info, use TABS per panelist)
├── [Name] - Promotional Materials     (Google Doc per panelist - bios, credentials)
├── Headshots/                         (Folder - one image per panelist)
│   ├── jessica_moore_jones.jpg
│   ├── john_smith.png
│   └── ...
├── QR Codes/                          (Folder - auto-mapped to B1–B5 banners)
│   ├── Dr. Jessica Moore-Jones/
│   │   ├── QR_..._N1.png             (→ B1 Intro)
│   │   ├── QR_..._N2.png             (→ B2 Panel 1)
│   │   ├── QR_..._N3.png             (→ B3 Panel 2)
│   │   ├── QR_..._N4.png             (→ B4 One More Day)
│   │   └── QR_..._N5.png             (→ B5 Happening Today)
│   ├── John Smith/
│   │   └── ... (5 QR images)
│   └── ...
├── LOgos/                             (Folder - optional)
└── Event Slides                       (Google Slides - optional)`}</pre>
            </div>

            {/* Key rules */}
            <div>
              <h4 className="font-bold mb-2" style={{ color: textPrimary }}>3. Key Rules</h4>
              <ul className="space-y-1.5 text-xs list-none">
                <li className="flex gap-2"><span style={{ color: vColors.accent }}>&#9679;</span> <strong>Partner Details doc:</strong> Use Google Doc TABS — one tab per panelist with their name, title, and organization</li>
                <li className="flex gap-2"><span style={{ color: vColors.accent }}>&#9679;</span> <strong>Headshot filenames:</strong> Include the panelist's last name (e.g., <code>moore_jones.jpg</code>) for auto-matching</li>
                <li className="flex gap-2"><span style={{ color: vColors.accent }}>&#9679;</span> <strong>QR code filenames:</strong> Must end with a number 1–5 before the extension (e.g., <code>QR_...N1.png</code> → B1)</li>
                <li className="flex gap-2"><span style={{ color: vColors.accent }}>&#9679;</span> <strong>QR subfolder names:</strong> Match panelist names (e.g., <code>Dr. Dani McVety/</code>)</li>
                <li className="flex gap-2"><span style={{ color: vColors.accent }}>&#9679;</span> <strong>No QR folder?</strong> Banners will show a dashed placeholder — QR codes are optional</li>
                <li className="flex gap-2"><span style={{ color: vColors.accent }}>&#9679;</span> <strong>Promotional Materials:</strong> Name as <code>[Panelist Name] - Promotional Materials</code> for auto-detection</li>
              </ul>
            </div>

            {/* What gets auto-detected */}
            <div>
              <h4 className="font-bold mb-2" style={{ color: textPrimary }}>4. What Gets Auto-Detected</h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                <div className="flex gap-2"><span className="text-green-500">&#10003;</span> Panel name &amp; topic from folder name</div>
                <div className="flex gap-2"><span className="text-green-500">&#10003;</span> Subtitle from folder name (after <code>:</code>)</div>
                <div className="flex gap-2"><span className="text-green-500">&#10003;</span> Event date &amp; time from docs</div>
                <div className="flex gap-2"><span className="text-green-500">&#10003;</span> Panelist names, titles, orgs from doc tabs</div>
                <div className="flex gap-2"><span className="text-green-500">&#10003;</span> Headshots matched by name</div>
                <div className="flex gap-2"><span className="text-green-500">&#10003;</span> QR codes mapped to B1–B5 banners</div>
                <div className="flex gap-2"><span className="text-green-500">&#10003;</span> Zoom registration URL</div>
                <div className="flex gap-2"><span className="text-green-500">&#10003;</span> Vertical auto-detection (VET/TD/DL/BOA)</div>
              </div>
            </div>
          </div>
        </details>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="mt-8 py-8 border-t-[2px] text-center" style={{ borderColor: border }}>
        <p className="text-xs" style={{ color: textSecondary }}>
          Panel Flyer Studio &mdash; Built for{' '}
          <span style={{ color: vColors.accent }}>{verticalConfig.name}</span>
          {' '}&amp; all verticals
        </p>
      </footer>

      {/* ===== SETTINGS MODAL ===== */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setShowSettings(false)}>
          <div className="anim-scale-in rounded-2xl border-[2px] p-6 w-full max-w-md mx-4" style={cardStyle} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black" style={{ color: textPrimary }}>Connect AI</h2>
              <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-xl transition-colors" style={{ color: textSecondary }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Connection status banner */}
            {claudeConnected && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4" style={{ background: darkMode ? 'rgba(34,197,94,0.1)' : '#f0fdf4', border: `1px solid ${darkMode ? '#22c55e50' : '#bbf7d0'}` }}>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-xs font-semibold" style={{ color: darkMode ? '#4ade80' : '#15803d' }}>
                  {cliConnected ? 'Connected via Claude Code CLI' : 'Connected via API Key'}
                </span>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-4 rounded-lg p-1" style={{ background: darkMode ? '#252525' : '#f3f4f6' }}>
              <button
                onClick={() => setSettingsTab('cli')}
                className="flex-1 text-xs font-bold py-2 rounded-md transition-all"
                style={settingsTab === 'cli' ? { background: surface, color: textPrimary, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' } : { color: textSecondary }}
              >
                Claude Code (Recommended)
              </button>
              <button
                onClick={() => setSettingsTab('apikey')}
                className="flex-1 text-xs font-bold py-2 rounded-md transition-all"
                style={settingsTab === 'apikey' ? { background: surface, color: textPrimary, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' } : { color: textSecondary }}
              >
                API Key
              </button>
            </div>

            {/* CLI Tab */}
            {settingsTab === 'cli' && (
              <div className="space-y-4">
                <p className="text-xs leading-relaxed" style={{ color: textSecondary }}>
                  Use your Claude Code subscription — no API key needed. Make sure Claude Code is installed on your computer.
                </p>

                <div className="space-y-3 rounded-xl p-4" style={{ background: darkMode ? '#252525' : '#f9fafb', border: `1px solid ${darkMode ? '#444' : '#e5e7eb'}` }}>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ background: vColors.accent, color: '#fff' }}>1</div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: textPrimary }}>Install Claude Code</p>
                      <code className="text-[10px] px-1.5 py-0.5 rounded mt-1 block" style={{ background: darkMode ? '#333' : '#e5e7eb', color: textSecondary }}>npm install -g @anthropic-ai/claude-code</code>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ background: vColors.accent, color: '#fff' }}>2</div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: textPrimary }}>Run <code className="px-1 rounded text-[10px]" style={{ background: darkMode ? '#333' : '#e5e7eb' }}>claude</code> in your terminal and complete login</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ background: vColors.accent, color: '#fff' }}>3</div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: textPrimary }}>Click "Check Connection" below to verify</p>
                    </div>
                  </div>
                </div>

                {/* CLI status */}
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${cliConnected ? 'bg-green-500' : claudeChecking ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'}`} />
                  <span className="text-xs" style={{ color: textSecondary }}>
                    {cliConnected ? 'Claude CLI connected and authenticated' : claudeChecking ? 'Checking...' : 'Not connected'}
                  </span>
                </div>

                <button
                  onClick={handleCheckCLIConnection}
                  disabled={claudeChecking}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border-2 transition-all hover:opacity-80 disabled:opacity-40"
                  style={{ borderColor: border, color: textPrimary }}
                >
                  {claudeChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  Check Connection
                </button>
              </div>
            )}

            {/* API Key Tab */}
            {settingsTab === 'apikey' && (
              <div className="space-y-4">
                <p className="text-xs leading-relaxed" style={{ color: textSecondary }}>
                  Connect your Anthropic API key as an alternative. Your key is stored locally in this browser only.
                </p>

                {/* API Key */}
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: textSecondary }}>Anthropic API Key</label>
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: textSecondary }}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Model selector */}
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: textSecondary }}>Model</label>
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
                  <span className="text-xs" style={{ color: textSecondary }}>
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
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border-2 transition-all hover:opacity-80 disabled:opacity-40"
                    style={{ borderColor: border, color: textPrimary }}
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
          darkMode={darkMode}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-[9999]">
          <div className={`anim-fade-up flex items-center gap-3 px-4 py-3 rounded-2xl border max-w-md shadow-lg ${
            toast.type === 'error'
              ? darkMode ? 'bg-red-900/30 text-red-300 border-red-800' : 'bg-red-50 text-red-800 border-red-200'
              : toast.type === 'warning'
                ? darkMode ? 'bg-yellow-900/30 text-yellow-300 border-yellow-800' : 'bg-yellow-50 text-yellow-800 border-yellow-200'
                : darkMode ? 'bg-green-900/30 text-green-300 border-green-800' : 'bg-green-50 text-green-800 border-green-200'
          }`}>
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button onClick={() => setToast(null)} className="p-1 hover:bg-black/10 rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
