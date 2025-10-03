import { NextRequest } from 'next/server';
import pLimit from 'p-limit';
import type { AnimeInput, GenerationProgress, Scene, ModelSelection } from '@/types';
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
  cleanupPartialFiles,
} from '@/lib/storage';
import { getApiKey, requireApiKey } from '@/lib/apiKeyManager';
import { calculateCost, formatCost } from '@/lib/utils';
import { getPreset } from '@/lib/config/presets';
import { getActiveModels } from '@/lib/config/models';

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

  // Get quality preset settings
  const preset = getPreset(input.qualityPreset);

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

        const { characters, script, scenes } = await generateCompleteStory(input, apiKey, activeModels.textModel);

        const totalScenes = scenes.length;
        const estimatedCost = calculateCost(totalScenes, preset.costMultiplier);

        sendProgress({
          stage: 'story',
          progress: 40,
          message: `✅ Story complete! Generated ${totalScenes} scenes with prompts`,
          data: { characters, script, scenes, estimatedCost },
        });


        // PARALLEL IMAGE GENERATION - All at once!
        sendProgress({
          stage: 'image',
          progress: 45,
          totalScenes,
          message: `🎨 Generating all ${totalScenes} images in parallel (est. ${formatCost(estimatedCost)})...`,
        });

        let completedImages = 0;

        // Rate limiting: Max 3 concurrent image generations to avoid overwhelming the API
        const limit = pLimit(3);

        // Generate all images with controlled concurrency and progress tracking
        const imagePromises = scenes.map((scene, index) => limit(async () => {
          const sceneNum = index + 1;

          // Construct ImagePrompt object with negative prompt support
          const imagePrompt = {
            positive_prompt: scene.image_prompt,
            negative_prompt: scene.negative_prompt,
            scene_id: scene.id,
            technical_params: {}
          };

          // Attempt generation with retries and smart prompt variation
          let imageResult;
          let attempts = 0;
          const maxAttempts = preset.maxRetries;

          while (attempts < maxAttempts) {
            // Add quality boosters and variations on retry attempts
            let modifiedPrompt = { ...imagePrompt };

            if (attempts === 1) {
              // First retry: Add quality boosters
              modifiedPrompt.positive_prompt += ', ultra detailed, 8k masterpiece, perfect composition, award winning';
              console.log(`Retry ${attempts} for ${scene.id}: Adding quality boosters`);
            } else if (attempts === 2) {
              // Second retry: Add alternative angle and more quality keywords
              modifiedPrompt.positive_prompt += ', ultra detailed, 8k masterpiece, alternative angle, different perspective, professional lighting';
              console.log(`Retry ${attempts} for ${scene.id}: Adding angle variation and quality keywords`);
            }

            imageResult = await generateImage(modifiedPrompt, apiKey, activeModels.imageModel, modelSelection?.imageProvider);
            if (imageResult.success) break;
            attempts++;
          }

          // Track completion with accurate percentage
          completedImages++;
          const imageProgress = (completedImages / totalScenes) * 100;
          const overallProgress = 40 + (imageProgress * 0.40); // Images are 40-80% of total

          sendProgress({
            stage: 'image',
            progress: Math.round(overallProgress),
            currentScene: completedImages,
            totalScenes,
            message: `✅ Image ${completedImages}/${totalScenes} complete (${Math.round(imageProgress)}%)`,
          });

          return {
            scene,
            imageResult,
            attempts: attempts + 1,
          };
        }));

        // Wait for all images to complete
        const imageResults = await Promise.allSettled(imagePromises);

        // Process results and save images
        const generatedScenes: any[] = [];
        const tempDataForVerification: string[] = [];
        const resultFilename = generateResultFilename();

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

          // Incremental save after each successful image
          const partialResult = {
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
              partial: true,
              completed_scenes: generatedScenes.length,
            },
          };
          saveResultJson(partialResult, `${resultFilename}_partial_${generatedScenes.length}.json`);
        }

        // SEND RESULTS IMMEDIATELY - Don't wait for verification!
        const actualCost = calculateCost(generatedScenes.filter(s => s.image_url).length, preset.costMultiplier);

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
            estimated_cost: estimatedCost,
            actual_cost: actualCost,
          },
        };

        // Save preliminary result (using the same filename as incremental saves)
        saveResultJson(preliminaryResult, resultFilename);

        sendProgress({
          stage: 'images_complete',
          progress: 80,
          message: preset.skipVerification
            ? '✅ All images ready! Skipping quality verification (draft mode)...'
            : '✅ All images ready! Starting optional quality verification...',
          data: preliminaryResult,
        });

        // OPTIONAL VERIFICATION - Run in background, don't block results
        // Skip verification if preset says so (e.g., draft mode)
        let verificationsOrTimeout: any[] = [];

        if (!preset.skipVerification) {
          sendProgress({
            stage: 'verification',
            progress: 85,
            totalScenes,
            message: `🔍 Running quality checks (optional)...`,
          });

          let completedVerifications = 0;

        // Start verification but with timeout protection
        const verifyWithTimeout = async (genScene: any, scene: Scene, index: number) => {
          if (!tempDataForVerification[index]) {
            console.log(`Skipping verification for scene ${index}: no image data`);
            return null;
          }
          
          try {
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Verification timeout (15s)')), 15000)
            );
            
            const verifyPromise = verifyImage(tempDataForVerification[index], scene, characters, apiKey, activeModels.verificationModel);
            
            const verification = await Promise.race([verifyPromise, timeoutPromise]);
            
            completedVerifications++;
            const verifyProgress = (completedVerifications / totalScenes) * 100;
            const overallProgress = 80 + (verifyProgress * 0.15); // Verification is 80-95% of total

            sendProgress({
              stage: 'verification',
              progress: Math.round(overallProgress),
              currentScene: completedVerifications,
              totalScenes,
              message: `✅ Quality check ${completedVerifications}/${totalScenes} (${Math.round(verifyProgress)}%)`,
            });

            return verification;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            console.log(`Verification failed for scene ${index}: ${errorMsg}`);
            completedVerifications++;
            const verifyProgress = (completedVerifications / totalScenes) * 100;
            const overallProgress = 80 + (verifyProgress * 0.15);

            // Still send progress update even on failure
            sendProgress({
              stage: 'verification',
              progress: Math.round(overallProgress),
              currentScene: completedVerifications,
              totalScenes,
              message: `⚠️ Quality check ${completedVerifications}/${totalScenes} (skipped)`,
            });
            
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

          verificationsOrTimeout = await Promise.race([
            Promise.allSettled(verifyPromises),
            verificationTimeout
          ]) as any[];
        }

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
            estimated_cost: estimatedCost,
            actual_cost: actualCost,
          },
        };

        // Update saved result
        saveResultJson(finalResult, resultFilename);

        // Clean up partial files now that final result is saved
        cleanupPartialFiles(resultFilename);

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
