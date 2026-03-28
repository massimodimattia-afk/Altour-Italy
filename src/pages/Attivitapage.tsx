import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Mountain, Clock, ChevronDown,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import ActivityDetailModal from "../components/ActivityDetailModal";

// ─── Types ────────────────────────────────────────────────────────────────────
type Escursione = Database["public"]["Tables"]["escursioni"]["Row"] & {
  filosofia?: string | null;
  lunghezza?: number | null;
  _tipo?: "escursione";
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

type Activity = (Escursione & { _tipo: "escursione" }) | Campo;

interface AttivitaPageProps {
  onNavigate: (page: string) => void;
  onBookingClick: (title: string, mode?: "info" | "prenota") => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const IMG_FALLBACK = "/altour-logo.png";
const ITEMS_PER_LOAD = typeof window !== "undefined" && window.innerWidth >= 1024 ? 6 : 2;

const FILOSOFIA_COLORS: Record<string, string> = {
  "Avventura":             "#e94544",
  "Benessere":             "#a5d9c9",
  "Borghi più belli":      "#946a52",
  "Cammini":               "#e3c45d",
  "Educazione all'aperto": "#01aa9f",
  "Eventi":                "#ffc0cb",
  "Formazione":            "#002f59",
  "Immersi nel verde":     "#358756",
  "Luoghi dello spirito":  "#c8a3c9",
  "Novità":                "#75c43c",
  "Speciali":              "#b8163c",
  "Tra mare e cielo":      "#7aaecd",
  "Trek urbano":           "#f39452",
};

function FilosofiaBadge({ value }: { value: string | null | undefined }) {
  if (!value || !FILOSOFIA_COLORS[value]) return null;
  const color = FILOSOFIA_COLORS[value];
  return (
    <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-sm"
      style={{ backgroundColor: `${color}cc`, color: "rgba(255,255,255,0.95)", textShadow: "0 1px 3px rgba(0,0,0,0.35)", boxShadow: `0 2px 12px ${color}55, 0 0 0 1px ${color}` }}>
      {value}
    </div>
  );
}

function campoToActivityDetail(campo: Campo) {
  return {
    id: campo.id,
    titolo: campo.titolo,
    descrizione: campo.descrizione,
    descrizione_estesa: campo.descrizione_estesa ?? null,
    prezzo: campo.prezzo ?? (null as unknown as number),
    immagine_url: campo.immagine_url,
    gallery_urls: null,
    difficolta: campo.difficolta ?? null,
    durata: campo.durata ?? null,
    lunghezza: campo.lunghezza ?? null,
    attrezzatura_consigliata: null,
    attrezzatura: campo.servizi?.join(", ") ?? null,
    _tipo: "campo" as const,
  };
}

function safeParseArray(v: string): string[] | null {
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed : null;
  } catch { return null; }
}

const SkeletonCard = () => (
  <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-xl overflow-hidden border border-stone-100 flex flex-col">
    <div className="aspect-[16/9] md:h-56 md:aspect-auto bg-stone-100 animate-pulse" />
    <div className="p-5 md:p-8 flex flex-col gap-3">
      <div className="h-2 w-24 bg-stone-100 rounded animate-pulse" />
      <div className="h-5 w-3/4 bg-stone-200 rounded animate-pulse" />
      <div className="space-y-2">
        <div className="h-2 w-full bg-stone-50 rounded animate-pulse" />
        <div className="h-2 w-5/6 bg-stone-50 rounded animate-pulse" />
      </div>
      <div className="flex gap-2 mt-2">
        <div className="h-12 flex-1 bg-stone-100 rounded-2xl animate-pulse" />
        <div className="h-12 flex-[1.5] bg-stone-100 rounded-2xl animate-pulse" />
      </div>
    </div>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────
export default function AttivitaPage({ onBookingClick }: AttivitaPageProps) {
  const [escursioni, setEscursioni] = useState<(Escursione & { _tipo: "escursione" })[]>([]);
  const [campi, setCampi]           = useState<Campo[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeFilter, setActiveFilter] = useState<"tutte" | "escursioni" | "campi">("tutte");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [{ data: escData }, { data: campiData }] = await Promise.all([
        supabase.from("escursioni").select("*").eq("is_active", true).order("data", { ascending: true }),
        supabase.from("campi").select("*").order("created_at", { ascending: false }),
      ]);
      if (escData) setEscursioni((escData as any[]).map(e => ({ ...e, _tipo: "escursione" as const })));
      if (campiData) setCampi((campiData as any[]).map(row => ({
        id: row.id, created_at: row.created_at,
        titolo: row.titolo, descrizione: row.descrizione ?? null,
        descrizione_estesa: row.descrizione_estesa ?? null,
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

  const allActivities: Activity[] = [...escursioni, ...campi]
    .sort((a, b) => {
      // Escursioni con data vengono prima ordinate per data, campi in fondo
      const da = (a as any).data ? new Date((a as any).data).getTime() : Infinity;
      const db = (b as any).data ? new Date((b as any).data).getTime() : Infinity;
      return da - db;
    });

  const filtered = activeFilter === "tutte"
    ? allActivities
    : activeFilter === "escursioni"
      ? allActivities.filter(a => a._tipo === "escursione")
      : allActivities.filter(a => a._tipo === "campo");

  const visible = filtered.slice(0, visibleCount);

  const openDetails = (a: Activity) => {
    setSelectedActivity(a._tipo === "campo" ? campoToActivityDetail(a as Campo) : a);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setTimeout(() => setSelectedActivity(null), 300);
  };

  const FILTERS: { key: typeof activeFilter; label: string }[] = [
    { key: "tutte",      label: "Tutte" },
    { key: "escursioni", label: "Escursioni" },
    { key: "campi",      label: "Campi" },
  ];

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-10 md:py-20">
      <div className="h-10 w-64 bg-stone-200 rounded animate-pulse mb-8" />
      <div className="flex gap-2 mb-10">
        {[1,2,3].map(n => <div key={n} className="h-9 w-24 bg-stone-100 rounded-full animate-pulse" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {[1,2,3].map(n => <SkeletonCard key={n} />)}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 md:py-20">

      {/* Header */}
      <div className="mb-10">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1 text-brand-sky">
          Esplora
        </p>
        <h1 className="text-4xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9] mb-4">
          Attività<br />
          <span className="text-brand-sky italic font-light">Outdoor.</span>
        </h1>
        <div className="h-1.5 w-12 bg-brand-sky rounded-full" />
      </div>

      {/* Filtri */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => { setActiveFilter(f.key); setVisibleCount(ITEMS_PER_LOAD); }}
            className="flex-shrink-0 px-4 py-2 rounded-full font-black uppercase text-[9px] tracking-widest transition-all active:scale-95"
            style={activeFilter === f.key
              ? { background: "#5aaadd", color: "white", boxShadow: "0 4px 12px rgba(90,170,221,0.3)" }
              : { background: "white", color: "#a8a29e", border: "1.5px solid #e7e5e4" }
            }
          >
            {f.label}
            {f.key !== "tutte" && (
              <span className="ml-1.5 opacity-60">
                {f.key === "escursioni" ? escursioni.length : campi.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Griglia */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        <AnimatePresence mode="popLayout">
          {visible.map((activity, idx) => {
            const isEsc = activity._tipo === "escursione";
            const esc   = isEsc ? activity as Escursione : null;

            return (
              <motion.div
                key={activity.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, delay: Math.min(idx, 5) * 0.04 }}
                className="bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden flex flex-col group transition-all duration-300 hover:-translate-y-1.5 active:scale-[0.99]"
                style={{ boxShadow: "0 4px 6px -1px rgba(0,0,0,0.06), 0 10px 30px -5px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)" }}
              >
                {/* Immagine */}
                <div className="aspect-[16/9] md:h-56 md:aspect-auto relative overflow-hidden">
                  <img
                    src={activity.immagine_url || IMG_FALLBACK}
                    alt={activity.titolo}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading={idx < 2 ? "eager" : "lazy"}
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  {/* Badge tipo */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-sm"
                    style={{ background: isEsc ? "rgba(90,170,221,0.85)" : "rgba(159,130,112,0.85)", color: "white" }}>
                    {isEsc ? "Escursione" : "Campo"}
                  </div>
                  {esc && <FilosofiaBadge value={esc.filosofia} />}
                </div>

                {/* Contenuto */}
                <div className="p-5 md:p-6 flex flex-col flex-grow">
                  {/* Meta info */}
                  <div className="flex items-center gap-3 mb-2 text-[9px] font-bold uppercase tracking-widest text-stone-400">
                    {esc?.data && (
                      <span className="flex items-center gap-1 text-brand-sky">
                        <Calendar size={10} />
                        {new Date(esc.data).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
                      </span>
                    )}
                    {activity.durata && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {activity.durata}
                      </span>
                    )}
                    {(activity as any).difficolta && (
                      <span className="flex items-center gap-1">
                        <Mountain size={10} />
                        {(activity as any).difficolta}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base md:text-lg font-black mb-2 text-brand-stone uppercase line-clamp-2 leading-tight">
                    {activity.titolo}
                  </h3>
                  <p className="text-stone-500 text-xs mb-5 line-clamp-2 flex-grow leading-relaxed font-medium">
                    {activity.descrizione}
                  </p>

                  {/* Prezzo + CTA */}
                  <div className="flex items-center gap-2 mt-auto">
                    {activity.prezzo != null && (
                      <span className="text-lg font-black text-brand-stone shrink-0">
                        €{activity.prezzo}
                      </span>
                    )}
                    <button
                      onClick={() => openDetails(activity)}
                      className="flex-1 bg-white border-2 border-stone-900 text-stone-900 py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-stone-50 transition-all active:scale-95"
                    >
                      Dettagli
                    </button>
                    <button
                      onClick={() => onBookingClick(activity.titolo)}
                      className="flex-[1.5] py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest bg-brand-sky text-white shadow-lg hover:bg-[#0284c7] transition-all active:scale-95"
                    >
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
          <button
            onClick={() => setVisibleCount(v => v + ITEMS_PER_LOAD)}
            className="flex items-center gap-2 px-8 py-4 bg-white rounded-2xl font-black uppercase text-[9px] tracking-widest text-stone-500 border border-stone-200 hover:border-brand-sky hover:text-brand-sky transition-all active:scale-95"
          >
            <ChevronDown size={14} />
            Carica altre ({filtered.length - visibleCount})
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="py-24 text-center">
          <p className="text-stone-300 font-black uppercase tracking-widest text-sm">
            Nessuna attività disponibile al momento.
          </p>
        </div>
      )}

      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onBook={onBookingClick}
      />
    </div>
  );
}