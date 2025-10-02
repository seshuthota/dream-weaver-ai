import { NextRequest } from 'next/server';
import type { ModelSelection } from '@/types';

/**
 * Client-side API key management
 * Stores API keys in localStorage for user privacy
 */
export const clientApiKey = {
  /**
   * Save API key to localStorage
   */
  set: (key: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('openrouter_api_key', key);
    }
  },

  /**
   * Retrieve API key from localStorage
   */
  get: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('openrouter_api_key');
    }
    return null;
  },

  /**
   * Remove API key from localStorage
   */
  remove: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('openrouter_api_key');
    }
  },

  /**
   * Check if API key exists
   */
  exists: (): boolean => {
    if (typeof window !== 'undefined') {
      const key = localStorage.getItem('openrouter_api_key');
      return !!key && key.length > 0;
    }
    return false;
  },

  /**
   * Validate API key format (basic check)
   */
  validate: (key: string): boolean => {
    // Basic validation: non-empty string, reasonable length
    return typeof key === 'string' && key.length > 10 && key.trim().length > 0;
  },
};

/**
 * Server-side API key retrieval
 * Priority: User-provided key > Environment variable
 */
export function getApiKey(request: NextRequest): string | null {
  // First, check user-provided key in header
  const userKey = request.headers.get('x-api-key');
  if (userKey && userKey.trim().length > 0) {
    return userKey.trim();
  }

  // Fallback to environment variable (optional, for server-side defaults)
  const envKey = process.env.OPENROUTER_API_KEY;
  if (envKey && envKey.trim().length > 0) {
    return envKey.trim();
  }

  return null;
}

/**
 * Validate that an API key is present
 */
export function requireApiKey(apiKey: string | null): asserts apiKey is string {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('API key is required. Please provide your OpenRouter API key.');
  }
}

/**
 * Client-side model selection management
 * Stores user's model preferences in localStorage
 */
export const clientModelSelection = {
  /**
   * Save model selection to localStorage
   */
  set: (selection: ModelSelection): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('openrouter_model_selection', JSON.stringify(selection));
    }
  },

  /**
   * Retrieve model selection from localStorage
   */
  get: (): ModelSelection | null => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('openrouter_model_selection');
      if (stored) {
        try {
          return JSON.parse(stored) as ModelSelection;
        } catch {
          return null;
        }
      }
    }
    return null;
  },

  /**
   * Remove model selection from localStorage
   */
  remove: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('openrouter_model_selection');
    }
  },

  /**
   * Get text model (with fallback to default)
   */
  getTextModel: (): string | null => {
    const selection = clientModelSelection.get();
    return selection?.textModel || null;
  },

  /**
   * Get image model (with fallback to default)
   */
  getImageModel: (): string | null => {
    const selection = clientModelSelection.get();
    return selection?.imageModel || null;
  },

  /**
   * Get verification model (with fallback to default)
   */
  getVerificationModel: (): string | null => {
    const selection = clientModelSelection.get();
    return selection?.verificationModel || null;
  },

  /**
   * Check if model selection exists
   */
  exists: (): boolean => {
    if (typeof window !== 'undefined') {
      const selection = localStorage.getItem('openrouter_model_selection');
      return !!selection;
    }
    return false;
  },
};
