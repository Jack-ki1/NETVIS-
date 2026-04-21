import { useState, useEffect, useRef, useMemo } from "react";
import { T, LC, FW_META, genTrainData, rng, clamp } from "./lib/utils";
import { MODELS } from "./lib/models";
import { CanvasViz } from "./components/CanvasViz";
import { ModelDropdown } from "./components/ModelDropdown";
import { CanvasControls } from "./components/CanvasControls";
import { OverviewTab, LayersTab, Chip } from "./components/RightPanel";
import { HyperparamPanel } from "./components/HyperparamPanel";
import { CodePanel } from "./components/CodePanel";
import { ModelingInputPanel } from "./components/ModelingInputPanel";
import { AttentionHeatmap, WeightHistogram, ConfusionMatrix, MetricsChart, ComparePanel, ExperimentTracker, Sparkline, KMeansClusters, XGBTreeViz } from "./components/Tabs";
import { AIChat } from "./components/AIChat";
import { CreativeEngine } from "./components/CreativeEngine";
import { SavedModelsPanel } from "./components/SavedModelsPanel";
import { AuthModal } from "./components/AuthModal";
import { Tooltip } from "./components/Tooltip";
import { Moon, Sun } from 'lucide-react';
import { supabase } from "./lib/supabase";

function HudTag({children,col,anim,sm,style:s={}}: any){
  return(
    <div style={{padding:sm?'3px 8px':'5px 11px',borderRadius:7,background:'rgba(255,255,255,.05)',backdropFilter:'blur(8px)',border:`1px solid ${col?col+'44':'rgba(255,255,255,.1)'}`,fontSize:sm?8.5:10,color:col||'rgba(180,210,255,.85)',fontFamily:'JetBrains Mono',animation:anim?'fadeUp .15s':'none',display:'inline-flex',alignItems:'center',...s}}>
      {children}
    </div>
  );
}

const INIT_EXPS=[
  {id:1,model:'cnn',fw:'pytorch',ep:60,loss:0.051,acc:98.8,vloss:0.068,vacc:97.9,ts:'10:24 AM',status:'done',note:'BN + Dropout'},
  {id:2,model:'transformer',fw:'pytorch',ep:45,loss:0.093,acc:96.5,vloss:0.118,vacc:95.1,ts:'09:51 AM',status:'done',note:'6-layer BERT-like'},
  {id:3,model:'xgb',fw:'xgboost',ep:500,loss:0.042,acc:99.1,vloss:0.058,vacc:98.3,ts:'09:12 AM',status:'done',note:'η=0.05, depth=6'},
];

