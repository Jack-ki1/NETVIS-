import { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { askNetvisAI } from '../lib/gemini';

import { Model } from '../schemas';
import { Message, HyperparamValue } from '../types';

interface AIChatProps {
  model: Model;
  framework: string;
  epoch: number;
  isOpen: boolean;
  onClose: () => void;
  onApplyHyperparams: (hp: Record<string, HyperparamValue>) => void;
}

interface ChatMessage extends Message {
  suggestedParams?: Record<string, HyperparamValue> | null;
}

export function AIChat({ model, framework, epoch, isOpen, onClose, onApplyHyperparams }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: `Hi! I'm NETVIS AI. I can help explain the **${model.name}** architecture, how it's implemented in **${framework}**, or suggest hyperparameter tuning strategies. What would you like to know?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const responseText = await askNetvisAI(userMsg, model.name, framework, epoch, messages);
      
      // Check for JSON hyperparams
      let cleanText = responseText;
      let suggestedParams = null;
      const jsonMatch = responseText.match(/\`\`\`json\n([\s\S]*?)\n\`\`\`/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.suggested_hyperparams) {
            suggestedParams = parsed.suggested_hyperparams;
            cleanText = responseText.replace(jsonMatch[0], '').trim();
          }
        } catch (e) {
          // ignore JSON parse error
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: cleanText, suggestedParams }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 54, bottom: 0, right: 0, width: 400,
      background: 'var(--white)', borderLeft: '1px solid var(--border)',
      boxShadow: '-4px 0 24px rgba(0,0,0,0.06)', zIndex: 200,
      display: 'flex', flexDirection: 'column', animation: 'slideRight 0.2s reverse'
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surf)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14 }}>✨</div>
          <div style={{ fontWeight: 700, color: 'var(--text)' }}>NETVIS AI</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--muted)' }}>×</button>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <div style={{
              background: m.role === 'user' ? '#4f46e5' : 'var(--surf2)',
              color: m.role === 'user' ? 'white' : 'var(--text2)',
              padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.6,
              borderBottomRightRadius: m.role === 'user' ? 2 : 12,
              borderBottomLeftRadius: m.role === 'assistant' ? 2 : 12,
            }}>
              <div className="markdown-body" style={{ color: 'inherit', fontSize: 'inherit' }}>
                <Markdown>{m.content}</Markdown>
              </div>
            </div>
            {m.suggestedParams && (
              <div style={{ marginTop: 8, background: 'var(--surf)', border: '1px solid var(--border)', padding: 10, borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5', marginBottom: 6 }}>Suggested Hyperparameters</div>
                {Object.entries(m.suggestedParams).map(([k, v]) => (
                  <div key={k} style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between', color: 'var(--text2)' }}>
                    <span>{k}</span><span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{String(v)}</span>
                  </div>
                ))}
                <button onClick={() => m.suggestedParams && onApplyHyperparams(m.suggestedParams)} style={{ marginTop: 8, width: '100%', padding: '4px 0', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Apply to Simulation</button>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', background: 'var(--surf2)', padding: '10px 14px', borderRadius: 12, fontSize: 13, color: 'var(--muted)' }}>
            Thinking...
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ padding: 16, borderTop: '1px solid var(--border)', background: 'var(--white)' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about this model..."
            style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none', background: 'var(--surf)', color: 'var(--text)' }}
          />
          <button onClick={handleSend} disabled={loading || !input.trim()} style={{ padding: '0 16px', borderRadius: 8, background: '#4f46e5', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', opacity: (loading || !input.trim()) ? 0.5 : 1 }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
