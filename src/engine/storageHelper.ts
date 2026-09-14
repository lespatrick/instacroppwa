import type { PhotoItem, LoadedImageMeta } from './types';

const DB_NAME = 'instacrop_db';
const DB_VERSION = 1;
const STORE_NAME = 'session_photos';

interface StoredPhotoRecord {
  id: string;
  name: string;
  blob: Blob;
  preset: any;
  cropState: any;
  originalWidth: number;
  originalHeight: number;
  aspectRatio: number;
  fileType: string;
  activeIndex?: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves entire current working session into IndexedDB (persists across iOS Safari memory purges / share sheet dismissals).
 */
export async function saveSessionToDB(photos: PhotoItem[], activeIndex: number): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Clear old session
    store.clear();

    for (let i = 0; i < photos.length; i++) {
      const item = photos[i];
      // Fetch blob from blob url or canvas
      let blob: Blob;
      try {
        const res = await fetch(item.meta.src);
        blob = await res.blob();
      } catch {
        continue;
      }

      const record: StoredPhotoRecord = {
        id: item.id,
        name: item.meta.name,
        blob,
        preset: item.preset,
        cropState: item.cropState,
        originalWidth: item.meta.originalWidth,
        originalHeight: item.meta.originalHeight,
        aspectRatio: item.meta.aspectRatio,
        fileType: item.meta.fileType,
        activeIndex: i === activeIndex ? activeIndex : undefined,
      };

      store.put(record);
    }
  } catch (err) {
    console.warn('Could not persist session to IndexedDB:', err);
  }
}

/**
 * Restores working session from IndexedDB if app is reloaded or resumed.
 */
export async function restoreSessionFromDB(): Promise<{ photos: PhotoItem[]; activeIndex: number } | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const records: StoredPhotoRecord[] = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (!records || records.length === 0) return null;

    const restoredPhotos: PhotoItem[] = [];
    let activeIndex = 0;

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      if (rec.activeIndex !== undefined) {
        activeIndex = rec.activeIndex;
      }

      const objectUrl = URL.createObjectURL(rec.blob);
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to restore image element'));
        img.src = objectUrl;
      });

      const meta: LoadedImageMeta = {
        element: img,
        src: objectUrl,
        name: rec.name,
        originalWidth: rec.originalWidth,
        originalHeight: rec.originalHeight,
        aspectRatio: rec.aspectRatio,
        sizeBytes: rec.blob.size,
        fileType: rec.fileType,
      };

      restoredPhotos.push({
        id: rec.id,
        meta,
        preset: rec.preset,
        cropState: rec.cropState,
      });
    }

    return { photos: restoredPhotos, activeIndex };
  } catch (err) {
    console.warn('Could not restore session from IndexedDB:', err);
    return null;
  }
}

/**
 * Clears saved session in IndexedDB.
 */
export async function clearSessionDB(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
  } catch (err) {
    console.warn('Could not clear IndexedDB session:', err);
  }
}
