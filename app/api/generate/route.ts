import { NextRequest } from 'next/server';
import type { AnimeInput, GenerationProgress } from '@/types';
import {
  generateCompleteStory,
  generateImage,
  verifyImage,
} from '@/lib/generators';
import {
  saveImage,
  saveResultJson,
  generateImageFilename,
  generateResultFilename,
} from '@/lib/storage';
import { getApiKey, requireApiKey } from '@/lib/apiKeyManager';

export async function POST(request: NextRequest) {
  const input: AnimeInput = await request.json();

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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const sendProgress = (progress: GenerationProgress) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(progress)}\n\n`));
        };

        // OPTIMIZED: Single comprehensive generation (characters + script + scenes + prompts)
        sendProgress({
          stage: 'story',
          progress: 10,
          message: '🎬 Generating complete story with all scenes...',
        });

        const { characters, script, scenes } = await generateCompleteStory(input, apiKey);

        sendProgress({
          stage: 'story',
          progress: 40,
          message: `✅ Story complete! Generated ${scenes.length} scenes with prompts`,
          data: { characters, script, scenes },
        });

        const totalScenes = scenes.length;

        // PARALLEL IMAGE GENERATION - All at once!
        sendProgress({
          stage: 'image',
          progress: 45,
          totalScenes,
          message: `🎨 Generating all ${totalScenes} images in parallel...`,
        });

        let completedImages = 0;

        // Generate all images in parallel with progress tracking
        const imagePromises = scenes.map(async (scene, index) => {
          const sceneNum = index + 1;

          // Attempt generation with retries
          let imageResult;
          let attempts = 0;
          const maxAttempts = 3;

          while (attempts < maxAttempts) {
            imageResult = await generateImage(scene.image_prompt, apiKey);
            if (imageResult.success) break;
            attempts++;
          }

          // Track completion
          completedImages++;
          sendProgress({
            stage: 'image',
            progress: 45 + (completedImages / totalScenes) * 35,
            currentScene: completedImages,
            totalScenes,
            message: `✅ Image ${completedImages}/${totalScenes} complete`,
          });

          return {
            scene,
            imageResult,
            attempts: attempts + 1,
          };
        });

        // Wait for all images to complete
        const imageResults = await Promise.allSettled(imagePromises);

        // Process results and save images
        const generatedScenes = [];
        for (let i = 0; i < imageResults.length; i++) {
          const result = imageResults[i];
          const scene = scenes[i];

          if (result.status === 'rejected') {
            generatedScenes.push({
              scene_id: scene.id,
              image_url: '',
              description: scene.description || '',
              dialogue: scene.dialogue,
              setting: scene.setting,
              error: result.reason?.message || 'Generation failed',
              attempts: 0,
            });
            continue;
          }

          const { imageResult, attempts } = result.value;

          if (!imageResult?.success) {
            generatedScenes.push({
              scene_id: scene.id,
              image_url: '',
              description: scene.description || '',
              dialogue: scene.dialogue,
              setting: scene.setting,
              error: imageResult?.error || 'Generation failed',
              attempts,
            });
            continue;
          }

          // Save image to disk
          const imageFilename = generateImageFilename(scene.id);
          const imageUrl = saveImage(imageResult.imageData!, imageFilename);

          generatedScenes.push({
            scene_id: scene.id,
            image_url: imageUrl,
            description: scene.description || '',
            dialogue: scene.dialogue,
            setting: scene.setting,
            attempts,
            tempData: imageResult.imageData, // Keep for verification
          });
        }

        // PARALLEL VERIFICATION - All at once!
        sendProgress({
          stage: 'verification',
          progress: 80,
          totalScenes,
          message: `🔍 Verifying all ${totalScenes} images in parallel...`,
        });

        let completedVerifications = 0;

        // Verify all images in parallel
        const verifyPromises = generatedScenes.map(async (genScene, index) => {
          if (!genScene.tempData) return null; // Skip failed generations

          const scene = scenes[index];
          const verification = await verifyImage(genScene.tempData, scene, characters, apiKey);

          completedVerifications++;
          sendProgress({
            stage: 'verification',
            progress: 80 + (completedVerifications / totalScenes) * 15,
            currentScene: completedVerifications,
            totalScenes,
            message: `✅ Verification ${completedVerifications}/${totalScenes} complete`,
          });

          return verification;
        });

        // Wait for all verifications
        const verifications = await Promise.allSettled(verifyPromises);

        // Add verifications to scenes and clean up temp data
        for (let i = 0; i < generatedScenes.length; i++) {
          const verifyResult = verifications[i];
          if (verifyResult.status === 'fulfilled' && verifyResult.value) {
            generatedScenes[i].verification = verifyResult.value;
          }
          // Remove temp data
          delete generatedScenes[i].tempData;
        }

        // Final result
        const result = {
          script,
          characters,
          scenes: generatedScenes,
          metadata: {
            success: true,
            total_scenes: totalScenes,
            passed_verification: generatedScenes.filter((s) => s.verification?.passed).length,
            needs_review: generatedScenes.filter((s) => !s.verification?.passed).length,
            timestamp: new Date().toISOString(),
          },
        };

        // Save result JSON to disk
        const resultFilename = generateResultFilename();
        saveResultJson(result, resultFilename);

        sendProgress({
          stage: 'complete',
          progress: 100,
          message: '🎉 Anime generation complete!',
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
