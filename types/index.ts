export interface Character {
  name: string;
  traits: string;
}

export interface AnimeInput {
  outline: string;
  characters: Character[];
  style: string;
  episodes: number;
  scenes_per_episode: number;
  comicMode?: boolean;
}

export interface CharacterProfile {
  name: string;
  appearance: string;
  outfit: string;
  personality: string;
  visual_markers: string;
  color_palette: string[];
}

export interface Scene {
  id: string;
  description: string;
  characters_present: string[];
  setting: string;
  mood: string;
  visual_elements: string[];
}

export interface SceneWithPrompt extends Scene {
  image_prompt: string;
  dialogue?: string;
}

export interface ImagePrompt {
  positive_prompt: string;
  negative_prompt?: string;
  scene_id: string;
  technical_params?: {
    aspect_ratio?: string;
    style_emphasis?: string;
  };
}

export interface GeneratedImage {
  scene_id: string;
  image_url: string;
  image_path?: string;
  description: string;
  dialogue?: string;
  setting?: string;
  verification?: VerificationResult;
  attempts: number;
}

export interface VerificationResult {
  passed: boolean;
  character_consistency_score: number;
  scene_accuracy_score: number;
  quality_score: number;
  issues: string[];
  suggestions: string;
}

export interface GenerationResult {
  script: string;
  characters: Record<string, CharacterProfile>;
  scenes: GeneratedImage[];
  metadata: {
    success: boolean;
    total_scenes: number;
    passed_verification: number;
    needs_review: number;
    generation_time_seconds: number;
    timestamp: string;
  };
}

export interface GenerationProgress {
  stage: 'story' | 'prompts' | 'image' | 'verification' | 'images_complete' | 'complete' | 'error';
  progress: number;
  currentScene?: number;
  totalScenes?: number;
  message: string;
  data?: any;
}

export interface Preset {
  id: string;
  name: string;
  input: AnimeInput;
  createdAt: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  input: AnimeInput;
  result: GenerationResult;
  thumbnail: string;
  title: string;
}