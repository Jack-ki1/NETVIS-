import { useUIStore } from '../store/useUIStore';
import { T } from '../lib/utils';
import { OverviewTab, LayersTab } from './RightPanel';
import { ModelingInputPanel } from './ModelingInputPanel';
import { useModelStore } from '../store/useModelStore';
import { useTrainingStore } from '../store/useTrainingStore';
import { useAuthStore } from '../store/useAuthStore';
import { genTrainData } from '../lib/utils';
import { Layer } from '../schemas';

import { Experiment, HyperparamValue, SavedModel } from '../types';
import React, { Suspense, lazy } from 'react';

const CreativeEngine = lazy(() => import('./CreativeEngine').then(m => ({ default: m.CreativeEngine })));
const CodePanel = lazy(() => import('./CodePanel').then(m => ({ default: m.CodePanel })));
const HyperparamPanel = lazy(() => import('./HyperparamPanel').then(m => ({ default: m.HyperparamPanel })));
const SavedModelsPanel = lazy(() => import('./SavedModelsPanel').then(m => ({ default: m.SavedModelsPanel })));
const Tabs = import('./Tabs');
const MetricsChart = lazy(() => Tabs.then(m => ({ default: m.MetricsChart })));
const ConfusionMatrix = lazy(() => Tabs.then(m => ({ default: m.ConfusionMatrix })));
const KMeansClusters = lazy(() => Tabs.then(m => ({ default: m.KMeansClusters })));
const XGBTreeViz = lazy(() => Tabs.then(m => ({ default: m.XGBTreeViz })));
const AttentionHeatmap = lazy(() => Tabs.then(m => ({ default: m.AttentionHeatmap })));
const WeightHistogram = lazy(() => Tabs.then(m => ({ default: m.WeightHistogram })));
const ComparePanel = lazy(() => Tabs.then(m => ({ default: m.ComparePanel })));
const ExperimentTracker = lazy(() => Tabs.then(m => ({ default: m.ExperimentTracker })));

const LoadingFallback = () => (
  <div style={{ padding: 20, textAlign: 'center', fontSize: 11, color: T.subtle }}>
    <div className="animate-pulse">Loading module...</div>
  </div>
);

interface SidebarProps {
  width: number;
  onMouseDown: (e: React.MouseEvent) => void;
  selLayer: number | null;
  setSelLayer: React.Dispatch<React.SetStateAction<number | null>>;
  mnistProbabilities: number[];
  setMnistInput: (pixels: number[] | null) => void;
  setPassProgress: (v: number) => void;
  toast: (msg: string) => void;
  experiments: Experiment[];
  metricKey: string;
  setMetricKey: (k: string) => void;
}

