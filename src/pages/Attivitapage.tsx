import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Mountain, Clock,
  ChevronDown, ArrowRight, RefreshCcw, Star, X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import ActivityDetailModal from "../components/ActivityDetailModal";

// ─── Types ────────────────────────────────────────────────────────────────────
type Escursione = Database["public"]["Tables"]["escursioni"]["Row"] & {
  filosofia?: string | null;
  lunghezza?: number | null;
  lat?: number | null;
  lng?: number | null;
  _tipo: "escursione";
};

interface Campo {
  id: string;
  created_at: string;
  titolo: string;
  descrizione: string | null;
  descrizione_estesa?: string | null;
  immagine_url: string | null;
  servizi: string[] | null;
  slug: string;
  prezzo?: number | null;
  durata?: string | null;
  difficolta?: string | null;
  lunghezza?: number | null;
  _tipo: "campo";
}

type Activity = Escursione | Campo;

interface AttivitaPageProps {
  onNavigate: (page: string) => void;
  onBookingClick: (title: string, mode?: "info" | "prenota") => void;
}

// ─── Quiz constants ───────────────────────────────────────────────────────────
const QUIZ_QUESTIONS = [
  { q: "Con chi verrai?",   options: ["Solo", "Coppia", "Gruppo"] },
  { q: "Livello Trekking?", options: ["Base", "Medio", "Pro"] },
  { q: "Luogo ideale?",     options: ["Mare, lago o fiume", "Vette", "Boschi", "Prati o spazi aperti"] },
  { q: "Sforzo fisico?",    options: ["Leggero", "Medio", "Intenso"] },
  { q: "Cosa cerchi?",      options: ["Panorami", "Pace", "Tempo di qualità", "Racconto"] },
  { q: "Quanto tempo?",     options: ["Ore", "Giorno", "Tour"] },
];

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const IMG_FALLBACK = "/altour-logo.png";
const ITEMS_PER_LOAD = typeof window !== "undefined" && window.innerWidth >= 1024 ? 6 : 2;

const FILOSOFIA_COLORS: Record<string, string> = {
  "Avventura": "#e94544", "Benessere": "#a5d9c9", "Borghi più belli": "#946a52",
  "Cammini": "#e3c45d", "Educazione all'aperto": "#01aa9f", "Eventi": "#ffc0cb",
  "Formazione": "#002f59", "Immersi nel verde": "#358756", "Luoghi dello spirito": "#c8a3c9",
  "Novità": "#75c43c", "Speciali": "#b8163c", "Tra mare e cielo": "#7aaecd", "Trek urbano": "#f39452",
};

function FilosofiaBadge({ value }: { value: string | null | undefined }) {
  if (!value || !FILOSOFIA_COLORS[value]) return null;
  const color = FILOSOFIA_COLORS[value];
  const dark = ["#002f59", "#946a52", "#b8163c", "#358756"];
  const bg = dark.includes(color) ? `${color}aa` : `${color}cc`;
  return (
    <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-sm"
      style={{ backgroundColor: bg, color: "rgba(255,255,255,0.95)", textShadow: "0 1px 3px rgba(0,0,0,0.35)", boxShadow: `0 2px 12px ${color}55, 0 0 0 1px ${color}` }}>
      {value}
    </div>
  );
}

function safeParseArray(v: string): string[] | null {
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : null; } catch { return null; }
}

function campoToDetail(campo: Campo) {
  return {
    id: campo.id, titolo: campo.titolo, descrizione: campo.descrizione,
    descrizione_estesa: campo.descrizione_estesa ?? null,
    prezzo: campo.prezzo ?? (null as unknown as number),
    immagine_url: campo.immagine_url, gallery_urls: null,
    difficolta: campo.difficolta ?? null, durata: campo.durata ?? null,
    lunghezza: campo.lunghezza ?? null, attrezzatura_consigliata: null,
    attrezzatura: campo.servizi?.join(", ") ?? null, _tipo: "campo" as const,
  };
}

