import { describe, test, expect, beforeEach } from '@jest/globals';
import { promptCache, getCharacterDescriptions } from '../lib/promptCache';
import type { CharacterProfile } from '../types';

describe('Prompt Cache', () => {
  beforeEach(() => {
    promptCache.clear();
  });

  const mockCharacters: Record<string, CharacterProfile> = {
    Alice: {
      name: 'Alice',
      appearance: 'Short blue hair, green eyes',
      outfit: 'School uniform with red tie',
      personality: 'Energetic and optimistic',
      visual_markers: 'Star-shaped hairpin',
      color_palette: ['#4A90E2', '#E74C3C', '#FFFFFF'],
    },
    Bob: {
      name: 'Bob',
      appearance: 'Tall with black hair',
      outfit: 'Casual jeans and t-shirt',
      personality: 'Calm and analytical',
      visual_markers: 'Round glasses',
      color_palette: ['#2C3E50', '#3498DB', '#ECF0F1'],
    },
  };

  test('should cache character descriptions', () => {
    const desc1 = getCharacterDescriptions(['Alice'], mockCharacters);
    expect(desc1).toContain('Alice');
    expect(desc1).toContain('Short blue hair');

    const stats = promptCache.stats();
    expect(stats.size).toBe(1);
  });

  test('should return cached descriptions on subsequent calls', () => {
    const desc1 = getCharacterDescriptions(['Alice', 'Bob'], mockCharacters);
    const desc2 = getCharacterDescriptions(['Alice', 'Bob'], mockCharacters);

    expect(desc1).toBe(desc2);
    expect(promptCache.stats().size).toBe(1);
  });

  test('should handle missing characters gracefully', () => {
    const desc = getCharacterDescriptions(['Charlie'], mockCharacters);
    expect(desc).toContain('character details not found');
  });

  test('should include visual markers in descriptions', () => {
    const desc = getCharacterDescriptions(['Alice'], mockCharacters);
    expect(desc).toContain('Star-shaped hairpin');
  });

  test('should format descriptions correctly', () => {
    const desc = getCharacterDescriptions(['Bob'], mockCharacters);
    expect(desc).toMatch(/Bob:.*Tall with black hair.*wearing.*Casual jeans.*Round glasses/);
  });

  test('should cache based on all characters in set', () => {
    // The cache key is based on ALL characters in the Record, not just the requested ones
    // So all these calls use the same character set (Alice + Bob)
    getCharacterDescriptions(['Alice'], mockCharacters);
    getCharacterDescriptions(['Bob'], mockCharacters);
    getCharacterDescriptions(['Alice', 'Bob'], mockCharacters);

    // All three calls share the same cache key since mockCharacters contains both Alice and Bob
    expect(promptCache.stats().size).toBe(1);
  });

  test('should clear cache correctly', () => {
    getCharacterDescriptions(['Alice'], mockCharacters);
    expect(promptCache.stats().size).toBe(1);

    promptCache.clear();
    expect(promptCache.stats().size).toBe(0);
  });

  test('should respect max size limit', () => {
    const cache = promptCache;
    const stats = cache.stats();

    expect(stats.maxSize).toBe(50);
  });
});
