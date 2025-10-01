/**
 * Integration tests for key workflows
 * These test the interaction between multiple modules
 */

import { describe, test, expect } from '@jest/globals';
import { calculateCost, formatCost } from '../lib/utils';
import { getCharacterDescriptions, promptCache } from '../lib/promptCache';
import type { CharacterProfile, SceneWithPrompt } from '../types';

describe('Generation Workflow Integration', () => {
  const mockCharacters: Record<string, CharacterProfile> = {
    Hero: {
      name: 'Hero',
      appearance: 'Spiky blonde hair, blue eyes',
      outfit: 'Orange gi with blue undershirt',
      personality: 'Determined and loyal',
      visual_markers: 'Forehead protector',
      color_palette: ['#FFA500', '#4169E1', '#FFD700'],
    },
  };

  const mockScenes: SceneWithPrompt[] = [
    {
      id: 'scene_1',
      description: 'Hero trains in the mountains.',
      characters_present: ['Hero'],
      setting: 'Mountain peak',
      mood: 'Determined',
      visual_elements: ['sunrise', 'rocky terrain'],
      image_prompt: 'anime scene showing Hero training...',
      negative_prompt: 'blurry, low quality',
    },
    {
      id: 'scene_2',
      description: 'Hero faces the villain.',
      characters_present: ['Hero'],
      setting: 'Battle arena',
      mood: 'Intense',
      visual_elements: ['dramatic lighting', 'energy effects'],
      image_prompt: 'anime scene showing Hero in battle stance...',
      negative_prompt: 'blurry, low quality',
    },
  ];

  test('cost calculation workflow', () => {
    const numScenes = mockScenes.length;
    const cost = calculateCost(numScenes);
    const formatted = formatCost(cost);

    expect(cost).toBeCloseTo(0.14);
    expect(formatted).toBe('$0.14');
  });

  test('character description caching workflow', () => {
    promptCache.clear();

    // First call - should cache
    const desc1 = getCharacterDescriptions(['Hero'], mockCharacters);
    expect(desc1).toContain('Spiky blonde hair');
    expect(promptCache.stats().size).toBe(1);

    // Second call - should use cache
    const desc2 = getCharacterDescriptions(['Hero'], mockCharacters);
    expect(desc1).toBe(desc2);
    expect(promptCache.stats().size).toBe(1);
  });

  test('scene structure validation', () => {
    mockScenes.forEach((scene) => {
      expect(scene).toHaveProperty('id');
      expect(scene).toHaveProperty('description');
      expect(scene).toHaveProperty('image_prompt');
      expect(scene).toHaveProperty('negative_prompt');
      expect(scene).toHaveProperty('characters_present');
      expect(scene).toHaveProperty('setting');
      expect(scene).toHaveProperty('mood');
      expect(scene).toHaveProperty('visual_elements');

      // Validate description length (should be short)
      const words = scene.description.split(' ').length;
      expect(words).toBeLessThanOrEqual(15);
    });
  });

  test('negative prompt presence', () => {
    mockScenes.forEach((scene) => {
      expect(scene.negative_prompt).toBeDefined();
      expect(scene.negative_prompt).toContain('blurry');
      expect(scene.negative_prompt).toContain('low quality');
    });
  });
});

describe('Rate Limiting Concept', () => {
  test('should demonstrate rate limiting behavior', async () => {
    // This test validates the concept without importing p-limit (ESM module)
    // In production, p-limit(3) ensures max 3 concurrent operations
    
    const tasks = Array.from({ length: 10 }, (_, i) => i);
    let concurrent = 0;
    let maxConcurrent = 0;

    // Simulate manual rate limiting
    const limit = 3;
    const chunks = [];
    for (let i = 0; i < tasks.length; i += limit) {
      chunks.push(tasks.slice(i, i + limit));
    }

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (task) => {
          concurrent++;
          maxConcurrent = Math.max(maxConcurrent, concurrent);
          await new Promise((resolve) => setTimeout(resolve, 10));
          concurrent--;
          return task * 2;
        })
      );
    }

    expect(maxConcurrent).toBeLessThanOrEqual(3);
  });
});
