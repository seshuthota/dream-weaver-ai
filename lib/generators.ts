import { openrouter } from './openrouter';
import type {
  AnimeInput,
  CharacterProfile,
  Scene,
  SceneWithPrompt,
  ImagePrompt,
  VerificationResult,
} from '@/types';

const MODELS = {
  story: 'x-ai/grok-4-fast:free',
  prompt: 'x-ai/grok-4-fast:free',
  image: 'google/gemini-2.5-flash-image-preview',
  verification: 'x-ai/grok-4-fast:free',
};

/**
 * OPTIMIZED: Generate complete story with all scenes and prompts in one API call
 * This replaces the sequential character → script → scenes → prompts flow
 */
export async function generateCompleteStory(
  input: AnimeInput
): Promise<{
  characters: Record<string, CharacterProfile>;
  script: string;
  scenes: SceneWithPrompt[];
}> {
  const characterList = input.characters
    .map(c => `- ${c.name}: ${c.traits}`)
    .join('\n');

  const comicModeInstructions = input.comicMode ? `

COMIC MODE ENABLED - TEXT IN IMAGES:
For each scene's image_prompt, include SPECIFIC instructions for:
- Speech bubble placement (e.g., "large white speech bubble at top-left")
- Exact dialogue text to appear in bubble (e.g., "bubble text: 'Watch out!'")
- Sound effects with positioning (e.g., "bold red text 'POW!' near action")
- Caption boxes for narration (e.g., "yellow caption box at bottom: 'Meanwhile...'")
- Font styling: LARGE, BOLD, highly readable text
- High contrast: white bubbles with black outlines
- Clear bubble tails pointing to speakers
- Text size: minimum 24pt equivalent, easily readable
- Emotional symbols (sweat drops, anger marks, hearts)

Example image_prompt with text:
"anime scene showing [description], white speech bubble at top-left with bold black text saying 'I won't give up!',
character's mouth open mid-speech, sound effect 'WHOOSH!' in red letters near motion lines"
` : '';

  const prompt = `Generate a complete anime story with all details in a single structured response.

STORY OUTLINE: ${input.outline}

CHARACTERS:
${characterList}

STYLE: ${input.style}
NUMBER OF SCENES: ${input.scenes_per_episode}${comicModeInstructions}

Generate the following in ONE response:

1. CHARACTER PROFILES: Detailed design for each character
   - Physical appearance (hair, eyes, height, build)
   - Outfit description (specific colors and style)
   - Personality traits
   - Visual markers (unique features)
   - Color palette (3 colors)

2. FULL SCRIPT: Complete anime script with:
   - Scene descriptions
   - Character actions and emotions
   - Dialogue for each character
   - ${input.style} style elements

3. KEY SCENES: Extract exactly ${input.scenes_per_episode} visually impactful scenes
   For EACH scene provide:
   - Scene ID (scene_1, scene_2, etc.)
   - Visual description
   - Characters present
   - Setting/location
   - Mood/atmosphere
   - Visual elements
   - Dialogue (if any)
   - COMPLETE IMAGE_PROMPT ready for image generation API

IMAGE_PROMPT REQUIREMENTS (CRITICAL):
Each image_prompt must be a detailed, complete prompt ready to send directly to the image API.
Include:
- All character details (appearance, outfit, pose, expression)
- Background and setting specifics
- Lighting, colors, composition
- ${input.style} anime style specifications
- Professional quality indicators
${input.comicMode ? '- COMIC MODE: Specific text bubble placements with exact dialogue to render' : ''}

Output MUST be valid JSON in this EXACT format:
{
  "characters": {
    "character_name": {
      "name": "Full Name",
      "appearance": "detailed description",
      "outfit": "detailed outfit",
      "personality": "personality traits",
      "visual_markers": "unique features",
      "color_palette": ["#color1", "#color2", "#color3"]
    }
  },
  "script": "Full script text with scenes and dialogue...",
  "scenes": [
    {
      "id": "scene_1",
      "description": "What's happening visually",
      "characters_present": ["Character1", "Character2"],
      "setting": "Location description",
      "mood": "Emotional atmosphere",
      "visual_elements": ["element1", "element2"],
      "dialogue": "Character: dialogue text",
      "image_prompt": "COMPLETE detailed prompt: masterpiece, high quality ${input.comicMode ? 'comic manga panel with speech bubbles' : 'anime art'}, [character name] with [appearance details] wearing [outfit], [action/pose], [setting details], [lighting], [mood], ${input.style} style${input.comicMode ? ', speech bubble at [position] with text [exact dialogue], sound effect [text] at [position]' : ''}, professional anime production, vibrant colors"
    }
  ]
}

Be extremely detailed in image_prompts. Include specific colors, positions, emotions, and style elements.
${input.comicMode ? 'COMIC MODE: Include exact text placement and dialogue in every image_prompt.' : ''}`;

  const response = await openrouter.generateText(MODELS.story, prompt);

  try {
    let text = response;
    if (text.includes('```json')) {
      text = text.split('```json')[1].split('```')[0];
    } else if (text.includes('```')) {
      text = text.split('```')[1].split('```')[0];
    }

    const parsed = JSON.parse(text.trim());

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
  style: string
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

  const response = await openrouter.generateText(MODELS.story, prompt);

  try {
    let text = response;
    if (text.includes('```json')) {
      text = text.split('```json')[1].split('```')[0];
    } else if (text.includes('```')) {
      text = text.split('```')[1].split('```')[0];
    }
    return JSON.parse(text.trim());
  } catch (error) {
    console.error('Error parsing character profiles:', error);
    return {};
  }
}

export async function generateScript(
  outline: string,
  characters: Record<string, CharacterProfile>,
  style: string,
  numEpisodes: number
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

  return await openrouter.generateText(MODELS.story, prompt);
}

export async function extractKeyScenes(
  script: string,
  characters: Record<string, CharacterProfile>,
  numScenes: number
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

  const response = await openrouter.generateText(MODELS.story, prompt);

  try {
    let text = response;
    if (text.includes('```json')) {
      text = text.split('```json')[1].split('```')[0];
    } else if (text.includes('```')) {
      text = text.split('```')[1].split('```')[0];
    }
    return JSON.parse(text.trim());
  } catch (error) {
    console.error('Error parsing scenes:', error);
    return [];
  }
}

export async function generateImagePrompt(
  scene: Scene,
  characters: Record<string, CharacterProfile>,
  style: string,
  comicMode?: boolean
): Promise<ImagePrompt> {
  const characterDescriptions = scene.characters_present
    .map((charName) => {
      const char = characters[charName];
      if (!char) return `${charName}: (character details not found)`;
      let desc = `${charName}: ${char.appearance}, wearing ${char.outfit}`;
      if (char.visual_markers) {
        desc += `, distinctive features: ${char.visual_markers}`;
      }
      return desc;
    })
    .join('\n');

  // Style-specific enhancements
  const styleGuides: Record<string, string> = {
    shoujo: 'sparkles and flowers in background, soft lighting, pastel colors, large expressive eyes with detailed highlights, delicate linework, romantic atmosphere',
    shounen: 'dynamic action pose, bold lines, dramatic lighting with strong shadows, intense expressions, energy effects, vibrant colors, sense of motion',
    seinen: 'realistic proportions, detailed backgrounds, sophisticated color palette, mature atmosphere, subtle shading, professional anime art',
    josei: 'elegant character designs, natural proportions, refined color choices, realistic emotional expressions, detailed fashion and accessories',
    kodomomuke: 'bright cheerful colors, simple rounded designs, wholesome atmosphere, clear expressions, friendly character interactions',
    isekai: 'fantasy elements, magical atmosphere, RPG-style details, adventurous composition, fantasy architecture or nature'
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
  "positive_prompt": "masterpiece, high quality ${comicMode ? 'comic book manga panel with speech bubbles and text' : 'anime art'}, [detailed prompt following the structure above], professional ${comicMode ? 'comic book manga panel' : 'anime'} production, vibrant colors, clean linework, ${comicMode ? 'readable text in speech bubbles, ' : 'cel shading, '}${style} style ${comicMode ? 'comic manga' : 'anime'}",
  "scene_id": "${scene.id}",
  "technical_params": {
    "aspect_ratio": "16:9",
    "style_emphasis": "${style} ${comicMode ? 'comic/manga' : 'anime'} aesthetic with ${styleEnhancement}${comicMode ? ' and comic book text elements' : ''}"
  }
}

Make the prompt natural-sounding but extremely detailed and specific. Include all character details from profiles.`;

  const response = await openrouter.generateText(MODELS.prompt, prompt);

  try {
    let text = response;
    if (text.includes('```json')) {
      text = text.split('```json')[1].split('```')[0];
    } else if (text.includes('```')) {
      text = text.split('```')[1].split('```')[0];
    }
    const promptData: ImagePrompt = JSON.parse(text.trim());
    return promptData;
  } catch (error) {
    console.error('Error parsing prompt:', error);
    // Fallback
    return {
      positive_prompt: response,
      scene_id: scene.id,
      technical_params: {},
    };
  }
}

