import { useState, useMemo } from 'react';
import { T, FW_META, rng } from '../lib/utils';
import { MODELS } from '../data/models';

import { Experiment, TrainingDataPoint } from '../types';

interface SparklineProps {
  data: TrainingDataPoint[];
  keyName: string;
  color: string;
  h?: number;
  label?: string;
}

export function Sparkline({data, keyName, color, h=40, label}: SparklineProps){
  if(!data?.length)return null;
  const vals=data.map((d: TrainingDataPoint)=>d[keyName]??0);
  const mn=Math.min(...vals),mx=Math.max(...vals),rng2=mx-mn||1;
  const W=160,H=h;
  const pts=vals.map((v:number,i:number)=>`${i?'L':'M'}${(i/(vals.length-1))*W},${H-((v-mn)/rng2)*H}`).join(' ');
  return(
    <div style={{position:'relative'}}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:'visible'}}>
        <defs>
          <linearGradient id={`sg-${keyName}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={`${pts}L${W},${H}L0,${H}Z`} fill={`url(#sg-${keyName})`}/>
        <path d={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx={(vals.length-1)/(vals.length-1)*W} cy={H-((vals[vals.length-1]-mn)/rng2)*H} r="3" fill={color}/>
      </svg>
      {label&&<div style={{position:'absolute',top:0,left:0,fontSize:9,color:color,fontFamily:'JetBrains Mono',opacity:.8}}>{label}</div>}
      <div style={{position:'absolute',top:0,right:0,fontSize:9,color:color,fontFamily:'JetBrains Mono',fontWeight:700}}>
        {vals[vals.length-1]?.toFixed(4)}
      </div>
    </div>
  );
}

import { Model } from '../schemas';

interface AttentionHeatmapProps {
  model: Model;
}

export function AttentionHeatmap({model}: AttentionHeatmapProps){
  const n=8;
  const r2=rng(model.key.charCodeAt(0)||42);
  const matrix=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>{
    const base=i===j?.4:Math.max(0,(r2()-.3)*.8);
    const nearDiag=Math.abs(i-j)<=1?r2()*.3:0;
    return Math.min(1,base+nearDiag);
  }));
  const tokens=['[CLS]','the','model','learns','from','data','[SEP]','[PAD]'];
  const cellSize=32;
  const svgSize=n*cellSize+60;
  return(
    <div>
      <div style={{fontSize:10,fontWeight:600,color:T.muted,marginBottom:8}}>Self-Attention Heatmap (Head 1/8)</div>
      <svg width="100%" viewBox={`0 0 ${svgSize} ${svgSize}`} style={{fontFamily:'JetBrains Mono'}}>
        {matrix.map((row,i)=>row.map((val,j)=>{
          return(
            <g key={`${i}-${j}`}>
              <rect x={j*cellSize+40} y={i*cellSize+20} width={cellSize-1} height={cellSize-1} fill={`rgba(79,70,229,${val.toFixed(2)})`} rx="2"/>
              {val>0.3&&<text x={j*cellSize+40+cellSize/2} y={i*cellSize+20+cellSize/2+3} textAnchor="middle" fontSize="7" fill="white" opacity=".8">{val.toFixed(2)}</text>}
            </g>
          );
        }))}
        {tokens.map((t,i)=>(
          <g key={t+i}>
            <text x={i*cellSize+40+cellSize/2} y={16} textAnchor="middle" fontSize="7" fill="rgba(150,180,240,.8)" transform="">{t.length>5?t.slice(0,4)+'…':t}</text>
            <text x={36} y={i*cellSize+20+cellSize/2+3} textAnchor="end" fontSize="7" fill="rgba(150,180,240,.8)">{t.length>5?t.slice(0,4)+'…':t}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

interface WeightHistogramProps {
  layerIdx: number;
}

export function WeightHistogram({layerIdx}: WeightHistogramProps){
  const bins=20;
  const r2=rng(layerIdx*31+7);
  const weights=Array.from({length:200},()=>{const u=r2()+r2()+r2();return(u-1.5)/2;});
  const min2=Math.min(...weights),max2=Math.max(...weights),range=max2-min2;
  const hist=Array(bins).fill(0);
  weights.forEach(w=>{const b=Math.min(bins-1,Math.floor((w-min2)/range*bins));hist[b]++;});
  const maxH=Math.max(...hist);
  const W=260,H=70;
  const bw=W/bins;
  return(
    <div>
      <div style={{fontSize:10,color:T.muted,fontWeight:600,marginBottom:6}}>Weight Distribution — Layer {layerIdx}</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H+15}`}>
        {hist.map((h2,i)=>{
          const norm=h2/maxH;
          const col=i<bins*.4?'#f472b6':i<bins*.6?'#60a5fa':'#34d399';
          return <rect key={i} x={i*bw+.5} y={H-norm*H} width={bw-1} height={norm*H} fill={col} opacity="0.7" rx="1"/>;
        })}
        <line x1={0} y1={H} x2={W} y2={H} stroke="rgba(150,180,240,.3)" strokeWidth=".5"/>
        <text x={0} y={H+12} fontSize="8" fill="rgba(150,180,240,.6)" fontFamily="monospace">{min2.toFixed(2)}</text>
        <text x={W/2} y={H+12} fontSize="8" fill="rgba(150,180,240,.6)" fontFamily="monospace" textAnchor="middle">0.00</text>
        <text x={W} y={H+12} fontSize="8" fill="rgba(150,180,240,.6)" fontFamily="monospace" textAnchor="end">{max2.toFixed(2)}</text>
      </svg>
    </div>
  );
}

interface ConfusionMatrixProps {
  model: Model;
}

export function ConfusionMatrix({model}: ConfusionMatrixProps){
  const r2=rng(model.key.charCodeAt(0));
  const classes=['Cat','Dog','Bird','Fish'];
  const n=classes.length;
  const mat=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>{
    if(i===j)return Math.round(r2()*30+60);
    return Math.round(r2()*15);
  }));
  const rowSums=mat.map(r=>r.reduce((a,b)=>a+b,0));
  const cellSize=52;
  const svgW=n*cellSize+80,svgH=n*cellSize+50;
  return(
    <div>
      <div style={{fontSize:10,fontWeight:600,color:T.muted,marginBottom:8}}>Confusion Matrix (Test Set)</div>
      <svg width="100%" viewBox={`0 0 ${svgW} ${svgH}`} style={{fontFamily:'JetBrains Mono'}}>
        {mat.map((row,i)=>row.map((val,j)=>{
          const norm=val/rowSums[i];
          return(
            <g key={`${i}-${j}`}>
              <rect x={j*cellSize+60} y={i*cellSize+30} width={cellSize-2} height={cellSize-2} fill={i===j?`rgba(16,185,129,${norm*.9})`:`rgba(220,38,38,${norm*.7})`} rx="3"/>
              <text x={j*cellSize+60+cellSize/2} y={i*cellSize+30+cellSize/2-3} textAnchor="middle" fontSize="11" fontWeight="700" fill="white">{val}</text>
              <text x={j*cellSize+60+cellSize/2} y={i*cellSize+30+cellSize/2+10} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,.6)">{(norm*100).toFixed(0)}%</text>
            </g>
          );
        }))}
        {classes.map((c,i)=>(
          <g key={c}>
            <text x={i*cellSize+60+cellSize/2} y={24} textAnchor="middle" fontSize="9" fill="rgba(150,200,255,.8)">{c}</text>
            <text x={54} y={i*cellSize+30+cellSize/2+4} textAnchor="end" fontSize="9" fill="rgba(150,200,255,.8)">{c}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

interface KMeansClustersProps {
  k?: number;
  seed?: number;
}

export function KMeansClusters({ k=3, seed=1 }: KMeansClustersProps) {
  const { points, centroids } = useMemo(() => {
    const r = rng(seed);
    const centroids = Array.from({length:k}, () => [r(), r()]);
    const pts = Array.from({length:120}, () => {
      const cIdx = Math.floor(r() * k);
      const c = centroids[cIdx];
      return {
        x: c[0] + (r() - 0.5) * 0.25,
        y: c[1] + (r() - 0.5) * 0.25,
        cluster: cIdx
      };
    });
    return { points: pts, centroids };
  }, [k, seed]);

  const colors = [T.indigo, T.emerald, T.orange, T.red, T.violet];
  const size = 300;

  return (
    <div style={{ background: T.white, borderRadius: 12, padding: 16, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 12 }}>K-Means Clustering Visualization (k={k})</div>
      <svg width="100%" viewBox={`0 0 ${size} ${size}`}>
        {points.map((p, i) => (
          <circle key={i} cx={p.x * size} cy={p.y * size} r="3" fill={colors[p.cluster % colors.length]} opacity="0.6" />
        ))}
        {centroids.map((c, i) => (
          <g key={i}>
            <rect x={c[0] * size - 6} y={c[1] * size - 6} width={12} height={12} fill="white" stroke={colors[i % colors.length]} strokeWidth="2" rx="2" />
            <text x={c[0] * size} y={c[1] * size + 2} textAnchor="middle" fontSize="8" fontWeight="900" fill={colors[i % colors.length]}>{i + 1}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

interface XGBTreeVizProps {
  depth?: number;
  seed?: number;
}

interface TreeNode {
  id: string;
  isLeaf: boolean;
  val?: string;
  feat?: string;
  split?: string;
  left?: TreeNode;
  right?: TreeNode;
}

export function XGBTreeViz({ depth=3, seed=1 }: XGBTreeVizProps) {
  const root = useMemo(() => {
    const r = rng(seed);
    const gen = (d: number, p: string): TreeNode => {
      if (d >= depth || (d > 0 && r() < 0.2)) return { id: p, val: (r() * 2 - 1).toFixed(3), isLeaf: true };
      return { id: p, feat: ['Age', 'Income', 'Score'][Math.floor(r()*3)], split: (r()*100).toFixed(0), left: gen(d+1, p+'L'), right: gen(d+1, p+'R'), isLeaf: false };
    };
    return gen(0, 'root');
  }, [depth, seed]);

  const renderNode = (node: TreeNode, x: number, y: number, w: number): React.ReactNode => {
    if (node.isLeaf) {
      return (
        <g key={node.id}>
          <rect x={x - 20} y={y - 12} width={40} height={24} rx={6} fill={(parseFloat(node.val || '0')) > 0 ? T.greenL : T.redL} stroke={(parseFloat(node.val || '0')) > 0 ? T.green : T.red} strokeWidth={1} />
          <text x={x} y={y + 5} textAnchor="middle" fontSize={9} fontWeight={700} fill={(parseFloat(node.val || '0')) > 0 ? T.greenDk : T.red}>{node.val}</text>
        </g>
      );
    }
    const hDist = 30;
    return (
      <g key={node.id}>
        <line x1={x} y1={y} x2={x - w/2} y2={y + hDist} stroke={T.border} strokeWidth={1} />
        <line x1={x} y1={y} x2={x + w/2} y2={y + hDist} stroke={T.border} strokeWidth={1} />
        <rect x={x - 30} y={y - 14} width={60} height={28} rx={6} fill={T.white} stroke={T.border} strokeWidth={1.5} />
        <text x={x} y={y - 2} textAnchor="middle" fontSize={8} fill={T.muted}>{node.feat}</text>
        <text x={x} y={y + 8} textAnchor="middle" fontSize={9} fontWeight={700} fill={T.text}>≤ {node.split}</text>
        {node.left && renderNode(node.left, x - w/2, y + hDist, w/2)}
        {node.right && renderNode(node.right, x + w/2, y + hDist, w/2)}
      </g>
    );
  };

  return (
    <div style={{ background: T.white, borderRadius: 12, padding: 16, border: `1px solid ${T.border}`, overflowX: 'auto' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 16 }}>XGBoost Decision Tree Visualization</div>
      <svg width="100%" height={160} viewBox="0 0 360 160">
        {renderNode(root, 180, 20, 160)}
      </svg>
    </div>
  );
}
interface MetricsChartProps {
  data: TrainingDataPoint[];
  metric?: string;
}

export function MetricsChart({data, metric='loss'}: MetricsChartProps){
  if(!data.length)return(
    <div style={{height:160,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:T.subtle,gap:8}}>
      <div style={{fontSize:28}}>📈</div>
      <div style={{fontSize:12}}>Start training to see live metrics</div>
    </div>
  );
  const W=340,H=130,pl=42,pr=14,pt=8,pb=22,n=data.length;
  const keys=metric==='loss'?['loss','vloss']:metric==='lr'?['lr']:metric==='grad'?['grad_norm']:['acc','vacc'];
  const cols=['#4f46e5','#0ea5e9','#059669','#d97706'];
  const allV=data.flatMap((d: TrainingDataPoint)=>keys.map(k=>d[k]||0));
  const mn=Math.min(...allV)*.97,mx=Math.max(...allV)*1.03;
  const lx=(i:number)=>pl+i/(n-1||1)*(W-pl-pr);
  const ly=(v:number)=>pt+(H-pt-pb)*(1-(v-mn)/(mx-mn||1));
  const path=(key:string,col:string,dash:boolean)=>{
    const pts=data.map((d: TrainingDataPoint,i:number)=>`${i?'L':'M'}${lx(i).toFixed(1)},${ly(d[key]||0).toFixed(1)}`).join(' ');
    const area=`${pts}L${lx(n-1)},${H-pb}L${lx(0)},${H-pb}Z`;
    return(
      <g key={key}>
        <defs><linearGradient id={`mg-${key}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={col} stopOpacity=".25"/><stop offset="100%" stopColor={col} stopOpacity="0"/></linearGradient></defs>
        <path d={area} fill={`url(#mg-${key})`}/>
        <path d={pts} fill="none" stroke={col} strokeWidth={dash?1.5:2.5} strokeDasharray={dash?'5,3':''} strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx={lx(n-1)} cy={ly(data[n-1][key]||0)} r={3.5} fill={col}/>
      </g>
    );
  };
  const yticks=5;
  return(
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:'visible'}}>
        {Array.from({length:yticks},(_,i)=>{const v=mn+(mx-mn)*i/(yticks-1);return(<g key={i}><line x1={pl} x2={W-pr} y1={ly(v)} y2={ly(v)} stroke="rgba(200,215,240,.15)" strokeWidth=".5"/><text x={pl-6} y={ly(v)+3} textAnchor="end" fill="rgba(150,180,230,.6)" fontSize="7" fontFamily="monospace">{metric==='acc'?(v*100).toFixed(0)+'%':v<0.001?v.toExponential(1):v.toFixed(4)}</text></g>);})}
        {[...new Set([0, Math.floor(n/2), n-1])].map(i=><text key={i} x={lx(i)} y={H-pb+12} textAnchor="middle" fill="rgba(130,160,220,.5)" fontSize="7" fontFamily="monospace">{data[i]?.ep}</text>)}
        <line x1={pl} x2={pl} y1={pt} y2={H-pb} stroke="rgba(200,215,240,.2)" strokeWidth="1"/>
        <line x1={pl} x2={W-pr} y1={H-pb} y2={H-pb} stroke="rgba(200,215,240,.2)" strokeWidth="1"/>
        {keys.map((k,i)=>path(k,cols[i],i>0))}
      </svg>
      <div style={{display:'flex',gap:10,marginTop:6,justifyContent:'center',flexWrap:'wrap'}}>
        {keys.map((k,i)=><div key={k} style={{display:'flex',alignItems:'center',gap:5,fontSize:10,color:T.muted}}>
          <div style={{width:16,height:2,background:cols[i],borderRadius:1}}/>
          <span>{k}</span>
          <span style={{fontFamily:'JetBrains Mono',color:T.text2,fontWeight:600}}>{metric==='acc'?((data[n-1]?.[k]||0)*100).toFixed(1)+'%':(data[n-1]?.[k]||0).toFixed(5)}</span>
        </div>)}
      </div>
    </div>
  );
}

