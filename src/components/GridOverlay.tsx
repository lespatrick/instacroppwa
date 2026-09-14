import React from 'react';
import type { GridSettings, InstagramPreset } from '../engine/types';

interface GridOverlayProps {
  settings: GridSettings;
  preset: InstagramPreset;
}

export const GridOverlay: React.FC<GridOverlayProps> = ({ settings, preset }) => {
  if (!settings.showRuleOfThirds && !settings.showProfileGridPreview) {
    return null;
  }

  const isPortrait = preset.aspectRatio < 1;
  const isLandscape = preset.aspectRatio > 1;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden">
      {/* 1. Rule of Thirds Grid Lines */}
      {settings.showRuleOfThirds && (
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
          <div className="border-r border-white/25"></div>
          <div className="border-r border-white/25"></div>
          <div></div>

          <div className="border-b border-white/25 col-span-3 -mt-[66.666%] h-0"></div>
          <div className="border-b border-white/25 col-span-3 -mt-[33.333%] h-0"></div>
        </div>
      )}

      {/* 2. Instagram Profile Grid 1:1 Center Preview Mask */}
      {settings.showProfileGridPreview && (
        <>
          {isPortrait && (
            <div className="absolute inset-0 flex flex-col justify-between">
              <div className="w-full bg-black/55 backdrop-blur-[1px] border-b border-ig-pink/60 flex items-center justify-center transition-all" style={{ height: 'calc((100% - (100% * 0.8)) / 2)' }}>
                <span className="text-[10px] font-semibold tracking-wider text-ig-pink/90 uppercase px-2 py-0.5 rounded bg-black/60">
                  Poza siatką profilu (Góra)
                </span>
              </div>

              <div className="w-full aspect-square border-2 border-dashed border-ig-pink/80 flex items-end justify-end p-2 relative shadow-inner">
                <span className="text-[9px] font-bold tracking-widest text-white/90 bg-ig-pink/80 px-1.5 py-0.5 rounded backdrop-blur-sm shadow">
                  1:1 PODGLĄD SIATKI PROFILU
                </span>
              </div>

              <div className="w-full bg-black/55 backdrop-blur-[1px] border-t border-ig-pink/60 flex items-center justify-center transition-all" style={{ height: 'calc((100% - (100% * 0.8)) / 2)' }}>
                <span className="text-[10px] font-semibold tracking-wider text-ig-pink/90 uppercase px-2 py-0.5 rounded bg-black/60">
                  Poza siatką profilu (Dół)
                </span>
              </div>
            </div>
          )}

          {isLandscape && (
            <div className="absolute inset-0 flex justify-between">
              <div className="h-full bg-black/55 backdrop-blur-[1px] border-r border-ig-pink/60 flex items-center justify-center transition-all" style={{ width: 'calc((100% - (100% / 1.91)) / 2)' }}>
                <span className="text-[9px] font-semibold tracking-wider text-ig-pink/90 uppercase [writing-mode:vertical-lr] px-1 py-2 rounded bg-black/60">
                  Poza siatką
                </span>
              </div>

              <div className="h-full aspect-square border-2 border-dashed border-ig-pink/80 flex items-end justify-center p-2 relative shadow-inner">
                <span className="text-[9px] font-bold tracking-widest text-white/90 bg-ig-pink/80 px-1.5 py-0.5 rounded backdrop-blur-sm shadow">
                  1:1 SIATKA PROFILU
                </span>
              </div>

              <div className="h-full bg-black/55 backdrop-blur-[1px] border-l border-ig-pink/60 flex items-center justify-center transition-all" style={{ width: 'calc((100% - (100% / 1.91)) / 2)' }}>
                <span className="text-[9px] font-semibold tracking-wider text-ig-pink/90 uppercase [writing-mode:vertical-lr] px-1 py-2 rounded bg-black/60">
                  Poza siatką
                </span>
              </div>
            </div>
          )}

          {!isPortrait && !isLandscape && (
            <div className="absolute inset-0 border-2 border-dashed border-ig-pink/60 flex items-end justify-center p-2">
              <span className="text-[9px] font-bold tracking-widest text-white/90 bg-ig-pink/80 px-1.5 py-0.5 rounded backdrop-blur-sm">
                1:1 KADR IDENTYCZNY Z SIATKĄ PROFILU
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
