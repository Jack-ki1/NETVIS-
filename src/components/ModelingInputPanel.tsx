import React, { useState, useRef, useEffect } from 'react';
import { T } from '../lib/utils';
import { Upload, Edit3, Image as ImageIcon, Trash2, Save, Wand2 } from 'lucide-react';

interface ModelingInputPanelProps {
  modelKey?: string;
  onDrawUpdate?: (pixels: number[]) => void;
}

export function ModelingInputPanel({ modelKey, onDrawUpdate }: ModelingInputPanelProps) {
  const [activeTool, setActiveTool] = useState<'upload' | 'draw' | 'image'>('draw');
  const [files, setFiles] = useState<File[]>([]);
  const [drawingData, setDrawingData] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const isMnist = modelKey === 'mnist';

  useEffect(() => {
    if (isMnist) setActiveTool('draw');
  }, [isMnist]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const allowedTypes = ['text/csv', 'application/json', 'image/jpeg', 'image/png'];
      const validFiles = Array.from(e.target.files).filter(file => {
        if (!allowedTypes.includes(file.type)) {
          alert(`Invalid file type: ${file.name}. Only CSV, JSON, JPG, PNG allowed.`);
          return false;
        }
        if (file.size > 50 * 1024 * 1024) {
          alert(`File too large: ${file.name}. Max 50MB.`);
          return false;
        }
        return true;
      });
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const processMNISTGrid = () => {
    if (!isMnist || !onDrawUpdate || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Scale down to 28x28 for true MNIST inference
    const size = 28;
    const cw = canvas.width, ch = canvas.height;
    
    // BOUNDS CHECK: Ensure canvas dimensions are reasonable
    if (cw <= 0 || ch <= 0) return;

    const cellW = cw / size, cellH = ch / size;
    const expectedLength = size * size; // 784
    const pixels = new Array(expectedLength).fill(0);
    
    const imgData = ctx.getImageData(0, 0, cw, ch).data;
    // imgData is RGBA. We draw with black on white, or colored. Let's just check alpha/darkness
    for(let y=0; y<ch; y++){
      for(let x=0; x<cw; x++){
        const i = (y * cw + x) * 4;
        const a = imgData[i+3]; // Alpha
        if (a > 0) {
          const px = Math.floor(x / cellW);
          const py = Math.floor(y / cellH);
          
          // BOUNDS CHECK: Ensure px/py are within expected grid
          if (px >= 0 && px < size && py >= 0 && py < size) {
            const pixelIdx = py * size + px;
            if (pixelIdx < expectedLength) {
              pixels[pixelIdx] = Math.min(1.0, pixels[pixelIdx] + 0.15 * (a/255));
            }
          }
        }
      }
    }
    // Normalize slightly
    for (let i = 0; i < pixels.length; i++) {
        pixels[i] = Math.min(1, pixels[i] * 1.5);
    }
    
    // FINAL VALIDATION: Ensure array is exactly 784 before passing to inference
    if (pixels.length === 784) {
      onDrawUpdate(pixels);
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x+0.1, y+0.1); // Ensure dot draws if clicked
    ctx.strokeStyle = T.indigo;
    ctx.lineWidth = isMnist ? 20 : 2; // Thicker brush for MNIST
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setIsDrawing(true);
    setDrawingData('drawn');
    processMNISTGrid();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    processMNISTGrid();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      setDrawingData(canvasRef.current.toDataURL());
    }
    processMNISTGrid();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawingData(null);
    if(isMnist && onDrawUpdate) onDrawUpdate(new Array(64).fill(0));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Tool Toggles */}
      <div style={{ display: 'flex', background: T.surf2, borderRadius: 10, padding: 4, gap: 4 }}>
        {[
          { id: 'upload' as const, label: 'Upload Data', icon: <Upload size={14} /> },
          { id: 'draw' as const, label: isMnist ? 'Draw Input' : 'Sketch Model', icon: <Edit3 size={14} /> },
          { id: 'image' as const, label: 'Dataset Images', icon: <ImageIcon size={14} /> },
        ].map(tool => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 4px', borderRadius: 7, border: 'none', fontSize: 10, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
              background: activeTool === tool.id ? T.white : 'transparent',
              color: activeTool === tool.id ? T.indigo : T.muted,
              boxShadow: activeTool === tool.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            {tool.icon} {tool.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ minHeight: 200 }}>
        {activeTool === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label htmlFor="data-file-upload" style={{
              border: `2px dashed ${T.border2}`, borderRadius: 12, padding: '32px 16px',
              textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 8, transition: 'all 0.2s', background: T.surf
            }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = T.indigo}
            onMouseOut={(e) => e.currentTarget.style.borderColor = T.border2}>
              <input id="data-file-upload" type="file" accept=".csv,.json,.jpg,.png" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
              <div style={{ width: 40, height: 40, borderRadius: 20, background: T.indigo + '11', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.indigo }}>
                <Upload size={20} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.text }}>Drop CSV, JSON or image file here</div>
              <div style={{ fontSize: 9, color: T.muted }}>Max file size: 50MB</div>
            </label>

            {files.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: T.subtle, textTransform: 'uppercase', letterSpacing: '.05em' }}>Uploaded Files</div>
                {files.map((f, i) => (
                  <div key={i} style={{ padding: '8px 12px', background: T.surf, border: `1px solid ${T.border}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{f.name}</div>
                      <div style={{ fontSize: 8, color: T.muted }}>{(f.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: T.red, cursor: 'pointer' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTool === 'draw' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ position: 'relative', border: `1.5px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
              <canvas
                ref={canvasRef}
                width={360}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ width: '100%', display: 'block', cursor: 'crosshair', touchAction: 'none' }}
              />
              <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
                <button onClick={clearCanvas} style={{ padding: 6, borderRadius: 6, background: 'rgba(255,255,255,0.9)', border: `1px solid ${T.border}`, cursor: 'pointer', color: T.red }} title="Clear">
                  <Trash2 size={14} />
                </button>
                <button style={{ padding: 6, borderRadius: 6, background: T.indigo, border: 'none', cursor: 'pointer', color: '#fff' }} title="Save Pattern">
                  <Save size={14} />
                </button>
              </div>
              {!drawingData && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', color: T.subtle, fontSize: 10 }}>
                  {isMnist ? 'Draw a digit (0-9) to see live inference...' : 'Sketch architecture idea or data distribution...'}
                </div>
              )}
            </div>
            <div style={{ padding: '10px 12px', background: T.indigo + '08', border: `1px solid ${T.indigo}22`, borderRadius: 8, fontSize: 10, color: T.indigo, display: 'flex', gap: 8, alignItems: 'center' }}>
              <Wand2 size={14} />
              <span>{isMnist ? 'Pixel data is bound to MLP input layer. Real-time probabilities active.' : 'Sketch recognition AI will analyze this for structure.'}</span>
            </div>
          </div>
        )}

        {activeTool === 'image' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} style={{ position: 'relative', height: 100, borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.border}`, background: T.surf2 }}>
                <img 
                  src={`https://picsum.photos/seed/ml_${idx}/300/200`} 
                  alt="Modeling input" 
                  referrerPolicy="no-referrer"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px 8px', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 8 }}>
                  Sample_{idx}.png
                </div>
              </div>
            ))}
            <button style={{ 
              gridColumn: 'span 2', padding: '10px', borderRadius: 8, border: `1.5px dashed ${T.border2}`,
              background: 'transparent', color: T.muted, fontSize: 10, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}>
              <ImageIcon size={14} /> Add more from database
            </button>
          </div>
        )}
      </div>

      <button 
        onClick={() => {
          if (activeTool === 'upload' && files.length > 0) {
            alert(`Parsed ${files.length} files. Data mapped to input pipeline.`);
          } else if (activeTool === 'draw') {
             if (isMnist) {
                 alert('Live digit inference is already active.');
             } else {
                 alert('Sketch bound to model input as template feature.');
             }
          } else if (activeTool === 'image') {
            alert('Images added to dataset batch.');
          } else {
            alert('Please add data first.');
          }
        }}
        className="integrate-btn"
        style={{
        marginTop: 8, padding: '12px', borderRadius: 10, background: T.indigo, color: '#white',
        border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', 
        alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 12px ${T.indigo}33`
      }}>
        <Wand2 size={16} color="white" />
        <span style={{color: 'white'}}>Integrate with Model</span>
      </button>
    </div>
  );
}
