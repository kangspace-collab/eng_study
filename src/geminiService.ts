import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ExampleSentence {
  english: string;
  korean: string;
}

export async function generateExample(word: string, meaning: string): Promise<ExampleSentence> {
  if (!process.env.GEMINI_API_KEY) {
    return {
      english: `I like this ${word}.`,
      korean: `나는 이 ${word}이(가) 좋아요.`
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a very simple English example sentence for an elementary school student using the word "${word}" (meaning: ${meaning}). Also provide its Korean translation.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            english: {
              type: Type.STRING,
              description: "Simple English example sentence.",
            },
            korean: {
              type: Type.STRING,
              description: "Korean translation of the sentence.",
            },
          },
          required: ["english", "korean"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    return {
      english: data.english || `This is a ${word}.`,
      korean: data.korean || `이것은 ${meaning}입니다.`
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      english: `I see the ${word}.`,
      korean: `나는 ${meaning}을(를) 봅니다.`
    };
  }
}
