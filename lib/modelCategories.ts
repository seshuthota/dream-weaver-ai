import type { OpenRouterModel } from '@/types';

export type ModelCategory = 'text' | 'image' | 'vision';

export function categorizeModel(model: OpenRouterModel): ModelCategory[] {
  const categories: ModelCategory[] = [];
  const modality = model.architecture?.modality?.toLowerCase() || '';
  const modelIdLower = model.id.toLowerCase();

  // STRICT image model detection - must explicitly generate images
  const isImageModel =
    // Modality explicitly says text->image or similar
    (modality.includes('text->image') ||
     modality.includes('text-to-image') ||
     modality.includes('text+image->image')) ||
    // Known image model IDs (whitelist)
    modelIdLower.includes('flux') ||
    modelIdLower.includes('stable-diffusion') ||
    modelIdLower.includes('dall-e') ||
    modelIdLower.includes('midjourney') ||
    modelIdLower.includes('imagen') ||
    modelIdLower.includes('playground') ||
    modelIdLower.includes('ideogram') ||
    modelIdLower.includes('recraft') ||
    (modelIdLower.includes('gemini') && modelIdLower.includes('image-preview')) ||
    (modelIdLower.includes('gemini') && modelIdLower.includes('exp-1206')) ||
    // Has NON-ZERO image pricing (strong signal for actual image generation models)
    (model.pricing.image !== undefined && parseFloat(model.pricing.image) > 0);

  // STRICT vision model detection - can analyze images (image input)
  const isVisionModel =
    modality.includes('image->text') ||
    modality.includes('vision') ||
    modelIdLower.includes('vision') ||
    modelIdLower.includes('gpt-4o') ||
    modelIdLower.includes('gpt-4-turbo') ||
    (modelIdLower.includes('claude-3') && !modelIdLower.includes('haiku')) ||
    modelIdLower.includes('claude-3.5') ||
    (modelIdLower.includes('gemini') && !modelIdLower.includes('image-preview') &&
     (modelIdLower.includes('pro') || modelIdLower.includes('1.5') || modelIdLower.includes('2.0')));

  // Text model - can generate text (includes multimodal models)
  // Multimodal text models (text+image->text) should be available for text generation
  const canGenerateText = modality.includes('->text') || modality.includes('text->text') || modality === '';
  const isTextModel = !isImageModel && canGenerateText;

  if (isTextModel) categories.push('text');
  if (isImageModel) categories.push('image');
  if (isVisionModel) categories.push('vision');

  // Fallback
  if (categories.length === 0) {
    console.warn(`Model ${model.id} uncategorized, defaulting to 'text'`, {
      modality,
      pricing: model.pricing,
      isImageModel,
      isVisionModel,
      isTextModel
    });
    categories.push('text');
  }

  // Debug logging in development
  if (process.env.NODE_ENV === 'development' && categories.includes('image')) {
    console.log(`Categorized ${model.id} as IMAGE:`, {
      categories,
      modality,
      pricing: model.pricing
    });
  }

  return categories;
}

export function filterModelsByCategory(
  models: OpenRouterModel[],
  category: ModelCategory
): OpenRouterModel[] {
  const filtered = models.filter(model => {
    const categories = categorizeModel(model);
    return categories.includes(category);
  });

  console.log(`Filtered ${models.length} models by category '${category}': ${filtered.length} results`);

  if (filtered.length === 0 && models.length > 0) {
    console.warn(`No models found for category '${category}'. First 3 models:`,
      models.slice(0, 3).map(m => ({
        id: m.id,
        modality: m.architecture?.modality,
        pricing: m.pricing
      }))
    );
  }

  return filtered;
}

export function searchModels(
  models: OpenRouterModel[],
  query: string
): OpenRouterModel[] {
  if (!query.trim()) return models;

  const lowerQuery = query.toLowerCase();
  
  return models
    .map(model => {
      let score = 0;
      const id = model.id.toLowerCase();
      const name = model.name.toLowerCase();
      const description = (model.description || '').toLowerCase();

      if (id === lowerQuery) score += 100;
      else if (id.startsWith(lowerQuery)) score += 50;
      else if (id.includes(lowerQuery)) score += 25;

      if (name.includes(lowerQuery)) score += 30;
      if (description.includes(lowerQuery)) score += 10;

      return { model, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ model }) => model);
}

export function sortModelsByPreference(models: OpenRouterModel[]): OpenRouterModel[] {
  const priorityModels = [
    'x-ai/grok-4-fast:free',
    'x-ai/grok-4-fast',
    'deepseek/deepseek-r1:free',
    'deepseek/deepseek-chat-v3.1:free',
    'qwen/qwen3-coder:free',
  ];

  return models.sort((a, b) => {
    const aPriority = priorityModels.indexOf(a.id);
    const bPriority = priorityModels.indexOf(b.id);
    
    if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
    if (aPriority !== -1) return -1;
    if (bPriority !== -1) return 1;

    const aIsFree = a.pricing.prompt === '0' || a.id.includes(':free');
    const bIsFree = b.pricing.prompt === '0' || b.id.includes(':free');

    if (aIsFree && !bIsFree) return -1;
    if (!aIsFree && bIsFree) return 1;

    const aPrice = parseFloat(a.pricing.prompt) || 0;
    const bPrice = parseFloat(b.pricing.prompt) || 0;
    if (aPrice !== bPrice) return aPrice - bPrice;

    if (a.context_length !== b.context_length) {
      return b.context_length - a.context_length;
    }

    return a.name.localeCompare(b.name);
  });
}

export function formatModelPrice(model: OpenRouterModel): string {
  const promptPrice = parseFloat(model.pricing.prompt) || 0;
  const completionPrice = parseFloat(model.pricing.completion) || 0;
  
  if (promptPrice === 0 && completionPrice === 0) {
    return 'Free';
  }
  
  if (model.pricing.image) {
    const imagePrice = parseFloat(model.pricing.image) || 0;
    if (imagePrice === 0) return 'Free';
    return `$${imagePrice.toFixed(4)} per image`;
  }
  
  return `$${promptPrice.toFixed(2)}/$${completionPrice.toFixed(2)} per 1M`;
}

export function formatContextLength(contextLength: number): string {
  if (contextLength >= 1000000) {
    return `${(contextLength / 1000000).toFixed(1)}M`;
  }
  if (contextLength >= 1000) {
    return `${(contextLength / 1000).toFixed(0)}K`;
  }
  return contextLength.toString();
}
