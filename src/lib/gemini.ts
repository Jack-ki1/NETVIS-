import { GoogleGenAI } from '@google/genai';

// Initialize Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function autoTuneHyperparameters(modelKey: string, currentParams: any) {
  const prompt = `You are an expert AutoML optimizer. The user is configuring a '${modelKey}' model.
Current hyperparameters: ${JSON.stringify(currentParams)}
Suggest an optimal set of hyperparameters for a general classification task.
Respond ONLY with a valid JSON object where keys exactly match the current parameter names. Do not include markdown blocks.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.0-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
        responseMimeType: 'application/json'
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("AutoTune Error:", error);
    return null;
  }
}

export async function askNetvisAI(prompt: string, modelName: string, framework: string, epoch: number, history: any[]) {
  const systemInstruction = `You are NETVIS AI, an expert ML educator embedded in an interactive visualization platform. The user is currently viewing ${modelName} (${framework}). Current training epoch: ${epoch}. Answer concisely with mathematical precision. Use markdown for formulas. Optionally suggest hyperparameter changes as structured JSON at the end of your response like: \`\`\`json\n{"suggested_hyperparams": {"Learning Rate": 0.001}}\n\`\`\``;

  try {
    const response = await (ai.models as any).generateContent({
      model: 'gemini-3.0-flash',
      contents: [
        ...history.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
      tools: [
        { googleSearch: {} }
      ]
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I encountered an error while processing your request. Please check your API key or try again later.";
  }
}