export function ComparePanel(){
  const [a,setA]=useState('mlp'),[b,setB]=useState('xgb');
  const ma=MODELS.find(m=>m.key===a)||MODELS[0],mb=MODELS.find(m=>m.key===b)||MODELS[0];
  const fields: [string, keyof Model | string, ((v: any) => string)?][] = [
    ['Category','cat'],['Subcategory','sub'],['Frameworks','fw',(v: any)=>v?.join(', ')],['Params','params'],['Year','year'],['Viz Type','viz']
  ];
  return(
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        {[['A',a,setA,T.indigo],['B',b,setB,T.violet]].map(([lbl,val,fn,col])=>(
          <div key={lbl as string}>
            <div style={{fontSize:9,fontWeight:700,color:col as string,letterSpacing:'.08em',marginBottom:4}}>MODEL {lbl as string}</div>
            <select value={val as string} onChange={e=>(fn as any)(e.target.value)} style={{width:'100%',padding:'7px 9px',borderRadius:7,border:`1.5px solid ${col}44`,fontSize:11,color:T.text,background:T.white,fontFamily:'inherit',cursor:'pointer'}}>
              {MODELS.map(m=><option key={m.key} value={m.key}>{m.label} — {m.name}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div style={{border:`1px solid ${T.border}`,borderRadius:8,overflow:'hidden'}}>
        <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr 1fr',background:T.surf2,padding:'8px 12px',fontWeight:700,fontSize:10,color:T.muted,letterSpacing:'.06em',textTransform:'uppercase'}}>
          <span>Field</span><span style={{color:T.indigo}}>{ma.label}</span><span style={{color:T.violet}}>{mb.label}</span>
        </div>
        {fields.map(([label,key,fn])=>{
          const va=fn?fn(ma[key as keyof Model]):ma[key as keyof Model],vb=fn?fn(mb[key as keyof Model]):mb[key as keyof Model];const diff=va!==vb;
          return(
            <div key={key} style={{display:'grid',gridTemplateColumns:'1.2fr 1fr 1fr',padding:'8px 12px',borderTop:`1px solid ${T.border}`,background:T.white}}>
              <span style={{fontSize:10.5,color:T.muted,fontWeight:600}}>{label}</span>
              <span style={{fontSize:10,color:diff?T.indigo:T.text2,fontFamily:'JetBrains Mono',fontWeight:diff?700:400}}>{String(va||'—')}</span>
              <span style={{fontSize:10,color:diff?T.violet:T.text2,fontFamily:'JetBrains Mono',fontWeight:diff?700:400}}>{String(vb||'—')}</span>
            </div>
          );
        })}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
        {[ma,mb].map((m,i)=>(
          <div key={m.key} style={{background:i===0?T.indigoL:T.violetL,borderRadius:8,padding:'10px 12px',border:`1px solid ${i===0?T.indigo:T.violet}22`}}>
            <div style={{fontSize:10,fontWeight:700,color:i===0?T.indigo:T.violet,marginBottom:6}}>{m.label} Pros</div>
            {m.pros?.map((p:string)=><div key={p} style={{fontSize:10,color:T.text2,marginBottom:2}}>✓ {p}</div>)}
          </div>
        ))}
      </div>
    </div>
  );
}

interface ExperimentTrackerProps {
  experiments: Experiment[];
  currentModel: string;
  currentFw: string;
  trainData: TrainingDataPoint[];
}

export function ExperimentTracker({experiments, currentModel, currentFw, trainData}: ExperimentTrackerProps){
  const [sel,setSel]=useState<string | null>(null);
  const live: any[] = trainData.length?[{id:'live',model:currentModel,fw:currentFw,ep:trainData.length,loss:trainData.at(-1)?.loss,acc:(trainData.at(-1)?.acc || 0)*100,vloss:trainData.at(-1)?.vloss,vacc:(trainData.at(-1)?.vacc || 0)*100,ts:'Live',status:'running',note:''}]:[];
  const all=[...live,...experiments];
  return(
    <div style={{display:'flex',flexDirection:'column',gap:0}}>
      <div style={{display:'grid',gridTemplateColumns:'1.2fr .9fr .7fr .7fr .6fr',padding:'6px 10px',background:T.surf2,borderRadius:'7px 7px 0 0',border:`1px solid ${T.border}`}}>
        {['Run / Time','Model','Loss','Acc','Status'].map(h=><div key={h} style={{fontSize:9,fontWeight:700,color:T.subtle,letterSpacing:'.07em',textTransform:'uppercase'}}>{h}</div>)}
      </div>
      {all.map((exp,i)=>{
        const isLive=exp.id==='live',isSel=sel===exp.id;
        return(
          <div key={exp.id}>
            <div onClick={()=>setSel(isSel?null:exp.id)} style={{display:'grid',gridTemplateColumns:'1.2fr .9fr .7fr .7fr .6fr',padding:'8px 10px',background:isSel?T.indigoL:i%2===0?T.white:T.surf,borderBottom:`1px solid ${T.border}`,cursor:'pointer',transition:'background .1s',borderLeft:`3px solid ${isSel?T.indigo:'transparent'}`}}>
              <div style={{fontSize:10,color:T.text2,display:'flex',alignItems:'center',gap:5}}>
                {isLive&&<span style={{width:6,height:6,borderRadius:'50%',background:T.green,display:'inline-block',animation:'pulse 1.2s infinite',flexShrink:0}}/>}
                #{exp.id==='live'?'—':exp.id} · {exp.ts}
              </div>
              <div style={{fontSize:10,color:T.muted,fontFamily:'JetBrains Mono'}}>{MODELS.find(m=>m.key===exp.model)?.label||exp.model}</div>
              <div style={{fontSize:10,fontFamily:'JetBrains Mono',color:T.orange}}>{(exp.loss||0).toFixed(4)}</div>
              <div style={{fontSize:10,fontFamily:'JetBrains Mono',color:T.green}}>{(exp.acc||0).toFixed(1)}%</div>
              <div><span style={{fontSize:9,padding:'2px 7px',borderRadius:4,background:exp.status==='done'?T.greenL:T.orangeL,color:exp.status==='done'?T.green:T.orange,fontWeight:600}}>{exp.status}</span></div>
            </div>
            {isSel&&(
              <div style={{padding:12,background:T.surf,borderBottom:`1px solid ${T.border}`,animation:'fadeUp .15s'}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:8}}>
                  {[['Val Loss',(exp.vloss||0).toFixed(5),'orange'],['Val Acc',(exp.vacc||0).toFixed(1)+'%','green'],['Epochs',exp.ep,'indigo'],['Framework',FW_META[exp.fw]?.name||exp.fw,'muted'],['Note',exp.note||'—','muted'],['Model',MODELS.find(m=>m.key===exp.model)?.name||exp.model,'text2']].map(([k,v,c])=>(
                    <div key={k as string} style={{background:T.white,padding:'7px 9px',borderRadius:6,border:`1px solid ${T.border}`}}>
                      <div style={{fontSize:8.5,color:T.subtle,textTransform:'uppercase',letterSpacing:'.06em'}}>{k as string}</div>
                      <div style={{fontSize:11,color:T[c as string]||T.text2,fontWeight:600,fontFamily:'JetBrains Mono',marginTop:2,wordBreak:'break-all'}}>{String(v)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
