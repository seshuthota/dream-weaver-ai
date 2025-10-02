import { NextRequest, NextResponse } from 'next/server';
import type { OpenRouterModel, ModelsApiResponse } from '@/types';
import { 
  filterModelsByCategory, 
  searchModels, 
  sortModelsByPreference,
  type ModelCategory 
} from '@/lib/modelCategories';

export const dynamic = 'force-dynamic';

let cachedModels: OpenRouterModel[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category') as ModelCategory | null;
    const searchQuery = request.nextUrl.searchParams.get('search') || '';

    const now = Date.now();
    const cacheValid = cachedModels && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION;

    let models: OpenRouterModel[];

    if (cacheValid) {
      models = cachedModels!;
      console.log('Using cached models');
    } else {
      console.log('Fetching fresh models from OpenRouter');
      
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 3600 }
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data: ModelsApiResponse = await response.json();
      models = data.data;

      cachedModels = models;
      cacheTimestamp = now;
    }

    let filteredModels = models;

    if (category) {
      console.log(`Filtering ${filteredModels.length} models by category: ${category}`);
      filteredModels = filterModelsByCategory(filteredModels, category);
      console.log(`After category filter: ${filteredModels.length} models`);
    }

    if (searchQuery) {
      console.log(`Searching ${filteredModels.length} models for: "${searchQuery}"`);
      filteredModels = searchModels(filteredModels, searchQuery);
      console.log(`After search: ${filteredModels.length} models`);
    } else {
      filteredModels = sortModelsByPreference(filteredModels);
    }

    const limitedModels = filteredModels.slice(0, 200);

    console.log(`Returning ${limitedModels.length} models (total: ${filteredModels.length}, cached: ${cacheValid})`);

    return NextResponse.json({
      data: limitedModels,
      total: filteredModels.length,
      cached: cacheValid,
    });

  } catch (error) {
    console.error('Error fetching models:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch models',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: [],
      },
      { status: 500 }
    );
  }
}
