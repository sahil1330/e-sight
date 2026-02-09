import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "YOUR_API_KEY_HERE";

const ai = new GoogleGenAI({
  apiKey: API_KEY,
});

/**
 * Lists all available Gemini models
 */
export async function listAvailableModels() {
  try {
    console.log("Fetching available Gemini models...\n");
    
    const models = await ai.models.list();
    
    console.log("Available Models:");
    console.log("=================\n");
    
    if (Array.isArray(models)) {
      models.forEach((model: any) => {
        console.log(`Model: ${model.name || model}`);
        if (model.displayName) console.log(`  Display Name: ${model.displayName}`);
        if (model.description) console.log(`  Description: ${model.description}`);
        if (model.supportedGenerationMethods) {
          console.log(`  Supported Methods: ${model.supportedGenerationMethods.join(", ")}`);
        }
        console.log("");
      });
    } else {
      console.log(JSON.stringify(models, null, 2));
    }
    
    return models;
  } catch (error) {
    console.error("Error listing models:", error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  listAvailableModels()
    .then(() => {
      console.log("\nDone!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}
