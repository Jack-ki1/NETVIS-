interface HudTagProps {
  children: React.ReactNode;
  col?: string;
  anim?: boolean;
  sm?: boolean;
  style?: React.CSSProperties;
}

export function HudTag({children, col, anim, sm, style: s = {}}: HudTagProps){
  return(
    <div style={{padding:sm?'3px 8px':'5px 11px',borderRadius:7,background:'rgba(255,255,255,.05)',backdropFilter:'blur(8px)',border:`1px solid ${col?col+'44':'rgba(255,255,255,.1)'}`,fontSize:sm?8.5:10,color:col||'rgba(180,210,255,.85)',fontFamily:'JetBrains Mono',animation:anim?'fadeUp .15s':'none',display:'inline-flex',alignItems:'center',...s}}>
      {children}
    </div>
  );
}
