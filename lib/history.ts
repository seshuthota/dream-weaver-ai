import type { HistoryEntry, AnimeInput, GenerationResult } from '@/types';
import {
  getAllHistoryEntries,
  saveHistoryEntry,
  deleteHistoryEntry as deleteHistoryEntryDB,
  clearAllHistory,
  getHistoryCount as getHistoryCountDB,
  migrateFromLocalStorage,
} from './db';

const MAX_ENTRIES = 20;

// Auto-migrate on first load
let migrationDone = false;

/**
 * Reset migration flag (for testing)
 */
export function resetMigration() {
  migrationDone = false;
}

async function ensureMigration() {
  if (migrationDone || typeof window === 'undefined') return;

  try {
    const migratedCount = await migrateFromLocalStorage();
    if (migratedCount > 0) {
      console.log(`✅ Migrated ${migratedCount} history entries to IndexedDB`);
    }
    migrationDone = true;
  } catch (error) {
    console.error('Migration error:', error);
    migrationDone = true; // Don't retry on error
  }
}

/**
 * Get all history entries from IndexedDB
 */
export async function getHistory(): Promise<HistoryEntry[]> {
  if (typeof window === 'undefined') return [];

  try {
    await ensureMigration();
    return await getAllHistoryEntries();
  } catch (error) {
    console.error('Error loading history:', error);
    return [];
  }
}

/**
 * Get a single history entry by ID
 */
export async function getHistoryEntry(id: string): Promise<HistoryEntry | null> {
  const history = await getHistory();
  return history.find(entry => entry.id === id) || null;
}

/**
 * Save a new generation to history
 */
export async function saveToHistory(input: AnimeInput, result: GenerationResult): Promise<string> {
  if (typeof window === 'undefined') return '';

  try {
    await ensureMigration();

    // Generate title from outline (first 50 chars)
    const title = input.outline.substring(0, 50) + (input.outline.length > 50 ? '...' : '');

    // Get thumbnail (first scene image)
    const thumbnail = result.scenes.length > 0 ? result.scenes[0].image_url : '';

    // Create new entry
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      input,
      result,
      thumbnail,
      title,
    };

    // Save to IndexedDB
    await saveHistoryEntry(entry);

    // Clean up old entries if exceeding MAX_ENTRIES
    const history = await getAllHistoryEntries();
    if (history.length > MAX_ENTRIES) {
      const entriesToDelete = history.slice(MAX_ENTRIES);
      for (const oldEntry of entriesToDelete) {
        await deleteHistoryEntryDB(oldEntry.id);
      }
    }

    return entry.id;
  } catch (error) {
    console.error('Error saving to history:', error);
    return '';
  }
}

/**
 * Delete a history entry by ID
 */
export async function deleteHistoryEntry(id: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    await deleteHistoryEntryDB(id);
    return true;
  } catch (error) {
    console.error('Error deleting history entry:', error);
    return false;
  }
}

/**
 * Clear all history
 */
export async function clearHistory(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    await clearAllHistory();
    return true;
  } catch (error) {
    console.error('Error clearing history:', error);
    return false;
  }
}

/**
 * Get history count
 */
export async function getHistoryCount(): Promise<number> {
  if (typeof window === 'undefined') return 0;

  try {
    await ensureMigration();
    return await getHistoryCountDB();
  } catch (error) {
    console.error('Error getting history count:', error);
    return 0;
  }
}

/**
 * Search history by keyword
 */
export async function searchHistory(query: string): Promise<HistoryEntry[]> {
  const history = await getHistory();
  const lowerQuery = query.toLowerCase();

  return history.filter(entry =>
    entry.title.toLowerCase().includes(lowerQuery) ||
    entry.input.outline.toLowerCase().includes(lowerQuery) ||
    entry.input.style.toLowerCase().includes(lowerQuery) ||
    entry.input.characters.some(c =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.traits.toLowerCase().includes(lowerQuery)
    )
  );
}

/**
 * Get storage usage estimate (in KB)
 * Note: IndexedDB doesn't provide easy size calculation, so this is approximate
 */
export async function getStorageSize(): Promise<number> {
  if (typeof window === 'undefined') return 0;

  try {
    const history = await getHistory();
    if (history.length === 0) return 0;

    // Rough estimate based on JSON size
    const jsonSize = JSON.stringify(history).length;
    return Math.round((jsonSize * 2) / 1024);
  } catch (error) {
    return 0;
  }
}
