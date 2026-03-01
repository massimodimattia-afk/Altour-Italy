import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import ActivityDetailModal from "../components/ActivityDetailModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  RefreshCcw,
  Star,
  ChevronDown,
  Calendar,
} from "lucide-react";

// FIX: Estendiamo il tipo per includere la nuova colonna Supabase
type Escursione = Database["public"]["Tables"]["escursioni"]["Row"] & {
  filosofia?: string | null;
  lunghezza?: number | null;
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
}

interface EscursioniPageProps {
  onNavigate: (page: string) => void;
  onBookingClick: (title: string) => void;
}

// --- SKELETON LOADER ---
const FILOSOFIA_COLORS: Record<string, string> = {
  Avventura: "#e94544",
  Benessere: "#a5daca",
  "Borghi più belli": "#946a52",
  Formazione: "#002f59",
  "Giornata da Guida": "#75c43c",
  "Immersi nel verde": "#358756",
  "Luoghi dello Spirito": "#c8a3c9",
  "Outdoor Education": "#01aa9f",
  Speciali: "#b8163c",
  "Tra Mare e Cielo": "#7aaecd",
  "Trek Urbano": "#f39452",
};

function getFilosofiaOpacity(color: string): string {
  // Colori scuri: opacità ridotta per mantenere l'effetto glass
  const dark = ["#002f59", "#946a52", "#b8163c", "#358756"];
  return dark.includes(color) ? `${color}aa` : `${color}cc`;
}

