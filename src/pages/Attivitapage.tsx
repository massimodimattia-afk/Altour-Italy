import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock,
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
type FilterKey = "tutte" | "mezza_giornata" | "intera_giornata" | "tour" | "campi";

interface AttivitaPageProps {
  onNavigate: (page: string) => void;
  onBookingClick: (title: string, mode?: "info" | "prenota") => void;
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────
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

function formatMarkdown(text: string | null): string {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>");
}
const ITEMS_PER_LOAD = typeof window !== "undefined" && window.innerWidth >= 1024 ? 6 : 4;

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
    <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-sm"
      style={{ backgroundColor: bg, color: "rgba(255,255,255,0.95)", textShadow: "0 1px 3px rgba(0,0,0,0.35)" }}>
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

// ─── Card componente mobile-first ─────────────────────────────────────────────
function ActivityCard({
  activity, idx, onDetails, onBook,
}: {
  activity: Activity;
  idx: number;
  onDetails: () => void;
  onBook: () => void;
}) {
  const isEsc = activity._tipo === "escursione";
  const esc   = isEsc ? activity as Escursione : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22, delay: Math.min(idx % 4, 3) * 0.05 }}
      className="bg-white rounded-2xl md:rounded-[2rem] overflow-hidden flex flex-col active:scale-[0.99] transition-transform"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)" }}
    >
      {/* Immagine — più bassa su mobile per dare spazio al contenuto */}
      <div className="aspect-[3/2] md:h-52 md:aspect-auto relative overflow-hidden flex-shrink-0">
        <img
          src={activity.immagine_url || IMG_FALLBACK}
          alt={activity.titolo}
          className="absolute inset-0 w-full h-full object-cover"
          loading={idx < 4 ? "eager" : "lazy"}
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        {esc && <FilosofiaBadge value={esc.filosofia} />}
      </div>

      {/* Contenuto */}
      <div className="p-4 md:p-5 flex flex-col flex-grow">
        {/* Meta info su una riga compatta */}
        <div className="flex items-center gap-2.5 mb-2 flex-wrap">
          {esc?.data && (
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-brand-sky">
              <Calendar size={9} />
              {new Date(esc.data).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
            </span>
          )}
          {activity.durata && (
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-stone-400">
              <Clock size={9} />{activity.durata}
            </span>
          )}
        </div>

        <h3 className="text-sm md:text-base font-black text-brand-stone uppercase leading-tight line-clamp-2 mb-1.5">
          {activity.titolo}
        </h3>
        <p
          className="text-[11px] md:text-xs text-stone-400 line-clamp-2 leading-relaxed mb-3 flex-grow font-medium"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(activity.descrizione) }}
        />

        {/* Footer card */}
        <div className="flex gap-2 pt-3 border-t border-stone-50">
          <button
            onClick={onDetails}
            className="flex-1 py-2.5 md:py-3 rounded-xl font-black uppercase text-[9px] tracking-widest border-2 border-stone-200 text-stone-600 hover:border-stone-400 transition-all active:scale-95"
          >
            Dettagli
          </button>
          <button
            onClick={onBook}
            className="flex-[1.5] py-2.5 md:py-3 rounded-xl font-black uppercase text-[9px] tracking-widest bg-brand-sky text-white shadow-sm hover:bg-[#0284c7] transition-all active:scale-95"
          >
            Richiedi Info
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-stone-100 flex flex-col">
    <div className="aspect-[3/2] bg-stone-100 animate-pulse" />
    <div className="p-4 flex flex-col gap-2.5">
      <div className="h-2 w-20 bg-stone-100 rounded animate-pulse" />
      <div className="h-4 w-3/4 bg-stone-200 rounded animate-pulse" />
      <div className="h-3 w-full bg-stone-50 rounded animate-pulse" />
      <div className="flex gap-2 mt-1">
        <div className="h-10 flex-1 bg-stone-100 rounded-xl animate-pulse" />
        <div className="h-10 flex-[1.5] bg-stone-100 rounded-xl animate-pulse" />
      </div>
    </div>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────
