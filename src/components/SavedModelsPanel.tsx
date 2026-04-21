import { useState, useEffect } from 'react';
import { T } from '../lib/utils';
import { persistenceService, SavedModel } from '../lib/persistence';
import { Save, Trash2, Download, Play, ShieldCheck, Database } from 'lucide-react';
import { Tooltip } from './Tooltip';

export function SavedModelsPanel({ user, currentConfig, onLoad }: any) {
  const [models, setModels] = useState<SavedModel[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refresh();
  }, [user]);

  const refresh = async () => {
    const data = await persistenceService.loadModels(user);
    setModels(data);
  };

  const saveCurrent = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await persistenceService.saveModel({
      name: name.trim(),
      ...currentConfig
    }, user);
    setName('');
    await refresh();
    setLoading(false);
  };

  const deleteModel = async (id: string) => {
    await persistenceService.deleteModel(id, user);
    await refresh();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Save Form */}
      <div style={{ background: 'var(--grad-surface)', padding: 16, borderRadius: 12, border: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.indigo, textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Save size={12} /> Save Current State
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Model configuration name..."
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 11, background: T.white, color: T.text, outline: 'none' }}
          />
          <button 
            onClick={saveCurrent}
            disabled={!name.trim() || loading}
            style={{ padding: '8px 16px', borderRadius: 8, background: T.indigo, color: '#white', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: (!name.trim() || loading) ? 0.5 : 1 }}
          >
            <span style={{color: 'white'}}>{loading ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
          <span>Saved Checkpoints ({models.length})</span>
          <span style={{ fontSize: 8, display: 'flex', alignItems: 'center', gap: 3 }}>
            <ShieldCheck size={10} color={user ? T.green : T.orange} />
            {user ? 'Cloud Sync Active' : 'Local Only (Guest)'}
          </span>
        </div>

        {models.map(m => (
          <div key={m.id} style={{ 
            padding: '12px', background: T.white, border: `1px solid ${T.border}`, borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
              <div style={{ fontSize: 9, color: T.muted, marginTop: 2, display: 'flex', gap: 8 }}>
                <span>{m.modelKey} · {m.framework}</span>
                <span>Acc: {(m.accuracy).toFixed(1)}%</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Tooltip content="Load Configuration">
                <button 
                  onClick={() => onLoad(m)}
                  style={{ padding: 6, borderRadius: 6, background: T.surf2, border: 'none', cursor: 'pointer', color: T.indigo }}
                >
                  <Play size={14} fill={T.indigo} />
                </button>
              </Tooltip>
              <button 
                onClick={() => deleteModel(m.id)}
                style={{ padding: 6, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: T.red }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        {models.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', border: `1px dashed ${T.border}`, borderRadius: 12 }}>
            <Database size={24} style={{ color: T.subtle, marginBottom: 8 }} />
            <div style={{ fontSize: 11, color: T.muted }}>No saved configurations yet.</div>
          </div>
        )}
      </div>
    </div>
  );
}
