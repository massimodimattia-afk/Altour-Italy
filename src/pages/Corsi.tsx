import { useState, useMemo, useEffect, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, Clock, Layers } from "lucide-react"; // Rimosso GraduationCap
import ActivityDetailModal from "../components/ActivityDetailModal";
import { isIOS } from "../components/Section";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CorsoItem {
  id: string;
  created_at?: string;
  titolo: string;
  descrizione: string | null;
  descrizione_estesa: string | null;
  prezzo: number | null;
  durata: string | null;
  immagine_url: string | null;
  gallery_urls: string[] | null;
  categoria: string | null;
  attrezzatura_consigliata: string | null;
  difficolta: string | null;
  attrezzatura: string | null;
  posizione: number | null;
  slug: string | null;
  parent_corso_id: string | null; // NULL se corso completo, UUID del padre se modulo
  prezzo_teorico: number | null;
  prezzo_pratico: number | null;
  prezzo_bundle: number | null;
}

interface CorsiPageProps {
  corsi?: CorsoItem[];
  onNavigate?: (page: string) => void;
  onBookingClick: (bookingSummary: string, mode?: 'info' | 'prenota') => void;
}

type FilterKey = "corsi" | "moduli";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const IMG_FALLBACK = "/altour-logo.png";
const ITEMS_PER_LOAD = typeof window !== "undefined" && window.innerWidth >= 1024 ? 6 : 4;

const CATEGORIA_COLORS: Record<string, string> = {
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
  "Acqua e cielo":         "#7aaecd",
  "Trek urbano":           "#f39452",
  "Tracce sulla neve":     "#a8cce0",
  "Cielo stellato":        "#1e2855",
};

function formatMarkdown(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>");
}

