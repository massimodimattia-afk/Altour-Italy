import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import ActivityDetailModal from "../components/ActivityDetailModal";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, RefreshCcw, Star, ChevronDown, Calendar, X } from "lucide-react";

// FIX: Estendiamo il tipo per includere la nuova colonna Supabase
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

// ── Costanti fuori dal componente: non vengono ricreate ad ogni render ────────
const QUIZ_QUESTIONS = [
  { q: "Con chi verrai?", options: ["Solo", "Coppia", "Gruppo"] },
  { q: "Livello Trekking?", options: ["Base", "Medio", "Pro"] },
  { q: "Luogo ideale?", options: ["Mare, lago o fiume", "Vette", "Boschi", "Prati o spazi aperti"] },
  { q: "Sforzo fisico?", options: ["Leggero", "Medio", "Intenso"] },
  { q: "Cosa cerchi?", options: ["Panorami", "Pace", "Tempo di qualità", "Racconto"] },
  { q: "Quanto tempo?", options: ["Ore", "Giorno", "Tour"] },
];

// ─── Mappa filosofia → segnali quiz ──────────────────────────────────────────
const FILOSOFIA_QUIZ_MAP: Record<string, Record<string, string>> = {
  "Avventura":             { cerca: "Tempo di qualità", sforzo: "Intenso", livello: "Pro" },
  "Benessere":             { cerca: "Pace", sforzo: "Leggero", compagnia: "Coppia" },
  "Borghi più belli":      { luogo: "Boschi", tempo: "Giorno", cerca: "Racconto" },
  "Cammini":               { luogo: "Boschi", tempo: "Tour", cerca: "Pace" },
  "Educazione all'aperto": { livello: "Base", compagnia: "Gruppo" },
  "Eventi":                { compagnia: "Gruppo", tempo: "Giorno" },
  "Formazione":            { livello: "Base", tempo: "Tour", cerca: "Racconto" },
  "Immersi nel verde":     { luogo: "Boschi", cerca: "Pace" },
  "Luoghi dello spirito":  { cerca: "Pace", compagnia: "Solo" },
  "Novità":                { cerca: "Tempo di qualità", compagnia: "Gruppo", tempo: "Giorno" },
  "Speciali":              { cerca: "Tempo di qualità", compagnia: "Gruppo" },
  "Tra mare e cielo":      { luogo: "Mare, lago o fiume", cerca: "Panorami" },
  "Trek urbano":           { tempo: "Ore", sforzo: "Leggero" },
};

