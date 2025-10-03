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
 * Attempt to repair common JSON issues
 */
function repairJSON(jsonStr: string): string {
  let repaired = jsonStr;
  
  // Remove trailing commas before closing braces/brackets
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
  
  // Try to close unclosed strings by finding unterminated quotes
  const quoteCount = (repaired.match(/"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    // Odd number of quotes - try to close the last one
    const lastQuoteIndex = repaired.lastIndexOf('"');
    // Look for the next comma, brace, or bracket after the unclosed quote
    const nextDelimiter = repaired.slice(lastQuoteIndex + 1).search(/[,\}\]]/);
    if (nextDelimiter !== -1) {
      const insertPos = lastQuoteIndex + 1 + nextDelimiter;
      repaired = repaired.slice(0, insertPos) + '"' + repaired.slice(insertPos);
    }
  }
  
  // Try to close unclosed objects/arrays
  const openBraces = (repaired.match(/\{/g) || []).length;
  const closeBraces = (repaired.match(/\}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;
  
  // Add missing closing braces
  for (let i = 0; i < openBraces - closeBraces; i++) {
    repaired += '}';
  }
  
  // Add missing closing brackets
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    repaired += ']';
  }
  
  return repaired;
}

/**
 * Extract and parse JSON from AI model responses
 * Handles various formats: ```json, ```, plain JSON, and embedded JSON
 * Includes automatic repair for common JSON issues
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

  // First attempt: parse as-is
  try {
    return JSON.parse(cleanText);
  } catch (firstError) {
    // Second attempt: try to repair common issues
    console.warn('Initial JSON parse failed, attempting repair...', firstError);
    
    try {
      const repairedText = repairJSON(cleanText);
      const result = JSON.parse(repairedText);
      console.log('Successfully parsed JSON after repair');
      return result;
    } catch (repairError) {
      // Both attempts failed, throw detailed error
      const errorMsg = firstError instanceof Error ? firstError.message : 'Unknown error';
      const preview = cleanText.substring(0, 500);
      const endPreview = cleanText.length > 500 ? cleanText.substring(cleanText.length - 200) : '';
      
      throw new Error(
        `Failed to parse JSON: ${errorMsg}. ` +
        `Response length: ${cleanText.length} chars. ` +
        `Start preview: ${preview}... ` +
        (endPreview ? `End preview: ...${endPreview}` : '')
      );
    }
  }
}