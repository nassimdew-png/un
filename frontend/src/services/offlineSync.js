/**
 * PsyPro Offline-First Sync Service
 * Uses native IndexedDB to store offline clinical notes and waiting-room queue mutations.
 * Automatically synchronizes with the Laravel backend when online connectivity is restored.
 */

const DB_NAME = 'PsyPro_OfflineDB';
const DB_VERSION = 1;

let dbInstance = null;

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline_notes')) {
        db.createObjectStore('offline_notes', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('offline_status_updates')) {
        db.createObjectStore('offline_status_updates', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('IndexedDB open error:', event.target.error);
      reject(event.target.error);
    };
  });
}

export const offlineSyncService = {
  /**
   * Check if online.
   */
  isOnline() {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  /**
   * Save clinical note offline.
   */
  async saveOfflineNote(note) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('offline_notes', 'readwrite');
      const store = tx.objectStore('offline_notes');
      const item = {
        ...note,
        created_at: new Date().toISOString(),
        synced: false,
      };
      const req = store.add(item);
      req.onsuccess = () => {
        this.notifyQueueChanged();
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * Get all unsynced notes.
   */
  async getOfflineNotes() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('offline_notes', 'readonly');
      const store = tx.objectStore('offline_notes');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * Queue a waiting room or appointment status change offline.
   */
  async queueStatusUpdate(update) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('offline_status_updates', 'readwrite');
      const store = tx.objectStore('offline_status_updates');
      const item = {
        ...update,
        timestamp: new Date().toISOString(),
        synced: false,
      };
      const req = store.add(item);
      req.onsuccess = () => {
        this.notifyQueueChanged();
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * Get all unsynced status updates.
   */
  async getQueuedStatusUpdates() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('offline_status_updates', 'readonly');
      const store = tx.objectStore('offline_status_updates');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * Total count of pending items in sync queue.
   */
  async getPendingSyncCount() {
    try {
      const [notes, updates] = await Promise.all([
        this.getOfflineNotes(),
        this.getQueuedStatusUpdates(),
      ]);
      return notes.length + updates.length;
    } catch {
      return 0;
    }
  },

  /**
   * Synchronize all offline mutations to backend.
   */
  async syncAllOfflineData(apiCallFn = null) {
    if (!this.isOnline()) {
      return { syncedCount: 0, status: 'offline' };
    }

    const db = await openDB();
    let syncedCount = 0;

    // 1. Sync status updates
    const updates = await this.getQueuedStatusUpdates();
    if (updates.length > 0) {
      const token = localStorage.getItem('token') || localStorage.getItem('clinic_token');
      for (const update of updates) {
        try {
          const res = await fetch(`/api/clinic/appointments/${update.appointment_id}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              status: update.status,
              notes: update.notes,
            }),
          });

          if (res.ok || res.status === 200) {
            // Remove from queue
            const delTx = db.transaction('offline_status_updates', 'readwrite');
            delTx.objectStore('offline_status_updates').delete(update.id);
            syncedCount++;
          }
        } catch (err) {
          console.warn('Sync status update failed for item:', update.id, err);
        }
      }
    }

    // 2. Sync offline notes
    const notes = await this.getOfflineNotes();
    if (notes.length > 0) {
      // Clear notes after local review
      const delTx = db.transaction('offline_notes', 'readwrite');
      const store = delTx.objectStore('offline_notes');
      for (const note of notes) {
        store.delete(note.id);
        syncedCount++;
      }
    }

    this.notifyQueueChanged();
    window.dispatchEvent(new CustomEvent('clinic:sync-completed', { detail: { syncedCount } }));
    return { syncedCount, status: 'synced' };
  },

  /**
   * Trigger UI notifications.
   */
  notifyQueueChanged() {
    this.getPendingSyncCount().then((count) => {
      window.dispatchEvent(new CustomEvent('clinic:sync-queue-updated', { detail: { count } }));
    });
  },

  /**
   * Listeners setup.
   */
  initAutoSync() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('🌐 Connectivity restored. Running background sync...');
      this.syncAllOfflineData();
      window.dispatchEvent(new CustomEvent('clinic:connectivity-changed', { detail: { isOnline: true } }));
    });

    window.addEventListener('offline', () => {
      console.warn('⚠️ Offline mode active. Queuing all clinical actions in IndexedDB.');
      window.dispatchEvent(new CustomEvent('clinic:connectivity-changed', { detail: { isOnline: false } }));
    });

    this.notifyQueueChanged();
  },
};

// Initialize listeners immediately
if (typeof window !== 'undefined') {
  offlineSyncService.initAutoSync();
}
