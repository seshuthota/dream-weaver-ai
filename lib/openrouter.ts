import OpenAI from 'openai';
import { API_CONFIG } from './config/models';

export class OpenRouterClient {
  private client: OpenAI;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key is required');
    }

    this.apiKey = apiKey;
    this.client = new OpenAI({
      baseURL: API_CONFIG.openrouter.baseUrl,
      apiKey: this.apiKey,
      defaultHeaders: API_CONFIG.openrouter.defaultHeaders,
    });
  }

  async generateText(model: string, prompt: string, temperature: number = 0.7, maxTokens?: number): Promise<string> {
    const response = await this.client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens || 8000, // Increased default from 4000 to 8000 for longer responses
    });

    const content = response.choices[0]?.message?.content || '';
    
    // Check if response was truncated
    if (response.choices[0]?.finish_reason === 'length') {
      console.warn('Response was truncated due to max_tokens limit. Consider increasing maxTokens parameter.');
    }
    
    return content;
  }

  async generateImage(
    model: string,
    prompt: string,
    negativePrompt?: string
  ): Promise<{ success: boolean; imageData?: string; error?: string }> {
    try {
      // Construct full prompt with negative prompt if provided
      let fullPrompt = prompt;
      if (negativePrompt) {
        fullPrompt += `\n\nNEGATIVE PROMPT (avoid these): ${negativePrompt}`;
      }

      const response = await fetch(`${API_CONFIG.openrouter.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...API_CONFIG.openrouter.defaultHeaders,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: fullPrompt }],
          modalities: ['image', 'text']
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error?.message || 'Image generation failed'
        };
      }

      // Extract image from response
      const message = result.choices?.[0]?.message;
      if (message?.images && message.images.length > 0) {
        const imageUrl = message.images[0].image_url.url;
        return {
          success: true,
          imageData: imageUrl // Base64 data URL
        };
      }

      return {
        success: false,
        error: 'No image in response'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async analyzeImage(model: string, prompt: string, imageData: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: imageData }
            }
          ]
        }
      ],
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || '';
  }
}

/**
 * Create an OpenRouter client with the provided API key
 * @param apiKey - OpenRouter API key
 * @returns OpenRouterClient instance
 */
export function createOpenRouterClient(apiKey: string): OpenRouterClient {
  return new OpenRouterClient(apiKey);
}