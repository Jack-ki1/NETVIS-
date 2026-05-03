import { T } from '../lib/utils';

export function TerminalLogs({ logs }: { logs: string[] }) {
  return (
    <div style={{
      position: 'absolute', bottom: 12, left: 12, display: 'flex', flexDirection: 'column',
      gap: 2, pointerEvents: 'none', zIndex: 20, width: '400px',
      fontFamily: '"JetBrains Mono", monospace', fontSize: 9.5, opacity: 0.8
    }}>
      {logs.map((log, i) => (
        <div key={i} style={{
          color: log.includes('ERROR') ? T.red : log.includes('SUCCESS') ? T.emerald : T.sky,
          textShadow: '0 1px 2px rgba(0,0,0,0.8)'
        }}>
          {log}
        </div>
      ))}
    </div>
  );
}
