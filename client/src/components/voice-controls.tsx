import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { speechRecognition } from "@/lib/speech";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface VoiceControlsProps {
  onTranscript: (transcript: string) => void;
}

export function VoiceControls({ onTranscript }: VoiceControlsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();

  const handleError = (error: string) => {
    toast({
      variant: "destructive",
      title: "Speech Recognition Error",
      description: `Failed to record speech: ${error}. Please try again.`,
    });
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      speechRecognition.stop();
      setIsRecording(false);
    } else {
      try {
        speechRecognition.start(onTranscript, handleError);
        setIsRecording(true);
        toast({
          title: "Recording Started",
          description: "Start speaking to create slides",
        });
      } catch (error) {
        handleError("Speech recognition not supported in this browser");
      }
    }
  };

  return (
    <div className="fixed bottom-4 right-4 flex gap-2">
      <Button
        size="lg"
        variant={isRecording ? "destructive" : "default"}
        onClick={toggleRecording}
      >
        {isRecording ? (
          <>
            <MicOff className="mr-2 h-5 w-5" />
            Stop Recording
          </>
        ) : (
          <>
            <Mic className="mr-2 h-5 w-5" />
            Start Recording
          </>
        )}
      </Button>
    </div>
  );
}