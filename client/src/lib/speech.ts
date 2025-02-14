import type { Slide } from "@shared/schema";

type SpeechCallback = (transcript: string) => void;
type ErrorCallback = (error: string) => void;

export class SpeechRecognition {
  private recognition: any;
  private isListening: boolean = false;
  private onTranscriptCallback: SpeechCallback | null = null;
  private onErrorCallback: ErrorCallback | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private interimTranscript: string = '';
  private finalTranscript: string = '';
  private lastProcessedIndex: number = 0;
  private restartTimeout: NodeJS.Timeout | null = null;

  constructor() {
    if (!this.isBrowserSupported()) {
      throw new Error("Speech recognition is not supported in this browser");
    }

    const SpeechRecognition = window.webkitSpeechRecognition || (window as any).SpeechRecognition;
    this.recognition = new SpeechRecognition();

    // Configure recognition
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      console.log('Speech recognition service has started');
    };

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      // Process only new results
      for (let i = this.lastProcessedIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
          this.lastProcessedIndex = i + 1;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // Update transcripts
      if (finalTranscript && this.onTranscriptCallback) {
        this.onTranscriptCallback(finalTranscript.trim());

        // Clear any existing timeout
        if (this.restartTimeout) {
          clearTimeout(this.restartTimeout);
        }

        // Set a longer timeout for restart (3 seconds of silence)
        this.restartTimeout = setTimeout(() => {
          if (this.isListening) {
            try {
              this.recognition.stop();
              setTimeout(() => {
                if (this.isListening) {
                  this.recognition.start();
                }
              }, 500);
            } catch (e) {
              console.error('Error during recognition restart:', e);
            }
          }
        }, 3000);
      }
    };

    this.recognition.onerror = async (event: any) => {
      console.error("Speech recognition error:", event.error);

      if (event.error === 'network' && this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Retrying... Attempt ${this.retryCount} of ${this.maxRetries}`);

        // Wait longer between retries
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (e) {
            console.error('Error during retry:', e);
          }
        }
        return;
      }

      if (this.onErrorCallback) {
        let errorMessage = event.error;
        if (event.error === 'network') {
          errorMessage = 'Network connection issue. Please check your internet connection and ensure you are using a supported browser like Chrome or Edge.';
        } else if (event.error === 'not-allowed') {
          errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings and try again.';
        } else if (event.error === 'no-speech') {
          errorMessage = 'No speech was detected. Please try speaking again.';
        } else if (event.error === 'audio-capture') {
          errorMessage = 'No microphone was found. Please ensure your microphone is properly connected.';
        }
        this.onErrorCallback(errorMessage);
      }
    };

    this.recognition.onend = () => {
      // Only auto-restart if we're still supposed to be listening and don't have a pending restart
      if (this.isListening && !this.restartTimeout) {
        this.retryCount = 0;
        try {
          this.recognition.start();
        } catch (e) {
          console.error('Error during recognition restart:', e);
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
        onError("Microphone access denied. Please allow microphone access in your browser settings and try again.");
      }
      return;
    }

    this.onTranscriptCallback = onTranscript;
    this.onErrorCallback = onError;
    this.isListening = true;
    this.retryCount = 0;
    this.lastProcessedIndex = 0;
    this.interimTranscript = '';
    this.finalTranscript = '';

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
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    try {
      this.recognition.stop();
    } catch (error) {
      console.error("Failed to stop speech recognition:", error);
    }

    this.onTranscriptCallback = null;
    this.onErrorCallback = null;
    this.retryCount = 0;
    this.lastProcessedIndex = 0;
    this.interimTranscript = '';
    this.finalTranscript = '';
  }

  isRecording() {
    return this.isListening;
  }
}

export const speechRecognition = new SpeechRecognition();