import { GoogleGenAI } from "@google/genai";
import { VideoMetadata } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeVideoContent = async (videoId: string, url: string): Promise<Partial<VideoMetadata>> => {
  try {
    const model = 'gemini-2.5-flash';
    // In a real scenario, we would fetch the transcript or page metadata via backend.
    // Here we simulate analysis based on the ID and structure.
    const prompt = `
      I have a YouTube video with ID: ${videoId} and URL: ${url}.
      
      Please generate a realistic, hypothetical metadata object for this video as if you were an API.
      Assume the video is a tech tutorial or a trending topic based on common youtube patterns.
      
      Return JSON format with:
      1. "title": A catchy, realistic YouTube title.
      2. "description": A brief 2-sentence summary.
      3. "tags": An array of 5 relevant hashtags.
      4. "aiSummary": A deeper insight into why this video might be useful (2 sentences).
      
      Do not output markdown code blocks, just the JSON string.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);

    return {
      title: data.title || `Video ${videoId}`,
      description: data.description || "No description available.",
      tags: data.tags || [],
      aiSummary: data.aiSummary || "AI analysis could not determine content context."
    };
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      title: "Unknown Video",
      description: "Could not retrieve metadata.",
      tags: [],
      aiSummary: "Analysis unavailable."
    };
  }
};