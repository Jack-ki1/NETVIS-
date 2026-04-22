import { useEffect, useRef, useCallback } from 'react';
import { T, LC, rng, clamp, hexToRgb, rgbA } from '../lib/utils';

// Project a 3D point (x, y, z) to 2D with camera angles
function project3D(x: number, y: number, z: number, W: number, H: number, cam: any) {
  const {rx=0.35, ry=-0.42, scale=1} = cam;
  const cosY = Math.cos(ry), sinY = Math.sin(ry);
  const x1 = x * cosY + z * sinY, z1 = -x * sinY + z * cosY;
  const cosX = Math.cos(rx), sinX = Math.sin(rx);
  const y1 = y * cosX - z1 * sinX, z2 = y * sinX + z1 * cosX;
  const fov = 600, pz = fov + z2;
  const px = (x1 * fov / pz) * scale + W / 2;
  const py = (y1 * fov / pz) * scale + H / 2;
  return {px, py, depth: z2};
}

const COLOR_POSITIVE = '#38bdf8';
const COLOR_NEGATIVE = '#f472b6';

function drawNeuralCanvas(ctx: CanvasRenderingContext2D, W: number, H: number, layers: any[], opts: any) {
  const {
    frame=0, selLayer=null,
    view='2d', cam={rx:0.35,ry:-0.42,scale:0.85},
    activations=null,
    particles=[], showWeights=true, showActivations=true,
    passProgress=0, isBackward=false,
  } = opts;

  ctx.clearRect(0, 0, W, H);
  const bgGrad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)*0.75);
  bgGrad.addColorStop(0, '#0a1128');
  bgGrad.addColorStop(1, '#060b18');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.strokeStyle = T.canvasGrid;
  ctx.lineWidth = .4;
  for(let x=0;x<W;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  ctx.restore();

  if (!layers?.length) {
    ctx.fillStyle = 'rgba(150,180,240,.4)';
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Select a neural network model to visualize', W/2, H/2);
    return;
  }

  const padX = 70, padY = 55;
  const lw = layers.length > 1 ? (W - padX*2)/(layers.length-1) : 0;
  const r = rng(42);

  const layout = layers.map((layer, li) => {
    const x = padX + li * lw;
    const ng = Math.min(44, (H - padY*2)/Math.max(layer.u,1));
    const sy = H/2 - ng*(layer.u-1)/2;
    const nodes = Array.from({length: layer.u}, (_, ni) => {
      const baseAct = activations?.[li]?.[ni] ?? (r()*0.8+0.1);
      return {
        x2d: x, y2d: sy + ni*ng,
        x3d: x - W/2, y3d: sy + ni*ng - H/2, z3d: li*28,
        act: baseAct, ni, li,
      };
    });
    return {layer, li, x, ng, nodes};
  });

  function getPos(node: any) {
    if (view === '3d') {
      const p = project3D(node.x3d, node.y3d, node.z3d, W, H, cam);
      return {x: p.px, y: p.py, depth: p.depth};
    }
    return {x: node.x2d, y: node.y2d, depth: 0};
  }

  for (let li = 0; li < layout.length-1; li++) {
    const from = layout[li], to = layout[li+1];
    const passActive = passProgress > li/(layout.length-1);
    const backActive = isBackward && passProgress > (layout.length-2-li)/(layout.length-1);

    from.nodes.forEach((fn, fi) => {
      to.nodes.forEach((tn, ti) => {
        const fp = getPos(fn), tp = getPos(tn);
        const wSeed = rng(li*100+fi*10+ti);
        const w = wSeed() * 2 - 1;
        const wAbs = Math.abs(w);

        // Threshold rendering for cleaner visuals
        if (showActivations && activations && wAbs < 0.15) return;

        const wCol = w > 0 ? COLOR_POSITIVE : COLOR_NEGATIVE;
        const [r2,g2,b2] = hexToRgb(wCol);

        let alpha = showWeights ? 0.04 + wAbs*0.09 : 0.04;
        if (passActive && !isBackward) alpha = Math.min(alpha*2.5, 0.35);
        if (backActive) alpha = Math.min(alpha*2.5, 0.35);

        ctx.beginPath();
        ctx.moveTo(fp.x, fp.y);
        ctx.lineTo(tp.x, tp.y);
        ctx.strokeStyle = showWeights ? `rgba(${r2},${g2},${b2},${alpha})` : `rgba(50,90,200,${alpha})`;
        ctx.lineWidth = showWeights ? 0.5 + wAbs*0.8 : 0.5;
        ctx.stroke();
      });
    });
  }

  particles.forEach((p: any) => {
    const fromL = layout[p.li], toL = layout[p.li+1];
    if (!fromL || !toL) return;
    const fn = fromL.nodes[p.fi], tn = toL.nodes[p.ti];
    if (!fn || !tn) return;
    const fp = getPos(fn), tp = getPos(tn);
    const px = fp.x + (tp.x-fp.x)*p.prog, py = fp.y + (tp.y-fp.y)*p.prog;
    const col = LC[fromL.layer.t] || '#60a5fa';

    const trailLen = 5;
    for(let t2=0;t2<trailLen;t2++){
      const prog2 = Math.max(0, p.prog - t2*0.06);
      const tx2 = fp.x + (tp.x-fp.x)*prog2, ty2 = fp.y + (tp.y-fp.y)*prog2;
      ctx.beginPath();
      ctx.arc(tx2, ty2, 2.5-t2*0.4, 0, Math.PI*2);
      ctx.fillStyle = rgbA(col, (1-t2/trailLen)*0.4*p.alpha);
      ctx.fill();
    }
    const gr = ctx.createRadialGradient(px,py,0,px,py,7);
    gr.addColorStop(0, rgbA(col, 0.9*p.alpha));
    gr.addColorStop(1, rgbA(col, 0));
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(px,py,7,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(px,py,3,0,Math.PI*2);
    ctx.fillStyle = col; ctx.fill();
  });

  layout.forEach(({layer, li, nodes}) => {
    const sel = selLayer === li;
    const col = LC[layer.t] || '#60a5fa';
    const [cr,cg,cb] = hexToRgb(col);
    const passThrough = passProgress > li/(layout.length-1);

    nodes.forEach(node => {
      const pos = getPos(node);
      const act = showActivations ? node.act : 0.5;
      const glowR = (sel ? 22 : 10) + act * (frame%60/60)*3;
      const pulse = Math.abs(Math.sin(frame*0.05 + li*0.8 + node.ni*0.3));
      const depthScale = view==='3d' ? Math.max(0.4, 1 - node.z3d/400) : 1;
      const nR = (sel ? 9 : 6.5) * depthScale;

      const outerGlow = ctx.createRadialGradient(pos.x,pos.y,0,pos.x,pos.y,glowR*(1+pulse*.3));
      outerGlow.addColorStop(0, `rgba(${cr},${cg},${cb},${(sel?0.5:0.2)*act*(passThrough?0.8:1)*(depthScale)})`);
      outerGlow.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      ctx.fillStyle = outerGlow;
      ctx.beginPath(); ctx.arc(pos.x,pos.y,glowR*(1+pulse*.3),0,Math.PI*2); ctx.fill();

      if(showActivations) {
        const actGrad = ctx.createRadialGradient(pos.x-nR*.3,pos.y-nR*.3,0,pos.x,pos.y,nR);
        // Map color to activation (e.g. from dark blue to coral for mnist style)
        let actColor = col;
        if (activations && activations[li]) {
            const hAct = Math.max(0, activations[li][node.ni] || 0);
            actColor = hAct > 0.05 ? `rgba(${Math.min(255, 60 + hAct*190)}, ${140 - hAct*80}, ${255 - hAct*200}, 1)` : '#1e293b';
        } else {
            actColor = act > 0.5 ? col : '#334155';
        }
        actGrad.addColorStop(0, rgbA(actColor, 0.9));
        actGrad.addColorStop(1, rgbA(actColor, 0.6));
        ctx.fillStyle = actGrad;
        ctx.beginPath(); ctx.arc(pos.x,pos.y,nR,0,Math.PI*2); ctx.fill();

        ctx.beginPath();
        ctx.arc(pos.x,pos.y,nR,0,Math.PI*2);
        ctx.strokeStyle = rgbA(col, sel?0.95:0.7);
        ctx.lineWidth = sel?2.5:1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pos.x,pos.y,nR*0.6,-Math.PI/2,-Math.PI/2+act*Math.PI*2);
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.fillStyle = T.canvasBg;
        ctx.beginPath(); ctx.arc(pos.x,pos.y,nR,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle = rgbA(col, sel?0.9:0.55);
        ctx.lineWidth = sel?2.5:1.5;
        ctx.stroke();
      }

      if(view==='3d') {
        const highlight = ctx.createRadialGradient(pos.x-nR*.35,pos.y-nR*.35,0,pos.x,pos.y,nR);
        highlight.addColorStop(0,'rgba(255,255,255,0.25)');
        highlight.addColorStop(0.4,'rgba(255,255,255,0.05)');
        highlight.addColorStop(1,'rgba(0,0,0,0.2)');
        ctx.fillStyle = highlight;
        ctx.beginPath(); ctx.arc(pos.x,pos.y,nR,0,Math.PI*2); ctx.fill();
      }
    });

    const firstPos = getPos(nodes[0]);
    ctx.font = `${sel?'bold ':''} ${view==='3d'?8:9}px "JetBrains Mono",monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = sel ? col : 'rgba(150,180,230,.7)';
    ctx.fillText(layer.n, firstPos.x, firstPos.y - (sel?26:22));

    const lastPos = getPos(nodes[nodes.length-1]);
    ctx.font = `${view==='3d'?7:8}px monospace`;
    ctx.fillStyle = 'rgba(90,120,180,.55)';
    ctx.fillText(`×${layer.u}`, lastPos.x, lastPos.y + 18);
  });
}

function drawClassical(ctx: CanvasRenderingContext2D, W: number, H: number, vizType: string, frame: number) {
  ctx.clearRect(0,0,W,H);
  const bgGrad = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*.75);
  bgGrad.addColorStop(0,'#0a1128'); bgGrad.addColorStop(1,'#060b18');
  ctx.fillStyle=bgGrad; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle=T.canvasGrid; ctx.lineWidth=.4;
  for(let x=0;x<W;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  if(vizType==='tree'||vizType==='dendrogram') {
    const nodes=[{id:0,x:.5,y:.07,text:'x₁ ≤ 0.54',sub:'gini:0.621',leaf:false},{id:1,x:.26,y:.23,text:'x₂ ≤ 0.32',sub:'gini:0.441',leaf:false},{id:2,x:.74,y:.23,text:'x₃ ≤ 0.71',sub:'gini:0.513',leaf:false},{id:3,x:.12,y:.43,text:'Class A',sub:'p=0.91',leaf:true},{id:4,x:.40,y:.43,text:'x₄ ≤ 0.19',sub:'gini:0.284',leaf:false},{id:5,x:.60,y:.43,text:'Class B',sub:'p=0.86',leaf:true},{id:6,x:.88,y:.43,text:'x₁≤0.88',sub:'gini:0.364',leaf:false},{id:7,x:.30,y:.64,text:'Class B',sub:'p=0.78',leaf:true},{id:8,x:.50,y:.64,text:'Class C',sub:'p=0.83',leaf:true},{id:9,x:.76,y:.64,text:'Class A',sub:'p=0.70',leaf:true},{id:10,x:.96,y:.64,text:'Class C',sub:'p=0.92',leaf:true}];
    const edges=[[0,1,'≤'],[0,2,'>'],[1,3,'≤'],[1,4,'>'],[2,5,'≤'],[2,6,'>'],[4,7,'≤'],[4,8,'>'],[6,9,'≤'],[6,10,'>']];
    const px=(id:number)=>nodes[id].x*W, py=(id:number)=>nodes[id].y*H+20;
    edges.forEach(([a,b,lbl])=>{ctx.beginPath();ctx.moveTo(px(a as number),py(a as number)+15);ctx.lineTo(px(b as number),py(b as number)-15);ctx.strokeStyle='rgba(100,140,220,.55)';ctx.lineWidth=1.2;ctx.stroke();ctx.font='8px monospace';ctx.fillStyle='rgba(140,180,250,.7)';ctx.textAlign='center';ctx.fillText(lbl as string,(px(a as number)+px(b as number))/2+7,(py(a as number)+py(b as number))/2);});
    nodes.forEach(nd=>{const x=px(nd.id),y=py(nd.id),col=nd.leaf?'#fbbf24':'#60a5fa',bw=nd.leaf?68:88,bh=32;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x-bw/2,y-bh/2,bw,bh,6);else ctx.rect(x-bw/2,y-bh/2,bw,bh);ctx.fillStyle=col+'22';ctx.fill();ctx.strokeStyle=col+'aa';ctx.lineWidth=1.2;ctx.stroke();ctx.textAlign='center';ctx.font='8.5px monospace';ctx.fillStyle=col;ctx.fillText(nd.text,x,y-3);ctx.font='7px monospace';ctx.fillStyle='rgba(140,175,235,.65)';ctx.fillText(nd.sub,x,y+9);});
  } else if(vizType==='kmeans'||vizType==='clustering'||vizType==='dbscan'||vizType==='gmm'||vizType==='knn') {
    const centers=[{cx:.25,cy:.32,col:'#34d399'},{cx:.68,cy:.28,col:'#fb923c'},{cx:.45,cy:.72,col:'#a78bfa'}];
    const r2=rng(1337);
    const pts=centers.flatMap((c,ci)=>Array.from({length:40},()=>({x:clamp(c.cx+(r2()-.5)*.28,.04,.96),y:clamp(c.cy+(r2()-.5)*.28,.04,.96),ci})));
    const pulse=.85+Math.sin(frame*.04)*.15;
    for(let gx=0;gx<W;gx+=8){for(let gy=0;gy<H;gy+=8){let b=0,bd=Infinity;centers.forEach((c,ci)=>{const d=(gx/W-c.cx)**2+(gy/H-c.cy)**2;if(d<bd){bd=d;b=ci;}});ctx.fillStyle=centers[b].col+'0d';ctx.fillRect(gx,gy,8,8);}}
    pts.forEach(p=>{const x=p.x*W,y=p.y*H,col=centers[p.ci].col;const gr=ctx.createRadialGradient(x,y,0,x,y,6);gr.addColorStop(0,col+'cc');gr.addColorStop(1,col+'44');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();});
    centers.forEach((c,i)=>{const x=c.cx*W,y=c.cy*H,s=10*pulse;ctx.strokeStyle=c.col;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x-s,y-s);ctx.lineTo(x+s,y+s);ctx.moveTo(x+s,y-s);ctx.lineTo(x-s,y+s);ctx.stroke();ctx.beginPath();ctx.arc(x,y,18*pulse,0,Math.PI*2);ctx.strokeStyle=c.col+'55';ctx.lineWidth=1.5;ctx.stroke();ctx.font='bold 9px monospace';ctx.fillStyle=c.col;ctx.textAlign='center';ctx.fillText(`C${i+1}`,x,y-26);});
  } else if(vizType==='svm') {
    const r2=rng(42);
    const pts=[...Array.from({length:40},()=>({x:r2()*.42+.05,y:r2()*.65+.18,cls:0})),...Array.from({length:40},()=>({x:r2()*.42+.53,y:r2()*.65+.18,cls:1}))];
    const f=(x:number)=>-1.15*x+0.92,f1=(x:number)=>f(x)+0.09,f2=(x:number)=>f(x)-0.09;
    ctx.setLineDash([5,4]);[[f1,'#fb923c55'],[f2,'#60a5fa55']].forEach(([fn,col])=>{ctx.beginPath();ctx.moveTo(0,(fn as any)(0)*H);ctx.lineTo(W,(fn as any)(1)*H);ctx.strokeStyle=col as string;ctx.lineWidth=1;ctx.stroke();});
    ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(0,f(0)*H);ctx.lineTo(W,f(1)*H);ctx.strokeStyle='#34d399cc';ctx.lineWidth=2.5;ctx.stroke();
    pts.forEach(p=>{const x=p.x*W,y=p.y*H,col=p.cls===0?'#60a5fa':'#fb923c',sv=Math.abs(p.y-f(p.x))<0.115;if(sv){ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.strokeStyle=col+'88';ctx.lineWidth=1.5;ctx.stroke();}const gr=ctx.createRadialGradient(x,y,0,x,y,5);gr.addColorStop(0,col+'cc');gr.addColorStop(1,col+'44');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();});
    [['#60a5fa','● Class 0 (−ve)'],['#fb923c','● Class 1 (+ve)'],['#34d399','— Decision boundary'],['rgba(160,190,255,.6)','○ Support vectors']].forEach(([col,txt],i)=>{ctx.fillStyle=col;ctx.font='9px monospace';ctx.textAlign='left';ctx.fillText(txt,14,H-50+i*13);});
  } else if(vizType==='regression') {
    const r2=rng(99),n=60;
    const pts=Array.from({length:n},(_,i)=>{const x=i/n;return{x,y:0.65*x+0.1+(r2()-.5)*.22};});
    pts.forEach(p=>{const x=p.x*W,y=H-(p.y*H*.8+H*.1);const gr=ctx.createRadialGradient(x,y,0,x,y,5);gr.addColorStop(0,'#60a5facc');gr.addColorStop(1,'#60a5fa44');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y,4.5,0,Math.PI*2);ctx.fill();});
    ctx.beginPath();ctx.moveTo(0,H-(0.1*H*.8+H*.1));ctx.lineTo(W,H-(0.75*H*.8+H*.1));ctx.strokeStyle='#34d399cc';ctx.lineWidth=2;ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,H-(0.135*H*.8+H*.1));ctx.lineTo(W,H-(0.785*H*.8+H*.1));ctx.lineTo(W,H-(0.715*H*.8+H*.1));ctx.lineTo(0,H-(0.065*H*.8+H*.1));ctx.closePath();ctx.fillStyle='#34d39918';ctx.fill();
  } else if(vizType==='embedding') {
    const clusters=[{cx:.27,cy:.34,col:'#34d399',n:'A'},{cx:.65,cy:.27,col:'#fb923c',n:'B'},{cx:.43,cy:.70,col:'#a78bfa',n:'C'},{cx:.76,cy:.67,col:'#f472b6',n:'D'}];
    const r2=rng(42);
    clusters.forEach(c=>{Array.from({length:35},()=>{const x=clamp(c.cx+(r2()-.5)*.17,.04,.96)*W,y=clamp(c.cy+(r2()-.5)*.17,.04,.96)*H;const gr=ctx.createRadialGradient(x,y,0,x,y,5);gr.addColorStop(0,c.col+'cc');gr.addColorStop(1,c.col+'33');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y,4.5,0,Math.PI*2);ctx.fill();});ctx.font='bold 9px monospace';ctx.fillStyle=c.col;ctx.textAlign='center';ctx.fillText(c.n,c.cx*W,c.cy*H-26);});
  } else if(vizType==='forest') {
    Array.from({length:5},(_,ti)=>{const bx=(ti+.5)*(W/5),r2=rng(ti*17+1);const dn=(x:number,y:number,d:number,md:number)=>{if(d>md)return;const col=d===0?'#60a5fa':d===md?'#fbbf24':'#a78bfa';const gr=ctx.createRadialGradient(x,y,0,x,y,6);gr.addColorStop(0,col+'cc');gr.addColorStop(1,col+'44');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y,5.5,0,Math.PI*2);ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=1;ctx.stroke();if(d<md){const sp=80-d*20,ly=y+38;[x-sp/2,x+sp/2].forEach(cx=>{ctx.beginPath();ctx.moveTo(x,y+5.5);ctx.lineTo(cx,ly-5.5);ctx.strokeStyle='rgba(100,140,220,.35)';ctx.lineWidth=1;ctx.stroke();dn(cx,ly,d+1,md);});}};dn(bx,32,0,r2()<.5?2:3);});
  } else if(vizType==='boost') {
    Array.from({length:5},(_,i)=>{const x=(i+.5)*(W/5),yb=H*.12,ht=H*(0.13+i*.1),col=['#60a5fa','#34d399','#a78bfa','#fb923c','#f472b6'][i];const gr=ctx.createLinearGradient(x-30,yb,x+30,yb+ht);gr.addColorStop(0,col+'40');gr.addColorStop(1,col+'18');ctx.fillStyle=gr;ctx.strokeStyle=col+'aa';ctx.lineWidth=1.5;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x-32,yb,64,ht,5);else ctx.rect(x-32,yb,64,ht);ctx.fill();ctx.stroke();ctx.fillStyle=col;ctx.font='bold 8.5px monospace';ctx.textAlign='center';ctx.fillText(`T${i+1}`,x,yb+ht+14);if(i<4){ctx.fillStyle='rgba(150,180,230,.5)';ctx.font='14px monospace';ctx.fillText('→',x+44,H*.35);}});
    ctx.fillStyle='#34d399';ctx.font='bold 9px monospace';ctx.textAlign='center';ctx.fillText('⊕ Residual boosting — each tree corrects the prior error',W/2,H-12);
  }
}

export function CanvasViz({ model, selLayer, setSelLayer, view, vizOpts, autoRotate, isDragging, setIsDragging, cam, setCam, passProgress, isNeural, vizType, isTraining, liveActivations }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const frameRef = useRef(0);
  const particlesRef = useRef<any[]>([]);
  const dragStart = useRef<any>(null);
  const dragMoved = useRef(false);

  const camRef = useRef({ ...cam });

  // Sync prop to ref when prop changes (e.g. from Reset Cam)
  useEffect(() => {
    camRef.current = { ...cam };
  }, [cam]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const p = canvas.parentElement;
      if (p) {
        canvas.width = p.clientWidth;
        canvas.height = p.clientHeight;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, []);

  const handleMouseDown = useCallback((e: any) => {
    if (view !== '3d') return;
    setIsDragging(true);
    dragMoved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY, cam: { ...camRef.current } };
  }, [view, setIsDragging]);

  const handleMouseMove = useCallback((e: any) => {
    if (!isDragging || !dragStart.current) return;
    const dx = (e.clientX - dragStart.current.x) / 200;
    const dy = (e.clientY - dragStart.current.y) / 200;
    if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) dragMoved.current = true;
    camRef.current = { ...dragStart.current.cam, ry: dragStart.current.cam.ry + dx, rx: dragStart.current.cam.rx + dy, scale: dragStart.current.cam.scale };
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setCam({ ...camRef.current }); // Sync back to parent on release
  }, [setIsDragging, setCam]);

  const handleWheel = useCallback((e: any) => {
    if (view !== '3d') return;
    e.preventDefault();
    camRef.current.scale = clamp(camRef.current.scale - e.deltaY * 0.001, 0.4, 1.6);
    setCam({ ...camRef.current }); // Sync back
  }, [view, setCam]);

  const handleCanvasClick = useCallback((e: any) => {
    if (!isNeural || dragMoved.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const cy = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    if (view === '3d') {
      const W = canvas.width, H = canvas.height;
      const padX = 70, padY = 55;
      const lw = model.layers.length > 1 ? (W - padX*2)/(model.layers.length-1) : 0;
      
      let closestLi = -1;
      let minD = Infinity;
      
      model.layers.forEach((layer: any, li: number) => {
        const x = padX + li * lw;
        const ng = Math.min(44, (H - padY*2)/Math.max(layer.u,1));
        const sy = H/2 - ng*(layer.u-1)/2;
        
        for (let ni = 0; ni < layer.u; ni++) {
          const x3d = x - W/2, y3d = sy + ni*ng - H/2, z3d = li*28;
          const p = project3D(x3d, y3d, z3d, W, H, camRef.current);
          const d = Math.hypot(p.px - cx, p.py - cy);
          if (d < minD && d < 30) {
            minD = d;
            closestLi = li;
          }
        }
      });
      
      if (closestLi !== -1) {
        setSelLayer((p: any) => p === closestLi ? null : closestLi);
      } else {
        setSelLayer(null);
      }
    } else {
      const pad = 70, n = model.layers.length, lw = n > 1 ? (canvas.width - pad * 2) / (n - 1) : 0;
      const li = Math.round((cx - pad) / lw);
      if (li >= 0 && li < n) setSelLayer((p: any) => p === li ? null : li);
    }
  }, [isNeural, model, setSelLayer, view]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const tick = () => {
      frameRef.current++;
      const f = frameRef.current, ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
      if (!ctx) return;

      if (autoRotate && view === '3d' && !isDragging) {
        camRef.current.ry += 0.005;
      }

      if (isNeural && model.layers) {
        const spawnRate = isTraining ? 2 : 6;
        if (f % spawnRate === 0) {
          const layers = model.layers;
          for (let li = 0; li < layers.length - 1; li++) {
            if (Math.random() < 0.3) {
              particlesRef.current.push({
                li, fi: Math.floor(Math.random() * layers[li].u),
                ti: Math.floor(Math.random() * layers[li+1].u),
                prog: 0, speed: 0.012 + Math.random() * 0.013,
                alpha: 0.7 + Math.random() * 0.3,
                backward: vizOpts.showBackward && !vizOpts.showForward,
              });
            }
          }
        }
        particlesRef.current = particlesRef.current.map(p => {
          const speed = p.backward ? -p.speed : p.speed;
          return { ...p, prog: p.prog + speed };
        }).filter(p => p.backward ? p.prog > 0 : p.prog < 1);

        drawNeuralCanvas(ctx, W, H, model.layers, {
          frame: f, selLayer, view, cam: camRef.current,
          particles: particlesRef.current,
          showWeights: vizOpts.showWeights,
          showActivations: vizOpts.showActivations,
          passProgress,
          isBackward: vizOpts.showBackward && !vizOpts.showForward,
          activations: liveActivations
        });
      } else {
        drawClassical(ctx, W, H, vizType, f);
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [model, selLayer, view, autoRotate, vizOpts, isNeural, vizType, passProgress, isDragging, liveActivations]);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
