import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, ChevronDown } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import ActivityDetailModal from "../components/ActivityDetailModal";
import AttivitaQuiz from "../components/AttivitaQuiz";

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
  filosofia?: string | null;
  lat?: number | null;
  lng?: number | null;
  _tipo: "campo";
}

type Activity = Escursione | Campo;
type FilterKey = "tutte" | "mezza_giornata" | "intera_giornata" | "tour" | "campi";

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

function safeParseArray(v: string): string[] | null {
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : null; } catch { return null; }
}

const FILOSOFIA_COLORS: Record<string, string> = {
  "Avventura": "#e94544", "Benessere": "#a5d9c9", "Borghi più belli": "#946a52",
  "Cammini": "#e3c45d", "Educazione all'aperto": "#01aa9f", "Eventi": "#ffc0cb",
  "Formazione": "#002f59", "Immersi nel verde": "#358756", "Luoghi dello spirito": "#c8a3c9",
  "Novità": "#75c43c", "Speciali": "#b8163c", "Tra mare e cielo": "#7aaecd", "Trek urbano": "#f39452",
  "Tracce sulla neve": "#a8cce0", "Cielo stellato": "#1e2855",
};

function FilosofiaBadge({ value }: { value: string | null | undefined }) {
  if (!value || !FILOSOFIA_COLORS[value]) return null;
  const color = FILOSOFIA_COLORS[value];
  const dark = ["#002f59", "#946a52", "#b8163c", "#358756", "#1e2855"];
  const bg = dark.includes(color) ? `${color}aa` : `${color}cc`;
  return (
    <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-sm"
      style={{ backgroundColor: bg, color: "rgba(255,255,255,0.95)", textShadow: "0 1px 3px rgba(0,0,0,0.35)" }}>
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
    attrezzatura: campo.servizi?.join(", ") ?? null,
    filosofia: campo.filosofia ?? null,
    _tipo: "campo" as const,
  };
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function ActivityCard({
  activity, idx, onDetails, onBook,
}: {
  activity: Activity;
  idx: number;
  onDetails: () => void;
  onBook: (mode?: "info" | "prenota") => void;
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
      <div className="aspect-[3/2] md:h-52 md:aspect-auto relative overflow-hidden flex-shrink-0">
        <img
          src={activity.immagine_url || IMG_FALLBACK}
          alt={activity.titolo}
          className="absolute inset-0 w-full h-full object-cover"
          loading={idx < 4 ? "eager" : "lazy"}
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        {isEsc
          ? esc?.filosofia && <FilosofiaBadge value={esc.filosofia} />
          : (activity as Campo).filosofia && <FilosofiaBadge value={(activity as Campo).filosofia} />
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

        <div className="flex gap-2 pt-3 border-t border-stone-50">
          <button
            onClick={onDetails}
            className="flex-1 py-2.5 md:py-3 rounded-xl font-black uppercase text-[9px] tracking-widest border-2 border-stone-200 text-stone-600 hover:border-stone-400 transition-all active:scale-95"
          >
            Dettagli
          </button>
          <button
            onClick={() => onBook("info")}
            className="flex-[1.5] py-2.5 md:py-3 rounded-xl font-black uppercase text-[9px] tracking-widest bg-brand-sky text-white shadow-sm hover:bg-[#0284c7] transition-all active:scale-95"
          >
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
  const [activeFilter, setActiveFilter] = useState<FilterKey>("tutte");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const [{ data: escData }, { data: campiData }] = await Promise.all([
        supabase.from("escursioni").select("*").eq("is_active", true).order("data", { ascending: true }),
        supabase.from("campi").select("*").order("created_at", { ascending: false }),
      ]);
      if (escData) {
        setEscursioni((escData as any[]).map(e => ({ ...e, _tipo: "escursione" as const })));
      }
      if (campiData) setCampi((campiData as any[]).map(row => ({
        id: row.id, created_at: row.created_at, titolo: row.titolo,
        descrizione: row.descrizione ?? null, descrizione_estesa: row.descrizione_estesa ?? null,
        immagine_url: row.immagine_url ?? null,
        servizi: typeof row.servizi === "string" ? safeParseArray(row.servizi) : row.servizi,
        slug: row.slug, prezzo: row.prezzo ?? null, durata: row.durata ?? null,
        difficolta: row.difficolta ?? null, lunghezza: row.lunghezza ?? null,
        filosofia: row.filosofia ?? null, lat: row.lat ?? null, lng: row.lng ?? null,
        _tipo: "campo" as const,
      })));
      setLoading(false);
    }
    load();
  }, []);

  const allActivities: Activity[] = [...escursioni, ...campi].sort((a, b) => {
    const da = (a as any).data ? new Date((a as any).data).getTime() : Infinity;
    const db = (b as any).data ? new Date((b as any).data).getTime() : Infinity;
    return da - db;
  });

  const filtered = (() => {
    switch (activeFilter) {
      case "mezza_giornata":  return escursioni.filter(e => e.categoria?.toLowerCase().includes("mezza"));
      case "intera_giornata": return escursioni.filter(e => e.categoria?.toLowerCase() === "giornata" || e.categoria?.toLowerCase().includes("intera"));
      case "tour":            return escursioni.filter(e => e.categoria?.toLowerCase() === "tour");
      case "campi":           return campi;
      default:                return allActivities;
    }
  })();

  const visible = filtered.slice(0, visibleCount);

  const FILTERS: { key: FilterKey; label: string; count: number; color?: string; textColor?: string }[] = [
    { key: "tutte",          label: "Tutte",          count: allActivities.length },
    { key: "mezza_giornata", label: "Mezza giornata", count: escursioni.filter(e => e.categoria?.toLowerCase().includes("mezza")).length },
    { key: "intera_giornata",label: "Intera giornata",count: escursioni.filter(e => e.categoria?.toLowerCase() === "giornata" || e.categoria?.toLowerCase().includes("intera")).length },
    { key: "tour",           label: "Tour",           count: escursioni.filter(e => e.categoria?.toLowerCase() === "tour").length, color: "#f4d98c", textColor: "#7a5e00" },
    { key: "campi",          label: "Campi Estivi",   count: campi.length, color: "#9f8270" },
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

      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-4">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1 text-brand-sky">Esplora</p>
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-3xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9]">
            Attività<br className="md:hidden" />{" "}
            <span className="text-brand-sky italic font-light">Outdoor.</span>
          </h1>
          <span className="text-[11px] font-black uppercase tracking-widest text-stone-400 pb-1 shrink-0">
            {filtered.length} {filtered.length === 1 ? "attività" : "attività"}
          </span>
        </div>
        <div className="h-1 w-10 bg-brand-sky rounded-full mt-3" />
      </div>

      {/* Filtri sticky */}
      <div className="sticky top-16 z-20 bg-[#f5f2ed]/95 backdrop-blur-sm border-b border-stone-200/60 py-3">
        <div className="max-w-6xl mx-auto px-4">

          {/* Mobile — select */}
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
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="#9f8270" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {activeFilter !== "tutte" && (
              <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                style={{ background: FILTERS.find(f => f.key === activeFilter)?.color ?? "#5aaadd" }} />
            )}
          </div>

          {/* Desktop — pills */}
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

        {/* Griglia */}
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
                  onBook={(mode) => onBookingClick(activity.titolo, mode)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Carica altro */}
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

        {/* ── Separatore + Quiz zaino ──────────────────────────────────────── */}
        <div className="flex flex-col items-center mt-16 mb-8">
          <div className="h-12 w-px bg-gradient-to-b from-transparent to-stone-200" />
          <div className="flex items-center gap-3 my-2">
            <div className="h-px w-12 bg-stone-200" />
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-stone-300">Non sai da dove iniziare?</p>
            <div className="h-px w-12 bg-stone-200" />
          </div>
          <div className="h-12 w-px bg-gradient-to-t from-transparent to-stone-200" />
        </div>

        <div className="mb-6 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-sky mb-1">Quiz escursione</p>
          <h2 className="text-2xl md:text-3xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9]">
            Cosa metti nel tuo<br />
            <span className="font-light italic" style={{ color: "#9f8270" }}>zaino ideale?</span>
          </h2>
        </div>

        <AttivitaQuiz onBookingClick={onBookingClick} />

      </div>

      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setTimeout(() => setSelectedActivity(null), 300); }}
        onBookingClick={(title, mode) => onBookingClick(title, mode)}
      />
    </div>
  );
}