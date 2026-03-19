import { useRef } from 'react';
import { PINK } from './constants';

export function HeadshotUpload({
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
        className="w-14 h-14 rounded-full overflow-hidden shrink-0 cursor-pointer transition-all duration-200 hover:scale-105 border-2"
        style={{ borderColor: 'var(--input-border)' }}
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
