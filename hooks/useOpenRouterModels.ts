import { useState, useEffect, useCallback } from 'react';
import type { OpenRouterModel } from '@/types';
import type { ModelCategory } from '@/lib/modelCategories';
import { searchModels } from '@/lib/modelCategories';

interface UseOpenRouterModelsResult {
  models: OpenRouterModel[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  refetch: () => void;
}

let cachedModels: Record<string, OpenRouterModel[]> = {};

export function useOpenRouterModels(
  category?: ModelCategory
): UseOpenRouterModelsResult {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [allModels, setAllModels] = useState<OpenRouterModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchModels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const cacheKey = category || 'all';
      
      if (cachedModels[cacheKey]) {
        console.log(`Using cached models for category: ${category}`);
        setAllModels(cachedModels[cacheKey]);
        setModels(cachedModels[cacheKey]);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (category) {
        params.append('category', category);
      }

      const url = `/api/models?${params.toString()}`;
      console.log(`Fetching models from: ${url}`);
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();
      console.log('API Response:', {
        dataLength: data.data?.length,
        total: data.total,
        cached: data.cached,
        firstModel: data.data?.[0]?.id,
        category
      });

      const fetchedModels = data.data as OpenRouterModel[];

      console.log(`Fetched ${fetchedModels.length} models for category: ${category}`);
      
      cachedModels[cacheKey] = fetchedModels;
      setAllModels(fetchedModels);
      setModels(fetchedModels);
    } catch (err) {
      console.error('Error fetching models:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setModels(allModels);
      return;
    }

    const timeoutId = setTimeout(() => {
      console.log(`Searching for: "${trimmedQuery}" in ${allModels.length} models`);
      const filtered = searchModels(allModels, trimmedQuery);
      console.log(`Search results: ${filtered.length} models match "${trimmedQuery}"`);
      setModels(filtered);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, allModels]);

  return {
    models,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    refetch: fetchModels,
  };
}
