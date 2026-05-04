import React, { useRef, useEffect, useState } from 'react';
import { Settings, RefreshCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { cn } from '../lib/utils';

export const InteractiveGrapher: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expression, setExpression] = useState('x^2');
  const [zoom, setZoom] = useState(40); // pixels per unit
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2 + offset.x;
    const centerY = height / 2 + offset.y;

    // Draw Grid
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = centerX % zoom; x < width; x += zoom) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    // Horizontal lines
    for (let y = centerY % zoom; y < height; y += zoom) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    // X axis
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    // Y axis
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Plot Function
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    let first = true;
    const step = 2; // px

    for (let px = 0; px < width; px += step) {
      const x = (px - centerX) / zoom;
      try {
        // Simple expression parser/evaluator
        const safeExpr = expression
          .replace(/x/g, `(${x})`)
          .replace(/\^/g, '**')
          .replace(/sin/g, 'Math.sin')
          .replace(/cos/g, 'Math.cos')
          .replace(/tan/g, 'Math.tan')
          .replace(/sqrt/g, 'Math.sqrt')
          .replace(/log/g, 'Math.log10')
          .replace(/ln/g, 'Math.log')
          .replace(/exp/g, 'Math.exp')
          .replace(/pi/g, 'Math.PI')
          .replace(/e/g, 'Math.E');

        const y = eval(safeExpr);
        const py = centerY - y * zoom;

        if (isNaN(y) || !isFinite(y)) {
          first = true;
          continue;
        }

        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else {
          ctx.lineTo(px, py);
        }
      } catch (e) {
        // Skip invalid points
      }
    }
    ctx.stroke();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        draw();
      }
    };

    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, [expression, zoom, offset]);

  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsMouseDown(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setLastMousePos({ x: clientX, y: clientY });
  };

  const handleInteractionMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isMouseDown) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const dx = clientX - lastMousePos.x;
    const dy = clientY - lastMousePos.y;
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastMousePos({ x: clientX, y: clientY });
  };

  const handleInteractionEnd = () => setIsMouseDown(false);

  return (
    <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[500px]">
      <div className="p-6 border-b border-slate-100 flex items-center gap-4">
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono italic">f(x) =</span>
          <input 
            type="text" 
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-4 py-3 text-sm focus:ring-2 focus:ring-brand/20 outline-none font-mono text-brand font-bold"
            placeholder="x^2"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setZoom(z => z * 1.2)} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100"><ZoomIn className="w-4 h-4 text-slate-500" /></button>
          <button onClick={() => setZoom(z => z / 1.2)} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100"><ZoomOut className="w-4 h-4 text-slate-500" /></button>
          <button onClick={() => { setOffset({x:0, y:0}); setZoom(40); }} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100"><RefreshCw className="w-4 h-4 text-slate-500" /></button>
        </div>
      </div>
      
      <div className="flex-1 relative bg-slate-50 cursor-move overflow-hidden">
        <canvas 
          ref={canvasRef}
          onMouseDown={handleInteractionStart}
          onMouseMove={handleInteractionMove}
          onMouseUp={handleInteractionEnd}
          onMouseLeave={handleInteractionEnd}
          onTouchStart={handleInteractionStart}
          onTouchMove={handleInteractionMove}
          onTouchEnd={handleInteractionEnd}
          className="absolute inset-0"
        />
        
        {/* Legend/Info overlay */}
        <div className="absolute bottom-6 left-6 p-4 bg-white/80 backdrop-blur rounded-2xl border border-slate-100 text-[10px] font-bold text-slate-500 uppercase pointer-events-none">
          Drag to Pan • Scroll to Zoom
        </div>
      </div>
    </div>
  );
};
