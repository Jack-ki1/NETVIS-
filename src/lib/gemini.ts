import { GoogleGenAI, Type } from "@google/genai";
import { HyperparamValue } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function autoTuneHyperparameters(modelKey: string, currentParams: Record<string, HyperparamValue>) {
  try {
    const prompt = `You are an expert AutoML optimizer. The user is configuring a '${modelKey}' model.
Current hyperparameters: ${JSON.stringify(currentParams)}
Suggest an optimal set of hyperparameters for a general classification task.
Respond ONLY with a valid JSON object where keys exactly match the current parameter names.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: Object.fromEntries(Object.keys(currentParams).map(k => [k, { type: Type.NUMBER }]))
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AutoTune Error:", error);
    return null;
  }
}

export async function askNetvisAI(prompt: string, modelName: string, framework: string, epoch: number, history: any[]) {
  try {
    const contextPrompt = `[Context: Viewing ${modelName} with ${framework} at epoch ${epoch}]\n\n${prompt}`;
    const systemInstruction = `You are NETVIS AI, an expert ML educator embedded in an interactive visualization platform. The user is currently viewing ${modelName} (${framework}). Current training epoch: ${epoch}. Answer concisely with mathematical precision. Use markdown for formulas. Optionally suggest hyperparameter changes as structured JSON at the end of your response like: \`\`\`json\n{"suggested_hyperparams": {"Learning Rate": 0.001}}\n\`\`\``;

    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction,
      },
      history: history.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
    });

    const response = await chat.sendMessage({ message: contextPrompt });
    return response.text || "No response received from AI.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Network error calling AI service. The Gemini API might be unavailable.";
  }
}
