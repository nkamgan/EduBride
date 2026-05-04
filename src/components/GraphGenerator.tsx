import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MathRenderer } from './MathRenderer';

interface GraphGeneratorProps {
  expression: string;
  lang: 'en' | 'fr';
}

export const GraphGenerator: React.FC<GraphGeneratorProps> = ({ expression, lang }) => {
  // Simple heuristic to evaluate common expressions for visualization
  const generateData = () => {
    const data = [];
    try {
      const cleanExpr = expression
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/(\d)(x|\(|\bsin\b|\bcos\b|\btan\b|\bsqrt\b|\blog\b|\bln\b|\bexp\b|\babs\b)/g, '$1*$2')
        .replace(/(x|\))(\d)/g, '$1*$2')
        .replace(/\^/g, '**')
        .replace(/abs/g, 'Math.abs')
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/log/g, 'Math.log10')
        .replace(/ln/g, 'Math.log')
        .replace(/exp/g, 'Math.exp')
        .replace(/pi/g, 'Math.PI')
        .replace(/e/g, 'Math.E');
      
      for (let x = -10; x <= 10; x += 0.25) {
        let y = 0;
        try {
          const evalExpr = cleanExpr.replace(/x/g, `(${x})`);
          y = eval(evalExpr);
        } catch(e) {
          continue;
        }
        if (isNaN(y) || !isFinite(y)) continue;
        data.push({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
      }
    } catch (e) {
      return [{ x: 0, y: 0 }];
    }
    return data.length > 0 ? data : [{ x: 0, y: 0 }];
  };

  const data = generateData();

  return (
    <div className="h-64 w-full bg-white rounded-xl p-4 border border-slate-200 shadow-sm mt-4">
      <div className="text-xs font-mono text-slate-400 mb-2 flex items-center gap-2">
        <span>{lang === 'en' ? 'Graph Output' : 'Sortie Graphique'}:</span>
        <div className="scale-75 origin-left">
          <MathRenderer content={`$y = ${expression.replace(/\*\*/g, '^')}$`} />
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="x" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Line type="monotone" dataKey="y" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
