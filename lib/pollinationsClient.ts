/**
 * Pollinations.ai Image Generation Client
 * Free image generation API using Flux and other models
 * Documentation: https://pollinations.ai/
 */

export interface PollinationsConfig {
  width?: number;
  height?: number;
  seed?: number;
  enhance?: boolean;
  nologo?: boolean;
  model?: 'flux' | 'flux-realism' | 'flux-anime' | 'flux-3d' | 'turbo';
}

export class PollinationsClient {
  private baseUrl = 'https://image.pollinations.ai/prompt';

  /**
   * Generate image using Pollinations.ai API
   * @param prompt - Text description of the image
   * @param config - Optional configuration parameters
   * @returns Promise with image URL
   */
  async generateImage(
    prompt: string,
    config: PollinationsConfig = {}
  ): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    try {
      // Default configuration optimized for anime/manga style
      const defaultConfig: PollinationsConfig = {
        width: 1024,
        height: 1024,
        seed: Math.floor(Math.random() * 100000), // Random seed for variety
        enhance: true, // Enhanced quality
        nologo: true, // Remove watermark
        model: 'flux-anime', // Anime-optimized model
      };

      const finalConfig = { ...defaultConfig, ...config };

      // Clean and encode prompt (remove spaces, special characters)
      const cleanPrompt = this.cleanPrompt(prompt);

      // Build URL with query parameters
      const params = new URLSearchParams({
        width: finalConfig.width!.toString(),
        height: finalConfig.height!.toString(),
        seed: finalConfig.seed!.toString(),
        enhance: finalConfig.enhance!.toString(),
        nologo: finalConfig.nologo!.toString(),
        model: finalConfig.model!,
      });

      const imageUrl = `${this.baseUrl}/${cleanPrompt}?${params.toString()}`;

      // Verify image is accessible by making a HEAD request
      const response = await fetch(imageUrl, { method: 'HEAD' });
      
      if (!response.ok) {
        throw new Error(`Failed to generate image: ${response.status}`);
      }

      return {
        success: true,
        imageUrl,
      };
    } catch (error) {
      console.error('Pollinations generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate image and return as base64 data URL
   * @param prompt - Text description of the image
   * @param config - Optional configuration parameters
   * @returns Promise with base64 image data
   */
  async generateImageAsBase64(
    prompt: string,
    config: PollinationsConfig = {}
  ): Promise<{ success: boolean; imageData?: string; error?: string }> {
    try {
      const result = await this.generateImage(prompt, config);
      
      if (!result.success || !result.imageUrl) {
        return {
          success: false,
          error: result.error || 'Failed to generate image',
        };
      }

      // Fetch the image and convert to base64
      const response = await fetch(result.imageUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();
      const base64 = await this.blobToBase64(blob);

      return {
        success: true,
        imageData: base64,
      };
    } catch (error) {
      console.error('Pollinations base64 conversion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Clean prompt for URL encoding
   * Removes spaces and special characters, keeps alphanumeric
   */
  private cleanPrompt(prompt: string): string {
    return prompt
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
      .replace(/\s+/g, '') // Remove all spaces
      .substring(0, 500); // Limit length for URL
  }

  /**
   * Convert Blob to base64 data URL
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Get available models
   */
  getAvailableModels(): Array<{ id: string; name: string; description: string }> {
    return [
      {
        id: 'flux',
        name: 'Flux',
        description: 'High-quality general purpose model',
      },
      {
        id: 'flux-realism',
        name: 'Flux Realism',
        description: 'Photorealistic image generation',
      },
      {
        id: 'flux-anime',
        name: 'Flux Anime',
        description: 'Anime and manga style images',
      },
      {
        id: 'flux-3d',
        name: 'Flux 3D',
        description: '3D rendered style images',
      },
      {
        id: 'turbo',
        name: 'Turbo',
        description: 'Fast generation with good quality',
      },
    ];
  }

  /**
   * Test the API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.generateImage('test image', {
        width: 512,
        height: 512,
      });
      return result.success;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const pollinationsClient = new PollinationsClient();
