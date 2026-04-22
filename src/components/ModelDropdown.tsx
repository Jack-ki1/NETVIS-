import { useState, useRef, useMemo, useEffect } from 'react';
import { T } from '../lib/utils';
import { MODELS } from '../lib/models';

export function ModelDropdown({value,onChange}: any){
  const [open,setOpen]=useState(false);const [q,setQ]=useState('');const ref=useRef<HTMLDivElement>(null);
  const cur=MODELS.find(m=>m.key===value)||MODELS[0];
  const filtered=useMemo(()=>q?MODELS.filter(m=>[m.name,m.label,m.sub,m.cat].join(' ').toLowerCase().includes(q.toLowerCase())):MODELS,[q]);
  const groups=useMemo(()=>{const g:any={};filtered.forEach(m=>{const k=`${m.cat} › ${m.sub}`;if(!g[k])g[k]=[];g[k].push(m);});return g;},[filtered]);
  useEffect(()=>{const h=(e:any)=>{if(!ref.current?.contains(e.target))setOpen(false);};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h);},[]);
  return(
    <div ref={ref} style={{position:'relative',zIndex:400}}>
      <button 
        onClick={()=>setOpen(p=>!p)} 
        onMouseOver={(e) => { e.currentTarget.style.borderColor = T.indigo; e.currentTarget.style.backgroundColor = T.surf; }}
        onMouseOut={(e) => { e.currentTarget.style.borderColor = open ? T.indigo : T.border2; e.currentTarget.style.backgroundColor = T.white; }}
        style={{display:'flex',alignItems:'center',gap:8,padding:'7px 12px',background:T.white,border:`1.5px solid ${open?T.indigo:T.border2}`,borderRadius:9,cursor:'pointer',fontFamily:'inherit',boxShadow:open?`0 0 0 3px ${T.indigoL}`:'0 1px 3px rgba(0,0,0,.06)',transition:'all .2s cubic-bezier(0.4, 0, 0.2, 1)',minWidth:200}}
      >
        <span style={{fontSize:15,lineHeight:1}}>{cur.icon}</span>
        <div style={{flex:1,textAlign:'left'}}><div style={{fontSize:12,fontWeight:600,color:T.text,lineHeight:1.3}}>{cur.label}</div><div style={{fontSize:9.5,color:T.muted}}>{cur.cat} · {cur.sub}</div></div>
        <svg width="9" height="9" viewBox="0 0 9 9" style={{transform:open?'rotate(180deg)':'none',transition:'transform .2s',flexShrink:0}}><path d="M1 2.5l3.5 4 3.5-4" stroke={T.muted} strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
      </button>
      {open&&(
        <div style={{position:'absolute',top:'calc(100% + 6px)',left:0,width:320,background:T.white,border:`1.5px solid ${T.border}`,borderRadius:12,boxShadow:'0 20px 60px rgba(0,0,0,.16)',maxHeight:440,overflow:'hidden',display:'flex',flexDirection:'column',animation:'popIn .15s'}}>
          <div style={{padding:'10px 12px',borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',gap:7,padding:'7px 10px',background:T.surf,borderRadius:7,border:`1px solid ${T.border}`}}>
              <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="5" cy="5" r="3.5" stroke={T.subtle} strokeWidth="1.4" fill="none"/><line x1="8" y1="8" x2="11" y2="11" stroke={T.subtle} strokeWidth="1.4" strokeLinecap="round"/></svg>
              <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder={`Search ${MODELS.length} models…`} style={{border:'none',outline:'none',background:'none',fontSize:12,color:T.text,flex:1,fontFamily:'inherit'}}/>
              {q&&<button onClick={()=>setQ('')} style={{border:'none',background:'none',cursor:'pointer',color:T.subtle,fontSize:13,padding:0,lineHeight:1}}>×</button>}
            </div>
          </div>
          <div style={{overflowY:'auto',flex:1}}>
            {!Object.keys(groups).length&&<div style={{padding:24,textAlign:'center',color:T.muted,fontSize:12}}>No results for "{q}"</div>}
            {Object.entries(groups).map(([grp,ms]: any)=>(
              <div key={grp}>
                <div style={{padding:'5px 14px 3px',fontSize:9,fontWeight:700,color:T.subtle,letterSpacing:'.09em',background:T.surf2,textTransform:'uppercase',position:'sticky',top:0}}>{grp}</div>
                {ms.map((m:any)=>(
                  <button 
                    key={m.key} 
                    onClick={()=>{onChange(m.key);setOpen(false);setQ('');}} 
                    onMouseOver={(e) => { if(m.key!==value) e.currentTarget.style.backgroundColor = T.surf2; }}
                    onMouseOut={(e) => { if(m.key!==value) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    style={{display:'flex',alignItems:'center',gap:9,width:'100%',padding:'7px 14px',background:m.key===value?T.indigoL:'transparent',border:'none',cursor:'pointer',textAlign:'left',transition:'all .15s'}}
                  >
                    <span style={{fontSize:14,width:20,textAlign:'center',lineHeight:1}}>{m.icon}</span>
                    <div style={{flex:1}}><div style={{fontSize:12,fontWeight:m.key===value?600:400,color:m.key===value?T.indigo:T.text2}}>{m.label}</div><div style={{fontSize:9.5,color:T.muted,marginTop:1}}>{m.name}</div></div>
                    <span style={{fontSize:9,color:T.subtle,background:T.surf2,padding:'2px 6px',borderRadius:4}}>{m.year}</span>
                    {m.key===value&&<span style={{color:T.indigo,fontSize:12}}>✓</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div style={{padding:'7px 12px',borderTop:`1px solid ${T.border}`,display:'flex',justifyContent:'space-between',flexShrink:0}}>
            <span style={{fontSize:9,color:T.subtle}}>{filtered.length}/{MODELS.length} models</span>
            <span style={{fontSize:9,color:T.subtle}}>PyTorch · TF · JAX · sklearn</span>
          </div>
        </div>
      )}
    </div>
  );
}