export function Sidebar({ width, onMouseDown, selLayer, setSelLayer, mnistProbabilities, setMnistInput, setPassProgress, toast, experiments, metricKey, setMetricKey }: SidebarProps) {
  const { activeModule, setActiveModule } = useUIStore();
  const { selectedModel, framework, hyperparams, setHyperparams, setSelectedModel, setFramework } = useModelStore();
  const { epoch, lossHistory, accuracyHistory, resetTraining, setTraining } = useTrainingStore();
  const { user } = useAuthStore();

  const isNeural = !!(selectedModel.layers?.length);

  const sections = [
    { id: 'modeling', label: 'Modeling & Intelligence', icon: '🎨', component: (
      <div style={{display:'flex', flexDirection:'column', gap: 20}}>
        <OverviewTab model={selectedModel} framework={framework}/>
        {selectedModel.key === 'mnist' && (
          <div style={{padding: 16, background: T.surf2, borderRadius: 12, border: `1px solid ${T.border}`}}>
            <div style={{fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 12}}>Live Predictions</div>
            <div style={{display: 'flex', gap: 8, height: 100, alignItems: 'flex-end'}}>
              {mnistProbabilities.map((prob: number, i: number) => (
                <div key={i} style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4}}>
                  <div style={{width: '100%', background: `rgba(99, 102, 241, ${prob})`, height: `${prob * 100}%`, borderRadius: '4px 4px 0 0', transition: 'height 0.2s, background 0.2s', minHeight: 4}} />
                  <div style={{fontSize: 10, fontWeight: 700, color: T.muted}}>{i}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <ModelingInputPanel modelKey={selectedModel.key} onDrawUpdate={(pixels) => {
            setMnistInput(pixels);
            setPassProgress(0.1); 
            setTimeout(() => setPassProgress(0.5), 100);
            setTimeout(() => setPassProgress(1.0), 200);
            setTimeout(() => setPassProgress(0), 400);
        }} />
        <CreativeEngine />
      </div>
    ) },
    { id: 'architecture', label: 'Architecture & Theory', icon: '🥞', component: (
      <div style={{display:'flex', flexDirection:'column', gap: 20}}>
        <LayersTab model={selectedModel} selLayer={selLayer} setSelLayer={setSelLayer}/>
        <CodePanel modelKey={selectedModel.key} framework={framework} selLayer={selLayer}/>
      </div>
    ) },
    { id: 'optimization', label: 'Hyperparams & Tuning', icon: '⚙️', component: <HyperparamPanel model={selectedModel} onApply={(hp: Record<string, HyperparamValue>)=>{
      setHyperparams(hp);
      toast('✓ Hyperparams applied to simulation');
      resetTraining();
    }}/> },
    { id: 'performance', label: 'Performance & Metrics', icon: '📊', component: (
      <div style={{display:'flex', flexDirection:'column', gap: 20}}>
        <div>
          <div style={{display:'flex',gap:5,flexWrap:'wrap', marginBottom: 12}}>
            {[['loss','📉 Loss'],['acc','📈 Accuracy'],['lr','📐 LR Schedule'],['grad','🌊 Grad Norm']].map(([k,l])=>(
              <button key={k} onClick={()=>setMetricKey(k)} style={{padding:'5px 12px',borderRadius:6,fontSize:10.5,fontWeight:500,background:metricKey===k?T.indigo:T.surf2,color:metricKey===k?'#fff':T.muted,border:`1px solid ${metricKey===k?T.indigo:T.border}`,cursor:'pointer',fontFamily:'inherit'}}>{l}</button>
            ))}
          </div>
          <MetricsChart data={lossHistory.map((l, i) => ({ loss: l, acc: accuracyHistory[i], epoch: i }))} metric={metricKey}/>
        </div>
        <ConfusionMatrix model={selectedModel}/>
        {selectedModel.key === 'kmeans' && <KMeansClusters k={3} seed={42} />}
        {selectedModel.key === 'xgb' && <XGBTreeViz depth={3} seed={7} />}
        {isNeural && ['transformer','bert','gpt'].includes(selectedModel.key) && <AttentionHeatmap model={selectedModel}/>}
        {isNeural && (
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{fontSize:10,fontWeight:700,color:T.muted,textTransform:'uppercase'}}>Base Layer Weights</div>
            {selectedModel.layers?.slice(0,3).map((_: Layer, i: number)=><WeightHistogram key={i} layerIdx={i}/>)}
          </div>
        )}
      </div>
    )},
    { id: 'comparison', label: 'Benchmarking & History', icon: '⚖️', component: (
      <div style={{display:'flex', flexDirection:'column', gap: 24}}>
        <ComparePanel/>
        <ExperimentTracker experiments={experiments} currentModel={selectedModel.key} currentFw={framework} trainData={lossHistory.map((l, i) => ({ loss: l, acc: accuracyHistory[i], epoch: i }))}/>
      </div>
    ) },
    { id: 'checkpoint', label: 'Checkpoints & Cloud', icon: '💾', component: (
      <SavedModelsPanel 
        user={user} 
        currentConfig={{
          modelKey: selectedModel.key,
          framework,
          hyperparams,
          epoch,
          accuracy: accuracyHistory.at(-1) || 0,
          loss: lossHistory.at(-1) || 0
        }}
        onLoad={(saved: SavedModel) => {
          setSelectedModel(saved.modelKey);
          setFramework(saved.framework);
          setHyperparams(saved.hyperparams);
          // In a real app we'd load weights into the simulation here
          toast(`Loaded checkpoint: ${saved.name}`);
        }}
      />
    ) },
  ];

  const activeModuleData = sections.find(s => s.id === activeModule);

  return (
    <aside style={{width, position:'relative', flexShrink:0,background:'var(--grad-surface)',borderRight:`1px solid ${T.border}`,display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'3px 0 14px rgba(0,0,0,.04)', zIndex: 10}}>
      {activeModule === 'transformer' ? ( // 'transformer' is default, meaning nothing selected
         <div style={{flex:1, overflowY:'auto', padding: '24px 20px'}}>
            <div style={{marginBottom: 32}}>
              <div className="shimmer-text" style={{fontSize: 28, fontWeight: 900, color: T.text, letterSpacing: '-0.03em', background: 'linear-gradient(90deg, #4f46e5, #7c3aed, #ec4899, #4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% auto'}}>Command Center</div>
              <div style={{fontSize: 12, color: T.muted, marginTop: 4, fontWeight: 500}}>Select a neural intelligence module</div>
            </div>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveModule(section.id)}
                  style={{
                    width: '100%', padding: '18px 20px', display: 'flex', alignItems: 'center', 
                    gap: 16, background: T.surf2, border: `1.5px solid ${T.border}`, borderRadius: 14,
                    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.03)'
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
          <div style={{padding: '16px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12, background: T.surf}}>
            <button onClick={() => setActiveModule('transformer')} style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.white, border: `1px solid ${T.border}`, cursor: 'pointer', fontSize: 16, color: T.indigo }}>←</button>
            <div>
              <div style={{fontSize: 10, fontWeight: 800, color: T.indigo, textTransform: 'uppercase', letterSpacing: '.1em', lineHeight: 1}}>Active Module</div>
              <div style={{fontSize: 14, fontWeight: 700, color: T.text, marginTop: 4}}>{activeModuleData?.label}</div>
            </div>
          </div>
          <div style={{flex: 1, overflowY: 'auto', padding: '24px 20px', animation: 'slideRight 0.25s'}}>
            <Suspense fallback={<LoadingFallback />}>
              {activeModuleData?.component}
            </Suspense>
          </div>
        </div>
      )}

      <div onMouseDown={onMouseDown} style={{ position: 'absolute', top: 0, right: -2, bottom: 0, width: 4, cursor: 'col-resize', zIndex: 50, transition: 'background 0.2s', background: 'transparent' }} />
    </aside>
  );
}
