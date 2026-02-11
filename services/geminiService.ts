import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  async parseVoiceCommand(command: string): Promise<string | null> {
    try {
      /**
       * The API key must be obtained exclusively from the environment variable process.env.API_KEY.
       * If deploying on Netlify, ensure the environment variable is named exactly 'API_KEY'.
       */
      const apiKey = process.env.API_KEY;
      
      console.log("[GeminiService] Verifying API Key status...");
      
      if (!apiKey) {
        const errorMsg = "API Key not found on Netlify. Please ensure your environment variable is named exactly 'API_KEY'.";
        console.error("[GeminiService] " + errorMsg);
        alert(errorMsg);
        return null;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      console.log("[GeminiService] Sending transcript to Gemini AI:", command);

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Process this calculation command: "${command}"` }] }],
        config: {
          systemInstruction: `You are a mathematical assistant. Your goal is to extract numbers and operators from calculations spoken in English or Hindi (Hinglish).
          
          Examples:
          - "2 plus 3" -> "2 + 3"
          - "sqrt of 16" -> "sqrt(16)"
          - "log 10" -> "log(10)"
          - "das aur bees" -> "10 + 20" (Hindi for 10 and 20)
          
          Rules for output:
          1. Return ONLY the numeric result or a valid JavaScript-compatible mathematical expression.
          2. Use standard operators: +, -, *, /, **.
          3. Use scientific functions: sqrt(), sin(), cos(), tan(), log(), ln(), fact().
          4. For trigonometry, convert degrees to radians internally: sin(x * PI / 180).
          5. Use constants: PI, E.
          6. NO conversational text, NO punctuation at the end, NO markdown.
          7. If the command is not mathematical, return exactly: ERROR`,
          responseMimeType: "text/plain",
        },
      });

      const text = response.text?.trim();
      console.log("[GeminiService] AI Response Received:", text);
      
      if (!text || text === 'ERROR') {
        return null;
      }
      
      return text;
    } catch (error: any) {
      console.error("[GeminiService] API Exception:", error.message || error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();