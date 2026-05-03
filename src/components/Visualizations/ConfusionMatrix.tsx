import { T } from '../../lib/utils';
import { Model } from '../../schemas';

interface ConfusionMatrixProps {
  model: Model;
}

export function ConfusionMatrix({ model }: ConfusionMatrixProps) {
  const size = 10;
  const cells = Array.from({ length: size * size }, (_, i) => {
    const r = Math.floor(i / size);
    const c = i % size;
    const val = r === c ? 0.8 + Math.random() * 0.2 : Math.random() * 0.15;
    return { r, c, val };
  });

  return (
    <div style={{ padding: 16, background: T.surf2, borderRadius: 12, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 16, textTransform: 'uppercase' }}>Confusion Matrix (Simulated)</div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, 1fr)`, gap: 1 }}>
        {cells.map((cell, i) => (
          <div key={i} style={{ aspectRatio: '1/1', background: `rgba(99, 102, 241, ${cell.val})`, borderRadius: 2 }} />
        ))}
      </div>
    </div>
  );
}
