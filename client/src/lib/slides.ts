import type { Slide } from "@shared/schema";

export function generateSlide(transcript: string): Slide {
  // Simple heuristic to determine slide type
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
