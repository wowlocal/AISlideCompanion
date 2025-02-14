type SpeechCallback = (transcript: string) => void;
type ErrorCallback = (error: string) => void;

export class SpeechRecognition {
  private recognition: any;
  private isListening: boolean = false;
  private onTranscriptCallback: SpeechCallback | null = null;
  private onErrorCallback: ErrorCallback | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 3;

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

    this.recognition.onerror = async (event: any) => {
      console.error("Speech recognition error:", event.error);

      if (event.error === 'network' && this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Retrying... Attempt ${this.retryCount} of ${this.maxRetries}`);

        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (e) {
            // Ignore errors during retry
          }
        }
        return;
      }

      if (this.onErrorCallback) {
        let errorMessage = event.error;
        if (event.error === 'network') {
          errorMessage = 'Network connection issue. Please check your internet connection.';
        } else if (event.error === 'not-allowed') {
          errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
        }
        this.onErrorCallback(errorMessage);
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        // Reset retry count on successful completion
        this.retryCount = 0;
        // Restart if we're still supposed to be listening
        try {
          this.recognition.start();
        } catch (e) {
          // Ignore errors during restart
        }
      }
    };
  }

  private isBrowserSupported(): boolean {
    return !!(window.webkitSpeechRecognition || (window as any).SpeechRecognition);
  }

  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      return false;
    }
  }

  async start(onTranscript: SpeechCallback, onError?: ErrorCallback) {
    if (this.isListening) return;

    // Check microphone permission first
    const hasPermission = await this.requestMicrophonePermission();
    if (!hasPermission) {
      if (onError) {
        onError("Microphone permission denied. Please allow microphone access and try again.");
      }
      return;
    }

    this.onTranscriptCallback = onTranscript;
    this.onErrorCallback = onError;
    this.isListening = true;
    this.retryCount = 0;

    try {
      this.recognition.start();
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      if (onError) {
        onError("Failed to start speech recognition. Please refresh the page and try again.");
      }
      this.isListening = false;
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
    this.retryCount = 0;
  }

  isRecording() {
    return this.isListening;
  }
}

export const speechRecognition = new SpeechRecognition();