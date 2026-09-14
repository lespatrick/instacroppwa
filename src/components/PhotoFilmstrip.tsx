import React, { useRef } from 'react';
import { Plus, X, CopyCheck } from 'lucide-react';
import type { PhotoItem } from '../engine/types';

interface PhotoFilmstripProps {
  photos: PhotoItem[];
  activeIndex: number;
  onSelectPhoto: (index: number) => void;
  onRemovePhoto: (index: number) => void;
  onAddMore: (files: FileList) => void;
  onApplyPresetToAll: () => void;
}

export const PhotoFilmstrip: React.FC<PhotoFilmstripProps> = ({
  photos,
  activeIndex,
  onSelectPhoto,
  onRemovePhoto,
  onAddMore,
  onApplyPresetToAll,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (photos.length <= 1) return null;

  return (
    <div className="w-full flex flex-col gap-1.5 px-3 py-1.5 bg-ios-card/80 backdrop-blur-xl border-b border-white/10 shrink-0 select-none">
      {/* Top Bar: Counter & Quick Bulk Action */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold text-white/90">
          Seria zdjęć ({activeIndex + 1} z {photos.length})
        </span>

        <button
          onClick={onApplyPresetToAll}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full ios-pill text-[10px] font-medium text-ios-yellow hover:bg-white/10 active:scale-95 transition-all"
          title="Ustaw ten sam format dla wszystkich zdjęć w serii"
        >
          <CopyCheck className="w-3 h-3" />
          <span>Format do wszystkich</span>
        </button>
      </div>

      {/* Horizontal Thumbnail Strip */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 px-0.5">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onAddMore(e.target.files);
            }
          }}
          className="hidden"
        />

        {photos.map((item, idx) => {
          const isActive = idx === activeIndex;

          return (
            <div
              key={item.id}
              onClick={() => onSelectPhoto(idx)}
              className={`relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden cursor-pointer group transition-all duration-150 ${
                isActive
                  ? 'ring-2 ring-white shadow-md scale-105'
                  : 'opacity-60 hover:opacity-100 ring-1 ring-white/20'
              }`}
            >
              <img
                src={item.meta.src}
                alt={item.meta.name}
                className="w-full h-full object-cover"
              />

              {/* Aspect Ratio Badge on thumbnail */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/75 backdrop-blur-xs py-0.2 text-center pointer-events-none">
                <span className="text-[8px] font-bold text-white tracking-tighter">
                  {item.preset.ratioText}
                </span>
              </div>

              {/* Remove Photo Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemovePhoto(idx);
                }}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-sm"
                title="Usuń z serii"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          );
        })}

        {/* Add More Photos Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg border border-dashed border-white/30 hover:border-white flex flex-col items-center justify-center text-white/70 hover:text-white transition-all active:scale-95 bg-white/5"
          title="Dodaj kolejne zdjęcia do serii"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[8px] font-medium leading-none mt-0.5">+ Zdjęcie</span>
        </button>
      </div>
    </div>
  );
};
