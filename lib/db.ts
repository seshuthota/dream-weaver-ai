import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { HistoryEntry } from '@/types';

interface AnimeDB extends DBSchema {
  history: {
    key: string; // timestamp-based ID
    value: HistoryEntry;
    indexes: {
      'by-timestamp': number;
    };
  };
}

const DB_NAME = 'dream-weaver-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AnimeDB>> | null = null;

/**
 * Reset the database connection (for testing)
 */
export function resetDB() {
  dbPromise = null;
}

/**
 * Get or create the IndexedDB instance
 */
export async function getDB(): Promise<IDBPDatabase<AnimeDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AnimeDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create history store
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'id' });
          historyStore.createIndex('by-timestamp', 'timestamp', { unique: false });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Save a history entry to IndexedDB
 */
export async function saveHistoryEntry(entry: HistoryEntry): Promise<void> {
  const db = await getDB();
  await db.put('history', entry);
}

/**
 * Get all history entries, sorted by timestamp (newest first)
 */
export async function getAllHistoryEntries(): Promise<HistoryEntry[]> {
  const db = await getDB();
  const tx = db.transaction('history', 'readonly');
  const index = tx.store.index('by-timestamp');
  const entries = await index.getAll();

  // Sort by timestamp descending (newest first)
  return entries.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Get a single history entry by ID
 */
export async function getHistoryEntry(id: string): Promise<HistoryEntry | undefined> {
  const db = await getDB();
  return db.get('history', id);
}

/**
 * Delete a history entry by ID
 */
export async function deleteHistoryEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('history', id);
}

/**
 * Delete all history entries
 */
export async function clearAllHistory(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('history', 'readwrite');
  await tx.store.clear();
  await tx.done;
}

/**
 * Get the count of history entries
 */
export async function getHistoryCount(): Promise<number> {
  const db = await getDB();
  return db.count('history');
}

/**
 * Migrate data from localStorage to IndexedDB
 */
export async function migrateFromLocalStorage(): Promise<number> {
  const OLD_STORAGE_KEYS = ['anime-history', 'anime-maker-history'];

  try {
    let oldData: string | null = null;
    let usedKey: string | null = null;

    // Try both possible keys
    for (const key of OLD_STORAGE_KEYS) {
      oldData = localStorage.getItem(key);
      if (oldData) {
        usedKey = key;
        break;
      }
    }

    if (!oldData) {
      console.log('No localStorage data to migrate');
      return 0;
    }

    const rawEntries: any[] = JSON.parse(oldData);
    if (!Array.isArray(rawEntries) || rawEntries.length === 0) {
      console.log('No valid entries to migrate');
      return 0;
    }

    console.log(`Migrating ${rawEntries.length} entries from localStorage to IndexedDB...`);

    // Save all entries to IndexedDB (convert timestamp strings to numbers)
    const db = await getDB();
    const tx = db.transaction('history', 'readwrite');

    for (const entry of rawEntries) {
      // Convert string timestamp to number if needed
      const migratedEntry: HistoryEntry = {
        ...entry,
        timestamp: typeof entry.timestamp === 'string'
          ? new Date(entry.timestamp).getTime()
          : entry.timestamp
      };
      await tx.store.put(migratedEntry);
    }

    await tx.done;

    // Remove old localStorage data after successful migration
    if (usedKey) {
      localStorage.removeItem(usedKey);
    }
    console.log(`✅ Successfully migrated ${rawEntries.length} entries to IndexedDB`);

    return rawEntries.length;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}
