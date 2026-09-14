export type InstagramPresetKey = 
  | 'portrait-4-5' 
  | 'square-1-1' 
  | 'landscape-191-1' 
  | 'story-9-16' 
  | 'original-1080' 
  | 'original-2160';

export interface InstagramPreset {
  id: InstagramPresetKey;
  label: string;
  subLabel: string;
  aspectRatio: number; // width / height, or null if dynamic (original)
  ratioText: string;
  recommendedWidth: number;
  recommendedHeight: number;
  isOriginal?: boolean;
  maxDimension?: number;
  iconType: 'portrait' | 'square' | 'landscape' | 'story' | 'original';
}

export type FitMode = 'cover' | 'fit'; // cover = crop edges, fit = add letterbox/pillarbox background

export type BackgroundStyle = 'black' | 'white' | 'dominant' | 'blur' | 'custom';

export interface CropState {
  zoom: number;            // 1.0 to 4.0
  pan: { x: number; y: number }; // normalized or pixel offset in canvas space
  rotation: number;        // 0, 90, 180, 270 deg
  flipH: boolean;          // horizontal flip
  flipV: boolean;          // vertical flip
  fitMode: FitMode;        // 'cover' or 'fit'
  bgColor: string;         // hex code or rgba
  bgStyle: BackgroundStyle;
  dominantColor: string;   // extracted auto color
}

export interface GridSettings {
  showRuleOfThirds: boolean;
  showProfileGridPreview: boolean; // 1:1 center cut overlay
}

export interface ExportSettings {
  format: 'image/jpeg' | 'image/webp';
  quality: number;         // 0.70 to 1.0 (default 0.92)
  enableSharpening: boolean;
  sharpenAmount: number;   // 0 to 100 (default 25)
}

export interface LoadedImageMeta {
  element: HTMLImageElement;
  src: string;
  name: string;
  originalWidth: number;
  originalHeight: number;
  aspectRatio: number;
  sizeBytes: number;
  fileType: string;
}

export interface ExportStats {
  sizeBytes: number;
  sizeFormatted: string;
  dimensions: { width: number; height: number };
  isEstimating: boolean;
}
