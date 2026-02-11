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
      // Using en-IN to better support mixed English/Hindi commands and regional accents
      this.recognition.lang = 'en-IN'; 
    }
  }

  startListening(onResult: (text: string) => void, onError: (err: any) => void, onEnd?: () => void): void {
    if (!this.recognition) {
      onError("Speech recognition not supported in this browser.");
      return;
    }

    this.recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      console.log("[SpeechService] Final Result:", text);
      onResult(text);
    };

    this.recognition.onerror = (event: any) => {
      console.error("[SpeechService] Recognition error:", event.error);
      onError(event.error);
    };

    this.recognition.onend = () => {
      if (onEnd) onEnd();
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.error("[SpeechService] Start failure:", e);
      if (onEnd) onEnd();
    }
  }

  stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
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