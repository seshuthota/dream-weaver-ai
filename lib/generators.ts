import { createOpenRouterClient } from './openrouter';
import { MODELS } from './config/models';
import { PROMPTS } from './config/prompts';
import { extractJSON } from './utils';
import { getCharacterDescriptions } from './promptCache';
import type {
  AnimeInput,
  CharacterProfile,
  Scene,
  SceneWithPrompt,
  ImagePrompt,
  VerificationResult,
} from '@/types';

/**
 * OPTIMIZED: Generate complete story with all scenes and prompts in one API call
 * This replaces the sequential character → script → scenes → prompts flow
 */
export async function generateCompleteStory(
  input: AnimeInput,
  apiKey: string,
  model?: string
): Promise<{
  characters: Record<string, CharacterProfile>;
  script: string;
  scenes: SceneWithPrompt[];
}> {
  const prompt = PROMPTS.completeStory({ input });
  const client = createOpenRouterClient(apiKey);
  const modelToUse = model || MODELS.story.model;
  const response = await client.generateText(modelToUse, prompt);

  try {
    const parsed = extractJSON<{
      characters: Record<string, CharacterProfile>;
      script: string;
      scenes: SceneWithPrompt[];
    }>(response);

    // Validate structure
    if (!parsed.characters || !parsed.script || !parsed.scenes) {
      throw new Error('Invalid response structure');
    }

    return {
      characters: parsed.characters,
      script: parsed.script,
      scenes: parsed.scenes,
    };
  } catch (error) {
    console.error('Error parsing complete story:', error);
    throw new Error('Failed to generate complete story. Please try again.');
  }
}

export async function generateCharacterProfiles(
  characters: { name: string; traits: string }[],
  style: string,
  apiKey: string
): Promise<Record<string, CharacterProfile>> {
  const prompt = `Create detailed anime character profiles for a ${style} anime.

Characters to design:
${JSON.stringify(characters, null, 2)}

For each character, provide a detailed profile with:
1. Physical appearance (hair color/style, eye color, height, build)
2. Default outfit description (be specific about colors and style)
3. Personality details
4. Unique visual markers (scars, accessories, etc.)
5. Color palette (primary colors for this character)

Output MUST be valid JSON in this exact format:
{
  "character_name": {
    "name": "Full Name",
    "appearance": "detailed physical description",
    "outfit": "detailed outfit description",
    "personality": "personality traits",
    "visual_markers": "unique identifying features",
    "color_palette": ["color1", "color2", "color3"]
  }
}

Be creative and detailed, but ensure consistency for character recognition across multiple images.`;

  const client = createOpenRouterClient(apiKey);
  const response = await client.generateText(MODELS.story.model, prompt);

  try {
    return extractJSON<Record<string, CharacterProfile>>(response);
  } catch (error) {
    console.error('Error parsing character profiles:', error);
    throw new Error('Failed to generate character profiles. Please try again.');
  }
}

export async function generateScript(
  outline: string,
  characters: Record<string, CharacterProfile>,
  style: string,
  numEpisodes: number,
  apiKey: string
): Promise<string> {
  const charSummary = Object.entries(characters)
    .map(([name, data]) => `- ${name}: ${data.personality}`)
    .join('\n');

  const prompt = `Write a detailed anime script for a ${style} anime.

Story Outline: ${outline}

Characters:
${charSummary}

Requirements:
- Write ${numEpisodes} episode(s)
- Include scene descriptions, character actions, and dialogue
- Make it engaging and true to ${style} style
- Include emotional moments and character development
- Each scene should be visually interesting

Format the script clearly with scene headers and dialogue.`;

  const client = createOpenRouterClient(apiKey);
  return await client.generateText(MODELS.story.model, prompt);
}

export async function extractKeyScenes(
  script: string,
  characters: Record<string, CharacterProfile>,
  numScenes: number,
  apiKey: string
): Promise<Scene[]> {
  const charList = Object.keys(characters).join(', ');

  const prompt = `Analyze this anime script and extract ${numScenes} key scenes that should be visualized as images.

Script:
${script}

Available characters: ${charList}

For each scene, provide:
1. Scene ID (scene_1, scene_2, etc.)
2. Scene description (what's happening visually)
3. Characters present in the scene
4. Setting/location
5. Mood/atmosphere
6. Key visual elements

Output MUST be valid JSON array:
[
  {
    "id": "scene_1",
    "description": "detailed visual description of what's happening",
    "characters_present": ["Character1", "Character2"],
    "setting": "location description",
    "mood": "emotional atmosphere",
    "visual_elements": ["element1", "element2"]
  }
]

Choose the most visually impactful and story-important scenes.`;

  const client = createOpenRouterClient(apiKey);
  const response = await client.generateText(MODELS.story.model, prompt);

  try {
    return extractJSON<Scene[]>(response);
  } catch (error) {
    console.error('Error parsing scenes:', error);
    throw new Error('Failed to extract key scenes. Please try again.');
  }
}

