import { Slide } from "@shared/schema";

type SuggestionType = 'enhance' | 'structure' | 'content';

interface ContentSuggestion {
  type: SuggestionType;
  original: string;
  suggestion: string;
  explanation: string;
}

export async function getContentSuggestions(
  slides: Slide[],
  currentSlide: Slide,
): Promise<ContentSuggestion[]> {
  try {
    const response = await fetch('/api/ai/suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slides,
        currentSlide,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get AI suggestions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting AI suggestions:', error);
    throw error;
  }
}

export async function enhanceSlideContent(slide: Slide): Promise<Slide> {
  try {
    const response = await fetch('/api/ai/enhance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slide }),
    });

    if (!response.ok) {
      throw new Error('Failed to enhance slide content');
    }

    return await response.json();
  } catch (error) {
    console.error('Error enhancing slide content:', error);
    throw error;
  }
}

export async function generateNextSlideIdeas(
  slides: Slide[],
  transcript: string
): Promise<string[]> {
  try {
    const response = await fetch('/api/ai/next-slides', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slides,
        transcript,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate next slide ideas');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating next slide ideas:', error);
    throw error;
  }
}
