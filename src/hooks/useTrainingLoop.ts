import { useEffect, useRef, useCallback } from 'react';
import { useTrainingStore } from '../store/useTrainingStore';
import { useModelStore } from '../store/useModelStore';
import { genTrainData } from '../lib/utils';
import { TOTAL_EPOCHS, DEFAULT_INTERVAL } from '../constants';
import { HyperparamValue } from '../types';

import { Experiment, TrainingDataPoint } from '../types';

export function useTrainingLoop(toast: (msg: string) => void, addLog: (msg: string) => void, setExperiments: React.Dispatch<React.SetStateAction<Experiment[]>>) {
  const { isTraining, setTraining, setEpoch, addMetrics, resetTraining, epoch } = useTrainingStore();
  const { selectedModel, framework, hyperparams } = useModelStore();
  
  const epochRef = useRef(0);
  const trainDataRef = useRef<TrainingDataPoint[]>([]);
  const fullDataRef = useRef<TrainingDataPoint[]>([]);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    fullDataRef.current = genTrainData(TOTAL_EPOCHS, Math.random() * 9999 | 0, hyperparams);
  }, [selectedModel.key, hyperparams]);

  const finishTraining = useCallback((lastData: TrainingDataPoint | undefined) => {
    setTraining(false);
    if (lastData) {
      const newExp: Experiment = {
        id: Date.now(),
        model: selectedModel.key,
        modelKey: selectedModel.key,
        fw: framework,
        framework: framework,
        ep: TOTAL_EPOCHS,
        loss: lastData.loss,
        accuracy: lastData.acc * 100,
        acc: lastData.acc * 100,
        vloss: lastData.vloss,
        vacc: (lastData.vacc ?? 0) * 100,
        ts: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        status: 'done',
        note: selectedModel.key === 'mlp' ? 'Real Web Worker TF.js training' : 'NETVIS simulation'
      };
      setExperiments((p: Experiment[]) => [newExp, ...p.slice(0, 9)]);
      toast(`✓ Training complete — Val Acc: ${((lastData.vacc ?? 0) * 100).toFixed(1)}%`);
      addLog(`[System] Synced weights back. Total params evaluated.`);
    }
  }, [selectedModel.key, framework, setTraining, setExperiments, toast, addLog]);

  useEffect(() => {
    if (!isTraining) return;

    if (selectedModel.key === 'mlp') {
      // Use real Web Worker training
      if (!workerRef.current) {
        workerRef.current = new Worker(new URL('../worker/trainingWorker.ts', import.meta.url), { type: 'module' });
        
        // Pass hyperparameters to worker
        const lrHp = hyperparams['Learning Rate'] as number | undefined;
        const learningRate = lrHp !== undefined ? Math.pow(10, lrHp) : 0.01;
        
        workerRef.current.postMessage({
          action: 'START_TRAINING',
          payload: { epochs: TOTAL_EPOCHS, learningRate }
        });
        
        workerRef.current.onmessage = (e) => {
          const data = e.data;
          if (data.type === 'EPOCH_END') {
            epochRef.current = data.epoch + 1;
            const currentData: TrainingDataPoint = {
              epoch: epochRef.current, ep: epochRef.current,
              loss: data.loss, acc: data.acc,
              vloss: data.val_loss, vacc: data.val_acc,
              lr: learningRate, weight_norm: 0.5, grad_norm: 0.5
            };
            trainDataRef.current.push(currentData);
            setEpoch(epochRef.current);
            addMetrics(currentData.loss, currentData.acc);

            if (epochRef.current % 10 === 0) {
              addLog(`Epoch ${epochRef.current}/${TOTAL_EPOCHS} || Loss: ${currentData.loss.toFixed(4)} | Acc: ${(currentData.acc * 100).toFixed(1)}% | Val: ${(data.val_acc * 100).toFixed(1)}%`);
            }
          } else if (data.type === 'TRAINING_COMPLETE') {
            finishTraining(trainDataRef.current.at(-1));
            workerRef.current?.terminate();
            workerRef.current = null;
          } else if (data.type === 'TRAINING_ERROR') {
            setTraining(false);
            addLog(`[Error] Worker training failed: ${data.error}`);
            toast('Failed to train model');
            workerRef.current?.terminate();
            workerRef.current = null;
          }
        };
      }
      return () => {
        // cleanup on unmount or training cancel
      };
    } else {
      // Simulated training
      const id = setInterval(() => {
        if (epochRef.current >= TOTAL_EPOCHS) {
          finishTraining(trainDataRef.current.at(-1));
          return;
        }
        
        epochRef.current++;
        const currentData = fullDataRef.current[epochRef.current - 1];
        trainDataRef.current.push(currentData);
        
        setEpoch(epochRef.current);
        addMetrics(currentData.loss, currentData.acc);
   
        if (epochRef.current % 10 === 0) {
          addLog(`Epoch ${epochRef.current}/${TOTAL_EPOCHS} || Loss: ${currentData.loss.toFixed(4)} | Acc: ${(currentData.acc * 100).toFixed(1)}% | Val: ${((currentData.vacc ?? 0) * 100).toFixed(1)}%`);
        }
        if (epochRef.current === 5) addLog(`[CUDA] Allocating tensors for ${selectedModel.layers?.length || 'classical'} modules...`);
        if (epochRef.current === 40) addLog(`[Monitor] Memory bound 1.2GB/16GB VRAM.`);
      }, DEFAULT_INTERVAL);
      
      return () => clearInterval(id);
    }
  }, [isTraining, selectedModel, finishTraining, setEpoch, addMetrics, addLog, toast, hyperparams]);

  const startTrain = useCallback(() => {
    if (epochRef.current >= TOTAL_EPOCHS) {
      resetTraining();
      epochRef.current = 0;
      trainDataRef.current = [];
      fullDataRef.current = genTrainData(TOTAL_EPOCHS, Math.random() * 9999 | 0, hyperparams);
      addLog(`[Env] Reset simulation buffers for new run.`);
    }
    setTraining(!isTraining);
    if (!isTraining) {
      toast(selectedModel.key === 'mlp' ? '▶ TF.js Web Worker training started…' : '▶ Training simulation started…');
      addLog(`[Pipeline] Initializing DataLoaders... batch_size=64`);
    } else {
      addLog(`[Pipeline] Training halted by operator manually.`);
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    }
  }, [isTraining, resetTraining, setTraining, toast, addLog, hyperparams, selectedModel.key]);

  return { startTrain };
}

