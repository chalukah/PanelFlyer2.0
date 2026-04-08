import { useState } from 'react';
import FlyerApp from './components/FlyerApp';
import { TemplateManager } from './components/TemplateManager';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGate } from './components/AuthGate';
import { usePanelStore } from './panelStore';
import { Palette, FileCode, FolderPlus } from 'lucide-react';
import { GDriveFolderCreator } from './components/GDriveFolderCreator';

type Tab = 'generator' | 'templates' | 'gdrive-folder';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('generator');
  const theme = usePanelStore(s => s.ui.theme);
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="h-screen flex flex-col">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 py-1.5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <TabButton
          active={activeTab === 'generator'}
          onClick={() => setActiveTab('generator')}
          icon={<Palette className="w-3.5 h-3.5" />}
          label="Banner Generator"
        />
        <TabButton
          active={activeTab === 'templates'}
          onClick={() => setActiveTab('templates')}
          icon={<FileCode className="w-3.5 h-3.5" />}
          label="Template Editor"
        />
        <TabButton
          active={activeTab === 'gdrive-folder'}
          onClick={() => setActiveTab('gdrive-folder')}
          icon={<FolderPlus className="w-3.5 h-3.5" />}
          label="GDrive Folder Creation"
        />
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto">
        <ErrorBoundary fallbackTitle="Banner Generator crashed">
          {activeTab === 'generator' && <FlyerApp />}
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="Template Editor crashed">
          {activeTab === 'templates' && <TemplateManager darkMode={isDark} />}
        </ErrorBoundary>
        <ErrorBoundary fallbackTitle="GDrive Folder Creation crashed">
          {activeTab === 'gdrive-folder' && <GDriveFolderCreator />}
        </ErrorBoundary>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
        active
          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-700/60'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function App() {
  return (
    <ErrorBoundary fallbackTitle="Application error">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
