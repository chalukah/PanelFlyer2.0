import { useState, useCallback } from 'react';
import {
  FolderPlus, Search, CheckCircle, XCircle, Loader2, Plus, Trash2,
  ChevronDown, ChevronUp, LogIn, RefreshCw,
} from 'lucide-react';
import {
  initGoogleAuth, signIn, isSignedIn, extractFolderIdFromUrl,
} from '../utils/googleDrive';
import {
  scanFolder, createOrFillEventFolder, FolderScanResult,
} from '../utils/gdriveCreator';
import {
  EventInfo, PanelistInfo, buildEventInfo,
} from '../utils/eventContentTemplates';

// ─── Types ─────────────────────────────────────────────────────────────────

interface PanelistFormData {
  name: string;
  firstName: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  bio: string;
  linkedIn: string;
}

const blankPanelist = (): PanelistFormData => ({
  name: '', firstName: '', title: '', company: '',
  email: '', phone: '', bio: '', linkedIn: '',
});

const placeholderPanelist = (n: number): PanelistFormData => ({
  name: `[PANELIST ${n} - TBD]`,
  firstName: `[PANELIST ${n}]`,
  title: '[TITLE - TBD]',
  company: '[COMPANY - TBD]',
  email: '[EMAIL - TBD]',
  phone: '[PHONE - TBD]',
  bio: '[BIO - TBD]',
  linkedIn: '',
});

// May 13th event pre-fill
const MAY13_DEFAULTS = {
  folderUrl: 'https://drive.google.com/drive/folders/1tB9nrw3bLUZzwpWNl7T_sb19UEuGqOjM',
  panelName: 'Veterinary Ownership & Leadership Panel',
  topic: "Charge What You're Worth: How to Stop Discounting and Grow Your Practice Value",
  date: '2026-05-13',
  discussionPoints: [
    'Replace discount habits with value-based messaging frameworks',
    'Train teams on pricing confidence and objection handling',
    'Pair financing pathways with care acceptance strategy',
    'Standardize scripts that preserve empathy and profitability',
  ],
  panelists: [
    {
      name: 'Adele Feakes',
      firstName: 'Adele',
      title: 'Director',
      company: 'ADELE FEAKES CONSULTING',
      email: 'adele.feakes@outlook.com',
      phone: '0428 116 245',
      bio: '[BIO - TBD]',
      linkedIn: 'https://www.linkedin.com/in/adele-feakes-49aa0059/',
    },
    placeholderPanelist(2),
    placeholderPanelist(3),
    placeholderPanelist(4),
  ],
};

// ─── Component ─────────────────────────────────────────────────────────────

