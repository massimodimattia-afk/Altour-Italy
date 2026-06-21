// src/pages/AttivitaPage.tsx
import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, ArrowRight, SlidersHorizontal, Search } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import ActivityDetailModal from "../components/ActivityDetailModal";
import AttivitaQuiz from "../components/AttivitaQuiz";
import { isIOS } from "../components/Section";

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
  servizi: string | null;
  slug: string;
  prezzo?: number | null;
  durata?: string | null;
  difficolta?: string | null;
  lunghezza?: number | null;
  filosofia?: string | null;
  lat?: number | null;
  lng?: number | null;
  min_partecipanti?: string | null;
  _tipo: "campo";
}

type Activity = Escursione | Campo;
type FilterKey = "mezza_giornata" | "intera_giornata" | "tour" | "campi";

interface AttivitaPageProps {
  onNavigate: (page: string) => void;
  onBookingClick: (title: string, mode?: "info" | "prenota") => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const IMG_FALLBACK = "/altour-logo.png";
const ITEMS_PER_LOAD = typeof window !== "undefined" && window.innerWidth >= 1024 ? 6 : 4;

function formatMarkdown(text: string | null): string {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>");
}

const FILOSOFIA_COLORS: Record<string, string> = {
  "Avventura": "#e94544", "Benessere": "#a5d9c9", "Borghi più belli": "#946a52",
  "Cammini": "#e3c45d", "Educazione all'aperto": "#01aa9f", "Eventi": "#ffc0cb",
  "Formazione": "#002f59", "Immersi nel verde": "#358756", "Luoghi dello spirito": "#c8a3c9",
  "Novità": "#75c43c", "Speciali": "#b8163c", "Acqua e cielo": "#7aaecd", "Trek urbano": "#f39452",
  "Tracce sulla neve": "#a8cce0", "Cielo stellato": "#1e2855",
};

function getFilosofiaOpacity(color: string): string {
  const dark = ["#002f59", "#946a52", "#b8163c", "#358756", "#1e2855"];
  return dark.includes(color) ? `${color}aa` : `${color}cc`;
}

function FilosofiaBadge({ value }: { value: string | null | undefined }) {
  if (!value || !FILOSOFIA_COLORS[value]) return null;
  const color = FILOSOFIA_COLORS[value];
  const bg = getFilosofiaOpacity(color);
  return (
    <div
      className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest"
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

function campoToDetail(campo: Campo) {
  return {
    id: campo.id, titolo: campo.titolo, descrizione: campo.descrizione,
    descrizione_estesa: campo.descrizione_estesa ?? null,
    prezzo: campo.prezzo ?? (null as unknown as number),
    immagine_url: campo.immagine_url, gallery_urls: null,
    difficolta: campo.difficolta ?? null, durata: campo.durata ?? null,
    lunghezza: campo.lunghezza ?? null, attrezzatura_consigliata: null,
    attrezzatura: null,
    servizi: campo.servizi ?? null,
    filosofia: campo.filosofia ?? null,
    min_partecipanti: campo.min_partecipanti ?? null,
    lat: campo.lat ?? null, lng: campo.lng ?? null,
    _tipo: "campo" as const,
  };
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function ActivityCard({
  activity, idx, onDetails, onBook,
}: {
  activity: Activity; idx: number;
  onDetails: () => void; onBook: (mode?: "info" | "prenota") => void;
}) {
  const isEsc = activity._tipo === "escursione";
  const esc   = isEsc ? activity as Escursione : null;
  return (
    <motion.div layout
      initial={{ opacity: 0, y: isIOS ? 0 : 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22, delay: Math.min(idx % 4, 3) * 0.05 }}
      className="bg-white rounded-2xl md:rounded-[2rem] overflow-hidden flex flex-col active:scale-[0.99] transition-transform"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)" }}
    >
      <div className="aspect-[3/2] md:h-52 md:aspect-auto relative overflow-hidden flex-shrink-0">
        <img src={activity.immagine_url || IMG_FALLBACK} alt={activity.titolo}
          className="absolute inset-0 w-full h-full object-cover"
          loading={idx < 4 ? "eager" : "lazy"} decoding="async" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        {isEsc
          ? esc?.filosofia && <FilosofiaBadge value={esc.filosofia} />
          : ((activity as Campo).filosofia || (activity as Campo).slug) && 
            <FilosofiaBadge value={(activity as Campo).filosofia || (activity as Campo).slug} />
        }
      </div>
      <div className="p-4 md:p-5 flex flex-col flex-grow">
        <div className="flex items-center gap-2.5 mb-2 flex-wrap">
          {esc?.data && (
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-brand-sky">
              <Calendar size={9} />
              {new Date(esc.data).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
            </span>
          )}
          {activity.durata && (
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-brand-sky">
              <Clock size={9} />{activity.durata}
            </span>
          )}
        </div>
        <h3 className="text-sm md:text-base font-black text-brand-stone uppercase tracking-tight leading-none line-clamp-2 mb-1.5">
          {activity.titolo}
        </h3>
        <p className="text-[11px] md:text-xs text-stone-400 line-clamp-2 leading-relaxed mb-3 flex-grow font-medium"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(activity.descrizione) }} />
        <div className="flex gap-2 pt-3 border-t border-stone-50">
          <button onClick={onDetails}
            className="flex-1 py-2.5 md:py-3 rounded-xl font-black uppercase text-[9px] tracking-widest border-2 border-stone-200 text-stone-600 hover:border-stone-400 transition-colors active:scale-95">
            Dettagli
          </button>
          <button onClick={() => onBook("info")}
            className="flex-[1.5] py-2.5 md:py-3 rounded-xl font-black uppercase text-[9px] tracking-widest bg-brand-sky text-white shadow-sm hover:bg-[#0284c7] transition-colors active:scale-95">
            Richiedi Info
          </button>
        </div>
      </div>
    </motion.div>
  );
}

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
  const [activeFilter, setActiveFilter] = useState<FilterKey | null>(null);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [isMobile, setIsMobile]         = useState(false);
  const [mounted, setMounted]           = useState(false);
  const [searchQuery, setSearchQuery]   = useState("");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (drawerOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [drawerOpen]);

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  useEffect(() => {
    async function load() {
      const [{ data: escData }, { data: campiData }] = await Promise.all([
        supabase.from("escursioni").select("*").eq("is_active", true).order("data", { ascending: true }),
        supabase.from("campi").select("*").order("created_at", { ascending: false }),
      ]);
      if (escData) setEscursioni((escData as any[]).map(e => ({ ...e, _tipo: "escursione" as const })));
      if (campiData) setCampi((campiData as any[]).map(row => ({
        id: row.id, created_at: row.created_at, titolo: row.titolo,
        descrizione: row.descrizione ?? null, descrizione_estesa: row.descrizione_estesa ?? null,
        immagine_url: row.immagine_url ?? null,
        servizi: row.servizi ?? null,
        slug: row.slug, prezzo: row.prezzo ?? null, duration: row.durata ?? null,
        difficolta: row.difficolta ?? null, lunghezza: row.lunghezza ?? null,
        filosofia: row.filosofia ?? null, lat: row.lat ?? null, lng: row.lng ?? null,
        min_partecipanti: row.min_partecipanti ?? null,
        _tipo: "campo" as const,
      })));
      setLoading(false);
    }
    load();
  }, []);

  const allActivities: Activity[] = useMemo(() => {
    return [...escursioni, ...campi].sort((a, b) => {
      const da = (a as any).data ? new Date((a as any).data).getTime() : Infinity;
      const db = (b as any).data ? new Date((b as any).data).getTime() : Infinity;
      return da - db;
    });
  }, [escursioni, campi]);

  const filtered: Activity[] = useMemo(() => {
    let base = allActivities;
    
    if (activeFilter) {
      switch (activeFilter) {
        case "mezza_giornata":  base = escursioni.filter(e => e.categoria?.toLowerCase().includes("mezza")); break;
        case "intera_giornata": base = escursioni.filter(e => e.categoria?.toLowerCase() === "giornata" || e.categoria?.toLowerCase().includes("intera")); break;
        case "tour":            base = escursioni.filter(e => e.categoria?.toLowerCase() === "tour"); break;
        case "campi":           base = campi; break;
      }
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      base = base.filter(a => 
        a.titolo.toLowerCase().includes(q) || 
        (a.descrizione && a.descrizione.toLowerCase().includes(q))
      );
    }

    return base;
  }, [allActivities, activeFilter, escursioni, campi, searchQuery]);

  const visible = filtered.slice(0, visibleCount);

  const FILTERS = [
    { key: "mezza_giornata" as const, label: "Mezza giornata", emoji: "🌤", count: escursioni.filter(e => e.categoria?.toLowerCase().includes("mezza")).length,          color: "#5aaadd" },
    { key: "intera_giornata" as const,label: "Intera giornata", emoji: "☀️", count: escursioni.filter(e => e.categoria?.toLowerCase() === "giornata" || e.categoria?.toLowerCase().includes("intera")).length, color: "#81ccb0" },
    { key: "tour" as const,           label: "Tour",           emoji: "🏔", count: escursioni.filter(e => e.categoria?.toLowerCase() === "tour").length,                 color: "#f4d98c", textColor: "#7a5e00" },
    { key: "campi" as const,          label: "Campi Estivi",   emoji: "⛺️", count: campi.length,                                                                       color: "#9f8270" },
  ];

  const openDetails = (a: Activity) => {
    setSelectedActivity(a._tipo === "campo" ? campoToDetail(a as Campo) : a);
    setIsDetailOpen(true);
  };

  const toggleFilter = (key: FilterKey) => {
    setActiveFilter(prev => prev === key ? null : key);
    setVisibleCount(ITEMS_PER_LOAD);
  };

  const handleInizia = () => {
    if (isMobile) {
      setDrawerOpen(true);
    } else {
      document.getElementById("zaino-quiz-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 pt-8 pb-20">
      <div className="h-10 w-52 bg-stone-200 rounded-2xl animate-pulse mb-2" />
      <div className="h-4 w-32 bg-stone-100 rounded animate-pulse mb-8" />
      <div className="h-20 w-full bg-stone-100 rounded-[2rem] animate-pulse mb-6" />
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[1,2,3,4].map(n => <div key={n} className="h-14 w-28 bg-stone-100 rounded-2xl animate-pulse shrink-0" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3].map(n => <SkeletonCard key={n} />)}
      </div>
    </div>
  );

  return (
    <div className="bg-[#f5f2ed] min-h-screen antialiased">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-0">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1 text-brand-sky">Esplora</p>
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-3xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9]">
            Attività<br className="md:hidden" />{" "}
            <span className="text-brand-sky italic font-light">Outdoor.</span>
          </h1>
          <span className="text-[11px] font-black uppercase tracking-widest text-stone-400 pb-1 shrink-0">
            {filtered.length} attività
          </span>
        </div>
        <div className="h-1 w-10 bg-brand-sky rounded-full mt-3 mb-6" />

       {/* ── BARRA DI RICERCA PREMIUM ── */}
        <div className="mb-10 mt-6 flex justify-center px-2">
          <div className="relative w-full max-w-2xl group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(ITEMS_PER_LOAD);
              }}
              placeholder="Cerca escursione, luogo, stagione..."
              // Il padding-left (pl-14) garantisce che il testo non tocchi l'icona
              className="w-full pl-14 pr-12 py-4 bg-white rounded-full border-2 border-stone-100/80 focus:border-brand-sky/40 focus:ring-4 focus:ring-brand-sky/10 text-base md:text-sm font-black text-brand-stone placeholder-stone-300 outline-none transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
            />
            
