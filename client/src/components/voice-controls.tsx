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
      description: error,
    });
    setIsRecording(false);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      speechRecognition.stop();
      setIsRecording(false);
      toast({
        title: "Recording Stopped",
        description: "Voice recording has been stopped",
      });
    } else {
      try {
        await speechRecognition.start(onTranscript, handleError);
        setIsRecording(true);
        toast({
          title: "Recording Started",
          description: "Start speaking to create slides. Make sure you're in a quiet environment and using a supported browser (Chrome/Edge).",
          duration: 5000,
        });
      } catch (error) {
        handleError("Speech recognition not supported in this browser. Please try using Chrome or Edge.");
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