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
   - Description: SHORT 1-2 SENTENCE story caption (MAX 15 words)
     CRITICAL: This appears as overlay text on the image - keep it EXTREMELY concise
     Good: "Lila bakes cookies while Finn causes mischief in the kitchen."
     Bad: "In the cozy bakery kitchen, surrounded by flour and sugar, Lila carefully..."
     MUST BE SHORT AND DIRECT - viewers see this as a caption
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
      "description": "Short caption (MAX 15 words, 1-2 sentences)",
      "characters_present": ["Character1", "Character2"],
      "setting": "Brief location name",
      "mood": "Emotional atmosphere",
      "visual_elements": ["element1", "element2"],
      "dialogue": "Character Name: Their dialogue line",
      "image_prompt": "COMPLETE detailed technical prompt for image generation: masterpiece, high quality ${input.comicMode ? 'comic manga panel with speech bubbles' : 'anime art'}, [character name] with [full appearance details] wearing [outfit details], [specific action/pose], [detailed setting], [lighting], [mood], ${input.style} style${input.comicMode ? ', speech bubble at [position] with text [exact dialogue], sound effect [text] at [position]' : ''}, professional anime production, vibrant colors",
      "negative_prompt": "blurry, out of focus, low quality, low resolution, deformed, disfigured, ugly, bad anatomy, incorrect anatomy, extra limbs, missing limbs, extra fingers, missing fingers, fused fingers, mutated hands, poorly drawn hands, poorly drawn face, watermark, signature, text overlay, username, artist name, logo, amateur, inconsistent style, multiple conflicting art styles, distorted faces, asymmetrical eyes, misaligned eyes, crooked mouth, incorrect proportions, flat lighting, washed out colors, oversaturated, jpeg artifacts, compression artifacts, pixelated, grainy, noise, duplicate characters, cloned elements, floating limbs, disconnected body parts, unnatural pose, stiff pose, broken anatomy, malformed features"
    }
  ]
}

CRITICAL REQUIREMENTS FOR "description" FIELD:
- MUST be SHORT: Maximum 15 words, 1-2 sentences only
- This is CAPTION TEXT shown to viewers - must be extremely concise
- Good examples: 
  * "Lila discovers her magical baking powers."
  * "Finn accidentally unleashes chaos in the lab."
  * "The friends face off in an epic cooking battle."
- BAD examples (TOO LONG - DO NOT DO THIS):
  * "In a sunlit kitchen filled with the aroma of fresh cookies, Lila nervously..."
  * "As the morning sun streams through the windows, our protagonist..."
- "image_prompt" field: HIGHLY DETAILED technical prompt with all visual specifications
- Keep these SEPARATE - description is SHORT caption, image_prompt is DETAILED technical

Be extremely detailed in image_prompts. Include specific colors, positions, emotions, and style elements.
${input.comicMode ? 'COMIC MODE: Include exact text placement and dialogue in every image_prompt.' : ''}

