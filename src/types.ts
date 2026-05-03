import { Model } from './schemas';

export interface Experiment {
  id: number;
  name?: string;
  model: string;
  modelKey?: string; // transition
  framework?: string;
  fw: string;
  accuracy: number;
  acc?: number; // legacy
  loss: number;
  timestamp?: string;
  ts: string;
  ep: number;
  vloss?: number;
  vacc: number;
  status: string;
  note: string;
}

export interface TrainingDataPoint {
  epoch: number;
  ep?: number; // legacy alias
  loss: number;
  acc: number;
  vloss?: number;
  vacc?: number;
  lr?: number;
  grad_norm?: number;
  [key: string]: number | undefined;
}

export interface TrainingState {
  isTraining: boolean;
  epoch: number;
  lossHistory: number[];
  accuracyHistory: number[];
}

export type HyperparamValue = string | number | boolean;

export interface CanvasCamera {
  rx: number;
  ry: number;
  scale: number;
}

export interface VizOptions {
  showActivations: boolean;
  showWeights: boolean;
  showForward: boolean;
  showBackward: boolean;
}

export interface Particle {
  li: number;
  fi: number;
  ti: number;
  prog: number;
  speed: number;
  alpha: number;
  backward: boolean;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SavedModel {
  id: string;
  name: string;
  modelKey: string;
  framework: string;
  hyperparams: Record<string, HyperparamValue>;
  epoch: number;
  accuracy: number;
  loss: number;
  timestamp: string;
  weights?: Record<string, number[] | number[][]>;
}
