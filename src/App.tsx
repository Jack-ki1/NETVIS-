import { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useParams, Navigate } from "react-router-dom";
import { T, LC, FW_META } from "./lib/utils";
import { CanvasViz } from "./components/CanvasViz";
import React, { Suspense, lazy } from "react";

const AIChat = lazy(() => import("./components/AIChat").then(m => ({ default: m.AIChat })));
const AuthModal = lazy(() => import("./components/AuthModal").then(m => ({ default: m.AuthModal })));
import { TopNav } from "./components/TopNav";
import { Sidebar } from "./components/Sidebar";
import { TrainingHud } from "./components/TrainingHud";
import { TerminalLogs } from "./components/TerminalLogs";
import { HudTag } from "./components/HudTag";
import { useModelStore } from "./store/useModelStore";
import { useTrainingStore } from "./store/useTrainingStore";
import { useUIStore } from "./store/useUIStore";
import { useAuthStore } from "./store/useAuthStore";
import { useTrainingLoop } from "./hooks/useTrainingLoop";
import { useMnistInference } from "./hooks/useMnistInference";
import { supabase } from "./lib/supabase";

import { Experiment, HyperparamValue } from "./types";
import { User } from "@supabase/supabase-js";

function AppLayout() {
  const navigate = useNavigate();
  const { modelKey: urlModelKey, moduleId: urlModuleId } = useParams();
  
  const { selectedModel, framework, setSelectedModel, setHyperparams } = useModelStore();
  const { isTraining, epoch, resetTraining } = useTrainingStore();
  const { theme, isAIChatOpen, setAIChatOpen, setActiveModule, activeModule } = useUIStore();
  const { user, setUser } = useAuthStore();

  const [view, setView] = useState('3d');
  const [selLayer, setSelLayer] = useState<number|null>(null);
  const [metricKey, setMetricKey] = useState('loss');
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [notify, setNotify] = useState('');
  const [vizOpts, setVizOpts] = useState({showActivations:true,showWeights:true,showForward:true,showBackward:false});
  const [passProgress, setPassProgress] = useState(0);
  const [autoRotate, setAutoRotate] = useState(false);
  const [cam, setCam] = useState({rx:0.35,ry:-0.42,scale:0.82});
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(395);
  const [mnistInput, setMnistInput] = useState<number[]|null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>(['[NETVIS] System initialized. Ready for operations.']);

  const addLog = (msg: string) => {
    setTerminalLogs(p => {
      const ts = new Date().toISOString().substring(11, 19);
      const n = [...p, `[${ts}] ${msg}`];
      return n.length > 6 ? n.slice(n.length - 6) : n;
    });
  };

  const toast = (msg: string) => {
    setNotify(msg);
    addLog(msg.replace('✓ ', 'SUCCESS: ').replace('↻ ', 'EXEC: '));
    setTimeout(() => setNotify(''), 3000);
  };

  const { startTrain } = useTrainingLoop(toast, addLog, setExperiments);
  const { mnistProbabilities } = useMnistInference(mnistInput, selectedModel.key, addLog);

  // Sync URL to Store
  useEffect(() => {
    if (urlModelKey && urlModelKey !== selectedModel.key) {
      setSelectedModel(urlModelKey);
    }
    if (urlModuleId) {
      setActiveModule(urlModuleId);
    }
  }, [urlModelKey, urlModuleId, selectedModel.key, setSelectedModel, setActiveModule]);

  // Sync Store to URL
  useEffect(() => {
    if (selectedModel.key && activeModule) {
      const currentUrl = `/model/${selectedModel.key}/module/${activeModule}`;
      if (window.location.pathname !== currentUrl) {
         navigate(currentUrl, { replace: true });
      }
    }
  }, [selectedModel.key, activeModule, navigate]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, [setUser]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const handleMouseMove = (me: MouseEvent) => setSidebarWidth(Math.max(250, Math.min(800, startWidth + (me.clientX - startX))));
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ') { e.preventDefault(); startTrain(); }
      else if (e.key === '1') setView('2d');
      else if (e.key === '2') setView('3d');
      else if (e.key === '3') setView('train');
      else if (e.key === 'Escape') { setSelLayer(null); setAIChatOpen(false); setAuthModalOpen(false); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startTrain, setAIChatOpen, setView]);

  const selLayerData = selLayer != null && selectedModel.layers ? selectedModel.layers[selLayer] : null;

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:T.bg,fontFamily:'"DM Sans",system-ui,sans-serif',color:T.text,overflow:'hidden'}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        button,select,textarea,input{font-family:inherit}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:${T.border2};border-radius:2px}
        ::-webkit-scrollbar-track{background:transparent}
        @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        input[type=range]{height:4px;border-radius:2px;cursor:pointer;accent-color:${T.indigo}}
      `}</style>

      <TopNav view={view} setView={setView} vizOpts={vizOpts} setVizOpts={setVizOpts} autoRotate={autoRotate} setAutoRotate={setAutoRotate} setCam={setCam} setAuthModalOpen={setAuthModalOpen} />

      <div style={{flex:1,display:'flex',overflow:'hidden'}}>
        <Sidebar width={sidebarWidth} onMouseDown={handleMouseDown} selLayer={selLayer} setSelLayer={setSelLayer} mnistProbabilities={mnistProbabilities} setMnistInput={setMnistInput} setPassProgress={setPassProgress} toast={toast} experiments={experiments} metricKey={metricKey} setMetricKey={setMetricKey} />

        <div style={{flex:1,position:'relative',overflow:'hidden',background:T.canvasBg}}>
          <CanvasViz model={selectedModel} selLayer={selLayer} setSelLayer={setSelLayer} view={view} vizOpts={vizOpts} autoRotate={autoRotate} isDragging={isDragging} setIsDragging={setIsDragging} cam={cam} setCam={setCam} passProgress={passProgress} isNeural={!!selectedModel.layers?.length} vizType={selectedModel.viz||'neural'} isTraining={isTraining} liveActivations={mnistInput ? [mnistInput] : undefined} />

          <div style={{position:'absolute',top:12,left:12,display:'flex',flexDirection:'column',gap:6, pointerEvents: 'none', zIndex: 20}}>
            <div style={{display:'flex',gap:6}}>
              <HudTag>{selectedModel.icon} {selectedModel.label} · {FW_META[framework]?.name||framework}</HudTag>
              {view==='3d'&&<HudTag col={T.teal}>3D · DRAG TO ORBIT · SCROLL TO ZOOM</HudTag>}
              {selLayerData&&(
                <HudTag col={LC[selLayerData.t]||T.indigo} anim>Layer {selLayer}: {selLayerData.n} · ×{selLayerData.u} units · {selLayerData.t}</HudTag>
              )}
            </div>
          </div>

          <TerminalLogs logs={terminalLogs} />

          {view==='train'&&<TrainingHud startTrain={startTrain} metricKey={metricKey} setMetricKey={setMetricKey} />}

          {!isTraining&&(view==='2d'||view==='3d')&&(
            <div style={{position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', width: 300, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 20}}>
              <div style={{fontSize: 10, fontWeight: 600, color: T.subtle}}>Data Pass</div>
              <input type="range" min="0" max="1" step="0.01" value={passProgress} onChange={e=>setPassProgress(parseFloat(e.target.value))} style={{flex:1}}/>
            </div>
          )}

          {notify && <div style={{position:'absolute',top:60,left:'50%',transform:'translateX(-50%)',background:T.green,color:'#fff',padding:'8px 18px',borderRadius:8,fontSize:12,fontWeight:700,boxShadow:'0 4px 20px rgba(0,0,0,.25)',zIndex:999}}>{notify}</div>}

          <button 
            onClick={() => {
              if (user) {
                setAIChatOpen(!isAIChatOpen);
              } else {
                setAuthModalOpen(true);
                toast('Sign in to use NETVIS AI.');
              }
            }} 
            style={{ position: 'absolute', bottom: 24, right: 24, width: 48, height: 48, borderRadius: 24, background: 'var(--grad-main)', color: 'white', border: 'none', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150 }}
            title="NETVIS AI Assistant"
            aria-label="Toggle AI Chat"
          >✨</button>

          <Suspense fallback={null}>
            <AIChat model={selectedModel} framework={framework} epoch={epoch} isOpen={isAIChatOpen} onClose={() => setAIChatOpen(false)} onApplyHyperparams={(hp: Record<string, HyperparamValue>) => { setHyperparams(hp); toast('✓ Hyperparams applied'); resetTraining(); }} />
          </Suspense>
        </div>
      </div>
      <Suspense fallback={null}>
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onAuthSuccess={(u: User) => setUser(u)} />
      </Suspense>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/model/:modelKey/module/:moduleId" element={<AppLayout />} />
      <Route path="/" element={<Navigate to="/model/mnist/module/modeling" replace />} />
    </Routes>
  );
}
