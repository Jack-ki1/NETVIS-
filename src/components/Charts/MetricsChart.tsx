import { T } from '../../lib/utils';
import { TrainingDataPoint } from '../../types';

interface MetricsChartProps {
  data: TrainingDataPoint[];
  metric: string;
}

export function MetricsChart({ data, metric }: MetricsChartProps) {
  if (!data?.length) return <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: T.subtle }}>No metrics yet</div>;
  
  const vals = data.map((d: TrainingDataPoint) => (d[metric] as number) ?? 0);
  const mn = Math.min(...vals), mx = Math.max(...vals), rng2 = mx - mn || 1;
  const W = 240, H = 100;
  const pts = vals.map((v: number, i: number) => `${i ? 'L' : 'M'}${(i / (vals.length - 1)) * W},${H - ((v - mn) / rng2) * H}`).join(' ');

  return (
    <div style={{ position: 'relative', width: W, height: H }}>
      <svg width={W} height={H} style={{ overflow: 'visible' }}>
        <path d={pts} fill="none" stroke={metric === 'loss' ? T.orange : T.green} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
