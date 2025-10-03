import type { ModelSelection } from '@/types';

export const AI_PROVIDERS = {
  OPENROUTER: 'openrouter',
  POLLINATIONS: 'pollinations',
  // Future: Add OPENAI, ANTHROPIC, etc.
} as const;

export type AIProvider = typeof AI_PROVIDERS[keyof typeof AI_PROVIDERS];

export interface ModelConfig {
  provider: AIProvider;
  model: string;
  description: string;
}

export const DEFAULT_MODELS: ModelSelection = {
  textModel: 'x-ai/grok-4-fast:free',
  imageModel: 'pollinations/flux-anime', // Default to free provider
  verificationModel: 'google/gemini-2.5-flash-image-preview',
  imageProvider: 'pollinations', // Default to free
};

// Pollinations.ai models (free alternative)
export const POLLINATIONS_MODELS = {
  'pollinations/flux-anime': {
    provider: AI_PROVIDERS.POLLINATIONS,
    name: 'Pollinations Flux Anime (FREE)',
    description: 'Free anime-style image generation',
  },
  'pollinations/flux': {
    provider: AI_PROVIDERS.POLLINATIONS,
    name: 'Pollinations Flux (FREE)',
    description: 'Free high-quality image generation',
  },
  'pollinations/flux-realism': {
    provider: AI_PROVIDERS.POLLINATIONS,
    name: 'Pollinations Flux Realism (FREE)',
    description: 'Free photorealistic image generation',
  },
} as const;

export const MODELS: Record<string, ModelConfig> = {
  story: {
    provider: AI_PROVIDERS.OPENROUTER,
    model: DEFAULT_MODELS.textModel,
    description: 'Fast story generation with character profiles',
  },
  prompt: {
    provider: AI_PROVIDERS.OPENROUTER,
    model: DEFAULT_MODELS.textModel,
    description: 'Image prompt enhancement and optimization',
  },
  image: {
    provider: AI_PROVIDERS.OPENROUTER,
    model: DEFAULT_MODELS.imageModel,
    description: 'AI image generation',
  },
  verification: {
    provider: AI_PROVIDERS.OPENROUTER,
    model: DEFAULT_MODELS.verificationModel,
    description: 'Vision-capable model for image quality verification and scoring',
  },
} as const;

export function getActiveModels(userSelection?: ModelSelection | null): ModelSelection {
  if (userSelection) {
    return {
      textModel: userSelection.textModel || DEFAULT_MODELS.textModel,
      imageModel: userSelection.imageModel || DEFAULT_MODELS.imageModel,
      verificationModel: userSelection.verificationModel || DEFAULT_MODELS.verificationModel,
    };
  }
  return DEFAULT_MODELS;
}

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
