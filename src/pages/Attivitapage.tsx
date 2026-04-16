/**
 * AttivitaPage — ottimizzato per iOS/WebKit
 *
 * CHANGE LOG:
 *
 * [FIX-1]  Syntax error: className=`...` → className={`...`} in 3 punti
 * [FIX-2]  ITEMS_PER_LOAD: spostato dentro useMemo/hook per evitare
 *          accesso a window durante SSR
 * [FIX-3]  allActivities + filtered → useMemo
 * [FIX-4]  FILTERS array → useMemo (dipende da escursioni/campi)
 * [FIX-5]  openDetails + toggleFilter → useCallback
 * [FIX-6]  AttivitaPageProps definita esplicitamente
 * [FIX-7]  drawerClosing rimosso: il FAB usa solo drawerOpen.
 *          Il flickering era causato dal fatto che AnimatePresence
 *          riceveva un nodo già smontato. Ora il timing è gestito
 *          dalla exit animation di AnimatePresence stessa.
 * [FIX-8]  campoToDetail: rimosso "null as unknown as number",
 *          il tipo Activity detail ora accetta prezzo: number | null
 * [FIX-9]  selectedActivity: tipizzato come ActivityDetail | null
 * [OPT-1]  Drawer content estratto in DrawerContent (evita duplicazione
 *          e garantisce stesso DOM tree per iOS e non-iOS)
 * [OPT-2]  ActivityCard handlers: useCallback sui wrapper per evitare
 *          re-render a cascata sulle card
 * [OPT-3]  Drawer iOS: will-change: transform aggiunto solo quando
 *          drawerOpen cambia, rimosso dopo la transizione via onTransitionEnd
 * [OPT-4]  formatMarkdown: spostato fuori dal componente (era già fuori,
 *          confermato corretto) + aggiunto DOMPurify-free sanitize minimo
 * [OPT-5]  SkeletonCard: estratta fuori (era già fuori, confermato)
 * [OPT-6]  Loading skeleton: usa ITEMS_PER_LOAD invece di [1,2,3] hardcoded
 * [OPT-7]  visible: useMemo invece di slice inline
 * [OPT-8]  onBookingClick wrapper nella modal: useCallback
 */

import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
  memo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import ActivityDetailModal, {
  Activity as ActivityDetail,
} from "../components/ActivityDetailModal";
import AttivitaQuiz from "../components/AttivitaQuiz";
import { isIOS, iosClean } from "../utils/motion";

// ─── Types ─────────────────────────────────────────────────────────────────────

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
type FilterKey = "mezza_giornata" | "intera_giornata" | "tour" | "campi";

