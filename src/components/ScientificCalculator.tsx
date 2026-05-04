import React, { useState } from 'react';
import { Delete, Eraser, MoveLeft, Hash, Percent, Divide, X, Minus, Plus, Equal, Type } from 'lucide-react';
import { cn } from '../lib/utils';

export const ScientificCalculator: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState<string[]>([]);
  const [isScientific, setIsScientific] = useState(true);

  const handleAction = (val: string) => {
    if (display === '0' || display === 'Error') {
      setDisplay(val);
    } else {
      setDisplay(prev => prev + val);
    }
  };

  const calculate = () => {
    try {
      // Basic sanitization and evaluation
      // Replace symbols for JS eval (simple implementation)
      const expression = display
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/π/g, 'Math.PI')
        .replace(/√\(/g, 'Math.sqrt(');
      
      const result = eval(expression);
      if (isNaN(result) || !isFinite(result)) throw new Error();
      
      const resStr = Number(result.toFixed(8)).toString();
      setHistory(prev => [display + ' = ' + resStr, ...prev.slice(0, 4)]);
      setDisplay(resStr);
    } catch (err) {
      setDisplay('Error');
      setTimeout(() => setDisplay('0'), 1500);
    }
  };

  const clear = () => {
    setDisplay('0');
  };

  const backspace = () => {
    setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  };

  const buttons = [
    { label: 'sin', val: 'sin(', type: 'func' },
    { label: 'cos', val: 'cos(', type: 'func' },
    { label: 'tan', val: 'tan(', type: 'func' },
    { label: 'ln', val: 'ln(', type: 'func' },
    { label: 'log', val: 'log(', type: 'func' },
    { label: '√', val: '√(', type: 'func' },
    { label: '(', val: '(', type: 'op' },
    { label: ')', val: ')', type: 'op' },
    { label: 'π', val: 'π', type: 'num' },
    { label: '^', val: '**', type: 'op' },
    { label: '7', val: '7', type: 'num' },
    { label: '8', val: '8', type: 'num' },
    { label: '9', val: '9', type: 'num' },
    { label: '÷', val: '÷', type: 'op' },
    { label: '4', val: '4', type: 'num' },
    { label: '5', val: '5', type: 'num' },
    { label: '6', val: '6', type: 'num' },
    { label: '×', val: '×', type: 'op' },
    { label: '1', val: '1', type: 'num' },
    { label: '2', val: '2', type: 'num' },
    { label: '3', val: '3', type: 'num' },
    { label: '-', val: '-', type: 'op' },
    { label: '0', val: '0', type: 'num' },
    { label: '.', val: '.', type: 'num' },
    { label: 'C', val: 'clear', type: 'clear' },
    { label: '+', val: '+', type: 'op' },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-md mx-auto">
      {/* Display */}
      <div className="bg-slate-900 p-8 text-right space-y-2">
        <div className="h-6 overflow-hidden">
          {history.length > 0 && (
            <span className="text-slate-500 text-xs font-mono">{history[0].split('=')[0]}</span>
          )}
        </div>
        <div className="text-4xl font-mono text-white truncate font-bold">
          {display}
        </div>
      </div>

      {/* Grid */}
      <div className="p-6 grid grid-cols-4 gap-3">
        {buttons.map((btn) => (
          <button
            key={btn.label}
            onClick={() => {
              if (btn.val === 'clear') clear();
              else handleAction(btn.val);
            }}
            className={cn(
              "h-14 rounded-2xl font-bold transition-all active:scale-95",
              btn.type === 'num' ? "bg-slate-50 text-slate-700 hover:bg-slate-100" :
              btn.type === 'op' ? "bg-brand/10 text-brand hover:bg-brand/20" :
              btn.type === 'func' ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs" :
              "bg-red-50 text-red-500 hover:bg-red-100"
            )}
          >
            {btn.label}
          </button>
        ))}
        <button 
          onClick={backspace}
          className="h-14 rounded-2xl bg-slate-50 text-slate-700 font-bold col-span-1 flex items-center justify-center hover:bg-slate-100"
        >
          <MoveLeft className="w-5 h-5" />
        </button>
        <button 
          onClick={calculate}
          className="h-14 rounded-2xl bg-brand text-white font-bold col-span-3 flex items-center justify-center hover:shadow-lg hover:shadow-brand/20 active:scale-95"
        >
          <Equal className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