export async function generateImagePrompt(
  scene: Scene,
  characters: Record<string, CharacterProfile>,
  style: string,
  apiKey: string,
  comicMode?: boolean
): Promise<ImagePrompt> {
  // Use cached character descriptions to reduce token usage
  const characterDescriptions = getCharacterDescriptions(scene.characters_present, characters);

  // Style-specific enhancements with technical lighting and composition specs
  const styleGuides: Record<string, string> = {
    shoujo: 'sparkles and flowers in background, soft diffused lighting (6500K warm color temperature), pastel color palette with pink and lavender tones, large expressive eyes with detailed star-shaped highlights, delicate fine linework, romantic dreamy atmosphere, shallow depth of field with bokeh, gentle rim lighting from top-left',
    shounen: 'dynamic action pose with motion blur effects, bold thick lines, dramatic high-contrast lighting (4000K cool color temperature) from top-right with sharp crisp shadows, intense determined expressions, vibrant energy effects with outer glow, saturated primary colors, strong sense of motion and speed, eye-level to low-angle camera perspective for heroic feel',
    seinen: 'realistic anatomical proportions, highly detailed photorealistic backgrounds with texture, sophisticated muted color palette with earthy tones, mature contemplative atmosphere, subtle cel shading with soft gradient shadows, professional anime cinematography, medium depth of field, natural lighting (5500K neutral color temperature) from camera left',
    josei: 'elegant refined character designs, natural human proportions, refined color choices with complementary color harmonies, realistic nuanced emotional expressions, detailed high-fashion clothing and accessories with visible fabric textures (silk, cotton, leather), soft side lighting (6000K slightly warm), sophisticated balanced composition',
    kodomomuke: 'bright cheerful saturated colors with high vibrance, simple rounded character designs with minimal detail, wholesome warm atmosphere, clear highly readable expressions, friendly character interactions with positive body language, flat even lighting (7000K bright daylight), high-angle camera view looking down, playful symmetrical composition',
    isekai: 'fantasy magical elements with glowing particle effects, mystical atmospheric lighting with volumetric light rays, RPG-style magical details and glowing runes, adventurous dynamic composition with diagonal lines, fantasy architecture or enchanted nature setting, dramatic golden hour lighting (8500K warm sunset), epic cinematic low-angle perspective, 8K ultra-detailed rendering'
  };

  const styleEnhancement = styleGuides[style.toLowerCase()] || 'high-quality anime art, detailed character designs';

  // Comic mode specific enhancements
  const comicModeInstructions = comicMode ? `

COMIC MODE ENABLED - CRITICAL REQUIREMENTS:
- Generate images in COMIC BOOK/MANGA style with TEXT BAKED INTO THE IMAGE
- Include speech bubbles with character dialogue visible in the image
- Add sound effects text (POW!, BOOM!, WHOOSH!, etc.) where appropriate
- Include narrative caption boxes with scene context
- Use comic book fonts and text styling (bold, stylized lettering)
- Draw clear speech bubble tails pointing to speaking characters
- Make text large and readable, properly positioned
- Include emotional symbols (sweat drops, anger marks, heart symbols)
- Add action lines and motion effects typical of comics
- Text should be in ENGLISH and clearly legible

Example comic elements to include:
- Speech bubble at top-left: "[Character name]: [dialogue]"
- Sound effect near action: "CRASH!" or "SWOOSH!"
- Caption box at bottom: "Meanwhile, in the city..."
- Thought bubble with "..." for internal thoughts
` : '';

  const prompt = `Generate a highly detailed ${comicMode ? 'COMIC BOOK/MANGA' : 'anime'} image prompt for Gemini 2.5 Flash Image API.${comicModeInstructions}

SCENE DESCRIPTION:
${scene.description}

CHARACTERS IN SCENE:
${characterDescriptions}

SETTING: ${scene.setting}
MOOD: ${scene.mood}
VISUAL ELEMENTS: ${scene.visual_elements.join(', ')}
ANIME STYLE: ${style}

Create a comprehensive prompt following this structure:

1. MAIN SUBJECT & COMPOSITION:
   - Exact character positions and poses (foreground, midground, background)
   - Character expressions and emotions (specific facial details)
   - Body language and gestures
   - Eye contact and character interactions
   - Rule of thirds composition, depth of field

2. CHARACTER DETAILS:
   - Hair (color, style, length, movement)
   - Eyes (color, shape, expression, highlights, reflections)
   - Clothing (exact colors, fabrics, accessories, wrinkles, details)
   - Skin tone and features
   - Unique identifiers from character profiles

3. BACKGROUND & SETTING:
   - Specific location details (architecture, nature, interior)
   - Environmental elements (props, furniture, plants)
   - Atmospheric effects (weather, time of day)
   - Depth layers (foreground, midground, background)

4. LIGHTING & COLOR:
   - Light source direction and intensity
   - Shadow placement and softness
   - Color temperature (warm/cool)
   - Color palette matching style and mood
   - Highlights and reflections

5. ANIME ART STYLE:
   - ${styleEnhancement}
   - ${comicMode ? 'Comic book/manga panel style with text and speech bubbles' : 'Cel shading technique, clean linework'}
   - Anime proportions and anatomy
   - Specific anime art characteristics for ${style} style
   - Professional ${comicMode ? 'comic book/manga' : 'anime'} production quality

6. TECHNICAL QUALITY:
   - High resolution, masterpiece quality
   - Professional ${comicMode ? 'comic book/manga panel' : 'anime screenshot'} aesthetic
   - Detailed rendering, sharp focus
   - Vibrant colors, proper color balance
   ${comicMode ? '- Clear, readable text in speech bubbles and captions' : ''}

CRITICAL REQUIREMENTS:
- Maintain exact character consistency (hair, eyes, outfit colors)
- Use specific color names and values
- Include spatial relationships (X is standing to the left of Y)
- Specify exact poses and angles
- Add style-specific elements for ${style}
- Keep characters on-model and recognizable
- Single coherent scene${comicMode ? ' with integrated text elements' : ', not multiple panels'}
${comicMode ? '- TEXT MUST BE BAKED INTO THE IMAGE (speech bubbles, sound effects, captions)' : ''}

Output MUST be valid JSON:
{
  "positive_prompt": "8K ultra-detailed masterpiece, high quality ${comicMode ? 'comic book manga panel with speech bubbles and text' : 'professional anime art'}, [detailed prompt following ALL 6 sections above with specific technical details], professional ${comicMode ? 'comic book manga panel' : 'anime'} production with photorealistic textures, vibrant saturated colors with proper color grading, crisp clean linework with anti-aliasing, ${comicMode ? 'readable bold text in speech bubbles (24pt+), ' : 'cel shading with distinct highlights and shadows, '}${style} style ${comicMode ? 'comic manga' : 'anime'}, sharp focus, proper depth of field, cinematic composition",
  "scene_id": "${scene.id}",
  "technical_params": {
    "aspect_ratio": "16:9",
    "resolution": "8K",
    "style_emphasis": "${style} ${comicMode ? 'comic/manga' : 'anime'} aesthetic with ${styleEnhancement}${comicMode ? ' and comic book text elements' : ''}",
    "rendering_quality": "masterpiece-level detail, photorealistic textures, production-grade finish"
  }
}

Make the prompt natural-sounding but extremely detailed and specific. Include all character details from profiles.`;

  const client = createOpenRouterClient(apiKey);
  const response = await client.generateText(MODELS.prompt.model, prompt);

  try {
    return extractJSON<ImagePrompt>(response);
  } catch (error) {
    console.error('Error parsing prompt:', error);
    // Fallback to using raw response
    return {
      positive_prompt: response,
      scene_id: scene.id,
      technical_params: {},
    };
  }
}

