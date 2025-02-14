import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Presentation } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Presentation as PresentationType } from "@shared/schema";

export default function Home() {
  const { data: presentations, isLoading } = useQuery<PresentationType[]>({
    queryKey: ["/api/presentations"],
  });

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Voice Presentations</h1>
          <Link href="/presentation">
            <Button size="lg">
              <Presentation className="mr-2 h-5 w-5" />
              New Presentation
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div>Loading presentations...</div>
        ) : (
          <div className="grid gap-4">
            {presentations?.map((presentation) => (
              <Link key={presentation.id} href={`/presentation/${presentation.id}`}>
                <Card className="cursor-pointer hover:bg-accent/5">
                  <CardHeader>
                    <CardTitle>{presentation.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {presentation.slides.length} slides
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
