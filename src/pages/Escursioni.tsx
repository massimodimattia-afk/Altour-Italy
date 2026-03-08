import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import ActivityDetailModal from "../components/ActivityDetailModal";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, RefreshCcw, Star, Calendar } from "lucide-react";

type Escursione = Database["public"]["Tables"]["escursioni"]["Row"] & {
  filosofia?: string | null;
  lunghezza?: number | null;
  is_italic?: boolean | null;
};

interface Activity {
  id: string;
  titolo: string;
  descrizione: string | null;
  descrizione_estesa?: string | null;
  prezzo: number;
  immagine_url: string | null;
  gallery_urls?: string[] | null;
  difficolta?: string | null;
  durata?: string | null;
  lunghezza?: number | null;
  attrezzatura_consigliata?: string | null;
  attrezzatura?: string | null;
  data?: string | null;
  is_italic?: boolean | null;
}

interface EscursioniPageProps {
  onNavigate: (page: string) => void;
  onBookingClick: (title: string) => void;
}

const QUIZ_QUESTIONS = [
  { q: "Con chi verrai?", options: ["Solo", "Coppia", "Gruppo"] },
  { q: "Livello Trekking?", options: ["Base", "Medio", "Pro"] },
  { q: "Luogo ideale?", options: ["Mare, lago o fiume", "Vette", "Boschi", "Prati o spazi aperti"] },
  { q: "Sforzo fisico?", options: ["Leggero", "Medio", "Intenso"] },
  { q: "Cosa cerchi?", options: ["Panorami", "Pace", "Tempo di qualità", "Racconto"] },
  { q: "Quanto tempo?", options: ["Ore", "Giorno", "Tour"] },
];

const FILOSOFIA_COLORS: Record<string, string> = {
  "Avventura": "#e94544", "Benessere": "#a5d9c9", "Borghi più belli": "#946a52",
  "Cammini": "#e3c45d", "Educazione all'aperto": "#01aa9f", "Eventi": "#ffc0cb",
  "Formazione": "#002f59", "Immersi nel verde": "#358756", "Luoghi dello spirito": "#c8a3c9",
  "Novità": "#75c43c", "Speciali": "#b8163c", "Tra mare e cielo": "#7aaecd", "Trek urbano": "#f39452",
};

const QUIZ_COLLAGE_IMG = "/collage-escursioni.webp"; 

function FilosofiaBadge({ value }: { value: string | null | undefined }) {
  if (!value) return null;
  const color = FILOSOFIA_COLORS[value] ?? "#44403c";
  return (
    <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white backdrop-blur-sm" style={{ backgroundColor: `${color}cc` }}>
      {value}
    </div>
  );
}

