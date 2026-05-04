import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowRightLeft } from 'lucide-react';
import { cn } from '../lib/utils';

type UnitCategory = 'length' | 'mass' | 'temperature' | 'volume';

interface Unit {
  label: string;
  value: string;
  ratio?: number; // ratio to base unit
}

const UNITS: Record<UnitCategory, Unit[]> = {
  length: [
    { label: 'Meters (m)', value: 'm', ratio: 1 },
    { label: 'Kilometers (km)', value: 'km', ratio: 1000 },
    { label: 'Centimeters (cm)', value: 'cm', ratio: 0.01 },
    { label: 'Millimeters (mm)', value: 'mm', ratio: 0.001 },
    { label: 'Miles (mi)', value: 'mi', ratio: 1609.34 },
    { label: 'Feet (ft)', value: 'ft', ratio: 0.3048 },
    { label: 'Inches (in)', value: 'in', ratio: 0.0254 },
  ],
  mass: [
    { label: 'Kilograms (kg)', value: 'kg', ratio: 1 },
    { label: 'Grams (g)', value: 'g', ratio: 0.001 },
    { label: 'Milligrams (mg)', value: 'mg', ratio: 0.000001 },
    { label: 'Pounds (lb)', value: 'lb', ratio: 0.453592 },
    { label: 'Ounces (oz)', value: 'oz', ratio: 0.0283495 },
  ],
  temperature: [
    { label: 'Celsius (°C)', value: 'C' },
    { label: 'Fahrenheit (°F)', value: 'F' },
    { label: 'Kelvin (K)', value: 'K' },
  ],
  volume: [
    { label: 'Liters (L)', value: 'L', ratio: 1 },
    { label: 'Milliliters (mL)', value: 'mL', ratio: 0.001 },
    { label: 'Gallons (gal)', value: 'gal', ratio: 3.78541 },
    { label: 'Cups (cup)', value: 'cup', ratio: 0.236588 },
  ],
};

export const UnitConverter: React.FC = () => {
  const [category, setCategory] = useState<UnitCategory>('length');
  const [fromUnit, setFromUnit] = useState(UNITS.length[0].value);
  const [toUnit, setToUnit] = useState(UNITS.length[1].value);
  const [inputValue, setInputValue] = useState<string>('');
  const [outputValue, setOutputValue] = useState<string>('');

  useEffect(() => {
    setFromUnit(UNITS[category][0].value);
    setToUnit(UNITS[category][1].value);
  }, [category]);

  const convert = (val: number, from: string, to: string, cat: UnitCategory): string => {
    if (cat === 'temperature') {
      let celsius = val;
      if (from === 'F') celsius = (val - 32) * 5 / 9;
      if (from === 'K') celsius = val - 273.15;

      let result = celsius;
      if (to === 'F') result = celsius * 9 / 5 + 32;
      if (to === 'K') result = celsius + 273.15;
      
      return result.toFixed(2);
    } else {
      const fromRatio = UNITS[cat].find(u => u.value === from)?.ratio || 1;
      const toRatio = UNITS[cat].find(u => u.value === to)?.ratio || 1;
      return (val * fromRatio / toRatio).toLocaleString(undefined, { maximumFractionDigits: 4 });
    }
  };

  useEffect(() => {
    const val = parseFloat(inputValue);
    if (!isNaN(val)) {
      setOutputValue(convert(val, fromUnit, toUnit, category));
    } else {
      setOutputValue('');
    }
  }, [inputValue, fromUnit, toUnit, category]);

  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
        {(Object.keys(UNITS) as UnitCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all",
              category === cat 
                ? "bg-white text-brand shadow-sm" 
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 relative">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">From</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand/20 outline-none transition-all"
              />
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand/20 outline-none appearance-none cursor-pointer"
              >
                {UNITS[category].map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative flex justify-center py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <button 
              onClick={swapUnits}
              className="relative w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-brand hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5 transition-all z-10"
            >
              <ArrowRightLeft className="w-4 h-4 rotate-90" />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">To</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="w-full bg-slate-900 text-white rounded-2xl px-4 py-3 text-sm font-bold flex items-center">
                {outputValue || '--'}
              </div>
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand/20 outline-none appearance-none cursor-pointer"
              >
                {UNITS[category].map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 flex items-center justify-center gap-2 text-slate-400">
        <RefreshCw className={cn("w-3 h-3", inputValue && "animate-spin-slow")} />
        <span className="text-[10px] font-medium italic">Auto-calculating for offline use</span>
      </div>
    </div>
  );
};
