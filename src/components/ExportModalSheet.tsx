import React, { useEffect, useRef } from 'react';
import { 
  X, 
  Download, 
  Image as ImageIcon, 
  Archive, 
  Sparkles, 
  Loader2, 
  SlidersHorizontal
} from 'lucide-react';
import type { ExportSettings, ExportStats, InstagramPreset } from '../engine/types';
import { canSaveToGallery } from '../engine/exportHelper';

interface ExportModalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ExportSettings;
  onSettingsChange: (updater: (prev: ExportSettings) => ExportSettings) => void;
  stats: ExportStats;
  preset: InstagramPreset;
  totalPhotos: number;
  isExporting: boolean;
  batchProgress?: { current: number; total: number } | null;
  onExportGallery: () => void;
  onExportDownload: () => void;
  onExportBatch?: () => void;
}

export const ExportModalSheet: React.FC<ExportModalSheetProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  stats,
  preset,
  totalPhotos,
  isExporting,
  batchProgress,
  onExportGallery,
  onExportDownload,
  onExportBatch,
}) => {
  const supportsGalleryShare = typeof window !== 'undefined' && canSaveToGallery();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isExporting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isExporting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center select-none">
      {/* Backdrop with smooth blur */}
      <div
        onClick={() => {
          if (!isExporting) onClose();
        }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
      />

      {/* Sheet Content Card */}
      <div
        ref={sheetRef}
        className="relative w-full sm:max-w-lg bg-ios-bg/95 backdrop-blur-2xl border-t sm:border border-white/15 rounded-t-[32px] sm:rounded-3xl shadow-2xl p-5 sm:p-6 pb-[max(env(safe-area-inset-bottom),1.25rem)] flex flex-col gap-4 max-h-[90dvh] overflow-y-auto animate-slide-up z-10"
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="w-12 h-1.5 rounded-full bg-white/25 mx-auto -mt-1 mb-1 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-ig-yellow via-ig-pink to-ig-purple p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight leading-tight">
                Eksport zdjęcia
              </h3>
              <p className="text-[11px] text-ios-secondaryLabel leading-tight">
                Format: <span className="text-white font-semibold">{preset.ratioText}</span> ({stats.dimensions.width}×{stats.dimensions.height} px)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isExporting}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white flex items-center justify-center transition-all disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Grouped Box (Apple HIG Table) */}
        <div className="rounded-2xl bg-ios-card/90 border border-white/10 overflow-hidden divide-y divide-white/10 text-left">
          {/* Format Switch */}
          <div className="flex items-center justify-between p-3.5">
            <div>
              <span className="text-[13px] font-medium text-white block">Format pliku</span>
              <span className="text-[11px] text-ios-secondaryLabel">
                {settings.format === 'image/jpeg' ? 'Najlepszy dla Instagrama' : 'Wysoka kompresja'}
              </span>
            </div>

            <div className="flex p-0.5 rounded-xl bg-ios-secondary border border-white/10">
              <button
                onClick={() =>
                  onSettingsChange((prev) => ({
                    ...prev,
                    format: 'image/jpeg',
                  }))
                }
                className={`px-3 py-1.5 rounded-[9px] text-xs font-semibold transition-all ${
                  settings.format === 'image/jpeg'
                    ? 'bg-ios-tertiary text-white shadow-sm'
                    : 'text-ios-secondaryLabel hover:text-white'
                }`}
              >
                JPEG
              </button>
              <button
                onClick={() =>
                  onSettingsChange((prev) => ({
                    ...prev,
                    format: 'image/webp',
                  }))
                }
                className={`px-3 py-1.5 rounded-[9px] text-xs font-semibold transition-all ${
                  settings.format === 'image/webp'
                    ? 'bg-ios-tertiary text-white shadow-sm'
                    : 'text-ios-secondaryLabel hover:text-white'
                }`}
              >
                WebP
              </button>
            </div>
          </div>

          {/* Quality Slider */}
          <div className="flex flex-col gap-2 p-3.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-medium text-white">Jakość kompresji</span>
              <span className="font-mono text-ios-yellow font-bold text-xs">
                {Math.round(settings.quality * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.70"
              max="1.0"
              step="0.01"
              value={settings.quality}
              onChange={(e) =>
                onSettingsChange((prev) => ({
                  ...prev,
                  quality: parseFloat(e.target.value),
                }))
              }
              className="w-full accent-ios-yellow h-2 bg-ios-secondary rounded-lg"
            />
          </div>

          {/* Unsharp Mask Sharpening */}
          <div className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-ios-yellow shrink-0" />
              <div>
                <span className="text-[13px] font-medium text-white block">Wyostrzanie Unsharp</span>
                <span className="text-[11px] text-ios-secondaryLabel">Poprawia ostrość po skalowaniu</span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableSharpening}
                onChange={() =>
                  onSettingsChange((prev) => ({
                    ...prev,
                    enableSharpening: !prev.enableSharpening,
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-ios-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ios-green"></div>
            </label>
          </div>

          {/* Estimated Size */}
          <div className="flex items-center justify-between p-3.5 bg-white/[0.02]">
            <span className="text-[12px] text-ios-secondaryLabel">Szacowany rozmiar pliku</span>
            <span className="font-mono text-xs font-bold text-white">
              {stats.sizeFormatted}
            </span>
          </div>
        </div>

        {/* Action Export Buttons */}
        <div className="flex flex-col gap-2.5 pt-1">
          {/* Primary Save Action */}
          <button
            onClick={onExportGallery}
            disabled={isExporting}
            className="w-full h-12 rounded-2xl bg-white text-black font-bold text-[15px] hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-ios-card disabled:opacity-50"
          >
            {isExporting && !batchProgress ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-black" />
                <span>Przetwarzanie...</span>
              </>
            ) : supportsGalleryShare ? (
              <>
                <ImageIcon className="w-5 h-5 text-ios-blue stroke-[2.5]" />
                <span>Zapisz w Zdjęciach</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5 stroke-[2.5]" />
                <span>Pobierz plik ({preset.ratioText})</span>
              </>
            )}
          </button>

          {/* Bulk Export all photos */}
          {totalPhotos > 1 && onExportBatch && (
            <button
              onClick={onExportBatch}
              disabled={isExporting}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-ig-yellow via-ig-pink to-ig-purple text-white font-bold text-[14px] shadow-glow-ig hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {batchProgress ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Eksport serii: {batchProgress.current} z {batchProgress.total}...</span>
                </>
              ) : (
                <>
                  <Archive className="w-5 h-5" />
                  <span>Eksportuj całą serię ({totalPhotos} zdjęć w ZIP)</span>
                </>
              )}
            </button>
          )}

          {/* Secondary download option if share is supported */}
          {supportsGalleryShare && (
            <button
              onClick={onExportDownload}
              disabled={isExporting}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-ios-secondaryLabel hover:text-white transition-colors flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Pobierz bieżące jako plik (.jpg)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
