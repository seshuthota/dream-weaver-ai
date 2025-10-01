import { NextRequest } from 'next/server';
import type { AnimeInput, GenerationProgress, Scene } from '@/types';
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
        const generatedScenes: any[] = [];
        const tempDataForVerification: string[] = [];
        
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
            tempDataForVerification.push('');
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
            tempDataForVerification.push('');
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
          });
          tempDataForVerification.push(imageResult.imageData!);
        }

        // SEND RESULTS IMMEDIATELY - Don't wait for verification!
        const preliminaryResult = {
          script,
          characters,
          scenes: generatedScenes,
          metadata: {
            success: true,
            total_scenes: totalScenes,
            passed_verification: 0,
            needs_review: 0,
            generation_time_seconds: 0,
            timestamp: new Date().toISOString(),
            verification_pending: true,
          },
        };

        // Save preliminary result
        const resultFilename = generateResultFilename();
        saveResultJson(preliminaryResult, resultFilename);

        sendProgress({
          stage: 'images_complete',
          progress: 80,
          message: '✅ All images ready! Starting optional quality verification...',
          data: preliminaryResult,
        });

        // OPTIONAL VERIFICATION - Run in background, don't block results
        sendProgress({
          stage: 'verification',
          progress: 85,
          totalScenes,
          message: `🔍 Running quality checks (optional)...`,
        });

        let completedVerifications = 0;

        // Start verification but with timeout protection
        const verifyWithTimeout = async (genScene: any, scene: Scene, index: number) => {
          if (!tempDataForVerification[index]) return null;
          
          try {
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Verification timeout')), 15000)
            );
            
            const verifyPromise = verifyImage(tempDataForVerification[index], scene, characters, apiKey);
            
            const verification = await Promise.race([verifyPromise, timeoutPromise]);
            
            completedVerifications++;
            sendProgress({
              stage: 'verification',
              progress: 85 + (completedVerifications / totalScenes) * 10,
              currentScene: completedVerifications,
              totalScenes,
              message: `✅ Quality check ${completedVerifications}/${totalScenes}`,
            });

            return verification;
          } catch (error) {
            completedVerifications++;
            return null; // Skip failed verifications silently
          }
        };

        const verifyPromises = generatedScenes.map((genScene, index) =>
          verifyWithTimeout(genScene, scenes[index], index)
        );

        // Wait for verifications with overall timeout
        const verificationTimeout = new Promise((resolve) => 
          setTimeout(() => resolve([]), 30000) // 30s max for all verifications
        );
        
        const verificationsOrTimeout = await Promise.race([
          Promise.allSettled(verifyPromises),
          verificationTimeout
        ]);

        // Add verifications if completed
        if (Array.isArray(verificationsOrTimeout)) {
          for (let i = 0; i < generatedScenes.length; i++) {
            const verifyResult = verificationsOrTimeout[i];
            if (verifyResult && verifyResult.status === 'fulfilled' && verifyResult.value) {
              generatedScenes[i].verification = verifyResult.value;
            }
          }
        }

        // Final result with verification data (if available)
        const finalResult = {
          script,
          characters,
          scenes: generatedScenes,
          metadata: {
            success: true,
            total_scenes: totalScenes,
            passed_verification: generatedScenes.filter((s) => s.verification?.passed).length,
            needs_review: generatedScenes.filter((s) => !s.verification?.passed).length,
            generation_time_seconds: 0,
            timestamp: new Date().toISOString(),
            verification_completed: Array.isArray(verificationsOrTimeout),
          },
        };

        // Update saved result
        saveResultJson(finalResult, resultFilename);

        sendProgress({
          stage: 'complete',
          progress: 100,
          message: '🎉 Anime generation complete!',
          data: finalResult,
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
