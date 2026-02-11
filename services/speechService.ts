
export class SpeechService {
  private recognition: any;
  private synthesis: SpeechSynthesis;

  constructor() {
    this.synthesis = window.speechSynthesis;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US'; 
    }
  }

  startListening(onResult: (text: string) => void, onError: (err: any) => void, onEnd?: () => void): void {
    if (!this.recognition) {
      onError("Speech recognition not supported in this browser.");
      return;
    }

    this.recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      console.log("[SpeechService] Raw Browser Transcript:", text);
      onResult(text);
    };

    this.recognition.onerror = (event: any) => {
      console.error("[SpeechService] Error Event:", event.error);
      onError(event.error);
    };

    this.recognition.onend = () => {
      console.log("[SpeechService] Session Ended");
      if (onEnd) onEnd();
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.error("[SpeechService] Failed to start:", e);
      if (onEnd) onEnd();
    }
  }

  stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Recognition might already be stopped
      }
    }
  }

  speak(text: string): void {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    this.synthesis.speak(utterance);
  }
}

export const speechService = new SpeechService();
