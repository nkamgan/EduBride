/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Camera, 
  Upload, 
  Languages, 
  BookOpen, 
  Calculator as CalcIcon, 
  TrendingUp, 
  Menu, 
  X,
  History,
  CheckCircle2,
  BrainCircuit,
  Settings,
  HelpCircle,
  Smartphone,
  ChevronRight,
  TrendingDown,
  LayoutDashboard,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MathRenderer } from './components/MathRenderer';
import { GraphGenerator } from './components/GraphGenerator';
import { geminiService, Language, TutorResponse } from './services/geminiService';
import { cn } from './lib/utils';

type Tab = 'scan' | 'practice' | 'curriculum' | 'tools' | 'progress';

interface ProgressData {
  totalSolved: number;
  streak: number;
  topicMastery: Record<string, number>;
  history: Array<{
    date: string;
    topic: string;
    difficulty: string;
    solved: boolean;
  }>;
}

const STEM_TOPICS = [
  { id: 'algebra', name: { en: 'Algebra', fr: 'Algèbre' }, icon: <Target className="w-5 h-5"/>, lessons: 12 },
  { id: 'physics', name: { en: 'Physics', fr: 'Physique' }, icon: <Target className="w-5 h-5"/>, lessons: 10 },
  { id: 'geometry', name: { en: 'Geometry', fr: 'Géométrie' }, icon: <Target className="w-5 h-5"/>, lessons: 8 },
  { id: 'calculus', name: { en: 'Calculus', fr: 'Calcul' }, icon: <Target className="w-5 h-5"/>, lessons: 15 }
];

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<Tab>('scan');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // OCR / Solver State
  const [isSolving, setIsSolving] = useState(false);
  const [currentSolution, setCurrentSolution] = useState<TutorResponse | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Practice State
  const [practiceTopic, setPracticeTopic] = useState('algebra');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [practiceProblem, setPracticeProblem] = useState<TutorResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Progress State
  const [progress, setProgress] = useState<ProgressData>(() => {
    const saved = localStorage.getItem('edu_progress');
    return saved ? JSON.parse(saved) : {
      totalSolved: 0,
      streak: 1,
      topicMastery: { algebra: 0, physics: 0, geometry: 0, calculus: 0 },
      history: []
    };
  });

  useEffect(() => {
    localStorage.setItem('edu_progress', JSON.stringify(progress));
  }, [progress]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = useMemo(() => ({
    en: {
      appName: 'EduBridge',
      tagline: 'Gemma 4 Good AI Tutor',
      scanTitle: 'Solve with a Photo',
      scanDesc: 'Snap a photo of your handwritten math or physics problem.',
      uploadBtn: 'Upload Image',
      solveBtn: 'AI Solve Problem',
      solving: 'Analyzing with Gemma 4...',
      toolsTitle: 'Agentic STEM Tools',
      curriculumTitle: 'Structured Curriculum',
      practiceTitle: 'Adaptive Practice',
      progressTitle: 'My Learning Progress',
      recent: 'Recent Solutions',
      difficulty: 'Level',
      explanation: 'Key Concept',
      calculator: 'Visual Calculator',
      grapher: 'Function Grapher',
      generateBtn: 'Generate Problem',
      mastery: 'Mastery',
      solved: 'Total Solved'
    },
    fr: {
      appName: 'EduBridge',
      tagline: 'Tuteur IA Gemma 4 Good',
      scanTitle: 'Résoudre avec une Photo',
      scanDesc: 'Prenez une photo de votre problème de maths ou physique.',
      uploadBtn: 'Charger une Image',
      solveBtn: 'Résoudre par l\'IA',
      solving: 'Analyse par Gemma 4...',
      toolsTitle: 'Outils STEM Agentiques',
      curriculumTitle: 'Programme Structuré',
      practiceTitle: 'Pratique Adaptative',
      progressTitle: 'Mes Progrès',
      recent: 'Solutions Récentes',
      difficulty: 'Niveau',
      explanation: 'Concept Clé',
      calculator: 'Calculatrice Visuelle',
      grapher: 'Grapheur de Fonctions',
      generateBtn: 'Générer un Problème',
      mastery: 'Maîtrise',
      solved: 'Total Résolus'
    }
  }[lang]), [lang]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setCurrentSolution(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSolve = async () => {
    if (!imagePreview) return;
    setIsSolving(true);
    try {
      const b64 = imagePreview.split(',')[1];
      const result = await geminiService.solveProblem(b64, lang);
      setCurrentSolution(result);
      
      // Update progress for solved
      setProgress(prev => ({
        ...prev,
        totalSolved: prev.totalSolved + 1,
        topicMastery: {
          ...prev.topicMastery,
          [result.topic?.toLowerCase() || 'algebra']: Math.min((prev.topicMastery[result.topic?.toLowerCase() || 'algebra'] || 0) + 5, 100)
        },
        history: [{ 
          date: new Date().toISOString(), 
          topic: result.topic || 'General', 
          difficulty: result.difficulty, 
          solved: true 
        }, ...prev.history].slice(0, 20)
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSolving(false);
    }
  };

  const handleGeneratePractice = async () => {
    setIsGenerating(true);
    try {
      const problem = await geminiService.generateProblem(practiceTopic, difficulty, lang);
      setPracticeProblem(problem);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-edu-bg flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed inset-0 z-50 md:sticky md:top-0 md:h-screen md:w-80 bg-white border-r border-slate-200 transition-transform duration-300 md:translate-x-0 overflow-y-auto",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
                <BrainCircuit className="w-7 h-7" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold leading-tight">{t.appName}</h1>
                <p className="text-[10px] uppercase tracking-widest font-bold text-brand">{t.tagline}</p>
              </div>
            </div>
            <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <nav className="space-y-2 mb-10">
            <NavItem 
              icon={<Camera className="w-5 h-5"/>} 
              label={t.scanTitle} 
              active={activeTab === 'scan'} 
              onClick={() => { setActiveTab('scan'); setIsSidebarOpen(false); }} 
            />
            <NavItem 
              icon={<TrendingDown className="w-5 h-5"/>} 
              label={t.practiceTitle} 
              active={activeTab === 'practice'} 
              onClick={() => { setActiveTab('practice'); setIsSidebarOpen(false); }} 
            />
            <NavItem 
              icon={<BookOpen className="w-5 h-5"/>} 
              label={t.curriculumTitle} 
              active={activeTab === 'curriculum'} 
              onClick={() => { setActiveTab('curriculum'); setIsSidebarOpen(false); }} 
            />
             <NavItem 
              icon={<TrendingUp className="w-5 h-5"/>} 
              label={t.toolsTitle} 
              active={activeTab === 'tools'} 
              onClick={() => { setActiveTab('tools'); setIsSidebarOpen(false); }} 
            />
            <NavItem 
              icon={<LayoutDashboard className="w-5 h-5"/>} 
              label={t.progressTitle} 
              active={activeTab === 'progress'} 
              onClick={() => { setActiveTab('progress'); setIsSidebarOpen(false); }} 
            />
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col gap-6">
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Languages className="w-4 h-4" /> Language
              </h3>
              <div className="flex p-1 bg-white rounded-xl border border-slate-200 shadow-sm">
                <button 
                  onClick={() => setLang('en')}
                  className={cn("flex-1 py-2 text-xs font-semibold rounded-lg transition-all", lang === 'en' ? "bg-brand text-white shadow-sm" : "text-slate-500 hover:text-slate-800")}
                >
                  English
                </button>
                <button 
                  onClick={() => setLang('fr')}
                  className={cn("flex-1 py-2 text-xs font-semibold rounded-lg transition-all", lang === 'fr' ? "bg-brand text-white shadow-sm" : "text-slate-500 hover:text-slate-800")}
                >
                  Français
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Settings className="w-5 h-5 text-slate-400 hover:text-brand cursor-pointer transition-colors" />
              <HelpCircle className="w-5 h-5 text-slate-400 hover:text-brand cursor-pointer transition-colors" />
              <div className="ml-auto flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Offline Mode</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto w-full">
        {/* Mobile Header Top */}
        <div className="md:hidden flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white">
                    <BrainCircuit className="w-6 h-6" />
                </div>
                <h1 className="font-serif text-xl font-bold">{t.appName}</h1>
            </div>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                <Menu className="w-6 h-6 text-slate-600" />
            </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'scan' && (
            <motion.div 
              key="scan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-10"
            >
              <div className="space-y-2">
                <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-slate-900">{t.scanTitle}</h2>
                <p className="text-lg text-slate-500 leading-relaxed">{t.scanDesc}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Camera/Upload Section */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                  <div 
                    className={cn(
                       "relative aspect-video lg:aspect-square w-full rounded-[40px] border-4 border-dashed border-slate-200 bg-slate-50 overflow-hidden group cursor-pointer transition-all hover:border-brand/40",
                       imagePreview && "border-solid border-brand/20 bg-white"
                    )}
                    onClick={() => !imagePreview && fileInputRef.current?.click()}
                  >
                    {imagePreview ? (
                      <div className="relative w-full h-full">
                         <img src={imagePreview} alt="Problem" className="w-full h-full object-contain p-8" />
                         <button 
                            onClick={(e) => { e.stopPropagation(); setImagePreview(null); }}
                            className="absolute top-6 right-6 p-2 bg-white/80 backdrop-blur shadow-sm rounded-full text-slate-600 hover:text-red-500"
                         >
                            <X className="w-5 h-5" />
                         </button>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center space-y-4">
                        <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center text-brand mb-2 group-hover:scale-110 transition-transform">
                          <Camera className="w-10 h-10" />
                        </div>
                        <div>
                           <p className="text-lg font-bold text-slate-800">{t.uploadBtn}</p>
                           <p className="text-sm text-slate-400 mt-1">PNG, JPG or Direct Photo</p>
                        </div>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </div>

                  <button 
                    disabled={!imagePreview || isSolving}
                    onClick={handleSolve}
                    className={cn(
                      "w-full py-5 rounded-3xl font-bold text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3",
                      imagePreview && !isSolving 
                        ? "bg-brand text-white shadow-brand/20 hover:bg-brand-dark" 
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    {isSolving ? (
                        <>
                            <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                            {t.solving}
                        </>
                    ) : (
                        <>
                            <BrainCircuit className="w-6 h-6" />
                            {t.solveBtn}
                        </>
                    )}
                  </button>
                </div>

                {/* Response Section */}
                <div className="lg:col-span-12 xl:col-span-7">
                  <div className="bg-white rounded-[40px] border border-slate-200 p-8 md:p-10 shadow-sm min-h-[400px]">
                    {!currentSolution && !isSolving ? (
                      <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-40 py-20">
                         <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center">
                            <BookOpen className="w-10 h-10 text-slate-300" />
                         </div>
                         <p className="font-serif italic text-lg text-slate-400">Waiting for a handwritten challenge...</p>
                      </div>
                    ) : isSolving ? (
                        <div className="space-y-8 animate-pulse p-4">
                            <div className="h-8 bg-slate-100 rounded-xl w-1/3"></div>
                            <div className="space-y-3">
                                <div className="h-4 bg-slate-100 rounded-lg w-full"></div>
                                <div className="h-4 bg-slate-100 rounded-lg w-full"></div>
                                <div className="h-4 bg-slate-100 rounded-lg w-2/3"></div>
                            </div>
                            <div className="h-48 bg-slate-50 rounded-[32px] w-full"></div>
                        </div>
                    ) : currentSolution && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                                <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">{currentSolution.topic || 'STEM SOLUTION'}</h3>
                            </div>
                            <div className="px-4 py-1.5 bg-brand/10 text-brand text-xs font-bold rounded-full">
                                {t.difficulty}: {currentSolution.difficulty}
                            </div>
                        </div>

                         <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-2">{t.explanation}</h4>
                            <p className="text-slate-700 italic font-medium leading-relaxed">{currentSolution.explanation}</p>
                        </div>

                        <MathRenderer content={currentSolution.solution} />

                        {currentSolution.toolsSuggested && currentSolution.toolsSuggested.length > 0 && (
                             <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-100">
                                {currentSolution.toolsSuggested.map(tool => (
                                    <button 
                                        key={tool} 
                                        onClick={() => setActiveTab('tools')}
                                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:text-brand hover:border-brand transition-all flex items-center gap-2"
                                    >
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        Use {tool}
                                    </button>
                                ))}
                            </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'practice' && (
             <motion.div 
               key="practice"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="max-w-5xl mx-auto space-y-10"
             >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-slate-900">{t.practiceTitle}</h2>
                        <p className="text-slate-500">Sharpen your skills with AI-generated challenges.</p>
                    </div>

                    <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                        {['Beginner', 'Intermediate', 'Advanced'].map(lv => (
                            <button 
                                key={lv}
                                onClick={() => setDifficulty(lv as any)}
                                className={cn(
                                    "px-5 py-2 text-xs font-bold rounded-xl transition-all",
                                    difficulty === lv ? "bg-brand text-white" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {lv}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {STEM_TOPICS.map(topic => (
                        <button 
                            key={topic.id}
                            onClick={() => setPracticeTopic(topic.id)}
                            className={cn(
                                "p-6 rounded-[32px] border text-left transition-all group",
                                practiceTopic === topic.id 
                                    ? "bg-brand border-brand text-white shadow-xl shadow-brand/20" 
                                    : "bg-white border-slate-200 text-slate-700 hover:border-brand/40"
                            )}
                        >
                            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-colors", practiceTopic === topic.id ? "bg-white/20" : "bg-slate-50")}>
                                {topic.icon}
                            </div>
                            <h3 className="font-bold text-lg">{topic.name[lang]}</h3>
                            <p className={cn("text-[10px] font-bold uppercase tracking-wider mt-1", practiceTopic === topic.id ? "text-white/60" : "text-slate-400")}>
                                {progress.topicMastery[topic.id] || 0}% {t.mastery}
                            </p>
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm min-h-[500px] flex flex-col">
                    <div className="p-8 md:p-12 flex-1 relative">
                        {!practiceProblem && !isGenerating ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-6">
                                <div className="w-24 h-24 bg-brand/5 rounded-full flex items-center justify-center text-brand">
                                    <Target className="w-10 h-10" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-800">Ready to start?</p>
                                    <p className="text-slate-400 max-w-sm mx-auto mt-2">Pick a topic above and generate a personalized practice problem.</p>
                                </div>
                                <button 
                                    onClick={handleGeneratePractice}
                                    className="px-8 py-4 bg-brand text-white font-bold rounded-2xl shadow-lg hover:bg-brand-dark transition-all"
                                >
                                    {t.generateBtn}
                                </button>
                            </div>
                        ) : isGenerating ? (
                             <div className="h-full flex flex-col items-center justify-center space-y-6 py-20">
                                <div className="relative">
                                    <div className="w-20 h-20 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
                                    <BrainCircuit className="absolute inset-0 m-auto w-8 h-8 text-brand animate-pulse" />
                                </div>
                                <p className="font-serif italic text-lg text-slate-500">Gemma is crafting a unique problem for you...</p>
                            </div>
                        ) : practiceProblem && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-lg">{practiceProblem.topic}</h3>
                                    </div>
                                    <button 
                                        onClick={handleGeneratePractice}
                                        className="text-brand font-bold text-sm hover:underline"
                                    >
                                        Try another one
                                    </button>
                                </div>

                                <div className="prose prose-slate max-w-none">
                                    <MathRenderer content={practiceProblem.solution} />
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
             </motion.div>
          )}

          {activeTab === 'progress' && (
            <motion.div 
               key="progress"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="max-w-5xl mx-auto space-y-10"
            >
                <div className="space-y-2">
                    <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-slate-900">{t.progressTitle}</h2>
                    <p className="text-slate-500">Your journey through STEM knowledge.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard label={t.solved} value={progress.totalSolved.toString()} icon={<CheckCircle2 className="w-6 h-6 text-green-500" />} />
                    <StatCard label="Daily Streak" value={`${progress.streak} Days`} icon={<History className="w-6 h-6 text-orange-500" />} />
                    <StatCard label="Avg. Mastery" value={`${Math.round(Object.values(progress.topicMastery).reduce((a,b)=>a+b,0)/4)}%`} icon={<TrendingUp className="w-6 h-6 text-brand" />} />
                </div>

                <div className="bg-white rounded-[40px] border border-slate-200 p-10 overflow-hidden shadow-sm">
                    <h3 className="font-bold text-xl text-slate-900 mb-8">Mastery by Subject</h3>
                    <div className="space-y-8">
                        {STEM_TOPICS.map(topic => {
                            const mastery = progress.topicMastery[topic.id] || 0;
                            return (
                                <div key={topic.id} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-700">{topic.name[lang]}</span>
                                        <span className="text-sm font-bold text-brand">{mastery}%</span>
                                    </div>
                                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${mastery}%` }}
                                            className="h-full bg-brand"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
          )}

          {activeTab === 'curriculum' && (
            <motion.div 
               key="curriculum"
               className="max-w-5xl mx-auto space-y-10 py-20 text-center"
            >
                <div className="w-24 h-24 bg-brand/10 rounded-[40px] flex items-center justify-center text-brand mx-auto mb-6">
                    <BookOpen className="w-12 h-12" />
                </div>
                <h2 className="text-4xl font-serif font-bold text-slate-900">{t.curriculumTitle}</h2>
                <p className="text-slate-500 max-w-lg mx-auto">Access local syllabus lessons for Algebra, Physics, and more. Optimized for offline learning.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 text-left">
                    {STEM_TOPICS.map(topic => (
                        <div key={topic.id} className="p-8 bg-white border border-slate-200 rounded-[32px] hover:shadow-md transition-shadow cursor-pointer group">
                             <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-brand transition-colors">
                                    {topic.icon}
                                </div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{topic.lessons} Lessons</div>
                             </div>
                             <h3 className="text-xl font-bold text-slate-800">{topic.name[lang]} Path</h3>
                             <p className="text-sm text-slate-500 mt-2">Comprehensive curriculum covering standard examinations and fundamental concepts.</p>
                             <div className="mt-8 flex items-center text-brand font-bold text-sm gap-2">
                                Start Path <ChevronRight className="w-4 h-4" />
                             </div>
                        </div>
                    ))}
                </div>
            </motion.div>
          )}

          {activeTab === 'tools' && (
            <motion.div 
               key="tools"
               className="max-w-5xl mx-auto space-y-10"
            >
               <div className="space-y-2">
                <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-slate-900">{t.toolsTitle}</h2>
                <p className="text-slate-500">Interactive companions for STEM exploration.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
                      <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                          <div className="w-12 h-12 bg-brand/5 rounded-2xl flex items-center justify-center text-brand">
                              <CalcIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-xl text-slate-900">{t.calculator}</h3>
                            <p className="text-xs text-slate-400">Handwritten recognition ready</p>
                          </div>
                      </div>
                      <ScientificCalculator />
                  </div>

                  <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
                      <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                          <div className="w-12 h-12 bg-brand/5 rounded-2xl flex items-center justify-center text-brand">
                              <TrendingUp className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-xl text-slate-900">{t.grapher}</h3>
                            <p className="text-xs text-slate-400">Dynamic coordinate mapper</p>
                          </div>
                      </div>
                      <div className="space-y-4">
                        <GraphGenerator expression="y = sin(x) + cos(x/2)" lang={lang} />
                        <div className="flex flex-wrap gap-2">
                            {['y = x^2', 'y = sin(x)', 'y = 2x + 1', 'y = log(x)'].map(ex => (
                                <button key={ex} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:text-brand transition-all">{ex}</button>
                            ))}
                        </div>
                      </div>
                  </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-6 py-4 rounded-3xl transition-all font-bold text-sm group",
        active 
          ? "bg-brand text-white shadow-xl shadow-brand/20" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <div className={cn(
        "transition-colors",
        active ? "text-white" : "text-slate-400 group-hover:text-slate-600"
      )}>
        {icon}
      </div>
      {label}
      {active && <motion.div layoutId="nav-pill" className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
    </button>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
    return (
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
            </div>
        </div>
    );
}

function ScientificCalculator() {
    const [display, setDisplay] = useState('0');
    const buttons = [
        ['sin', 'cos', 'tan', 'C'],
        ['7', '8', '9', '÷'],
        ['4', '5', '6', '×'],
        ['1', '2', '3', '-'],
        ['0', '.', '=', '+']
    ];

    return (
        <div className="space-y-4">
            <div className="h-20 bg-slate-900 rounded-[24px] p-6 flex items-end justify-end text-right">
                <span className="text-brand font-mono text-3xl font-medium tracking-tight overflow-hidden">{display}</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
                {buttons.flat().map(btn => (
                    <button 
                        key={btn}
                        onClick={() => {
                            if (btn === 'C') setDisplay('0');
                            else if (btn === '=') setDisplay('14'); // Placeholder
                            else setDisplay(prev => prev === '0' ? btn : prev + btn);
                        }}
                        className={cn(
                            "py-4 rounded-2xl font-bold transition-all active:scale-95",
                            btn === 'C' ? "bg-red-50 text-red-500 hover:bg-red-100" :
                            btn === '=' ? "bg-brand text-white shadow-lg shadow-brand/20" :
                            ['sin','cos','tan'].includes(btn) ? "bg-slate-50 text-slate-400 text-xs" :
                            "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                        )}
                    >
                        {btn}
                    </button>
                ))}
            </div>
        </div>
    );
}
