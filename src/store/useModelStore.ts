import { create } from 'zustand';
import { MODELS } from '../data/models';
import { Model } from '../schemas';

import { HyperparamValue } from '../types';

interface ModelState {
  selectedModel: Model;
  framework: string;
  hyperparams: Record<string, HyperparamValue>;
  setSelectedModel: (modelKey: string) => void;
  setFramework: (fw: string) => void;
  setHyperparams: (params: Record<string, HyperparamValue>) => void;
}

const defaultModel = MODELS.find(m => m.key === 'mnist') || MODELS[0];

export const useModelStore = create<ModelState>((set) => ({
  selectedModel: defaultModel,
  framework: defaultModel.fw[0],
  hyperparams: {},
  setSelectedModel: (modelKey) => {
    const model = MODELS.find(m => m.key === modelKey) || MODELS[0];
    set({ selectedModel: model, framework: model.fw[0], hyperparams: {} });
  },
  setFramework: (framework) => set({ framework }),
  setHyperparams: (hyperparams) => set({ hyperparams }),
}));
