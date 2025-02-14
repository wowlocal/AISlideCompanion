import type { Slide } from "@shared/schema";

// Simple content similarity check
function findSimilarSlide(transcript: string, existingSlides: Slide[]): Slide | null {
  const words = transcript.toLowerCase().split(' ');

  // Find the slide with the most word matches
  let bestMatch: Slide | null = null;
  let maxMatches = 0;

  for (const slide of existingSlides) {
    const slideWords = slide.content.toLowerCase().split(' ');
    let matches = 0;

    for (const word of words) {
      if (slideWords.includes(word)) {
        matches++;
      }
    }

    // If we have a significant match (more than 30% of words match)
    if (matches > words.length * 0.3 && matches > maxMatches) {
      maxMatches = matches;
      bestMatch = slide;
    }
  }

  return bestMatch;
}

export function generateSlide(transcript: string, existingSlides: Slide[] = []): Slide {
  // Try to find a similar existing slide
  const similarSlide = findSimilarSlide(transcript, existingSlides);
  if (similarSlide) {
    // Return a copy of the similar slide, potentially with updated content
    return {
      ...similarSlide,
      content: transcript, // Or keep the original content if preferred
      notes: `Based on existing slide: ${similarSlide.content}`
    };
  }

  // If no similar slide found, generate a new one
  const words = transcript.split(" ");

  if (words.length <= 5) {
    return {
      type: "title",
      content: transcript,
    };
  }

  return {
    type: "content",
    content: transcript,
  };
}

export function formatSlideContent(slide: Slide): string {
  switch (slide.type) {
    case "title":
      return `<h1 class="text-4xl font-bold">${slide.content}</h1>`;
    case "content":
      return `<div class="text-xl">${slide.content}</div>`;
    case "image":
      return `<img src="${slide.content}" alt="Slide image" class="max-h-[60vh] object-contain" />`;
    default:
      return slide.content;
  }
}