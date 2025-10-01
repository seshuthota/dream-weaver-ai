import { NextRequest, NextResponse } from 'next/server';
import { openrouter } from '@/lib/openrouter';

const MODEL = 'x-ai/grok-4-fast:free';

export async function POST(request: NextRequest) {
  try {
    const prompt = `Generate a creative and engaging anime story idea. Be imaginative and diverse in your suggestions.

Requirements:
1. Story outline: 2-3 sentences with an engaging hook and interesting premise
2. Characters: 2-3 unique characters with distinct personalities and traits
3. Style: Choose the most fitting anime style for this story
4. Scene count: Recommend optimal number of scenes (3-8) based on story complexity

Available styles: shoujo, shounen, seinen, slice-of-life, fantasy, sci-fi

Output MUST be valid JSON in this exact format:
{
  "outline": "A compelling 2-3 sentence story premise",
  "characters": [
    {
      "name": "Character Name",
      "traits": "personality, appearance, special abilities or characteristics"
    }
  ],
  "style": "one of the available styles",
  "scenes": number between 3-8
}

Be creative! Mix genres, create unique character dynamics, and suggest stories that would make great anime.`;

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
