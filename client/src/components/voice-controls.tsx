import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { speechRecognition } from "@/lib/speech";
import { useState, useEffect } from "react";

interface VoiceControlsProps {
  onTranscript: (transcript: string) => void;
}

export function VoiceControls({ onTranscript }: VoiceControlsProps) {
  const [isRecording, setIsRecording] = useState(false);

  const toggleRecording = () => {
    if (isRecording) {
      speechRecognition.stop();
    } else {
      speechRecognition.start(onTranscript);
    }
    setIsRecording(!isRecording);
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
