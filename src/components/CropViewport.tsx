import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  FlipHorizontal, 
  Grid, 
  Eye, 
  Move
} from 'lucide-react';
import type { CropState, GridSettings, InstagramPreset, LoadedImageMeta } from '../engine/types';
import { calculateTargetDimensions, renderProcessedCanvas } from '../engine/imageProcessor';
import { GridOverlay } from './GridOverlay';

interface CropViewportProps {
  imageMeta: LoadedImageMeta;
  preset: InstagramPreset;
  cropState: CropState;
  onCropChange: (updater: (prev: CropState) => CropState) => void;
  gridSettings: GridSettings;
  onGridSettingsChange: (updater: (prev: GridSettings) => GridSettings) => void;
}

export const CropViewport: React.FC<CropViewportProps> = ({
  imageMeta,
  preset,
  cropState,
  onCropChange,
  gridSettings,
  onGridSettingsChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Touch pinch state
  const touchDistanceRef = useRef<number | null>(null);
  const touchZoomStartRef = useRef<number>(1);

  // Compute exact pixel target dimensions
  const dimensions = calculateTargetDimensions(preset, imageMeta, cropState.rotation);

  // Exact responsive pixel size for the visual box (guarantees 0-pixel mismatch between canvas & frame)
  const [displayBox, setDisplayBox] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const availW = containerRef.current.clientWidth - 16;
      const availH = containerRef.current.clientHeight - 16;
      if (availW <= 0 || availH <= 0) return;

      const targetW = dimensions.width;
      const targetH = dimensions.height;
      const scale = Math.min(availW / targetW, availH / targetH);
      setDisplayBox({
        width: Math.floor(targetW * scale),
        height: Math.floor(targetH * scale),
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [dimensions.width, dimensions.height]);

  // Render canvas on state change
  useEffect(() => {
    if (!canvasRef.current || !imageMeta.element) return;
    renderProcessedCanvas(
      canvasRef.current,
      imageMeta.element,
      dimensions,
      cropState
    );
  }, [imageMeta, dimensions, cropState]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...cropState.pan };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleFactor = dimensions.width / (rect.width || 1);

    const deltaX = (e.clientX - dragStartRef.current.x) * scaleFactor;
    const deltaY = (e.clientY - dragStartRef.current.y) * scaleFactor;

    onCropChange((prev) => ({
      ...prev,
      pan: {
        x: panStartRef.current.x + deltaX,
        y: panStartRef.current.y + deltaY,
      },
    }));
  }, [isDragging, dimensions.width, onCropChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? -0.08 : 0.08;
    onCropChange((prev) => ({
      ...prev,
      zoom: Math.min(4.0, Math.max(0.5, parseFloat((prev.zoom + zoomDelta).toFixed(3)))),
    }));
  };

  // Touch handlers (Drag & Pinch-to-zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { ...cropState.pan };
      touchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
      touchZoomStartRef.current = cropState.zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleFactor = dimensions.width / (rect.width || 1);

    if (e.touches.length === 1 && isDragging) {
      const deltaX = (e.touches[0].clientX - dragStartRef.current.x) * scaleFactor;
      const deltaY = (e.touches[0].clientY - dragStartRef.current.y) * scaleFactor;

      onCropChange((prev) => ({
        ...prev,
        pan: {
          x: panStartRef.current.x + deltaX,
          y: panStartRef.current.y + deltaY,
        },
      }));
    } else if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDist / touchDistanceRef.current;
      const newZoom = Math.min(4.0, Math.max(0.5, touchZoomStartRef.current * ratio));

      onCropChange((prev) => ({
        ...prev,
        zoom: parseFloat(newZoom.toFixed(3)),
      }));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchDistanceRef.current = null;
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-between p-2 sm:p-4 select-none relative overflow-hidden bg-black">
      {/* Top Floating Helper Controls */}
      <div className="w-full flex items-center justify-between z-20 shrink-0 mb-1 px-1">
        {/* Left: Resolution and Ratio Info Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full ios-pill text-[11px] sm:text-xs text-white/90 shadow-sm">
          <span className="font-semibold text-white">{preset.ratioText}</span>
          <span className="text-white/30">•</span>
          <span className="font-mono text-ios-secondaryLabel">
            {dimensions.width}×{dimensions.height}
          </span>
        </div>

        {/* Right: Grid & Profile View Toggles */}
        <div className="flex items-center gap-1 p-0.5 rounded-full ios-pill shadow-sm">
          <button
            onClick={() =>
              onGridSettingsChange((prev) => ({
                ...prev,
                showRuleOfThirds: !prev.showRuleOfThirds,
              }))
            }
            className={`p-1.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
              gridSettings.showRuleOfThirds
                ? 'bg-white text-black shadow-sm'
                : 'text-ios-secondaryLabel hover:text-white'
            }`}
            title="Siatka 3x3"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">3&times;3</span>
          </button>

          <button
            onClick={() =>
              onGridSettingsChange((prev) => ({
                ...prev,
                showProfileGridPreview: !prev.showProfileGridPreview,
              }))
            }
            className={`p-1.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
              gridSettings.showProfileGridPreview
                ? 'bg-ios-yellow text-black shadow-sm font-semibold'
                : 'text-ios-secondaryLabel hover:text-white'
            }`}
            title="Podgląd w profilu Instagrama (1:1)"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Profil (1:1)</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport Area */}
      <div 
        ref={containerRef}
        className="w-full flex-1 min-h-0 flex items-center justify-center p-2 overflow-hidden"
        onWheel={handleWheel}
      >
        <div
          className={`relative rounded-none overflow-hidden shadow-2xl border border-white/20 transition-all ${
            isDragging ? 'cursor-grabbing scale-[0.998]' : 'cursor-grab hover:border-white/40'
          }`}
          style={{
            width: displayBox.width > 0 ? `${displayBox.width}px` : 'auto',
            height: displayBox.height > 0 ? `${displayBox.height}px` : 'auto',
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block bg-transparency-grid"
            style={{
              width: displayBox.width > 0 ? `${displayBox.width}px` : '100%',
              height: displayBox.height > 0 ? `${displayBox.height}px` : '100%',
            }}
          />

          <GridOverlay settings={gridSettings} preset={preset} />

          {/* iOS-style flush corner crop handles */}
          <div className="absolute top-0 left-0 w-5 h-5 border-t-[3px] border-l-[3px] border-white pointer-events-none z-10"></div>
          <div className="absolute top-0 right-0 w-5 h-5 border-t-[3px] border-r-[3px] border-white pointer-events-none z-10"></div>
          <div className="absolute bottom-0 left-0 w-5 h-5 border-b-[3px] border-l-[3px] border-white pointer-events-none z-10"></div>
          <div className="absolute bottom-0 right-0 w-5 h-5 border-b-[3px] border-r-[3px] border-white pointer-events-none z-10"></div>

          {/* Center edge handles */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-white pointer-events-none z-10"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-white pointer-events-none z-10"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] bg-white pointer-events-none z-10"></div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-[3px] bg-white pointer-events-none z-10"></div>
        </div>
      </div>

      {/* Bottom Quick Tools Bar (iOS Zoom & Transforms) */}
      <div className="w-full max-w-md flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-full ios-pill shadow-lg mt-1 shrink-0 z-20">
        <div className="flex items-center gap-2 flex-1 max-w-[180px] sm:max-w-xs">
          <button
            onClick={() =>
              onCropChange((prev) => ({
                ...prev,
                zoom: Math.max(0.5, parseFloat((prev.zoom - 0.1).toFixed(2))),
              }))
            }
            className="text-ios-secondaryLabel hover:text-white transition-colors"
            title="Pomniejsz"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.01"
            value={cropState.zoom}
            onChange={(e) =>
              onCropChange((prev) => ({
                ...prev,
                zoom: parseFloat(e.target.value),
              }))
            }
            className="w-full accent-white"
          />

          <button
            onClick={() =>
              onCropChange((prev) => ({
                ...prev,
                zoom: Math.min(4.0, parseFloat((prev.zoom + 0.1).toFixed(2))),
              }))
            }
            className="text-ios-secondaryLabel hover:text-white transition-colors"
            title="Powiększ"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono text-[10px] text-ios-secondaryLabel w-7 text-right">
            {Math.round(cropState.zoom * 100)}%
          </span>
        </div>

        <div className="h-3.5 w-px bg-white/10"></div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() =>
              onCropChange((prev) => ({
                ...prev,
                rotation: (prev.rotation + 90) % 360,
              }))
            }
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 active:opacity-60 transition-all"
            title="Obróć o 90°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() =>
              onCropChange((prev) => ({
                ...prev,
                flipH: !prev.flipH,
              }))
            }
            className={`p-1 rounded-full transition-all ${
              cropState.flipH
                ? 'bg-ios-yellow text-black'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
            title="Odbij w poziomie"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() =>
              onCropChange((prev) => ({
                ...prev,
                pan: { x: 0, y: 0 },
              }))
            }
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 active:opacity-60 transition-all"
            title="Wyśrodkuj"
          >
            <Move className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
