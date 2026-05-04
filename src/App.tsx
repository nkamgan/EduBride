/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Camera, 
  Upload, 
  RefreshCw,
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
  Target,
  MessageCircle,
  Sparkles,
  Volume2,
  Trash2,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MathRenderer } from './components/MathRenderer';
import { GraphGenerator } from './components/GraphGenerator';
import { geminiService, Language, TutorResponse, TutorPersonality } from './services/geminiService';
import { studentService, StudentProfile } from './lib/studentService';
import { EducatorDashboard } from './components/EducatorDashboard';
import { cacheManager } from './services/cacheManager';
import { cn } from './lib/utils';
import { ScientificCalculator } from './components/ScientificCalculator';
import { InteractiveGrapher } from './components/InteractiveGrapher';
import { Scratchpad } from './components/Scratchpad';
import { CurriculumBrowser } from './components/CurriculumBrowser';
import { Lesson } from './constants/curriculum';

type Tab = 'scan' | 'practice' | 'curriculum' | 'tools' | 'progress' | 'chat';

interface ProgressData {
  totalSolved: number;
  streak: number;
  xp: number;
  level: number;
  topicMastery: Record<string, number>;
  history: Array<{
    id: string;
    date: string;
    topic: string;
    difficulty: string;
    solved: boolean;
    imagePreview?: string;
    response?: TutorResponse;
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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [userQuestion, setUserQuestion] = useState('');
  const [userRole, setUserRole] = useState<'student' | 'educator'>('student');
  const [profile, setProfile] = useState<StudentProfile>(studentService.getProfile());
  const [tutorPersonality, setTutorPersonality] = useState<TutorPersonality>(profile.personality || 'guide');
  
  // Practice State
  const [practiceTopic, setPracticeTopic] = useState('algebra');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [practiceProblem, setPracticeProblem] = useState<TutorResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Chat State
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  // Advice State
  const [studyAdvice, setStudyAdvice] = useState<string | null>(null);
  const [isGettingAdvice, setIsGettingAdvice] = useState(false);

  // Progress State
  const [progress, setProgress] = useState<ProgressData>(() => {
    const saved = localStorage.getItem('edu_progress');
    return saved ? JSON.parse(saved) : {
      totalSolved: 0,
      streak: 1,
      xp: 0,
      level: 1,
      topicMastery: { algebra: 0, physics: 0, geometry: 0, calculus: 0 },
      history: []
    };
  });

  useEffect(() => {
    localStorage.setItem('edu_progress', JSON.stringify(progress));
  }, [progress]);

  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const handleLessonSelect = (lesson: Lesson) => {
    setActiveTab('scan');
    setUserQuestion(lang === 'en' 
      ? `Explain the concept of ${lesson.title}: ${lesson.description}. Key points: ${lesson.keyPoints.join(', ')}.`
      : `Expliquez le concept de ${lesson.title}: ${lesson.description}. Points clés: ${lesson.keyPoints.join(', ')}.`
    );
    // Move solve logic trigger if needed or just set context
    studentService.updateProgress('general', lesson.id);
    setProfile(studentService.getProfile());
  };

  const [diagnostics, setDiagnostics] = useState({
    storageUsed: '0 KB',
    cachedTotal: 0,
    idbEntries: 0,
    localEntries: 0,
    isOnline: navigator.onLine,
    lastSync: localStorage.getItem('edu_last_sync') || 'Never',
    errors: JSON.parse(localStorage.getItem('edu_error_logs') || '[]') as string[]
  });

  const logOfflineError = (msg: string) => {
    const errorLogs = JSON.parse(localStorage.getItem('edu_error_logs') || '[]');
    const newLogs = [msg, ...errorLogs].slice(0, 5);
    localStorage.setItem('edu_error_logs', JSON.stringify(newLogs));
    setDiagnostics(prev => ({ ...prev, errors: newLogs }));
  };

  useEffect(() => {
    const updateDiagnostics = async () => {
      const stats = await cacheManager.getStats();
      let totalSize = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        const value = localStorage.getItem(key) || '';
        totalSize += key.length + value.length;
      }

      setDiagnostics(prev => ({
        ...prev,
        storageUsed: `${(totalSize / 1024).toFixed(1)} KB`,
        cachedTotal: stats.totalEntries,
        idbEntries: stats.indexedDBEntries,
        localEntries: stats.localStorageEntries,
        isOnline: navigator.onLine
      }));
    };

    updateDiagnostics();
    const interval = setInterval(updateDiagnostics, 5000);
    window.addEventListener('online', updateDiagnostics);
    window.addEventListener('offline', updateDiagnostics);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', updateDiagnostics);
      window.removeEventListener('offline', updateDiagnostics);
    };
  }, []);

  const [isPrewarming, setIsPrewarming] = useState(false);
  const handlePrewarm = async () => {
    setIsPrewarming(true);
    try {
      await geminiService.prewarmCache(STEM_TOPICS.map(t => t.id), lang);
      const now = new Date().toLocaleString();
      localStorage.setItem('edu_last_sync', now);
      setDiagnostics(prev => ({ ...prev, lastSync: now }));
    } catch (err) {
      console.error(err);
      logOfflineError(`Sync Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsPrewarming(false);
    }
  };

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
      curriculumTitle: 'Structured Curriculum',
      practiceTitle: 'Adaptive Practice',
      progressTitle: 'My Learning Progress',
      recent: 'Recent Solutions',
      difficulty: 'Level',
      explanation: 'Key Concept',
      grapher: 'Function Grapher',
      generateBtn: 'Generate Problem',
      scratchpad: 'Scratchpad',
      toolsTitle: 'STEM Tools',
      calculator: 'Calculator',
      unitConverter: 'Unit Converter',
      historyTitle: 'Solution History',
      xpLabel: 'XP Points',
      levelLabel: 'Level',
      mastery: 'Mastery',
      solved: 'Total Solved',
      chatTutor: 'Tutor Chat',
      askTutor: 'Ask a follow-up...',
      getAdvice: 'Get AI Insights',
      explaining: 'Gemma is thinking...',
      speak: 'Read Out Loud',
      askSpecificQuestion: 'Ask a specific question about this problem (optional)...',
    },
    fr: {
      appName: 'EduBridge',
      tagline: 'Tuteur IA Gemma 4 Good',
      scanTitle: 'Résoudre avec une Photo',
      scanDesc: 'Prenez une photo de votre problème de maths ou physique.',
      uploadBtn: 'Charger une Image',
      solveBtn: 'Résoudre par l\'IA',
      solving: 'Analyse par Gemma 4...',
      curriculumTitle: 'Programme Structuré',
      practiceTitle: 'Pratique Adaptative',
      progressTitle: 'Mes Progrès',
      recent: 'Solutions Récentes',
      difficulty: 'Niveau',
      explanation: 'Concept Clé',
      grapher: 'Grapheur de Fonctions',
      generateBtn: 'Générer un Problème',
      scratchpad: 'Brouillon',
      toolsTitle: 'Outils STEM',
      calculator: 'Calculatrice',
      unitConverter: 'Convertisseur',
      historyTitle: 'Historique des Solutions',
      xpLabel: 'Points XP',
      levelLabel: 'Niveau',
      mastery: 'Maîtrise',
      solved: 'Total Résolus',
      chatTutor: 'Discussion Tuteur',
      askTutor: 'Poser une question...',
      getAdvice: 'Obtenir des conseils IA',
      explaining: 'Gemma réfléchit...',
      speak: 'Lire à voix haute',
      askSpecificQuestion: 'Posez une question spécifique sur ce problème (facultatif)...',
    }
  }[lang]), [lang]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);

    if (file) {
      // 1. Validation: Format
      const supportedFormats = ['image/jpeg', 'image/png', 'image/webp'];
      if (!supportedFormats.includes(file.type)) {
        setUploadError(lang === 'en' ? 'Unsupported format. Please use JPG, PNG or WebP.' : 'Format non supporté. Veuillez utiliser JPG, PNG ou WebP.');
        setImagePreview(null);
        return;
      }

      // 2. Validation: Size (Max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(lang === 'en' ? 'File too large. Max size is 5MB.' : 'Fichier trop volumineux. La taille maximale est de 5Mo.');
        setImagePreview(null);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setCurrentSolution(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSolve = async () => {
    if (!imagePreview && !userQuestion) return;
    setIsSolving(true);
    try {
      const b64 = imagePreview ? imagePreview.split(',')[1] : null;
      const result = await geminiService.solveProblem(b64, lang, userQuestion, tutorPersonality);
      setCurrentSolution(result);
      
      setProgress(prev => {
        const xpGain = result.difficulty === 'Advanced' ? 50 : result.difficulty === 'Intermediate' ? 30 : 15;
        const newXp = prev.xp + xpGain;
        const newLevel = Math.floor(newXp / 500) + 1;
        
        return {
          ...prev,
          totalSolved: prev.totalSolved + 1,
          xp: newXp,
          level: newLevel,
          topicMastery: {
            ...prev.topicMastery,
            [result.topic?.toLowerCase() || 'algebra']: Math.min((prev.topicMastery[result.topic?.toLowerCase() || 'algebra'] || 0) + 5, 100)
          },
          history: [
            {
              id: Date.now().toString(),
              date: new Date().toISOString(),
              topic: result.topic || 'General',
              difficulty: result.difficulty,
              solved: true,
              imagePreview: imagePreview || undefined,
              response: result
            },
            ...prev.history
          ].slice(0, 20)
        };
      });
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

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', parts: [{ text: userMessage }] }]);
    setIsChatting(true);

    try {
      const response = await geminiService.getChatResponse(userMessage, chatHistory, lang);
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: response }] }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatting(false);
    }
  };

  const handleGetAdvice = async () => {
    setIsGettingAdvice(true);
    try {
      const advice = await geminiService.getStudyAdvice(progress, lang);
      setStudyAdvice(advice);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGettingAdvice(false);
    }
  };

  const handleSpeak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-US' : 'fr-FR';
    window.speechSynthesis.speak(utterance);
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
            <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
              <button 
                onClick={() => setUserRole('student')}
                className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", userRole === 'student' ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}
              >
                Student
              </button>
              <button 
                onClick={() => setUserRole('educator')}
                className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", userRole === 'educator' ? "bg-white shadow-sm text-slate-900" : "text-slate-500")}
              >
                Educator
              </button>
            </div>
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
              icon={<MessageCircle className="w-5 h-5"/>} 
              label={t.chatTutor} 
              active={activeTab === 'chat'} 
              onClick={() => { setActiveTab('chat'); setIsSidebarOpen(false); }} 
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
              <Settings 
                className={cn(
                  "w-5 h-5 transition-colors cursor-pointer",
                  showDiagnostics ? "text-brand" : "text-slate-400 hover:text-brand"
                )}
                onClick={() => setShowDiagnostics(!showDiagnostics)}
              />
              <HelpCircle className="w-5 h-5 text-slate-400 hover:text-brand cursor-pointer transition-colors" />
              <div className="ml-auto flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", diagnostics.isOnline ? "bg-green-500" : "bg-orange-500")}></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  {diagnostics.isOnline ? 'Cloud Sync' : 'Offline Mode'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostics Overlay */}
        <AnimatePresence>
          {showDiagnostics && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-32 left-8 right-8 bg-white border border-slate-200 rounded-[32px] p-6 shadow-2xl z-[60] space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-brand" />
                  System Diagnostics
                </h3>
                <button onClick={() => setShowDiagnostics(false)}><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pb-2">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Local Size</p>
                  <p className="text-sm font-bold text-slate-700">{diagnostics.storageUsed}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Status</p>
                  <p className={cn("text-sm font-bold", diagnostics.isOnline ? "text-green-600" : "text-orange-600")}>
                    {diagnostics.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">IndexedDB</p>
                  <p className="text-sm font-bold text-slate-700">{diagnostics.idbEntries} items</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Fallback Cache</p>
                  <p className="text-sm font-bold text-slate-700">{diagnostics.localEntries} items</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 col-span-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Last Full Sync</p>
                  <p className="text-sm font-bold text-slate-700">{diagnostics.lastSync}</p>
                </div>
              </div>

              {diagnostics.errors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-2xl">
                   <p className="text-[9px] font-bold text-red-400 uppercase mb-1">System Logs</p>
                   <div className="space-y-1">
                      {diagnostics.errors.map((err, i) => (
                        <p key={i} className="text-[10px] text-red-600 font-medium truncate">• {err}</p>
                      ))}
                   </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handlePrewarm}
                  disabled={isPrewarming || !diagnostics.isOnline}
                  className="w-full py-4 bg-brand text-white rounded-2xl text-xs font-bold transition-all disabled:opacity-50 flex flex-col items-center justify-center gap-1 shadow-lg shadow-brand/20"
                >
                  <div className="flex items-center gap-2">
                    {isPrewarming ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                    <span>{isPrewarming ? 'Syncing...' : 'Pre-warm Curriculum'}</span>
                  </div>
                  {!isPrewarming && diagnostics.isOnline && (
                    <span className="text-[8px] opacity-70 font-normal">Est. time: ~45s for 15 topics</span>
                  )}
                </button>
                <button 
                  onClick={async () => {
                    if (confirm('Are you sure you want to clear all cached data? This includes offline curriculum and solutions.')) {
                      await cacheManager.clearAll();
                      localStorage.removeItem('edu_last_sync');
                      localStorage.removeItem('edu_error_logs');
                      window.location.reload(); 
                    }
                  }}
                  className="w-full py-3 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear System Cache
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto w-full">
        {userRole === 'educator' ? (
          <EducatorDashboard lang={lang} />
        ) : (
          <>
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

              <div className="grid grid-cols-1 gap-6">
                {/* Image Upload Section */}
                <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                  <div className="flex gap-3">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-4 px-6 bg-brand text-white shadow-lg shadow-brand/20 rounded-3xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                    >
                      <Upload className="w-5 h-5"/>
                      {t.uploadBtn}
                    </button>
                  </div>

                  <div 
                    className={cn(
                       "relative aspect-video lg:aspect-[4/3] w-full rounded-[30px] border-4 border-dashed border-slate-200 bg-slate-50 overflow-hidden group transition-all",
                       imagePreview && "border-solid border-brand/20 bg-white"
                    )}
                  >
                    {imagePreview ? (
                      <div className="relative w-full h-full">
                         <img src={imagePreview} alt="Problem" className="w-full h-full object-contain p-8" />
                         <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setImagePreview(null); 
                              setCurrentSolution(null); 
                              setUserQuestion('');
                            }}
                            className="absolute top-6 right-6 p-2 bg-white/80 backdrop-blur shadow-sm rounded-full text-slate-600 hover:text-red-500"
                         >
                            <X className="w-5 h-5" />
                         </button>
                      </div>
                    ) : (
                      <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center space-y-4 cursor-pointer">
                        <div className="w-20 h-20 bg-brand/10 rounded-full flex items-center justify-center text-brand mb-2 group-hover:scale-110 transition-transform">
                          <Upload className="w-10 h-10" />
                        </div>
                        <div>
                           <p className="text-lg font-bold text-slate-800">{t.uploadBtn}</p>
                           <p className="text-sm text-slate-400 mt-1">PNG, JPG or Direct Photo</p>
                        </div>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} />
                  </div>

                  {uploadError && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-500 text-xs font-bold text-center"
                    >
                      {uploadError}
                    </motion.div>
                  )}

                  {imagePreview && !currentSolution && !isSolving && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                           <div className="flex items-center gap-2 text-slate-500">
                             <Sparkles className="w-4 h-4 text-brand" />
                             <span className="text-[10px] font-bold uppercase tracking-widest">{lang === 'en' ? 'Tutor Personality' : 'Personnalité du Tuteur'}</span>
                           </div>
                           <div className="flex gap-1">
                              {(['guide', 'scientist', 'coach'] as TutorPersonality[]).map(p => (
                                <button
                                  key={p}
                                  onClick={() => setTutorPersonality(p)}
                                  className={cn(
                                    "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-tighter transition-all",
                                    tutorPersonality === p ? "bg-brand text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                  )}
                                >
                                  {p}
                                </button>
                              ))}
                           </div>
                        </div>
                        <textarea
                          value={userQuestion}
                          onChange={(e) => setUserQuestion(e.target.value)}
                          placeholder={t.askSpecificQuestion}
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-brand/20 outline-none resize-none transition-all placeholder:text-slate-400 shadow-sm"
                          rows={3}
                        />
                      </div>
                    </motion.div>
                  )}

                  <button 
                    disabled={(!imagePreview && !userQuestion) || isSolving}
                    onClick={handleSolve}
                    className={cn(
                      "w-full py-5 rounded-3xl font-bold text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3",
                      (imagePreview || userQuestion) && !isSolving 
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
                                <div className="font-bold text-slate-900 uppercase tracking-widest text-xs scale-90 origin-left">
                                  <MathRenderer content={currentSolution.topic || 'STEM SOLUTION'} />
                                </div>
                            </div>
                            <div className="px-4 py-1.5 bg-brand/10 text-brand text-xs font-bold rounded-full">
                                {t.difficulty}: {currentSolution.difficulty}
                            </div>
                        </div>

                         <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative group/speak">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-2">{t.explanation}</h4>
                            <div className="text-slate-700 italic font-medium leading-relaxed">
                                <MathRenderer content={currentSolution.explanation} />
                            </div>
                            <button 
                                onClick={() => handleSpeak(currentSolution.explanation)}
                                className="absolute top-4 right-4 p-2 bg-white rounded-full opacity-0 group-hover/speak:opacity-100 transition-opacity shadow-sm text-slate-400 hover:text-brand"
                                title={t.speak}
                            >
                                <Volume2 className="w-4 h-4" />
                            </button>
                        </div>

                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <MathRenderer content={currentSolution.solution} />
                        </motion.div>

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

                                <div className="prose prose-slate max-w-none relative group/speak">
                                    <button 
                                        onClick={() => handleSpeak(practiceProblem.solution)}
                                        className="absolute top-0 right-0 p-2 bg-slate-50 rounded-full opacity-0 group-hover/speak:opacity-100 transition-opacity shadow-sm text-slate-400 hover:text-brand"
                                        title={t.speak}
                                    >
                                        <Volume2 className="w-4 h-4" />
                                    </button>
                                    <MathRenderer content={practiceProblem.solution} />
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
             </motion.div>
          )}

          {activeTab === 'tools' && (
            <motion.div 
               key="tools"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="max-w-4xl mx-auto space-y-12 pb-20"
            >
                <div className="text-center space-y-2">
                    <h2 className="text-4xl font-serif font-bold text-slate-900">{t.toolsTitle}</h2>
                    <p className="text-slate-500 italic">Essential tools for offline STEM study.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                <TrendingUp className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm">{t.grapher}</h3>
                        </div>
                        <InteractiveGrapher />
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500">
                                <Pencil className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm">{t.scratchpad}</h3>
                        </div>
                        <Scratchpad />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center text-brand">
                                <CalcIcon className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm">{t.calculator}</h3>
                        </div>
                        <ScientificCalculator />
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                                <RefreshCw className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm">{t.unitConverter}</h3>
                        </div>
                        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">From Celsius</label>
                                    <input type="number" placeholder="0" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand/20 outline-none" onChange={(e) => {
                                        const v = e.target.value;
                                        const out = document.getElementById('temp-out');
                                        if (out) out.innerText = v ? (parseFloat(v) * 9/5 + 32).toFixed(1) + ' °F' : '--';
                                    }} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">To Fahrenheit</label>
                                    <div id="temp-out" className="w-full bg-slate-900 text-white rounded-xl px-4 py-3 text-sm font-bold flex items-center justify-center">--</div>
                                </div>
                             </div>

                             <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">From Meters</label>
                                    <input type="number" placeholder="0" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand/20 outline-none" onChange={(e) => {
                                        const v = e.target.value;
                                        const out = document.getElementById('dist-out');
                                        if (out) out.innerText = v ? (parseFloat(v) * 3.28084).toFixed(2) + ' ft' : '--';
                                    }} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">To Feet</label>
                                    <div id="dist-out" className="w-full bg-slate-900 text-white rounded-xl px-4 py-3 text-sm font-bold flex items-center justify-center">--</div>
                                </div>
                             </div>
                        </div>
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

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-brand rounded-[32px] p-8 text-white shadow-xl shadow-brand/20">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{t.levelLabel}</span>
                            <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold">{progress.xp} XP</div>
                        </div>
                        <div className="text-5xl font-serif font-bold mb-2">{progress.level}</div>
                        <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                            <div className="h-full bg-white transition-all" style={{ width: `${(progress.xp % 500) / 5}%` }} />
                        </div>
                    </div>
                    <StatCard label={t.solved} value={progress.totalSolved.toString()} icon={<CheckCircle2 className="w-6 h-6 text-green-500" />} />
                    <StatCard label="Daily Streak" value={`${progress.streak} Days`} icon={<History className="w-6 h-6 text-orange-500" />} />
                    <StatCard label="Avg. Mastery" value={`${Math.round(Object.values(progress.topicMastery).reduce((a,b)=>a+b,0)/4)}%`} icon={<TrendingUp className="w-6 h-6 text-brand" />} />
                </div>

                <div className="bg-white rounded-[40px] border border-slate-200 p-10 overflow-hidden shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                         <h3 className="font-bold text-xl text-slate-900">AI Study Advisor</h3>
                         <button 
                            onClick={handleGetAdvice}
                            className="flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-2xl font-bold shadow-lg shadow-brand/20 active:scale-95 transition-all text-xs"
                         >
                            <Sparkles className="w-4 h-4" />
                            {isGettingAdvice ? t.explaining : t.getAdvice}
                         </button>
                    </div>

                    {studyAdvice && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                             <MathRenderer content={studyAdvice} />
                        </motion.div>
                    )}
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

                <div className="bg-white rounded-[40px] border border-slate-200 p-10 overflow-hidden shadow-sm">
                    <h3 className="font-bold text-xl text-slate-900 mb-8">{t.historyTitle}</h3>
                    {progress.history.length === 0 ? (
                        <div className="py-20 text-center text-slate-400 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                            <CalcIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No solutions captured yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {progress.history.map((item) => (
                                <motion.div 
                                    key={item.id}
                                    whileHover={{ y: -4 }}
                                    className="p-4 bg-slate-50 border border-slate-100 rounded-3xl flex gap-4 cursor-pointer hover:bg-white hover:shadow-md transition-all text-left"
                                    onClick={() => {
                                        if (item.response) {
                                            setCurrentSolution(item.response);
                                            setImagePreview(item.imagePreview || null);
                                            setActiveTab('scan');
                                        }
                                    }}
                                >
                                    <div className="w-20 h-20 bg-white rounded-2xl border border-slate-200 overflow-hidden flex-shrink-0">
                                        {item.imagePreview ? (
                                            <img src={item.imagePreview} alt="History" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <CalcIcon className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 py-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold text-brand uppercase">{item.topic}</span>
                                            <span className="text-[10px] text-slate-400">{new Date(item.date).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800 line-clamp-1">{item.response?.explanation || 'Problem'}</p>
                                        <div className="mt-2 inline-block px-2 py-0.5 bg-slate-200 text-[9px] font-bold rounded-full text-slate-600 uppercase">
                                            {item.difficulty}
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-300 self-center" />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
          )}

          {activeTab === 'chat' && (
             <motion.div 
               key="chat"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               className="max-w-4xl mx-auto h-[70vh] flex flex-col"
             >
                <div className="mb-8">
                    <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-slate-900">{t.chatTutor}</h2>
                    <p className="text-slate-500">Ask questions about concepts, formulas, or homework.</p>
                </div>

                <div className="flex-1 bg-white rounded-[40px] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                        {chatHistory.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center opacity-40 text-center space-y-4">
                                <div className="w-20 h-20 bg-brand/5 rounded-full flex items-center justify-center text-brand">
                                    <MessageCircle className="w-8 h-8" />
                                </div>
                                <p className="font-serif italic text-lg text-slate-400">Gemma is ready to help. What's on your mind?</p>
                            </div>
                        )}
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                <div className={cn(
                                    "max-w-[80%] p-6 rounded-3xl",
                                    msg.role === 'user' ? "bg-brand text-white shadow-lg shadow-brand/10" : "bg-slate-50 border border-slate-100 text-slate-700"
                                )}>
                                    <MathRenderer content={msg.parts[0].text} />
                                </div>
                            </div>
                        ))}
                        {isChatting && (
                            <div className="flex justify-start">
                                <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl flex items-center gap-3">
                                    <div className="flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-brand/40 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-brand/60 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                        <div className="w-1.5 h-1.5 bg-brand/80 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                    </div>
                                    <span className="text-xs font-bold text-brand uppercase tracking-widest">{t.explaining}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleChat} className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                        <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder={t.askTutor}
                            className="flex-1 bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all font-medium"
                        />
                        <button 
                            disabled={!chatInput.trim() || isChatting}
                            className="w-14 h-14 bg-brand text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand/20 hover:bg-brand-dark transition-all disabled:opacity-50"
                        >
                            <TrendingUp className="w-6 h-6 rotate-90" />
                        </button>
                    </form>
                </div>
             </motion.div>
          )}

          {activeTab === 'curriculum' && (
            <motion.div 
               key="curriculum"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               className="max-w-7xl mx-auto"
            >
                <CurriculumBrowser lang={lang} onSelectLesson={handleLessonSelect} />
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

                  <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
                       <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                           <div className="w-12 h-12 bg-brand/5 rounded-2xl flex items-center justify-center text-brand">
                               <Sparkles className="w-6 h-6" />
                           </div>
                           <div>
                             <h3 className="font-bold text-xl text-slate-900">AI Summarizer</h3>
                             <p className="text-xs text-slate-400">Simplify complex STEM text</p>
                           </div>
                       </div>
                       <TextSummarizer lang={lang} />
                  </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
          </>
        )}
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

function TextSummarizer({ lang }: { lang: Language }) {
    const [input, setInput] = useState('');
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSummarize = async () => {
        if (!input.trim()) return;
        setLoading(true);
        try {
            const result = await geminiService.summarizeText(input, lang);
            setSummary(result);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={lang === 'en' ? "Paste textbook text here..." : "Collez le texte du manuel ici..."}
                className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all resize-none"
            />
            <button 
                onClick={handleSummarize}
                disabled={loading || !input.trim()}
                className="w-full py-3 bg-brand text-white font-bold rounded-xl shadow-lg shadow-brand/20 hover:bg-brand-dark transition-all disabled:opacity-50"
            >
                {loading ? 'Summarizing...' : 'Summarize with AI'}
            </button>
            {summary && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 bg-brand/5 border border-brand/10 rounded-2xl overflow-hidden">
                    <MathRenderer content={summary} />
                </motion.div>
            )}
        </div>
    );
}
