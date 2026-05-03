import { Message, HyperparamValue } from '../types';

export const aiService = {
  async askNetvisAI(prompt: string, modelName: string, framework: string, epoch: number, history: Message[]) {
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, modelName, framework, epoch, history })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "AI service error");
      }
      const data = await res.json();
      return data.text as string;
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  },

  async autoTuneHyperparameters(modelKey: string, currentParams: Record<string, HyperparamValue>) {
    try {
      const res = await fetch("/api/ai/tune", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelKey, currentParams })
      });
      if (!res.ok) throw new Error("Tune failed");
      return await res.json();
    } catch (error) {
      console.error("AutoTune Error:", error);
      throw error;
    }
  }
};
