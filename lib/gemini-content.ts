
import { GoogleGenAI, Type } from "@google/genai";
import { HomeProfile, Plant } from "../types";
import geminiConfig from '@/functions/shared/gemini-config.json'

export class GeminiContentService {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateCareGuide(plant: Plant, homeProfile: HomeProfile): Promise<string[]> {
    const microEnv = `Light: ${plant.lightIntensity} ${plant.lightQuality}, Near Window: ${plant.nearWindow ? 'Yes' : 'No'}`;
    const response = await this.ai.models.generateContent({
      model: geminiConfig.models.contentPreview,
      contents: `Generate 4 concise care tips for a ${plant.species}. 
      Home Environment: ${JSON.stringify(homeProfile)}. 
      Specific Placement: ${microEnv}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["tips"]
        }
      },
    });

    try {
      const data = JSON.parse(response.text || '{"tips":[]}');
      return data.tips;
    } catch (e) {
      return ["Keep soil moist", "Ensure adequate light", "Avoid drafts", "Check regularly"];
    }
  }

  async generateRescuePlan(plant: Plant, homeProfile: HomeProfile): Promise<string[]> {
    const lastDate = plant.lastWateredAt ? new Date(plant.lastWateredAt) : null;
    const nextDate = lastDate ? new Date(lastDate) : null;
    if (nextDate && lastDate) {
      nextDate.setDate(lastDate.getDate() + plant.cadenceDays);
    }
    const isOverdue = nextDate ? nextDate.getTime() < Date.now() : false;
    
    const condition = isOverdue ? "Severely Dehydrated (Overdue Water)" : `Showing Physical Distress (Status: ${plant.status})`;
    const microEnv = `Light: ${plant.lightIntensity} ${plant.lightQuality}, Near Window: ${plant.nearWindow ? 'Yes' : 'No'}`;
    
    const response = await this.ai.models.generateContent({
      model: geminiConfig.models.contentPreview,
      contents: `This ${plant.species} needs a rescue plan. 
      CURRENT CONDITION: ${condition}.
      LAST WATERED: ${plant.lastWateredAt} (Cadence: every ${plant.cadenceDays} days).
      HOME ENVIRONMENT: ${JSON.stringify(homeProfile)}. 
      PLACEMENT: ${microEnv}.
      
      CRITICAL INSTRUCTION: If the condition is DEHYDRATED, do NOT mention root rot; focus on gradual rehydration. 
      If the condition is PHYSICAL DISTRESS but NOT overdue, consider overwatering/root rot.
      Generate a 3-step 'Rescue Protocol' (concise strings).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["steps"]
        }
      },
    });

    try {
      const data = JSON.parse(response.text || '{"steps":[]}');
      return data.steps;
    } catch (e) {
      return ["Check soil moisture immediately", "Remove any dead or yellowing leaves", "Adjust light exposure"];
    }
  }
}
