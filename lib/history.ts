import type { HistoryEntry, AnimeInput, GenerationResult } from '@/types';

const HISTORY_KEY = 'anime-maker-history';
const MAX_ENTRIES = 20;

/**
 * Get all history entries from localStorage
 */
export function getHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];

    const entries: HistoryEntry[] = JSON.parse(stored);
    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('Error loading history:', error);
    return [];
  }
}

/**
 * Get a single history entry by ID
 */
export function getHistoryEntry(id: string): HistoryEntry | null {
  const history = getHistory();
  return history.find(entry => entry.id === id) || null;
}

/**
 * Save a new generation to history
 */
export function saveToHistory(input: AnimeInput, result: GenerationResult): string {
  if (typeof window === 'undefined') return '';

  try {
    const history = getHistory();

    // Generate title from outline (first 50 chars)
    const title = input.outline.substring(0, 50) + (input.outline.length > 50 ? '...' : '');

    // Get thumbnail (first scene image)
    const thumbnail = result.scenes.length > 0 ? result.scenes[0].image_url : '';

    // Create new entry
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      input,
      result,
      thumbnail,
      title,
    };

    // Add to beginning of array
    history.unshift(entry);

    // Limit to MAX_ENTRIES (delete oldest)
    if (history.length > MAX_ENTRIES) {
      history.splice(MAX_ENTRIES);
    }

    // Save to localStorage
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

    return entry.id;
  } catch (error) {
    console.error('Error saving to history:', error);
    return '';
  }
}

/**
 * Delete a history entry by ID
 */
export function deleteHistoryEntry(id: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const history = getHistory();
    const filtered = history.filter(entry => entry.id !== id);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting history entry:', error);
    return false;
  }
}

/**
 * Clear all history
 */
export function clearHistory(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.removeItem(HISTORY_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing history:', error);
    return false;
  }
}

/**
 * Get history count
 */
export function getHistoryCount(): number {
  return getHistory().length;
}

/**
 * Search history by keyword
 */
export function searchHistory(query: string): HistoryEntry[] {
  const history = getHistory();
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
 */
export function getStorageSize(): number {
  if (typeof window === 'undefined') return 0;

  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return 0;

    // Rough estimate: length * 2 (UTF-16) / 1024
    return Math.round((stored.length * 2) / 1024);
  } catch (error) {
    return 0;
  }
}
