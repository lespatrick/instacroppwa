import { useState, useCallback, useEffect, useRef } from 'react';
import type { LoadedImageMeta } from '../engine/types';

interface UseImageLoaderOptions {
  onError: (message: string) => void;
  onSuccess?: (meta: LoadedImageMeta) => void;
}

export function useImageLoader({ onError, onSuccess }: UseImageLoaderOptions) {
  const [imageMeta, setImageMeta] = useState<LoadedImageMeta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Keep track of active object URL for revocation
  const activeUrlRef = useRef<string | null>(null);

  const cleanupActiveUrl = useCallback(() => {
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
    }
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onError(`Niewspierany format pliku (${file.type || 'nieznany'}). Wybierz plik graficzny (JPG, PNG, WebP, HEIC itp.).`);
      return;
    }

    setIsLoading(true);
    cleanupActiveUrl();

    try {
      const objectUrl = URL.createObjectURL(file);
      activeUrlRef.current = objectUrl;

      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Nie udało się załadować pliku graficznego. Plik może być uszkodzony.'));
        img.src = objectUrl;
      });

      const meta: LoadedImageMeta = {
        element: img,
        src: objectUrl,
        name: file.name,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
        sizeBytes: file.size,
        fileType: file.type,
      };

      setImageMeta(meta);
      if (onSuccess) onSuccess(meta);
    } catch (err: any) {
      onError(err.message || 'Wystąpił błąd podczas wczytywania zdjęcia.');
      cleanupActiveUrl();
      setImageMeta(null);
    } finally {
      setIsLoading(false);
    }
  }, [cleanupActiveUrl, onError, onSuccess]);

  // Handle global paste (Cmd/Ctrl + V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processFile]);

  // Drag & drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  }, [processFile]);

  const clearImage = useCallback(() => {
    cleanupActiveUrl();
    setImageMeta(null);
  }, [cleanupActiveUrl]);

  return {
    imageMeta,
    isLoading,
    isDragging,
    processFile,
    clearImage,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
