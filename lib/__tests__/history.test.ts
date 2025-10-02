import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getHistory,
  getHistoryEntry,
  saveToHistory,
  deleteHistoryEntry,
  clearHistory,
  getHistoryCount,
  searchHistory,
  getStorageSize,
  resetMigration,
} from '../history';
import * as db from '../db';
import type { AnimeInput, GenerationResult, HistoryEntry } from '@/types';

// Mock the db module
vi.mock('../db', () => ({
  getAllHistoryEntries: vi.fn(),
  saveHistoryEntry: vi.fn(),
  deleteHistoryEntry: vi.fn(),
  clearAllHistory: vi.fn(),
  getHistoryCount: vi.fn(),
  migrateFromLocalStorage: vi.fn(),
  resetDB: vi.fn(),
}));

describe('History Functions', () => {
  const mockInput: AnimeInput = {
    outline: 'A brave hero saves the world from darkness',
    characters: [
      { name: 'Hero', traits: 'Brave, strong, determined' },
      { name: 'Villain', traits: 'Evil, cunning, powerful' },
    ],
    style: 'shounen',
    episodes: 1,
    scenes_per_episode: 3,
  };

  const mockResult: GenerationResult = {
    script: 'Test script content',
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
    scenes: [
      {
        scene_id: 'scene-1',
        image_url: '/images/scene1.png',
        description: 'Hero stands ready for battle',
        attempts: 1,
      },
    ],
    metadata: {
      success: true,
      total_scenes: 3,
      passed_verification: 3,
      needs_review: 0,
      generation_time_seconds: 60,
      timestamp: new Date().toISOString(),
      actual_cost: 0.21,
    },
  };

  const mockEntry: HistoryEntry = {
    id: '1234567890',
    timestamp: Date.now(),
    title: 'A brave hero saves the world from darkness',
    thumbnail: '/images/scene1.png',
    input: mockInput,
    result: mockResult,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetMigration();
  });

  describe('getHistory', () => {
    it('should trigger migration on first call', async () => {
      vi.mocked(db.migrateFromLocalStorage).mockResolvedValue(0);
      vi.mocked(db.getAllHistoryEntries).mockResolvedValue([]);

      await getHistory();

      expect(db.migrateFromLocalStorage).toHaveBeenCalledTimes(1);
    });

    it('should not trigger migration on subsequent calls', async () => {
      vi.mocked(db.migrateFromLocalStorage).mockResolvedValue(0);
      vi.mocked(db.getAllHistoryEntries).mockResolvedValue([]);

      await getHistory();
      await getHistory();

      expect(db.migrateFromLocalStorage).toHaveBeenCalledTimes(1);
    });

    it('should return all history entries from IndexedDB', async () => {
      const entries = [mockEntry];
      vi.mocked(db.migrateFromLocalStorage).mockResolvedValue(0);
      vi.mocked(db.getAllHistoryEntries).mockResolvedValue(entries);

      const result = await getHistory();

      expect(result).toEqual(entries);
      expect(db.getAllHistoryEntries).toHaveBeenCalled();
    });

    it('should return empty array on error', async () => {
      vi.mocked(db.migrateFromLocalStorage).mockRejectedValue(new Error('Migration failed'));
      vi.mocked(db.getAllHistoryEntries).mockRejectedValue(new Error('DB error'));

      const result = await getHistory();

      expect(result).toEqual([]);
    });

    it('should handle window undefined (SSR)', async () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const result = await getHistory();

      expect(result).toEqual([]);
      expect(db.migrateFromLocalStorage).not.toHaveBeenCalled();

      global.window = originalWindow;
    });
  });

  describe('getHistoryEntry', () => {
    it('should return entry by id', async () => {
      vi.mocked(db.migrateFromLocalStorage).mockResolvedValue(0);
      vi.mocked(db.getAllHistoryEntries).mockResolvedValue([mockEntry]);

      const result = await getHistoryEntry(mockEntry.id);

      expect(result).toEqual(mockEntry);
    });

    it('should return null for non-existent entry', async () => {
      vi.mocked(db.migrateFromLocalStorage).mockResolvedValue(0);
      vi.mocked(db.getAllHistoryEntries).mockResolvedValue([mockEntry]);

      const result = await getHistoryEntry('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('saveToHistory', () => {
    it('should create entry with correct structure', async () => {
      vi.mocked(db.migrateFromLocalStorage).mockResolvedValue(0);
      vi.mocked(db.saveHistoryEntry).mockResolvedValue();
      vi.mocked(db.getAllHistoryEntries).mockResolvedValue([]);

      const entryId = await saveToHistory(mockInput, mockResult);

      expect(entryId).toBeTruthy();
      expect(db.saveHistoryEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          timestamp: expect.any(Number),
          title: expect.stringContaining('A brave hero saves the world'),
          thumbnail: '/images/scene1.png',
          input: mockInput,
          result: mockResult,
        })
      );
    });

    it('should truncate long titles to 50 chars + ellipsis', async () => {
      const longOutline = 'A'.repeat(100);
      const longInput = { ...mockInput, outline: longOutline };

      vi.mocked(db.migrateFromLocalStorage).mockResolvedValue(0);
      vi.mocked(db.saveHistoryEntry).mockResolvedValue();
      vi.mocked(db.getAllHistoryEntries).mockResolvedValue([]);

      await saveToHistory(longInput, mockResult);

      const savedEntry = vi.mocked(db.saveHistoryEntry).mock.calls[0][0];
      expect(savedEntry.title).toHaveLength(53); // 50 + '...'
      expect(savedEntry.title.endsWith('...')).toBe(true);
    });

    it('should use first scene image as thumbnail', async () => {
      vi.mocked(db.migrateFromLocalStorage).mockResolvedValue(0);
      vi.mocked(db.saveHistoryEntry).mockResolvedValue();
      vi.mocked(db.getAllHistoryEntries).mockResolvedValue([]);

      await saveToHistory(mockInput, mockResult);

      const savedEntry = vi.mocked(db.saveHistoryEntry).mock.calls[0][0];
      expect(savedEntry.thumbnail).toBe('/images/scene1.png');
    });

    it('should handle empty scenes array', async () => {
      const emptyResult = { ...mockResult, scenes: [] };

      vi.mocked(db.migrateFromLocalStorage).mockResolvedValue(0);
      vi.mocked(db.saveHistoryEntry).mockResolvedValue();
      vi.mocked(db.getAllHistoryEntries).mockResolvedValue([]);

      await saveToHistory(mockInput, emptyResult);

      const savedEntry = vi.mocked(db.saveHistoryEntry).mock.calls[0][0];
      expect(savedEntry.thumbnail).toBe('');
    });

    it('should cleanup old entries when exceeding MAX_ENTRIES', async () => {
      const oldEntries = Array.from({ length: 25 }, (_, i) => ({
        ...mockEntry,
        id: `old-${i}`,
        timestamp: Date.now() - i * 1000,
      }));

      vi.mocked(db.migrateFromLocalStorage).mockResolvedValue(0);
      vi.mocked(db.saveHistoryEntry).mockResolvedValue();
      vi.mocked(db.getAllHistoryEntries).mockResolvedValue(oldEntries);
      vi.mocked(db.deleteHistoryEntry).mockResolvedValue();

      await saveToHistory(mockInput, mockResult);

      // Should delete 5 oldest entries (25 existing + 1 new - 20 max = 6 to delete, but we saved 1 so 5)
      expect(db.deleteHistoryEntry).toHaveBeenCalledTimes(5);
    });

    it('should return empty string on error', async () => {
      vi.mocked(db.migrateFromLocalStorage).mockRejectedValue(new Error('Migration failed'));
      vi.mocked(db.saveHistoryEntry).mockRejectedValue(new Error('Save failed'));

      const entryId = await saveToHistory(mockInput, mockResult);

      expect(entryId).toBe('');
    });

    it('should handle window undefined (SSR)', async () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const result = await saveToHistory(mockInput, mockResult);

      expect(result).toBe('');
      expect(db.saveHistoryEntry).not.toHaveBeenCalled();

      global.window = originalWindow;
    });
  });

  describe('deleteHistoryEntry', () => {
    it('should delete entry by id', async () => {
      vi.mocked(db.deleteHistoryEntry).mockResolvedValue();

      const result = await deleteHistoryEntry('test-id');

      expect(result).toBe(true);
      expect(db.deleteHistoryEntry).toHaveBeenCalledWith('test-id');
    });

    it('should return false on error', async () => {
      vi.mocked(db.deleteHistoryEntry).mockRejectedValue(new Error('Delete failed'));

      const result = await deleteHistoryEntry('test-id');

      expect(result).toBe(false);
    });
  });

  describe('clearHistory', () => {
    it('should clear all history', async () => {
      vi.mocked(db.clearAllHistory).mockResolvedValue();

      const result = await clearHistory();

      expect(result).toBe(true);
      expect(db.clearAllHistory).toHaveBeenCalled();
    });

    it('should return false on error', async () => {
      vi.mocked(db.clearAllHistory).mockRejectedValue(new Error('Clear failed'));

      const result = await clearHistory();

      expect(result).toBe(false);
    });
  });

  describe('getHistoryCount', () => {
    it('should trigger migration before counting', async () => {
      vi.mocked(db.migrateFromLocalStorage).mockResolvedValue(5);
      vi.mocked(db.getHistoryCount).mockResolvedValue(5);

      const count = await getHistoryCount();

      expect(db.migrateFromLocalStorage).toHaveBeenCalled();
      expect(count).toBe(5);
    });

    it('should return 0 on error', async () => {
      vi.mocked(db.migrateFromLocalStorage).mockRejectedValue(new Error('Migration failed'));
      vi.mocked(db.getHistoryCount).mockRejectedValue(new Error('Count failed'));

      const count = await getHistoryCount();

      expect(count).toBe(0);
    });

    it('should return 0 when window is undefined', async () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const count = await getHistoryCount();

      expect(count).toBe(0);

      global.window = originalWindow;
    });
  });

  describe('searchHistory', () => {
    const entries: HistoryEntry[] = [
      {
        ...mockEntry,
        id: '1',
        title: 'Hero saves the world',
        input: {
          ...mockInput,
          outline: 'Epic battle scene',
          style: 'shounen',
        },
      },
      {
        ...mockEntry,
        id: '2',
        title: 'Romance in the garden',
        input: {
          ...mockInput,
          outline: 'Love story',
          style: 'shoujo',
          characters: [{ name: 'Alice', traits: 'Kind, gentle' }],
        },
      },
      {
        ...mockEntry,
        id: '3',
        title: 'Mystery detective',
        input: {
          ...mockInput,
          outline: 'Crime investigation',
          style: 'seinen',
        },
      },
    ];

    it('should search by title', async () => {
      vi.mocked(db.migrateFromLocalStorage).mockResolvedValue(0);
      vi.mocked(db.getAllHistoryEntries).mockResolvedValue(entries);

      const results = await searchHistory('romance');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('2');
    });

    it('should search by outline', async () => {
      vi.mocked(db.migrateFromLocalStorage).mockResolvedValue(0);
      vi.mocked(db.getAllHistoryEntries).mockResolvedValue(entries);

      const results = await searchHistory('battle');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should search by style', async () => {
      vi.mocked(db.migrateFromLocalStorage).mockResolvedValue(0);
      vi.mocked(db.getAllHistoryEntries).mockResolvedValue(entries);

      const results = await searchHistory('shoujo');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('2');
    });

    it('should search by character name', async () => {
      vi.mocked(db.migrateFromLocalStorage).mockResolvedValue(0);
      vi.mocked(db.getAllHistoryEntries).mockResolvedValue(entries);

      const results = await searchHistory('alice');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('2');
    });

    it('should search by character traits', async () => {
      vi.mocked(db.migrateFromLocalStorage).mockResolvedValue(0);
      vi.mocked(db.getAllHistoryEntries).mockResolvedValue(entries);

      const results = await searchHistory('gentle');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('2');
    });

    it('should be case-insensitive', async () => {
      vi.mocked(db.migrateFromLocalStorage).mockResolvedValue(0);
      vi.mocked(db.getAllHistoryEntries).mockResolvedValue(entries);

      const results = await searchHistory('ROMANCE');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('2');
    });

    it('should return multiple matches', async () => {
      vi.mocked(db.migrateFromLocalStorage).mockResolvedValue(0);
      vi.mocked(db.getAllHistoryEntries).mockResolvedValue(entries);

      const results = await searchHistory('the');

      expect(results.length).toBeGreaterThan(1);
    });

    it('should return empty array for no matches', async () => {
      vi.mocked(db.migrateFromLocalStorage).mockResolvedValue(0);
      vi.mocked(db.getAllHistoryEntries).mockResolvedValue(entries);

      const results = await searchHistory('nonexistent');

      expect(results).toEqual([]);
    });
  });

  describe('getStorageSize', () => {
    it('should calculate approximate size based on JSON length', async () => {
      vi.mocked(db.migrateFromLocalStorage).mockResolvedValue(0);
      vi.mocked(db.getAllHistoryEntries).mockResolvedValue([mockEntry]);

      const size = await getStorageSize();

      expect(size).toBeGreaterThan(0);
      expect(typeof size).toBe('number');
    });

    it('should return 0 for empty history', async () => {
      vi.mocked(db.migrateFromLocalStorage).mockResolvedValue(0);
      vi.mocked(db.getAllHistoryEntries).mockResolvedValue([]);

      const size = await getStorageSize();

      expect(size).toBe(0);
    });

    it('should return 0 on error', async () => {
      vi.mocked(db.migrateFromLocalStorage).mockRejectedValue(new Error('Failed'));

      const size = await getStorageSize();

      expect(size).toBe(0);
    });

    it('should return 0 when window is undefined', async () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const size = await getStorageSize();

      expect(size).toBe(0);

      global.window = originalWindow;
    });
  });
});
