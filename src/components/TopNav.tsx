import { Sun, Moon } from 'lucide-react';
import { ModelDropdown } from './ModelDropdown';
import { Tooltip } from './Tooltip';
import { CanvasControls } from './CanvasControls';
import { Chip } from './RightPanel';
import { T, FW_META } from '../lib/utils';
import { useUIStore } from '../store/useUIStore';
import { useModelStore } from '../store/useModelStore';
import { useTrainingStore } from '../store/useTrainingStore';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { CanvasCamera, VizOptions } from '../types';

interface TopNavProps {
  view: string;
  setView: (v: string) => void;
  vizOpts: VizOptions;
  setVizOpts: React.Dispatch<React.SetStateAction<VizOptions>>;
  autoRotate: boolean;
  setAutoRotate: React.Dispatch<React.SetStateAction<boolean>>;
  setCam: React.Dispatch<React.SetStateAction<CanvasCamera>>;
  setAuthModalOpen: (o: boolean) => void;
}

export function TopNav({ view, setView, vizOpts, setVizOpts, autoRotate, setAutoRotate, setCam, setAuthModalOpen }: TopNavProps) {
  const { theme, toggleTheme } = useUIStore();
  const { selectedModel, framework, setFramework, setSelectedModel } = useModelStore();
  const { lossHistory, accuracyHistory } = useTrainingStore();
  const { user } = useAuthStore();

  const curLoss = lossHistory.at(-1);
  const curAcc = accuracyHistory.at(-1);

  return (
    <nav className="grad-animate" style={{ background: 'var(--grad-main)', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 16, height: 58, flexShrink: 0, boxShadow: '0 4px 20px rgba(0,0,0,.15)', zIndex: 100 }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: 20, borderRight: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>◈</div>
        <div><div style={{ fontSize: 15, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1 }}>NETVIS</div><div style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)', letterSpacing: '.1em', fontWeight: 600 }}>AI PLATFORM v4</div></div>
      </div>

      {/* Theme Switcher */}
      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={toggleTheme} style={{ padding: '6px 12px', borderRadius: 8, background: theme === 'light' ? 'rgba(255,255,255,0.2)' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', color: 'white' }}><Sun size={15} /></button>
        <button onClick={toggleTheme} style={{ padding: '6px 12px', borderRadius: 8, background: theme === 'dark' ? 'rgba(255,255,255,0.2)' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', color: 'white' }}><Moon size={15} /></button>
      </div>

      <div style={{ height: 24, width: 1, background: T.border }} />

      {/* Model Picking */}
      <Tooltip content="Select Model Architecture">
        <div><ModelDropdown value={selectedModel.key} onChange={setSelectedModel} /></div>
      </Tooltip>

      {/* Framework / Language */}
      <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
        {selectedModel.fw.map((f: string) => {
          const fw = FW_META[f] || { name: f, color: T.indigo };
          const sel = framework === f;
          return (
            <Tooltip key={f} content={`Use ${fw.name} framework`}>
              <button
                onClick={() => setFramework(f)}
                style={{
                  padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: sel ? 800 : 500,
                  background: sel ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.1)',
                  color: sel ? T.indigo : 'rgba(255,255,255,0.9)',
                  border: `1px solid ${sel ? '#fff' : 'rgba(255,255,255,0.2)'}`,
                  cursor: 'pointer', transition: 'all .15s', flexShrink: 0,
                  boxShadow: sel ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {fw.name}
              </button>
            </Tooltip>
          );
        })}
      </div>

      <div style={{ height: 24, width: 1, background: 'rgba(255,255,255,0.2)' }} />

      {/* View Toggles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: 4, gap: 2, border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
          {[['2d', '⬡ 2D'], ['3d', '◳ 3D'], ['train', '▶ Train']].map(([k, l]) => (
            <Tooltip key={k} content={`Switch to ${l} view`}>
              <button
                onClick={() => setView(k as any)}
                style={{
                  padding: '5px 12px', borderRadius: 7, fontSize: 10.5, fontWeight: 600,
                  background: view === k ? '#fff' : 'transparent',
                  color: view === k ? T.indigo : 'rgba(255,255,255,0.8)',
                  border: 'none', cursor: 'pointer', transition: 'all .15s',
                  boxShadow: view === k ? '0 2px 6px rgba(0,0,0,0.1)' : 'none'
                }}
              >{l}</button>
            </Tooltip>
          ))}
        </div>
        {(view === '2d' || view === '3d') && <CanvasControls vizOpts={vizOpts} setVizOpts={setVizOpts} view={view} setView={setView} onAutoRotate={() => setAutoRotate((p: boolean) => !p)} autoRotate={autoRotate} setCam={setCam} />}
      </div>

      <div style={{ flex: 1 }} />

      {/* Right side stats */}
      {curLoss !== undefined && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <Tooltip content="Current Loss"><Chip txt={`Loss ${curLoss.toFixed(4)}`} col="#fb923c" /></Tooltip>
          <Tooltip content="Current Accuracy"><Chip txt={`Acc ${(curAcc! * 100).toFixed(1)}%`} col="#34d399" /></Tooltip>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
        <Tooltip content="Model Category"><Chip txt={selectedModel.cat} col="white" /></Tooltip>

        <button
          onClick={() => user ? supabase.auth.signOut() : setAuthModalOpen(true)}
          style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 800,
            background: user ? 'rgba(0,0,0,0.2)' : '#fff',
            color: user ? '#fff' : T.indigo,
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: user ? 'none' : '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          {user ? 'Sign Out' : 'Sign In'}
        </button>
      </div>
    </nav>
  );
}