// --- SKELETON LOADER ---
const FILOSOFIA_COLORS: Record<string, string> = {
  "Avventura":              "#e94544",
  "Benessere":              "#a5d9c9",
  "Borghi più belli":       "#946a52",
  "Cammini":                "#e3c45d",
  "Educazione all'aperto":  "#01aa9f",
  "Eventi":                 "#ffc0cb",
  "Formazione":             "#002f59",
  "Immersi nel verde":      "#358756",
  "Luoghi dello spirito":   "#c8a3c9",
  "Novità":                 "#75c43c",
  "Speciali":               "#b8163c",
  "Tra mare e cielo":       "#7aaecd",
  "Trek urbano":            "#f39452",
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
  // Fix #1: quiz uses a shuffled copy so the displayed grid keeps date order
  const quizPoolRef = useRef<Escursione[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filtri e Paginazione
  const [activeFilter, setActiveFilter] = useState<"tutte" | "giornata" | "tour">("tutte");
  // Fix #8: load 6 items at a time on desktop (fills 2×3 grid), 3 on mobile (3 scroll pages)
  const ITEMS_PER_LOAD = typeof window !== "undefined" && window.innerWidth >= 1024 ? 6 : 3;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);

  // Quiz States
  const [quizStep, setQuizStep] = useState<"intro" | "questions" | "result">("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [suggestedHike, setSuggestedHike] = useState<Escursione | null>(null);
  const [shownSuggestions, setShownSuggestions] = useState<string[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [pressedOption, setPressedOption] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const quizRef = useRef<HTMLDivElement>(null);

  // Fix #3: visibleCount reset is synchronous inside the click handler (see filter buttons below).
  // The useEffect approach caused a 1-frame flash where old count + new filter were both active.

  useEffect(() => {
    async function fetchEscursioni() {
      const { data } = await supabase
        .from("escursioni")
        .select("*")
        .order("data", { ascending: true });
      if (data) {
        const typed = data as Escursione[];
        // Fix #1: display grid respects date order from Supabase.
        // Quiz pool is a separately shuffled copy so results vary between attempts.
        setEscursioni(typed);
        quizPoolRef.current = [...typed].sort(() => Math.random() - 0.5);
      }
      setLoading(false);
    }
    fetchEscursioni();
  }, []);

  // Fix #2: guard prevents double-tap from advancing two questions at once.
  const processingAnswerRef = useRef(false);

  const handleAnswer = (option: string) => {
    if (processingAnswerRef.current) return;
    processingAnswerRef.current = true;
    setPressedOption(option);

    // Only the visual feedback reset is deferred — all state updates happen synchronously.
    setTimeout(() => {
      setPressedOption(null);
      processingAnswerRef.current = false;
    }, 160);

    const newAnswers = [...answers, option];

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setAnswers(newAnswers);
      setCurrentQuestion((prev) => prev + 1);
      return;
    }

    const pool = quizPoolRef.current;
    if (pool.length === 0) { setQuizStep("intro"); return; }

    const [compagnia, livello, luogo, sforzo, cerca, tempo] = newAnswers;

    let bestMatch = pool[0];
    let maxScore = -Infinity;

    pool.forEach((esc) => {
      let score = 0;
      const t = esc.titolo?.toLowerCase() || "";
      const d = esc.descrizione?.toLowerCase() || "";
      const diffDB = esc.difficolta ?? "";
      const cat = esc.categoria?.toLowerCase() || "";
      const filo = esc.filosofia ?? "";

      // ── 1. FILOSOFIA come segnale primario (Peso 8) ─────────────────────
      const filoSignals = FILOSOFIA_QUIZ_MAP[filo] ?? {};
      if (filoSignals.compagnia === compagnia) score += 8;
      if (filoSignals.livello === livello)     score += 8;
      if (filoSignals.luogo === luogo)         score += 8;
      if (filoSignals.sforzo === sforzo)       score += 8;
      if (filoSignals.cerca === cerca)         score += 8;
      if (filoSignals.tempo === tempo)         score += 8;

      // ── 2. LIVELLO TREKKING — filtro hard con null-safety (Peso 10) ─────
      if (diffDB) {
        if (livello === "Base") {
          if (diffDB === "Facile")             score += 10;
          else if (diffDB === "Facile-Media")  score += 5;
          else if (diffDB === "Media")         score -= 8;
          else                                 score -= 15;
        } else if (livello === "Medio") {
          if (diffDB === "Media")                                         score += 10;
          else if (diffDB === "Facile-Media" || diffDB === "Media-Impegnativa") score += 7;
          else if (diffDB === "Facile")                                   score += 3;
        } else if (livello === "Pro") {
          if (diffDB === "Impegnativa")        score += 10;
          else if (diffDB === "Media-Impegnativa") score += 8;
          else if (diffDB === "Media")         score += 4;
        }
      }
      // se difficolta è null → nessuna penalità, campo non valorizzato

      // ── 3. QUANTO TEMPO — logistica (Peso 8) ────────────────────────────
      if (tempo === "Ore" && cat === "giornata")  score += 8;
      else if (tempo === "Giorno" && cat === "giornata") score += 8;
      else if (tempo === "Tour" && cat === "tour") score += 8;
      else if (cat)                               score -= 5;
      // se categoria è null → nessuna penalità

      // ── 4. SFORZO FISICO — rinforzo secondario (Peso 4) ─────────────────
      if (diffDB) {
        if (sforzo === "Leggero" && (diffDB === "Facile" || diffDB === "Facile-Media")) score += 4;
        if (sforzo === "Medio"   && (diffDB === "Facile-Media" || diffDB === "Media"))  score += 4;
        if (sforzo === "Intenso" && (diffDB === "Media-Impegnativa" || diffDB === "Impegnativa")) score += 4;
      }
      if (sforzo === "Leggero" && (d.includes("pianeggiante") || d.includes("relax"))) score += 2;
      if (sforzo === "Intenso" && (d.includes("dislivello")  || d.includes("ripido"))) score += 2;

      // ── 5. LUOGO IDEALE — keyword fallback (Peso 4) ──────────────────────
      const luogoL = luogo.toLowerCase();
      if (luogoL === "mare, lago o fiume"   && (t.includes("lago") || t.includes("mare") || t.includes("fiume") || d.includes("lago") || d.includes("acqua") || d.includes("mare") || d.includes("costiera"))) score += 4;
      if (luogoL === "vette"                && (t.includes("cima")  || t.includes("vetta") || d.includes("panorama"))) score += 4;
      if (luogoL === "boschi"               && (d.includes("bosco") || d.includes("alberi") || d.includes("foresta"))) score += 4;
      if (luogoL === "prati o spazi aperti" && (d.includes("prato") || d.includes("aperto") || d.includes("pianura") || d.includes("campo") || d.includes("pascolo"))) score += 4;

      // ── 6. COSA CERCHI (Peso 3) ──────────────────────────────────────────
      if (cerca === "Panorami"         && (d.includes("vista") || d.includes("panoram") || d.includes("foto")))              score += 3;
      if (cerca === "Pace"             && (d.includes("pace")  || d.includes("silenzio") || d.includes("relax")))             score += 3;
      if (cerca === "Tempo di qualità" && (diffDB.includes("Impegnativa") || t.includes("traversata") || d.includes("sfida"))) score += 3;
      if (cerca === "Racconto"         && (d.includes("storia") || d.includes("cultura") || d.includes("racconto") || d.includes("tradizion") || d.includes("borghi"))) score += 3;

      // ── 7. COMPAGNIA (Peso 2) ─────────────────────────────────────────────
      if (compagnia === "Solo"   && (d.includes("silenzio") || d.includes("solitari"))) score += 2;
      if (compagnia === "Coppia" && (d.includes("tramonto") || d.includes("romantico") || d.includes("coppia"))) score += 2;
      if (compagnia === "Gruppo" && (d.includes("convivial") || d.includes("gruppo") || d.includes("compagnia"))) score += 2;

      // ── 8. DIVERSITÀ: penalizza suggerimenti già mostrati ────────────────
      if (shownSuggestions.includes(esc.id)) score -= 12;

      // ── 9. Tiebreaker casuale ─────────────────────────────────────────────
      score += Math.random() * 1.5;

      if (score > maxScore) { maxScore = score; bestMatch = esc; }
    });

    setShownSuggestions(prev => [...prev, bestMatch.id]);
    setSuggestedHike(bestMatch);
    setQuizStep("result");
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
              onClick={() => { setActiveFilter(f); setVisibleCount(ITEMS_PER_LOAD); }}
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

      {/* --- BANNER QUIZ — sfondo semplice --- */}
      <AnimatePresence>
        {!quizStarted && !bannerDismissed && (
          <motion.div
            key="quiz-strip"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, paddingBottom: 0, marginBottom: 0, scaleY: 0.92 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            style={{ transformOrigin: "top", overflow: "hidden" }}
            className="rounded-[1.75rem] mb-10 cursor-pointer group bg-stone-100/80 border border-stone-200/60 hover:border-brand-sky/30 hover:bg-stone-100 transition-all"
            onClick={() => {
              setQuizStarted(true);
              setQuizStep("intro");
              setTimeout(() => {
                if (!quizRef.current) return;
                const top = quizRef.current.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top, behavior: "smooth" });
              }, 60);
            }}
          >
            <div className="flex items-center justify-between gap-4 px-6 py-5 md:px-8 md:py-6">
              <div className="flex items-center gap-4 min-w-0">
                <span className="text-2xl select-none shrink-0">🧭</span>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-sky mb-0.5">
                    Trova la tua escursione
                  </p>
                  <p className="text-brand-stone font-black uppercase tracking-tight text-sm md:text-base leading-tight">
                    Non sai da dove iniziare?{" "}
                    <span className="text-stone-400 font-bold normal-case tracking-normal group-hover:text-brand-sky transition-colors">
                      Scopri il tuo stile Altour →
                    </span>
                  </p>
                </div>
              </div>

              {/* CTA pill */}
              <div className="hidden sm:flex items-center gap-3 shrink-0">
                <div className="bg-brand-stone text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm group-hover:bg-brand-sky transition-all">
                  Inizia il quiz
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setBannerDismissed(true); }}
                  className="text-stone-300 hover:text-stone-500 transition-colors p-1"
                  aria-label="Chiudi"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Mobile: solo X — chiude solo il banner */}
              <button
                onClick={(e) => { e.stopPropagation(); setBannerDismissed(true); }}
                className="sm:hidden shrink-0 text-stone-300 hover:text-stone-500 transition-colors p-1"
                aria-label="Chiudi"
              >
                <X size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              className="bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden flex flex-col group transition-all duration-300 hover:-translate-y-1.5 active:scale-[0.98]"
              style={{
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.06), 0 10px 30px -5px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)",
              }}
            >
              <div className="h-48 md:h-56 relative overflow-hidden">
                {esc.immagine_url && (
                  <img
                    src={esc.immagine_url}
                    alt={esc.titolo}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    loading="lazy"
                    decoding="async"
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
                <div className="relative mb-6 flex-grow">
                  <p className={`text-stone-500 text-xs md:text-sm line-clamp-3 leading-relaxed ${
                    esc.is_italic ? "italic font-serif" : "font-medium"
                  }`}>
                    {esc.descrizione}
                  </p>
                  {/* Fix #7: fade masks the line-clamp cut — works on all fonts including italic serif */}
                  <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedActivity(esc);
                      setIsDetailOpen(true);
                    }}
                    className="flex-1 bg-white border-2 border-stone-900 text-stone-900 py-4 min-h-[48px] rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-stone-50 transition-all active:scale-95"
                  >
                    Dettagli
                  </button>
                  <button
                    onClick={() => onBookingClick(esc.titolo)}
                    className="flex-[1.5] py-4 min-h-[48px] rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 bg-brand-sky text-white hover:bg-[#0284c7]"
                  >
                    Richiedi Info <ArrowRight size={12} />
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
      <section ref={quizRef} className="max-w-4xl mx-auto mt-16 md:mt-32 relative px-2">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-sky/20 to-brand-stone/5 rounded-[2.5rem] blur-2xl opacity-50" />
        <div className="relative bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-50">

          {/* ── MOBILE: stack verticale semplice ─────────────────────────────── */}
          <div className="md:hidden">
            {/* Collage in cima — si ritira quando il quiz è attivo */}
            <motion.div
              animate={{ height: quizStep === "intro" ? 208 : 0 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="relative overflow-hidden"
            >
              <img
                src="/collage-escursioni.webp"
                alt="Esperienze Altour"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-stone/60 via-transparent to-transparent" />
              {/* Tasto intro mobile */}
              <AnimatePresence>
                {quizStep === "intro" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute bottom-5 left-0 right-0 flex justify-center"
                  >
                    <button
                      onClick={() => { setCurrentQuestion(0); setAnswers([]); setQuizStep("questions"); }}
                      className="bg-white text-brand-stone px-7 py-3 rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-2 active:scale-95 hover:bg-brand-sky hover:text-white transition-all"
                    >
                      Inizia il Test <ArrowRight size={13} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            {/* Contenuto mobile */}
            <AnimatePresence>
              {quizStep !== "intro" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  // Fix #4: delay matches half the collage collapse duration (0.4s → delay 0.22s)
                  // so content never appears while the collage is still mid-collapse
                  transition={{ delay: 0.22, duration: 0.3, ease: "easeOut" }}
                  className="p-7 bg-[#faf9f7]"
                >
                  {quizStep === "questions" && (
                    <div>
                      <div className="flex justify-between items-center mb-5 gap-3">
                        {currentQuestion > 0 ? (
                          <button onClick={() => { setCurrentQuestion(p => p - 1); setAnswers(p => p.slice(0, -1)); }} className="text-stone-400 text-[9px] font-black uppercase tracking-widest">← Indietro</button>
                        ) : <span />}
                        <div className="h-1 flex-grow bg-stone-200 rounded-full">
                          <motion.div className="h-full bg-brand-sky rounded-full" animate={{ width: `${((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-stone-400 shrink-0">{currentQuestion + 1}/{QUIZ_QUESTIONS.length}</span>
                      </div>
                      <h3 className="text-lg font-black text-brand-stone uppercase tracking-tight mb-6">{QUIZ_QUESTIONS[currentQuestion].q}</h3>
                      <div className="grid grid-cols-1 gap-2.5">
                        {QUIZ_QUESTIONS[currentQuestion].options.map(opt => (
                          <button key={opt} onClick={() => handleAnswer(opt)}
                            className={`p-4 rounded-xl border transition-all text-[10px] font-black uppercase tracking-wider text-left flex justify-between items-center shadow-sm active:scale-95 ${
                              pressedOption === opt
                                ? "bg-brand-sky border-brand-sky text-white"
                                : "bg-white border-stone-200 hover:border-brand-sky hover:text-brand-sky"
                            }`}>
                            {opt} <ArrowRight size={12} className={pressedOption === opt ? "opacity-100" : "text-stone-300"} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {quizStep === "result" && suggestedHike && (
                    <div className="text-center py-4">
                      <div className="w-14 h-14 bg-brand-sky/10 rounded-full flex items-center justify-center mx-auto mb-5">
                        <Star size={24} className="text-brand-sky fill-brand-sky" />
                      </div>
                      <p className="text-[10px] font-black text-brand-sky uppercase tracking-widest mb-2">Abbiamo scelto per te:</p>
                      <h4 className="text-xl font-black text-brand-stone uppercase mb-7 tracking-tight italic">{suggestedHike.titolo}</h4>
                      <div className="flex flex-col gap-3">
                        <button onClick={() => { setSelectedActivity(suggestedHike); setIsDetailOpen(true); }} className="bg-brand-stone text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95">Visualizza</button>
                        <button onClick={() => {
                          setQuizStep("intro"); setCurrentQuestion(0); setAnswers([]);
                          // Fix #5: scroll back to quiz top so user sees collage reappear
                          setTimeout(() => {
                            if (!quizRef.current) return;
                            const top = quizRef.current.getBoundingClientRect().top + window.scrollY - 80;
                            window.scrollTo({ top, behavior: "smooth" });
                          }, 60);
                        }} className="text-stone-400 font-black uppercase text-[9px] py-2 flex items-center justify-center gap-2"><RefreshCcw size={12} /> Rifai il test</button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── DESKTOP: collage full-width → split animato ───────────────────── */}
          <div className="hidden md:flex min-h-[440px]">

            {/* Pannello sinistro — appare solo quando il quiz è attivo */}
            <AnimatePresence>
              {quizStep !== "intro" && (
                <motion.div
                  key="quiz-content-panel"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "50%", opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
                  className="flex-shrink-0 overflow-hidden bg-[#faf9f7] relative flex flex-col justify-center"
                >
                  {/* Texture collage sottile durante le domande */}
                  <img src="/collage-escursioni.webp" alt="" aria-hidden
                    className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-500 ${quizStep === "questions" ? "opacity-[0.06]" : "opacity-[0.03]"}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#faf9f7]/90 via-[#faf9f7]/70 to-[#faf9f7]/90 pointer-events-none" />

                  <div className="relative z-10 p-10 xl:p-14">
                    <AnimatePresence mode="wait">
                      {quizStep === "questions" && (
                        <motion.div key="questions" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                          <div className="flex justify-between items-center mb-6 gap-3">
                            {currentQuestion > 0 ? (
                              <button onClick={() => { setCurrentQuestion(p => p - 1); setAnswers(p => p.slice(0, -1)); }} className="text-stone-400 hover:text-brand-stone transition-colors text-[9px] font-black uppercase tracking-widest shrink-0">← Indietro</button>
                            ) : <span />}
                            <div className="h-1 flex-grow bg-stone-200 rounded-full">
                              <motion.div className="h-full bg-brand-sky rounded-full" animate={{ width: `${((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100}%` }} />
                            </div>
                            <span className="text-[10px] font-black text-stone-400 shrink-0">{currentQuestion + 1}/{QUIZ_QUESTIONS.length}</span>
                          </div>
                          <h3 className="text-xl font-black text-brand-stone uppercase tracking-tight mb-8 leading-tight">{QUIZ_QUESTIONS[currentQuestion].q}</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {QUIZ_QUESTIONS[currentQuestion].options.map(opt => (
                              <button key={opt} onClick={() => handleAnswer(opt)}
                                className={`p-4 rounded-xl border transition-all text-[10px] font-black uppercase tracking-wider text-left flex justify-between items-center group shadow-sm active:scale-95 ${
                                  pressedOption === opt
                                    ? "bg-brand-sky border-brand-sky text-white"
                                    : "bg-white border-stone-200 hover:border-brand-sky hover:text-brand-sky"
                                }`}>
                                {opt} <ArrowRight size={12} className={pressedOption === opt ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"} />
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                      {quizStep === "result" && suggestedHike && (
                        <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center relative z-10">
                          <div className="w-16 h-16 bg-brand-sky/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Star size={28} className="text-brand-sky fill-brand-sky" />
                          </div>
                          <p className="text-[10px] font-black text-brand-sky uppercase tracking-[0.2em] mb-2">Abbiamo scelto per te:</p>
                          <h4 className="text-2xl font-black text-brand-stone uppercase mb-10 tracking-tight italic">{suggestedHike.titolo}</h4>
                          <div className="flex flex-col gap-3">
                            <button onClick={() => { setSelectedActivity(suggestedHike); setIsDetailOpen(true); }} className="bg-brand-stone text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95">Visualizza</button>
                            <button onClick={() => { setQuizStep("intro"); setCurrentQuestion(0); setAnswers([]); }} className="text-stone-400 font-black uppercase text-[9px] py-2 flex items-center justify-center gap-2"><RefreshCcw size={12} /> Rifai il test</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pannello collage — full width intro, metà destra durante il quiz */}
            <motion.div
              animate={{ width: quizStep === "intro" ? "100%" : "50%" }}
              transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
              className="relative overflow-hidden flex-shrink-0"
            >
              <img
                src="/collage-escursioni.webp"
                alt="Esperienze Altour"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              {/* Vignetta raccordo sinistra — appare solo quando è in split */}
              <motion.div
                animate={{ opacity: quizStep === "intro" ? 0 : 1 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 bg-gradient-to-r from-brand-stone/15 via-transparent to-transparent pointer-events-none"
              />

              {/* Tasto — visibile solo in intro, in basso al centro */}
              <AnimatePresence>
                {quizStep === "intro" && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12, transition: { duration: 0.2 } }}
                    transition={{ delay: 0.1, duration: 0.35 }}
                    className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-3"
                  >
                    <button
                      onClick={() => { setCurrentQuestion(0); setAnswers([]); setQuizStep("questions"); }}
                      className="bg-white text-brand-stone px-9 py-4 rounded-full font-black uppercase text-[11px] tracking-widest shadow-2xl flex items-center gap-2.5 hover:bg-brand-sky hover:text-white active:scale-95 transition-all"
                    >
                      Inizia il Test <ArrowRight size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

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