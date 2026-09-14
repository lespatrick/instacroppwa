import React from 'react';
import type { BackgroundStyle, CropState, FitMode } from '../engine/types';
import { Sparkles, Pipette, Crop, Maximize } from 'lucide-react';

interface BackgroundControlsProps {
  cropState: CropState;
  onCropChange: (updater: (prev: CropState) => CropState) => void;
}

export const BackgroundControls: React.FC<BackgroundControlsProps> = ({
  cropState,
  onCropChange,
}) => {
  const setFitMode = (mode: FitMode) => {
    onCropChange((prev) => ({
      ...prev,
      fitMode: mode,
    }));
  };

  const setBgStyle = (style: BackgroundStyle, colorHex?: string) => {
    onCropChange((prev) => ({
      ...prev,
      bgStyle: style,
      bgColor: colorHex !== undefined ? colorHex : prev.bgColor,
    }));
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* iOS Segmented Control: [Wypełnij / Kadruj] vs [Dopasuj / Marginesy] */}
      <div className="flex p-0.5 rounded-xl bg-ios-secondary/80 border border-white/10">
        <button
          onClick={() => setFitMode('cover')}
          className={`flex-1 py-1.5 px-3 rounded-[10px] text-[13px] font-medium transition-all flex items-center justify-center gap-1.5 ${
            cropState.fitMode === 'cover'
              ? 'bg-ios-tertiary text-white shadow-sm'
              : 'text-ios-secondaryLabel hover:text-white'
          }`}
        >
          <Crop className="w-3.5 h-3.5" />
          <span>Wypełnij (Cover)</span>
        </button>

        <button
          onClick={() => setFitMode('fit')}
          className={`flex-1 py-1.5 px-3 rounded-[10px] text-[13px] font-medium transition-all flex items-center justify-center gap-1.5 ${
            cropState.fitMode === 'fit'
              ? 'bg-ios-tertiary text-white shadow-sm'
              : 'text-ios-secondaryLabel hover:text-white'
          }`}
        >
          <Maximize className="w-3.5 h-3.5" />
          <span>Marginesy (Fit)</span>
        </button>
      </div>

      {/* Color Swatches if Fit Mode is active */}
      {cropState.fitMode === 'fit' && (
        <div className="flex items-center justify-between gap-2 px-1 pt-1 animate-fade-in">
          <span className="text-[11px] font-medium text-ios-secondaryLabel">
            Kolor tła:
          </span>

          <div className="flex items-center gap-2">
            {/* Black Swatch */}
            <button
              onClick={() => setBgStyle('black', '#000000')}
              className={`w-7 h-7 rounded-full bg-black border transition-all ${
                cropState.bgStyle === 'black'
                  ? 'border-white ring-2 ring-ios-blue'
                  : 'border-white/30 hover:border-white'
              }`}
              title="Czarny"
            />

            {/* White Swatch */}
            <button
              onClick={() => setBgStyle('white', '#ffffff')}
              className={`w-7 h-7 rounded-full bg-white border transition-all ${
                cropState.bgStyle === 'white'
                  ? 'border-black ring-2 ring-ios-blue'
                  : 'border-white/30 hover:border-white'
              }`}
              title="Biały"
            />

            {/* Auto Dominant Color Swatch */}
            <button
              onClick={() => setBgStyle('dominant', cropState.dominantColor)}
              className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all relative ${
                cropState.bgStyle === 'dominant'
                  ? 'border-white ring-2 ring-ios-yellow'
                  : 'border-white/30 hover:border-white'
              }`}
              style={{ backgroundColor: cropState.dominantColor }}
              title={`Auto-kolor: ${cropState.dominantColor}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-ios-yellow drop-shadow" />
            </button>

            {/* Blur Backdrop Swatch */}
            <button
              onClick={() => setBgStyle('blur')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium bg-gradient-to-r from-ios-blue/30 to-ig-purple/30 border transition-all ${
                cropState.bgStyle === 'blur'
                  ? 'border-ios-blue text-white ring-2 ring-ios-blue/40'
                  : 'border-white/20 text-ios-secondaryLabel hover:text-white'
              }`}
            >
              Rozmycie
            </button>

            {/* Custom Pipette Color */}
            <label className="relative w-7 h-7 rounded-full bg-ios-secondary flex items-center justify-center border border-white/20 hover:border-white cursor-pointer">
              <Pipette className="w-3.5 h-3.5 text-white/80" />
              <input
                type="color"
                value={cropState.bgColor}
                onChange={(e) => setBgStyle('custom', e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
