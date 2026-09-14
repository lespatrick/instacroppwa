import type { InstagramPreset } from './types';

export const INSTAGRAM_PRESETS: InstagramPreset[] = [
  {
    id: 'portrait-4-5',
    label: 'Portret (Feed)',
    subLabel: 'Największa widoczność w feedzie',
    aspectRatio: 4 / 5, // 0.8
    ratioText: '4:5',
    recommendedWidth: 1080,
    recommendedHeight: 1350,
    iconType: 'portrait',
  },
  {
    id: 'square-1-1',
    label: 'Kwadrat (Feed)',
    subLabel: 'Klasyczny format Instagrama',
    aspectRatio: 1 / 1, // 1.0
    ratioText: '1:1',
    recommendedWidth: 1080,
    recommendedHeight: 1080,
    iconType: 'square',
  },
  {
    id: 'landscape-191-1',
    label: 'Krajobraz (Feed)',
    subLabel: 'Szeroki kadr panoramiczny',
    aspectRatio: 1080 / 566, // ~1.908 (1.91:1)
    ratioText: '1.91:1',
    recommendedWidth: 1080,
    recommendedHeight: 566,
    iconType: 'landscape',
  },
  {
    id: 'story-9-16',
    label: 'Stories & Reels',
    subLabel: 'Pełny pionowy ekran',
    aspectRatio: 9 / 16, // 0.5625
    ratioText: '9:16',
    recommendedWidth: 1080,
    recommendedHeight: 1920,
    iconType: 'story',
  },
  {
    id: 'original-1080',
    label: 'Oryginał (1080p)',
    subLabel: 'Dłuższy bok max 1080 px',
    aspectRatio: 1,
    ratioText: 'Auto',
    recommendedWidth: 1080,
    recommendedHeight: 1080,
    isOriginal: true,
    maxDimension: 1080,
    iconType: 'original',
  },
  {
    id: 'original-2160',
    label: 'Oryginał (2160p HQ)',
    subLabel: 'Dłuższy bok max 2160 px (High-Res)',
    aspectRatio: 1,
    ratioText: '2K/4K',
    recommendedWidth: 2160,
    recommendedHeight: 2160,
    isOriginal: true,
    maxDimension: 2160,
    iconType: 'original',
  },
];

export const DEFAULT_PRESET = INSTAGRAM_PRESETS[0];
