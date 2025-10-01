import { NextRequest, NextResponse } from 'next/server';
import { createOpenRouterClient } from '@/lib/openrouter';
import { MODELS } from '@/lib/config/models';
import { PROMPTS } from '@/lib/config/prompts';
import { getApiKey, requireApiKey } from '@/lib/apiKeyManager';

interface IdeaRequest {
  genre?: string;
  tone?: string;
  complexity?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get and validate API key
    const apiKey = getApiKey(request);
    try {
      requireApiKey(apiKey);
    } catch (error) {
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : 'API key required',
          code: 'API_KEY_REQUIRED' 
        },
        { status: 401 }
      );
    }

    const body: IdeaRequest = await request.json().catch(() => ({}));
    const { 
      genre = 'fantasy', 
      tone = 'balanced', 
      complexity = 'standard' 
    } = body;

    const prompt = PROMPTS.storyIdea({ genre, tone, complexity });
    const client = createOpenRouterClient(apiKey);
    const response = await client.generateText(MODELS.story.model, prompt);

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