FINAL REMINDER: Each scene "description" MUST be under 15 words. This is a STRICT requirement - longer descriptions will be rejected.`;
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
      shoujo: 'sparkles and flowers in background, soft diffused lighting (6500K warm color temperature), pastel color palette with pink and lavender tones, large expressive eyes with detailed star-shaped highlights, delicate fine linework, romantic dreamy atmosphere, shallow depth of field with bokeh, gentle rim lighting from top-left',
      shounen: 'dynamic action pose with motion blur effects, bold thick lines, dramatic high-contrast lighting (4000K cool color temperature) from top-right with sharp crisp shadows, intense determined expressions, vibrant energy effects with outer glow, saturated primary colors, strong sense of motion and speed, eye-level to low-angle camera perspective for heroic feel',
      seinen: 'realistic anatomical proportions, highly detailed photorealistic backgrounds with texture, sophisticated muted color palette with earthy tones, mature contemplative atmosphere, subtle cel shading with soft gradient shadows, professional anime cinematography, medium depth of field, natural lighting (5500K neutral color temperature) from camera left',
      josei: 'elegant refined character designs, natural human proportions, refined color choices with complementary color harmonies, realistic nuanced emotional expressions, detailed high-fashion clothing and accessories with visible fabric textures (silk, cotton, leather), soft side lighting (6000K slightly warm), sophisticated balanced composition',
      kodomomuke: 'bright cheerful saturated colors with high vibrance, simple rounded character designs with minimal detail, wholesome warm atmosphere, clear highly readable expressions, friendly character interactions with positive body language, flat even lighting (7000K bright daylight), high-angle camera view looking down, playful symmetrical composition',
      isekai: 'fantasy magical elements with glowing particle effects, mystical atmospheric lighting with volumetric light rays, RPG-style magical details and glowing runes, adventurous dynamic composition with diagonal lines, fantasy architecture or enchanted nature setting, dramatic golden hour lighting (8500K warm sunset), epic cinematic low-angle perspective, 8K ultra-detailed rendering'
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
   - Camera angle/perspective: ${scene.mood.toLowerCase().includes('dramatic') || scene.mood.toLowerCase().includes('intense') || scene.mood.toLowerCase().includes('epic') ? 'low-angle (looking up) for dramatic/heroic feel' : scene.mood.toLowerCase().includes('cute') || scene.mood.toLowerCase().includes('wholesome') ? 'high-angle (looking down) for endearing feel' : 'eye-level for balanced natural perspective'}
   - Exact character positions and poses (foreground, midground, background)
   - Character expressions and emotions (specific facial details: eyebrow position, mouth shape, eye direction)
   - Body language and gestures (hand positions, posture, weight distribution)
   - Eye contact and character interactions (who's looking at whom, spatial relationships)
   - Rule of thirds composition with balanced visual weight, leading lines, depth of field

2. CHARACTER DETAILS (Exact Specifications):
   - Hair: exact color with hex code if available, style, length, flow/movement direction, texture (smooth, wavy, spiky), individual strands visible
   - Eyes: exact color with hex code, shape (almond, round, sharp), expression, star-shaped catchlights in pupils, reflections, eyelash detail
   - Clothing: exact colors with material type (cotton t-shirt, leather jacket, silk dress), fabric textures visible, wrinkles and folds realistically placed, accessories with metallic/glossy finish
   - Skin tone: specific shade (porcelain, tan, olive), smooth gradient shading, subtle blush on cheeks
   - Unique identifiers from character profiles (scars, tattoos, jewelry, props) with precise placement

3. BACKGROUND & SETTING (Environmental Details):
   - Specific location details: architecture style (modern, traditional, fantasy), materials (brick, wood, glass), nature elements (trees, mountains, water bodies)
   - Environmental elements: props with realistic textures, furniture with proper perspective, plants with detailed foliage
   - Atmospheric effects: weather conditions (sunny, cloudy, rainy with visible droplets), time of day (morning golden light, midday harsh shadows, sunset warm glow, night with moon/artificial lights)
   - Depth layers: detailed foreground elements (grass, stones), midground with main action, softly blurred background for depth
   - Environmental lighting consistency: shadows cast by environment match lighting direction

4. LIGHTING & COLOR (Be Specific):
   - Light source direction (e.g., top-right, camera left, overhead) and intensity (soft/harsh)
   - Shadow placement, hardness (sharp/soft), and color
   - Color temperature in Kelvin (3000K cool blue, 5500K neutral, 8500K warm golden)
   - Specific color palette matching style and mood (exact hues, saturation levels)
   - Highlights and reflections (metallic, glossy surfaces, eye catchlights)
   - Atmospheric lighting effects (volumetric rays, rim lighting, ambient occlusion)

5. ANIME ART STYLE:
   - ${styleEnhancement}
   - ${comicMode ? 'Comic book/manga panel style with text and speech bubbles' : 'Cel shading technique, clean linework'}
   - Anime proportions and anatomy
   - Specific anime art characteristics for ${style} style
   - Professional ${comicMode ? 'comic book/manga' : 'anime'} production quality

6. TECHNICAL QUALITY & RENDERING:
   - Ultra-high resolution: 8K quality, masterpiece-level detail
   - Professional ${comicMode ? 'comic book/manga panel' : 'anime screenshot'} aesthetic with production-grade finish
   - Detailed rendering with sharp focus on subjects, ${scene.mood.toLowerCase().includes('dramatic') || scene.mood.toLowerCase().includes('intense') ? 'focused depth of field with background blur' : 'balanced depth of field'}
   - Vibrant saturated colors with proper color balance and color grading
   - Crisp clean linework with anti-aliasing, smooth gradients
   - Photorealistic textures for materials (fabric, metal, wood, skin)
   ${comicMode ? '- Clear, readable bold text in speech bubbles and captions (minimum 24pt equivalent)' : '- Cel-shaded rendering with distinct highlights and shadows'}

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
