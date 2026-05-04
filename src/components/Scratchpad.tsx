import React, { useRef, useEffect, useState } from 'react';
import { Eraser, Pencil, Trash2, Download, Undo } from 'lucide-react';
import { cn } from '../lib/utils';

export const Scratchpad: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#3b82f6');
  const [brushSize, setBrushSize] = useState(3);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const temp = canvas.toDataURL();
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0);
          img.src = temp;
        }
      }
    };

    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, []);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setHistory(prev => [canvas.toDataURL(), ...prev.slice(0, 9)]);
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    saveToHistory();
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    ctx?.beginPath(); // Reset path
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineWidth = brushSize;
    ctx.strokeStyle = brushColor;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      saveToHistory();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[0];
      setHistory(prev => prev.slice(1));
    }
  };

  return (
    <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[500px]">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#000000'].map(color => (
            <button 
              key={color}
              onClick={() => setBrushColor(color)}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-transform",
                brushColor === color ? "border-slate-300 scale-110" : "border-transparent hover:scale-105"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
          <div className="w-px h-8 bg-slate-100 mx-2" />
          <button 
             onClick={() => setBrushColor('#ffffff')}
             className={cn("p-2 rounded-lg transition-all", brushColor === '#ffffff' ? "bg-brand/10 text-brand" : "text-slate-400 hover:bg-slate-50")}
          >
            <Eraser className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2">
          <button onClick={undo} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"><Undo className="w-5 h-5" /></button>
          <button onClick={clear} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg"><Trash2 className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="flex-1 bg-slate-50 relative cursor-crosshair">
        <canvas 
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
};
