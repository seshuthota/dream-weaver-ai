import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate the estimated cost per scene
 * Based on average API costs: ~$0.07 per scene (includes story + image generation)
 */
const COST_PER_SCENE = 0.07;

/**
 * Calculate cost and return as number
 * @param numScenes - Number of scenes to generate
 * @param multiplier - Cost multiplier (default 1.0)
 * @returns Cost as a number
 */
export function calculateCost(numScenes: number, multiplier: number = 1.0): number {
  return numScenes * COST_PER_SCENE * multiplier;
}

/**
 * Calculate cost and return as formatted string
 * @param numScenes - Number of scenes to generate
 * @param multiplier - Cost multiplier (default 1.0)
 * @returns Formatted cost string (e.g., "$0.21")
 */
export function estimateCost(numScenes: number, multiplier: number = 1.0): string {
  return formatCost(calculateCost(numScenes, multiplier));
}

/**
 * Format a cost number as a currency string
 * @param cost - Cost as a number
 * @returns Formatted cost string (e.g., "$0.21")
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

/**
 * Extract and parse JSON from AI model responses
 * Handles various formats: ```json, ```, plain JSON, and embedded JSON
 * @param text - Raw text response from AI model
 * @returns Parsed JSON object
 * @throws Error if JSON cannot be extracted or parsed
 */
export function extractJSON<T = any>(text: string): T {
  let cleanText = text.trim();

  // Try to extract from code blocks
  if (cleanText.includes('```json')) {
    const parts = cleanText.split('```json');
    if (parts.length > 1) {
      cleanText = parts[1].split('```')[0];
    }
  } else if (cleanText.includes('```')) {
    const parts = cleanText.split('```');
    if (parts.length > 1) {
      cleanText = parts[1].split('```')[0];
    }
  }

  cleanText = cleanText.trim();

  // If text doesn't start with {, try to find JSON object using regex
  if (!cleanText.startsWith('{') && !cleanText.startsWith('[')) {
    const jsonMatch = cleanText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    } else {
      throw new Error('No JSON object or array found in response');
    }
  }

  try {
    return JSON.parse(cleanText);
  } catch (error) {
    throw new Error(
      `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}. ` +
      `Text preview: ${cleanText.substring(0, 200)}`
    );
  }
}