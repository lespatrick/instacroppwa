import React from 'react';
import { Camera, WifiOff, Loader2 } from 'lucide-react';
import type { ExportStats, InstagramPreset } from '../engine/types';

interface DynamicHUDProps {
  preset: InstagramPreset;
  stats: ExportStats;
  isOffline: boolean;
  isEstimating: boolean;
  isExporting: boolean;
}

export const DynamicHUD: React.FC<DynamicHUDProps> = ({
  preset,
  stats,
  isOffline,
  isEstimating,
  isExporting,
}) => {
  return (
    <div className="pointer-events-none fixed top-2 left-0 right-0 z-40 flex justify-center px-4 pt-[max(env(safe-area-inset-top),0px)]">
      <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full ios-dynamic-capsule text-xs text-white/90 shadow-2xl transition-all duration-300 active:scale-95 border border-white/20">
        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          {isExporting ? (
            <Loader2 className="w-3.5 h-3.5 text-ios-yellow animate-spin" />
          ) : isOffline ? (
            <WifiOff className="w-3 h-3 text-amber-400" />
          ) : (
            <Camera className="w-3 h-3 text-white" />
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[12px] font-medium">
          <span className="font-bold text-white tracking-wide">{preset.ratioText}</span>
          <span className="text-white/30">•</span>
          <span className="font-mono text-ios-secondaryLabel text-[11px]">
            {stats.dimensions.width}×{stats.dimensions.height}
          </span>
        </div>

        <div className="h-3 w-px bg-white/20"></div>

        <div className="flex items-center gap-1">
          {isEstimating ? (
            <span className="text-[10px] text-ios-secondaryLabel animate-pulse">obliczam...</span>
          ) : (
            <span className="font-mono text-[11px] font-semibold text-emerald-400">
              {stats.sizeFormatted}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
