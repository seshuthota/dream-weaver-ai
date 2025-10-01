import OpenAI from 'openai';

export class OpenRouterClient {
  private client: OpenAI;

  constructor() {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not set');
    }

    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': process.env.NEXT_PUBLIC_SITE_NAME || 'Anime Maker'
      }
    });
  }

  async generateText(model: string, prompt: string, temperature: number = 0.7): Promise<string> {
    const response = await this.client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: 4000,
    });

    return response.choices[0]?.message?.content || '';
  }

  async generateImage(model: string, prompt: string): Promise<{ success: boolean; imageData?: string; error?: string }> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          'X-Title': process.env.NEXT_PUBLIC_SITE_NAME || 'Anime Maker'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
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

export const openrouter = new OpenRouterClient();