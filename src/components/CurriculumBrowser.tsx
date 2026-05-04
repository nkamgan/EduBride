import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { STEM_CURRICULUM, Topic, SubTopic, Lesson } from '../constants/curriculum';
import { ChevronRight, BookOpen, Calculator, Beaker, Zap, ArrowLeft, Lightbulb, Download, CheckCircle, RefreshCw } from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { cn } from '../lib/utils';

interface CurriculumBrowserProps {
  onSelectLesson: (lesson: Lesson) => void;
  lang: 'en' | 'fr';
  downloadedLessons: string[];
  onToggleDownload: (lessonId: string, title?: string) => void;
  downloadingItems: Set<string>;
  isOnline: boolean;
}

export const CurriculumBrowser: React.FC<CurriculumBrowserProps> = ({ onSelectLesson, lang, downloadedLessons, onToggleDownload, downloadingItems, isOnline }) => {
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedSubTopic, setSelectedSubTopic] = useState<SubTopic | null>(null);

  const t = {
    en: {
      curriculum: 'Learning Pathways',
      back: 'Back',
      startLesson: 'Start Learning',
      keyPoints: 'Learning Objectives',
      selectTopic: 'Choose a subject to begin your journey'
    },
    fr: {
      curriculum: 'Parcours d\'Apprentissage',
      back: 'Retour',
      startLesson: 'Commencer',
      keyPoints: 'Objectifs d\'Apprentissage',
      selectTopic: 'Choisissez une matière pour commencer'
    }
  }[lang];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calculator': return <Calculator className="w-5 h-5" />;
      case 'Zap': return <Zap className="w-5 h-5" />;
      case 'Beaker': return <Beaker className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-brand/10 rounded-2xl text-brand">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-serif font-bold text-slate-900">{t.curriculum}</h2>
          <p className="text-slate-500 text-sm">{t.selectTopic}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedTopic ? (
          <motion.div 
            key="topics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {STEM_CURRICULUM.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(topic)}
                className="group relative overflow-hidden bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left"
              >
                <div className={`${topic.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                  {getIcon(topic.icon)}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{topic.title}</h3>
                <p className="text-slate-500 text-sm mb-4">{topic.subTopics.length} sections to explore</p>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand transition-colors" />
              </button>
            ))}
          </motion.div>
        ) : !selectedSubTopic ? (
          <motion.div 
            key="subtopics"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <button 
              onClick={() => setSelectedTopic(null)}
              className="flex items-center gap-2 text-slate-500 hover:text-brand mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> {t.back}
            </button>
            <h3 className="text-2xl font-bold text-slate-900 mb-6">{selectedTopic.title}</h3>
            <div className="grid grid-cols-1 gap-4">
              {selectedTopic.subTopics.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubTopic(sub)}
                  className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-brand/30 transition-all flex items-center justify-between group"
                >
                  <div className="text-left">
                    <h4 className="font-bold text-slate-900">{sub.title}</h4>
                    <p className="text-slate-500 text-sm">{sub.lessons.length} lessons</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isOnline) sub.lessons.forEach(l => onToggleDownload(l.id, l.title));
                      }}
                      className={cn(
                        "p-3 rounded-2xl border transition-all shadow-sm",
                        isOnline ? "bg-slate-50 text-slate-400 hover:text-brand border-slate-100" : "bg-slate-50 text-slate-200 border-slate-100 cursor-not-allowed"
                      )}
                      disabled={!isOnline}
                      title={isOnline ? "Download Section for Offline" : "Online Required for Download"}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="lessons"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <button 
              onClick={() => setSelectedSubTopic(null)}
              className="flex items-center gap-2 text-slate-500 hover:text-brand mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> {t.back}
            </button>
            <h3 className="text-2xl font-bold text-slate-900">{selectedSubTopic.title}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectedSubTopic.lessons.map((lesson) => (
                <div key={lesson.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="w-10 h-10 bg-brand/10 rounded-full flex items-center justify-center text-brand">
                        <Lightbulb className="w-5 h-5" />
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleDownload(lesson.id, lesson.title);
                        }}
                        disabled={downloadingItems.has(lesson.id) || (!isOnline && !downloadedLessons.includes(lesson.id))}
                        className={cn(
                          "p-2 rounded-xl border transition-all",
                          downloadedLessons.includes(lesson.id) 
                            ? "bg-green-50 border-green-200 text-green-600" 
                            : !isOnline 
                              ? "bg-slate-50 border-slate-100 text-slate-200 cursor-not-allowed"
                              : "bg-white border-slate-200 text-slate-400 hover:text-brand hover:border-brand/30",
                          downloadingItems.has(lesson.id) && "opacity-50 cursor-wait"
                        )}
                        title={downloadedLessons.includes(lesson.id) ? "Saved for Offline" : isOnline ? "Download for Offline" : "Online Required"}
                      >
                        {downloadingItems.has(lesson.id) ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : downloadedLessons.includes(lesson.id) ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Download className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 mb-3">
                      <MathRenderer content={lesson.title} />
                    </h4>
                    <div className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
                      <MathRenderer content={lesson.description} />
                    </div>
                    
                    <div className="bg-slate-50 rounded-3xl p-6">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t.keyPoints}</p>
                      <ul className="space-y-2">
                        {lesson.keyPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                             <div className="w-1 h-1 bg-brand rounded-full mt-1.5 shrink-0" />
                             <div className="flex-1">
                               <MathRenderer content={point} />
                             </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => onSelectLesson(lesson)}
                    className="w-full py-4 bg-brand text-white rounded-2xl font-bold hover:shadow-lg hover:bg-brand-dark transition-all transform hover:scale-[1.02]"
                  >
                    {t.startLesson}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
