import type { CropState, ExportSettings, InstagramPreset, LoadedImageMeta } from './types';

/**
 * Calculates the exact output canvas dimensions for a given preset and source image.
 */
export function calculateTargetDimensions(
  preset: InstagramPreset,
  sourceMeta: LoadedImageMeta,
  rotation: number
): { width: number; height: number } {
  const isRotated90or270 = rotation % 180 !== 0;
  const srcWidth = isRotated90or270 ? sourceMeta.originalHeight : sourceMeta.originalWidth;
  const srcHeight = isRotated90or270 ? sourceMeta.originalWidth : sourceMeta.originalHeight;
  const srcAspect = srcWidth / srcHeight;

  if (preset.isOriginal && preset.maxDimension) {
    const maxDim = preset.maxDimension;
    if (srcAspect >= 1) {
      // Landscape or square original
      const width = Math.min(srcWidth, maxDim);
      const height = Math.round(width / srcAspect);
      return { width, height };
    } else {
      // Portrait original
      const height = Math.min(srcHeight, maxDim);
      const width = Math.round(height * srcAspect);
      return { width, height };
    }
  }

  // Predefined fixed aspect ratios
  return {
    width: preset.recommendedWidth,
    height: preset.recommendedHeight,
  };
}

/**
 * Calculates constrained pan so that in Cover mode the image completely fills the frame
 * without showing empty gaps or out-of-bounds background borders.
 */
export function calculateBoundedPan(
  pan: { x: number; y: number },
  cropState: CropState,
  img: { naturalWidth: number; naturalHeight: number },
  dimensions: { width: number; height: number }
): { x: number; y: number } {
  if (cropState.fitMode !== 'cover') {
    return pan;
  }

  const { width: targetW, height: targetH } = dimensions;
  const isRotated90or270 = cropState.rotation % 180 !== 0;
  const effectiveImgW = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
  const effectiveImgH = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

  const baseScale = Math.max(targetW / effectiveImgW, targetH / effectiveImgH);
  const effectiveScale = baseScale * cropState.zoom;

  const currentW = effectiveImgW * effectiveScale;
  const currentH = effectiveImgH * effectiveScale;

  // Maximum allowed displacement from center before a border reveals background
  const maxPanX = Math.max(0, (currentW - targetW) / 2);
  const maxPanY = Math.max(0, (currentH - targetH) / 2);

  const boundedX = Math.max(-maxPanX, Math.min(maxPanX, pan.x));
  const boundedY = Math.max(-maxPanY, Math.min(maxPanY, pan.y));

  return { x: boundedX, y: boundedY };
}

/**
 * Samples the dominant/average color of the image by rendering it to a miniature canvas.
 */
export function extractDominantColor(img: HTMLImageElement): string {
  try {
    const miniCanvas = document.createElement('canvas');
    miniCanvas.width = 16;
    miniCanvas.height = 16;
    const ctx = miniCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return '#18181b';

    ctx.drawImage(img, 0, 0, 16, 16);
    const imgData = ctx.getImageData(0, 0, 16, 16).data;

    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    const totalPixels = 16 * 16;

    for (let i = 0; i < imgData.length; i += 4) {
      rSum += imgData[i];
      gSum += imgData[i + 1];
      bSum += imgData[i + 2];
    }

    const r = Math.round(rSum / totalPixels);
    const g = Math.round(gSum / totalPixels);
    const b = Math.round(bSum / totalPixels);

    const toHex = (c: number) => c.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  } catch (err) {
    console.warn('Failed to extract dominant color:', err);
    return '#18181b';
  }
}

/**
 * Fast and effective Unsharp Mask sharpening filter applied on Canvas ImageData.
 * @param ctx 2D Canvas Context
 * @param width Canvas width
 * @param height Canvas height
 * @param amount Sharpening strength (0 to 100)
 */
export function applyUnsharpMask(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number
): void {
  if (amount <= 0) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const copy = new Uint8ClampedArray(data);

  const factor = (amount / 100) * 0.8; // scaling factor

  const w = width;
  const h = height;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;

      for (let c = 0; c < 3; c++) {
        const top = copy[((y - 1) * w + x) * 4 + c];
        const bottom = copy[((y + 1) * w + x) * 4 + c];
        const left = copy[(y * w + (x - 1)) * 4 + c];
        const right = copy[(y * w + (x + 1)) * 4 + c];
        const center = copy[idx + c];

        // Laplacian difference (high-pass edge detection)
        const laplacian = 4 * center - (top + bottom + left + right);
        const sharpened = center + laplacian * factor;

        data[idx + c] = Math.min(255, Math.max(0, sharpened));
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Renders the image onto a canvas using the crop transformation state and dimensions.
 */
export function renderProcessedCanvas(
  targetCanvas: HTMLCanvasElement,
  img: HTMLImageElement,
  dimensions: { width: number; height: number },
  cropState: CropState,
  exportSettings?: ExportSettings
): void {
  const { width: targetW, height: targetH } = dimensions;
  targetCanvas.width = targetW;
  targetCanvas.height = targetH;

  const ctx = targetCanvas.getContext('2d', { willReadFrequently: true, alpha: true });
  if (!ctx) return;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Draw Background (for Fit / Letterbox mode or empty spaces)
  if (cropState.fitMode === 'fit') {
    if (cropState.bgStyle === 'blur') {
      ctx.save();
      ctx.filter = 'blur(40px) brightness(0.7)';
      const bgScale = Math.max(targetW / img.naturalWidth, targetH / img.naturalHeight) * 1.2;
      const bgW = img.naturalWidth * bgScale;
      const bgH = img.naturalHeight * bgScale;
      ctx.drawImage(img, (targetW - bgW) / 2, (targetH - bgH) / 2, bgW, bgH);
      ctx.restore();
    } else {
      ctx.fillStyle = cropState.bgColor;
      ctx.fillRect(0, 0, targetW, targetH);
    }
  } else {
    // Cover mode: clear to solid dark background
    ctx.fillStyle = '#090a0f';
    ctx.fillRect(0, 0, targetW, targetH);
  }

  // 2. Compute base scale for image taking rotation into account
  const isRotated90or270 = cropState.rotation % 180 !== 0;
  const effectiveImgW = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
  const effectiveImgH = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

  let baseScale = 1;
  if (cropState.fitMode === 'cover') {
    baseScale = Math.max(targetW / effectiveImgW, targetH / effectiveImgH);
  } else {
    baseScale = Math.min(targetW / effectiveImgW, targetH / effectiveImgH);
  }

  const effectiveScale = baseScale * cropState.zoom;

  // 3. Apply transformations (Center, Pan, Rotate, Flip, Scale)
  ctx.save();

  ctx.translate(targetW / 2 + cropState.pan.x, targetH / 2 + cropState.pan.y);

  if (cropState.rotation !== 0) {
    ctx.rotate((cropState.rotation * Math.PI) / 180);
  }

  const scaleX = cropState.flipH ? -1 : 1;
  const scaleY = cropState.flipV ? -1 : 1;
  ctx.scale(scaleX, scaleY);

  const drawW = img.naturalWidth * effectiveScale;
  const drawH = img.naturalHeight * effectiveScale;

  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  // 4. Optional Post-processing Sharpening
  if (exportSettings?.enableSharpening && exportSettings.sharpenAmount > 0) {
    applyUnsharpMask(ctx, targetW, targetH, exportSettings.sharpenAmount);
  }
}
