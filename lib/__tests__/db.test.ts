import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import {
  getDB,
  resetDB,
  saveHistoryEntry,
  getAllHistoryEntries,
  getHistoryEntry,
  deleteHistoryEntry,
  clearAllHistory,
  getHistoryCount,
  migrateFromLocalStorage,
} from '../db';
import type { HistoryEntry } from '@/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Reset IndexedDB before each test
beforeEach(async () => {
  // Reset the dbPromise
  resetDB();

  // Create fresh IndexedDB instance
  global.indexedDB = new IDBFactory();

  // Clear localStorage
  localStorageMock.clear();
});

describe('IndexedDB Operations', () => {
  const mockEntry: HistoryEntry = {
    id: '1234567890',
    timestamp: Date.now(),
    title: 'Test Story',
    thumbnail: '/images/test.png',
    input: {
      outline: 'A test story about anime',
      characters: [{ name: 'Hero', traits: 'Brave, strong' }],
      style: 'shounen',
      episodes: 1,
      scenes_per_episode: 3,
    },
    result: {
      script: 'Test script',
      characters: {
        Hero: {
          name: 'Hero',
          appearance: 'Tall and muscular',
          outfit: 'Red jacket',
          personality: 'Brave',
          visual_markers: 'Spiky hair',
          color_palette: ['red', 'black'],
        },
      },
      scenes: [],
      metadata: {
        success: true,
        total_scenes: 3,
        passed_verification: 3,
        needs_review: 0,
        generation_time_seconds: 60,
        timestamp: new Date().toISOString(),
      },
    },
  };

  describe('Database Initialization', () => {
    it('should create database with correct structure', async () => {
      const db = await getDB();

      expect(db.name).toBe('dream-weaver-db');
      expect(db.version).toBe(1);
      expect(db.objectStoreNames.contains('history')).toBe(true);
    });

    it('should create history store with correct indexes', async () => {
      const db = await getDB();
      const tx = db.transaction('history', 'readonly');
      const store = tx.objectStore('history');

      expect(store.keyPath).toBe('id');
      expect(store.indexNames.contains('by-timestamp')).toBe(true);
    });
  });

  describe('saveHistoryEntry', () => {
    it('should save a history entry successfully', async () => {
      await saveHistoryEntry(mockEntry);

      const retrieved = await getHistoryEntry(mockEntry.id);
      expect(retrieved).toEqual(mockEntry);
    });

    it('should update existing entry with same id', async () => {
      await saveHistoryEntry(mockEntry);

      const updatedEntry = { ...mockEntry, title: 'Updated Title' };
      await saveHistoryEntry(updatedEntry);

      const retrieved = await getHistoryEntry(mockEntry.id);
      expect(retrieved?.title).toBe('Updated Title');

      const count = await getHistoryCount();
      expect(count).toBe(1);
    });
  });

  describe('getAllHistoryEntries', () => {
    it('should return empty array when no entries exist', async () => {
      const entries = await getAllHistoryEntries();
      expect(entries).toEqual([]);
    });

    it('should return all entries sorted by timestamp (newest first)', async () => {
      const entry1 = { ...mockEntry, id: '1', timestamp: 1000 };
      const entry2 = { ...mockEntry, id: '2', timestamp: 3000 };
      const entry3 = { ...mockEntry, id: '3', timestamp: 2000 };

      await saveHistoryEntry(entry1);
      await saveHistoryEntry(entry2);
      await saveHistoryEntry(entry3);

      const entries = await getAllHistoryEntries();

      expect(entries).toHaveLength(3);
      expect(entries[0].id).toBe('2'); // Newest
      expect(entries[1].id).toBe('3');
      expect(entries[2].id).toBe('1'); // Oldest
    });
  });

  describe('getHistoryEntry', () => {
    it('should return undefined for non-existent entry', async () => {
      const entry = await getHistoryEntry('non-existent');
      expect(entry).toBeUndefined();
    });

    it('should return correct entry by id', async () => {
      await saveHistoryEntry(mockEntry);

      const entry = await getHistoryEntry(mockEntry.id);
      expect(entry).toEqual(mockEntry);
    });
  });

  describe('deleteHistoryEntry', () => {
    it('should delete entry by id', async () => {
      await saveHistoryEntry(mockEntry);

      let count = await getHistoryCount();
      expect(count).toBe(1);

      await deleteHistoryEntry(mockEntry.id);

      count = await getHistoryCount();
      expect(count).toBe(0);

      const entry = await getHistoryEntry(mockEntry.id);
      expect(entry).toBeUndefined();
    });

    it('should not throw error when deleting non-existent entry', async () => {
      await expect(deleteHistoryEntry('non-existent')).resolves.not.toThrow();
    });
  });

  describe('clearAllHistory', () => {
    it('should clear all entries', async () => {
      await saveHistoryEntry({ ...mockEntry, id: '1' });
      await saveHistoryEntry({ ...mockEntry, id: '2' });
      await saveHistoryEntry({ ...mockEntry, id: '3' });

      let count = await getHistoryCount();
      expect(count).toBe(3);

      await clearAllHistory();

      count = await getHistoryCount();
      expect(count).toBe(0);

      const entries = await getAllHistoryEntries();
      expect(entries).toEqual([]);
    });
  });

  describe('getHistoryCount', () => {
    it('should return 0 for empty database', async () => {
      const count = await getHistoryCount();
      expect(count).toBe(0);
    });

    it('should return correct count', async () => {
      await saveHistoryEntry({ ...mockEntry, id: '1' });
      await saveHistoryEntry({ ...mockEntry, id: '2' });

      const count = await getHistoryCount();
      expect(count).toBe(2);
    });
  });

  describe('migrateFromLocalStorage', () => {
    it('should return 0 when no localStorage data exists', async () => {
      const count = await migrateFromLocalStorage();
      expect(count).toBe(0);
    });

    it('should migrate from anime-history key', async () => {
      const oldEntries = [
        { ...mockEntry, id: '1', timestamp: '2024-01-01T00:00:00.000Z' },
        { ...mockEntry, id: '2', timestamp: '2024-01-02T00:00:00.000Z' },
      ];

      localStorage.setItem('anime-history', JSON.stringify(oldEntries));

      const migratedCount = await migrateFromLocalStorage();

      expect(migratedCount).toBe(2);
      expect(localStorage.getItem('anime-history')).toBeNull();

      const entries = await getAllHistoryEntries();
      expect(entries).toHaveLength(2);
      expect(entries[0].timestamp).toBe(new Date('2024-01-02T00:00:00.000Z').getTime());
      expect(entries[1].timestamp).toBe(new Date('2024-01-01T00:00:00.000Z').getTime());
    });

    it('should migrate from anime-maker-history key', async () => {
      const oldEntries = [
        { ...mockEntry, id: '1', timestamp: '2024-01-01T00:00:00.000Z' },
      ];

      localStorage.setItem('anime-maker-history', JSON.stringify(oldEntries));

      const migratedCount = await migrateFromLocalStorage();

      expect(migratedCount).toBe(1);
      expect(localStorage.getItem('anime-maker-history')).toBeNull();

      const entries = await getAllHistoryEntries();
      expect(entries).toHaveLength(1);
    });

    it('should convert string timestamps to numbers', async () => {
      const oldEntries = [
        { ...mockEntry, id: '1', timestamp: '2024-01-15T10:30:00.000Z' },
      ];

      localStorage.setItem('anime-history', JSON.stringify(oldEntries));

      await migrateFromLocalStorage();

      const entries = await getAllHistoryEntries();
      expect(entries[0].timestamp).toBe(new Date('2024-01-15T10:30:00.000Z').getTime());
      expect(typeof entries[0].timestamp).toBe('number');
    });

    it('should handle numeric timestamps without conversion', async () => {
      const timestamp = Date.now();
      const oldEntries = [
        { ...mockEntry, id: '1', timestamp },
      ];

      localStorage.setItem('anime-history', JSON.stringify(oldEntries));

      await migrateFromLocalStorage();

      const entries = await getAllHistoryEntries();
      expect(entries[0].timestamp).toBe(timestamp);
    });

    it('should prefer anime-history over anime-maker-history', async () => {
      localStorage.setItem('anime-history', JSON.stringify([{ ...mockEntry, id: '1', timestamp: 1000 }]));
      localStorage.setItem('anime-maker-history', JSON.stringify([{ ...mockEntry, id: '2', timestamp: 2000 }]));

      const migratedCount = await migrateFromLocalStorage();

      expect(migratedCount).toBe(1);

      const entries = await getAllHistoryEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe('1');
    });

    it('should return 0 for invalid JSON', async () => {
      localStorage.setItem('anime-history', 'invalid json');

      await expect(migrateFromLocalStorage()).rejects.toThrow();
    });

    it('should return 0 for empty array', async () => {
      localStorage.setItem('anime-history', '[]');

      const count = await migrateFromLocalStorage();
      expect(count).toBe(0);
    });

    it('should return 0 for non-array data', async () => {
      localStorage.setItem('anime-history', '{"not": "an array"}');

      const count = await migrateFromLocalStorage();
      expect(count).toBe(0);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent saves correctly', async () => {
      const entries = Array.from({ length: 10 }, (_, i) => ({
        ...mockEntry,
        id: `entry-${i}`,
        timestamp: Date.now() + i,
      }));

      await Promise.all(entries.map(entry => saveHistoryEntry(entry)));

      const count = await getHistoryCount();
      expect(count).toBe(10);

      const retrieved = await getAllHistoryEntries();
      expect(retrieved).toHaveLength(10);
    });

    it('should handle concurrent reads and writes', async () => {
      await saveHistoryEntry(mockEntry);

      const operations = [
        saveHistoryEntry({ ...mockEntry, id: '2' }),
        getHistoryEntry(mockEntry.id),
        getAllHistoryEntries(),
        getHistoryCount(),
      ];

      const results = await Promise.all(operations);

      expect(results[1]).toEqual(mockEntry); // getHistoryEntry result
      expect(results[3]).toBeGreaterThanOrEqual(1); // getHistoryCount result
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large entries', async () => {
      const largeEntry = {
        ...mockEntry,
        result: {
          ...mockEntry.result,
          scenes: Array.from({ length: 100 }, (_, i) => ({
            scene_id: `scene-${i}`,
            image_url: `data:image/png;base64,${'A'.repeat(1000)}`,
            description: 'Test scene with large image data',
            attempts: 1,
          })),
        },
      };

      await expect(saveHistoryEntry(largeEntry)).resolves.not.toThrow();

      const retrieved = await getHistoryEntry(largeEntry.id);
      expect(retrieved?.result.scenes).toHaveLength(100);
    });

    it('should handle special characters in entry data', async () => {
      const specialEntry = {
        ...mockEntry,
        title: '💎 Test with emojis and 特殊文字 special chars!',
        input: {
          ...mockEntry.input,
          outline: 'Story with "quotes", \'apostrophes\', and <html> tags',
        },
      };

      await saveHistoryEntry(specialEntry);

      const retrieved = await getHistoryEntry(specialEntry.id);
      expect(retrieved?.title).toBe(specialEntry.title);
      expect(retrieved?.input.outline).toBe(specialEntry.input.outline);
    });

    it('should maintain data integrity after multiple operations', async () => {
      // Create initial entry
      await saveHistoryEntry(mockEntry);

      // Update it
      const updated = { ...mockEntry, title: 'Updated' };
      await saveHistoryEntry(updated);

      // Add more entries
      await saveHistoryEntry({ ...mockEntry, id: '2' });
      await saveHistoryEntry({ ...mockEntry, id: '3' });

      // Delete one
      await deleteHistoryEntry('2');

      // Verify final state
      const count = await getHistoryCount();
      expect(count).toBe(2);

      const entry1 = await getHistoryEntry(mockEntry.id);
      expect(entry1?.title).toBe('Updated');

      const entry3 = await getHistoryEntry('3');
      expect(entry3).toBeDefined();

      const deleted = await getHistoryEntry('2');
      expect(deleted).toBeUndefined();
    });
  });
});
