/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Volume2, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Sparkles,
  BookOpen,
  Trophy,
  RefreshCcw,
  Loader2
} from "lucide-react";
import { ELEMENTARY_WORDS, WordItem } from "./data";
import { generateExample, ExampleSentence } from "./geminiService";

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [example, setExample] = useState<ExampleSentence | null>(null);
  const [loadingExample, setLoadingExample] = useState(false);
  const [progress, setProgress] = useState(0);

  const currentWord = ELEMENTARY_WORDS[currentIndex];
  const synth = useRef<SpeechSynthesis | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    synth.current = window.speechSynthesis;
    
    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      const englishVoices = availableVoices.filter(v => v.lang.startsWith("en"));
      setVoices(englishVoices);
      if (englishVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(englishVoices[0].name);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    setProgress(((currentIndex + 1) / ELEMENTARY_WORDS.length) * 100);
    setIsFlipped(false);
    setShowExample(false);
    setExample(null);
  }, [currentIndex]);

  const speak = (text: string) => {
    if (!synth.current) return;
    synth.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    
    utterance.lang = "en-US";
    utterance.rate = 0.8; // Slower as requested
    synth.current.speak(utterance);
  };

  const loadExample = async () => {
    if (example || loadingExample) return;
    setLoadingExample(true);
    const data = await generateExample(currentWord.word, currentWord.meaning);
    setExample(data);
    setLoadingExample(false);
    setShowExample(true);
  };

  const handleNext = () => {
    if (currentIndex < ELEMENTARY_WORDS.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const toggleFlip = () => setIsFlipped(!isFlipped);

  return (
    <div className="min-h-screen bg-yellow-50 font-sans text-stone-900 flex flex-col items-center">
      <div className="w-full max-w-[420px] min-h-screen bg-white shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <header className="px-6 pt-8 pb-2 flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-xs font-black text-blue-400 uppercase tracking-widest">Vocabulary</span>
            <div className="flex items-center gap-2 mt-1">
              <h1 className="text-2xl font-black text-blue-600 leading-none">영단어 800</h1>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-1 text-stone-300 hover:text-blue-500 transition-colors"
              >
                <RefreshCcw size={18} className={showSettings ? "rotate-180" : ""} />
              </button>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-stone-400">PROGRESS</span>
            <span className="text-sm font-black text-stone-600">{currentIndex + 1} / {ELEMENTARY_WORDS.length}</span>
          </div>
        </header>

        {/* Settings Overlay */}
        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 overflow-hidden bg-stone-50 border-y border-stone-100"
            >
              <div className="py-4 flex flex-col gap-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none">Select Voice</label>
                <select 
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full p-2 bg-white rounded-xl border border-stone-200 text-sm font-bold text-stone-700 outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {voices.map(v => (
                    <option key={v.name} value={v.name}>{v.name}</option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="px-6 py-2 mb-4">
          <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden shadow-inner">
            <motion.div 
              className="h-full bg-green-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 20 }}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 px-6 flex flex-col gap-6 overflow-y-auto pb-32">
          {/* Word Card Area */}
          <div className="relative w-full aspect-[4/4] perspective-1000">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                className="w-full h-full relative preserve-3d"
                initial={{ rotateY: 0, opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <motion.div
                  className="absolute inset-0 w-full h-full cursor-pointer touch-none"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  style={{ transformStyle: "preserve-3d" }}
                  onClick={toggleFlip}
                >
                  {/* Front Side */}
                  <div 
                    className="absolute inset-0 w-full h-full bg-blue-50 rounded-[40px] border-2 border-blue-100 flex flex-col items-center justify-center p-8 backface-hidden shadow-sm"
                  >
                    <span className="text-blue-400 font-bold uppercase tracking-widest text-[10px] mb-4">Day {Math.ceil((currentIndex + 1) / 50)}</span>
                    <h2 className="text-6xl font-black text-stone-800 mb-8 tracking-tight">{currentWord.word}</h2>
                    
                    <div className="flex flex-col items-center gap-6">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          speak(currentWord.word);
                        }}
                        className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-200 active:scale-90 transition-transform group"
                      >
                        <Volume2 size={32} className="text-white" />
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFlip();
                        }}
                        className="px-6 py-3 bg-white text-blue-600 rounded-2xl border-2 border-blue-100 font-black text-xs uppercase tracking-tighter flex items-center gap-2 shadow-sm"
                      >
                        <Eye size={14} />
                        뜻 확인하기
                      </button>
                    </div>
                  </div>

                  {/* Back Side */}
                  <div 
                    className="absolute inset-0 w-full h-full bg-white border-4 border-dashed border-stone-200 rounded-[40px] flex flex-col items-center justify-center p-8 backface-hidden shadow-sm"
                    style={{ transform: "rotateY(180deg)" }}
                  >
                    <span className="text-stone-400 font-bold uppercase tracking-widest text-[10px] mb-4">WORD MEANING</span>
                    <h2 className="text-5xl font-black text-stone-800 mb-2">{currentWord.meaning}</h2>
                    <p className="text-stone-400 text-sm font-bold uppercase">{currentWord.word}</p>
                    
                    <div className="absolute bottom-8 flex items-center gap-2 text-stone-400 text-[10px] font-black uppercase tracking-tighter">
                      <EyeOff size={14} />
                      <span>Tap to go back</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Example Section */}
          <div className="min-h-[180px]">
            {!showExample ? (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={loadExample}
                disabled={loadingExample}
                className="w-full py-5 bg-white rounded-[32px] border-4 border-dashed border-stone-100 text-stone-400 font-black flex flex-col items-center justify-center gap-2 hover:bg-stone-50 transition-all active:scale-95 disabled:opacity-50"
              >
                {loadingExample ? (
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                ) : (
                  <>
                    <Sparkles size={24} className="text-yellow-400" />
                    <span className="text-xs tracking-tighter">SHOW AI EXAMPLE SENTENCE</span>
                  </>
                )}
              </motion.button>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full bg-orange-50 p-6 rounded-[32px] flex flex-col gap-4 shadow-sm border border-orange-100"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center text-white text-[10px] font-black">EX</div>
                    <span className="text-xs font-black text-orange-800 uppercase">EXAMPLE</span>
                  </div>
                  <button 
                    onClick={() => speak(example?.english || "")}
                    className="w-10 h-10 bg-white text-orange-600 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-90 flex items-center justify-center"
                  >
                    <Volume2 size={18} />
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-lg font-black text-stone-800 leading-tight">
                    {example?.english}
                  </p>
                  <p className="text-sm font-bold text-orange-700/60 italic">
                    {example?.korean}
                  </p>
                </div>
                <button 
                  onClick={() => speak(example?.english || "")}
                  className="mt-2 w-full bg-white border-b-4 border-orange-200 py-3 rounded-2xl flex items-center justify-center gap-2 text-orange-600 font-black text-xs uppercase tracking-tighter active:border-b-0 active:translate-y-1 transition-all"
                >
                  <Volume2 size={14} />
                  따라 읽어보기
                </button>
              </motion.div>
            )}
          </div>
        </main>

        {/* Footer Navigation */}
        <footer className="p-6 flex items-center justify-between gap-4 bg-white/80 backdrop-blur-md border-t border-stone-100">
          <button 
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="w-16 h-16 rounded-3xl bg-stone-100 flex items-center justify-center text-stone-400 border-b-4 border-stone-200 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft size={32} strokeWidth={3} />
          </button>
          
          <button 
            onClick={handleNext}
            disabled={currentIndex === ELEMENTARY_WORDS.length - 1}
            className="flex-1 h-16 rounded-3xl bg-green-400 text-white font-black text-xl border-b-4 border-green-600 flex items-center justify-center gap-2 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            <span>다음 단어</span>
            <ChevronRight size={28} strokeWidth={3} />
          </button>
        </footer>

        {/* Home Indicator Mockup */}
        <div className="w-32 h-1.5 bg-stone-200 rounded-full mx-auto mb-2 shrink-0"></div>
      </div>

      {/* Background Decorative Blobs */}
      <div className="fixed -z-10 top-20 left-20 w-64 h-64 bg-blue-200 rounded-full opacity-10 blur-[100px]"></div>
      <div className="fixed -z-10 bottom-20 right-20 w-80 h-80 bg-orange-200 rounded-full opacity-10 blur-[100px]"></div>

      {/* Global CSS for 3D card effect */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
    </div>
  );
}

