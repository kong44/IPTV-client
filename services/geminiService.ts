
import { GoogleGenAI, Type } from "@google/genai";
import { Channel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getChannelRecommendation = async (userFavorites: Channel[], allChannels: Channel[]) => {
  if (userFavorites.length === 0) return null;

  const favoriteNames = userFavorites.map(c => c.name).join(', ');
  const availableGroups = Array.from(new Set(allChannels.map(c => c.group))).join(', ');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User likes these channels: ${favoriteNames}. 
      Available categories: ${availableGroups}. 
      Based on their taste, suggest which category they should explore next and explain why in 2 sentences. 
      Return in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedCategory: { type: Type.STRING },
            reason: { type: Type.STRING }
          },
          required: ["suggestedCategory", "reason"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini recommendation error:", error);
    return null;
  }
};
