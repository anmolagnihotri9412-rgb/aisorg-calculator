
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  async parseVoiceCommand(command: string): Promise<string | null> {
    try {
      /**
       * CRITICAL: The API key MUST be obtained from process.env.API_KEY.
       * If you have set VITE_GEMINI_API_KEY in your environment, please rename it to API_KEY.
       */
      const apiKey = process.env.API_KEY;
      
      if (!apiKey) {
        console.error("Gemini API Key is missing from process.env.API_KEY. Please check your environment variables.");
        // Return null so the UI can show the "I couldn't understand" message or handle the error
        return null;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: `Convert this voice command to a mathematical expression: "${command}"` }] }],
        config: {
          systemInstruction: `You are a mathematical command parser. Your task is to extract a pure mathematical expression from a natural language string (can be English, Hindi, or mixed Hinglish).
          
          EXAMPLES:
          - "2 plus 3" -> "2 + 3"
          - "10 divided by 5" -> "10 / 5"
          - "sin 30 degree" -> "sin(30 * PI / 180)"
          - "log 10" -> "log(10)"
          - "square root of 144" -> "sqrt(144)"
          - "5 power 3" -> "5 ** 3"
          - "25 percent of 400" -> "0.25 * 400"
          - "das aur bees ka jod" -> "10 + 20"
          - "pachis ka vargmool" -> "sqrt(25)"
          
          RULES:
          1. Use standard JS operators: +, -, *, /, **.
          2. Use these functions only: sin, cos, tan, sqrt, log (base 10), ln, fact.
          3. Use these constants: PI, E.
          4. Degrees MUST be converted to radians using "* PI / 180" inside the function.
          5. Percentages like "X percent of Y" must be " (X/100) * Y ".
          6. Output ONLY the expression string. No words, no punctuation.
          7. If it's not a math command, return exactly: ERROR`,
          responseMimeType: "text/plain",
        },
      });

      const text = response.text?.trim();
      if (!text || text === 'ERROR') {
        console.warn("AI could not parse command:", command, "Response:", text);
        return null;
      }
      
      return text;
    } catch (error) {
      console.error("Gemini Parsing Error:", error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
