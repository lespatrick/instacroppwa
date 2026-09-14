import React, { useRef } from 'react';
import { 
  Image as ImageIcon, 
  Sparkles, 
  ShieldCheck, 
  SlidersHorizontal,
  Clipboard
} from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onLoadSample: () => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onLoadSample,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`h-[100dvh] w-full flex flex-col justify-between p-4 sm:p-8 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1rem)] pl-[max(env(safe-area-inset-left),1rem)] pr-[max(env(safe-area-inset-right),1rem)] overflow-hidden transition-all duration-300 relative ${
        isDragging ? 'bg-ios-card/90' : 'bg-black'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        id="file-upload-start"
      />

      {/* Ambient iOS background lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-ig-purple/15 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-ig-pink/15 rounded-full blur-[100px]"></div>
      </div>

      {/* Top Header Label in iOS HIG style */}
      <div className="w-full flex items-center justify-between z-10 shrink-0 pt-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-ig-yellow via-ig-pink to-ig-purple p-0.5 flex items-center justify-center shadow-lg">
            <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-[15px] font-bold tracking-tight text-white leading-tight">
              InstaCrop Studio
            </h1>
            <p className="text-[10px] text-ios-secondaryLabel leading-tight">
              Apple HIG • iOS 18 Edition
            </p>
          </div>
        </div>

        <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 text-white/80 font-medium border border-white/10">
          PWA Offline
        </span>
      </div>

      {/* Center Hero Card (iOS Liquid Glass Canvas) */}
      <div className="w-full max-w-md mx-auto my-auto flex flex-col items-center text-center z-10 px-2 py-3">
        <div
          onClick={handleClick}
          className={`w-full group cursor-pointer rounded-3xl p-6 sm:p-8 transition-all duration-300 flex flex-col items-center justify-center gap-4 ios-liquid-glass ${
            isDragging
              ? 'border-ios-yellow scale-102 bg-ios-secondary/90 shadow-2xl'
              : 'hover:border-white/25 active:scale-[0.99]'
          }`}
        >
          {/* iOS Aperture Icon Tile */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-ig-yellow via-ig-pink to-ig-purple p-0.5 shadow-2xl group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center">
              <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Dodaj zdjęcie
            </h2>
            <p className="text-xs sm:text-sm text-ios-secondaryLabel max-w-xs mx-auto leading-relaxed">
              Dotknij, aby otworzyć galerię, upuść plik lub wklej ze schowka
            </p>
          </div>

          {/* iOS Primary Action Button */}
          <button
            type="button"
            className="w-full h-12 rounded-2xl bg-white text-black font-semibold text-[14px] hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-ios-card"
          >
            <ImageIcon className="w-4 h-4 stroke-[2.5]" />
            <span>Wybierz z biblioteki</span>
          </button>
        </div>

        {/* Demo Sample Image Button */}
        <button
          onClick={onLoadSample}
          type="button"
          className="mt-3 text-xs text-ios-secondaryLabel hover:text-white transition-colors flex items-center gap-1.5 py-1.5 px-3.5 rounded-full ios-pill active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-ios-yellow" />
          <span>Wypróbuj przykładowe zdjęcie</span>
        </button>
      </div>

      {/* Bottom Inset Grouped Highlights */}
      <div className="w-full max-w-md mx-auto z-10 shrink-0 pb-1">
        <div className="rounded-2xl bg-ios-card/80 border border-white/10 overflow-hidden divide-y divide-white/10 text-left">
          <div className="p-2.5 sm:p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-ios-secondary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-ios-green" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">100% Prywatności na urządzeniu</p>
              <p className="text-[10px] text-ios-secondaryLabel truncate">Zdjęcia przetwarzane wyłącznie w pamięci RAM.</p>
            </div>
          </div>

          <div className="p-2.5 sm:p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-ios-secondary flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-4 h-4 text-ios-yellow" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">Standardy kadrowania Instagram</p>
              <p className="text-[10px] text-ios-secondaryLabel truncate">4:5, 1:1, 1.91:1, 9:16 Stories z podglądem profilu.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="flex items-center gap-1 text-[10px] text-ios-secondaryLabel">
            <Clipboard className="w-3 h-3 text-ios-blue" />
            <span>Obsługa schowka:</span>
            <kbd className="font-mono bg-ios-card px-1.5 py-0.5 rounded border border-white/10 text-white text-[9px]">Cmd+V</kbd>
          </span>
        </div>
      </div>
    </div>
  );
};
