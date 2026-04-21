export function rng(s=0){let v=s;return()=>{v=(v*1664525+1013904223)&0xffffffff;return(v>>>0)/0xffffffff;};}
export function clamp(x: number,lo: number,hi: number){return Math.max(lo,Math.min(hi,x));}
export function sigmoid(x: number){return 1/(1+Math.exp(-x));}
export function lerp(a: number,b: number,t: number){return a+(b-a)*t;}
export function hexToRgb(h: string){const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return[r,g,b];}
export function rgbA(h: string,a: number){const[r,g,b]=hexToRgb(h);return `rgba(${r},${g},${b},${a})`;}

export function genTrainData(n=80,seed=1, hp: any = null){
  const r=rng(seed);
  let loss=2.3,acc=0.12;
  
  let decayMultiplier = 0.962;
  let valGap = 1.07;
  let baseLr = 0.001;
  
  if (hp) {
    if (hp['Learning Rate'] !== undefined) {
      baseLr = Math.pow(10, hp['Learning Rate']);
      if (baseLr > 0.01) decayMultiplier = 0.94;
      else if (baseLr < 0.0001) decayMultiplier = 0.98;
    }
    if (hp['Dropout'] !== undefined) {
      decayMultiplier += hp['Dropout'] * 0.02;
      valGap -= hp['Dropout'] * 0.1;
    }
    if (hp['Eta (η)'] !== undefined) {
      baseLr = Math.pow(10, hp['Eta (η)']);
      if (baseLr > 0.1) decayMultiplier = 0.92;
      else if (baseLr < 0.01) decayMultiplier = 0.97;
    }
  }

  return Array.from({length:n},(_,i)=>{
    loss=Math.max(0.035,loss*decayMultiplier+(r()-.5)*.025);
    acc=Math.min(.986,acc+(.986-acc)*.075+(r()-.45)*.01);
    const vl=loss*(valGap+Math.sin(i/9)*.04+r()*.03);
    const va=Math.max(.05,Math.min(.975,acc-.014+(r()-.5)*.009));
    const lr=baseLr*Math.pow(0.98,i);
    const wn=.1+r()*.15;
    return{ep:i+1,loss,acc,vloss:vl,vacc:va,lr,weight_norm:wn,grad_norm:wn*.4+r()*.05};
  });
}

export const T: any = {
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
