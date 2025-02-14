import { Card } from "@/components/ui/card";
import type { Slide } from "@shared/schema";
import { formatSlideContent } from "@/lib/slides";

interface SlidePreviewProps {
  slide: Slide;
  isActive?: boolean;
}

export function SlidePreview({ slide, isActive = false }: SlidePreviewProps) {
  return (
    <Card className={`p-6 aspect-video flex items-center justify-center ${
      isActive ? 'ring-2 ring-primary' : ''
    }`}>
      <div 
        className="w-full text-center"
        dangerouslySetInnerHTML={{ __html: formatSlideContent(slide) }}
      />
    </Card>
  );
}
