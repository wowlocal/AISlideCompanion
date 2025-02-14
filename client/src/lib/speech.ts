type SpeechCallback = (transcript: string) => void;

export class SpeechRecognition {
  private recognition: any;
  private isListening: boolean = false;
  private onTranscriptCallback: SpeechCallback | null = null;

  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join("");

      if (this.onTranscriptCallback) {
        this.onTranscriptCallback(transcript);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
    };
  }

  start(callback: SpeechCallback) {
    if (this.isListening) return;
    
    this.onTranscriptCallback = callback;
    this.isListening = true;
    this.recognition.start();
  }

  stop() {
    if (!this.isListening) return;
    
    this.isListening = false;
    this.recognition.stop();
    this.onTranscriptCallback = null;
  }

  isRecording() {
    return this.isListening;
  }
}

export const speechRecognition = new SpeechRecognition();
