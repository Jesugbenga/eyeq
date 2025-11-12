
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
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const systemInstruction = getSystemInstruction(eventType);

  const prompt = `Analyze this transcript from a "${eventType}" event (${detailLevel} detail). If visual description is needed (e.g., "as you can see", pauses), respond with ONE concise sentence (max 20 words). Otherwise, respond "NONE" only.

Transcript: "${transcriptSegment}"`;
  
  try {
    // Try with contents as array format (common for Gemini API)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        temperature: 0.3,
        maxOutputTokens: 300, // Sufficient for short response or "NONE"
      }
    });

    // Extract text from the response
    const responseAny = response as any;
    let text: string | undefined;
    
    // Method 1: Try response.text() directly (most common for @google/genai)
    try {
      if (typeof responseAny.text === 'function') {
        text = await responseAny.text();
      } else if (typeof responseAny.text === 'string') {
        text = responseAny.text;
      }
    } catch (e) {
      console.log("response.text() access failed:", e);
    }
    
    // Method 2: Try response.response.text() (alternative structure)
    if (!text) {
      try {
        if (responseAny.response) {
          if (typeof responseAny.response.text === 'function') {
            text = await responseAny.response.text();
          } else if (typeof responseAny.response.text === 'string') {
            text = responseAny.response.text;
          }
        }
      } catch (e) {
        console.log("response.response.text() access failed:", e);
      }
    }
    
    // Method 3: Try accessing through candidates content parts
    if (!text && response.candidates && Array.isArray(response.candidates) && response.candidates.length > 0) {
      try {
        const candidate = response.candidates[0] as any;
        
        // Check finishReason first
        if (candidate?.finishReason === 'MAX_TOKENS' && (!candidate?.content?.parts || candidate.content.parts.length === 0)) {
          console.warn("Response was truncated due to MAX_TOKENS limit. Consider increasing maxOutputTokens.");
        }
        
        if (candidate?.content?.parts && Array.isArray(candidate.content.parts) && candidate.content.parts.length > 0) {
          const part = candidate.content.parts[0];
          if (part?.text && typeof part.text === 'string') {
            text = part.text;
          }
        }
      } catch (e) {
        console.log("candidates content parts access failed:", e);
      }
    }
    
    // Method 4: Try accessing candidate.content.text directly
    if (!text && response.candidates && Array.isArray(response.candidates) && response.candidates.length > 0) {
      try {
        const candidate = response.candidates[0] as any;
        if (candidate?.content?.text && typeof candidate.content.text === 'string') {
          text = candidate.content.text;
        }
      } catch (e) {
        console.log("candidate.content.text access failed:", e);
      }
    }
    
    // Method 5: Try accessing response.response.candidates (nested structure)
    if (!text && responseAny.response?.candidates && Array.isArray(responseAny.response.candidates) && responseAny.response.candidates.length > 0) {
      try {
        const candidate = responseAny.response.candidates[0] as any;
        if (candidate?.content?.parts && Array.isArray(candidate.content.parts) && candidate.content.parts.length > 0) {
          const part = candidate.content.parts[0];
          if (part?.text && typeof part.text === 'string') {
            text = part.text;
          }
        }
      } catch (e) {
        console.log("response.response.candidates access failed:", e);
      }
    }
    
    if (!text) {
      // Check if the issue is due to MAX_TOKENS or missing content
      const candidate = response.candidates?.[0] as any;
      const finishReason = candidate?.finishReason;
      
      if (finishReason === 'MAX_TOKENS') {
        console.error("Response was truncated due to MAX_TOKENS limit. No text content was generated.");
        console.error("Prompt length:", prompt.length, "System instruction length:", systemInstruction.length);
        // Try to return a default response instead of an error message
        return "NONE";
      }
      
      if (finishReason === 'SAFETY') {
        console.error("Response was blocked due to safety filters.");
        return "I'm sorry, I couldn't generate a description due to content safety filters.";
      }
      
      console.error("Could not extract text from response.");
      console.error("Response structure:", {
        hasResponse: !!responseAny.response,
        responseType: typeof responseAny.response,
        hasText: !!responseAny.response?.text,
        textType: typeof responseAny.response?.text,
        candidates: response.candidates?.length,
        finishReason: finishReason,
      });
      
      // Enhanced debugging: log the full response structure (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.error("Full response object keys:", Object.keys(responseAny));
        console.error("Full response:", JSON.stringify(responseAny, null, 2));
        
        if (response.candidates && response.candidates.length > 0) {
          console.error("First candidate structure:", JSON.stringify(candidate, null, 2));
          console.error("Candidate keys:", Object.keys(candidate || {}));
          if (candidate?.content) {
            console.error("Candidate content keys:", Object.keys(candidate.content));
            if (candidate.content.parts) {
              console.error("Parts array length:", candidate.content.parts.length);
              console.error("First part:", JSON.stringify(candidate.content.parts[0], null, 2));
            }
          }
        }
      }
      
      return "I'm sorry, I encountered an error while analyzing the event.";
    }
    
    return text.trim();
  } catch (error) {
    console.error("Gemini API call failed:", error);
    return "I'm sorry, I encountered an error while analyzing the event.";
  }
};