function FilosofiaBadge({ value }: { value: string | null | undefined }) {
  if (!value) return null;
  const color = FILOSOFIA_COLORS[value] ?? "#44403c";
  const bg = getFilosofiaOpacity(color);
  return (
    <div
      className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-sm"
      style={{
        backgroundColor: bg,
        color: "rgba(255,255,255,0.95)",
        textShadow: "0 1px 3px rgba(0,0,0,0.35)",
        boxShadow: `0 2px 12px ${color}55, inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0 1px ${color}`,
      }}
    >
      {value}
    </div>
  );
}

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
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
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
      // FIX: casting per includere la colonna aggiunta manualmente
      if (data) setEscursioni(data as Escursione[]);
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
      if (escursioni.length === 0) {
        setQuizStep("intro");
        return;
      }

      let bestMatch = escursioni[0];
      let maxScore = -Infinity;

      escursioni.forEach((esc) => {
        let score = 0;
        const t = esc.titolo?.toLowerCase() || "";
        const d = esc.descrizione?.toLowerCase() || "";
        const diffDB = esc.difficolta ?? ""; // es. 'Facile', 'Facile-Media', 'Media', 'Media-Impegnativa', 'Impegnativa'
        const cat = esc.categoria?.toLowerCase() || "";
        const filo = esc.filosofia?.toLowerCase() || "";

        // 1. COMPAGNIA (Peso 2)
        const compagnia = newAnswers[0];
        if (
          compagnia === "Solo" &&
          (filo.includes("spirit") || d.includes("silenzio"))
        )
          score += 2;
        if (
          compagnia === "Coppia" &&
          (d.includes("tramonto") || d.includes("emozione"))
        )
          score += 2;
        if (
          compagnia === "Gruppo" &&
          (d.includes("convivial") || d.includes("compagnia"))
        )
          score += 2;

        // 2. LIVELLO TREKKING (Peso 10 — sicurezza prioritaria)
        const livello = newAnswers[1];
        if (livello === "Base") {
          if (diffDB === "Facile") score += 10;
          else if (diffDB === "Facile-Media") score += 5;
          else score -= 15;
        } else if (livello === "Medio") {
          if (diffDB === "Media") score += 10;
          else if (diffDB === "Facile-Media" || diffDB === "Media-Impegnativa")
            score += 7;
          else if (diffDB === "Facile") score += 3;
        } else if (livello === "Pro") {
          if (diffDB === "Impegnativa") score += 10;
          else if (diffDB === "Media-Impegnativa") score += 8;
          else if (diffDB === "Media") score += 4;
        }

        // 3. LUOGO IDEALE (Peso 5)
        const luogo = newAnswers[2].toLowerCase();
        if (luogo === "laghi" && (t.includes("lago") || d.includes("acqua")))
          score += 5;
        if (
          luogo === "vette" &&
          (t.includes("cima") || t.includes("vetta") || d.includes("panorama"))
        )
          score += 5;
        if (
          luogo === "boschi" &&
          (d.includes("bosco") || d.includes("alberi") || d.includes("ombra"))
        )
          score += 5;

        // 4. SFORZO FISICO (Peso 6)
        const sforzo = newAnswers[3];
        if (sforzo === "Leggero") {
          if (diffDB === "Facile") score += 6;
          if (d.includes("pianeggiante") || d.includes("relax")) score += 2;
        } else if (sforzo === "Medio") {
          if (diffDB === "Facile-Media" || diffDB === "Media") score += 6;
        } else if (sforzo === "Intenso") {
          if (diffDB === "Media-Impegnativa" || diffDB === "Impegnativa")
            score += 6;
          if (d.includes("dislivello") || d.includes("ripido")) score += 2;
        }

        // 5. COSA CERCHI (Peso 3)
        const cerca = newAnswers[4];
        if (
          cerca === "Foto" &&
          (filo.includes("panoram") || d.includes("vista"))
        )
          score += 3;
        if (cerca === "Pace" && (filo.includes("spirit") || d.includes("pace")))
          score += 3;
        if (
          cerca === "Sfida" &&
          (diffDB.includes("Impegnativa") || t.includes("traversata"))
        )
          score += 3;

        // 6. QUANTO TEMPO (Peso 8 — logistica)
        const tempo = newAnswers[5];
        if (
          tempo === "Ore" &&
          cat === "giornata" &&
          (d.includes("mezza") || d.includes("breve"))
        )
          score += 8;
        else if (tempo === "Giorno" && cat === "giornata") score += 8;
        else if (tempo === "Tour" && cat === "tour") score += 8;
        else score -= 5;

        // Bonus: entropia minima per tiebreaker
        score += Math.random() * 0.5;

        if (score > maxScore) {
          maxScore = score;
          bestMatch = esc;
        }
      });

      setSuggestedHike(bestMatch);
      setQuizStep("result");
    }
  };

  const filteredEscursioni = escursioni.filter((esc) =>
    activeFilter === "tutte"
      ? true
      : esc.categoria?.toLowerCase() === activeFilter.toLowerCase(),
  );
  const visibleEscursioni = filteredEscursioni.slice(0, visibleCount);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 md:py-20">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        <AnimatePresence mode="popLayout">
          {visibleEscursioni.map((esc) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={esc.id}
              className="bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden flex flex-col group transition-all duration-300 hover:-translate-y-1.5"
              style={{
                boxShadow:
                  "0 4px 6px -1px rgba(0,0,0,0.06), 0 10px 30px -5px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 8px 16px -2px rgba(0,0,0,0.10), 0 24px 48px -8px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow =
                  "0 4px 6px -1px rgba(0,0,0,0.06), 0 10px 30px -5px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)")
              }
            >
              <div className="h-48 md:h-56 relative overflow-hidden">
                {esc.immagine_url && (
                  <img
                    src={esc.immagine_url}
                    alt={esc.titolo}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                )}
                {/* Gradiente base */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                {/* Accent line in fondo all'immagine */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-sky/80 via-brand-sky to-brand-sky/30" />
                <FilosofiaBadge value={esc.filosofia} />
              </div>

              <div className="p-5 md:p-8 flex flex-col flex-grow">
                <p className="text-brand-sky font-bold text-[10px] uppercase mb-2 flex items-center">
                  <Calendar size={12} className="mr-1.5" />
                  {esc.data
                    ? new Date(esc.data).toLocaleDateString("it-IT", {
                        day: "2-digit",
                        month: "long",
                      })
                    : "Su richiesta"}
                </p>
                <h3 className="text-lg md:text-xl font-black mb-3 md:mb-4 text-brand-stone uppercase line-clamp-2">
                  {esc.titolo}
                </h3>
                <p className="text-stone-500 text-xs md:text-sm mb-6 line-clamp-3 font-medium flex-grow leading-relaxed">
                  {esc.descrizione}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedActivity(esc);
                      setIsDetailOpen(true);
                    }}
                    className="flex-1 bg-white border-2 border-stone-900 text-stone-900 py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-stone-50 transition-all active:scale-95"
                  >
                    Dettagli
                  </button>
                  <button
                    onClick={() => onBookingClick(esc.titolo)}
                    className="flex-[1.5] py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 bg-brand-sky text-white hover:bg-[#0284c7]"
                  >
                    Richiedi Informazioni <ArrowRight size={12} />
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
                  <Star size={14} className="text-brand-sky fill-brand-sky" />
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
                      onClick={() => {
                        setCurrentQuestion(0);
                        setAnswers([]);
                        setQuizStep("questions");
                      }}
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
