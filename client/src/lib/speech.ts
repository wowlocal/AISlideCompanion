type SpeechCallback = (transcript: string) => void;
type ErrorCallback = (error: string) => void;

export class SpeechRecognition {
  private recognition: any;
  private isListening: boolean = false;
  private onTranscriptCallback: SpeechCallback | null = null;
  private onErrorCallback: ErrorCallback | null = null;

  constructor() {
    if (!this.isBrowserSupported()) {
      throw new Error("Speech recognition is not supported in this browser");
    }

    const SpeechRecognition = window.webkitSpeechRecognition || (window as any).SpeechRecognition;
    this.recognition = new SpeechRecognition();

    // Configure recognition
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript;

      if (lastResult.isFinal && this.onTranscriptCallback) {
        this.onTranscriptCallback(transcript);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (this.onErrorCallback) {
        this.onErrorCallback(event.error);
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        // Restart if we're still supposed to be listening
        this.recognition.start();
      }
    };
  }

  private isBrowserSupported(): boolean {
    return !!(window.webkitSpeechRecognition || (window as any).SpeechRecognition);
  }

  start(onTranscript: SpeechCallback, onError?: ErrorCallback) {
    if (this.isListening) return;

    this.onTranscriptCallback = onTranscript;
    this.onErrorCallback = onError;
    this.isListening = true;

    try {
      this.recognition.start();
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      if (onError) {
        onError("Failed to start speech recognition");
      }
    }
  }

  stop() {
    if (!this.isListening) return;

    this.isListening = false;
    try {
      this.recognition.stop();
    } catch (error) {
      console.error("Failed to stop speech recognition:", error);
    }
    this.onTranscriptCallback = null;
    this.onErrorCallback = null;
  }

  isRecording() {
    return this.isListening;
  }
}

export const speechRecognition = new SpeechRecognition();