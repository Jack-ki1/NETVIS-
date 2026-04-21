import { useState, useEffect } from 'react';
import { T } from '../lib/utils';
import { Tooltip } from './Tooltip';

const MODEL_HP: any = {
  mlp:[{n:'Learning Rate',t:'log',min:-5,max:-2,default:-3},{n:'Hidden Layers',t:'int',min:1,max:8,default:3},{n:'Units/Layer',t:'int',min:16,max:512,default:128},{n:'Dropout',t:'float',min:0,max:0.7,default:0.3,step:0.05},{n:'Activation',t:'cat',opts:['GELU','ReLU','Tanh','SiLU'],default:'GELU'},{n:'Optimizer',t:'cat',opts:['AdamW','Adam','SGD+Mom','RMSProp'],default:'AdamW'},{n:'Weight Decay',t:'log',min:-5,max:-1,default:-4},{n:'Batch Size',t:'cat',opts:['16','32','64','128','256'],default:'64'}],
  cnn:[{n:'Base Filters',t:'cat',opts:['16','32','64','128'],default:'32'},{n:'Kernel Size',t:'cat',opts:['3×3','5×5','7×7'],default:'3×3'},{n:'Depth',t:'int',min:2,max:8,default:4},{n:'Pooling',t:'cat',opts:['Max','Avg','Global Avg'],default:'Max'},{n:'BN Momentum',t:'float',min:0.01,max:0.5,default:0.1,step:0.01}],
  transformer:[{n:'d_model',t:'cat',opts:['64','128','256','512','1024'],default:'256'},{n:'Heads',t:'cat',opts:['4','8','16'],default:'8'},{n:'Enc. Layers',t:'int',min:1,max:24,default:6},{n:'FFN Mult.',t:'cat',opts:['2×','4×','8×'],default:'4×'},{n:'Attention Drop.',t:'float',min:0,max:0.4,default:0.1,step:0.05},{n:'LR Warmup',t:'int',min:0,max:4000,default:1000}],
  xgb:[{n:'Max Depth',t:'int',min:3,max:12,default:6},{n:'Eta (η)',t:'log',min:-4,max:-1,default:-2.3},{n:'Subsample',t:'float',min:0.5,max:1,default:0.8,step:0.05},{n:'Col Sample',t:'float',min:0.5,max:1,default:0.8,step:0.05},{n:'Min Child W',t:'int',min:1,max:20,default:1},{n:'Lambda (L2)',t:'float',min:0,max:10,default:1,step:0.5}],
  default:[{n:'Regularization',t:'log',min:-5,max:2,default:0},{n:'Max Iterations',t:'int',min:100,max:5000,default:1000},{n:'Tolerance',t:'log',min:-6,max:-2,default:-4},{n:'Solver',t:'cat',opts:['Auto','L-BFGS','SGD','Coord. Descent'],default:'Auto'}]
};

