import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { speechRecognition } from "@/lib/speech";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Square } from "lucide-react";

interface VoiceControlsProps {
  onTranscript: (transcript: string) => void;
}

export function VoiceControls({ onTranscript }: VoiceControlsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  const handleError = (error: string) => {
    toast({
      variant: "destructive",
      title: "Speech Recognition Error",
      description: error,
    });
    setIsRecording(false);
  };

  const setupAudioAnalysis = (stream: MediaStream) => {
    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const analyserNode = context.createAnalyser();
    analyserNode.fftSize = 256;
    source.connect(analyserNode);

    setAudioContext(context);
    setAnalyser(analyserNode);

    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    const logLevels = () => {
      if (analyserNode && isRecording) {
        analyserNode.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        console.log(`Audio level: ${Math.round(average)}dB`);
        requestAnimationFrame(logLevels);
      }
    };
    logLevels();
  };

  const cleanupAudioAnalysis = () => {
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }
    setAnalyser(null);
  };

  const startRecording = async () => {
    console.log('Attempting to start recording...');
    console.log('Navigator:', navigator);
    console.log('MediaDevices:', navigator.mediaDevices);

    // Check for basic Web Speech API support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      const msg = 'Speech recognition is not supported in this browser. Please use Chrome or Edge.';
      console.error(msg);
      handleError(msg);
      return;
    }

    // Ensure mediaDevices is properly initialized
    if (navigator.mediaDevices === undefined) {
      const getUserMedia = navigator.getUserMedia ||
        (navigator as any).webkitGetUserMedia ||
        (navigator as any).mozGetUserMedia;

      if (!getUserMedia) {
        const msg = 'Your browser does not support microphone access.';
        console.error(msg);
        handleError(msg);
        return;
      }

      navigator.mediaDevices = {
        getUserMedia: function(constraints) {
          return new Promise((resolve, reject) => {
            getUserMedia.call(navigator, constraints, resolve, reject);
          });
        }
      } as any;
    }

    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      console.log('Microphone access granted:', stream);
      setupAudioAnalysis(stream);

      console.log('Starting speech recognition...');
      await speechRecognition.start(onTranscript, handleError);
      setIsRecording(true);
      toast({
        title: "Recording Started",
        description: "Start speaking to create slides. Make sure you're in a quiet environment.",
        duration: 5000,
      });
    } catch (error: any) {
      console.error('Error starting recording:', error);
      const errorMessage = error.name === 'NotAllowedError'
        ? 'Microphone access was denied. Please allow microphone access and try again.'
        : error.message || 'Failed to start recording';
      handleError(errorMessage);
      cleanupAudioAnalysis();
    }
  };

  const stopRecording = () => {
    console.log('Attempting to stop recording...');
    if (isRecording) {
      speechRecognition.stop();
      setIsRecording(false);
      cleanupAudioAnalysis();
      toast({
        title: "Recording Stopped",
        description: "Voice recording has been stopped",
      });
    }
  };

  return (
    <div className="fixed bottom-4 right-4 flex gap-2">
      <Button
        size="lg"
        variant={isRecording ? "destructive" : "default"}
        onClick={isRecording ? stopRecording : startRecording}
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