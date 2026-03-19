import { Trash2 } from 'lucide-react';
import type { PanelistFormData } from './constants';
import { HeadshotUpload } from './HeadshotUpload';

export function PanelistRow({
  panelist,
  onChange,
  onRemove,
}: {
  panelist: PanelistFormData;
  onChange: (updated: PanelistFormData) => void;
  onRemove: () => void;
}) {
  return (
    <div className="dm-card rounded-2xl p-4 border-[2px] transition-all duration-200">
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
            className="col-span-2 px-3 py-2 rounded-lg border-[2px] dm-input text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1"
          />
          <input
            placeholder="Title / Position"
            value={panelist.title}
            onChange={(e) => onChange({ ...panelist, title: e.target.value })}
            className="px-3 py-2 rounded-lg border-[2px] dm-input text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1"
          />
          <input
            placeholder="Organization"
            value={panelist.org}
            onChange={(e) => onChange({ ...panelist, org: e.target.value })}
            className="px-3 py-2 rounded-lg border-[2px] dm-input text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1"
          />
        </div>
        <button onClick={onRemove} className="p-2 text-red-400 hover:text-red-500 rounded-xl transition-colors shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
