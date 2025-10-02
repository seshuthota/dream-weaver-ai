export type QualityPresetId = 'draft' | 'standard' | 'premium';

export interface QualityPreset {
  id: QualityPresetId;
  name: string;
  description: string;
  maxRetries: number;
  skipVerification: boolean;
  strictVerification?: boolean; // Use 0.85 threshold instead of 0.75
  costMultiplier: number;
  icon: string;
  color: string; // Tailwind color class
}

export const QUALITY_PRESETS: Record<QualityPresetId, QualityPreset> = {
  draft: {
    id: 'draft',
    name: 'Draft',
    description: 'Fast generation, lower cost. Single attempt, no quality verification.',
    maxRetries: 1,
    skipVerification: true,
    costMultiplier: 0.7, // ~$0.05 per scene
    icon: '⚡',
    color: 'blue',
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    description: 'Balanced quality and speed. Up to 3 retries with quality checks.',
    maxRetries: 3,
    skipVerification: false,
    costMultiplier: 1.0, // $0.07 per scene
    icon: '⭐',
    color: 'purple',
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'Best quality. Up to 5 retries with strict verification (85% threshold).',
    maxRetries: 5,
    skipVerification: false,
    strictVerification: true,
    costMultiplier: 1.5, // ~$0.10 per scene
    icon: '💎',
    color: 'amber',
  },
};

/**
 * Get preset by ID, with fallback to standard
 */
export function getPreset(presetId?: QualityPresetId): QualityPreset {
  return QUALITY_PRESETS[presetId || 'standard'];
}

/**
 * Get all presets as an array
 */
export function getAllPresets(): QualityPreset[] {
  return Object.values(QUALITY_PRESETS);
}