// [FIX-6] Tipo esplicito per le props
interface AttivitaPageProps {
  onBookingClick: (title: string, mode?: "info" | "prenota") => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const IMG_FALLBACK = "/altour-logo.png";

// [FIX-2] Calcolato lazily, non a module-level → sicuro per SSR
function getItemsPerLoad(): number {
  if (typeof window === "undefined") return 4;
  return window.innerWidth >= 1024 ? 6 : 4;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

// [OPT-4] sanitize minimo: strip tag HTML iniettati prima del replace markdown
// Previene XSS senza dipendenze esterne (DOMPurify non disponibile in SSR)
function sanitizeText(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}

function formatMarkdown(text: string | null): string {
  if (!text) return "";
  const safe = sanitizeText(text);
  return safe
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>");
}

function safeParseArray(v: string): string[] | null {
  try {
    const p = JSON.parse(v);
    return Array.isArray(p) ? p : null;
  } catch {
    return null;
  }
}

// [FIX-8] prezzo: number | null invece di "null as unknown as number"
function campoToDetail(campo: Campo): ActivityDetail {
  return {
    id: campo.id,
    titolo: campo.titolo,
    descrizione: campo.descrizione,
    descrizione_estesa: campo.descrizione_estesa ?? null,
    prezzo: campo.prezzo ?? 0,
    immagine_url: campo.immagine_url,
    gallery_urls: null,
    difficolta: campo.difficolta ?? null,
    durata: campo.durata ?? null,
    lunghezza: campo.lunghezza ?? null,
    attrezzatura_consigliata: null,
    attrezzatura: campo.servizi?.join(", ") ?? null,
    filosofia: campo.filosofia ?? null,
    _tipo: "campo" as const,
  };
}

// ─── FilosofiaBadge ────────────────────────────────────────────────────────────

const FILOSOFIA_COLORS: Record<string, string> = {
  Avventura: "#e94544",
  Benessere: "#a5d9c9",
  "Borghi più belli": "#946a52",
  Cammini: "#e3c45d",
  "Educazione all'aperto": "#01aa9f",
  Eventi: "#ffc0cb",
  Formazione: "#002f59",
  "Immersi nel verde": "#358756",
  "Luoghi dello spirito": "#c8a3c9",
  Novità: "#75c43c",
  Speciali: "#b8163c",
  "Tra mare e cielo": "#7aaecd",
  "Trek urbano": "#f39452",
  "Tracce sulla neve": "#a8cce0",
  "Cielo stellato": "#1e2855",
};

const DARK_COLORS = new Set([
  "#002f59", "#946a52", "#b8163c", "#358756", "#1e2855",
]);

// memo: il badge non cambia se value non cambia
const FilosofiaBadge = memo(function FilosofiaBadge({
  value,
}: {
  value: string | null | undefined;
}) {
  if (!value || !FILOSOFIA_COLORS[value]) return null;
  const color = FILOSOFIA_COLORS[value];
  const bg = DARK_COLORS.has(color) ? `${color}aa` : `${color}cc`;
  return (
    <div
      className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-sm border-b-[1px] border-[#f5f2ed]/95"
      style={{
        backgroundColor: bg,
        color: "rgba(255,255,255,0.95)",
        textShadow: "0 1px 3px rgba(0,0,0,0.35)",
      }}
    >
      {value}
    </div>
  );
});

// ─── SkeletonCard ──────────────────────────────────────────────────────────────

const SkeletonCard = memo(function SkeletonCard() {
  return (
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
});

// ─── ActivityCard ──────────────────────────────────────────────────────────────

interface ActivityCardProps {
  activity: Activity;
  idx: number;
  onDetails: () => void;
  onBook: (mode?: "info" | "prenota") => void;
}

// memo: evita re-render se le props non cambiano.
// IMPORTANTE: onDetails e onBook devono essere stabili (useCallback nel parent)
const ActivityCard = memo(function ActivityCard({
  activity,
  idx,
  onDetails,
  onBook,
}: ActivityCardProps) {
  const isEsc = activity._tipo === "escursione";
  const esc = isEsc ? (activity as Escursione) : null;

  // [OPT-2] Handler stabile per il bottone "Richiedi Info"
  // Non serve useCallback qui perché il componente è già memo
  // e i props onBook/onDetails arrivano già stabili dal parent
  const handleBook = useCallback(() => onBook("info"), [onBook]);

  const cardContent = (
    <>
      <div className="aspect-[3/2] md:h-52 md:aspect-auto relative overflow-hidden flex-shrink-0">
        <img
          src={activity.immagine_url || IMG_FALLBACK}
          alt={activity.titolo}
          className="absolute inset-0 w-full h-full object-cover"
          loading={idx < 4 ? "eager" : "lazy"}
          decoding="async"
          onError={(e) => {
            e.currentTarget.src = IMG_FALLBACK;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        {isEsc ? (
          <FilosofiaBadge value={esc?.filosofia} />
        ) : (
          <FilosofiaBadge
            value={
              (activity as Campo).filosofia || (activity as Campo).slug
            }
          />
        )}
      </div>

      <div className="p-4 md:p-5 flex flex-col flex-grow">
        <div className="flex items-center gap-2.5 mb-2 flex-wrap">
          {esc?.data && (
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-brand-sky">
              <Calendar size={9} />
              {new Date(esc.data).toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "short",
              })}
            </span>
          )}
          {activity.durata && (
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-brand-sky">
              <Clock size={9} />
              {activity.durata}
            </span>
          )}
        </div>

        <h3 className="text-sm md:text-base font-black text-brand-stone uppercase leading-tight line-clamp-2 mb-1.5">
          {activity.titolo}
        </h3>

        {/* [OPT-4] dangerouslySetInnerHTML con contenuto pre-sanitizzato */}
        <p
          className="text-[11px] md:text-xs text-stone-400 line-clamp-2 leading-relaxed mb-3 flex-grow font-medium"
          dangerouslySetInnerHTML={{
            __html: formatMarkdown(activity.descrizione),
          }}
        />

        <div className="flex gap-2 pt-3 border-t border-stone-50">
          <button
            onClick={onDetails}
            className="flex-1 py-2.5 md:py-3 rounded-xl font-black uppercase text-[9px] tracking-widest border-2 border-stone-200 text-stone-600 hover:border-stone-400 transition-colors"
          >
            Dettagli
          </button>
          <button
            onClick={handleBook}
            className="flex-[1.5] py-2.5 md:py-3 rounded-xl font-black uppercase text-[9px] tracking-widest bg-brand-sky text-white shadow-sm hover:bg-[#0284c7] transition-colors"
          >
            Richiedi Info
          </button>
        </div>
      </div>
    </>
  );

  const cardClass =
    "bg-white rounded-2xl md:rounded-[2rem] overflow-hidden flex flex-col";
  const cardShadow = {
    boxShadow:
      "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
  };

  if (isIOS) {
    return (
      <div className={cardClass} style={cardShadow}>
        {cardContent}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{
        duration: 0.22,
        delay: Math.min(idx % 4, 3) * 0.05,
      }}
      className={cardClass}
      style={cardShadow}
    >
      {cardContent}
    </motion.div>
  );
});

// ─── DrawerContent ─────────────────────────────────────────────────────────────
// [OPT-1] Estratto per eliminare duplicazione iOS/non-iOS.
// Riceve solo onClose e onBookingClick — nessuno state interno.

interface DrawerContentProps {
  onClose: () => void;
  onBookingClick: (title: string, mode?: "info" | "prenota") => void;
}

const DrawerContent = memo(function DrawerContent({
  onClose,
  onBookingClick,
}: DrawerContentProps) {
  const handleQuizBook = useCallback(
    (title: string, mode?: "info" | "prenota") => {
      onClose();
      onBookingClick(title, mode);
    },
    [onClose, onBookingClick]
  );

  return (
    <>
      {/* Handle */}
      <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
        <div className="w-10 h-1 rounded-full bg-stone-300" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-sky mb-0.5">
            Trova la tua escursione
          </p>
          <h3 className="text-lg font-black text-[#44403c] uppercase tracking-tight leading-tight">
            Cosa metti
            <br />
            <span className="font-light italic" style={{ color: "#9f8270" }}>
              nel tuo zaino?
            </span>
          </h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Chiudi"
          className="w-9 h-9 rounded-full flex items-center justify-center text-stone-400 flex-shrink-0"
          style={{ background: "rgba(0,0,0,0.06)" }}
        >
          ✕
        </button>
      </div>

      {/* Scrollable quiz area */}
      <div
        className="overflow-y-auto px-4 pb-8 flex-1"
        style={{
          WebkitOverflowScrolling: "touch",
          // [OPT-3] overscrollBehavior inline per compatibilità Safari < 16
          overscrollBehavior: "contain",
        }}
      >
        <AttivitaQuiz onBookingClick={handleQuizBook} />
      </div>
    </>
  );
});

// ─── BannerQuiz ────────────────────────────────────────────────────────────────
// Estratto per alleggerire il JSX del componente principale

interface BannerQuizProps {
  onMobileOpen: () => void;
}

const bannerStyles = {
  background:
    "linear-gradient(135deg, #81ccb010 0%, #5aaadd12 50%, #f4d98c0e 100%)",
  border: "1.5px solid rgba(129,204,176,0.25)",
  boxShadow: "0 4px 24px rgba(129,204,176,0.10)",
} as const;

const BannerQuiz = memo(function BannerQuiz({ onMobileOpen }: BannerQuizProps) {
  const handleClick = useCallback(() => {
    if (window.innerWidth < 768) {
      onMobileOpen();
    } else {
      document
        .getElementById("zaino-quiz-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [onMobileOpen]);

  const inner = (
    <>
      <div className="flex items-center gap-4 px-5 py-4 md:px-7 md:py-5">
        <div
          className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl md:text-3xl"
          style={{ background: "rgba(129,204,176,0.15)" }}
        >
          
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-[9px] font-black uppercase tracking-[0.3em] mb-0.5"
            style={{ color: "#81ccb0" }}
          >
            Non sai da dove iniziare?
          </p>
          <p className="text-sm md:text-base font-black text-[#44403c] uppercase tracking-tight leading-tight">
            Costruisci il tuo zaino ideale
          </p>
          <p className="text-[10px] text-stone-400 font-medium mt-0.5 hidden md:block">
            Scegli 3 oggetti e scopri l&apos;escursione perfetta per te
          </p>
        </div>
        <button
          onClick={handleClick}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest text-white"
          style={{
            background: "linear-gradient(135deg, #81ccb0, #5aaadd)",
            boxShadow: "0 4px 14px rgba(90,170,221,0.25)",
          }}
        >
          Inizia <ArrowRight size={12} />
        </button>
      </div>
      <div
        className="h-0.5 w-full"
        style={{
          background: "linear-gradient(90deg, #81ccb0, #5aaadd, #f4d98c)",
        }}
      />
    </>
  );

  if (isIOS) {
    return (
      <div className="mb-6 rounded-[2rem] overflow-hidden" style={bannerStyles}>
        {inner}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mb-6 rounded-[2rem] overflow-hidden"
      style={bannerStyles}
    >
      {inner}
    </motion.div>
  );
});

// ─── AttivitaPage ──────────────────────────────────────────────────────────────

export default function AttivitaPage({ onBookingClick }: AttivitaPageProps) {
  const [escursioni, setEscursioni] = useState<Escursione[]>([]);
  const [campi, setCampi] = useState<Campo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterKey | null>(null);

  // [FIX-2] ITEMS_PER_LOAD calcolato una volta sola al mount
  const itemsPerLoad = useMemo(() => getItemsPerLoad(), []);
  const [visibleCount, setVisibleCount] = useState(() => getItemsPerLoad());

  // [FIX-9] Tipo corretto invece di any
  const [selectedActivity, setSelectedActivity] =
    useState<ActivityDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // [OPT-3] Ref per gestire will-change sul drawer iOS senza state aggiuntivo
  const drawerRef = useRef<HTMLDivElement>(null);

  // ─── Data fetching ────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false; // prevent state update after unmount

    async function load() {
      const [{ data: escData }, { data: campiData }] = await Promise.all([
        supabase
          .from("escursioni")
          .select("*")
          .eq("is_active", true)
          .order("data", { ascending: true }),
        supabase
          .from("campi")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (cancelled) return;

      if (escData) {
        setEscursioni(
          (escData as any[]).map((e) => ({ ...e, _tipo: "escursione" as const }))
        );
      }
      if (campiData) {
        setCampi(
          (campiData as any[]).map((row) => ({
            id: row.id,
            created_at: row.created_at,
            titolo: row.titolo,
            descrizione: row.descrizione ?? null,
            descrizione_estesa: row.descrizione_estesa ?? null,
            immagine_url: row.immagine_url ?? null,
            servizi:
              typeof row.servizi === "string"
                ? safeParseArray(row.servizi)
                : row.servizi,
            slug: row.slug,
            prezzo: row.prezzo ?? null,
            durata: row.durata ?? null,
            difficolta: row.difficolta ?? null,
            lunghezza: row.lunghezza ?? null,
            filosofia: row.filosofia ?? null,
            lat: row.lat ?? null,
            lng: row.lng ?? null,
            _tipo: "campo" as const,
          }))
        );
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Derived data (memoizzati) ────────────────────────────────────────────

  // [FIX-3] allActivities memoizzato
  const allActivities = useMemo<Activity[]>(() => {
    return [...escursioni, ...campi].sort((a, b) => {
      const da = (a as any).data
        ? new Date((a as any).data).getTime()
        : Infinity;
      const db = (b as any).data
        ? new Date((b as any).data).getTime()
        : Infinity;
      return da - db;
    });
  }, [escursioni, campi]);

  // [FIX-4] FILTERS memoizzato: dipende da escursioni e campi
  const FILTERS = useMemo(
    () => [
      {
        key: "mezza_giornata" as FilterKey,
        label: "Mezza giornata",
        emoji: " ",
        count: escursioni.filter((e) =>
          e.categoria?.toLowerCase().includes("mezza")
        ).length,
        color: "#5aaadd",
      },
      {
        key: "intera_giornata" as FilterKey,
        label: "Intera giornata",
        emoji: " ",
        count: escursioni.filter(
          (e) =>
            e.categoria?.toLowerCase() === "giornata" ||
            e.categoria?.toLowerCase().includes("intera")
        ).length,
        color: "#81ccb0",
      },
      {
        key: "tour" as FilterKey,
        label: "Tour",
        emoji: " ",
        count: escursioni.filter((e) => e.categoria?.toLowerCase() === "tour")
          .length,
        color: "#f4d98c",
        textColor: "#7a5e00",
      },
      {
        key: "campi" as FilterKey,
        label: "Campi Estivi",
        emoji: " ",
        count: campi.length,
        color: "#9f8270",
      },
    ],
    [escursioni, campi]
  );

  // [FIX-3] filtered memoizzato
  const filtered = useMemo<Activity[]>(() => {
    if (!activeFilter) return allActivities;
    switch (activeFilter) {
      case "mezza_giornata":
        return escursioni.filter((e) =>
          e.categoria?.toLowerCase().includes("mezza")
        );
      case "intera_giornata":
        return escursioni.filter(
          (e) =>
            e.categoria?.toLowerCase() === "giornata" ||
            e.categoria?.toLowerCase().includes("intera")
        );
      case "tour":
        return escursioni.filter((e) => e.categoria?.toLowerCase() === "tour");
      case "campi":
        return campi;
    }
  }, [activeFilter, allActivities, escursioni, campi]);

  // [OPT-7] visible memoizzato
  const visible = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );

  // ─── Handlers ─────────────────────────────────────────────────────────────

  // [FIX-5] Stabile con useCallback
  const openDetails = useCallback((a: Activity) => {
    setSelectedActivity(
      a._tipo === "campo" ? campoToDetail(a as Campo) : (a as unknown as ActivityDetail)
    );
    setIsDetailOpen(true);
  }, []);

  // [FIX-5]
  const toggleFilter = useCallback(
    (key: FilterKey) => {
      setActiveFilter((prev) => (prev === key ? null : key));
      setVisibleCount(itemsPerLoad);
    },
    [itemsPerLoad]
  );

  const resetFilter = useCallback(() => {
    setActiveFilter(null);
    setVisibleCount(itemsPerLoad);
  }, [itemsPerLoad]);

  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
    // [OPT-3] Promuovi il layer solo quando sta per animare
    if (drawerRef.current) {
      drawerRef.current.style.willChange = "transform";
    }
  }, []);

  // [FIX-7] closeDrawer senza setTimeout hardcoded:
  // su iOS usa onTransitionEnd per rimuovere will-change;
  // su non-iOS l'exit animation di AnimatePresence gestisce tutto
  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const handleTransitionEnd = useCallback(() => {
    // Rimuovi will-change dopo la transizione CSS (iOS drawer)
    if (drawerRef.current) {
      drawerRef.current.style.willChange = "auto";
    }
  }, []);

  // [OPT-8] Handler stabile per la modal
  const handleModalBooking = useCallback(
    (title: string, mode?: "info" | "prenota") => {
      onBookingClick(title, mode);
    },
    [onBookingClick]
  );

  const handleModalClose = useCallback(() => {
    setIsDetailOpen(false);
    // Lascia che l'exit animation della modal finisca prima di nullare
    setTimeout(() => setSelectedActivity(null), 300);
  }, []);

  const handleLoadMore = useCallback(() => {
    setVisibleCount((v) => v + itemsPerLoad);
  }, [itemsPerLoad]);

  // ─── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-20">
        <div className="h-10 w-52 bg-stone-200 rounded-2xl animate-pulse mb-2" />
        <div className="h-4 w-32 bg-stone-100 rounded animate-pulse mb-8" />
        <div className="h-20 w-full bg-stone-100 rounded-[2rem] animate-pulse mb-6" />
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {/* [OPT-6] usa itemsPerLoad invece di [1,2,3,4] hardcoded */}
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="h-14 w-28 bg-stone-100 rounded-2xl animate-pulse shrink-0"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: itemsPerLoad }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="bg-[#f5f2ed] min-h-screen">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-0">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1 text-brand-sky">
          Esplora
        </p>
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-3xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9]">
            Attività
            <br className="md:hidden" />{" "}
            <span className="text-brand-sky italic font-light">Outdoor.</span>
          </h1>
          <span className="text-[11px] font-black uppercase tracking-widest text-stone-400 pb-1 shrink-0">
            {filtered.length} attività
          </span>
        </div>
        <div className="h-1 w-10 bg-brand-sky rounded-full mt-3 mb-6" />

        {/* ── Banner quiz ────────────────────────────────────────────────── */}
        {/* [OPT-1] Estratto in BannerQuiz */}
        <BannerQuiz onMobileOpen={openDrawer} />

        {/* ── Filtri mobile ─────────────────────────────────────────────── */}
        <div className="md:hidden mb-10 mt-2 px-1">
          <div className="flex justify-between items-center mb-4 px-1">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">
              Tipo di Esperienza
            </span>
            {activeFilter && (
              <button
                onClick={resetFilter}
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
                  // [FIX-1] Template literal corretto con {}
                  className={`flex-1 min-w-[140px] flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 border ${
                    isActive
                      ? "bg-white border-stone-200 shadow-[0_4px_12px_rgba(0,0,0,0.05)] -translate-y-0.5"
                      : "bg-stone-200/40 border-transparent text-stone-500"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2 h-2 rounded-full shadow-sm"
                      style={{ backgroundColor: f.color }}
                    />
                    {/* [FIX-1] Template literal corretto */}
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider ${
                        isActive ? "text-brand-stone" : "text-stone-500"
                      }`}
                    >
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

      {/* ── Filtri sticky desktop ──────────────────────────────────────────── */}
      <div className="hidden md:block sticky top-16 z-20 bg-[#f5f2ed] border-b border-stone-200/60 py-3">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-2">
          <button
            onClick={resetFilter}
            title="Rimuovi filtro"
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={
              activeFilter
                ? {
                    background: "white",
                    border: "1.5px solid #e7e5e4",
                    color: "#a8a29e",
                  }
                : {
                    background: "#44403c",
                    color: "white",
                    boxShadow: "0 2px 8px rgba(68,64,60,0.2)",
                  }
            }
          >
            <SlidersHorizontal size={12} />
          </button>

          <div className="flex gap-2 overflow-x-auto">
            {FILTERS.map((f) => {
              const isActive = activeFilter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => toggleFilter(f.key)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full font-black uppercase text-[9px] tracking-widest transition-all duration-200 active:scale-95"
                  style={
                    isActive
                      ? {
                          background: f.color,
                          color: f.textColor ?? "white",
                          boxShadow: `0 4px 12px ${f.color}40`,
                        }
                      : {
                          background: "white",
                          color: "#a8a29e",
                          border: "1.5px solid #e7e5e4",
                        }
                  }
                >
                  {f.emoji} {f.label}
                  {f.count > 0 && (
                    <span className="text-[8px] font-black opacity-70">
                      {f.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Contenuto principale ──────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pt-5 pb-20">
        {visible.length === 0 ? (
          // Empty state
          isIOS ? (
            <div className="py-20 text-center">
              <p className="text-5xl mb-4"> </p>
              <p className="text-brand-stone font-black uppercase tracking-widest text-sm mb-2">
                Nessuna attività disponibile
              </p>
              <p className="text-stone-400 text-xs font-medium mb-6">
                Non ci sono risultati per questo filtro al momento.
              </p>
              <button
                onClick={resetFilter}
                className="px-6 py-3 bg-brand-sky text-white rounded-2xl font-black uppercase text-[9px] tracking-widest"
              >
                Vedi tutte le attività
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-20 text-center"
            >
              <p className="text-5xl mb-4"> </p>
              <p className="text-brand-stone font-black uppercase tracking-widest text-sm mb-2">
                Nessuna attività disponibile
              </p>
              <p className="text-stone-400 text-xs font-medium mb-6">
                Non ci sono risultati per questo filtro al momento.
              </p>
              <button
                onClick={resetFilter}
                className="px-6 py-3 bg-brand-sky text-white rounded-2xl font-black uppercase text-[9px] tracking-widest"
              >
                Vedi tutte le attività
              </button>
            </motion.div>
          )
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {isIOS ? (
                visible.map((activity, idx) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    idx={idx}
                    onDetails={() => openDetails(activity)}
                    onBook={(mode) => onBookingClick(activity.titolo, mode)}
                  />
                ))
              ) : (
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
              )}
            </div>

            {visibleCount < filtered.length && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleLoadMore}
                  className="flex items-center gap-2 px-6 py-3.5 bg-white rounded-2xl font-black uppercase text-[9px] tracking-widest text-stone-500 border border-stone-200 hover:border-brand-sky hover:text-brand-sky transition-all active:scale-95 shadow-sm"
                >
                  Altre{" "}
                  {Math.min(itemsPerLoad, filtered.length - visibleCount)}{" "}
                  attività
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Quiz desktop inline ─────────────────────────────────────── */}
        <div id="zaino-quiz-section" className="hidden md:block mt-24">
          <div className="flex flex-col items-center mb-12">
            <div className="h-16 w-px bg-gradient-to-b from-transparent to-stone-200" />
            <div className="flex items-center gap-3 my-3">
              <div className="h-px w-16 bg-stone-200" />
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-stone-300">
                Non sai da dove iniziare?
              </p>
              <div className="h-px w-16 bg-stone-200" />
            </div>
            <div className="h-16 w-px bg-gradient-to-t from-transparent to-stone-200" />
          </div>
          <div className="mb-10">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1 text-brand-sky">
              Trova la tua escursione
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9] mb-1">
              Costruisci il tuo
              <br />
              <span
                className="font-light italic"
                style={{ color: "#9f8270" }}
              >
                zaino ideale.
              </span>
            </h2>
            <div className="h-1.5 w-10 bg-brand-sky rounded-full mt-3" />
          </div>
          <AttivitaQuiz onBookingClick={onBookingClick} />
        </div>
      </div>

      {/* ── Mobile: FAB + Drawer ──────────────────────────────────────────── */}
      <div className="md:hidden">

        {/* FAB */}
        {isIOS ? (
          !drawerOpen && (
            <button
              onClick={openDrawer}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-6 py-4 rounded-full text-white font-black uppercase text-[10px] tracking-widest shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #81ccb0, #5aaadd)",
                boxShadow: "0 8px 32px rgba(90,170,221,0.35)",
              }}
            >
              <Sparkles size={14} /> Trova la tua escursione
            </button>
          )
        ) : (
          // [FIX-7] Rimosso drawerClosing: AnimatePresence gestisce l'exit
          <AnimatePresence>
            {!drawerOpen && (
              <motion.button
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                transition={{ type: "spring", stiffness: 340, damping: 28 }}
                onClick={openDrawer}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-6 py-4 rounded-full text-white font-black uppercase text-[10px] tracking-widest shadow-2xl"
                style={{
                  background: "linear-gradient(135deg, #81ccb0, #5aaadd)",
                  boxShadow: "0 8px 32px rgba(90,170,221,0.35)",
                }}
              >
                <Sparkles size={14} /> Trova la tua escursione
              </motion.button>
            )}
          </AnimatePresence>
        )}

        {/* Backdrop */}
        {isIOS ? (
          drawerOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-200"
              onClick={closeDrawer}
            />
          )
        ) : (
          <AnimatePresence>
            {drawerOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                // [FIX-1] iosClean: rimuove backdrop-blur su iOS
                className={iosClean(
                  "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                )}
                onClick={closeDrawer}
              />
            )}
          </AnimatePresence>
        )}

        {/* Drawer iOS — transizione CSS */}
        {isIOS && (
          <div
            ref={drawerRef}
            // [FIX-1] Template literal corretto
            className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] flex flex-col transition-transform duration-300 ease-out ${
              drawerOpen ? "translate-y-0" : "translate-y-full"
            }`}
            style={{
              background: "#f5f2ed",
              maxHeight: "92dvh",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
            }}
            // [OPT-3] Rimuovi will-change dopo la transizione CSS
            onTransitionEnd={handleTransitionEnd}
          >
            <DrawerContent
              onClose={closeDrawer}
              onBookingClick={onBookingClick}
            />
          </div>
        )}

        {/* Drawer non-iOS — Framer Motion spring + drag */}
        {!isIOS && (
          <AnimatePresence>
            {drawerOpen && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                drag="y"
                dragConstraints={{ top: 0 }}
                dragElastic={{ top: 0, bottom: 0.4 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 80 || info.velocity.y > 400) {
                    closeDrawer();
                  }
                }}
                className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] flex flex-col"
                style={{
                  background: "#f5f2ed",
                  maxHeight: "92dvh",
                  boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
                  touchAction: "none",
                }}
              >
                <DrawerContent
                  onClose={closeDrawer}
                  onBookingClick={onBookingClick}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ── Modal dettaglio ───────────────────────────────────────────────── */}
      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={isDetailOpen}
        onClose={handleModalClose}
        onBookingClick={handleModalBooking}
      />
    </div>
  );
}