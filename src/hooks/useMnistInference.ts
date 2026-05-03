import { useState, useEffect } from 'react';

interface OnnxSession {
  inputNames: string[];
  outputNames: string[];
  run: (feeds: Record<string, any>) => Promise<any>;
}

export function useMnistInference(mnistInput: number[] | null, modelKey: string, addLog: (msg: string) => void) {
  const [ortSession, setOrtSession] = useState<OnnxSession | null>(null);
  const [mnistProbabilities, setMnistProbabilities] = useState<number[]>(new Array(10).fill(0.1));
  const [onnxLoading, setOnnxLoading] = useState(false);
  const [onnxError, setOnnxError] = useState('');

  useEffect(() => {
    if (modelKey !== 'mnist') return;
    async function loadOrt() {
      setOnnxLoading(true);
      setOnnxError('');
      try {
        if (!(window as any).ort) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js';
          script.async = true;
          document.head.appendChild(script);
          await new Promise((resolve) => script.onload = resolve);
        }
        const ort = (window as any).ort;
        const session = await ort.InferenceSession.create('/mnist.onnx');
        setOrtSession(session);
        addLog("Loaded true ONNX MNIST inference model.");
      } catch (e) {
        console.error("Failed to load ONNX", e);
        setOnnxError('Failed to load ONNX runtime or model.');
      } finally {
        setOnnxLoading(false);
      }
    }
    if (!ortSession) loadOrt();
  }, [modelKey, ortSession]);

  useEffect(() => {
    if (modelKey === 'mnist') {
      if (!mnistInput || !ortSession) {
        setMnistProbabilities(new Array(10).fill(0.1));
        return;
      }
      
      async function runInference() {
        try {
          const ort = (window as any).ort;
          const tensorObj = new Float32Array(28 * 28);
          for (let i = 0; i < Math.min(mnistInput!.length, 28 * 28); i++) tensorObj[i] = mnistInput![i];
          
          const tensor = new ort.Tensor('float32', tensorObj, [1, 1, 28, 28]);
          const feeds: Record<string, any> = {};
          feeds[ortSession!.inputNames[0]] = tensor;
          const results = await ortSession!.run(feeds);
          const data = results[ortSession!.outputNames[0]].data;
          
          let sum = 0;
          const probs = Array.from(data as Float32Array).map((v: number) => {
            const exp = Math.exp(v); 
            sum += exp;
            return exp;
          });
          setMnistProbabilities(probs.map((v: number) => v / sum));
        } catch (e) {
          console.error("Inference err", e);
        }
      }
      runInference();
    }
  }, [mnistInput, modelKey, ortSession]);

  return { mnistProbabilities, onnxLoading, onnxError };
}
