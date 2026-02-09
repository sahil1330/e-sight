import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API with your API key
// Replace with your actual API key or use environment variable
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "YOUR_API_KEY_HERE";

const ai = new GoogleGenAI({
  apiKey: API_KEY,
});

/**
 * Available Gemini Models for Image Analysis (as of Feb 2026):
 * 
 * Recommended (Stable):
 * - "gemini-2.5-flash" - Latest stable, fast, supports up to 1M tokens (CURRENTLY USED)
 * - "gemini-2.5-pro" - More capable but slower
 * - "gemini-flash-latest" - Always points to latest flash version
 * 
 * Alternatives:
 * - "gemini-2.0-flash" - Previous version
 * - "gemini-2.5-flash-lite" - Lighter/faster version
 * 
 * All support the "generateContent" action needed for image description.
 * Run `bun utils/listGeminiModels.ts` to see all available models.
 */

/**
 * Analyzes an image using Gemini AI and returns a detailed description
 * @param base64Image - Base64 encoded image string (without data:image prefix)
 * @param mimeType - MIME type of the image (default: 'image/jpeg')
 * @returns Promise<string> - Detailed description of the image
 * @throws Error if the API call fails
 */
export async function describeImage(
  base64Image: string,
  mimeType: string = "image/jpeg"
): Promise<string> {
  try {
    const prompt = `You are assisting a visually impaired person. Please provide a detailed, comprehensive description of this image. Include:
    
1. The main subject or focal point
2. Important objects and their positions
3. People (if any) and what they're doing
4. Colors, lighting, and atmosphere
5. Text or signs (if visible and readable)
6. Any potential hazards or important safety information
7. The overall scene or setting

Be thorough, clear, and specific. Describe spatial relationships (left, right, foreground, background) to help create a mental picture. Your description should enable someone who cannot see the image to understand it completely.`;

    const contents = [
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image,
        },
      },
      { text: prompt },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });

    if (!response.text) {
      throw new Error("No description generated from the image");
    }

    return response.text;
  } catch (error) {
    console.error("Error describing image with Gemini:", error);
    throw new Error(
      `Failed to analyze image: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Analyzes an image and provides a quick, concise description
 * @param base64Image - Base64 encoded image string
 * @param mimeType - MIME type of the image
 * @returns Promise<string> - Brief description of the image
 */
export async function getQuickDescription(
  base64Image: string,
  mimeType: string = "image/jpeg"
): Promise<string> {
  try {
    const prompt =
      "Provide a brief, one-sentence description of this image for a visually impaired person. Focus on the most important elements.";

    const contents = [
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image,
        },
      },
      { text: prompt },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });

    if (!response.text) {
      throw new Error("No description generated from the image");
    }

    return response.text;
  } catch (error) {
    console.error("Error getting quick description:", error);
    throw new Error(
      `Failed to get quick description: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Identifies objects in an image
 * @param base64Image - Base64 encoded image string
 * @param mimeType - MIME type of the image
 * @returns Promise<string> - List of identified objects
 */
export async function identifyObjects(
  base64Image: string,
  mimeType: string = "image/jpeg"
): Promise<string> {
  try {
    const prompt =
      "List all objects visible in this image. Format as a simple bulleted list. Be specific and include counts when there are multiple items of the same type.";

    const contents = [
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image,
        },
      },
      { text: prompt },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });

    if (!response.text) {
      throw new Error("No objects identified in the image");
    }

    return response.text;
  } catch (error) {
    console.error("Error identifying objects:", error);
    throw new Error(
      `Failed to identify objects: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Reads and extracts text from an image (OCR functionality)
 * @param base64Image - Base64 encoded image string
 * @param mimeType - MIME type of the image
 * @returns Promise<string> - Extracted text from the image
 */
export async function readTextFromImage(
  base64Image: string,
  mimeType: string = "image/jpeg"
): Promise<string> {
  try {
    const prompt =
      "Extract and read all visible text from this image. If there is no text, simply say 'No text detected.' Maintain the original formatting and structure as much as possible.";

    const contents = [
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image,
        },
      },
      { text: prompt },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
    });

    if (!response.text) {
      return "No text detected.";
    }

    return response.text;
  } catch (error) {
    console.error("Error reading text from image:", error);
    throw new Error(
      `Failed to read text: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
