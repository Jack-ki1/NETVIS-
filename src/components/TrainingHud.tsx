import { T } from '../lib/utils';
import { useTrainingStore } from '../store/useTrainingStore';
import { MetricsChart } from './Tabs';

interface TrainingHudProps {
  startTrain: () => void;
  metricKey: string;
  setMetricKey: (k: string) => void;
}

export function TrainingHud({ startTrain, metricKey, setMetricKey }: TrainingHudProps) {
  const { isTraining, epoch, lossHistory, accuracyHistory } = useTrainingStore();
  
  const curLoss = lossHistory.at(-1);
  const curAcc = accuracyHistory.at(-1);
  const curVLoss = lossHistory.at(-1); // Simulated
  const curVAcc = accuracyHistory.at(-1); // Simulated

  const trainData = lossHistory.map((l, i) => ({ loss: l, acc: accuracyHistory[i], epoch: i }));

  return (
    <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: 'rgba(6,11,24,.9)', backdropFilter: 'blur(16px)', border: '1px solid rgba(80,120,220,.25)', borderRadius: 14, padding: '14px 20px', display: 'flex', gap: 20, alignItems: 'center', boxShadow: '0 12px 40px rgba(0,0,0,.5)', zIndex: 50 }}>
      {/* Training Progress Bar Overlay */}
      {isTraining && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: '14px 14px 0 0', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(epoch / 80) * 100}%`, background: T.green, transition: 'width 0.1s linear' }} />
        </div>
      )}

      <button onClick={startTrain} style={{ padding: '8px 22px', borderRadius: 9, fontSize: 12, fontWeight: 700, background: isTraining ? T.red : T.green, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: `0 2px 10px ${isTraining ? T.red : T.green}66`, letterSpacing: '.02em', flexShrink: 0 }}>
        {isTraining ? '■ Stop' : epoch >= 80 ? '↺ Reset' : '▶ Train'}
      </button>

      {curLoss !== undefined ? (
        <div aria-live="polite" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 16px', fontSize: 11, fontFamily: 'JetBrains Mono', flexShrink: 0 }}>
          <span style={{ color: '#fb923c' }}>loss <b>{curLoss.toFixed(4)}</b></span>
          <span style={{ color: '#34d399' }}>acc <b>{(curAcc! * 100).toFixed(1)}%</b></span>
          <span style={{ color: 'rgba(251,146,60,.55)' }}>val_loss {curVLoss?.toFixed(4)}</span>
          <span style={{ color: 'rgba(52,211,153,.55)' }}>val_acc {(curVAcc! * 100).toFixed(1)}%</span>
        </div>
      ) : <span aria-live="polite" style={{ fontSize: 11, color: 'rgba(130,160,230,.5)', fontFamily: 'JetBrains Mono' }}>Press Train to begin</span>}

      <div style={{ width: 240, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          {['loss', 'acc', 'lr', 'grad'].map(k => (
            <button 
              key={k} 
              onClick={() => setMetricKey(k)} 
              style={{ padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: metricKey === k ? 700 : 400, background: metricKey === k ? 'rgba(255,255,255,.15)' : 'transparent', color: metricKey === k ? 'white' : 'rgba(150,180,240,.45)', border: `1px solid ${metricKey === k ? 'rgba(255,255,255,.25)' : 'transparent'}`, cursor: 'pointer' }}
            >
              {k}
            </button>
          ))}
        </div>
        <MetricsChart data={trainData} metric={metricKey} />
      </div>
    </div>
  );
}
