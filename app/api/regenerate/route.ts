import { NextRequest } from 'next/server';
import type { Scene, CharacterProfile, ImagePrompt, ModelSelection } from '@/types';
import { generateImage, verifyImage } from '@/lib/generators';
import { saveImage, generateImageFilename } from '@/lib/storage';
import { getApiKey, requireApiKey } from '@/lib/apiKeyManager';
import { getActiveModels } from '@/lib/config/models';

interface RegenerateRequest {
  scene: Scene;
  characters: Record<string, CharacterProfile>;
  imagePrompt: string;
  negativePrompt?: string;
  modifications?: string; // Optional user modifications to the prompt
}

export async function POST(request: NextRequest) {
  const body: RegenerateRequest = await request.json();
  const { scene, characters, imagePrompt, negativePrompt, modifications } = body;

  // Get and validate API key
  const apiKey = getApiKey(request);
  try {
    requireApiKey(apiKey);
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'API key required',
        code: 'API_KEY_REQUIRED'
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Get model selection from header
  let modelSelection: ModelSelection | undefined;
  const modelSelectionHeader = request.headers.get('x-model-selection');
  if (modelSelectionHeader) {
    try {
      modelSelection = JSON.parse(modelSelectionHeader);
    } catch {
      modelSelection = undefined;
    }
  }
  const activeModels = getActiveModels(modelSelection);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const sendProgress = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        sendProgress({
          stage: 'regenerating',
          progress: 10,
          message: `🔄 Regenerating scene ${scene.id}...`,
        });

        // Construct image prompt with optional modifications
        let finalPrompt = imagePrompt;
        if (modifications) {
          finalPrompt += `, ${modifications}`;
        }

        const prompt: ImagePrompt = {
          positive_prompt: finalPrompt,
          negative_prompt: negativePrompt,
          scene_id: scene.id,
          technical_params: {}
        };

        sendProgress({
          stage: 'regenerating',
          progress: 30,
          message: '🎨 Generating new image...',
        });

        // Attempt generation with retries
        let imageResult;
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
          let modifiedPrompt = { ...prompt };

          // Add quality boosters on retries
          if (attempts === 1) {
            modifiedPrompt.positive_prompt += ', ultra detailed, 8k masterpiece, perfect composition';
          } else if (attempts === 2) {
            modifiedPrompt.positive_prompt += ', ultra detailed, 8k masterpiece, alternative angle, professional lighting';
          }

          imageResult = await generateImage(modifiedPrompt, apiKey, activeModels.imageModel, modelSelection?.imageProvider);
          if (imageResult.success) break;
          attempts++;

          sendProgress({
            stage: 'regenerating',
            progress: 30 + (attempts * 15),
            message: `⚠️ Retry ${attempts}/${maxAttempts}...`,
          });
        }

        if (!imageResult?.success) {
          throw new Error(imageResult?.error || 'Image generation failed after retries');
        }

        sendProgress({
          stage: 'regenerating',
          progress: 70,
          message: '💾 Saving image...',
        });

        // Save the new image
        const imageFilename = generateImageFilename(scene.id);
        const imageUrl = saveImage(imageResult.imageData!, imageFilename);

        sendProgress({
          stage: 'regenerating',
          progress: 85,
          message: '🔍 Running quality check...',
        });

        // Optional verification
        let verification = null;
        try {
          verification = await verifyImage(imageResult.imageData!, scene, characters, apiKey, activeModels.verificationModel);
        } catch (error) {
          console.log('Verification skipped:', error);
        }

        const result = {
          scene_id: scene.id,
          image_url: imageUrl,
          description: scene.description || '',
          setting: scene.setting,
          verification,
          attempts: attempts + 1,
        };

        sendProgress({
          stage: 'complete',
          progress: 100,
          message: '✅ Scene regenerated successfully!',
          data: result,
        });

        controller.close();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              stage: 'error',
              progress: 0,
              message: `❌ Error: ${errorMessage}`,
            })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