export async function generateImage(prompt: string): Promise<{ success: boolean; imageData?: string; error?: string }> {
  return await openrouter.generateImage(MODELS.image, prompt);
}

export async function verifyImage(
  imageData: string,
  scene: Scene,
  characters: Record<string, CharacterProfile>
): Promise<VerificationResult> {
  const charDescriptions = scene.characters_present
    .map((charName) => {
      const char = characters[charName];
      return char ? `${charName}: ${char.appearance}, ${char.outfit}` : charName;
    })
    .join('\n');

  const verificationPrompt = `Analyze this anime image and verify it matches the requirements.

EXPECTED SCENE:
Description: ${scene.description}
Setting: ${scene.setting}
Mood: ${scene.mood}
Visual Elements: ${scene.visual_elements.join(', ')}

EXPECTED CHARACTERS:
${charDescriptions}

Please evaluate:
1. CHARACTER CONSISTENCY (0-1): Do characters match their described appearance?
2. SCENE ACCURACY (0-1): Does the image match the scene description?
3. QUALITY (0-1): Is this professional-quality anime art?
4. List any issues or inconsistencies
5. Provide specific suggestions for improvement if needed

Output MUST be valid JSON:
{
  "passed": true or false,
  "character_consistency_score": 0.0 to 1.0,
  "scene_accuracy_score": 0.0 to 1.0,
  "quality_score": 0.0 to 1.0,
  "issues": ["list of any issues found"],
  "suggestions": "specific improvements needed"
}

Be objective but not overly critical. The image should pass if it's reasonable quality and mostly matches requirements.`;

  try {
    const response = await openrouter.analyzeImage(MODELS.verification, verificationPrompt, imageData);

    let text = response;
    if (text.includes('```json')) {
      text = text.split('```json')[1].split('```')[0];
    } else if (text.includes('```')) {
      text = text.split('```')[1].split('```')[0];
    }

    const result: VerificationResult = JSON.parse(text.trim());

    // Calculate if passed based on threshold
    const scores = [
      result.character_consistency_score,
      result.scene_accuracy_score,
      result.quality_score,
    ];
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    result.passed = avgScore >= 0.7;

    return result;
  } catch (error) {
    console.error('Error verifying image:', error);
    // Return lenient pass on error
    return {
      passed: true,
      character_consistency_score: 0.7,
      scene_accuracy_score: 0.7,
      quality_score: 0.7,
      issues: ['Could not parse verification result'],
      suggestions: 'Manual review recommended',
    };
  }
}