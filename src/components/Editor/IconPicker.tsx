import { useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface IconPickerProps {
  iconUrl: string | null;
  defaultUrl: string;
  folder: 'places' | 'landmarks';
  recordId: string;
  onUploaded: (url: string) => void;
  onReset: () => void;
}

const MAX_BYTES = 1024 * 1024;
const ALLOWED_MIME = new Set(['image/png', 'image/webp']);

async function readImageSize(file: File): Promise<{ w: number; h: number }> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => reject(new Error('Could not decode image'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function IconPicker({ iconUrl, defaultUrl, folder, recordId, onUploaded, onReset }: IconPickerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const preview = iconUrl ?? defaultUrl;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME.has(file.type)) {
      setError('Use a PNG or WebP file.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('File exceeds 1 MB.');
      return;
    }

    try {
      const { w, h } = await readImageSize(file);
      if (w !== h) {
        setError(`Icon must be square. Got ${w}×${h}.`);
        return;
      }
    } catch (err) {
      setError((err as Error).message);
      return;
    }

    const ext = file.type === 'image/webp' ? 'webp' : 'png';
    const path = `${folder}/${recordId}.${ext}`;

    setBusy(true);
    const { error: upErr } = await supabase.storage
      .from('icons')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      setBusy(false);
      setError(`Upload failed: ${upErr.message}`);
      return;
    }

    const { data } = supabase.storage.from('icons').getPublicUrl(path);
    const bustedUrl = `${data.publicUrl}?v=${Date.now()}`;
    setBusy(false);
    onUploaded(bustedUrl);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <img
          src={preview}
          alt="icon preview"
          className="w-12 h-12 rounded-lg border border-[var(--sg-border)] object-contain bg-white"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = defaultUrl; }}
        />
        <div className="flex flex-col gap-1">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/webp"
            onChange={handleFile}
            disabled={busy}
            className="text-xs"
          />
          {iconUrl && (
            <button
              type="button"
              onClick={onReset}
              disabled={busy}
              className="self-start text-xs text-[var(--sg-navy)]/60 hover:text-[var(--sg-navy)] underline"
            >
              Reset to default
            </button>
          )}
        </div>
      </div>
      <p className="text-[11px] text-[var(--sg-navy)]/50">
        PNG or WebP, square, up to 1 MB. Shown at ~40 px on the map.
      </p>
      {error && <p className="text-[11px] text-[var(--sg-crimson)]">{error}</p>}
      {busy && <p className="text-[11px] text-[var(--sg-navy)]/60">Uploading…</p>}
    </div>
  );
}
