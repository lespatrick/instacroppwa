import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useImageLoader } from './hooks/useImageLoader';
import { usePWA } from './hooks/usePWA';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { PhotoFilmstrip } from './components/PhotoFilmstrip';
import { CropViewport } from './components/CropViewport';
import { PresetSelector } from './components/PresetSelector';
import { BackgroundControls } from './components/BackgroundControls';
import { ExportToolbar } from './components/ExportToolbar';
import { ExportModalSheet } from './components/ExportModalSheet';
import { DEFAULT_PRESET } from './engine/presets';
import type { 
  CropState, 
  ExportSettings, 
  ExportStats, 
  GridSettings, 
  InstagramPreset,
  PhotoItem,
  LoadedImageMeta
} from './engine/types';
import { 
  calculateTargetDimensions, 
  extractDominantColor, 
  renderProcessedCanvas 
} from './engine/imageProcessor';
import { 
  canvasToBlob, 
  downloadBlob, 
  formatBytes, 
  generateExportFilename,
  saveToGalleryOrDownload,
  exportBatchPhotos
} from './engine/exportHelper';
import {
  saveSessionToDB,
  restoreSessionFromDB,
  clearSessionDB
} from './engine/storageHelper';
import { 
  Ratio, 
  Palette, 
  Share
} from 'lucide-react';

type MobileMode = 'aspect' | 'background';

