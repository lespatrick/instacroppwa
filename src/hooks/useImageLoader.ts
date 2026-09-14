import { useState, useCallback, useEffect, useRef } from 'react';
import type { LoadedImageMeta } from '../engine/types';

interface UseImageLoaderOptions {
  onError: (message: string) => void;
  onSuccess?: (metaList: LoadedImageMeta[]) => void;
}

export function useImageLoader({ onError, onSuccess }: UseImageLoaderOptions) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Track all active object URLs for clean revocation
  const activeUrlsRef = useRef<Set<string>>(new Set());

  const revokeUrl = useCallback((url: string) => {
    if (activeUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      activeUrlsRef.current.delete(url);
    }
  }, []);

  const cleanupAllUrls = useCallback(() => {
    activeUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    activeUrlsRef.current.clear();
  }, []);

  const loadSingleImage = async (file: File): Promise<LoadedImageMeta> => {
    const objectUrl = URL.createObjectURL(file);
    activeUrlsRef.current.add(objectUrl);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        activeUrlsRef.current.delete(objectUrl);
        reject(new Error(`Nie udało się wczytać pliku: ${file.name}`));
      };
      img.src = objectUrl;
    });

    return {
      element: img,
      src: objectUrl,
      name: file.name,
      originalWidth: img.naturalWidth,
      originalHeight: img.naturalHeight,
      aspectRatio: img.naturalWidth / img.naturalHeight,
      sizeBytes: file.size,
      fileType: file.type,
    };
  };

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    
    if (fileArray.length === 0) {
      onError('Wybierz prawidłowe pliki graficzne (JPG, PNG, WebP, HEIC itp.).');
      return;
    }

    setIsLoading(true);

    try {
      const loadedList: LoadedImageMeta[] = [];
      for (const file of fileArray) {
        try {
          const meta = await loadSingleImage(file);
          loadedList.push(meta);
        } catch (err: any) {
          console.warn(err.message);
        }
      }

      if (loadedList.length === 0) {
        throw new Error('Żadne ze wskazanych zdjęć nie mogło zostać załadowane.');
      }

      if (onSuccess) onSuccess(loadedList);
    } catch (err: any) {
      onError(err.message || 'Wystąpił błąd podczas wczytywania zdjęć.');
    } finally {
      setIsLoading(false);
    }
  }, [onError, onSuccess]);

  // Handle global paste (Cmd/Ctrl + V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) pastedFiles.push(file);
        }
      }

      if (pastedFiles.length > 0) {
        e.preventDefault();
        processFiles(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processFiles]);

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
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  return {
    isLoading,
    isDragging,
    processFiles,
    revokeUrl,
    cleanupAllUrls,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
