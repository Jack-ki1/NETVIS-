import { useState, useRef } from 'react';

export function Tooltip({ children, content, pos = 'bottom' }: any) {
  const [show, setShow] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setCoords({
      x: rect.left + rect.width / 2,
      y: pos === 'bottom' ? rect.bottom + 6 : rect.top - 6
    });
    setShow(true);
  };

  return (
    <div ref={ref} style={{ display: 'inline-flex' }} onMouseEnter={handleEnter} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div style={{
          position: 'fixed',
          top: pos === 'bottom' ? coords.y : 'auto',
          bottom: pos === 'top' ? window.innerHeight - coords.y : 'auto',
          left: coords.x,
          transform: 'translateX(-50%)',
          background: '#1e293b',
          color: '#fff',
          fontSize: 10.5,
          padding: '6px 10px',
          borderRadius: 6,
          whiteSpace: 'nowrap',
          zIndex: 99999,
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontWeight: 500,
          letterSpacing: '0.01em'
        }}>
          {content}
        </div>
      )}
    </div>
  );
}
