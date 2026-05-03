import { LCG_A, LCG_C, LCG_M, TOTAL_EPOCHS } from '../constants';
import { HyperparamValue } from '../types';

export function rng(s=0){let v=s;return()=>{v=(v*LCG_A+LCG_C)&LCG_M;return(v>>>0)/LCG_M;};}
export function clamp(x: number,lo: number,hi: number){return Math.max(lo,Math.min(hi,x));}
export function sigmoid(x: number){return 1/(1+Math.exp(-x));}
export function lerp(a: number,b: number,t: number){return a+(b-a)*t;}
export function hexToRgb(h: string){const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return[r,g,b];}
export function rgbA(h: string,a: number){const[r,g,b]=hexToRgb(h);return `rgba(${r},${g},${b},${a})`;}

export function genTrainData(n=TOTAL_EPOCHS,seed=1, hp: Record<string, HyperparamValue> | null = null){
  const r=rng(seed);
  let loss=2.3,acc=0.12;
  
  let decayMultiplier = 0.962;
  let valGap = 1.07;
  let baseLr = 0.001;
  let noiseAmt = 1.0;
  let lrDivergence = false;
  let accMax = 0.986;
  
  if (hp) {
    const lr = hp['Learning Rate'];
    if (lr !== undefined && typeof lr === 'number') {
      baseLr = Math.pow(10, lr);
      if (baseLr > 0.05) {
        // Divergence due to high LR
        lrDivergence = true;
        noiseAmt = 5.0;
        decayMultiplier = 1.05; // Loss increases
        accMax = 0.15; // Random guessing
      } else if (baseLr > 0.01) {
        decayMultiplier = 0.98; // Suboptimal, jumping around
        noiseAmt = 2.5;
        accMax = 0.92;
      } else if (baseLr < 0.0001) {
        decayMultiplier = 0.995; // Very slow
        accMax = 0.85; // Doesn't converge in time
      }
    }
    const dr = hp['Dropout'];
    if (dr !== undefined && typeof dr === 'number') {
      // Dropout slows training and lowers train accuracy but brings val closer
      decayMultiplier += dr * 0.04;
      valGap -= dr * 0.15;
      accMax -= dr * 0.05; 
      if (dr > 0.6) {
        accMax = 0.7; // Too much dropout ruins capacity
      }
    }
    const eta = hp['Eta (η)'];
    if (eta !== undefined && typeof eta === 'number') {
      baseLr = Math.pow(10, eta);
      if (baseLr > 0.05) {
        lrDivergence = true;
        noiseAmt = 5.0;
        decayMultiplier = 1.05;
        accMax = 0.15;
      } else if (baseLr > 0.01) {
        decayMultiplier = 0.98;
        noiseAmt = 2.5;
        accMax = 0.92;
      } else if (baseLr < 0.0001) {
        decayMultiplier = 0.995;
        accMax = 0.85;
      }
    }
  }

  return Array.from({length:n},(_,i)=>{
    if (lrDivergence) {
       loss = loss * decayMultiplier + (r() - 0.2) * noiseAmt;
       acc = Math.min(accMax, acc + (r() - 0.5) * 0.05);
    } else {
       loss = Math.max(0.01, loss * decayMultiplier + (r() - 0.5) * 0.05 * noiseAmt);
       acc = Math.min(accMax, acc + (accMax - acc) * 0.075 + (r() - 0.45) * 0.01 * noiseAmt);
       if (acc < 0.1) acc = 0.1;
    }
    const vl = Math.max(0.01, loss * (valGap + Math.sin(i / 9) * 0.04 + r() * 0.03 * noiseAmt));
    let va = Math.max(0.05, Math.min(1.0, acc - 0.014 + (r() - 0.5) * 0.01 * noiseAmt));
    if (lrDivergence) va = acc; // Random guessing essentially
    const lr=baseLr*Math.pow(0.98,i);
    const wn=0.1+r()*0.15;
    return{epoch:i+1, ep:i+1,loss,acc,vloss:vl,vacc:va,lr,weight_norm:wn,grad_norm:wn*.4+r()*.05};
  });
}

export const T: Record<string, string> = {
  bg:'var(--bg)', white:'var(--white)', surf:'var(--surf)', surf2:'var(--surf2)',
  border:'var(--border)', border2:'var(--border)', text:'var(--text)', text2:'var(--text2)',
  muted:'var(--muted)', subtle:'var(--subtle)', canvasBg:'var(--canvas-bg)',
  indigo:'var(--indigo)', indigoL:'#eef2ff', indigoDk:'#3730a3', indigoMid:'#818cf8',
  violet:'#7c3aed', violetL:'#ede9fe',
  green:'#059669', greenL:'#d1fae5', greenDk:'#047857',
  emerald:'#10b981', teal:'#0d9488', tealL:'#ccfbf1',
  sky:'#0ea5e9', skyL:'#e0f2fe', orange:'#d97706', orangeL:'#fef3c7',
  red:'#dc2626', redL:'#fee2e2', pink:'#db2777', pinkL:'#fce7f3', cyan:'#0891b2',
  canvasGrid:'rgba(30,60,140,0.35)',
};

export function genKMeansData(k=3, n=150, seed=1) {
  const r = rng(seed);
  const centroids = Array.from({length:k}, () => [r(), r()]);
  const points = Array.from({length:n}, () => {
    const cIdx = Math.floor(r() * k);
    const c = centroids[cIdx];
    return {
      x: c[0] + (r() - 0.5) * 0.25,
      y: c[1] + (r() - 0.5) * 0.25,
      cluster: cIdx
    };
  });
  return { points, centroids };
}

export function genXGBTreeData(depth=3, seed=1) {
  const r = rng(seed);
  const genNode = (d: number, path: string): any => {
    if (d >= depth || (d > 0 && r() < 0.2)) {
      return { id: path, val: (r() * 2 - 1).toFixed(3), isLeaf: true };
    }
    return {
      id: path,
      feature: ['x1', 'x2', 'x3'][Math.floor(r()*3)],
      split: r().toFixed(2),
      left: genNode(d + 1, path + 'L'),
      right: genNode(d + 1, path + 'R')
    };
  };
  return genNode(0, 'root');
}

export const LC: Record<string, string> = {
  input:'#34d399', output:'#fbbf24', dense:'#60a5fa', conv:'#fb923c',
  pool:'#a78bfa',  rnn:'#f472b6',   attention:'#38bdf8', norm:'#4ade80',
  flatten:'#94a3b8', embed:'#c084fc', residual:'#f97316',
};

export const FW_META: Record<string, any> = {
  pytorch:   {name:'PyTorch',     color:'#ee4c2c', bg:'#fff1ef'},
  tensorflow:{name:'TensorFlow',  color:'#ff9800', bg:'#fff8ec'},
  jax:       {name:'JAX',         color:'#9333ea', bg:'#faf5ff'},
  onnx:      {name:'ONNX',        color:'#6366f1', bg:'#f0f0ff'},
  sklearn:   {name:'scikit-learn',color:'#3b82f6', bg:'#eff6ff'},
  xgboost:   {name:'XGBoost',     color:'#189ab4', bg:'#e8f7fc'},
  lightgbm:  {name:'LightGBM',    color:'#22c55e', bg:'#f0fdf4'},
};
