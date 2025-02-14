import { VoiceControls } from "@/components/voice-controls";
import { SlidePreview } from "@/components/slide-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateSlide } from "@/lib/slides";
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { Slide, Presentation } from "@shared/schema";

export default function Presentation() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const [title, setTitle] = useState("Untitled Presentation");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

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

  const handleTranscript = (transcript: string) => {
    // Pass all existing slides when generating a new slide
    const newSlide = generateSlide(transcript, slides);
    setSlides((prev) => [...prev, newSlide]);
    setCurrentSlide(slides.length);
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
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            Save Presentation
          </Button>
        </div>

        <div className="grid gap-8">
          {slides.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Start speaking to create your first slide
            </div>
          ) : (
            <div className="grid gap-4">
              {slides.map((slide, index) => (
                <SlidePreview
                  key={index}
                  slide={slide}
                  isActive={index === currentSlide}
                />
              ))}
            </div>
          )}
        </div>

        <VoiceControls onTranscript={handleTranscript} />
      </div>
    </div>
  );
}