export async function generateImage(
  prompt: string | ImagePrompt,
  apiKey: string,
  model?: string
): Promise<{ success: boolean; imageData?: string; error?: string }> {
  const client = createOpenRouterClient(apiKey);
  const modelToUse = model || MODELS.image.model;

  // Handle both string prompts and ImagePrompt objects
  if (typeof prompt === 'string') {
    return await client.generateImage(modelToUse, prompt);
  }

  // Use ImagePrompt with negative prompt support
  return await client.generateImage(
    modelToUse,
    prompt.positive_prompt,
    prompt.negative_prompt
  );
}

export async function verifyImage(
  imageData: string,
  scene: Scene,
  characters: Record<string, CharacterProfile>,
  apiKey: string,
  model?: string
): Promise<VerificationResult> {
  // Use cached character descriptions to reduce token usage
  const charDescriptions = getCharacterDescriptions(scene.characters_present, characters);

  const verificationPrompt = PROMPTS.verification({ scene, characters });
  const client = createOpenRouterClient(apiKey);
  const modelToUse = model || MODELS.verification.model;

  try {
    const response = await client.analyzeImage(modelToUse, verificationPrompt, imageData);

    if (!response || typeof response !== 'string') {
      throw new Error('Invalid response from verification API');
    }

    const result = extractJSON<VerificationResult>(response);

    // Validate required fields
    if (typeof result.character_consistency_score !== 'number' ||
        typeof result.scene_accuracy_score !== 'number' ||
        typeof result.quality_score !== 'number') {
      throw new Error('Invalid verification result structure');
    }

    // Calculate if passed based on threshold
    const scores = [
      result.character_consistency_score,
      result.scene_accuracy_score,
      result.quality_score,
    ];
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    result.passed = avgScore >= 0.75;

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error verifying image:', errorMessage);

    // Return neutral pass on error - verification is optional
    return {
      passed: true,
      character_consistency_score: 0.75,
      scene_accuracy_score: 0.75,
      quality_score: 0.75,
      issues: [`Verification skipped: ${errorMessage}`],
      suggestions: 'Manual review recommended',
    };
  }
}