// ─── Card Unificata per Corso o Modulo ─────────────────────────────────────────
const FormazioneCard = forwardRef<HTMLDivElement, {
  item: CorsoItem;
  parentTitle?: string;
  idx: number;
  onDetails: () => void;
  onBook: (mode?: "info" | "prenota") => void;
}>(function FormazioneCard({ item, parentTitle, idx, onDetails, onBook }, ref) {
  const isModulo = Boolean(item.parent_corso_id);
  const categoriaName = item.categoria || "Formazione";
  const categoryBg = CATEGORIA_COLORS[categoriaName] || "#002f59";

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: isIOS ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22, delay: Math.min(idx % 4, 3) * 0.05 }}
      className="bg-white rounded-2xl md:rounded-[2rem] overflow-hidden flex flex-col active:scale-[0.99] transition-transform h-full"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)" }}
    >
      {/* Immagine con badge categoria */}
      <div className="aspect-[3/2] md:h-52 md:aspect-auto relative overflow-hidden flex-shrink-0">
        <img
          src={item.immagine_url || IMG_FALLBACK}
          alt={item.titolo}
          className="absolute inset-0 w-full h-full object-cover"
          loading={idx < 4 ? "eager" : "lazy"}
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

        {/* BADGE CATEGORIA ESCLUSIVO */}
        <div
          className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-md backdrop-blur-sm z-10"
          style={{
            backgroundColor: categoryBg,
            textShadow: "0 1px 2px rgba(0,0,0,0.3)"
          }}
        >
          {categoriaName}
        </div>
      </div>

      {/* Contenuto Card */}
      <div className="p-4 md:p-5 flex flex-col flex-grow">
        <div className="flex items-center gap-2.5 mb-2 flex-wrap">
          {isModulo && parentTitle && (
            <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wide text-brand-sky bg-sky-50 px-2 py-0.5 rounded-md">
              <Layers size={10} /> Corso: {parentTitle}
            </span>
          )}
          {item.durata && (
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-stone-400">
              <Clock size={10} /> {item.durata}
            </span>
          )}
        </div>

        <h3 className="text-sm md:text-base font-black text-brand-stone uppercase tracking-tight leading-snug line-clamp-2 mb-1.5">
          {item.titolo}
        </h3>

        <p
          className="text-[11px] md:text-xs text-stone-400 line-clamp-2 leading-relaxed mb-4 flex-grow font-medium"
          dangerouslySetInnerHTML={{ __html: formatMarkdown(item.descrizione) }}
        />

        {/* Prezzo e Azioni */}
        <div className="pt-3 border-t border-stone-100 flex flex-col gap-3 mt-auto">
          {item.prezzo !== undefined && item.prezzo !== null && item.prezzo > 0 && (
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Quota</span>
              <span className="text-base font-black text-brand-stone">€{item.prezzo}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={onDetails}
              className="flex-1 py-2.5 md:py-3 rounded-xl font-black uppercase text-[9px] tracking-widest border-2 border-stone-200 text-stone-600 hover:border-stone-400 transition-colors active:scale-95"
            >
              Dettagli
            </button>
            <button
              onClick={() => onBook("info")}
              className="flex-[1.5] py-2.5 md:py-3 rounded-xl font-black uppercase text-[9px] tracking-widest bg-brand-sky text-white shadow-sm hover:bg-[#0284c7] transition-colors active:scale-95"
            >
              Richiedi Info
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// Skeleton Loader
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-stone-100 flex flex-col h-full">
    <div className="aspect-[3/2] md:h-52 bg-stone-100 animate-pulse" />
    <div className="p-4 flex flex-col gap-2.5 flex-grow">
      <div className="h-2 w-20 bg-stone-100 rounded animate-pulse" />
      <div className="h-4 w-3/4 bg-stone-200 rounded animate-pulse" />
      <div className="h-3 w-full bg-stone-50 rounded animate-pulse" />
      <div className="mt-auto pt-3 flex gap-2">
        <div className="h-10 flex-1 bg-stone-100 rounded-xl animate-pulse" />
        <div className="h-10 flex-[1.5] bg-stone-100 rounded-xl animate-pulse" />
      </div>
    </div>
  </div>
);

// ─── Componente Principale ───────────────────────────────────────────────────
export default function CorsiPage({ corsi = [], onBookingClick }: CorsiPageProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_LOAD);
  
  const [selectedItem, setSelectedItem] = useState<CorsoItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mappa id -> titolo per recuperare al volo il nome del corso padre
  const parentCourseMap = useMemo(() => {
    const map = new Map<string, string>();
    corsi.forEach(c => {
      if (!c.parent_corso_id) map.set(c.id, c.titolo);
    });
    return map;
  }, [corsi]);

  // Suddivisione Corsi Completi vs Moduli
  const corsiCompleti = useMemo(() => corsi.filter(c => !c.parent_corso_id), [corsi]);
  const moduliSingoli = useMemo(() => corsi.filter(c => Boolean(c.parent_corso_id)), [corsi]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, [corsi]);

  // Logica Filtro e Ricerca
  const filtered: CorsoItem[] = useMemo(() => {
    let base = corsi;

    if (activeFilter === "corsi") base = corsiCompleti;
    if (activeFilter === "moduli") base = moduliSingoli;

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      base = base.filter(item => {
        const parentTitle = item.parent_corso_id ? parentCourseMap.get(item.parent_corso_id) || "" : "";
        return (
          item.titolo.toLowerCase().includes(q) ||
          (item.descrizione && item.descrizione.toLowerCase().includes(q)) ||
          parentTitle.toLowerCase().includes(q)
        );
      });
    }

    return base;
  }, [corsi, corsiCompleti, moduliSingoli, activeFilter, searchQuery, parentCourseMap]);

  const visible = filtered.slice(0, visibleCount);

  const FILTERS = [
    { key: "corsi" as const,  label: "Corsi Completi", emoji: "🎓", count: corsiCompleti.length, color: "#002f59" },
    { key: "moduli" as const, label: "Singoli Moduli", emoji: "🧩", count: moduliSingoli.length, color: "#01aa9f" },
  ];

  const openDetails = (item: CorsoItem) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const closeDetails = () => {
    setIsDetailOpen(false);
    setTimeout(() => setSelectedItem(null), 300);
  };

  const toggleFilter = (key: FilterKey) => {
    setActiveFilter(prev => prev === key ? null : key);
    setVisibleCount(ITEMS_PER_LOAD);
  };

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 pt-8 pb-20">
      <div className="h-10 w-52 bg-stone-200 rounded-2xl animate-pulse mb-2" />
      <div className="h-4 w-32 bg-stone-100 rounded animate-pulse mb-8" />
      <div className="h-20 w-full bg-stone-100 rounded-[2rem] animate-pulse mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(n => <SkeletonCard key={n} />)}
      </div>
    </div>
  );

  return (
    <div className="bg-[#f5f2ed] min-h-screen antialiased">

      {/* ── Header e Titolo ─────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-0">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1 text-brand-sky">Formazione</p>
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-3xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9]">
            Accademia<br className="md:hidden" />{" "}
            <span className="text-brand-sky italic font-light">Altour.</span>
          </h1>
          <span className="text-[11px] font-black uppercase tracking-widest text-stone-400 pb-1 shrink-0">
            {filtered.length} percorsi
          </span>
        </div>
        <div className="h-1 w-10 bg-brand-sky rounded-full mt-3 mb-6" />

        {/* ── Barra di Ricerca Premium ── */}
        <div className="mb-8 mt-6 flex justify-center px-2">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              (document.activeElement as HTMLElement)?.blur();
            }}
            className="relative w-full max-w-2xl group"
          >
            <input
              type="text"
              enterKeyHint="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(ITEMS_PER_LOAD);
              }}
              placeholder="Cerca corso, modulo o argomento..."
              className="w-full pl-14 pr-12 py-4 bg-white rounded-full border-2 border-stone-100/80 focus:border-brand-sky/40 focus:ring-4 focus:ring-brand-sky/10 text-base md:text-sm font-black text-brand-stone placeholder-stone-300 outline-none transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
            />
            
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none transition-all duration-300 group-focus-within:scale-110 group-focus-within:text-brand-sky">
              <Search size={20} strokeWidth={3} />
            </div>
            
            <AnimatePresence>
              {searchQuery && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-600 text-xs active:scale-90 transition-colors font-black"
                >
                  ✕
                </motion.button>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* ── Filtri Mobile ── */}
        <div className="md:hidden mb-6 mt-2 px-1">
          <div className="flex justify-between items-center mb-4 px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">
              Tipo di Formazione
            </span>
            {activeFilter && (
              <button 
                onClick={() => { setActiveFilter(null); setVisibleCount(ITEMS_PER_LOAD); }}
                className="text-[10px] font-black uppercase tracking-widest text-brand-sky border-b border-brand-sky/30 pb-0.5"
              >
                Tutti
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
                    <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: f.color }} />
                    <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? "text-brand-stone" : "text-stone-500"}`}>
                      {f.label}
                    </span>
                  </div>
                  {f.count > 0 && <span className="text-[8px] font-bold opacity-40">{f.count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Filtri Sticky Desktop ── */}
      <div className="hidden md:block sticky top-16 z-20 bg-[#f5f2ed] border-b border-stone-200/60 py-3 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-2">
          <button
            onClick={() => { setActiveFilter(null); setVisibleCount(ITEMS_PER_LOAD); }}
            title="Mostra tutti"
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
                <button 
                  key={f.key}
                  onClick={() => toggleFilter(f.key)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full font-black uppercase text-[9px] tracking-widest transition-all duration-200 active:scale-95"
                  style={isActive
                    ? { background: f.color, color: "white", boxShadow: `0 4px 12px ${f.color}40` }
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

      {/* ── Griglia Contenuti ── */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-20">
        {visible.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="py-20 text-center bg-white rounded-[2rem] border border-stone-100 p-8 shadow-sm"
          >
            <p className="text-4xl mb-3">🎓</p>
            <h3 className="text-brand-stone font-black uppercase tracking-widest text-xs mb-1">Nessun corso o modulo trovato</h3>
            <p className="text-stone-400 text-[11px] font-medium mb-6">Non ci sono elementi corrispondenti alla tua ricerca o al filtro attivo.</p>
            <button
              onClick={() => { setActiveFilter(null); setSearchQuery(""); setVisibleCount(ITEMS_PER_LOAD); }}
              className="px-5 py-3 bg-brand-sky text-white rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all shadow-sm"
            >
              Azzera tutto
            </button>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 items-stretch">
              <AnimatePresence mode="popLayout">
                {visible.map((item, idx) => (
                  <FormazioneCard
                    key={item.id}
                    item={item}
                    idx={idx}
                    parentTitle={item.parent_corso_id ? parentCourseMap.get(item.parent_corso_id) : undefined}
                    onDetails={() => openDetails(item)}
                    onBook={(mode) => onBookingClick(item.titolo, mode)}
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
                  Altri {Math.min(ITEMS_PER_LOAD, filtered.length - visibleCount)} percorsi
                </button>
              </div>
            )}
          </>
        )}
      </div>

     {/* ── Modale Dettagli Unificato ── */}
      <ActivityDetailModal
        activity={selectedItem ? {
          ...selectedItem,
          categoria: selectedItem.categoria || "Formazione",
          titolo: selectedItem.parent_corso_id && parentCourseMap.get(selectedItem.parent_corso_id)
            ? `${selectedItem.titolo} (${parentCourseMap.get(selectedItem.parent_corso_id)})`
            : selectedItem.titolo
        } as any : null}
        isOpen={isDetailOpen}
        onClose={closeDetails}
        onBookingClick={(title: string) => {
          closeDetails();
          onBookingClick(title, "prenota");
        }}
      />
    </div>
  );
}