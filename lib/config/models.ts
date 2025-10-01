export const AI_PROVIDERS = {
  OPENROUTER: 'openrouter',
  // Future: Add OPENAI, ANTHROPIC, etc.
} as const;

export type AIProvider = typeof AI_PROVIDERS[keyof typeof AI_PROVIDERS];

export interface ModelConfig {
  provider: AIProvider;
  model: string;
  description: string;
}

export const MODELS: Record<string, ModelConfig> = {
  story: {
    provider: AI_PROVIDERS.OPENROUTER,
    model: 'x-ai/grok-4-fast:free',
    description: 'Fast story generation with character profiles',
  },
  prompt: {
    provider: AI_PROVIDERS.OPENROUTER,
    model: 'x-ai/grok-4-fast:free',
    description: 'Image prompt enhancement and optimization',
  },
  image: {
    provider: AI_PROVIDERS.OPENROUTER,
    model: 'google/gemini-2.5-flash-image-preview',
    description: 'AI image generation',
  },
  verification: {
    provider: AI_PROVIDERS.OPENROUTER,
    model: 'x-ai/grok-4-fast:free',
    description: 'Image quality verification and scoring',
  },
} as const;

export const API_CONFIG = {
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      'X-Title': process.env.NEXT_PUBLIC_SITE_NAME || 'Dream Weaver AI',
    },
  },
} as const;
