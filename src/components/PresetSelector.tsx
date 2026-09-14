import React from 'react';
import { INSTAGRAM_PRESETS } from '../engine/presets';
import type { InstagramPreset, InstagramPresetKey } from '../engine/types';

interface PresetSelectorProps {
  selectedPresetId: InstagramPresetKey;
  onSelectPreset: (preset: InstagramPreset) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  selectedPresetId,
  onSelectPreset,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ios-secondaryLabel">
          Proporcje Instagrama
        </span>
      </div>

      {/* iOS Horizontal Scrollable Format Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 px-0.5">
        {INSTAGRAM_PRESETS.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-left transition-all duration-200 flex items-center gap-2.5 active:scale-95 ${
                isSelected
                  ? 'bg-white text-black shadow-ios-card font-semibold'
                  : 'bg-ios-card/90 text-white hover:bg-ios-secondary border border-white/10'
              }`}
            >
              {/* Aspect Ratio Box Icon */}
              <div className={`w-4 h-4 flex items-center justify-center ${isSelected ? 'text-black' : 'text-ios-secondaryLabel'}`}>
                {preset.iconType === 'portrait' && (
                  <div className="w-3 h-4 border-1.5 border-current rounded-[2px]"></div>
                )}
                {preset.iconType === 'square' && (
                  <div className="w-3.5 h-3.5 border-1.5 border-current rounded-[2px]"></div>
                )}
                {preset.iconType === 'landscape' && (
                  <div className="w-4 h-2.5 border-1.5 border-current rounded-[2px]"></div>
                )}
                {preset.iconType === 'story' && (
                  <div className="w-2.5 h-4 border-1.5 border-current rounded-[2px]"></div>
                )}
                {preset.iconType === 'original' && (
                  <span className="text-[10px] font-mono font-bold">AUTO</span>
                )}
              </div>

              <div className="flex flex-col">
                <span className="text-[13px] leading-tight">{preset.ratioText}</span>
                <span className={`text-[10px] leading-tight font-normal ${isSelected ? 'text-black/70' : 'text-ios-secondaryLabel'}`}>
                  {preset.isOriginal ? `${preset.maxDimension}p` : `${preset.recommendedWidth}×${preset.recommendedHeight}`}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
