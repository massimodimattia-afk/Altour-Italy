import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import ActivityDetailModal from "../components/ActivityDetailModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  RefreshCcw,
  Star,
  Sparkles,
  ChevronDown,
} from "lucide-react";

type Escursione = Database["public"]["Tables"]["escursioni"]["Row"];

interface EscursioniPageProps {
  onNavigate: (page: string) => void;
  onBookingClick: (title: string) => void;
}

// --- SKELETON LOADER ---
const SkeletonCard = () => (
  <div className="bg-white rounded-[2.5rem] p-3 border border-stone-100 shadow-sm">
    <div className="h-52 bg-stone-100 rounded-[1.8rem] animate-pulse" />
    <div className="p-5">
      <div className="h-2 w-20 bg-stone-100 rounded mb-4 animate-pulse" />
      <div className="h-6 w-3/4 bg-stone-200 rounded mb-4 animate-pulse" />
      <div className="space-y-2 mb-6">
        <div className="h-2 w-full bg-stone-50 rounded animate-pulse" />
        <div className="h-2 w-5/6 bg-stone-50 rounded animate-pulse" />
      </div>
      <div className="flex gap-2">
        <div className="h-12 flex-1 bg-stone-100 rounded-2xl animate-pulse" />
        <div className="h-12 flex-[1.5] bg-stone-100 rounded-2xl animate-pulse" />
      </div>
    </div>
  </div>
);