export const App: React.FC = () => {
  // PWA Integration
  const { isOffline, canInstall, triggerInstall } = usePWA();

  // Multi-photo series state
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [isRestored, setIsRestored] = useState<boolean>(false);

  // Restore session from IndexedDB on initial mount (e.g. after iOS Safari background purge)
  useEffect(() => {
    let isMounted = true;
    restoreSessionFromDB().then((savedSession) => {
      if (isMounted && savedSession && savedSession.photos.length > 0) {
        setPhotos(savedSession.photos);
        setActivePhotoIndex(savedSession.activeIndex || 0);
      }
      if (isMounted) setIsRestored(true);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-persist session to IndexedDB whenever photos or active index change
  useEffect(() => {
    if (!isRestored) return;
    if (photos.length > 0) {
      saveSessionToDB(photos, activePhotoIndex);
    } else {
      clearSessionDB();
    }
  }, [photos, activePhotoIndex, isRestored]);

  // Active photo shortcut
  const activePhoto: PhotoItem | undefined = photos[activePhotoIndex];
  const imageMeta = activePhoto?.meta || null;
  const preset = activePhoto?.preset || DEFAULT_PRESET;
  const cropState = activePhoto?.cropState || {
    zoom: 1.0,
    pan: { x: 0, y: 0 },
    rotation: 0,
    flipH: false,
    flipV: false,
    fitMode: 'cover',
    bgColor: '#000000',
    bgStyle: 'black',
    dominantColor: '#18181b',
  };

  const [activeMobileMode, setActiveMobileMode] = useState<MobileMode>('aspect');

  const [gridSettings, setGridSettings] = useState<GridSettings>({
    showRuleOfThirds: false,
    showProfileGridPreview: false,
  });

  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'image/jpeg',
    quality: 0.92,
    enableSharpening: true,
    sharpenAmount: 25,
  });

  const [exportStats, setExportStats] = useState<ExportStats>({
    sizeBytes: 0,
    sizeFormatted: '–',
    dimensions: { width: 1080, height: 1350 },
    isEstimating: false,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [isExportSheetOpen, setIsExportSheetOpen] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  // Updates active photo's cropState
  const updateActiveCropState = (updater: CropState | ((prev: CropState) => CropState)) => {
    setPhotos((prev) => {
      if (!prev[activePhotoIndex]) return prev;
      const nextPhotos = [...prev];
      const current = nextPhotos[activePhotoIndex];
      const nextCrop = typeof updater === 'function' ? updater(current.cropState) : updater;
      nextPhotos[activePhotoIndex] = { ...current, cropState: nextCrop };
      return nextPhotos;
    });
  };

  // Updates active photo's preset
  const handleSelectPreset = (newPreset: InstagramPreset) => {
    setPhotos((prev) => {
      if (!prev[activePhotoIndex]) return prev;
      const nextPhotos = [...prev];
      nextPhotos[activePhotoIndex] = { ...nextPhotos[activePhotoIndex], preset: newPreset };
      return nextPhotos;
    });
  };

  // Helper to build a PhotoItem from loaded meta
  const createPhotoItem = (meta: LoadedImageMeta): PhotoItem => {
    const dominant = extractDominantColor(meta.element);
    return {
      id: Math.random().toString(36).substring(2, 11),
      meta,
      preset: DEFAULT_PRESET,
      cropState: {
        zoom: 1.0,
        pan: { x: 0, y: 0 },
        rotation: 0,
        flipH: false,
        flipV: false,
        fitMode: 'cover',
        bgColor: '#000000',
        bgStyle: 'black',
        dominantColor: dominant,
      },
    };
  };

  // Image Loading Hook
  const {
    isDragging,
    processFiles,
    revokeUrl,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useImageLoader({
    onError: (msg) => console.error(msg),
    onSuccess: (metaList) => {
      const newItems = metaList.map(createPhotoItem);
      setPhotos((prev) => {
        const combined = [...prev, ...newItems];
        return combined;
      });
    },
  });

  // Handle demo sample image generation
  const handleLoadSample = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1280;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Sunset gradient & mountains
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 1280);
    skyGrad.addColorStop(0, '#1a103c');
    skyGrad.addColorStop(0.35, '#5c2266');
    skyGrad.addColorStop(0.65, '#bd3f64');
    skyGrad.addColorStop(0.85, '#f0744f');
    skyGrad.addColorStop(1, '#f9c87c');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 1920, 1280);

    const sunGrad = ctx.createRadialGradient(960, 680, 20, 960, 680, 240);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.3, '#fff2a8');
    sunGrad.addColorStop(0.7, 'rgba(255, 140, 80, 0.4)');
    sunGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(960, 680, 240, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e0f2b';
    ctx.beginPath();
    ctx.moveTo(0, 1280);
    ctx.lineTo(0, 850);
    ctx.lineTo(350, 650);
    ctx.lineTo(750, 900);
    ctx.lineTo(1200, 580);
    ctx.lineTo(1650, 880);
    ctx.lineTo(1920, 720);
    ctx.lineTo(1920, 1280);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0f0517';
    ctx.beginPath();
    ctx.moveTo(0, 1280);
    ctx.lineTo(0, 980);
    ctx.lineTo(450, 820);
    ctx.lineTo(950, 1020);
    ctx.lineTo(1450, 780);
    ctx.lineTo(1920, 950);
    ctx.lineTo(1920, 1280);
    ctx.closePath();
    ctx.fill();

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'demo_sunset_landscape.jpg', { type: 'image/jpeg' });
        processFiles([file]);
      }
    }, 'image/jpeg', 0.95);
  }, [processFiles]);

  // Reset crop transforms for active photo
  const handleResetCrop = () => {
    updateActiveCropState((prev) => ({
      ...prev,
      zoom: 1.0,
      pan: { x: 0, y: 0 },
      rotation: 0,
      flipH: false,
      flipV: false,
    }));
  };

  // Open file picker to append or start fresh
  const handleOpenNew = () => {
    const input = document.getElementById('file-upload-start') as HTMLInputElement;
    if (input) input.click();
  };

  // Remove photo from batch
  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => {
      const target = prev[index];
      if (target) revokeUrl(target.meta.src);
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        setActivePhotoIndex(0);
      } else if (activePhotoIndex >= next.length) {
        setActivePhotoIndex(next.length - 1);
      }
      return next;
    });
  };

  // Bulk action: apply current preset to all photos in series
  const handleApplyPresetToAll = () => {
    if (!activePhoto) return;
    const currentPreset = activePhoto.preset;
    setPhotos((prev) =>
      prev.map((item) => ({
        ...item,
        preset: currentPreset,
      }))
    );
  };

  // Real-time debounced file size estimator for active photo
  const estimateTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!imageMeta || !activePhoto) return;

    if (estimateTimerRef.current) {
      window.clearTimeout(estimateTimerRef.current);
    }

    setExportStats((prev) => ({ ...prev, isEstimating: true }));

    estimateTimerRef.current = window.setTimeout(async () => {
      try {
        const dims = calculateTargetDimensions(preset, imageMeta, cropState.rotation);
        const offscreenCanvas = document.createElement('canvas');
        renderProcessedCanvas(
          offscreenCanvas,
          imageMeta.element,
          dims,
          cropState,
          exportSettings
        );

        const blob = await canvasToBlob(offscreenCanvas, exportSettings.format, exportSettings.quality);
        setExportStats({
          sizeBytes: blob.size,
          sizeFormatted: formatBytes(blob.size),
          dimensions: dims,
          isEstimating: false,
        });
      } catch (e) {
        setExportStats((prev) => ({ ...prev, isEstimating: false }));
      }
    }, 250);

    return () => {
      if (estimateTimerRef.current) window.clearTimeout(estimateTimerRef.current);
    };
  }, [activePhoto, imageMeta, preset, cropState, exportSettings]);

  // Generate rendered blob helper for active photo
  const getRenderedBlob = async (): Promise<{ blob: Blob; filename: string } | null> => {
    if (!imageMeta) return null;
    const dims = calculateTargetDimensions(preset, imageMeta, cropState.rotation);
    const exportCanvas = document.createElement('canvas');
    renderProcessedCanvas(
      exportCanvas,
      imageMeta.element,
      dims,
      cropState,
      exportSettings
    );

    const blob = await canvasToBlob(exportCanvas, exportSettings.format, exportSettings.quality);
    const filename = generateExportFilename(imageMeta.name, preset, exportSettings.format);
    return { blob, filename };
  };

  // Export & Save to Gallery (Photos) via Web Share API or download
  const handleExportGallery = async () => {
    if (!imageMeta) return;

    setIsExporting(true);
    try {
      const result = await getRenderedBlob();
      if (!result) return;

      await saveToGalleryOrDownload(result.blob, result.filename);
      setIsExportSheetOpen(false);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  // Direct single file download
  const handleExportDownload = async () => {
    if (!imageMeta) return;

    setIsExporting(true);
    try {
      const result = await getRenderedBlob();
      if (!result) return;

      downloadBlob(result.blob, result.filename);
      setIsExportSheetOpen(false);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  // Bulk Export All Photos in Batch (ZIP / Multi-Share)
  const handleExportBatch = async () => {
    if (photos.length === 0) return;

    setIsExporting(true);
    setBatchProgress({ current: 1, total: photos.length });

    try {
      const res = await exportBatchPhotos(photos, exportSettings, (current, total) => {
        setBatchProgress({ current, total });
      });

      if (res.success) {
        setIsExportSheetOpen(false);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsExporting(false);
      setBatchProgress(null);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="h-[100dvh] max-h-[100dvh] w-screen bg-black text-white flex flex-col font-sans overflow-hidden select-none"
    >
      {/* iOS Navigation Bar */}
      <Header
        imageMeta={imageMeta}
        isOffline={isOffline}
        canInstall={canInstall}
        isExporting={isExporting}
        onInstall={triggerInstall}
        onOpenNew={handleOpenNew}
        onResetCrop={handleResetCrop}
        onExport={() => setIsExportSheetOpen(true)}
      />

      {/* Modern iOS Bottom Sheet Modal for Export on Mobile/Tablet/Desktop */}
      <ExportModalSheet
        isOpen={isExportSheetOpen}
        onClose={() => setIsExportSheetOpen(false)}
        settings={exportSettings}
        onSettingsChange={setExportSettings}
        stats={exportStats}
        preset={preset}
        totalPhotos={photos.length}
        isExporting={isExporting}
        batchProgress={batchProgress}
        onExportGallery={handleExportGallery}
        onExportDownload={handleExportDownload}
        onExportBatch={handleExportBatch}
      />

      {/* Hidden Global File Input */}
      <input
        id="file-upload-start"
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
          }
        }}
        className="hidden"
      />

      {/* Main Content Area */}
      {photos.length === 0 || !imageMeta ? (
        <DropZone
          onFilesSelected={processFiles}
          isDragging={isDragging}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onLoadSample={handleLoadSample}
        />
      ) : (
        <main className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden pl-[max(env(safe-area-inset-left),0px)] pr-[max(env(safe-area-inset-right),0px)]">
          {/* Left / Center: Interactive Canvas Studio Viewport + Filmstrip */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
            {/* Filmstrip Carousel */}
            <PhotoFilmstrip
              photos={photos}
              activeIndex={activePhotoIndex}
              onSelectPhoto={(idx) => setActivePhotoIndex(idx)}
              onRemovePhoto={handleRemovePhoto}
              onAddMore={(files) => processFiles(files)}
              onApplyPresetToAll={handleApplyPresetToAll}
            />

            {/* Interactive Crop Viewport */}
            <CropViewport
              imageMeta={imageMeta}
              preset={preset}
              cropState={cropState}
              onCropChange={updateActiveCropState}
              gridSettings={gridSettings}
              onGridSettingsChange={setGridSettings}
            />
          </div>

          {/* DESKTOP Side Inspector */}
          <aside className="hidden lg:flex w-96 xl:w-[400px] bg-ios-card/80 backdrop-blur-2xl border-l border-white/10 p-5 overflow-y-auto max-h-[calc(100dvh-3.5rem)] flex-col gap-4 shrink-0 pb-[max(env(safe-area-inset-bottom),1rem)]">
            <PresetSelector
              selectedPresetId={preset.id}
              onSelectPreset={handleSelectPreset}
            />

            <BackgroundControls
              cropState={cropState}
              onCropChange={updateActiveCropState}
            />

            <ExportToolbar
              settings={exportSettings}
              onSettingsChange={setExportSettings}
              stats={exportStats}
              preset={preset}
              totalPhotos={photos.length}
              isExporting={isExporting}
              batchProgress={batchProgress}
              onExportGallery={handleExportGallery}
              onExportDownload={handleExportDownload}
              onExportBatch={handleExportBatch}
            />
          </aside>

          {/* MOBILE iOS Edit Deck */}
          <div className="flex lg:hidden flex-col ios-bottom-sheet shrink-0 pb-[max(env(safe-area-inset-bottom),0.6rem)]">
            <div className="px-3.5 pt-2.5 pb-1 max-h-36 sm:max-h-40 overflow-y-auto">
              {activeMobileMode === 'aspect' && (
                <PresetSelector
                  selectedPresetId={preset.id}
                  onSelectPreset={handleSelectPreset}
                />
              )}

              {activeMobileMode === 'background' && (
                <BackgroundControls
                  cropState={cropState}
                  onCropChange={updateActiveCropState}
                />
              )}
            </div>

            {/* iOS Bottom Tool Selector Bar */}
            <div className="flex items-center justify-around py-1.5 px-6 border-t border-white/10">
              <button
                onClick={() => setActiveMobileMode('aspect')}
                className={`flex flex-col items-center gap-0.5 transition-all active:scale-90 ${
                  activeMobileMode === 'aspect' ? 'text-ios-yellow' : 'text-ios-secondaryLabel hover:text-white'
                }`}
              >
                <Ratio className="w-4 h-4" />
                <span className="text-[10px] font-medium tracking-tight">Kadr</span>
                <span className={`w-1 h-1 rounded-full ${activeMobileMode === 'aspect' ? 'bg-ios-yellow' : 'bg-transparent'}`}></span>
              </button>

              <button
                onClick={() => setActiveMobileMode('background')}
                className={`flex flex-col items-center gap-0.5 transition-all active:scale-90 ${
                  activeMobileMode === 'background' ? 'text-ios-yellow' : 'text-ios-secondaryLabel hover:text-white'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span className="text-[10px] font-medium tracking-tight">Tło</span>
                <span className={`w-1 h-1 rounded-full ${activeMobileMode === 'background' ? 'bg-ios-yellow' : 'bg-transparent'}`}></span>
              </button>

              <button
                onClick={() => setIsExportSheetOpen(true)}
                className="flex flex-col items-center gap-0.5 transition-all active:scale-90 text-ios-yellow hover:brightness-110"
              >
                <Share className="w-4 h-4" />
                <span className="text-[10px] font-semibold tracking-tight">Eksport</span>
                <span className="w-1 h-1 rounded-full bg-ios-yellow"></span>
              </button>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

export default App;
