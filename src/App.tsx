import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useImageLoader } from './hooks/useImageLoader';
import { usePWA } from './hooks/usePWA';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { CropViewport } from './components/CropViewport';
import { PresetSelector } from './components/PresetSelector';
import { BackgroundControls } from './components/BackgroundControls';
import { ExportToolbar } from './components/ExportToolbar';
import { DynamicHUD } from './components/DynamicHUD';
import { Toast } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import { DEFAULT_PRESET } from './engine/presets';
import type { 
  CropState, 
  ExportSettings, 
  ExportStats, 
  GridSettings, 
  InstagramPreset 
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
  saveToGalleryOrDownload 
} from './engine/exportHelper';
import { 
  Ratio, 
  Palette, 
  SlidersHorizontal 
} from 'lucide-react';

type MobileMode = 'aspect' | 'background' | 'export';

export const App: React.FC = () => {
  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = useCallback((type: 'error' | 'success' | 'info', text: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // PWA Integration
  const { isOffline, canInstall, triggerInstall } = usePWA();

  // Preset & Editor State
  const [preset, setPreset] = useState<InstagramPreset>(DEFAULT_PRESET);
  const [activeMobileMode, setActiveMobileMode] = useState<MobileMode>('aspect');

  const [gridSettings, setGridSettings] = useState<GridSettings>({
    showRuleOfThirds: false,
    showProfileGridPreview: false,
  });

  const [cropState, setCropState] = useState<CropState>({
    zoom: 1.0,
    pan: { x: 0, y: 0 },
    rotation: 0,
    flipH: false,
    flipV: false,
    fitMode: 'cover',
    bgColor: '#000000',
    bgStyle: 'black',
    dominantColor: '#18181b',
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

  // Image Loading Hook
  const {
    imageMeta,
    isDragging,
    processFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useImageLoader({
    onError: (msg) => addToast('error', msg),
    onSuccess: (meta) => {
      const dominant = extractDominantColor(meta.element);
      setCropState((prev) => ({
        ...prev,
        zoom: 1.0,
        pan: { x: 0, y: 0 },
        rotation: 0,
        flipH: false,
        flipV: false,
        dominantColor: dominant,
        bgColor: prev.bgStyle === 'dominant' ? dominant : prev.bgColor,
      }));
      addToast('success', `Wczytano: ${meta.name}`);
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
        processFile(file);
      }
    }, 'image/jpeg', 0.95);
  }, [processFile]);

  // Reset crop transforms
  const handleResetCrop = () => {
    setCropState((prev) => ({
      ...prev,
      zoom: 1.0,
      pan: { x: 0, y: 0 },
      rotation: 0,
      flipH: false,
      flipV: false,
    }));
    addToast('info', 'Zresetowano pozycję kadru.');
  };

  // Open file picker
  const handleOpenNew = () => {
    const input = document.getElementById('file-upload-start') as HTMLInputElement;
    if (input) input.click();
  };

  // Real-time debounced file size estimator
  const estimateTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!imageMeta) return;

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
  }, [imageMeta, preset, cropState, exportSettings]);

  // Generate rendered blob helper
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

      const res = await saveToGalleryOrDownload(result.blob, result.filename);
      addToast('success', res.message);
    } catch (err: any) {
      addToast('error', `Błąd zapisu: ${err.message || 'Nieznany błąd'}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Direct file download
  const handleExportDownload = async () => {
    if (!imageMeta) return;

    setIsExporting(true);
    try {
      const result = await getRenderedBlob();
      if (!result) return;

      downloadBlob(result.blob, result.filename);
      addToast('success', `Pobrano plik: ${result.filename} (${formatBytes(result.blob.size)})`);
    } catch (err: any) {
      addToast('error', `Błąd pobierania: ${err.message || 'Nieznany błąd'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="h-[100dvh] max-h-[100dvh] w-screen bg-black text-white flex flex-col font-sans overflow-hidden select-none"
    >
      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Dynamic Island Capsule HUD */}
      {imageMeta && (
        <DynamicHUD
          preset={preset}
          stats={exportStats}
          isOffline={isOffline}
          isEstimating={exportStats.isEstimating}
          isExporting={isExporting}
        />
      )}

      {/* iOS Navigation Bar */}
      <Header
        imageMeta={imageMeta}
        isOffline={isOffline}
        canInstall={canInstall}
        isExporting={isExporting}
        onInstall={triggerInstall}
        onOpenNew={handleOpenNew}
        onResetCrop={handleResetCrop}
        onExport={handleExportGallery}
      />

      {/* Hidden Global File Input */}
      <input
        id="file-upload-start"
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Main Content Area */}
      {!imageMeta ? (
        <DropZone
          onFileSelected={processFile}
          isDragging={isDragging}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onLoadSample={handleLoadSample}
        />
      ) : (
        <main className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden pl-[max(env(safe-area-inset-left),0px)] pr-[max(env(safe-area-inset-right),0px)]">
          {/* Left / Center: Interactive Canvas Studio Viewport */}
          <CropViewport
            imageMeta={imageMeta}
            preset={preset}
            cropState={cropState}
            onCropChange={setCropState}
            gridSettings={gridSettings}
            onGridSettingsChange={setGridSettings}
          />

          {/* DESKTOP Side Inspector */}
          <aside className="hidden lg:flex w-96 xl:w-[400px] bg-ios-card/80 backdrop-blur-2xl border-l border-white/10 p-5 overflow-y-auto max-h-[calc(100dvh-3.5rem)] flex-col gap-4 shrink-0 pb-[max(env(safe-area-inset-bottom),1rem)]">
            <PresetSelector
              selectedPresetId={preset.id}
              onSelectPreset={(newPreset) => setPreset(newPreset)}
            />

            <BackgroundControls
              cropState={cropState}
              onCropChange={setCropState}
            />

            <ExportToolbar
              settings={exportSettings}
              onSettingsChange={setExportSettings}
              stats={exportStats}
              preset={preset}
              isExporting={isExporting}
              onExportGallery={handleExportGallery}
              onExportDownload={handleExportDownload}
            />
          </aside>

          {/* MOBILE iOS Edit Deck */}
          <div className="flex lg:hidden flex-col ios-bottom-sheet shrink-0 pb-[max(env(safe-area-inset-bottom),0.6rem)]">
            <div className="px-3.5 pt-2.5 pb-1 max-h-36 sm:max-h-40 overflow-y-auto">
              {activeMobileMode === 'aspect' && (
                <PresetSelector
                  selectedPresetId={preset.id}
                  onSelectPreset={(newPreset) => setPreset(newPreset)}
                />
              )}

              {activeMobileMode === 'background' && (
                <BackgroundControls
                  cropState={cropState}
                  onCropChange={setCropState}
                />
              )}

              {activeMobileMode === 'export' && (
                <ExportToolbar
                  settings={exportSettings}
                  onSettingsChange={setExportSettings}
                  stats={exportStats}
                  preset={preset}
                  isExporting={isExporting}
                  onExportGallery={handleExportGallery}
                  onExportDownload={handleExportDownload}
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
                onClick={() => setActiveMobileMode('export')}
                className={`flex flex-col items-center gap-0.5 transition-all active:scale-90 ${
                  activeMobileMode === 'export' ? 'text-ios-yellow' : 'text-ios-secondaryLabel hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-[10px] font-medium tracking-tight">Eksport</span>
                <span className={`w-1 h-1 rounded-full ${activeMobileMode === 'export' ? 'bg-ios-yellow' : 'bg-transparent'}`}></span>
              </button>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

export default App;
