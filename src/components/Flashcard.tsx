import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { MathRenderer } from './MathRenderer';

interface FlashcardData {
  id: string;
  front: string;
  back: string;
  topic: string;
}

interface FlashcardProps {
  cards: FlashcardData[];
  onComplete?: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({ cards, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0);

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setDirection(1);
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 50);
    } else if (onComplete) {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 50);
    }
  };

  const currentCard = cards[currentIndex];

  if (!currentCard) return null;

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between px-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Topic: <span className="text-brand">{currentCard.topic}</span>
        </span>
        <span className="text-[10px] font-bold text-slate-400">
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      <div 
        className="relative h-64 sm:h-80 cursor-pointer perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
           className="w-full h-full relative preserve-3d"
           initial={false}
           animate={{ rotateY: isFlipped ? 180 : 0 }}
           transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-white rounded-[32px] border-2 border-slate-100 shadow-sm p-8 flex flex-col items-center justify-center text-center">
            <div className="text-slate-400 mb-4">
              <RefreshCw className="w-6 h-6 opacity-20" />
            </div>
            <div className="text-lg font-medium text-slate-800">
              <MathRenderer content={currentCard.front} />
            </div>
            <div className="absolute bottom-6 text-[10px] font-bold text-brand uppercase opacity-40">
              Tap to reveal
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden bg-brand text-white rounded-[32px] p-8 flex flex-col items-center justify-center text-center rotate-y-180">
             <div className="text-white/20 mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-lg font-medium">
              <MathRenderer content={currentCard.back} />
            </div>
             <div className="absolute bottom-6 text-[10px] font-bold text-white/50 uppercase tracking-widest">
              Got it?
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-brand disabled:opacity-30 disabled:hover:text-slate-400 transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-brand"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>

        <button
          onClick={handleNext}
          className="p-4 bg-brand text-white rounded-2xl shadow-lg shadow-brand/20 hover:bg-brand-dark transition-all"
        >
          {currentIndex === cards.length - 1 ? <CheckCircle2 className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
        </button>
      </div>
      
      <p className="text-center text-xs text-slate-400 italic">
        {isFlipped ? "Did you know this? Keep going!" : "Try to recall the answer before flipping."}
      </p>
    </div>
  );
};
