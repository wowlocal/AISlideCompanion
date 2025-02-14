import OpenAI from "openai";
import type { Slide } from "@shared/schema";
import express from "express";

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rate limiting map
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 20;

// Rate limiting middleware
function rateLimitMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  // Clean up old entries
  for (const [key, timestamp] of Array.from(rateLimitMap.entries())) {
    if (now - timestamp > RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(key);
    }
  }

  // Get request count for this IP
  const requestCount = rateLimitMap.get(ip) || 0;
  if (requestCount >= MAX_REQUESTS) {
    res.status(429).json({ message: 'Too many requests. Please try again later.' });
    return;
  }

  rateLimitMap.set(ip, requestCount + 1);
  next();
}

router.use(rateLimitMiddleware);

// Get content suggestions for slides
router.post('/suggestions', async (req, res) => {
  try {
    const { slides, currentSlide } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a presentation expert. Analyze the slides and provide suggestions for improvement."
        },
        {
          role: "user",
          content: `Current presentation context: ${JSON.stringify(slides)}
                   Current slide: ${JSON.stringify(currentSlide)}
                   Please provide suggestions for improving this slide.`
        }
      ]
    });

    const suggestions = completion.choices[0].message.content;

    // Parse and structure the suggestions
    const structuredSuggestions = suggestions?.split('\n').map(suggestion => ({
      type: 'enhance' as const,
      original: currentSlide.content,
      suggestion,
      explanation: 'AI-generated suggestion for improvement'
    }));

    res.json(structuredSuggestions);
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({ message: 'Failed to generate suggestions' });
  }
});

// Enhance slide content
router.post('/enhance', async (req, res) => {
  try {
    const { slide } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a presentation expert. Enhance the given slide content while maintaining its core message."
        },
        {
          role: "user",
          content: `Please enhance this slide content: ${slide.content}`
        }
      ]
    });

    const enhancedContent = completion.choices[0].message.content;

    res.json({
      ...slide,
      content: enhancedContent || slide.content
    });
  } catch (error) {
    console.error('Error enhancing content:', error);
    res.status(500).json({ message: 'Failed to enhance content' });
  }
});

// Generate next slide ideas
router.post('/next-slides', async (req, res) => {
  try {
    const { slides, transcript } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a presentation expert. Suggest ideas for the next slides based on the current context."
        },
        {
          role: "user",
          content: `Current presentation: ${JSON.stringify(slides)}
                   Recent transcript: ${transcript}
                   Please suggest ideas for the next slides.`
        }
      ]
    });

    const ideas = completion.choices[0].message.content?.split('\n') || [];

    res.json(ideas);
  } catch (error) {
    console.error('Error generating slide ideas:', error);
    res.status(500).json({ message: 'Failed to generate slide ideas' });
  }
});

export default router;