import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import ActivityDetailModal from "../components/ActivityDetailModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Navigation,
  Compass,
  RefreshCcw,
  Star,
  Sparkles,
} from "lucide-react";

type Escursione = Database["public"]["Tables"]["escursioni"]["Row"];

interface EscursioniPageProps {
  onNavigate: (page: string) => void;
  onBookingClick: (title: string) => void;
}

export default function EscursioniPage({
  onBookingClick,
}: EscursioniPageProps) {
  const [escursioni, setEscursioni] = useState<Escursione[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Escursione | null>(
    null,
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"giornata" | "tour">("giornata");

  // Quiz States
  const [quizStep, setQuizStep] = useState<"intro" | "questions" | "result">(
    "intro",
  );
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [suggestedHike, setSuggestedHike] = useState<Escursione | null>(null);

  const quizQuestions = [
    { q: "Con chi verrai?", options: ["Solo", "Coppia", "Gruppo"] },
    { q: "Esperienza Trekking?", options: ["Base", "Intermedio", "Esperto"] },
    { q: "Ambiente ideale?", options: ["Laghi", "Vette", "Boschi"] },
    { q: "Livello di sfida?", options: ["Leggero", "Moderato", "Intenso"] },
    { q: "Cosa cerchi?", options: ["Foto", "Pace", "Adrenalina"] },
    {
      q: "Durata ideale?",
      options: ["Mezza giornata", "Intera giornata", "Più giorni"],
    },
  ];

  useEffect(() => {
    async function fetchEscursioni() {
      const { data } = await supabase
        .from("escursioni")
        .select("*")
        .order("data", { ascending: true });
      if (data) setEscursioni(data);
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
      // Semplice logica: suggerisce una delle escursioni filtrate
      const currentCategoryHikes = escursioni.filter(
        (e) => e.categoria === activeTab,
      );
      const match =
        currentCategoryHikes.length > 0
          ? currentCategoryHikes[
              Math.floor(Math.random() * currentCategoryHikes.length)
            ]
          : escursioni[0];
      setSuggestedHike(match);
      setQuizStep("result");
    }
  };

  const filteredEscursioni = escursioni.filter(
    (esc) => esc.categoria === activeTab,
  );

  if (loading)
    return (
      <div className="p-10 text-center text-stone-400 font-black uppercase text-xs">
        Caricamento...
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-16">
      {/* 1. TITOLO E TABS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
        <div>
          <h1 className="text-5xl font-black text-brand-stone uppercase tracking-tighter leading-none mb-4">
            Esplora la Montagna
          </h1>
          <p className="text-stone-400 font-medium uppercase tracking-widest text-xs">
            Scegli il ritmo della tua avventura
          </p>
        </div>

        <div className="bg-brand-glacier p-2 rounded-2xl flex gap-1 border border-stone-100 self-start shadow-sm">
          {["giornata", "tour"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`relative px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab
                  ? "text-white"
                  : "text-stone-400 hover:text-brand-stone"
              }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 bg-brand-stone rounded-xl shadow-lg"
                />
              )}
              <span className="relative z-10">
                {tab === "giornata" ? "In Giornata" : "Tour"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. GRIGLIA ESCURSIONI (RIPRISTINATA) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredEscursioni.map((esc) => (
            <div
              key={esc.id}
              className="bg-white rounded-[2.5rem] shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100 flex flex-col group hover:shadow-2xl transition-all duration-500"
            >
              <div className="h-64 relative overflow-hidden">
                {esc.immagine_url && (
                  <img
                    src={esc.immagine_url}
                    alt={esc.titolo}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                )}
                <div className="absolute top-6 right-6 flex flex-col gap-2 items-end">
                  <div className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter text-brand-stone shadow-sm border border-white/20">
                    {esc.difficolta}
                  </div>
                  <div className="bg-brand-sky px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter text-white shadow-sm flex items-center gap-2">
                    <Navigation size={10} />
                    {esc.categoria === "giornata" ? "Giornata" : "Tour"}
                  </div>
                </div>
              </div>
              <div className="p-8 md:p-10 flex flex-col flex-grow">
                <div className="flex items-center gap-2 text-brand-sky font-black text-[10px] uppercase tracking-widest mb-4">
                  <Calendar size={14} /> Su richiesta
                </div>
                <h2 className="text-2xl font-black mb-6 text-brand-stone uppercase tracking-tight leading-tight group-hover:text-brand-sky transition-colors">
                  {esc.titolo}
                </h2>
                <p className="text-stone-500 text-sm mb-8 line-clamp-3 font-medium flex-grow leading-relaxed">
                  {esc.descrizione}
                </p>
                <div className="flex gap-3 mt-auto pt-8 border-t border-stone-50">
                  <button
                    onClick={() => {
                      setSelectedActivity(esc);
                      setIsDetailOpen(true);
                    }}
                    className="flex-1 border-2 border-brand-stone text-brand-stone py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-stone hover:text-white transition-all"
                  >
                    Dettagli
                  </button>
                  <button
                    onClick={() => onBookingClick(esc.titolo)}
                    className="flex-[2] bg-brand-sky text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-stone transition-all shadow-xl shadow-brand-sky/20"
                  >
                    Richiedi Info
                  </button>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* 3. COMPACT QUIZ BOX CON IMMAGINE (POSIZIONATA SOTTO) */}
      <section className="max-w-4xl mx-auto mt-24 relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-sky/20 to-brand-stone/10 rounded-[2.5rem] blur-xl opacity-40 group-hover:opacity-60 transition duration-1000" />

        <div className="relative bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-100 flex flex-col md:flex-row min-h-[400px]">
          {/* Left: Image Column */}
          <div className="w-full md:w-2/5 relative min-h-[200px] md:min-h-full">
            <img
              src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80"
              className="absolute inset-0 w-full h-full object-cover"
              alt="Quiz Background"
            />
            <div className="absolute inset-0 bg-brand-stone/40 backdrop-grayscale-[0.5]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
              <Compass
                size={40}
                className="mb-4 text-brand-sky animate-spin-slow"
              />
              <h3 className="text-2xl font-black uppercase tracking-tighter">
                Trova la tua <br /> meta ideale
              </h3>
            </div>
          </div>

          {/* Right: Quiz Content */}
          <div className="w-full md:w-3/5 p-8 md:p-12 bg-[#faf9f8] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {quizStep === "intro" && (
                <motion.div
                  key="intro"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center md:text-left"
                >
                  <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                    <Sparkles size={16} className="text-brand-sky" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-sky">
                      Smart Matcher
                    </span>
                  </div>
                  <p className="text-stone-500 text-sm font-medium mb-8 leading-relaxed">
                    Rispondi a poche domande e ti suggeriremo l'escursione
                    perfetta in base alle tue preferenze.
                  </p>
                  <button
                    onClick={() => setQuizStep("questions")}
                    className="w-full md:w-auto bg-brand-stone text-white px-10 py-5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-sky transition-all shadow-lg"
                  >
                    Inizia il Quiz
                  </button>
                </motion.div>
              )}

              {quizStep === "questions" && (
                <motion.div
                  key="questions"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">
                      Passo {currentQuestion + 1} / 6
                    </span>
                    <div className="h-1 w-24 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-sky"
                        style={{
                          width: `${((currentQuestion + 1) / 6) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-brand-stone uppercase tracking-tight mb-8 leading-tight">
                    {quizQuestions[currentQuestion].q}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quizQuestions[currentQuestion].options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleAnswer(opt)}
                        className="p-4 rounded-xl bg-white border border-stone-200 hover:border-brand-sky hover:text-brand-sky transition-all text-[10px] font-black uppercase text-left group"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {quizStep === "result" && suggestedHike && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <Star
                    size={32}
                    className="mx-auto text-brand-sky fill-brand-sky mb-4"
                  />
                  <h4 className="text-2xl font-black text-brand-stone uppercase mb-8">
                    {suggestedHike.titolo}
                  </h4>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        setSelectedActivity(suggestedHike);
                        setIsDetailOpen(true);
                      }}
                      className="bg-brand-stone text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest"
                    >
                      Dettagli Meta
                    </button>
                    <button
                      onClick={() => setQuizStep("intro")}
                      className="text-stone-400 font-black uppercase text-[9px] flex items-center justify-center gap-2"
                    >
                      {" "}
                      <RefreshCcw size={12} /> Ripeti
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 4. MODALE DETTAGLIO */}
      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onBook={onBookingClick}
      />
    </div>
  );
}
