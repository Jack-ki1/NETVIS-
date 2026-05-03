import React, { useState } from 'react';
import { T } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Download, RefreshCw, Wand2, Image as ImageIcon } from 'lucide-react';
import { GEMINI_MODEL_FLASH } from '../constants';

export function CreativeEngine() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: prompt
      });
      
      let found = false;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            setResult(`data:image/png;base64,${part.inlineData.data}`);
            found = true;
            break;
          }
        }
      }
      if (!found) throw new Error("No image data returned from model.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate image');
      // Fallback for demo if API fails
      setResult(`https://picsum.photos/seed/${encodeURIComponent(prompt)}/800/800`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ padding: '20px', background: T.indigo + '11', borderRadius: 16, border: `1px solid ${T.indigo}33` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Sparkles size={20} color={T.indigo} />
          <h2 style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: 0 }}>Creative Engine</h2>
        </div>
        <p style={{ fontSize: 12, color: T.muted, marginBottom: 20, lineHeight: 1.5 }}>
          Generate synthetic data assets, abstract concepts, or architectural backgrounds using multi-modal AI.
        </p>

        <div style={{ position: 'relative' }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the asset context (e.g., 'A neural network architecture visualized as a floating organic forest with bioluminescent data paths')"
            style={{
              width: '100%', height: 100, padding: '16px', borderRadius: 12, border: `1.5px solid ${T.border}`,
              background: T.white, color: T.text, fontSize: 13, resize: 'none', borderBottom: `3px solid ${T.indigo}`,
              outline: 'none', transition: 'border-color 0.2s'
            }}
          />
          <button
            onClick={generateImage}
            disabled={generating || !prompt.trim()}
            style={{
              position: 'absolute', bottom: 12, right: 12, padding: '8px 16px', borderRadius: 10,
              background: T.indigo, color: '#fff', border: 'none', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: (generating || !prompt.trim()) ? 0.6 : 1,
              boxShadow: `0 4px 12px ${T.indigo}44`
            }}
          >
            {generating ? <RefreshCw size={14} className="animate-spin" /> : <Wand2 size={14} />}
            {generating ? 'Imagining...' : 'Generate'}
          </button>
        </div>
      </div>

      <div style={{
        minHeight: 300, borderRadius: 16, background: T.surf2, border: `2px dashed ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative'
      }}>
        {result ? (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <img src={result} alt="Generated Asset" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 8 }}>
              <button onClick={() => window.open(result, '_blank')} style={{ padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <Download size={16} color={T.indigo} />
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: T.subtle }}>
            <ImageIcon size={48} style={{ opacity: 0.2, marginBottom: 12 }} />
            <div style={{ fontSize: 13, fontWeight: 600 }}>No asset generated yet</div>
            <div style={{ fontSize: 11 }}>Enter a prompt above to begin</div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: T.redL, color: T.red, fontSize: 11, fontWeight: 600 }}>
          ⚠️ {error}. Using placeholder for demonstration.
        </div>
      )}
    </div>
  );
}
