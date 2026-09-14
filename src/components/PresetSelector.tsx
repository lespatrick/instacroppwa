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
    <div className="w-full flex items-center justify-center py-0.5">
      {/* Sleek, minimal iOS camera-style ticker */}
      <div className="flex items-center gap-4 sm:gap-5 overflow-x-auto no-scrollbar px-3 py-1 select-none">
        {INSTAGRAM_PRESETS.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`flex-shrink-0 cursor-pointer transition-all duration-150 text-center flex flex-col items-center bg-transparent border-none p-0 focus:outline-none active:scale-95 ${
                isSelected
                  ? 'text-white font-semibold'
                  : 'text-white/30 hover:text-white/60 font-normal'
              }`}
            >
              <span className={`text-[11px] sm:text-xs tracking-wider transition-colors ${isSelected ? 'text-white drop-shadow-[0_1px_2px_rgba(255,255,255,0.2)]' : 'text-white/35'}`}>
                {preset.ratioText}
              </span>
              <span className={`w-1 h-1 rounded-full mt-0.5 transition-all ${isSelected ? 'bg-white' : 'bg-transparent'}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
};
