import type { AnimeInput, CharacterProfile, Scene } from '@/types';

interface CompleteStoryParams {
  input: AnimeInput;
}

interface CharacterProfilesParams {
  characters: { name: string; traits: string }[];
  style: string;
}

interface ScriptParams {
  outline: string;
  characters: Record<string, CharacterProfile>;
  style: string;
  numEpisodes: number;
}

interface KeyScenesParams {
  script: string;
  characters: Record<string, CharacterProfile>;
  numScenes: number;
}

interface ImagePromptParams {
  scene: Scene;
  characters: Record<string, CharacterProfile>;
  style: string;
  comicMode?: boolean;
}

interface VerificationParams {
  scene: Scene;
  characters: Record<string, CharacterProfile>;
}

interface StoryIdeaParams {
  genre: string;
  tone: string;
  complexity: string;
  keywords?: string;
}

export const PROMPTS = {
  completeStory: ({ input }: CompleteStoryParams) => {
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

    return `Generate a complete anime story with all details in a single structured response.

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
   - Description: ONE SENTENCE story narrative for viewers to read
     Example: "Yuki discovers her ice powers during lunch break."
     This is VIEWER TEXT - NOT technical details, camera angles, or art style
   - Characters present
   - Setting/location (brief, e.g., "school courtyard")
   - Mood/atmosphere
   - Visual elements
   - Dialogue (if any, character name + line)
   - COMPLETE IMAGE_PROMPT: Detailed technical prompt ONLY for image generator
     This is TECHNICAL PROMPT - Include character appearance, pose, setting details, lighting, art style
     This is SEPARATE from description - viewers never see this

IMAGE_PROMPT REQUIREMENTS (CRITICAL):
Each image_prompt must be a detailed, complete prompt ready to send directly to the image API.
Include:
- All character details (appearance, outfit, pose, expression)
- Background and setting specifics
- Lighting, colors, composition
- ${input.style} anime style specifications
- Professional quality indicators
${input.comicMode ? '- COMIC MODE: Specific text bubble placements with exact dialogue to render' : ''}

CHARACTER CONSISTENCY REQUIREMENTS (CRITICAL):
- Use IDENTICAL character descriptions in ALL ${input.scenes_per_episode} scene image_prompts
- Include exact color codes (e.g., "red hair #DC143C", "blue eyes #1E90FF")
- Repeat outfit details in EVERY image prompt verbatim
- Use the SAME descriptive phrases across all scenes
Example: If Scene 1 says "short spiky blue hair", ALL scenes must say "short spiky blue hair"
This ensures visual consistency across all generated images.

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
      "description": "One sentence describing what happens in this scene for viewers",
      "characters_present": ["Character1", "Character2"],
      "setting": "Brief location name",
      "mood": "Emotional atmosphere",
      "visual_elements": ["element1", "element2"],
      "dialogue": "Character Name: Their dialogue line",
      "image_prompt": "COMPLETE detailed technical prompt for image generation: masterpiece, high quality ${input.comicMode ? 'comic manga panel with speech bubbles' : 'anime art'}, [character name] with [full appearance details] wearing [outfit details], [specific action/pose], [detailed setting], [lighting], [mood], ${input.style} style${input.comicMode ? ', speech bubble at [position] with text [exact dialogue], sound effect [text] at [position]' : ''}, professional anime production, vibrant colors",
      "negative_prompt": "blurry, low quality, deformed, disfigured, ugly, bad anatomy, extra limbs, watermark, signature, amateur, inconsistent style, multiple art styles, distorted faces, mutated hands"
    }
  ]
}

CRITICAL REQUIREMENTS:
- "description" field: ONE SENTENCE viewer-friendly narrative (e.g., "Yuki freezes the classroom by accident.")
- "image_prompt" field: HIGHLY DETAILED technical prompt with all visual specifications
- Keep these SEPARATE - description is for viewers, image_prompt is for the AI image generator

Be extremely detailed in image_prompts. Include specific colors, positions, emotions, and style elements.
${input.comicMode ? 'COMIC MODE: Include exact text placement and dialogue in every image_prompt.' : ''}`;
  },

  characterProfiles: ({ characters, style }: CharacterProfilesParams) => {
    return `Create detailed anime character profiles for a ${style} anime.

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
  },

  script: ({ outline, characters, style, numEpisodes }: ScriptParams) => {
    const charSummary = Object.entries(characters)
      .map(([name, data]) => `- ${name}: ${data.personality}`)
      .join('\n');

    return `Write a detailed anime script for a ${style} anime.

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
  },

  keyScenes: ({ script, characters, numScenes }: KeyScenesParams) => {
    const charList = Object.keys(characters).join(', ');

    return `Analyze this anime script and extract ${numScenes} key scenes that should be visualized as images.

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
  },

  imagePrompt: ({ scene, characters, style, comicMode }: ImagePromptParams) => {
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

    const styleGuides: Record<string, string> = {
      shoujo: 'sparkles and flowers in background, soft lighting, pastel colors, large expressive eyes with detailed highlights, delicate linework, romantic atmosphere',
      shounen: 'dynamic action pose, bold lines, dramatic lighting with strong shadows, intense expressions, energy effects, vibrant colors, sense of motion',
      seinen: 'realistic proportions, detailed backgrounds, sophisticated color palette, mature atmosphere, subtle shading, professional anime art',
      josei: 'elegant character designs, natural proportions, refined color choices, realistic emotional expressions, detailed fashion and accessories',
      kodomomuke: 'bright cheerful colors, simple rounded designs, wholesome atmosphere, clear expressions, friendly character interactions',
      isekai: 'fantasy elements, magical atmosphere, RPG-style details, adventurous composition, fantasy architecture or nature'
    };

    const styleEnhancement = styleGuides[style.toLowerCase()] || 'high-quality anime art, detailed character designs';

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

    return `Generate a highly detailed ${comicMode ? 'COMIC BOOK/MANGA' : 'anime'} image prompt for Gemini 2.5 Flash Image API.${comicModeInstructions}

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
  },

  verification: ({ scene, characters }: VerificationParams) => {
    const charDescriptions = scene.characters_present
      .map((charName) => {
        const char = characters[charName];
        return char ? `${charName}: ${char.appearance}, ${char.outfit}` : charName;
      })
      .join('\n');

    return `Analyze this anime image and verify it matches the requirements.

EXPECTED SCENE:
Description: ${scene.description}
Setting: ${scene.setting}
Mood: ${scene.mood}
Visual Elements: ${scene.visual_elements.join(', ')}

EXPECTED CHARACTERS:
${charDescriptions}

STRICT EVALUATION CRITERIA:
1. CHARACTER CONSISTENCY (0-1): Do characters match their described appearance EXACTLY?
   - Hair color, style, and length must match
   - Eye color and shape must match
   - Outfit colors and style must match
   - Body proportions and features must match
   Score 0.9+ only if nearly perfect match

2. SCENE ACCURACY (0-1): Does the image match the scene description PRECISELY?
   - Setting and location must be correct
   - Character actions and poses must match
   - Mood and atmosphere must be conveyed
   - Visual elements must be present
   Score 0.9+ only if scene is accurately depicted

3. QUALITY (0-1): Is this professional anime production standard?
   - Clean linework and proper anatomy
   - Appropriate lighting and shading
   - Vibrant colors and good composition
   - No artifacts, distortions, or errors
   Score 0.9+ only for publication-quality art

4. List ALL issues found, even minor ones
5. Provide specific, actionable suggestions for improvement

Output MUST be valid JSON:
{
  "passed": true or false,
  "character_consistency_score": 0.0 to 1.0,
  "scene_accuracy_score": 0.0 to 1.0,
  "quality_score": 0.0 to 1.0,
  "issues": ["list of ALL issues found"],
  "suggestions": "specific improvements needed"
}

PASSING THRESHOLD: Average score must be ≥0.75 to pass (not lenient).
Only pass images that would be acceptable in a published manga or anime.
Be thorough and honest in your assessment - users want HIGH quality results.`;
  },

  storyIdea: ({ genre, tone, complexity, keywords }: StoryIdeaParams) => {
    const complexityMap = {
      simple: { chars: '2-3', scenes: '3-4' },
      standard: { chars: '3-4', scenes: '5-6' },
      epic: { chars: '4-5', scenes: '7-8' }
    };
    const { chars, scenes } = complexityMap[complexity as keyof typeof complexityMap] || complexityMap.standard;

    const toneDescriptions = {
      light: 'lighthearted, fun, upbeat with positive vibes and happy moments',
      balanced: 'balanced mix of light and serious moments, emotionally varied',
      dark: 'dark, serious, intense with dramatic stakes and mature themes'
    };
    const toneDesc = toneDescriptions[tone as keyof typeof toneDescriptions] || toneDescriptions.balanced;

    const keywordsSection = keywords ? `

CRITICAL - USER KEYWORDS/THEME:
"${keywords}"

MANDATORY REQUIREMENTS:
1. If the keywords contain SPECIFIC CHARACTER NAMES (like "Thor", "Iron Man", "Naruto", etc.), you MUST use those EXACT names in the story - do NOT rename or change them
2. If the keywords mention specific scenarios (like "fighting", "battle", "romance"), make that the CENTRAL plot element
3. If the keywords mention settings (like "space", "school", "city"), set the story there
4. The story outline and character list must DIRECTLY reflect what the user specified

Examples:
- "Thor fighting Iron Man" → Story about Thor and Iron Man in combat (use exact names)
- "Naruto vs Sasuke" → Story featuring Naruto and Sasuke (use exact names)
- "magical school adventure" → Story set in a magical school
- "space pirates treasure hunt" → Pirates in space searching for treasure

DO NOT create similar/inspired characters - use the EXACT names and elements from the keywords.` : '';

    return `Generate a creative and engaging anime story idea in the ${genre} genre with a ${toneDesc} tone.${keywordsSection}

Be imaginative and diverse in your suggestions.

Requirements:
1. Story outline: 2-3 sentences with an engaging hook and interesting premise that fits the ${genre} genre and ${tone} tone${keywords ? ` and DIRECTLY incorporates "${keywords}"` : ''}
2. Characters: ${chars} unique characters with distinct personalities and traits that suit the ${tone} atmosphere${keywords ? ` - IF keywords specify character names (like "Thor", "Goku", etc.), use those EXACT names, do NOT modify them` : ''}
3. Style: Choose the most fitting anime style for this ${genre} story (consider shoujo, shounen, seinen, slice-of-life, fantasy, sci-fi)
4. Scene count: ${scenes} scenes based on ${complexity} complexity

Available styles: shoujo, shounen, seinen, slice-of-life, fantasy, sci-fi

Output MUST be valid JSON in this exact format:
{
  "outline": "A compelling 2-3 sentence story premise that matches the ${genre} genre and ${tone} tone${keywords ? ` and incorporates ${keywords}` : ''}",
  "characters": [
    {
      "name": "${keywords ? 'EXACT character name from keywords if specified, otherwise' : ''} Character Name",
      "traits": "personality, appearance, special abilities or characteristics fitting the ${tone} tone"
    }
  ],
  "style": "one of the available styles that best fits ${genre}",
  "scenes": number between ${scenes.split('-')[0]} and ${scenes.split('-')[1]}
}

${keywords ? `REMINDER: If "${keywords}" contains character names like "Thor", "Iron Man", "Goku", etc., the "name" field MUST use those EXACT names. Do NOT rename them to "Toru", "Iro", or similar variations.` : ''}

GENRE FOCUS: ${genre}
TONE: ${tone} (${toneDesc})
COMPLEXITY: ${complexity} (${chars} characters, ${scenes} scenes)

Be creative! Create unique character dynamics and suggest a story that would make a great ${genre} anime with a ${tone} tone.`;
  },
} as const;
