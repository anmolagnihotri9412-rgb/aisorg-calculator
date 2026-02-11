
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
      this.recognition.lang = 'en-US'; // Can be 'hi-IN' for Hindi, but 'en-US' usually handles basic Hinglish well
    }
  }

  startListening(onResult: (text: string) => void, onError: (err: any) => void): void {
    if (!this.recognition) {
      onError("Speech recognition not supported in this browser.");
      return;
    }

    this.recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onResult(text);
    };

    this.recognition.onerror = (event: any) => {
      onError(event.error);
    };

    this.recognition.start();
  }

  stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
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
