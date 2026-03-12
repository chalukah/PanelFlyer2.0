import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { usePanelStore } from '../panelStore';

export function Toast() {
  const toast = usePanelStore((s) => s.ui.toast);
  const hideToast = usePanelStore((s) => s.hideToast);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  };

  const colors = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200'
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50 animate-slide-in"
      role="status"
      aria-live="polite"
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border max-w-md ${colors[toast.type]}`}
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      >
        {icons[toast.type]}
        <p className="flex-1 text-sm font-medium">{toast.message}</p>
        <button
          onClick={hideToast}
          className="p-1 hover:bg-black/5 rounded-full transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
