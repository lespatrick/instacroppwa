import type { InstagramPreset } from './types';

/**
 * Format bytes into human readable format (KB / MB).
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 KB';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Generates an Instagram-standard output filename based on preset and source filename.
 */
export function generateExportFilename(
  originalFilename: string,
  preset: InstagramPreset,
  format: 'image/jpeg' | 'image/webp'
): string {
  const ext = format === 'image/webp' ? 'webp' : 'jpg';
  const cleanBaseName = originalFilename
    .replace(/\.[^/.]+$/, '') // remove extension
    .replace(/[^a-zA-Z0-9_-]/g, '_') // sanitize
    .slice(0, 30); // prevent oversized filenames

  let presetTag = 'custom';
  if (preset.id === 'portrait-4-5') presetTag = '4x5';
  else if (preset.id === 'square-1-1') presetTag = '1x1';
  else if (preset.id === 'landscape-191-1') presetTag = '1.91x1';
  else if (preset.id === 'story-9-16') presetTag = '9x16_Story';
  else if (preset.id.startsWith('original')) presetTag = `orig_${preset.maxDimension}p`;

  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `IG_${presetTag}_${cleanBaseName}_${timestamp}.${ext}`;
}

/**
 * Exports canvas to Blob with quality settings and returns Promise.
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: 'image/jpeg' | 'image/webp',
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas export to Blob failed'));
        }
      },
      format,
      quality
    );
  });
}

/**
 * Triggers client-side browser download and automatically frees the object URL.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean memory promptly
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 1500);
}

/**
 * Checks if saving directly to device gallery via Web Share API is supported.
 */
export function canSaveToGallery(): boolean {
  if (typeof navigator === 'undefined' || !navigator.share) return false;
  if (typeof window !== 'undefined' && 'canShare' in navigator) {
    try {
      const dummyFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      return navigator.canShare({ files: [dummyFile] });
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Saves photo directly to device gallery (iOS Photos / Android Gallery)
 * via Web Share API, or falls back to direct browser download.
 */
export async function saveToGalleryOrDownload(
  blob: Blob,
  filename: string
): Promise<{ success: boolean; isGalleryShare: boolean; message: string }> {
  const file = new File([blob], filename, { type: blob.type });

  // Try native iOS / Android Share to Photos
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'InstaCrop Photo',
        text: 'Zapisz zdjęcie w galerii (Zachowaj obraz)',
      });
      return {
        success: true,
        isGalleryShare: true,
        message: 'Zdjęcie przekazane do systemowego menu zapisu w Zdjęciach/Galerii.',
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return {
          success: true,
          isGalleryShare: true,
          message: 'Anulowano zapis.',
        };
      }
      console.warn('Native share failed, falling back to download:', err);
    }
  }

  // Fallback to direct file download
  downloadBlob(blob, filename);
  return {
    success: true,
    isGalleryShare: false,
    message: `Pobrano plik: ${filename} (${formatBytes(blob.size)})`,
  };
}
