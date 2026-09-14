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
    <div className="w-full flex items-center justify-center">
      {/* Simple Text Carousel (Camera-like mode picker) */}
      <div className="flex items-center gap-5 sm:gap-6 overflow-x-auto no-scrollbar py-2 px-4 select-none">
        {INSTAGRAM_PRESETS.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`flex-shrink-0 cursor-pointer transition-all duration-200 text-center flex flex-col items-center gap-0.5 bg-transparent border-none p-0 focus:outline-none active:scale-95 ${
                isSelected
                  ? 'text-white scale-105 font-bold tracking-tight'
                  : 'text-white/40 hover:text-white/70 font-medium'
              }`}
            >
              <span className="text-[13px] sm:text-[14px]">
                {preset.ratioText}
              </span>
              <span className={`text-[9px] uppercase tracking-wider font-mono ${isSelected ? 'text-white/80' : 'text-white/25'}`}>
                {preset.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
