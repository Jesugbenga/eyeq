
import { GoogleGenAI } from "@google/genai";
import { EventType, DetailLevel } from "../types";

const getSystemInstruction = (eventType: EventType): string => {
  switch (eventType) {
    case EventType.WEBINAR:
      return "You are an audio describer for a webinar or presentation. Your role is to describe visual information like slides, charts, and speaker demonstrations. Focus on graph trends, key text on slides, visual examples shown, and significant speaker gestures. Your descriptions must be concise and objective.";
    case EventType.SPORTS:
      return "You are an audio describer for a live sports game. Focus on critical visual information like player positions, ball or puck location, score changes, significant plays, and strong crowd reactions. Be energetic, concise, and clear.";
    case EventType.CONFERENCE:
      return "You are an audio describer for a conference talk. Describe the speaker's body language, audience reactions, and any visual aids being used on stage. Keep descriptions brief to avoid overlapping with the speaker's audio.";
    case EventType.EMERGENCY:
      return "You are providing critical visual information during an emergency broadcast. Your language must be extremely clear, concise, and direct. Focus on describing locations of exits, warning lights, locations of people, obstacles, and providing directional information. Prioritize safety-critical information.";
    case EventType.GENERAL:
    default:
      return "You are an audio describer for a live event. Your task is to briefly describe important visual moments that are not explained by the speaker. Focus on actions, expressions, or environmental changes. Be objective and concise.";
  }
};

export const generateDescription = async (
  transcriptSegment: string,
  eventType: EventType,
  detailLevel: DetailLevel
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = getSystemInstruction(eventType);

  const prompt = `
    Analyze the following transcript from a live "${eventType}" event. The user requires a "${detailLevel}" level of detail.
    Your task is to identify if a visual description is necessary based on cues like pauses in speech, or phrases such as "as you can see here" or "if you look at this".
    If a visual description is warranted, generate one single, concise, objective sentence (max 20 words) describing the likely visual event.
    If no visual description is needed for this segment, you MUST respond with the word "NONE". Do not explain why, just respond "NONE".

    Transcript Segment: "${transcriptSegment}"
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
        maxOutputTokens: 50,
      }
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini API call failed:", error);
    return "I'm sorry, I encountered an error while analyzing the event.";
  }
};
