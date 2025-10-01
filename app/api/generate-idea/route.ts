import { NextRequest, NextResponse } from 'next/server';
import { openrouter } from '@/lib/openrouter';

const MODEL = 'x-ai/grok-4-fast:free';

interface IdeaRequest {
  genre?: string;
  tone?: string;
  complexity?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: IdeaRequest = await request.json().catch(() => ({}));
    const { 
      genre = 'fantasy', 
      tone = 'balanced', 
      complexity = 'standard' 
    } = body;

    // Map complexity to character and scene counts
    const complexityMap = {
      simple: { chars: '2-3', scenes: '3-4' },
      standard: { chars: '3-4', scenes: '5-6' },
      epic: { chars: '4-5', scenes: '7-8' }
    };
    const { chars, scenes } = complexityMap[complexity as keyof typeof complexityMap] || complexityMap.standard;

    // Tone descriptions
    const toneDescriptions = {
      light: 'lighthearted, fun, upbeat with positive vibes and happy moments',
      balanced: 'balanced mix of light and serious moments, emotionally varied',
      dark: 'dark, serious, intense with dramatic stakes and mature themes'
    };
    const toneDesc = toneDescriptions[tone as keyof typeof toneDescriptions] || toneDescriptions.balanced;

    const prompt = `Generate a creative and engaging anime story idea in the ${genre} genre with a ${toneDesc} tone.

Be imaginative and diverse in your suggestions.

Requirements:
1. Story outline: 2-3 sentences with an engaging hook and interesting premise that fits the ${genre} genre and ${tone} tone
2. Characters: ${chars} unique characters with distinct personalities and traits that suit the ${tone} atmosphere
3. Style: Choose the most fitting anime style for this ${genre} story (consider shoujo, shounen, seinen, slice-of-life, fantasy, sci-fi)
4. Scene count: ${scenes} scenes based on ${complexity} complexity

Available styles: shoujo, shounen, seinen, slice-of-life, fantasy, sci-fi

Output MUST be valid JSON in this exact format:
{
  "outline": "A compelling 2-3 sentence story premise that matches the ${genre} genre and ${tone} tone",
  "characters": [
    {
      "name": "Character Name",
      "traits": "personality, appearance, special abilities or characteristics fitting the ${tone} tone"
    }
  ],
  "style": "one of the available styles that best fits ${genre}",
  "scenes": number between ${scenes.split('-')[0]} and ${scenes.split('-')[1]}
}

GENRE FOCUS: ${genre}
TONE: ${tone} (${toneDesc})
COMPLEXITY: ${complexity} (${chars} characters, ${scenes} scenes)

Be creative! Create unique character dynamics and suggest a story that would make a great ${genre} anime with a ${tone} tone.`;

    const response = await openrouter.generateText(MODEL, prompt);

    // Parse JSON from response
    let text = response;
    if (text.includes('```json')) {
      text = text.split('```json')[1].split('```')[0];
    } else if (text.includes('```')) {
      text = text.split('```')[1].split('```')[0];
    }

    const idea = JSON.parse(text.trim());

    // Validate structure
    if (!idea.outline || !idea.characters || !idea.style || !idea.scenes) {
      throw new Error('Invalid response structure');
    }

    return NextResponse.json(idea);
  } catch (error) {
    console.error('Story generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate story idea',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
