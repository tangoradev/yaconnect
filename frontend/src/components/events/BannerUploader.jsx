import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react';

const isAllowed = (file) => {
  const type = (file?.type || '').toLowerCase();
  return ['image/jpeg', 'image/png', 'image/webp'].includes(type);
};

export default function BannerUploader({ value, onChange }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const previewUrl = useMemo(() => (value ? URL.createObjectURL(value) : null), [value]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const pick = () => inputRef.current?.click();

  const setFile = (file) => {
    if (!file) return;
    if (!isAllowed(file)) {
      alert('Formats autorisés: JPEG, PNG, WebP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Taille max: 10 MB.');
      return;
    }
    onChange(file);
  };

  return (
    <div className="space-y-3">
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 transition ${
          dragOver ? 'border-brand-orange bg-orange-50' : 'border-gray-200 bg-white'
        }`}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
          const file = e.dataTransfer?.files?.[0];
          setFile(file);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0])}
        />

        {value ? (
          <div className="space-y-3">
            <div className="w-full h-48 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
              <img src={previewUrl} alt="Aperçu bannière" className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={pick}
                className="px-4 py-2 rounded-lg bg-brand-blue text-white font-semibold hover:bg-blue-700"
              >
                Remplacer
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 inline-flex items-center gap-2"
              >
                <X size={16} /> Retirer
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-orange-50 text-brand-orange flex items-center justify-center mb-3">
              <UploadCloud size={22} />
            </div>
            <div className="text-sm font-semibold text-gray-900">Bannière de l’événement</div>
            <div className="text-sm text-gray-600 mt-1">
              Glissez‑déposez une image ici, ou <button type="button" className="text-brand-blue font-semibold hover:underline" onClick={pick}>parcourez</button>.
            </div>
            <div className="mt-2 text-xs text-gray-500 inline-flex items-center gap-2">
              <ImageIcon size={14} /> JPEG/PNG/WebP · max 10MB
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
