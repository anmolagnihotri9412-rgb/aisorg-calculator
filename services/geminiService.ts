
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async parseVoiceCommand(command: string): Promise<string | null> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: command,
        config: {
          systemInstruction: `You are a mathematical command parser. Your job is to convert natural language queries (English or Hindi mixed) into valid mathematical expressions that can be evaluated using standard JavaScript math functions or simple syntax.
          
          Rules:
          1. Convert percentages: "25 percent of 400" -> "0.25 * 400"
          2. Convert trig: "sin 30" -> "sin(30 * PI / 180)" (assume degrees if not specified)
          3. Convert powers: "5 power 3" -> "5 ** 3" or "Math.pow(5, 3)"
          4. Convert roots: "square root of 144" -> "sqrt(144)"
          5. Convert logs: "log 10" -> "log10(10)", "natural log" -> "ln"
          6. Handle Hindi: "das plus bees" -> "10 + 20"
          
          Only return the raw mathematical expression string. No text, no explanation. If you cannot parse it, return 'ERROR'.`,
          responseMimeType: "text/plain",
        },
      });

      const text = response.text?.trim();
      return text === 'ERROR' ? null : text;
    } catch (error) {
      console.error("Gemini Parsing Error:", error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
