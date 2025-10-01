import fs from 'fs';
import path from 'path';
import { GenerationResult } from '@/types';

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'generated');

/**
 * Ensures the output directory exists
 */
export function ensureOutputDir(): void {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

/**
 * Saves a base64 image to disk
 * @param base64Data - Base64 encoded image data (with or without data URL prefix)
 * @param filename - Filename to save as
 * @returns The public URL path to the saved image
 */
export function saveImage(base64Data: string, filename: string): string {
  ensureOutputDir();

  // Remove data URL prefix if present
  const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');

  // Convert base64 to buffer
  const imageBuffer = Buffer.from(base64Image, 'base64');

  // Save to disk
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, imageBuffer);

  // Return public URL
  return `/generated/${filename}`;
}

/**
 * Saves the generation result as JSON
 * @param result - Generation result object
 * @param filename - JSON filename
 */
export function saveResultJson(result: GenerationResult, filename: string): void {
  ensureOutputDir();

  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
}

/**
 * Generates a unique filename for an image
 * @param sceneId - Scene identifier
 * @returns Unique filename
 */
export function generateImageFilename(sceneId: string): string {
  const timestamp = Date.now();
  return `${sceneId}_${timestamp}.png`;
}

/**
 * Generates a unique filename for a result JSON
 * @returns Unique filename
 */
export function generateResultFilename(): string {
  const timestamp = Date.now();
  return `result_${timestamp}.json`;
}