const SkeletonCard = () => (
  <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-xl overflow-hidden border border-stone-100 flex flex-col">
    <div className="aspect-[16/9] md:h-56 md:aspect-auto bg-stone-100 animate-pulse" />
    <div className="p-5 md:p-8 flex flex-col gap-3">
      <div className="h-2 w-24 bg-stone-100 rounded animate-pulse" />
      <div className="h-5 w-3/4 bg-stone-200 rounded animate-pulse" />
      <div className="space-y-2"><div className="h-2 w-full bg-stone-50 rounded animate-pulse" /><div className="h-2 w-5/6 bg-stone-50 rounded animate-pulse" /></div>
      <div className="flex gap-2 mt-2"><div className="h-12 flex-1 bg-stone-100 rounded-2xl animate-pulse" /><div className="h-12 flex-[1.5] bg-stone-100 rounded-2xl animate-pulse" /></div>
    </div>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────
export default function AttivitaPage({ onBookingClick }: AttivitaPageProps) {
  const [escursioni, setEscursioni] = useState<Escursione[]>([]);
  const [campi, setCampi]           = useState<Campo[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeFilter, setActiveFilter] = useState<"tutte" | "escursioni" | "campi">("tutte");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Quiz state
  const quizPoolRef = useRef<Escursione[]>([]);
  const [quizStep, setQuizStep] = useState<"intro" | "questions" | "result">("intro");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [suggestedHike, setSuggestedHike] = useState<Escursione | null>(null);
  const [shownSuggestions, setShownSuggestions] = useState<string[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [pressedOption, setPressedOption] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const processingAnswerRef = useRef(false);
  const quizRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const [{ data: escData }, { data: campiData }] = await Promise.all([
        supabase.from("escursioni").select("*").eq("is_active", true).order("data", { ascending: true }),
        supabase.from("campi").select("*").order("created_at", { ascending: false }),
      ]);
      if (escData) {
        const typed = (escData as any[]).map(e => ({ ...e, _tipo: "escursione" as const }));
        setEscursioni(typed);
        quizPoolRef.current = [...typed].sort(() => Math.random() - 0.5);
      }
      if (campiData) setCampi((campiData as any[]).map(row => ({
        id: row.id, created_at: row.created_at, titolo: row.titolo,
        descrizione: row.descrizione ?? null, descrizione_estesa: row.descrizione_estesa ?? null,
        immagine_url: row.immagine_url ?? null,
        servizi: typeof row.servizi === "string" ? safeParseArray(row.servizi) : row.servizi,
        slug: row.slug, prezzo: row.prezzo ?? null, durata: row.durata ?? null,
        difficolta: row.difficolta ?? null, lunghezza: row.lunghezza ?? null,
        _tipo: "campo" as const,
      })));
      setLoading(false);
    }
    load();
  }, []);

  // Quiz logic
  const handleAnswer = (option: string) => {
    if (processingAnswerRef.current) return;
    processingAnswerRef.current = true;
    setPressedOption(option);
    setTimeout(() => { setPressedOption(null); processingAnswerRef.current = false; }, 160);

    const newAnswers = [...answers, option];
    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setAnswers(newAnswers); setCurrentQuestion(p => p + 1); return;
    }

    const pool = quizPoolRef.current;
    if (pool.length === 0) { setQuizStep("intro"); return; }
    const [compagnia, livello, luogo, sforzo, cerca, tempo] = newAnswers;
    let bestMatch = pool[0], maxScore = -Infinity;

    pool.forEach(esc => {
      let score = 0;
      const t = esc.titolo?.toLowerCase() || "";
      const d = esc.descrizione?.toLowerCase() || "";
      const diffDB = esc.difficolta ?? "";
      const cat = esc.categoria?.toLowerCase() || "";
      const filo = esc.filosofia ?? "";
      const fs = FILOSOFIA_QUIZ_MAP[filo] ?? {};

      if (fs.compagnia === compagnia) score += 8;
      if (fs.livello === livello)     score += 8;
      if (fs.luogo === luogo)         score += 8;
      if (fs.sforzo === sforzo)       score += 8;
      if (fs.cerca === cerca)         score += 8;
      if (fs.tempo === tempo)         score += 8;

      if (diffDB) {
        if (livello === "Base")   { if (diffDB === "Facile") score += 10; else if (diffDB === "Facile-Media") score += 5; else if (diffDB === "Media") score -= 8; else score -= 15; }
        if (livello === "Medio")  { if (diffDB === "Media") score += 10; else if (diffDB === "Facile-Media" || diffDB === "Media-Impegnativa") score += 7; else if (diffDB === "Facile") score += 3; }
        if (livello === "Pro")    { if (diffDB === "Impegnativa") score += 10; else if (diffDB === "Media-Impegnativa") score += 8; else if (diffDB === "Media") score += 4; }
      }
      if (tempo === "Ore" && cat === "giornata") score += 8;
      else if (tempo === "Giorno" && cat === "giornata") score += 8;
      else if (tempo === "Tour" && cat === "tour") score += 8;
      else if (cat) score -= 5;

      if (diffDB) {
        if (sforzo === "Leggero" && (diffDB === "Facile" || diffDB === "Facile-Media")) score += 4;
        if (sforzo === "Medio"   && (diffDB === "Facile-Media" || diffDB === "Media"))  score += 4;
        if (sforzo === "Intenso" && (diffDB === "Media-Impegnativa" || diffDB === "Impegnativa")) score += 4;
      }
      const luogoL = luogo.toLowerCase();
      if (luogoL === "mare, lago o fiume" && (t.includes("lago") || t.includes("mare") || d.includes("acqua"))) score += 4;
      if (luogoL === "vette"  && (t.includes("cima") || t.includes("vetta") || d.includes("panorama"))) score += 4;
      if (luogoL === "boschi" && (d.includes("bosco") || d.includes("foresta"))) score += 4;
      if (luogoL === "prati o spazi aperti" && (d.includes("prato") || d.includes("aperto"))) score += 4;
      if (cerca === "Panorami" && (d.includes("vista") || d.includes("panoram"))) score += 3;
      if (cerca === "Pace"     && (d.includes("pace")  || d.includes("silenzio"))) score += 3;
      if (cerca === "Racconto" && (d.includes("storia") || d.includes("borghi"))) score += 3;
      if (compagnia === "Gruppo" && d.includes("gruppo")) score += 2;
      if (shownSuggestions.includes(esc.id)) score -= 12;
      score += Math.random() * 1.5;
      if (score > maxScore) { maxScore = score; bestMatch = esc; }
    });

    setShownSuggestions(prev => [...prev, bestMatch.id]);
    setSuggestedHike(bestMatch);
    setQuizStep("result");
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestion(0); setAnswers([]); setQuizStep("intro");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!quizRef.current) return;
      const top = quizRef.current.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: "smooth" });
    }));
  };

  const quizQuestionKey = `q-${currentQuestion}`;

  // Filtered activities
  const allActivities: Activity[] = [
    ...escursioni,
    ...campi,
  ].sort((a, b) => {
    const da = (a as any).data ? new Date((a as any).data).getTime() : Infinity;
    const db = (b as any).data ? new Date((b as any).data).getTime() : Infinity;
    return da - db;
  });

  const filtered = activeFilter === "tutte" ? allActivities
    : activeFilter === "escursioni" ? allActivities.filter(a => a._tipo === "escursione")
    : allActivities.filter(a => a._tipo === "campo");

  const visible = filtered.slice(0, visibleCount);

  const openDetails = (a: Activity) => {
    setSelectedActivity(a._tipo === "campo" ? campoToDetail(a as Campo) : a);
    setIsDetailOpen(true);
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-10 md:py-20">
      <div className="h-10 w-64 bg-stone-200 rounded animate-pulse mb-8" />
      <div className="flex gap-2 mb-10">{[1,2,3].map(n => <div key={n} className="h-9 w-24 bg-stone-100 rounded-full animate-pulse" />)}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">{[1,2,3].map(n => <SkeletonCard key={n} />)}</div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 md:py-20">

      {/* Header */}
      <div className="mb-8">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1 text-brand-sky">Esplora</p>
        <h1 className="text-4xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9] mb-4">
          Attività<br /><span className="text-brand-sky italic font-light">Outdoor.</span>
        </h1>
        <div className="h-1.5 w-12 bg-brand-sky rounded-full" />
      </div>

      {/* Filtri */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
        {(["tutte", "escursioni", "campi"] as const).map(f => (
          <button key={f}
            onClick={() => { setActiveFilter(f); setVisibleCount(ITEMS_PER_LOAD); }}
            className="flex-shrink-0 px-4 py-2 rounded-full font-black uppercase text-[9px] tracking-widest transition-all active:scale-95"
            style={activeFilter === f
              ? { background: "#5aaadd", color: "white", boxShadow: "0 4px 12px rgba(90,170,221,0.3)" }
              : { background: "white", color: "#a8a29e", border: "1.5px solid #e7e5e4" }
            }
          >
            {f === "tutte" ? "Tutte" : f === "escursioni" ? `Escursioni ${escursioni.length}` : `Campi ${campi.length}`}
          </button>
        ))}
      </div>

      {/* Banner quiz */}
      <AnimatePresence>
        {!quizStarted && !bannerDismissed && (
          <motion.div key="quiz-strip"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.92 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            style={{ transformOrigin: "top", overflow: "hidden" }}
            className="rounded-[1.75rem] mb-8 cursor-pointer group bg-stone-100/80 border border-stone-200/60 hover:border-brand-sky/30 hover:bg-stone-100 transition-all"
            onClick={startQuiz}
          >
            <div className="flex items-center justify-between gap-4 px-6 py-5 md:px-8 md:py-6">
              <div className="flex items-center gap-4 min-w-0">
                <span className="text-2xl select-none shrink-0">🧭</span>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-sky mb-0.5">Trova la tua escursione</p>
                  <p className="text-brand-stone font-black uppercase tracking-tight text-sm md:text-base leading-tight">
                    Non sai da dove iniziare?{" "}
                    <span className="text-stone-400 font-bold normal-case tracking-normal group-hover:text-brand-sky transition-colors">
                      Scopri il tuo stile Altour →
                    </span>
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-3 shrink-0">
                <div className="bg-brand-stone text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm group-hover:bg-brand-sky transition-all">
                  Inizia il quiz
                </div>
                <button onClick={e => { e.stopPropagation(); setBannerDismissed(true); }}
                  className="text-stone-300 hover:text-stone-500 transition-colors p-1" aria-label="Chiudi">
                  <X size={15} />
                </button>
              </div>
              <button onClick={e => { e.stopPropagation(); setBannerDismissed(true); }}
                className="sm:hidden shrink-0 text-stone-300 hover:text-stone-500 transition-colors p-1" aria-label="Chiudi">
                <X size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Griglia attività */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        <AnimatePresence mode="popLayout">
          {visible.map((activity, idx) => {
            const isEsc = activity._tipo === "escursione";
            const esc   = isEsc ? activity as Escursione : null;
            return (
              <motion.div key={activity.id} layout
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, delay: Math.min(idx, 5) * 0.04 }}
                className="bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden flex flex-col group transition-all duration-300 hover:-translate-y-1.5 active:scale-[0.99]"
                style={{ boxShadow: "0 4px 6px -1px rgba(0,0,0,0.06), 0 10px 30px -5px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)" }}
              >
                <div className="aspect-[16/9] md:h-56 md:aspect-auto relative overflow-hidden">
                  <img src={activity.immagine_url || IMG_FALLBACK} alt={activity.titolo}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading={idx < 2 ? "eager" : "lazy"} decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-sm"
                    style={{ background: isEsc ? "rgba(90,170,221,0.85)" : "rgba(159,130,112,0.85)", color: "white" }}>
                    {isEsc ? "Escursione" : "Campo"}
                  </div>
                  {esc && <FilosofiaBadge value={esc.filosofia} />}
                </div>
                <div className="p-5 md:p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-3 mb-2 text-[9px] font-bold uppercase tracking-widest text-stone-400">
                    {esc?.data && <span className="flex items-center gap-1 text-brand-sky"><Calendar size={10} />{new Date(esc.data).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}</span>}
                    {activity.durata && <span className="flex items-center gap-1"><Clock size={10} />{activity.durata}</span>}
                    {(activity as any).difficolta && <span className="flex items-center gap-1"><Mountain size={10} />{(activity as any).difficolta}</span>}
                  </div>
                  <h3 className="text-base md:text-lg font-black mb-2 text-brand-stone uppercase line-clamp-2 leading-tight">{activity.titolo}</h3>
                  <p className="text-stone-500 text-xs mb-5 line-clamp-2 flex-grow leading-relaxed font-medium">{activity.descrizione}</p>
                  <div className="flex items-center gap-2 mt-auto">
                    {activity.prezzo != null && <span className="text-lg font-black text-brand-stone shrink-0">€{activity.prezzo}</span>}
                    <button onClick={() => openDetails(activity)}
                      className="flex-1 bg-white border-2 border-stone-900 text-stone-900 py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-stone-50 transition-all active:scale-95">
                      Dettagli
                    </button>
                    <button onClick={() => onBookingClick(activity.titolo)}
                      className="flex-[1.5] py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest bg-brand-sky text-white shadow-lg hover:bg-[#0284c7] transition-all active:scale-95">
                      Richiedi Info
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Carica altro */}
      {visibleCount < filtered.length && (
        <div className="flex justify-center mt-10">
          <button onClick={() => setVisibleCount(v => v + ITEMS_PER_LOAD)}
            className="flex items-center gap-2 px-8 py-4 bg-white rounded-2xl font-black uppercase text-[9px] tracking-widest text-stone-500 border border-stone-200 hover:border-brand-sky hover:text-brand-sky transition-all active:scale-95">
            <ChevronDown size={14} />
            Carica altre ({filtered.length - visibleCount})
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="py-24 text-center">
          <p className="text-stone-300 font-black uppercase tracking-widest text-sm">Nessuna attività disponibile al momento.</p>
        </div>
      )}

      {/* Quiz box */}
      <section ref={quizRef} className={`max-w-4xl mx-auto mt-16 md:mt-32 relative px-0 ${!quizStarted ? "hidden md:block" : ""}`}>
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-sky/20 to-brand-stone/5 rounded-[2.5rem] blur-2xl opacity-50" />
        <div className="relative bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-50">

          {/* Mobile */}
          <div className="md:hidden">
            <motion.div animate={{ height: quizStep === "intro" ? 208 : 0 }}
              transition={{ duration: 0.38, ease: [0.32, 0.72, 0, 1] }} className="relative overflow-hidden">
              <img src="/collage-escursioni.webp" alt="Esperienze Altour" className="w-full h-full object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-stone/60 via-transparent to-transparent" />
              <AnimatePresence>
                {quizStep === "intro" && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    className="absolute bottom-5 left-0 right-0 flex justify-center">
                    <button onClick={() => { setCurrentQuestion(0); setAnswers([]); setQuizStep("questions"); }}
                      className="bg-white text-brand-stone px-7 py-3 rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-2 active:scale-95 hover:bg-brand-sky hover:text-white transition-all">
                      Inizia il Test <ArrowRight size={13} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <AnimatePresence>
              {quizStep !== "intro" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  transition={{ delay: quizStep === "questions" ? 0.18 : 0, duration: 0.28 }} className="bg-[#faf9f7]">

                  {quizStep === "questions" && (
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-5">
                        <button onClick={() => { setCurrentQuestion(p => p - 1); setAnswers(p => p.slice(0, -1)); }}
                          className={`text-[10px] font-black uppercase tracking-widest py-2 pr-3 transition-colors ${currentQuestion > 0 ? "text-stone-400 active:text-brand-stone" : "invisible pointer-events-none"}`}>
                          ← Indietro
                        </button>
                        <div className="flex items-center gap-1.5">
                          {QUIZ_QUESTIONS.map((_, i) => (
                            <div key={i} className={`rounded-full transition-all duration-300 ${i < currentQuestion ? "w-2 h-2 bg-brand-sky" : i === currentQuestion ? "w-4 h-2 bg-brand-sky" : "w-2 h-2 bg-stone-200"}`} />
                          ))}
                        </div>
                        <span className="text-[10px] font-black text-stone-400 tabular-nums">{currentQuestion + 1}<span className="text-stone-300">/{QUIZ_QUESTIONS.length}</span></span>
                      </div>
                      <AnimatePresence mode="wait">
                        <motion.div key={quizQuestionKey} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.2 }}>
                          <h3 className="text-base font-black text-brand-stone uppercase tracking-tight mb-4 leading-snug">{QUIZ_QUESTIONS[currentQuestion].q}</h3>
                          <div className="grid grid-cols-1 gap-2">
                            {QUIZ_QUESTIONS[currentQuestion].options.map(opt => (
                              <button key={opt} onClick={() => handleAnswer(opt)}
                                className={`min-h-[52px] px-4 py-3 rounded-2xl border-2 transition-all text-xs font-black uppercase tracking-wider text-left flex justify-between items-center active:scale-[0.97] ${pressedOption === opt ? "bg-brand-sky border-brand-sky text-white shadow-md" : "bg-white border-stone-150 text-stone-700 hover:border-brand-sky hover:text-brand-sky"}`}>
                                <span>{opt}</span>
                                <ArrowRight size={14} className={pressedOption === opt ? "opacity-100 shrink-0" : "opacity-20 shrink-0"} />
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  )}

                  {quizStep === "result" && suggestedHike && (
                    <AnimatePresence mode="wait">
                      <motion.div key="result-mobile" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                        {suggestedHike.immagine_url && (
                          <div className="relative h-40 overflow-hidden">
                            <img src={suggestedHike.immagine_url} alt={suggestedHike.titolo} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-brand-stone/80 via-brand-stone/20 to-transparent" />
                            <div className="absolute bottom-3 left-4"><span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-sky/90">Abbiamo scelto per te</span></div>
                          </div>
                        )}
                        <div className="p-5 text-center">
                          <h4 className="text-lg font-black text-brand-stone uppercase tracking-tight italic leading-tight mb-5 mt-2">{suggestedHike.titolo}</h4>
                          <div className="flex flex-col gap-2.5">
                            <button onClick={() => { setSelectedActivity(suggestedHike); setIsDetailOpen(true); }}
                              className="w-full min-h-[52px] bg-brand-stone text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-[0.97] transition-all">
                              Visualizza dettagli
                            </button>
                            <button onClick={() => onBookingClick(suggestedHike.titolo)}
                              className="w-full min-h-[52px] bg-brand-sky text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-md active:scale-[0.97] transition-all flex items-center justify-center gap-2">
                              Richiedi Info <ArrowRight size={13} />
                            </button>
                            <button onClick={() => { setQuizStep("intro"); setCurrentQuestion(0); setAnswers([]); }}
                              className="w-full min-h-[44px] flex items-center justify-center gap-2 text-stone-400 font-bold text-xs py-2 rounded-xl hover:text-brand-stone transition-colors">
                              <RefreshCcw size={13} /> Rifai il test
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop */}
          <div className="hidden md:flex min-h-[440px]">
            <AnimatePresence>
              {quizStep !== "intro" && (
                <motion.div key="quiz-content-panel"
                  initial={{ width: 0, opacity: 0 }} animate={{ width: "50%", opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
                  className="flex-shrink-0 overflow-hidden bg-[#faf9f7] relative flex flex-col justify-center">
                  <img src="/collage-escursioni.webp" alt="" aria-hidden
                    className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-500 ${quizStep === "questions" ? "opacity-[0.06]" : "opacity-[0.03]"}`} />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#faf9f7]/90 via-[#faf9f7]/70 to-[#faf9f7]/90 pointer-events-none" />
                  <div className="relative z-10 p-10 xl:p-14">
                    <AnimatePresence mode="wait">
                      {quizStep === "questions" && (
                        <motion.div key="questions" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                          <div className="flex justify-between items-center mb-6 gap-3">
                            {currentQuestion > 0
                              ? <button onClick={() => { setCurrentQuestion(p => p - 1); setAnswers(p => p.slice(0, -1)); }} className="text-stone-400 hover:text-brand-stone transition-colors text-[9px] font-black uppercase tracking-widest shrink-0">← Indietro</button>
                              : <span />}
                            <div className="h-1 flex-grow bg-stone-200 rounded-full">
                              <motion.div className="h-full bg-brand-sky rounded-full" animate={{ width: `${((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100}%` }} />
                            </div>
                            <span className="text-[10px] font-black text-stone-400 shrink-0">{currentQuestion + 1}/{QUIZ_QUESTIONS.length}</span>
                          </div>
                          <h3 className="text-xl font-black text-brand-stone uppercase tracking-tight mb-8 leading-tight">{QUIZ_QUESTIONS[currentQuestion].q}</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {QUIZ_QUESTIONS[currentQuestion].options.map(opt => (
                              <button key={opt} onClick={() => handleAnswer(opt)}
                                className={`p-4 rounded-xl border transition-all text-[10px] font-black uppercase tracking-wider text-left flex justify-between items-center group shadow-sm active:scale-95 ${pressedOption === opt ? "bg-brand-sky border-brand-sky text-white" : "bg-white border-stone-200 hover:border-brand-sky hover:text-brand-sky"}`}>
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
                            <button onClick={() => { setSelectedActivity(suggestedHike); setIsDetailOpen(true); }}
                              className="bg-brand-stone text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95">
                              Visualizza
                            </button>
                            <button onClick={() => { setQuizStep("intro"); setCurrentQuestion(0); setAnswers([]); }}
                              className="text-stone-400 font-black uppercase text-[9px] py-2 flex items-center justify-center gap-2">
                              <RefreshCcw size={12} /> Rifai il test
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div animate={{ width: quizStep === "intro" ? "100%" : "50%" }}
              transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }} className="relative overflow-hidden flex-shrink-0">
              <img src="/collage-escursioni.webp" alt="Esperienze Altour" className="absolute inset-0 w-full h-full object-cover object-center" />
              <motion.div animate={{ opacity: quizStep === "intro" ? 0 : 1 }} transition={{ duration: 0.4 }}
                className="absolute inset-0 bg-gradient-to-r from-brand-stone/15 via-transparent to-transparent pointer-events-none" />
              <AnimatePresence>
                {quizStep === "intro" && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12, transition: { duration: 0.2 } }} transition={{ delay: 0.1, duration: 0.35 }}
                    className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-3">
                    <button onClick={() => { setCurrentQuestion(0); setAnswers([]); setQuizStep("questions"); }}
                      className="bg-white text-brand-stone px-9 py-4 rounded-full font-black uppercase text-[11px] tracking-widest shadow-2xl flex items-center gap-2.5 hover:bg-brand-sky hover:text-white active:scale-95 transition-all">
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
        onClose={() => { setIsDetailOpen(false); setTimeout(() => setSelectedActivity(null), 300); }}
        onBook={(title: string) => onBookingClick(title)}
      />
    </div>
  );
}