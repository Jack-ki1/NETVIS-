import { useState, useMemo } from 'react';
import { T, LC, FW_META, rng } from '../lib/utils';
import { MODELS } from '../data/models';

export function Chip({txt,col}: {txt:string,col:string}){
  return <span style={{display:'inline-flex',alignItems:'center',padding:'3px 9px',borderRadius:5,fontSize:10,fontWeight:600,background:col+'18',border:`1px solid ${col}33`,color:col}}>{txt}</span>;
}

import { Model } from '../schemas';

interface OverviewTabProps {
  model: Model;
  framework: string;
}

export function OverviewTab({model, framework}: OverviewTabProps){
  const col=model.cat==='Deep Learning'?T.indigo:T.green;
  return(
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div style={{background:`linear-gradient(135deg,${col}08,transparent)`,border:`1px solid ${col}22`,borderRadius:12,padding:14}}>
        <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
          <div style={{fontSize:32,lineHeight:1,flexShrink:0}}>{model.icon}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:T.text,lineHeight:1.3}}>{model.name}</div>
            <div style={{display:'flex',gap:5,marginTop:5,flexWrap:'wrap'}}>
              <Chip txt={model.cat} col={col}/><Chip txt={model.sub} col={col}/><Chip txt={String(model.year||'—')} col={T.muted}/>
              {model.params&&<Chip txt={`⚙ ${model.params} params`} col={T.muted}/>}
            </div>
          </div>
        </div>
        <p style={{fontSize:12,color:T.muted,lineHeight:1.72,marginTop:10,fontFamily:'DM Sans,sans-serif'}}>{model.desc}</p>
        
        {model.paper_url && (
          <div style={{marginTop:12}}>
            <a href={model.paper_url} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:6,background:T.surf,border:`1px solid ${T.border}`,color:col,fontSize:11,fontWeight:600,textDecoration:'none',fontFamily:'DM Sans,sans-serif',transition:'all 0.2s'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              View Original Paper
            </a>
          </div>
        )}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6}}>
        {[['Category',model.cat,col],['Sub',model.sub,col],['Year',model.year,'#94a3b8']].map(([k,v,c])=>(
          <div key={k as string} style={{background:T.surf,border:`1px solid ${T.border}`,borderRadius:7,padding:'9px 10px'}}>
            <div style={{fontSize:8.5,color:T.subtle,textTransform:'uppercase',letterSpacing:'.07em',fontWeight:700}}>{k as string}</div>
            <div style={{fontSize:11,color:c as string,fontWeight:700,marginTop:3,fontFamily:'JetBrains Mono'}}>{v as string}</div>
          </div>
        ))}
      </div>
      {model.use_cases&&(
        <div style={{display:'flex',flexDirection:'column',gap:7}}>
          <div style={{background:T.skyL,borderRadius:8,padding:'10px 12px',border:`1px solid ${T.sky}33`}}>
            <div style={{fontSize:10,fontWeight:700,color:T.sky,marginBottom:6}}>🎯 Use Cases</div>
            {model.use_cases.map((u:string)=><div key={u} style={{fontSize:10.5,color:T.text2,marginBottom:2}}>• {u}</div>)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>
            <div style={{background:T.greenL,borderRadius:8,padding:'10px 12px',border:`1px solid ${T.green}33`}}>
              <div style={{fontSize:10,fontWeight:700,color:T.green,marginBottom:5}}>✓ Strengths</div>
              {model.pros?.map((p:string)=><div key={p} style={{fontSize:10,color:T.text2,marginBottom:2}}>• {p}</div>)}
            </div>
            <div style={{background:T.redL,borderRadius:8,padding:'10px 12px',border:`1px solid ${T.red}33`}}>
              <div style={{fontSize:10,fontWeight:700,color:T.red,marginBottom:5}}>✗ Limitations</div>
              {model.cons?.map((c:string)=><div key={c} style={{fontSize:10,color:T.text2,marginBottom:2}}>• {c}</div>)}
            </div>
          </div>
        </div>
      )}
      <div>
        <div style={{fontSize:9.5,fontWeight:700,color:T.muted,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:6}}>Compatible Frameworks</div>
        <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
          {model.fw?.map((f:string)=>{const m=FW_META[f]||{name:f,color:T.indigo,bg:T.indigoL};return(
            <div key={f} style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:6,background:m.bg||T.indigoL,border:`1px solid ${m.color}44`}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:m.color}}/>
              <span style={{fontSize:10.5,color:m.color,fontWeight:500}}>{m.name}</span>
            </div>);})}
        </div>
      </div>
    </div>
  );
}

