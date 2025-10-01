export const APP_CONFIG = {
  name: 'Dream Weaver AI',
  version: '1.0.0',
  description: 'Generate beautiful anime scenes with AI',
  
  features: {
    comicMode: true,
    historyPanel: true,
    presets: true,
    multipleViewModes: true,
  },
  
  limits: {
    maxCharacters: 5,
    minCharacters: 1,
    maxScenes: 10,
    minScenes: 1,
    maxImageRetries: 3,
  },
  
  animeStyles: [
    { value: 'shoujo', label: 'Shoujo' },
    { value: 'shounen', label: 'Shounen' },
    { value: 'seinen', label: 'Seinen' },
    { value: 'slice-of-life', label: 'Slice of Life' },
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'sci-fi', label: 'Sci-Fi' },
  ],
  
  storyGeneration: {
    genres: ['Action', 'Romance', 'Fantasy', 'Slice of Life', 'Mystery', 'Comedy'],
    tones: [
      { value: 'light', label: '☀️ Light', desc: 'Fun & upbeat' },
      { value: 'balanced', label: '⚖️ Balanced', desc: 'Mix of both' },
      { value: 'dark', label: '🌙 Dark', desc: 'Serious & intense' }
    ],
    complexity: [
      { value: 'simple', label: 'Simple', desc: '2-3 chars, 3-4 scenes', scenes: 3 },
      { value: 'standard', label: 'Standard', desc: '3-4 chars, 5-6 scenes', scenes: 5 },
      { value: 'epic', label: 'Epic', desc: '4-5 chars, 7-8 scenes', scenes: 7 }
    ],
  },
} as const;

export type AnimeStyle = typeof APP_CONFIG.animeStyles[number]['value'];
export type StoryGenre = typeof APP_CONFIG.storyGeneration.genres[number];
export type StoryTone = typeof APP_CONFIG.storyGeneration.tones[number]['value'];
export type StoryComplexity = typeof APP_CONFIG.storyGeneration.complexity[number]['value'];
