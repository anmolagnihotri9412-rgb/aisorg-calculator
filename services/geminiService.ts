
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  async parseVoiceCommand(command: string): Promise<string | null> {
    try {
      /**
       * SDK REQUIREMENT: The API key MUST be obtained from process.env.API_KEY.
       * If using VITE_GEMINI_API_KEY in your host (like Netlify), ensure it is 
       * mapped to 'API_KEY' in the environment settings.
       */
      const apiKey = process.env.API_KEY;
      
      console.log("[GeminiService] API Key check:", apiKey ? "Present" : "MISSING");
      
      if (!apiKey) {
        console.error("[GeminiService] Error: process.env.API_KEY is not defined. Voice processing will fail.");
        return null;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      console.log("[GeminiService] Sending command to AI:", command);

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: command }] }],
        config: {
          systemInstruction: `You are a mathematical assistant. If the user gives a voice command for a calculation, extract the numbers and operator, and return only the result or the specific math operation to be performed.
          
          Guidelines:
          - Support English, Hindi, and Hinglish (mixed).
          - Examples:
            * "2 plus 3" -> "2 + 3"
            * "das aur bees ka jod" -> "10 + 20"
            * "sin 30 degrees" -> "sin(30 * PI / 180)"
            * "pachees ka vargmool" -> "sqrt(25)"
            * "log 100" -> "log(100)"
            * "5 power 3" -> "5 ** 3"
            * "20 percent of 500" -> "0.20 * 500"
          
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
      console.log("[GeminiService] AI Response Text:", text);
      
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
