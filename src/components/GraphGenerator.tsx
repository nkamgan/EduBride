import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GraphGeneratorProps {
  expression: string;
  lang: 'en' | 'fr';
}

export const GraphGenerator: React.FC<GraphGeneratorProps> = ({ expression, lang }) => {
  // Simple heuristic to evaluate common expressions for visualization
  const generateData = () => {
    const data = [];
    try {
      // Basic expression evaluator for demo purposes
      // Support basic replacements for visual clarity
      const cleanExpr = expression
        .replace(/(\d)x/g, '$1*x') // 2x -> 2*x
        .replace(/x\^2/g, 'x*x')
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos');
      
      for (let x = -10; x <= 10; x += 0.5) {
        let y = 0;
        try {
          const evalExpr = cleanExpr.replace(/x/g, `(${x})`);
          y = eval(evalExpr);
        } catch(e) {
          y = 0;
        }
        if (isNaN(y) || !isFinite(y)) continue;
        data.push({ x, y });
      }
    } catch (e) {
      return [{ x: 0, y: 0 }];
    }
    return data.length > 0 ? data : [{ x: 0, y: 0 }];
  };

  const data = generateData();

  return (
    <div className="h-64 w-full bg-white rounded-xl p-4 border border-slate-200 shadow-sm mt-4">
      <p className="text-xs font-mono text-slate-400 mb-2">
        {lang === 'en' ? 'Graph Output' : 'Sortie Graphique'}: {expression}
      </p>
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
