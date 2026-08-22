/**
 * IndexedDB Image Storage Layer
 * Stores heavy panel images and assembled canvas renders outside localStorage
 * to avoid 5MB quota limits and ensure fast, persistent retrieval.
 */

const DB_NAME = 'md_to_comic_image_db';
const DB_VERSION = 1;
const STORE_NAME = 'panel_images';

let dbPromise: Promise<IDBDatabase> | null = null;

function isIndexedDbSupported(): boolean {
  return typeof indexedDB !== 'undefined' && indexedDB !== null;
}

function getDb(): Promise<IDBDatabase> {
  if (!isIndexedDbSupported()) {
    return Promise.reject(new Error('IndexedDB is not supported'));
  }

  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return dbPromise;
}

/**
 * Stores a panel image data URI in IndexedDB
 */
export async function savePanelImage(panelId: string, dataUrl: string): Promise<void> {
  if (!isIndexedDbSupported() || !panelId || !dataUrl) return;
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(dataUrl, panelId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`Failed to store image in IndexedDB for panel ${panelId}:`, err);
  }
}

/**
 * Retrieves a panel image from IndexedDB
 */
export async function loadPanelImage(panelId: string): Promise<string | null> {
  if (!isIndexedDbSupported() || !panelId) return null;
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(panelId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`Failed to load image from IndexedDB for panel ${panelId}:`, err);
    return null;
  }
}

/**
 * Deletes a panel image from IndexedDB
 */
export async function deletePanelImage(panelId: string): Promise<void> {
  if (!isIndexedDbSupported() || !panelId) return;
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(panelId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`Failed to delete image from IndexedDB for panel ${panelId}:`, err);
  }
}

/**
 * Saves all panel images for a project to IndexedDB
 */
export async function saveAllProjectImages(pages: Array<{ panels: Array<{ id: string; image_url?: string }> }>): Promise<void> {
  if (!isIndexedDbSupported()) return;
  try {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const page of pages) {
      for (const panel of page.panels) {
        if (panel.id && panel.image_url) {
          store.put(panel.image_url, panel.id);
        }
      }
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to bulk save images to IndexedDB:', err);
  }
}

/**
 * Hydrates panel images from IndexedDB into pages in-memory
 */
export async function hydratePagesWithImages<T extends { panels: Array<{ id: string; image_url?: string }> }>(
  pages: T[]
): Promise<T[]> {
  if (!isIndexedDbSupported()) return pages;
  try {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const hydrated = await Promise.all(
      pages.map(async (page) => {
        const panels = await Promise.all(
          page.panels.map(async (panel) => {
            if (panel.image_url) return panel;
            return new Promise<typeof panel>((resolve) => {
              const req = store.get(panel.id);
              req.onsuccess = () => {
                if (req.result) {
                  resolve({ ...panel, image_url: req.result });
                } else {
                  resolve(panel);
                }
              };
              req.onerror = () => resolve(panel);
            });
          })
        );
        return { ...page, panels };
      })
    );

    return hydrated as T[];
  } catch (err) {
    console.warn('Failed to hydrate pages with IndexedDB images:', err);
    return pages;
  }
}
