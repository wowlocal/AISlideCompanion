import { VoiceControls } from "@/components/voice-controls";
import { SlidePreview } from "@/components/slide-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateSlide } from "@/lib/slides";
import { getContentSuggestions, enhanceSlideContent, generateNextSlideIdeas } from "@/lib/ai-service";
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Wand2 } from "lucide-react";
import type { Slide, Presentation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Presentation() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const [title, setTitle] = useState("Untitled Presentation");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const { toast } = useToast();

  // Fetch existing presentation if we have an ID
  const { data: existingPresentation } = useQuery<Presentation>({
    queryKey: params.id ? [`/api/presentations/${params.id}`] : null,
  });

  // Update state when we load an existing presentation
  useEffect(() => {
    if (existingPresentation) {
      setTitle(existingPresentation.title);
      setSlides(existingPresentation.slides);
    }
  }, [existingPresentation]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        params.id ? "PATCH" : "POST",
        params.id ? `/api/presentations/${params.id}` : "/api/presentations",
        {
          title,
          slides,
        }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/presentations"] });
      setLocation("/");
    },
  });

  const handleTranscript = async (transcript: string) => {
    try {
      // Generate initial slide
      const newSlide = generateSlide(transcript, slides);

      // Add the slide first for immediate feedback
      setSlides((prev) => [...prev, newSlide]);
      setCurrentSlide(slides.length);

      // Get AI suggestions for the new slide
      const suggestions = await getContentSuggestions(slides, newSlide);

      // Show the first suggestion as a toast
      if (suggestions.length > 0) {
        toast({
          title: "AI Suggestion",
          description: suggestions[0].suggestion,
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEnhanceSlide(slides.length - 1)}
            >
              Apply
            </Button>
          ),
        });
      }

      // Generate ideas for next slides
      const nextSlideIdeas = await generateNextSlideIdeas(slides, transcript);
      if (nextSlideIdeas.length > 0) {
        toast({
          title: "Next Slide Ideas",
          description: nextSlideIdeas[0],
        });
      }
    } catch (error) {
      console.error("Error processing transcript:", error);
    }
  };

  const handleEnhanceSlide = async (index: number) => {
    try {
      setIsEnhancing(true);
      const enhancedSlide = await enhanceSlideContent(slides[index]);
      setSlides((prev) => {
        const updated = [...prev];
        updated[index] = enhancedSlide;
        return updated;
      });
      toast({
        title: "Slide Enhanced",
        description: "AI has improved your slide content",
      });
    } catch (error) {
      console.error("Error enhancing slide:", error);
      toast({
        variant: "destructive",
        title: "Enhancement Failed",
        description: "Could not enhance slide content",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-2xl font-bold bg-transparent border-none w-auto"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleEnhanceSlide(currentSlide)}
              disabled={isEnhancing || slides.length === 0}
            >
              <Wand2 className="mr-2 h-5 w-5" />
              Enhance Current Slide
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              Save Presentation
            </Button>
          </div>
        </div>

        <div className="grid gap-8">
          {slides.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Start speaking to create your first slide
            </div>
          ) : (
            <div className="grid gap-4">
              {slides.map((slide, index) => (
                <div key={index} className="relative">
                  <SlidePreview
                    slide={slide}
                    isActive={index === currentSlide}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <VoiceControls onTranscript={handleTranscript} />
      </div>
    </div>
  );
}