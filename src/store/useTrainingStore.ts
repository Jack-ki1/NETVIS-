import { create } from 'zustand';

interface TrainingState {
  isTraining: boolean;
  epoch: number;
  lossHistory: number[];
  accuracyHistory: number[];
  setTraining: (isTraining: boolean) => void;
  setEpoch: (epoch: number) => void;
  addMetrics: (loss: number, acc: number) => void;
  resetTraining: () => void;
}

export const useTrainingStore = create<TrainingState>((set) => ({
  isTraining: false,
  epoch: 0,
  lossHistory: [],
  accuracyHistory: [],
  setTraining: (isTraining) => set({ isTraining }),
  setEpoch: (epoch) => set({ epoch }),
  addMetrics: (loss, acc) => set((state) => ({
    lossHistory: [...state.lossHistory, loss],
    accuracyHistory: [...state.accuracyHistory, acc],
  })),
  resetTraining: () => set({ epoch: 0, lossHistory: [], accuracyHistory: [], isTraining: false }),
}));