            {/* Icona di ricerca */}
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-sky pointer-events-none transition-transform duration-300 group-focus-within:scale-110 group-focus-within:text-[#0284c7]">
              <Search size={20} strokeWidth={3} />
            </div>
            
            {/* Bottone reset con animazione morbida */}
            <AnimatePresence>
              {searchQuery && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-600 text-xs active:scale-90 transition-colors font-black"
                >
                  ✕
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Banner quiz zaino (Nasconde su mobile, gestito in-flow sotto) ── */}
        <motion.div
          initial={{ opacity: 0, y: isIOS ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="hidden md:block mb-6 rounded-[2rem] overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #81ccb010 0%, #5aaadd12 50%, #f4d98c0e 100%)",
            border: "1.5px solid rgba(129,204,176,0.25)",
            boxShadow: "0 4px 24px rgba(129,204,176,0.10)",
          }}
        >
          <div className="flex items-center gap-4 px-5 py-4 md:px-7 md:py-5">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl md:text-3xl"
              style={{ background: "rgba(129,204,176,0.15)" }}>
              🎒
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-0.5" style={{ color: "#81ccb0" }}>
                Non sai da dove iniziare?
              </p>
              <p className="text-sm md:text-base font-black text-[#44403c] uppercase tracking-tight leading-tight">
                Costruisci il tuo zaino ideale
              </p>
              <p className="text-[10px] text-stone-400 font-medium mt-0.5 hidden md:block">
                Scegli 3 oggetti e scopri l'escursione perfetta per te
              </p>
            </div>
            <button
              onClick={handleInizia}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest text-white active:scale-95 transition-transform"
              style={{
                background: "linear-gradient(135deg, #81ccb0, #5aaadd)",
                boxShadow: "0 4px 14px rgba(90,170,221,0.25)",
              }}
            >
              Inizia <ArrowRight size={12} />
            </button>
          </div>
          <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #81ccb0, #5aaadd, #f4d98c)" }} />
        </motion.div>

        {/* ── Filtri mobile ─────────────────────────────────── */}
        <div className="md:hidden mb-6 mt-2 px-1">
          <div className="flex justify-between items-center mb-4 px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">
              Tipo di Esperienza
            </span>
            {activeFilter && (
              <button 
                onClick={() => { setActiveFilter(null); setVisibleCount(ITEMS_PER_LOAD); }}
                className="text-[10px] font-black uppercase tracking-widest text-brand-sky border-b border-brand-sky/30 pb-0.5"
              >
                Tutte
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const isActive = activeFilter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => toggleFilter(f.key)}
                  className={`flex-1 min-w-[140px] flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 border ${
                    isActive
                      ? "bg-white border-stone-200 shadow-[0_4px_12px_rgba(0,0,0,0.05)] translate-y-[-2px]"
                      : "bg-stone-200/40 border-transparent text-stone-500"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="w-2 h-2 rounded-full shadow-sm" 
                      style={{ backgroundColor: f.color }} 
                    />
                    <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? "text-brand-stone" : "text-stone-500"}`}>
                      {f.label}
                    </span>
                  </div>
                  {f.count > 0 && (
                    <span className="text-[8px] font-bold opacity-40">
                      {f.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Filtri sticky desktop (Inibito l'overflow-x per stabilità strutturale) ── */}
      <div className="hidden md:block sticky top-16 z-20 bg-[#f5f2ed] border-b border-stone-200/60 py-3 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-2">
          <button
            onClick={() => { setActiveFilter(null); setVisibleCount(ITEMS_PER_LOAD); }}
            title="Rimuovi filtro"
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={activeFilter
              ? { background: "white", border: "1.5px solid #e7e5e4", color: "#a8a29e" }
              : { background: "#44403c", color: "white", boxShadow: "0 2px 8px rgba(68,64,60,0.2)" }
            }
          >
            <SlidersHorizontal size={12} />
          </button>
          <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {FILTERS.map(f => {
              const isActive = activeFilter === f.key;
              return (
                <button key={f.key}
                  onClick={() => toggleFilter(f.key)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full font-black uppercase text-[9px] tracking-widest transition-all duration-200 active:scale-95"
                  style={isActive
                    ? { background: f.color, color: f.textColor ?? "white", boxShadow: `0 4px 12px ${f.color}40` }
                    : { background: "white", color: "#a8a29e", border: "1.5px solid #e7e5e4" }
                  }
                >
                  {f.emoji} {f.label}
                  {f.count > 0 && <span className="text-[8px] font-black opacity-70">{f.count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Contenuto principale ──────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-20">

        {visible.length === 0 && !loading ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="py-20 text-center bg-white rounded-[2rem] border border-stone-100 p-8 shadow-sm"
          >
            <p className="text-4xl mb-3">🏔️</p>
            <h3 className="text-brand-stone font-black uppercase tracking-widest text-xs mb-1">Nessuna attività trovata</h3>
            <p className="text-stone-400 text-[11px] font-medium mb-6">Non ci sono escursioni corrispondenti alla tua ricerca o al filtro attivo.</p>
            <button
              onClick={() => { setActiveFilter(null); setSearchQuery(""); setVisibleCount(ITEMS_PER_LOAD); }}
              className="px-5 py-3 bg-brand-sky text-white rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all shadow-sm"
            >
              Azzera tutto
            </button>
          </motion.div>
        ) : (
          <>
            {/* ── PULSANTE MOBILE IN-FLOW (Sotto la barra di ricerca) ── */}
            <div className="md:hidden mb-6 mt-1">
              <button
                onClick={handleInizia}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-white shadow-md active:scale-95 transition-transform"
                style={{
                  background: "linear-gradient(135deg, #81ccb0, #5aaadd)",
                  boxShadow: "0 6px 20px rgba(129,204,176,0.2)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl flex-shrink-0">
                    🎒
                  </div>
                  <div className="text-left">
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/80 mb-0.5">
                      Non sai cosa scegliere?
                    </p>
                    <p className="text-xs font-black uppercase tracking-widest leading-none">
                      Prepara lo zaino
                    </p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <ArrowRight size={14} className="text-white" />
                </div>
              </button>
            </div>

            {/* ── Griglia delle Card ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <AnimatePresence mode="popLayout">
                {visible.map((activity, idx) => (
                  <ActivityCard key={activity.id} activity={activity} idx={idx}
                    onDetails={() => openDetails(activity)}
                    onBook={(mode) => onBookingClick(activity.titolo, mode)}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Pulsante Load More */}
            {visibleCount < filtered.length && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setVisibleCount(v => v + ITEMS_PER_LOAD)}
                  className="flex items-center gap-2 px-6 py-3.5 bg-white rounded-2xl font-black uppercase text-[9px] tracking-widest text-stone-500 border border-stone-200 hover:border-brand-sky hover:text-brand-sky transition-all active:scale-95 shadow-sm"
                >
                  Altre {Math.min(ITEMS_PER_LOAD, filtered.length - visibleCount)} attività
                </button>
              </div>
            )}
          </>
        )}

       {/* ── Quiz zaino desktop inline ─────────────────────────────────── */}
        <div id="zaino-quiz-section" className="hidden md:block mt-24">
          <div className="flex flex-col items-center mb-12">
            <div className="h-16 w-px bg-gradient-to-b from-transparent to-stone-200" />
            <div className="flex items-center gap-3 my-3">
              <div className="h-px w-16 bg-stone-200" />
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300">Non sai da dove iniziare?</p>
              <div className="h-px w-16 bg-stone-200" />
            </div>
            <div className="h-16 w-px bg-gradient-to-t from-transparent to-stone-200" />
          </div>
          <div className="mb-10">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1 text-brand-sky">Trova la tua escursione</p>
            <h2 className="text-3xl md:text-4xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9] mb-1">
              Costruisci il tuo<br />
              <span className="font-light italic" style={{ color: "#9f8270" }}>zaino ideale.</span>
            </h2>
            <div className="h-1.5 w-10 bg-brand-sky rounded-full mt-3" />
          </div>
          <AttivitaQuiz onBookingClick={onBookingClick} escursioni={escursioni} />
        </div>

      </div>

      {/* 👇 DA QUI IN GIÙ È LA PARTE CHE MANCAVA 👇 */}
      
      {/* ── Drawer mobile in PORTAL: bypassa qualsiasi containing-block da transform di antenati ── */}
      {mounted && createPortal(
        <div className="md:hidden">
          <AnimatePresence>
            {drawerOpen && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-[60] bg-black/40"
                style={{
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                  transform: "translateZ(0)",
                  WebkitBackfaceVisibility: "hidden",
                }}
                onClick={closeDrawer}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {drawerOpen && (
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 420, damping: 38, mass: 0.9 }}
                drag="y"
                dragConstraints={{ top: 0 }}
                dragElastic={{ top: 0, bottom: 0.4 }}
                onDragEnd={(_, info) => { if (info.offset.y > 80 || info.velocity.y > 400) closeDrawer(); }}
                className="fixed bottom-0 left-0 right-0 z-[61] rounded-t-[2rem] flex flex-col"
                style={{
                  background: "#f5f2ed",
                  maxHeight: "92dvh",
                  boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
                  touchAction: "none",
                  transform: "translateZ(0)",
                  WebkitBackfaceVisibility: "hidden",
                  willChange: "transform",
                }}
              >
                <div className="flex justify-center pt-3 pb-2 flex-shrink-0 cursor-grab active:cursor-grabbing">
                  <div className="w-10 h-1 rounded-full bg-stone-300" />
                </div>
                <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-sky mb-0.5">Trova la tua escursione</p>
                    <h3 className="text-lg font-black text-[#44403c] uppercase tracking-tight leading-tight">
                      Cosa metti<br />
                      <span className="font-light italic" style={{ color: "#9f8270" }}>nel tuo zaino?</span>
                    </h3>
                  </div>
                  <button
                    onClick={closeDrawer}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-stone-400 active:scale-90 transition-transform flex-shrink-0"
                    style={{ background: "rgba(0,0,0,0.06)" }}
                  >✕</button>
                </div>
                <div className="overflow-y-auto px-4 pb-8 flex-1" style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}>
                  <AttivitaQuiz
                    onBookingClick={(title, mode) => { closeDrawer(); onBookingClick(title, mode); }}
                    escursioni={escursioni}
                    hideHeader
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>,
        document.body
      )}

      {/* ☝️ FINO A QUI ☝️ */}

      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setTimeout(() => setSelectedActivity(null), 300); }}
        onBookingClick={(title, mode) => onBookingClick(title, mode)}
      />
    </div>
  );
}