const HP_DESC: any = {
  'Learning Rate': 'Controls how much to change the model in response to the estimated error.',
  'Hidden Layers': 'The number of layers between the input and output layers.',
  'Units/Layer': 'The number of neurons or nodes in each hidden layer.',
  'Dropout': 'Randomly ignores a fraction of nodes during training to prevent overfitting.',
  'Activation': 'Mathematical function applied to a node\'s output to introduce non-linearity.',
  'Optimizer': 'Algorithm used to change attributes of the neural network to reduce losses.',
  'Weight Decay': 'L2 regularization penalty applied to the weights.',
  'Batch Size': 'Number of training examples utilized in one iteration.',
  'Base Filters': 'Number of output filters in the first convolutional layer.',
  'Kernel Size': 'Dimensions of the sliding window used in convolutional layers.',
  'Depth': 'Total number of layers in the network.',
  'Pooling': 'Downsampling operation to reduce the spatial dimensions of the input.',
  'BN Momentum': 'Momentum for the moving average in Batch Normalization layers.',
  'd_model': 'Dimensionality of the embeddings and hidden states.',
  'Heads': 'Number of parallel attention mechanisms in Multi-Head Attention.',
  'Enc. Layers': 'Number of stacked encoder blocks.',
  'FFN Mult.': 'Multiplier for the hidden dimension in the Feed-Forward Network.',
  'Attention Drop.': 'Dropout probability applied to the attention weights.',
  'LR Warmup': 'Number of steps to linearly increase the learning rate before decaying.',
  'Max Depth': 'Maximum depth of a tree. Increasing this value will make the model more complex.',
  'Eta (η)': 'Step size shrinkage used in update to prevent overfitting.',
  'Subsample': 'Subsample ratio of the training instances.',
  'Col Sample': 'Subsample ratio of columns when constructing each tree.',
  'Min Child W': 'Minimum sum of instance weight (hessian) needed in a child.',
  'Lambda (L2)': 'L2 regularization term on weights.',
  'Regularization': 'Penalty applied to model complexity to prevent overfitting.',
  'Max Iterations': 'Maximum number of iterations for the solver to converge.',
  'Tolerance': 'Tolerance for stopping criteria.',
  'Solver': 'Algorithm to use in the optimization problem.'
};

export function HyperparamPanel({model,onApply}: any){
  const hp=MODEL_HP[model.key]||MODEL_HP.default;
  const [vals,setVals]=useState(()=>Object.fromEntries(hp.map((h:any)=>[h.n,h.default])));
  useEffect(()=>{const h2=MODEL_HP[model.key]||MODEL_HP.default;setVals(Object.fromEntries(h2.map((h:any)=>[h.n,h.default])));},[model.key]);
  const hp2=MODEL_HP[model.key]||MODEL_HP.default;
  return(
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:11,fontWeight:700,color:T.text2}}>Hyperparameter Configuration</div>
        <button onClick={()=>onApply(vals)} style={{padding:'6px 14px',borderRadius:7,background:T.indigo,color:'#fff',border:'none',fontSize:11,fontWeight:600,cursor:'pointer',boxShadow:`0 2px 8px ${T.indigo}44`}}>▶ Apply & Simulate</button>
      </div>
      {hp2.map((h:any)=>{
        const v=vals[h.n]??h.default;
        const display=h.t==='log'?`${Math.pow(10,v).toExponential(2)}`:v;
        return(
          <div key={h.n} style={{background:T.surf,borderRadius:8,padding:'10px 12px',border:`1px solid ${T.border}`}}>
            <Tooltip content={HP_DESC[h.n] || `Adjust ${h.n}`} pos="top">
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6, width: '100%'}}>
                <span style={{fontSize:11,fontWeight:600,color:T.text2, borderBottom: '1px dotted #cbd5e1', cursor: 'help'}}>{h.n}</span>
                <span style={{fontSize:11,fontFamily:'JetBrains Mono',color:T.indigo,fontWeight:700}}>{display}</span>
              </div>
            </Tooltip>
            {h.t==='cat'?(
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {h.opts.map((o:any)=><button key={o} onClick={()=>setVals((p:any)=>({...p,[h.n]:o}))} style={{padding:'3px 9px',borderRadius:5,fontSize:10,cursor:'pointer',background:v===o?T.indigo:T.surf2,color:v===o?'#fff':T.muted,border:`1px solid ${v===o?T.indigo:T.border}`,fontFamily:'inherit',transition:'all .1s'}}>{o}</button>)}
              </div>
            ):(
              <div>
                <input type="range" min={h.min} max={h.max} step={h.step||h.t==='int'?1:(h.max-h.min)/50} value={v}
                  onChange={e=>setVals((p:any)=>({...p,[h.n]:parseFloat(e.target.value)}))}
                  style={{width:'100%',accentColor:T.indigo}}/>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:T.subtle,marginTop:2}}>
                  <span>{h.t==='log'?Math.pow(10,h.min).toExponential(1):h.min}</span>
                  <span>{h.t==='log'?Math.pow(10,h.max).toExponential(1):h.max}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
