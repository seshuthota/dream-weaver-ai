import type { CharacterProfile } from '@/types';

/**
 * Simple LRU Cache for character prompt descriptions
 * Reduces token usage by caching character descriptions across multiple scene generations
 */
class PromptCache {
  private cache: Map<string, string>;
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Generate a cache key from character profiles
   */
  private generateKey(characters: Record<string, CharacterProfile>): string {
    const sortedChars = Object.keys(characters).sort();
    return sortedChars
      .map((name) => {
        const char = characters[name];
        return `${name}:${char.appearance}:${char.outfit}`;
      })
      .join('|');
  }

  /**
   * Get cached character descriptions or generate new ones
   */
  get(characters: Record<string, CharacterProfile>): string | null {
    const key = this.generateKey(characters);

    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key)!;
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }

    return null;
  }

  /**
   * Store character descriptions in cache
   */
  set(characters: Record<string, CharacterProfile>, descriptions: string): void {
    const key = this.generateKey(characters);

    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, descriptions);
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// Global cache instance
export const promptCache = new PromptCache(50);

/**
 * Generate character descriptions with caching
 */
export function getCharacterDescriptions(
  characterNames: string[],
  characters: Record<string, CharacterProfile>
): string {
  // Try to get from cache first
  const cached = promptCache.get(characters);
  if (cached) {
    console.log('✅ Using cached character descriptions');
    return cached;
  }

  // Generate new descriptions
  const descriptions = characterNames
    .map((charName) => {
      const char = characters[charName];
      if (!char) return `${charName}: (character details not found)`;
      let desc = `${charName}: ${char.appearance}, wearing ${char.outfit}`;
      if (char.visual_markers) {
        desc += `, distinctive features: ${char.visual_markers}`;
      }
      return desc;
    })
    .join('\n');

  // Cache for future use
  promptCache.set(characters, descriptions);
  console.log('💾 Cached character descriptions');

  return descriptions;
}
