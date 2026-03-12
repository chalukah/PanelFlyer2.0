import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { usePanelStore } from '../panelStore';

export function ConfirmDialog() {
  const dialog = usePanelStore((s) => s.ui.confirmDialog);
  const hideConfirm = usePanelStore((s) => s.hideConfirm);

  useEffect(() => {
    if (!dialog) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hideConfirm();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [dialog, hideConfirm]);

  if (!dialog) return null;

  const handleConfirm = () => {
    dialog.onConfirm();
    hideConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in"
      onClick={hideConfirm}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full mx-4 animate-slide-in"
        style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 id="confirm-title" className="text-lg font-semibold text-black mb-2">
                {dialog.title}
              </h3>
              <p className="text-sm text-gray-500">
                {dialog.message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={hideConfirm}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors font-medium text-sm"
            autoFocus
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