export default function AttivitaPage({ onBookingClick }: AttivitaPageProps) {
  const [escursioni, setEscursioni] = useState<Escursione[]>([]);
  const [campi, setCampi]           = useState<Campo[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("tutte");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Quiz
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
    if (!pool.length) { setQuizStep("intro"); return; }
    const [compagnia, livello, luogo, sforzo, cerca, tempo] = newAnswers;
    let bestMatch = pool[0], maxScore = -Infinity;

    pool.forEach(esc => {
      let score = 0;
      const t = esc.titolo?.toLowerCase() || "";
      const d = esc.descrizione?.toLowerCase() || "";
      const diffDB = esc.difficolta ?? "";
      const cat = esc.categoria?.toLowerCase() || "";
      const fs = FILOSOFIA_QUIZ_MAP[esc.filosofia ?? ""] ?? {};

      if (fs.compagnia === compagnia) score += 8;
      if (fs.livello === livello)     score += 8;
      if (fs.luogo === luogo)         score += 8;
      if (fs.sforzo === sforzo)       score += 8;
      if (fs.cerca === cerca)         score += 8;
      if (fs.tempo === tempo)         score += 8;

      if (diffDB) {
        if (livello === "Base")  { if (diffDB === "Facile") score += 10; else if (diffDB === "Facile-Media") score += 5; else if (diffDB === "Media") score -= 8; else score -= 15; }
        if (livello === "Medio") { if (diffDB === "Media") score += 10; else if (diffDB === "Facile-Media" || diffDB === "Media-Impegnativa") score += 7; else if (diffDB === "Facile") score += 3; }
        if (livello === "Pro")   { if (diffDB === "Impegnativa") score += 10; else if (diffDB === "Media-Impegnativa") score += 8; else if (diffDB === "Media") score += 4; }
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
      if (cerca === "Panorami" && d.includes("panoram")) score += 3;
      if (cerca === "Pace"     && d.includes("pace"))    score += 3;
      if (cerca === "Racconto" && d.includes("storia"))  score += 3;
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

  // Filtering
  const allActivities: Activity[] = [
    ...escursioni,
    ...campi,
  ].sort((a, b) => {
    const da = (a as any).data ? new Date((a as any).data).getTime() : Infinity;
    const db = (b as any).data ? new Date((b as any).data).getTime() : Infinity;
    return da - db;
  });

  const filtered = (() => {
    switch (activeFilter) {
      case "mezza_giornata":  return escursioni.filter(e => e.categoria?.toLowerCase().includes("mezza"));
      case "intera_giornata": return escursioni.filter(e => e.categoria?.toLowerCase().includes("intera"));
      case "tour":            return escursioni.filter(e => e.categoria?.toLowerCase() === "tour");
      case "campi":           return campi;
      default:                return allActivities;
    }
  })();

  const visible = filtered.slice(0, visibleCount);

  const FILTERS: { key: FilterKey; label: string; count: number; color?: string; textColor?: string }[] = [
    { key: "tutte",          label: "Tutte",           count: allActivities.length },
    { key: "mezza_giornata", label: "Mezza giornata",  count: escursioni.filter(e => e.categoria?.toLowerCase().includes("mezza")).length },
    { key: "intera_giornata",label: "Intera giornata", count: escursioni.filter(e => e.categoria?.toLowerCase() === "giornata" || e.categoria?.toLowerCase().includes("intera")).length },
    { key: "tour",           label: "Tour",            count: escursioni.filter(e => e.categoria?.toLowerCase() === "tour").length, color: "#f4d98c", textColor: "#7a5e00" },
    { key: "campi",          label: "Campi Estivi",    count: campi.length, color: "#9f8270" },
  ];

  const openDetails = (a: Activity) => {
    setSelectedActivity(a._tipo === "campo" ? campoToDetail(a as Campo) : a);
    setIsDetailOpen(true);
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 pt-8 pb-20">
      <div className="h-8 w-48 bg-stone-200 rounded animate-pulse mb-6" />
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[1,2,3,4].map(n => <div key={n} className="h-9 w-24 bg-stone-100 rounded-full animate-pulse shrink-0" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[1,2,3,4].map(n => <SkeletonCard key={n} />)}
      </div>
    </div>
  );

  return (
    <div className="bg-[#f5f2ed] min-h-screen">

      {/* ── Header pagina ─────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-4">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1 text-brand-sky">Esplora</p>
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-3xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9]">
            Attività<br className="md:hidden" />{" "}
            <span className="text-brand-sky italic font-light">Outdoor.</span>
          </h1>
          {/* Contatore risultati */}
          <span className="text-[11px] font-black uppercase tracking-widest text-stone-400 pb-1 shrink-0">
            {filtered.length} {filtered.length === 1 ? "attività" : "attività"}
          </span>
        </div>
        <div className="h-1 w-10 bg-brand-sky rounded-full mt-3" />
      </div>

      {/* ── Filtri sticky ─────────────────────────────────────────────────── */}
      <div className="sticky top-16 z-20 bg-[#f5f2ed]/95 backdrop-blur-sm border-b border-stone-200/60 py-3">
        <div className="max-w-6xl mx-auto px-4">

          {/* Mobile — select nativo */}
          <div className="md:hidden relative">
            <select
              value={activeFilter}
              onChange={e => { setActiveFilter(e.target.value as FilterKey); setVisibleCount(ITEMS_PER_LOAD); }}
              className="w-full appearance-none bg-white border border-stone-200 rounded-2xl px-4 py-2.5 font-black uppercase text-[10px] tracking-widest text-brand-stone shadow-sm focus:outline-none focus:border-brand-sky"
              style={{ paddingLeft: activeFilter !== "tutte" ? "2.25rem" : "1rem" }}
            >
              {FILTERS.map(f => (
                <option key={f.key} value={f.key}>
                  {f.label}{f.count > 0 ? ` (${f.count})` : ""}
                </option>
              ))}
            </select>
            {/* Freccia */}
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="#9f8270" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {/* Pallino colore filtro attivo */}
            {activeFilter !== "tutte" && (
              <div
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                style={{ background: FILTERS.find(f => f.key === activeFilter)?.color ?? "#5aaadd" }}
              />
            )}
          </div>

          {/* Desktop — pill */}
          <div className="hidden md:flex gap-2">
            {FILTERS.map(f => {
              const isActive = activeFilter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => { setActiveFilter(f.key); setVisibleCount(ITEMS_PER_LOAD); }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full font-black uppercase text-[9px] tracking-widest transition-all duration-200 active:scale-95"
                  style={isActive
                    ? { background: f.color ?? "#5aaadd", color: f.textColor ?? "white", boxShadow: `0 4px 12px ${(f.color ?? "#5aaadd")}40` }
                    : { background: "white", color: "#a8a29e", border: "1.5px solid #e7e5e4" }
                  }
                >
                  {f.label}
                  {f.count > 0 && <span className="text-[8px] font-black opacity-70">{f.count}</span>}
                </button>
              );
            })}
          </div>

        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-5 pb-20">

        {/* ── Banner quiz ───────────────────────────────────────────────────── */}
        <AnimatePresence>
          {!quizStarted && !bannerDismissed && (activeFilter === "tutte" || activeFilter === "mezza_giornata" || activeFilter === "intera_giornata") && (
            <motion.div
              key="quiz-banner"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.25 }}
              className="mb-5 rounded-2xl cursor-pointer group overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(90,170,221,0.12) 0%, rgba(129,204,176,0.10) 100%)",
                border: "1.5px solid rgba(90,170,221,0.25)",
              }}
              onClick={startQuiz}
            >
              <div className="flex items-center gap-3 px-4 py-3.5 md:px-6 md:py-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: "rgba(90,170,221,0.15)" }}>
                  🧭
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-sky mb-0.5">
                    Quiz escursione
                  </p>
                  <p className="text-[11px] md:text-sm font-black text-brand-stone uppercase tracking-tight leading-tight">
                    Non sai da dove iniziare?{" "}
                    <span className="text-stone-400 font-bold normal-case group-hover:text-brand-sky transition-colors">
                      Scopri il tuo stile →
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="hidden sm:block bg-brand-sky text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest group-hover:bg-brand-stone transition-all">
                    Inizia
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setBannerDismissed(true); }}
                    className="p-1.5 text-stone-300 hover:text-stone-500 transition-colors"
                    aria-label="Chiudi"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Griglia ───────────────────────────────────────────────────────── */}
        {visible.length === 0 && !loading ? (
          <div className="py-20 text-center">
            <p className="text-4xl mb-4">🏔️</p>
            <p className="text-stone-400 font-black uppercase tracking-widest text-xs">
              Nessuna attività disponibile al momento
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <AnimatePresence mode="popLayout">
              {visible.map((activity, idx) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  idx={idx}
                  onDetails={() => openDetails(activity)}
                  onBook={() => onBookingClick(activity.titolo)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* ── Carica altro ──────────────────────────────────────────────────── */}
        {visibleCount < filtered.length && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setVisibleCount(v => v + ITEMS_PER_LOAD)}
              className="flex items-center gap-2 px-6 py-3.5 bg-white rounded-2xl font-black uppercase text-[9px] tracking-widest text-stone-500 border border-stone-200 hover:border-brand-sky hover:text-brand-sky transition-all active:scale-95 shadow-sm"
            >
              <ChevronDown size={13} />
              Altre {Math.min(ITEMS_PER_LOAD, filtered.length - visibleCount)}
            </button>
          </div>
        )}

        {/* ── Quiz box ──────────────────────────────────────────────────────── */}
        <section
          ref={quizRef}
          className={`max-w-4xl mx-auto mt-14 md:mt-24 relative ${!quizStarted ? "hidden md:block" : ""}`}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-sky/20 to-brand-stone/5 rounded-[2.5rem] blur-2xl opacity-50" />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-50">

            {/* Mobile */}
            <div className="md:hidden">
              <motion.div
                animate={{ height: quizStep === "intro" ? 200 : 0 }}
                transition={{ duration: 0.38, ease: [0.32, 0.72, 0, 1] }}
                className="relative overflow-hidden"
              >
                <img src="/collage-escursioni.webp" alt="" className="w-full h-full object-cover object-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-stone/60 via-transparent to-transparent" />
                <AnimatePresence>
                  {quizStep === "intro" && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                      className="absolute bottom-5 left-0 right-0 flex justify-center">
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

              <AnimatePresence>
                {quizStep !== "intro" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ delay: 0.15, duration: 0.25 }} className="bg-[#faf9f7]">

                    {quizStep === "questions" && (
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-5">
                          <button
                            onClick={() => { setCurrentQuestion(p => p - 1); setAnswers(p => p.slice(0, -1)); }}
                            className={`text-[10px] font-black uppercase tracking-widest py-2 pr-3 ${currentQuestion > 0 ? "text-stone-400" : "invisible"}`}
                          >
                            ← Indietro
                          </button>
                          <div className="flex items-center gap-1.5">
                            {QUIZ_QUESTIONS.map((_, i) => (
                              <div key={i} className={`rounded-full transition-all duration-300 ${i < currentQuestion ? "w-2 h-2 bg-brand-sky" : i === currentQuestion ? "w-4 h-2 bg-brand-sky" : "w-2 h-2 bg-stone-200"}`} />
                            ))}
                          </div>
                          <span className="text-[10px] font-black text-stone-400">{currentQuestion + 1}/{QUIZ_QUESTIONS.length}</span>
                        </div>
                        <AnimatePresence mode="wait">
                          <motion.div key={`q-${currentQuestion}`}
                            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                            transition={{ duration: 0.18 }}>
                            <h3 className="text-base font-black text-brand-stone uppercase tracking-tight mb-4 leading-snug">
                              {QUIZ_QUESTIONS[currentQuestion].q}
                            </h3>
                            <div className="grid grid-cols-1 gap-2">
                              {QUIZ_QUESTIONS[currentQuestion].options.map(opt => (
                                <button key={opt} onClick={() => handleAnswer(opt)}
                                  className={`min-h-[48px] px-4 py-3 rounded-2xl border-2 text-xs font-black uppercase tracking-wider text-left flex justify-between items-center active:scale-[0.97] ${pressedOption === opt ? "bg-brand-sky border-brand-sky text-white" : "bg-white border-stone-100 text-stone-700 hover:border-brand-sky"}`}>
                                  {opt} <ArrowRight size={13} className={pressedOption === opt ? "opacity-100 shrink-0" : "opacity-20 shrink-0"} />
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    )}

                    {quizStep === "result" && suggestedHike && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        {suggestedHike.immagine_url && (
                          <div className="relative h-36 overflow-hidden">
                            <img src={suggestedHike.immagine_url} alt={suggestedHike.titolo} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-brand-stone/80 via-brand-stone/20 to-transparent" />
                            <p className="absolute bottom-3 left-4 text-[9px] font-black uppercase tracking-[0.2em] text-brand-sky/90">Abbiamo scelto per te</p>
                          </div>
                        )}
                        <div className="p-5 text-center">
                          <h4 className="text-base font-black text-brand-stone uppercase italic leading-tight mb-4">{suggestedHike.titolo}</h4>
                          <div className="flex flex-col gap-2.5">
                            <button onClick={() => { setSelectedActivity(suggestedHike); setIsDetailOpen(true); }}
                              className="w-full min-h-[48px] bg-brand-stone text-white rounded-2xl font-black uppercase text-xs tracking-widest active:scale-[0.97]">
                              Visualizza dettagli
                            </button>
                            <button onClick={() => onBookingClick(suggestedHike.titolo)}
                              className="w-full min-h-[48px] bg-brand-sky text-white rounded-2xl font-black uppercase text-xs tracking-widest active:scale-[0.97] flex items-center justify-center gap-2">
                              Richiedi Info <ArrowRight size={13} />
                            </button>
                            <button onClick={() => { setQuizStep("intro"); setCurrentQuestion(0); setAnswers([]); }}
                              className="w-full min-h-[44px] flex items-center justify-center gap-2 text-stone-400 font-bold text-xs">
                              <RefreshCcw size={12} /> Rifai il test
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop */}
            <div className="hidden md:flex min-h-[440px]">
              <AnimatePresence>
                {quizStep !== "intro" && (
                  <motion.div key="quiz-panel"
                    initial={{ width: 0, opacity: 0 }} animate={{ width: "50%", opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                    className="flex-shrink-0 overflow-hidden bg-[#faf9f7] relative flex flex-col justify-center">
                    <img src="/collage-escursioni.webp" alt="" aria-hidden
                      className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-500 ${quizStep === "questions" ? "opacity-[0.06]" : "opacity-[0.03]"}`} />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#faf9f7]/90 via-[#faf9f7]/70 to-[#faf9f7]/90 pointer-events-none" />
                    <div className="relative z-10 p-10 xl:p-14">
                      <AnimatePresence mode="wait">
                        {quizStep === "questions" && (
                          <motion.div key="q" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                            <div className="flex justify-between items-center mb-6 gap-3">
                              {currentQuestion > 0
                                ? <button onClick={() => { setCurrentQuestion(p => p - 1); setAnswers(p => p.slice(0, -1)); }} className="text-stone-400 text-[9px] font-black uppercase tracking-widest shrink-0">← Indietro</button>
                                : <span />}
                              <div className="h-1 flex-grow bg-stone-200 rounded-full">
                                <motion.div className="h-full bg-brand-sky rounded-full" animate={{ width: `${((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100}%` }} />
                              </div>
                              <span className="text-[10px] font-black text-stone-400 shrink-0">{currentQuestion + 1}/{QUIZ_QUESTIONS.length}</span>
                            </div>
                            <h3 className="text-xl font-black text-brand-stone uppercase tracking-tight mb-8 leading-tight">{QUIZ_QUESTIONS[currentQuestion].q}</h3>
                            <div className="grid grid-cols-2 gap-3">
                              {QUIZ_QUESTIONS[currentQuestion].options.map(opt => (
                                <button key={opt} onClick={() => handleAnswer(opt)}
                                  className={`p-4 rounded-xl border text-[10px] font-black uppercase tracking-wider text-left flex justify-between items-center active:scale-95 ${pressedOption === opt ? "bg-brand-sky border-brand-sky text-white" : "bg-white border-stone-200 hover:border-brand-sky hover:text-brand-sky"}`}>
                                  {opt} <ArrowRight size={12} className="opacity-30" />
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                        {quizStep === "result" && suggestedHike && (
                          <motion.div key="r" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                            <div className="w-14 h-14 bg-brand-sky/10 rounded-full flex items-center justify-center mx-auto mb-5">
                              <Star size={24} className="text-brand-sky fill-brand-sky" />
                            </div>
                            <p className="text-[10px] font-black text-brand-sky uppercase tracking-[0.2em] mb-2">Abbiamo scelto per te:</p>
                            <h4 className="text-xl font-black text-brand-stone uppercase mb-8 italic leading-tight">{suggestedHike.titolo}</h4>
                            <div className="flex flex-col gap-3">
                              <button onClick={() => { setSelectedActivity(suggestedHike); setIsDetailOpen(true); }}
                                className="bg-brand-stone text-white py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95">
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

              <motion.div
                animate={{ width: quizStep === "intro" ? "100%" : "50%" }}
                transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                className="relative overflow-hidden flex-shrink-0"
              >
                <img src="/collage-escursioni.webp" alt="Esperienze Altour" className="absolute inset-0 w-full h-full object-cover object-center" />
                <motion.div animate={{ opacity: quizStep === "intro" ? 0 : 1 }} transition={{ duration: 0.4 }}
                  className="absolute inset-0 bg-gradient-to-r from-brand-stone/15 via-transparent to-transparent pointer-events-none" />
                <AnimatePresence>
                  {quizStep === "intro" && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }} transition={{ delay: 0.1, duration: 0.3 }}
                      className="absolute bottom-8 left-0 right-0 flex justify-center">
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
      </div>

      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setTimeout(() => setSelectedActivity(null), 300); }}
        onBookingClick={(title: string) => onBookingClick(title)}
      />
    </div>
  );
}