export function GDriveFolderCreator() {
  const [authState, setAuthState] = useState<'checking' | 'signed-out' | 'signed-in'>(
    isSignedIn() ? 'signed-in' : 'signed-out',
  );
  const [folderUrl, setFolderUrl] = useState(MAY13_DEFAULTS.folderUrl);
  const [panelName, setPanelName] = useState(MAY13_DEFAULTS.panelName);
  const [topic, setTopic] = useState(MAY13_DEFAULTS.topic);
  const [date, setDate] = useState(MAY13_DEFAULTS.date);
  const [discussionPoints, setDiscussionPoints] = useState<string[]>(MAY13_DEFAULTS.discussionPoints);
  const [panelists, setPanelists] = useState<PanelistFormData[]>(MAY13_DEFAULTS.panelists);
  const [showPanelistIdx, setShowPanelistIdx] = useState<number | null>(0);

  const [scanResult, setScanResult] = useState<FolderScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // ── Auth ──
  const handleSignIn = useCallback(async () => {
    setAuthState('checking');
    setError(null);
    try {
      await initGoogleAuth();
      await signIn();
      setAuthState('signed-in');
    } catch (e) {
      setError(`Sign-in failed: ${e instanceof Error ? e.message : String(e)}`);
      setAuthState('signed-out');
    }
  }, []);

  // ── Build event info from form ──
  const buildEvent = useCallback((): EventInfo => {
    const d = new Date(date + 'T12:00:00');
    return buildEventInfo({ panelName, topic, date: d, discussionPoints });
  }, [panelName, topic, date, discussionPoints]);

  const buildPanelists = useCallback((): PanelistInfo[] =>
    panelists.map(p => ({
      name: p.name,
      firstName: p.firstName || p.name.split(' ')[0],
      title: p.title,
      company: p.company,
      email: p.email,
      phone: p.phone,
      bio: p.bio || '[BIO - TBD]',
      linkedIn: p.linkedIn,
    })), [panelists]);

  // ── Scan ──
  const handleScan = useCallback(async () => {
    const folderId = extractFolderIdFromUrl(folderUrl);
    if (!folderId) { setError('Invalid folder URL'); return; }
    setScanning(true);
    setError(null);
    setScanResult(null);
    try {
      const result = await scanFolder(folderId, buildEvent(), buildPanelists());
      setScanResult(result);
    } catch (e) {
      setError(`Scan failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setScanning(false);
    }
  }, [folderUrl, buildEvent, buildPanelists]);

  // ── Generate ──
  const handleGenerate = useCallback(async () => {
    const folderId = extractFolderIdFromUrl(folderUrl);
    if (!folderId) { setError('Invalid folder URL'); return; }
    setGenerating(true);
    setDone(false);
    setError(null);
    setProgressLog([]);
    try {
      await createOrFillEventFolder(
        folderId,
        buildEvent(),
        buildPanelists(),
        (msg) => setProgressLog(prev => [...prev, msg]),
      );
      setDone(true);
    } catch (e) {
      setError(`Generation failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setGenerating(false);
    }
  }, [folderUrl, buildEvent, buildPanelists]);

  // ── Panelist helpers ──
  const updatePanelist = (idx: number, field: keyof PanelistFormData, value: string) => {
    setPanelists(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };
  const addPanelist = () => {
    const n = panelists.length + 1;
    setPanelists(prev => [...prev, placeholderPanelist(n)]);
    setShowPanelistIdx(panelists.length);
  };
  const removePanelist = (idx: number) => {
    setPanelists(prev => prev.filter((_, i) => i !== idx));
    setShowPanelistIdx(null);
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-auto">
      <div className="max-w-4xl w-full mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <FolderPlus className="w-6 h-6 text-blue-500" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">GDrive Folder Creation</h1>
        </div>

        {/* Auth */}
        {authState !== 'signed-in' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-center justify-between">
            <span className="text-sm text-yellow-800 dark:text-yellow-200">
              Sign in with Google to create and edit Drive files.
            </span>
            <button
              onClick={handleSignIn}
              disabled={authState === 'checking'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md disabled:opacity-50"
            >
              {authState === 'checking' ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              Sign In
            </button>
          </div>
        )}

        {authState === 'signed-in' && (
          <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Signed in to Google Drive
          </div>
        )}

        {/* Folder URL */}
        <Section title="Event Folder">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Google Drive Folder URL
          </label>
          <input
            type="text"
            value={folderUrl}
            onChange={e => setFolderUrl(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/..."
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </Section>

        {/* Event Details */}
        <Section title="Event Details">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Panel Name</label>
              <input
                type="text"
                value={panelName}
                onChange={e => setPanelName(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Discussion Points */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              Key Discussion Points
            </label>
            <div className="space-y-2">
              {discussionPoints.map((pt, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={pt}
                    onChange={e => setDiscussionPoints(prev => prev.map((p, j) => j === i ? e.target.value : p))}
                    className={`flex-1 ${inputCls}`}
                  />
                  <button
                    onClick={() => setDiscussionPoints(prev => prev.filter((_, j) => j !== i))}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setDiscussionPoints(prev => [...prev, ''])}
                className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add point
              </button>
            </div>
          </div>
        </Section>

        {/* Panelists */}
        <Section title="Panelists">
          <div className="space-y-2">
            {panelists.map((p, i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowPanelistIdx(showPanelistIdx === i ? null : i)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750"
                >
                  <span>
                    {p.name || `Panelist ${i + 1}`}
                    {p.name.includes('TBD') && (
                      <span className="ml-2 text-xs text-amber-500 font-normal">placeholder</span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {showPanelistIdx === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {showPanelistIdx === i && (
                  <div className="p-4 grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Full Name (with credentials)</label>
                      <input type="text" value={p.name} onChange={e => updatePanelist(i, 'name', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">First Name (for emails)</label>
                      <input type="text" value={p.firstName} onChange={e => updatePanelist(i, 'firstName', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Title</label>
                      <input type="text" value={p.title} onChange={e => updatePanelist(i, 'title', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Company</label>
                      <input type="text" value={p.company} onChange={e => updatePanelist(i, 'company', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
                      <input type="email" value={p.email} onChange={e => updatePanelist(i, 'email', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Phone</label>
                      <input type="text" value={p.phone} onChange={e => updatePanelist(i, 'phone', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">LinkedIn URL</label>
                      <input type="text" value={p.linkedIn} onChange={e => updatePanelist(i, 'linkedIn', e.target.value)} className={inputCls} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Bio</label>
                      <textarea
                        rows={4}
                        value={p.bio}
                        onChange={e => updatePanelist(i, 'bio', e.target.value)}
                        className={`${inputCls} resize-y`}
                      />
                    </div>
                    {i > 0 && (
                      <div className="col-span-2 flex justify-end">
                        <button
                          onClick={() => removePanelist(i)}
                          className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {panelists.length < 6 && (
              <button
                onClick={addPanelist}
                className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 mt-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add panelist
              </button>
            )}
          </div>
        </Section>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleScan}
            disabled={scanning || !folderUrl || authState !== 'signed-in'}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm rounded-md disabled:opacity-50"
          >
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Scan Folder
          </button>

          <button
            onClick={handleGenerate}
            disabled={generating || !folderUrl || authState !== 'signed-in'}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {generating ? 'Generating...' : 'Generate / Fill All Documents'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
            <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Done */}
        {done && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            All documents created/updated successfully! Open the folder in Google Drive to review.
          </div>
        )}

        {/* Scan Results */}
        {scanResult && (
          <Section title="Folder Scan Results">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Found {scanResult.existing.length} items. {scanResult.missing.length === 0 ? 'All expected files present.' : `${scanResult.missing.length} item(s) missing.`}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {scanResult.existing
                .filter(f => !f.name.startsWith('.'))
                .map(f => (
                  <div key={f.id} className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </div>
                ))}
              {scanResult.missing.map(m => (
                <div key={m.key} className="flex items-center gap-2 text-xs text-red-500 dark:text-red-400">
                  <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{m.name}</span>
                  <span className="text-gray-400">(missing)</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Progress Log */}
        {progressLog.length > 0 && (
          <Section title="Progress">
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {progressLog.map((msg, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  {i === progressLog.length - 1 && generating
                    ? <Loader2 className="w-3 h-3 animate-spin text-blue-500 flex-shrink-0" />
                    : <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />}
                  {msg}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{title}</h2>
      {children}
    </div>
  );
}
