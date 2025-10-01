import fs from 'fs';
import path from 'path';
import { GenerationResult } from '@/types';

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'generated');
const FALLBACK_DIR = path.join(process.env.TMPDIR || '/tmp', 'dream-weaver-generated');

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getWritableDir(): { dir: string; servedFromPublic: boolean } {
  try {
    ensureDir(OUTPUT_DIR);
    fs.accessSync(OUTPUT_DIR, fs.constants.W_OK);
    return { dir: OUTPUT_DIR, servedFromPublic: true };
  } catch {
    ensureDir(FALLBACK_DIR);
    return { dir: FALLBACK_DIR, servedFromPublic: false };
  }
}

/**
 * Ensures the output directory exists
 */
export function ensureOutputDir(): void {
  getWritableDir();
}

/**
 * Saves a base64 image to disk
 * @param base64Data - Base64 encoded image data (with or without data URL prefix)
 * @param filename - Filename to save as
 * @returns The public URL path to the saved image
 */
export function saveImage(base64Data: string, filename: string): string {
  const { dir, servedFromPublic } = getWritableDir();

  // Remove data URL prefix if present
  const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');

  // Convert base64 to buffer
  const imageBuffer = Buffer.from(base64Image, 'base64');

  // Save to disk
  try {
    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, imageBuffer);
    if (servedFromPublic) {
      return `/generated/${filename}`;
    }
  } catch (error) {
    console.error('Error saving image to disk, falling back to data URL:', error);
  }

  return `data:image/png;base64,${base64Image}`;
}

/**
 * Saves the generation result as JSON
 * @param result - Generation result object
 * @param filename - JSON filename
 */
export function saveResultJson(result: GenerationResult, filename: string): void {
  try {
    const { dir } = getWritableDir();
    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error saving result JSON:', error);
  }
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

/**
 * Cleans up partial result files after successful generation
 * @param baseFilename - Base filename (without _partial_N.json suffix)
 */
export function cleanupPartialFiles(baseFilename: string): void {
  try {
    const { dir } = getWritableDir();
    const files = fs.readdirSync(dir);
    
    // Find all partial files matching the pattern
    const baseName = baseFilename.replace('.json', '');
    const partialPattern = new RegExp(`^${baseName}_partial_\\d+\\.json$`);
    
    let deletedCount = 0;
    files.forEach((file) => {
      if (partialPattern.test(file)) {
        try {
          fs.unlinkSync(path.join(dir, file));
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete partial file ${file}:`, error);
        }
      }
    });
    
    if (deletedCount > 0) {
      console.log(`✅ Cleaned up ${deletedCount} partial result files`);
    }
  } catch (error) {
    console.error('Error cleaning up partial files:', error);
    // Non-critical error, don't throw
  }
}
