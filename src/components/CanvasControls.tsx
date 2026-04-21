import { useState, useRef, useEffect } from 'react';
import { T } from '../lib/utils';
import { Tooltip } from './Tooltip';
import { Settings2, RotateCw, Camera } from 'lucide-react';

export function CanvasControls({vizOpts,setVizOpts,view,setView,onAutoRotate,autoRotate,setCam}: any){
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const Tog = ({label, k, tooltip}: any) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', gap: 12 }}>
      <Tooltip content={tooltip}>
        <span style={{ fontSize: 11, color: T.text2, fontWeight: 500 }}>{label}</span>
      </Tooltip>
      <button 
        onClick={() => setVizOpts((p:any) => ({...p,[k]:!p[k]}))} 
        style={{
          width: 32, height: 18, borderRadius: 9, position: 'relative', cursor: 'pointer',
          background: vizOpts[k] ? T.indigo : T.surf2, transition: 'all 0.2s', border: 'none'
        }}
      >
        <div style={{
          width: 14, height: 14, borderRadius: 7, background: '#fff', position: 'absolute',
          top: 2, left: vizOpts[k] ? 16 : 2, transition: 'all 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }} />
      </button>
    </div>
  );

  return(
    <div style={{display:'flex',gap:8,alignItems:'center'}}>
      {view === '3d' && (
        <>
          <Tooltip content="Auto-rotate the 3D camera">
            <button 
              onClick={onAutoRotate} 
              style={{padding:'7px',borderRadius:8,background:autoRotate?T.teal:T.surf,color:autoRotate?'#fff':T.muted,border:`1px solid ${autoRotate?T.teal:T.border}`,cursor:'pointer',display:'flex'}}
            >
              <RotateCw size={14} />
            </button>
          </Tooltip>
          <Tooltip content="Reset camera">
            <button 
              onClick={()=>setCam({rx:0.35,ry:-0.42,scale:0.82})} 
              style={{padding:'7px',borderRadius:8,background:T.surf,color:T.muted,border:`1px solid ${T.border}`,cursor:'pointer',display:'flex'}}
            >
              <Camera size={14} />
            </button>
          </Tooltip>
        </>
      )}

      {/* Viz Options Dropdown */}
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
            background: T.surf, border: `1px solid ${T.border}`, color: isOpen ? T.indigo : T.text2,
            fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <Settings2 size={14} />
          <span>Visual Config</span>
        </button>

        {isOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 220,
            background: T.white, border: `1px solid ${T.border}`, borderRadius: 12,
            padding: '12px 16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 1000,
            animation: 'fadeUp 0.15s ease-out'
          }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: T.subtle, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Layers & Dynamics</div>
            <Tog label="Node Activations" k="showActivations" tooltip="Toggle node activation glows"/>
            <Tog label="Connection Weights" k="showWeights" tooltip="Toggle connection weight lines"/>
            <div style={{ height: 1, background: T.border, margin: '8px 0' }} />
            <div style={{ fontSize: 9, fontWeight: 800, color: T.subtle, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Animation Passes</div>
            <Tog label="Forward Pass" k="showForward" tooltip="Animate forward propagation"/>
            <Tog label="Backprop Flow" k="showBackward" tooltip="Animate backward propagation (gradients)"/>
          </div>
        )}
      </div>
    </div>
  );
}