export default function App(){
  const [modelKey,setModelKey]=useState('mlp');
  const [framework,setFramework]=useState('pytorch');
  const [view,setView]=useState('2d'); // '2d'|'3d'|'train'
  const [activeTab,setActiveTab]=useState('overview');
  const [isTraining,setIsTraining]=useState(false);
  const [epoch,setEpoch]=useState(0);
  const [trainData,setTrainData]=useState<any[]>([]);
  const [selLayer,setSelLayer]=useState<number|null>(null);
  const [metricKey,setMetricKey]=useState('loss');
  const [experiments,setExperiments]=useState<any[]>(INIT_EXPS);
  const [notify,setNotify]=useState('');
  const [vizOpts,setVizOpts]=useState({showActivations:true,showWeights:true,showForward:true,showBackward:false});
  const [passProgress,setPassProgress]=useState(0);
  const [autoRotate,setAutoRotate]=useState(false);
  const [cam,setCam]=useState({rx:0.35,ry:-0.42,scale:0.82});
  const [isDragging,setIsDragging]=useState(false);
  const [hyperparams,setHyperparams]=useState<any>(null);
  const [theme,setTheme]=useState<'light' | 'dark'>('light');
  
  const [user, setUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const epochRef=useRef(0);
  const trainDataRef=useRef<any[]>([]);
  const fullDataRef=useRef(genTrainData(80));

  const [sidebarWidth, setSidebarWidth] = useState(395);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(250, Math.min(800, startWidth + (moveEvent.clientX - startX)));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const model=useMemo(()=>MODELS.find(m=>m.key===modelKey)||MODELS[0],[modelKey]);
  const availFw=model.fw||['sklearn'];
  const isNeural=!!(model.layers?.length);
  const vizType=model.viz||'neural';

  const toast=(msg:string)=>{setNotify(msg);setTimeout(()=>setNotify(''),3000);};

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(()=>{
    setEpoch(0);setIsTraining(false);setTrainData([]);setSelLayer(null);setHyperparams(null);
    epochRef.current=0;trainDataRef.current=[];
    fullDataRef.current=genTrainData(80,Math.random()*9999|0);
    setPassProgress(0);
    if(!availFw.includes(framework))setFramework(availFw[0]);
  },[modelKey]);// eslint-disable-line

  useEffect(()=>{
    if(!isTraining)return;
    const id=setInterval(()=>{
      if(epochRef.current>=80){
        setIsTraining(false);
        const last=trainDataRef.current.at(-1);
        if(last){
          const newExp={id:Date.now(),model:modelKey,fw:framework,ep:80,loss:last.loss,acc:last.acc*100,vloss:last.vloss,vacc:last.vacc*100,ts:new Date().toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'}),status:'done',note:'NETVIS simulation'};
          setExperiments(p=>[newExp,...p.slice(0,9)]);
          toast(`✓ Training complete — Val Acc: ${(last.vacc*100).toFixed(1)}%`);
        }
        return;
      }
      epochRef.current++;
      trainDataRef.current=fullDataRef.current.slice(0,epochRef.current);
      setEpoch(epochRef.current);
      setTrainData([...trainDataRef.current]);
    },110);
    return()=>clearInterval(id);
  },[isTraining]);// eslint-disable-line

  const startTrain=()=>{
    if(epoch>=80){setEpoch(0);setTrainData([]);epochRef.current=0;trainDataRef.current=[];fullDataRef.current=genTrainData(80,Math.random()*9999|0, hyperparams);}
    setIsTraining(p=>!p);
    if(!isTraining)toast('▶ Training simulation started…');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === ' ') {
        e.preventDefault();
        startTrain();
      } else if (e.key === '1') {
        setView('2d');
      } else if (e.key === '2') {
        setView('3d');
      } else if (e.key === '3') {
        setView('train');
      } else if (e.key === 'Escape') {
        setSelLayer(null);
        setChatOpen(false);
        setAuthModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [epoch, isTraining, hyperparams]); // dependencies for startTrain

  const cur=trainData.at(-1);
  const dlCol=model.cat==='Deep Learning'?T.indigo:T.green;

  const tabs=[
    ['overview','Overview'],
    ['layers','Layers'],
    ['hyperparams','⚙ Params'],
    ['code','Code'],
    ['attention',model.viz==='neural'&&['transformer','bert','gpt'].includes(modelKey)?'Attention':null],
    ['weights','Weights'],
    ['confusion','Confusion'],
    ['metrics','Metrics'],
    ['compare','Compare'],
    ['experiments','Runs'],
  ].filter(([,l])=>l!=null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const sections = [
    { id: 'modeling', label: 'Modeling & Intelligence', icon: '🎨', component: (
      <div style={{display:'flex', flexDirection:'column', gap: 20}}>
        <OverviewTab model={model} framework={framework}/>
        <ModelingInputPanel />
        <CreativeEngine />
      </div>
    ) },
    { id: 'architecture', label: 'Architecture & Theory', icon: '🥞', component: (
      <div style={{display:'flex', flexDirection:'column', gap: 20}}>
        <LayersTab model={model} selLayer={selLayer} setSelLayer={setSelLayer}/>
        <CodePanel modelKey={modelKey} framework={framework}/>
      </div>
    ) },
    { id: 'optimization', label: 'Hyperparams & Tuning', icon: '⚙️', component: <HyperparamPanel model={model} onApply={(hp: any)=>{
      setHyperparams(hp);
      toast('✓ Hyperparams applied to simulation');
      setEpoch(0);setIsTraining(false);setTrainData([]);setSelLayer(null);
      epochRef.current=0;trainDataRef.current=[];
      fullDataRef.current=genTrainData(80,Math.random()*9999|0, hp);
    }}/> },
    { id: 'performance', label: 'Performance & Metrics', icon: '📊', component: (
      <div style={{display:'flex', flexDirection:'column', gap: 20}}>
        <div>
          <div style={{display:'flex',gap:5,flexWrap:'wrap', marginBottom: 12}}>
            {[['loss','📉 Loss'],['acc','📈 Accuracy'],['lr','📐 LR Schedule'],['grad','🌊 Grad Norm']].map(([k,l])=>(
              <button key={k} onClick={()=>setMetricKey(k)} style={{padding:'5px 12px',borderRadius:6,fontSize:10.5,fontWeight:500,background:metricKey===k?T.indigo:T.surf2,color:metricKey===k?'#fff':T.muted,border:`1px solid ${metricKey===k?T.indigo:T.border}`,cursor:'pointer',fontFamily:'inherit'}}>{l}</button>
            ))}
          </div>
          <MetricsChart data={trainData} metric={metricKey}/>
        </div>
        <ConfusionMatrix model={model}/>
        {modelKey === 'kmeans' && <KMeansClusters k={3} seed={42} />}
        {modelKey === 'xgb' && <XGBTreeViz depth={3} seed={7} />}
        {isNeural && ['transformer','bert','gpt'].includes(modelKey) && <AttentionHeatmap model={model}/>}
        {isNeural && (
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase'}}>Base Layer Weights</div>
            {model.layers?.slice(0,3).map((_:any,i:number)=><WeightHistogram key={i} layerIdx={i}/>)}
          </div>
        )}
      </div>
    )},
    { id: 'comparison', label: 'Benchmarking & History', icon: '⚖️', component: (
      <div style={{display:'flex', flexDirection:'column', gap: 24}}>
        <ComparePanel/>
        <ExperimentTracker experiments={experiments} currentModel={modelKey} currentFw={framework} trainData={trainData}/>
      </div>
    ) },
    { id: 'checkpoint', label: 'Checkpoints & Cloud', icon: '💾', component: (
      <SavedModelsPanel 
        user={user} 
        currentConfig={{
          modelKey,
          framework,
          hyperparams,
          epoch,
          accuracy: trainData.at(-1)?.acc * 100 || 0,
          loss: trainData.at(-1)?.loss || 0
        }}
        onLoad={(saved: any) => {
          setModelKey(saved.modelKey);
          setFramework(saved.framework);
          setHyperparams(saved.hyperparams);
          setEpoch(saved.epoch);
          // In a real app we'd load weights into the simulation here
          toast(`Loaded checkpoint: ${saved.name}`);
        }}
      />
    ) },
  ];

  const activeModule = sections.find(s => s.id === activeModuleId);

  const selLayerData = selLayer != null && model.layers ? model.layers[selLayer] : null;

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:T.bg,fontFamily:'"DM Sans",system-ui,sans-serif',color:T.text,overflow:'hidden'}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        button,select,textarea,input{font-family:inherit}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:${T.border2};border-radius:2px}
        ::-webkit-scrollbar-track{background:transparent}
        @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @keyframes popIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
        @keyframes slideRight{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
        input[type=range]{height:4px;border-radius:2px;cursor:pointer;accent-color:${T.indigo}}
      `}</style>

      {/* ── TOP NAV ── */}
      <nav style={{background:'var(--grad-main)',padding:'0 20px',display:'flex',alignItems:'center',gap:16,height:58,flexShrink:0,boxShadow:'0 4px 20px rgba(0,0,0,.15)',zIndex:100}}>
        {/* Logo */}
        <div style={{display:'flex',alignItems:'center',gap:12,paddingRight:20,borderRight:'1px solid rgba(255,255,255,0.15)',flexShrink:0}}>
          <div style={{width:34,height:34,borderRadius:10,background:'rgba(255,255,255,0.15)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,boxShadow:'0 4px 12px rgba(0,0,0,0.1)', color:'white', border: '1px solid rgba(255,255,255,0.2)'}}>◈</div>
          <div><div style={{fontSize:15,fontWeight:900,color:'white',letterSpacing:'-0.02em',lineHeight:1}}>NETVIS</div><div style={{fontSize:8,color:'rgba(255,255,255,0.7)',letterSpacing:'.1em',fontWeight:600}}>AI PLATFORM v4</div></div>
        </div>

        {/* Theme Switcher */}
        <div style={{display:'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)'}}>
          <button onClick={() => setTheme('light')} style={{ padding: '6px 12px', borderRadius: 8, background: theme === 'light' ? 'rgba(255,255,255,0.2)' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', color: 'white' }}><Sun size={15} /></button>
          <button onClick={() => setTheme('dark')} style={{ padding: '6px 12px', borderRadius: 8, background: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', color: 'white' }}><Moon size={15} /></button>
        </div>

        <div style={{height: 24, width: 1, background: T.border}} />

        {/* Model Picking */}
        <Tooltip content="Select Model Architecture">
          <div><ModelDropdown value={modelKey} onChange={(k:string)=>{setModelKey(k);setSelLayer(null);setActiveTab('overview');}}/></div>
        </Tooltip>

        {/* Framework / Language */}
        <div style={{display:'flex',gap:3,flexShrink:0}}>
          {availFw.map((f:string)=>{const fw=FW_META[f]||{name:f,color:T.indigo};const sel=framework===f;return(
            <Tooltip key={f} content={`Use ${fw.name} framework`}>
              <button 
                onClick={()=>setFramework(f)} 
                style={{
                  padding:'4px 10px',borderRadius:8,fontSize:10,fontWeight:sel?800:500,
                  background:sel?'rgba(255,255,255,1)':'rgba(255,255,255,0.1)',
                  color:sel?T.indigo:'rgba(255,255,255,0.9)',
                  border:`1px solid ${sel?'#fff':'rgba(255,255,255,0.2)'}`,
                  cursor:'pointer',transition:'all .15s',flexShrink:0,
                  boxShadow:sel?'0 2px 8px rgba(0,0,0,0.1)':'none'
                }}
              >
                {fw.name}
              </button>
            </Tooltip>
          );})}
        </div>

        <div style={{height: 24, width: 1, background: 'rgba(255,255,255,0.2)'}} />

        {/* View Toggles & Dropdown Config */}
        <div style={{display:'flex', alignItems:'center', gap: 10}}>
          <div style={{display:'flex',background:'rgba(0,0,0,0.15)',borderRadius:10,padding:4,gap:2,border:'1px solid rgba(255,255,255,0.1)',flexShrink:0}}>
            {[['2d','⬡ 2D'],['3d','◳ 3D'],['train','▶ Train']].map(([k,l])=>(
              <Tooltip key={k} content={`Switch to ${l} view`}>
                <button 
                  onClick={()=>setView(k as any)} 
                  style={{
                    padding:'5px 12px',borderRadius:7,fontSize:10.5,fontWeight:600,
                    background:view===k?'#fff':'transparent',
                    color:view===k?T.indigo:'rgba(255,255,255,0.8)',
                    border:'none',cursor:'pointer',transition:'all .15s',
                    boxShadow:view===k?'0 2px 6px rgba(0,0,0,0.1)':'none'
                  }}
                >{l}</button>
              </Tooltip>
            ))}
          </div>
          {(view==='2d'||view==='3d') && <CanvasControls vizOpts={vizOpts} setVizOpts={setVizOpts} view={view} setView={setView} onAutoRotate={()=>setAutoRotate(p=>!p)} autoRotate={autoRotate} setCam={setCam}/>}
        </div>

        <div style={{flex:1}}/>

        {/* Right side stats */}
        {cur&&(
          <div style={{display:'flex',gap:6,flexShrink:0}}>
            <Tooltip content="Current Loss"><Chip txt={`Loss ${cur.loss.toFixed(4)}`} col="#fb923c"/></Tooltip>
            <Tooltip content="Current Accuracy"><Chip txt={`Acc ${(cur.acc*100).toFixed(1)}%`} col="#34d399"/></Tooltip>
          </div>
        )}
        <div style={{display:'flex', alignItems:'center', gap: 6, background: 'rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)'}}>
          <Tooltip content="Model Category"><Chip txt={model.cat} col="white"/></Tooltip>
          
          <button 
            onClick={() => user ? supabase.auth.signOut() : setAuthModalOpen(true)} 
            style={{
              padding:'6px 14px',borderRadius:8,fontSize:11,fontWeight:800,
              background: user ? 'rgba(0,0,0,0.2)' : '#fff',
              color: user ? '#fff' : T.indigo,
              border:'none',cursor:'pointer', transition: 'all 0.2s',
              boxShadow: user ? 'none' : '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            {user ? 'Sign Out' : 'Sign In'}
          </button>
        </div>
      </nav>

      {/* ── BODY ── */}
      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        
        {/* ── LEFT PANEL ── */}
        <aside style={{width:sidebarWidth, position:'relative', flexShrink:0,background:'var(--grad-surface)',borderRight:`1px solid ${T.border}`,display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'3px 0 14px rgba(0,0,0,.04)', zIndex: 10}}>
          {activeModuleId === null ? (
            <div style={{flex:1, overflowY:'auto', padding: '24px 20px'}}>
              <div style={{marginBottom: 32}}>
                <div className="shimmer-text" style={{fontSize: 28, fontWeight: 900, color: T.text, letterSpacing: '-0.03em', background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #ec4899, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% auto'}}>Command Center</div>
                <div style={{fontSize: 12, color: T.muted, marginTop: 4, fontWeight: 500}}>Select a neural intelligence module</div>
              </div>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveModuleId(section.id)}
                    style={{
                      width: '100%', padding: '18px 20px', display: 'flex', alignItems: 'center', 
                      gap: 16, background: T.surf2, border: `1.5px solid ${T.border}`, borderRadius: 14,
                      cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = T.white;
                      e.currentTarget.style.borderColor = T.indigo;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = T.surf2;
                      e.currentTarget.style.borderColor = T.border;
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.03)';
                    }}
                  >
                    <div style={{fontSize: 24, width: 44, height: 44, borderRadius: 12, background: T.white, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.04)'}}>
                      {section.icon}
                    </div>
                    <div style={{flex: 1}}>
                      <div style={{fontSize: 13, fontWeight: 700, color: T.text}}>{section.label}</div>
                      <div style={{fontSize: 10, color: T.subtle, marginTop: 2, textTransform: 'uppercase', letterSpacing: '.04em'}}>Interact Utility</div>
                    </div>
                    <div style={{color: T.subtle, fontSize: 18}}>→</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{flex:1, display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
              {/* Back Header */}
              <div style={{padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12, background: T.surf}}>
                <button 
                  onClick={() => setActiveModuleId(null)}
                  style={{
                    width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', background: T.white, border: `1px solid ${T.border}`,
                    cursor: 'pointer', fontSize: 16, color: T.indigo
                  }}
                >
                  ←
                </button>
                <div>
                  <div style={{fontSize: 10, fontWeight: 800, color: T.indigo, textTransform: 'uppercase', letterSpacing: '.1em', lineHeight: 1}}>Active Module</div>
                  <div style={{fontSize: 14, fontWeight: 700, color: T.text, marginTop: 4}}>{activeModule?.label}</div>
                </div>
              </div>
              
              {/* Module Content */}
              <div style={{flex: 1, overflowY: 'auto', padding: '24px 20px', animation: 'slideRight 0.25s'}}>
                {activeModule?.component}
              </div>
            </div>
          )}

          {/* Resize Handle */}
          <div 
            onMouseDown={handleMouseDown}
            style={{
              position: 'absolute', top: 0, right: -2, bottom: 0, width: 4, cursor: 'col-resize',
              zIndex: 50, transition: 'background 0.2s', background: 'transparent'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = T.indigo + '44'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          />
        </aside>

        {/* ── CANVAS ── */}
        <div style={{flex:1,position:'relative',overflow:'hidden',background:T.canvasBg}}>
          {/* Overall Progress Bar during training */}
          {isTraining && (
            <div style={{position:'absolute', top: 0, left: 0, right: 0, height: 4, background: 'rgba(0,0,0,0.2)', zIndex: 10}}>
              <div style={{height: '100%', width: `${(epoch/80)*100}%`, background: T.green, transition: 'width 0.1s linear', boxShadow: `0 0 10px ${T.green}`}} />
            </div>
          )}

          <CanvasViz 
            model={model} selLayer={selLayer} setSelLayer={setSelLayer} 
            view={view} vizOpts={vizOpts} autoRotate={autoRotate} 
            isDragging={isDragging} setIsDragging={setIsDragging} 
            cam={cam} setCam={setCam} passProgress={passProgress} 
            isNeural={isNeural} vizType={vizType} isTraining={isTraining}
          />

          {/* Canvas HUD */}
          <div style={{position:'absolute',top:12,left:12,display:'flex',flexDirection:'column',gap:6, pointerEvents: 'none'}}>
            <div style={{display:'flex',gap:6}}>
              <HudTag>{model.icon} {model.label} · {FW_META[framework]?.name||framework}</HudTag>
              {view==='3d'&&<HudTag col={T.teal}>3D · DRAG TO ORBIT · SCROLL TO ZOOM</HudTag>}
              {selLayerData&&(
                <HudTag col={LC[selLayerData.t]||T.indigo} anim>
                  Layer {selLayer}: {selLayerData.n} · ×{selLayerData.u} units · {selLayerData.t}
                </HudTag>
              )}
            </div>
            <div style={{display:'flex',gap:5}}>
              {vizOpts.showActivations&&<HudTag col={T.emerald} sm>⚡ ACT</HudTag>}
              {vizOpts.showWeights&&<HudTag col={T.sky} sm>⚖ W</HudTag>}
              {vizOpts.showForward&&<HudTag col={T.indigo} sm>→ FWD</HudTag>}
              {vizOpts.showBackward&&<HudTag col={T.pink} sm>← BKWD</HudTag>}
            </div>
          </div>

          {/* Pass progress bar */}
          {isNeural&&(vizOpts.showForward||vizOpts.showBackward)&&(
            <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'transparent', pointerEvents: 'none'}}>
              <div style={{height:'100%',background:vizOpts.showBackward?T.pink:T.indigo,width:`${passProgress*100}%`,transition:'width .05s linear',boxShadow:`0 0 8px ${vizOpts.showBackward?T.pink:T.indigo}`}}/>
            </div>
          )}

          {/* Train panel */}
          {view==='train'&&(
            <div style={{position:'absolute',bottom:16,left:'50%',transform:'translateX(-50%)',background:'rgba(6,11,24,.9)',backdropFilter:'blur(16px)',border:'1px solid rgba(80,120,220,.25)',borderRadius:14,padding:'14px 20px',display:'flex',gap:20,alignItems:'center',boxShadow:'0 12px 40px rgba(0,0,0,.5)',animation:'fadeUp .2s',zIndex:50}}>
              <button onClick={startTrain} style={{padding:'8px 22px',borderRadius:9,fontSize:12,fontWeight:700,background:isTraining?T.red:T.green,color:'#fff',border:'none',cursor:'pointer',boxShadow:`0 2px 10px ${isTraining?T.red:T.green}66`,letterSpacing:'.02em',flexShrink:0}}>
                {isTraining?'■ Stop':epoch>=80?'↺ Reset':'▶ Train'}
              </button>
              {cur?(
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'3px 16px',fontSize:11,fontFamily:'JetBrains Mono',flexShrink:0}}>
                  <span style={{color:'#fb923c'}}>loss <b>{cur.loss.toFixed(4)}</b></span>
                  <span style={{color:'#34d399'}}>acc <b>{(cur.acc*100).toFixed(1)}%</b></span>
                  <span style={{color:'rgba(251,146,60,.55)'}}>val_loss {cur.vloss.toFixed(4)}</span>
                  <span style={{color:'rgba(52,211,153,.55)'}}>val_acc {(cur.vacc*100).toFixed(1)}%</span>
                </div>
              ):<span style={{fontSize:11,color:'rgba(130,160,230,.5)',fontFamily:'JetBrains Mono'}}>Press Train to simulate</span>}
              <div style={{width:240,flexShrink:0}}>
                <div style={{display:'flex',gap:4,marginBottom:6}}>
                  {['loss','acc','lr','grad'].map(k=><button key={k} onClick={()=>setMetricKey(k)} style={{padding:'2px 8px',borderRadius:4,fontSize:9,fontWeight:metricKey===k?700:400,background:metricKey===k?'rgba(255,255,255,.15)':'transparent',color:metricKey===k?'white':'rgba(150,180,240,.45)',border:`1px solid ${metricKey===k?'rgba(255,255,255,.25)':'transparent'}`,cursor:'pointer'}}>{k}</button>)}
                </div>
                <MetricsChart data={trainData} metric={metricKey}/>
              </div>
            </div>
          )}

          {/* Manual Pass Slider */}
          {!isTraining&&(view==='2d'||view==='3d')&&(
            <div style={{position:'absolute',bottom:24,left:'50%',transform:'translateX(-50%)',width:300,background:'rgba(15,23,42,0.85)',backdropFilter:'blur(12px)',border:`1px solid rgba(255,255,255,0.1)`,borderRadius:12,padding:'12px 16px',display:'flex',alignItems:'center',gap:12,boxShadow:'0 8px 32px rgba(0,0,0,0.3)',zIndex:20}}>
              <div style={{fontSize:10,fontWeight:600,color:T.subtle,whiteSpace:'nowrap'}}>Data Pass</div>
              <input type="range" min="0" max="1" step="0.01" value={passProgress} onChange={e=>setPassProgress(parseFloat(e.target.value))} style={{flex:1,accentColor:T.indigo}}/>
            </div>
          )}

          {/* Toast */}
          {notify&&(
            <div style={{position:'absolute',top:60,left:'50%',transform:'translateX(-50%)',background:T.green,color:'#fff',padding:'8px 18px',borderRadius:8,fontSize:12,fontWeight:700,boxShadow:'0 4px 20px rgba(0,0,0,.25)',animation:'popIn .2s',zIndex:999,whiteSpace:'nowrap'}}>
              {notify}
            </div>
          )}

          {/* Layer activations sidebar */}
          {selLayerData&&(
            <div style={{position:'absolute',bottom:16,left:16,width:200,background:'rgba(6,11,24,.88)',backdropFilter:'blur(12px)',border:`1px solid ${(LC[selLayerData.t]||T.indigo)}44`,borderRadius:10,padding:12,animation:'slideRight .2s', pointerEvents: 'none'}}>
              <div style={{fontSize:10,fontWeight:700,color:LC[selLayerData.t]||T.indigo,marginBottom:8,fontFamily:'JetBrains Mono'}}>
                {selLayerData.n} — Activations
              </div>
              {Array.from({length:Math.min(selLayerData.u,8)},(_,i)=>{
                const r2=rng(selLayer!*100+i);
                const act=clamp(r2()*.8+.15,0,1);
                const col=LC[selLayerData.t]||T.indigo;
                return(
                  <div key={i} style={{marginBottom:5}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                      <span style={{fontSize:8,color:'rgba(150,190,240,.6)',fontFamily:'JetBrains Mono'}}>n_{i}</span>
                      <span style={{fontSize:8,color:col,fontFamily:'JetBrains Mono'}}>{act.toFixed(3)}</span>
                    </div>
                    <div style={{height:4,background:'rgba(255,255,255,.08)',borderRadius:2}}>
                      <div style={{height:'100%',width:`${act*100}%`,background:col,borderRadius:2,boxShadow:`0 0 4px ${col}88`,transition:'width .3s'}}/>
                    </div>
                  </div>
                );
              })}
              {selLayerData.u>8&&<div style={{fontSize:8,color:'rgba(120,150,200,.5)',marginTop:4,fontFamily:'JetBrains Mono'}}>+{selLayerData.u-8} more nodes…</div>}
              <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid rgba(80,120,200,.2)',fontSize:8.5,color:'rgba(140,180,240,.7)',lineHeight:1.6}}>
                {selLayerData.desc||selLayerData.t}
              </div>
            </div>
          )}
          
          {/* AI Chat Button */}
          {user && (
            <button 
              onClick={() => setChatOpen(!chatOpen)}
              style={{
                position: 'absolute', bottom: 24, right: 24, width: 48, height: 48, borderRadius: 24,
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', border: 'none',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)', cursor: 'pointer', fontSize: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150
              }}
            >
              ✨
            </button>
          )}
          
          <AIChat 
            model={model} framework={framework} epoch={epoch} 
            isOpen={chatOpen} onClose={() => setChatOpen(false)}
            onApplyHyperparams={(hp: any) => {
              setHyperparams(hp);
              toast('✓ Hyperparams applied from AI suggestion');
              setActiveTab('hyperparams');
              setEpoch(0);setIsTraining(false);setTrainData([]);setSelLayer(null);
              epochRef.current=0;trainDataRef.current=[];
              fullDataRef.current=genTrainData(80,Math.random()*9999|0, hp);
            }}
          />
        </div>
      </div>
      
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onAuthSuccess={(u: any) => setUser(u)} />
    </div>
  );
}