interface LayersTabProps {
  model: Model;
  selLayer: number | null;
  setSelLayer: React.Dispatch<React.SetStateAction<number | null>>;
}

export function LayersTab({model, selLayer, setSelLayer}: LayersTabProps){
  if(!model.layers?.length)return(
    <div style={{padding:30,textAlign:'center'}}>
      <div style={{fontSize:38,marginBottom:10}}>◎</div>
      <div style={{fontSize:13,color:T.muted,fontWeight:600}}>No Layer Architecture</div>
      <div style={{fontSize:11,color:T.subtle,marginTop:6,lineHeight:1.65}}>Classical ML models use statistical fitting procedures rather than stacked neural computation layers.</div>
    </div>
  );
  const total=model.layers.reduce((a,l)=>a+(l.u || 0),0);
  return(
    <div style={{display:'flex',flexDirection:'column',gap:3}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
        <div style={{fontSize:11,color:T.muted}}>{(model.layers || []).length} layers · {total} total units</div>
        {selLayer!=null&&<button onClick={()=>setSelLayer(null)} style={{fontSize:10,color:T.muted,background:'none',border:'none',cursor:'pointer'}}>✕ Clear</button>}
      </div>
      {(model.layers || []).map((layer, i)=>{
        const col=LC[layer.t]||T.indigo,sel=selLayer===i;
        const u = layer.u || 0;
        const maxU = Math.max(...(model.layers || []).map(l => l.u || 0), 1);
        return(
          <button key={i} onClick={()=>setSelLayer(i)} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:8,cursor:'pointer',background:sel?col+'18':T.surf,border:`1px solid ${sel?col+'77':T.border}`,textAlign:'left',transition:'all .12s',width:'100%',position:'relative',overflow:'hidden'}}>
            {sel&&<div style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:col,borderRadius:'4px 0 0 4px'}}/>}
            <div style={{width:8,height:8,borderRadius:'50%',background:col,flexShrink:0,boxShadow:`0 0 8px ${col}99`}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600,color:sel?col:T.text2,fontFamily:'JetBrains Mono'}}>{layer.n}</div>
              <div style={{fontSize:10,color:T.muted,marginTop:1}}>{layer.t} · ×{u} units{layer.desc?` · ${layer.desc}`:''}</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3}}>
              <div style={{fontSize:9,color:sel?col:T.subtle,background:sel?col+'22':T.surf2,padding:'2px 7px',borderRadius:4,fontFamily:'JetBrains Mono'}}>L{i}</div>
              <div style={{width:40,height:3,background:T.border2,borderRadius:2}}>
                <div style={{height:'100%',width:`${(u/maxU)*100}%`,background:col,borderRadius:2}}/>
              </div>
            </div>
          </button>
        );
      })}
      <div style={{marginTop:8,padding:'10px 12px',background:T.surf,borderRadius:8,border:`1px solid ${T.border}`}}>
        <div style={{fontSize:10,fontWeight:600,color:T.muted,marginBottom:6}}>Layer Type Legend</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
          {[...new Set(model.layers.map((l:any)=>l.t))].map((t:any)=>(
            <div key={t} style={{display:'flex',alignItems:'center',gap:4,fontSize:9,padding:'3px 8px',borderRadius:5,background:(LC[t]||T.indigo)+'18',border:`1px solid ${(LC[t]||T.indigo)}44`,color:LC[t]||T.indigo,fontFamily:'JetBrains Mono'}}>
              <div style={{width:5,height:5,borderRadius:'50%',background:LC[t]||T.indigo}}/>
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ... other tabs (Hyperparams, Code, Compare, etc.) can be added here
