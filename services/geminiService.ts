import { VideoMetadata } from '../types';

// Lite version: No API key required. Uses public oEmbed for metadata.
export const analyzeVideoContent = async (videoId: string, url: string): Promise<Partial<VideoMetadata>> => {
  try {
    // Fetch basic metadata from public oEmbed endpoint
    const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
    
    if (!response.ok) {
       throw new Error("Network response was not ok");
    }

    const data = await response.json();

    if (data.error) {
       throw new Error(data.error);
    }

    return {
      title: data.title || `Video ${videoId}`,
      // oEmbed provides a thumbnail, but we fallback to high-res youtube structure if needed
      thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      description: data.author_name ? `Channel: ${data.author_name}` : "No description available.",
      tags: [], // Public oEmbed does not typically return tags
      aiSummary: undefined // Explicitly undefined so the UI hides the AI box
    };
  } catch (error) {
    console.error("Metadata Service Failed:", error);
    return {
      title: "Video Title Unavailable",
      description: "Could not retrieve metadata from public sources.",
      tags: [],
      aiSummary: undefined
    };
  }
};