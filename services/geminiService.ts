
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  async parseVoiceCommand(command: string): Promise<string | null> {
    try {
      /**
       * The API key must be obtained exclusively from the environment variable process.env.API_KEY.
       * Do not use VITE_GEMINI_API_KEY or import.meta.env as the SDK is strictly configured 
       * to look for process.env.API_KEY in this execution context.
       */
      const apiKey = process.env.API_KEY;
      
      if (!apiKey) {
        console.error("Gemini API Key is missing. Please ensure your environment variable in Netlify is named exactly 'API_KEY' (not 'VITE_GEMINI_API_KEY').");
        return null;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: command }] }],
        config: {
          systemInstruction: `You are a mathematical command parser. Your job is to convert natural language queries (English or Hindi mixed) into valid mathematical expressions that can be evaluated using standard JavaScript math functions or simple syntax.
          
          Rules:
          1. Convert percentages: "25 percent of 400" -> "0.25 * 400"
          2. Convert trig: "sin 30" -> "sin(30 * Math.PI / 180)"
          3. Convert powers: "5 power 3" -> "5 ** 3"
          4. Convert roots: "square root of 144" -> "Math.sqrt(144)"
          5. Convert logs: "log 10" -> "Math.log10(10)", "natural log" -> "Math.log"
          6. Handle Hindi numbers/operators: "das plus bees" -> "10 + 20"
          
          Only return the raw mathematical expression string. No text, no explanation. If you cannot parse it, return 'ERROR'.`,
          responseMimeType: "text/plain",
        },
      });

      const text = response.text?.trim();
      if (!text || text === 'ERROR') return null;
      
      return text;
    } catch (error) {
      console.error("Gemini Parsing Error:", error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
