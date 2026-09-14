import React from 'react';
import { DownloadCloud, Image as ImageIcon, RotateCcw, WifiOff, Check, ArrowLeft } from 'lucide-react';
import type { LoadedImageMeta } from '../engine/types';

interface HeaderProps {
  imageMeta: LoadedImageMeta | null;
  isOffline: boolean;
  canInstall: boolean;
  isExporting: boolean;
  onInstall: () => void;
  onOpenNew: () => void;
  onResetCrop: () => void;
  onExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  imageMeta,
  isOffline,
  canInstall,
  isExporting,
  onInstall,
  onOpenNew,
  onResetCrop,
  onExport,
}) => {
  return (
    <header className="pt-[max(env(safe-area-inset-top),0.25rem)] pl-[max(env(safe-area-inset-left),0.75rem)] pr-[max(env(safe-area-inset-right),0.75rem)] pb-1.5 ios-nav-bar sticky top-0 z-30 flex items-center justify-between shrink-0 select-none">
      {/* Left Action / Brand */}
      <div className="flex items-center gap-1">
        {imageMeta ? (
          <button
            onClick={onOpenNew}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-ios-blue hover:bg-white/10 active:opacity-60 text-[14px] font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Zdjęcia</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 py-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-ig-yellow via-ig-pink to-ig-purple p-0.5 flex items-center justify-center shadow-sm">
              <div className="w-full h-full bg-black rounded-[6px] flex items-center justify-center">
                <ImageIcon className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <span className="font-semibold text-[15px] tracking-tight text-white">
              InstaCrop
            </span>
          </div>
        )}
      </div>

      {/* Center Title / Info */}
      <div className="text-center">
        {imageMeta ? (
          <div className="flex flex-col items-center">
            <span className="text-[13px] font-semibold text-white/90 truncate max-w-[130px] sm:max-w-[200px]">
              {imageMeta.name}
            </span>
            <span className="text-[10px] text-ios-secondaryLabel font-mono leading-none mt-0.5">
              {imageMeta.originalWidth}×{imageMeta.originalHeight}
            </span>
          </div>
        ) : (
          <span className="text-[11px] font-medium text-ios-secondaryLabel hidden sm:inline">
            100% Offline • Instagram Formats
          </span>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {isOffline && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-ios-yellow text-[11px] font-medium">
            <WifiOff className="w-3 h-3" />
            <span className="hidden xs:inline">Offline</span>
          </div>
        )}

        {canInstall && (
          <button
            onClick={onInstall}
            className="p-1.5 rounded-full text-ios-blue hover:bg-white/10 active:opacity-60 transition-all"
            title="Zainstaluj PWA"
          >
            <DownloadCloud className="w-4 h-4" />
          </button>
        )}

        {imageMeta && (
          <>
            <button
              onClick={onResetCrop}
              className="p-1.5 rounded-full text-ios-secondaryLabel hover:text-white hover:bg-white/10 active:opacity-60 transition-all"
              title="Resetuj kadr"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onExport}
              disabled={isExporting}
              className="px-3.5 py-1 rounded-full bg-ios-yellow text-black font-semibold text-[13px] tracking-tight hover:brightness-110 active:scale-95 transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Gotowe</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};