export default function EscursioniPage({
  onBookingClick,
}: EscursioniPageProps) {
  const [escursioni, setEscursioni] = useState<Escursione[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Escursione | null>(
    null,
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filtri e Paginazione
  const [activeFilter, setActiveFilter] = useState<
    "tutte" | "giornata" | "tour"
  >("tutte");
  const ITEMS_PER_LOAD = 4;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);

  // Quiz States
  const [quizStep, setQuizStep] = useState<"intro" | "questions" | "result">(
    "intro",
  );
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [suggestedHike, setSuggestedHike] = useState<Escursione | null>(null);

  const quizQuestions = [
    { q: "Con chi verrai?", options: ["Solo", "Coppia", "Gruppo"] },
    { q: "Livello Trekking?", options: ["Base", "Medio", "Pro"] },
    { q: "Luogo ideale?", options: ["Laghi", "Vette", "Boschi"] },
    { q: "Sforzo fisico?", options: ["Leggero", "Medio", "Intenso"] },
    { q: "Cosa cerchi?", options: ["Foto", "Pace", "Sfida"] },
    { q: "Quanto tempo?", options: ["Ore", "Giorno", "Tour"] },
  ];

  useEffect(() => {
    setVisibleCount(ITEMS_PER_LOAD);
  }, [activeFilter]);

  useEffect(() => {
    async function fetchEscursioni() {
      const { data } = await supabase
        .from("escursioni")
        .select("*")
        .order("data", { ascending: true });
      if (data) setEscursioni(data);
      // FIX: rimosso setTimeout artificiale da 800ms — lo skeleton è già presente
      setLoading(false);
    }
    fetchEscursioni();
  }, []);

  const handleAnswer = (option: string) => {
    const newAnswers = [...answers, option];

    if (currentQuestion < quizQuestions.length - 1) {
      setAnswers(newAnswers);
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // FIX: guard — se non ci sono escursioni non crashare
      if (escursioni.length === 0) {
        setQuizStep("intro");
        return;
      }

      let bestMatch = escursioni[0];
      let maxScore = -1;

      escursioni.forEach((esc) => {
        let score = 0;

        // 1. Match sul Livello (Domanda 2 - indice 1)
        const livelloScelto = newAnswers[1];
        const diff = esc.difficolta?.toLowerCase() || "";
        if (livelloScelto === "Base" && diff === "facile") score += 3;
        if (livelloScelto === "Medio" && diff === "medio") score += 3;
        if (livelloScelto === "Pro" && diff.includes("difficile")) score += 3;

        // 2. Match sulla Durata (Domanda 6 - indice 5)
        const tempoScelto = newAnswers[5];
        const cat = esc.categoria?.toLowerCase() || "";
        if (
          (tempoScelto === "Ore" || tempoScelto === "Giorno") &&
          cat === "giornata"
        )
          score += 3;
        if (tempoScelto === "Tour" && cat === "tour") score += 3;

        // 3. Randomizzazione lieve per variare risultati a parità di punteggio
        score += Math.random();

        if (score > maxScore) {
          maxScore = score;
          bestMatch = esc;
        }
      });

      setSuggestedHike(bestMatch);
      setQuizStep("result");
    }
  };

  // FIX: filtro case-insensitive — Supabase può restituire "Giornata" o "giornata"
  const filteredEscursioni = escursioni.filter((esc) =>
    activeFilter === "tutte"
      ? true
      : esc.categoria?.toLowerCase() === activeFilter.toLowerCase(),
  );
  const visibleEscursioni = filteredEscursioni.slice(0, visibleCount);

  if (loading) {
    return (
      <div className="container mx-auto px-5 py-10 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-5 py-10 md:py-20">
      {/* --- HEADER --- */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9] mb-4">
            Prossime <br />
            <span className="text-brand-sky italic font-light">Avventure.</span>
          </h1>
          <div className="h-1.5 w-12 bg-brand-sky rounded-full" />
        </div>

        <div className="flex bg-stone-100 p-1.5 rounded-[2rem] self-start shadow-inner">
          {(["tutte", "giornata", "tour"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                activeFilter === f
                  ? "bg-white text-brand-stone shadow-md scale-105"
                  : "text-stone-400 hover:text-stone-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* --- GRID ESCURSIONI --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
        <AnimatePresence mode="popLayout">
          {visibleEscursioni.map((esc) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={esc.id}
              className="group relative bg-white rounded-[2.5rem] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-stone-100 flex flex-col"
            >
              <div className="relative h-52 w-full overflow-hidden rounded-[1.8rem]">
                {esc.immagine_url && (
                  <img
                    src={esc.immagine_url}
                    alt={esc.titolo}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
                <div className="absolute top-4 right-4 backdrop-blur-md bg-white/20 border border-white/30 px-3 py-1.5 rounded-2xl text-[8px] font-black uppercase text-white">
                  {esc.difficolta}
                </div>
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-xl shadow-lg text-[10px] font-black text-brand-stone">
                  €{esc.prezzo}
                </div>
              </div>

              <div className="p-5 flex flex-col flex-grow">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-[1px] w-5 bg-brand-sky" />
                  <span className="text-[9px] font-bold text-brand-sky uppercase tracking-[0.2em]">
                    {new Date(esc.data).toLocaleDateString("it-IT", {
                      day: "2-digit",
                      month: "long",
                    })}
                  </span>
                </div>
                <h2 className="text-xl font-black mb-3 text-brand-stone uppercase tracking-tighter leading-tight group-hover:text-brand-sky transition-colors line-clamp-1 italic">
                  {esc.titolo}
                </h2>
                <p className="text-stone-400 text-[13px] mb-8 line-clamp-2 font-medium leading-relaxed flex-grow">
                  {esc.descrizione}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedActivity(esc);
                      setIsDetailOpen(true);
                    }}
                    className="flex-1 border border-stone-200 text-brand-stone py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-stone-50 transition-all active:scale-95"
                  >
                    Dettagli
                  </button>
                  <button
                    onClick={() => onBookingClick(esc.titolo)}
                    className="flex-[1.5] bg-brand-stone text-white py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-brand-sky transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
                  >
                    Prenota <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* --- CARICA ALTRO --- */}
      {visibleCount < filteredEscursioni.length && (
        <div className="mt-16 flex justify-center">
          <button
            onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_LOAD)}
            className="group flex items-center gap-3 bg-white border-2 border-brand-stone text-brand-stone px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-brand-stone hover:text-white transition-all shadow-lg active:scale-95"
          >
            Carica altre mete{" "}
            <ChevronDown
              size={14}
              className="group-hover:translate-y-1 transition-transform"
            />
          </button>
        </div>
      )}

      {/* --- QUIZ BOX --- */}
      <section className="max-w-4xl mx-auto mt-32 relative px-2">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-sky/20 to-brand-stone/5 rounded-[2.5rem] blur-2xl opacity-50" />
        <div className="relative bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-50">
          <div className="flex flex-col md:flex-row min-h-[400px]">
            <div className="w-full md:w-2/5 relative h-48 md:h-auto overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80"
                alt="Montagna"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-brand-stone/70 to-transparent" />
              <div className="absolute bottom-6 left-8 text-white z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-brand-sky" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em]">
                    Altour consiglia
                  </span>
                </div>
                <h3 className="text-2xl font-black uppercase leading-none tracking-tighter italic">
                  Trova la tua <br /> prossima avventura
                </h3>
              </div>
            </div>

            <div className="w-full md:w-3/5 p-10 md:p-14 flex flex-col justify-center bg-[#faf9f7]">
              <AnimatePresence mode="wait">
                {quizStep === "intro" && (
                  <motion.div
                    key="intro"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <h4 className="text-xs font-black text-brand-sky uppercase tracking-[0.2em] mb-4">
                      Sei indeciso?
                    </h4>
                    <p className="text-stone-500 text-sm font-medium mb-8 leading-relaxed">
                      Rispondi a 6 rapidi quesiti per trovare l'esperienza
                      perfetta.
                    </p>
                    <button
                      onClick={() => setQuizStep("questions")}
                      className="w-full md:w-auto bg-brand-stone text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-brand-sky transition-all shadow-xl active:scale-95"
                    >
                      Inizia il Test <ArrowRight size={14} />
                    </button>
                  </motion.div>
                )}

                {quizStep === "questions" && (
                  <motion.div
                    key="questions"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div className="h-1 flex-grow bg-stone-200 rounded-full mr-4">
                        <motion.div
                          className="h-full bg-brand-sky rounded-full"
                          animate={{
                            width: `${((currentQuestion + 1) / 6) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-stone-400">
                        {currentQuestion + 1}/6
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-brand-stone uppercase tracking-tight mb-8 leading-tight">
                      {quizQuestions[currentQuestion].q}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {quizQuestions[currentQuestion].options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleAnswer(opt)}
                          className="p-4 rounded-xl bg-white border border-stone-200 hover:border-brand-sky hover:text-brand-sky transition-all text-[10px] font-black uppercase tracking-wider text-left flex justify-between items-center group shadow-sm active:scale-95"
                        >
                          {opt}{" "}
                          <ArrowRight
                            size={12}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {quizStep === "result" && suggestedHike && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 bg-brand-sky/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Star
                        size={28}
                        className="text-brand-sky fill-brand-sky"
                      />
                    </div>
                    <p className="text-[10px] font-black text-brand-sky uppercase tracking-[0.2em] mb-2">
                      Abbiamo scelto per te:
                    </p>
                    <h4 className="text-2xl font-black text-brand-stone uppercase mb-10 tracking-tight italic">
                      {suggestedHike.titolo}
                    </h4>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => {
                          setSelectedActivity(suggestedHike);
                          setIsDetailOpen(true);
                        }}
                        className="bg-brand-stone text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95"
                      >
                        Visualizza
                      </button>
                      {/* FIX: reset anche answers[] al "Rifai il test" */}
                      <button
                        onClick={() => {
                          setQuizStep("intro");
                          setCurrentQuestion(0);
                          setAnswers([]);
                        }}
                        className="text-stone-400 font-black uppercase text-[9px] py-2 flex items-center justify-center gap-2"
                      >
                        <RefreshCcw size={12} /> Rifai il test
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onBook={onBookingClick}
      />
    </div>
  );
}
