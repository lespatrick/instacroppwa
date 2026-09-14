import React from 'react';
import { Download, Loader2, Image as ImageIcon, Archive } from 'lucide-react';
import type { ExportSettings, ExportStats, InstagramPreset } from '../engine/types';
import { canSaveToGallery } from '../engine/exportHelper';

interface ExportToolbarProps {
  settings: ExportSettings;
  onSettingsChange: (updater: (prev: ExportSettings) => ExportSettings) => void;
  stats: ExportStats;
  preset: InstagramPreset;
  totalPhotos?: number;
  isExporting: boolean;
  batchProgress?: { current: number; total: number } | null;
  onExportGallery: () => void;
  onExportDownload?: () => void;
  onExportBatch?: () => void;
}

export const ExportToolbar: React.FC<ExportToolbarProps> = ({
  settings,
  onSettingsChange,
  stats,
  preset,
  totalPhotos = 1,
  isExporting,
  batchProgress,
  onExportGallery,
  onExportDownload,
  onExportBatch,
}) => {
  const supportsGalleryShare = typeof window !== 'undefined' && canSaveToGallery();

  return (
    <div className="flex flex-col gap-2.5">
      {/* iOS Grouped List Table */}
      <div className="rounded-2xl bg-ios-card/90 border border-white/10 overflow-hidden divide-y divide-white/10">
        {/* Row 1: Format Switch (JPEG / WebP) */}
        <div className="flex items-center justify-between p-3">
          <span className="text-[13px] font-medium text-white">Format pliku</span>
          
          <div className="flex p-0.5 rounded-lg bg-ios-secondary border border-white/10">
            <button
              onClick={() =>
                onSettingsChange((prev) => ({
                  ...prev,
                  format: 'image/jpeg',
                }))
              }
              className={`px-3 py-1 rounded-[6px] text-xs font-semibold transition-all ${
                settings.format === 'image/jpeg'
                  ? 'bg-ios-tertiary text-white shadow-sm'
                  : 'text-ios-secondaryLabel hover:text-white'
              }`}
            >
              JPEG (IG)
            </button>
            <button
              onClick={() =>
                onSettingsChange((prev) => ({
                  ...prev,
                  format: 'image/webp',
                }))
              }
              className={`px-3 py-1 rounded-[6px] text-xs font-semibold transition-all ${
                settings.format === 'image/webp'
                  ? 'bg-ios-tertiary text-white shadow-sm'
                  : 'text-ios-secondaryLabel hover:text-white'
              }`}
            >
              WebP
            </button>
          </div>
        </div>

        {/* Row 2: Quality Slider */}
        <div className="flex flex-col gap-1.5 p-3">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-medium text-white">Jakość kompresji</span>
            <span className="font-mono text-ios-yellow font-semibold text-xs">
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
            className="w-full my-1"
          />
        </div>

        {/* Row 3: Unsharp Mask Toggle */}
        <div className="flex items-center justify-between p-3">
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-white">Wyostrzanie (Unsharp)</span>
            <span className="text-[11px] text-ios-secondaryLabel">Zachowuje detale po zmniejszeniu</span>
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

        {/* Row 4: Estimated File Size */}
        <div className="flex items-center justify-between p-3 bg-white/[0.02]">
          <span className="text-[12px] text-ios-secondaryLabel">Szacowany rozmiar (bieżące)</span>
          <span className="font-mono text-xs font-semibold text-white">
            {stats.sizeFormatted}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-1">
        {/* Save Current Photo */}
        <button
          onClick={onExportGallery}
          disabled={isExporting}
          className="w-full py-3 px-5 rounded-2xl bg-white text-black font-semibold text-[14px] hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-ios-card disabled:opacity-50"
        >
          {isExporting && !batchProgress ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Przetwarzanie...</span>
            </>
          ) : supportsGalleryShare ? (
            <>
              <ImageIcon className="w-4 h-4 text-ios-blue stroke-[2.5]" />
              <span>Zapisz w Zdjęciach ({preset.ratioText})</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>Pobierz plik ({preset.ratioText})</span>
            </>
          )}
        </button>

        {/* Batch Export All Photos (if multiple photos in session) */}
        {totalPhotos > 1 && onExportBatch && (
          <button
            onClick={onExportBatch}
            disabled={isExporting}
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-ig-yellow via-ig-pink to-ig-purple text-white font-bold text-[13px] shadow-glow-ig hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {batchProgress ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Przetwarzanie serii: {batchProgress.current} z {batchProgress.total}...</span>
              </>
            ) : (
              <>
                <Archive className="w-4 h-4" />
                <span>Eksportuj całą serię ({totalPhotos} zdjęć w ZIP)</span>
              </>
            )}
          </button>
        )}

        {/* Direct Download of single file fallback */}
        {supportsGalleryShare && onExportDownload && (
          <button
            onClick={onExportDownload}
            disabled={isExporting}
            className="w-full py-1.5 px-4 rounded-xl text-xs font-medium text-ios-secondaryLabel hover:text-white transition-colors flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Pobierz bieżące jako plik</span>
          </button>
        )}
      </div>
    </div>
  );
};