export default function EscursioniPage({ onBookingClick }: EscursioniPageProps) {
  const [escursioni, setEscursioni] = useState<Escursione[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"tutte" | "giornata" | "tour">("tutte");
  const [visibleCount] = useState(3);

  const [quizStep, setQuizStep] = useState<"intro" | "questions" | "result">("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [suggestedHike, setSuggestedHike] = useState<Escursione | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const quizRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchEscursioni() {
      const { data } = await supabase.from("escursioni").select("*").order("data", { ascending: true });
      if (data) setEscursioni(data as Escursione[]);
    }
    fetchEscursioni();
  }, []);

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setQuizStep("questions");
    setCurrentQuestion(0);
    setAnswers([]);
    setTimeout(() => quizRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  };

  const handleAnswer = (option: string) => {
    const newAnswers = [...answers, option];
    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setAnswers(newAnswers);
      setCurrentQuestion(prev => prev + 1);
    } else {
      setSuggestedHike(escursioni[Math.floor(Math.random() * escursioni.length)]);
      setQuizStep("result");
    }
  };

  const filtered = escursioni.filter(e => activeFilter === "tutte" || e.categoria?.toLowerCase() === activeFilter);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 md:py-20">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9] mb-4">Prossime <br /><span className="text-brand-sky italic font-light">Avventure.</span></h1>
          <div className="h-1.5 w-12 bg-brand-sky rounded-full" />
        </div>
        <div className="flex bg-stone-100 p-1.5 rounded-[2rem]">
          {(["tutte", "giornata", "tour"] as const).map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === f ? "bg-white text-brand-stone shadow-md" : "text-stone-400"}`}>{f}</button>
          ))}
        </div>
      </div>

      {/* BANNER IN ALTO */}
      <AnimatePresence>
        {!quizStarted && (
          <div className="relative overflow-hidden rounded-[1.75rem] mb-10 border border-stone-200 bg-stone-50 p-6 md:p-10 flex items-center justify-between cursor-pointer group" onClick={handleStartQuiz}>
            <div className="flex items-center gap-4">
              <span className="text-3xl">🧭</span>
              <div>
                <p className="text-[9px] font-black text-brand-sky uppercase tracking-widest">Trova la tua escursione</p>
                <p className="text-brand-stone font-black uppercase text-lg group-hover:text-brand-sky transition-colors">Non sai da dove iniziare?</p>
              </div>
            </div>
            <div className="hidden sm:block bg-brand-stone text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest group-hover:bg-brand-sky transition-all">Inizia Quiz</div>
          </div>
        )}
      </AnimatePresence>

      {/* GRID ESCURSIONI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
        {filtered.slice(0, visibleCount).map(esc => (
          <div key={esc.id} className="bg-white rounded-[2rem] overflow-hidden border border-stone-100 shadow-sm flex flex-col">
            <div className="h-52 relative bg-stone-200">
              {esc.immagine_url && <img src={esc.immagine_url} className="w-full h-full object-cover" alt="" />}
              <FilosofiaBadge value={esc.filosofia} />
            </div>
            <div className="p-7 flex flex-col flex-grow">
              <p className="text-brand-sky font-bold text-[10px] uppercase mb-2 flex items-center"><Calendar size={12} className="mr-1.5" /> {esc.data ? new Date(esc.data).toLocaleDateString("it-IT") : "Su richiesta"}</p>
              <h3 className="text-lg font-black mb-3 text-brand-stone uppercase">{esc.titolo}</h3>
              <p className="text-stone-500 text-xs mb-6 line-clamp-3">{esc.descrizione}</p>
              <div className="flex gap-2 mt-auto">
                <button onClick={() => { setSelectedActivity(esc as Activity); setIsDetailOpen(true); }} className="flex-1 border-2 border-stone-900 py-3 rounded-xl font-black uppercase text-[9px]">Dettagli</button>
                <button onClick={() => onBookingClick(esc.titolo)} className="flex-[1.5] bg-brand-sky text-white py-3 rounded-xl font-black uppercase text-[9px]">Richiedi Info</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SECTION QUIZ RE-DESIGNED */}
      <section ref={quizRef} className="max-w-4xl mx-auto mb-20">
        <div className="flex flex-col items-center">
          <div className="relative w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-stone-100 min-h-[500px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {quizStep === "intro" ? (
                <motion.div 
                  key="intro" 
                  className="absolute inset-0"
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                >
                  <img src={QUIZ_COLLAGE_IMG} className="w-full h-full object-cover" alt="Altour Style Collage" />
                </motion.div>
              ) : (
                <motion.div 
                  key="quiz-content" 
                  className="w-full h-full p-10 md:p-20 flex flex-col justify-center"
                  initial={{ opacity: 0, scale: 0.98 }} 
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <img src={QUIZ_COLLAGE_IMG} className="absolute inset-0 w-full h-full object-cover opacity-[0.03] pointer-events-none" alt="" />

                  {quizStep === "questions" && (
                    <div className="relative z-10">
                      <div className="flex justify-between items-center mb-10">
                        <button onClick={() => currentQuestion > 0 ? (setCurrentQuestion(q => q-1), setAnswers(a => a.slice(0,-1))) : setQuizStep("intro")} className="text-[9px] font-black uppercase text-stone-400 hover:text-brand-stone transition-colors">← Indietro</button>
                        <span className="text-[10px] font-black text-brand-sky">{currentQuestion + 1} / {QUIZ_QUESTIONS.length}</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-black text-brand-stone uppercase mb-10 tracking-tight">{QUIZ_QUESTIONS[currentQuestion].q}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {QUIZ_QUESTIONS[currentQuestion].options.map(o => (
                          <button key={o} onClick={() => handleAnswer(o)} className="p-5 rounded-2xl border-2 border-stone-100 text-left text-[11px] font-black uppercase hover:border-brand-sky hover:text-brand-sky hover:bg-brand-sky/5 transition-all shadow-sm active:scale-95">{o}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {quizStep === "result" && suggestedHike && (
                    <div className="relative z-10 text-center py-10">
                      <div className="w-20 h-20 bg-brand-sky/10 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Star size={40} className="text-brand-sky fill-brand-sky" />
                      </div>
                      <p className="text-[10px] font-black text-brand-sky uppercase tracking-widest mb-3">La nostra proposta per te:</p>
                      <h4 className="text-3xl md:text-4xl font-black text-brand-stone uppercase mb-12 italic tracking-tighter">{suggestedHike.titolo}</h4>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button onClick={() => { setSelectedActivity(suggestedHike as Activity); setIsDetailOpen(true); }} className="bg-brand-stone text-white px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-brand-sky transition-all">Vedi Dettagli</button>
                        <button onClick={() => setQuizStep("intro")} className="text-stone-400 text-[9px] font-black uppercase flex items-center justify-center gap-2 px-10 py-5 hover:text-brand-stone transition-colors"><RefreshCcw size={14} /> Rifai il test</button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* TASTO SPOSTATO FUORI E SOTTO IL BOX */}
          {quizStep === "intro" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2"
            >
              <button 
                onClick={handleStartQuiz} 
                className="bg-brand-stone text-white px-14 py-6 rounded-2xl font-black uppercase text-[12px] tracking-[0.2em] shadow-xl hover:bg-brand-sky transition-all hover:scale-105 active:scale-95 flex items-center gap-4"
              >
                Inizia il Test <ArrowRight size={18} />
              </button>
            </motion.div>
          )}
        </div>
      </section>

      <ActivityDetailModal activity={selectedActivity} isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} onBook={onBookingClick} />
    </div>
  );
}