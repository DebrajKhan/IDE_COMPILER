import React, { useEffect, useRef } from 'react';

const VisualAnimationCanvas = ({ traces }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let startTime = null;
    let width, height;

    const resize = () => {
      const parent = canvas.parentElement;
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resize();
    window.addEventListener('resize', resize);

    const cellSize = 60, spacing = 10, TIME_PER_STEP = 1500;
    const C = {
      cellBg: '#2d2d2d', cellBorder: '#3c3c3c', accent: '#007acc',
      accentGlow: '#007acc', textBright: '#e0e0e0', textDim: '#858585',
      insert: '#007acc', updateFrom: '#cca700', updateTo: '#4ec9b0',
      traverse: '#3794ff', pointer: '#cca700',
    };

    const drawCell = (ctx, i, sx, sy, val, color, hl) => {
      const x = sx + i * (cellSize + spacing), y = sy;
      ctx.save();
      ctx.fillStyle = color;
      ctx.shadowColor = C.accentGlow;
      ctx.shadowBlur = hl * 15;
      ctx.strokeStyle = hl > 0 ? `rgba(0,122,204,${hl})` : C.cellBorder;
      ctx.lineWidth = hl > 0 ? 2 : 1;
      ctx.beginPath(); ctx.roundRect(x, y, cellSize, cellSize, 4); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = C.textDim; ctx.font = '11px monospace'; ctx.textAlign = 'center';
      ctx.fillText(`[${i}]`, x + cellSize/2, y + cellSize + 18);
      if (val !== null && val !== undefined) {
        ctx.fillStyle = C.textBright; ctx.font = 'bold 22px monospace';
        ctx.fillText(val, x + cellSize/2, y + cellSize/2 + 8);
      }
      ctx.restore();
    };

    const drawGlow = (ctx, text, x, y, a, sz=16) => {
      ctx.save();
      ctx.font = `600 ${sz}px 'Inter',sans-serif`; ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(0,122,204,${a})`; ctx.shadowColor = C.accentGlow; ctx.shadowBlur = 10;
      ctx.fillText(text, x, y); ctx.restore();
    };

    const draw = (ts) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      ctx.clearRect(0, 0, width, height);

      if (!traces || traces.length === 0) {
        ctx.fillStyle = C.textDim; ctx.font = '13px "Inter",sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Arrays and variables will animate here...', width/2, height/2);
        animationFrameId = requestAnimationFrame(draw); return;
      }

      const fin = elapsed >= traces.length * TIME_PER_STEP;
      const ci = fin ? traces.length-1 : Math.min(Math.floor(elapsed/TIME_PER_STEP), traces.length-1);
      const sp = fin ? 1 : (elapsed % TIME_PER_STEP) / TIME_PER_STEP;
      let st=[], co=[], hl=[], pi=-1, t1=0, t2=0;

      for (let i=0; i<ci; i++) { const t=traces[i]; if(t.state) st=[...t.state]; else if(t.action==='init') st=[...t.value]; }
      const ct = traces[ci];
      if (ct) {
        if (ct.action==='init') { t1=fin?1:Math.sin(sp*Math.PI); const v=ct.value||[]; st=v.slice(0,fin?v.length:Math.floor(sp*v.length)); }
        else if (ct.action==='insert'||ct.action==='access'||ct.action==='update'||ct.action==='traverse') { st=[...(ct.state||[])]; if(ct.action==='access') t2=fin?1:Math.sin(sp*Math.PI); }
      }

      co = new Array(st.length).fill(C.cellBg); hl = new Array(st.length).fill(0);
      if (ct && !fin) {
        if (ct.action==='insert') { const x=ct.index; if(x<hl.length){hl[x]=Math.sin(sp*Math.PI);co[x]=C.insert;} }
        else if (ct.action==='access') { const x=ct.index; if(x<hl.length) hl[x]=Math.sin(sp*Math.PI); }
        else if (ct.action==='update') { const x=ct.index; if(x<hl.length){hl[x]=Math.sin(sp*Math.PI);co[x]=sp>0.5?C.updateTo:C.updateFrom;} }
        else if (ct.action==='traverse') { const l=ct.length||st.length; pi=sp*l; const x=Math.floor(pi); if(x<hl.length){hl[x]=1;co[x]=C.traverse;} }
      }

      const n=Math.max(st.length,1), tw=(cellSize*n)+(spacing*(n-1));
      const sx=(width-tw)/2, sy=height/2-cellSize/2;
      if(t1>0) drawGlow(ctx,"Contiguous Memory Allocation",width/2,sy-30,t1);
      if(t2>0) drawGlow(ctx,"O(1) Random Access",width/2,sy-30,t2);
      for(let i=0;i<st.length;i++) drawCell(ctx,i,sx,sy,st[i],co[i],hl[i]);
      if(pi>=0) { const px=sx+(pi/st.length)*(st.length*(cellSize+spacing))-spacing/2; ctx.save(); ctx.shadowColor=C.pointer; ctx.shadowBlur=10; ctx.fillStyle=C.pointer; ctx.beginPath(); ctx.moveTo(px-8,sy+cellSize+36); ctx.lineTo(px+8,sy+cellSize+36); ctx.lineTo(px,sy+cellSize+24); ctx.fill(); ctx.restore(); }
      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animationFrameId); };
  }, [traces]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
};

export default VisualAnimationCanvas;
