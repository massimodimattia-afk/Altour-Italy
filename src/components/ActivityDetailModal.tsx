/**
 * ActivityDetailModal — ottimizzato per iOS/WebKit
 * Versione autonoma (nessuna dipendenza da moduli esterni mancanti)
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  TrendingUp,
  Briefcase as Backpack,
  Ruler,
  Mountain,
  MapPin,
  ArrowUp,
  ExternalLink,
  Clock,
} from "lucide-react";
import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
} from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";

// ─── Scroll Lock Functions (inline, senza dipendenze esterne) ────────────────
// Queste funzioni sostituiscono il modulo mancante '../lib/scrollLock'

function lockScroll() {
  const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = "hidden";
  document.body.style.paddingRight = `${scrollBarWidth}px`;
  // iOS: evita il repositioning della viewport
  document.body.style.position = "fixed";
  document.body.style.top = `-${window.scrollY}px`;
  document.body.style.width = "100%";
}

function unlockScroll() {
  const scrollY = document.body.style.top;
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  if (scrollY) {
    window.scrollTo(0, parseInt(scrollY || "0", 10) * -1);
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function normalizeMarkdown(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");
}

const IMG_FALLBACK = "/altour-logo.png";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Activity {
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
  lunghezza_tour?: string | null;
  dislivello?: number | null;
  categoria?: string | null;
  filosofia?: string | null;
  attrezzatura_consigliata?: string | null;
  attrezzatura?: string | null;
  data?: string | null;
  _tipo?: "escursione" | "campo" | "corso" | null;
  lat?: number | null;
  lng?: number | null;
  slug?: string | null;
  min_partecipanti?: number | null;
}

interface ActivityDetailModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingClick: (title: string, mode?: "info" | "prenota") => void;
}

// ─── Framer Motion variants (stable object references) ────────────────────────

const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

const modalVariants = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 60 },
} as const;

const modalTransition = {
  duration: 0.22,
  ease: "easeOut" as const,
} as const;

// ─── MiniMap ──────────────────────────────────────────────────────────────────

interface MiniMapProps {
  lat: number;
  lng: number;
}

const MiniMap = memo(function MiniMap({ lat, lng }: MiniMapProps) {
  const nLat = Number(lat);
  const nLng = Number(lng);

  if (isNaN(nLat) || isNaN(nLng) || (nLat === 0 && nLng === 0)) return null;

  const delta = 0.005;
  const bbox = `${nLng - delta},${nLat - delta},${nLng + delta},${nLat + delta}`;
  const osmSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${nLat},${nLng}`;
  const googleMapsUrl = `https://www.google.com/maps?q=${nLat},${nLng}`;

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-100 relative mt-4 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-stone-50 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <MapPin size={13} className="text-brand-sky shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-stone">
            Punto di partenza
          </span>
        </div>
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] font-black uppercase text-brand-sky flex items-center gap-1 hover:text-brand-stone transition-colors"
        >
          Apri App <ExternalLink size={10} />
        </a>
      </div>

      <div className="relative h-48 bg-stone-100 w-full">
        <iframe
          title="Mappa"
          src={osmSrc}
          width="100%"
          height="100%"
          style={{ border: "none" }}
          loading="eager"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
});

// ─── EquipmentList ────────────────────────────────────────────────────────────

const EquipmentList = memo(function EquipmentList({ text }: { text: string }) {
  const items = useMemo(
    () =>
      text
        .split(/[,\n]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    [text]
  );

  if (items.length > 1) {
    return (
      <ul className="list-disc list-inside space-y-1">
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    );
  }

  return <p>{text}</p>;
});

// ─── MemoizedMarkdown ─────────────────────────────────────────────────────────

const MemoizedMarkdown = memo(function MemoizedMarkdown({
  content,
}: {
  content: string;
}) {
  return <ReactMarkdown>{normalizeMarkdown(content)}</ReactMarkdown>;
});

// ─── ActivityDetailModal ──────────────────────────────────────────────────────

export default function ActivityDetailModal({
  activity,
  isOpen,
  onClose,
  onBookingClick,
}: ActivityDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Detect iOS per disabilitare trasformazioni problematiche
  const isIOS = useMemo(() => /iPad|iPhone|iPod/.test(navigator.userAgent), []);

  // [OPT-1] Costruzione array immagini memoizzata
  const images = useMemo(
    () =>
      [activity?.immagine_url, ...(activity?.gallery_urls ?? [])].filter(
        Boolean
      ) as string[],
    [activity?.immagine_url, activity?.gallery_urls]
  );

  // Reset index al cambio attività
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [activity?.id]);

  // Lock scroll quando la modale è aperta
  useEffect(() => {
    if (isOpen) {
      lockScroll();
    } else {
      unlockScroll();
    }
    return () => {
      unlockScroll();
    };
  }, [isOpen]);

  // Chiudi con Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Handler stabile per evitare ri-render
  const handleBookingClick = useCallback(() => {
    if (!activity) return;
    onBookingClick(activity.titolo, "prenota");
  }, [activity, onBookingClick]);

  // Guard SSR
  if (typeof document === "undefined" || !activity) return null;

  const hasMap = Boolean(activity.lat && activity.lng);
  const isTour = activity.categoria?.toLowerCase() === "tour";
  const isCorso = activity._tipo === "corso";

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-8"
          style={{ isolation: "isolate" }}
          role="dialog"
          aria-modal="true"
          aria-label={activity.titolo}
        >
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/60"
          />

          {/* Pannello modale */}
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={modalTransition}
            className="relative bg-white w-full max-w-5xl max-h-[93vh] md:max-h-[90vh] rounded-t-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row z-10"
          >
            {/* Bottone chiudi */}
            <button
              onClick={onClose}
              aria-label="Chiudi"
              className={`absolute top-4 right-4 z-30 p-2 bg-white/90 rounded-full shadow-lg transition-transform ${
                isIOS ? "" : "active:scale-90"
              }`}
            >
              <X size={20} />
            </button>

            {/* Gallery */}
            <div className="md:w-1/2 relative bg-stone-100 h-56 md:h-auto flex-shrink-0">
              <img
                src={images[currentImageIndex] ?? IMG_FALLBACK}
                className="absolute inset-0 w-full h-full object-cover"
                alt={activity.titolo}
                decoding="async"
                style={{ backgroundColor: "#e5e5e5" }}
                onError={(e) => {
                  e.currentTarget.src = IMG_FALLBACK;
                }}
              />

              {/* Indicatori gallery */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      aria-label={`Immagine ${i + 1}`}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === currentImageIndex
                          ? "bg-white w-4"
                          : "bg-white/50 w-1.5"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Contenuto */}
            <div className="md:w-1/2 flex flex-col overflow-hidden bg-white">
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-stone-50">
                <h2 className="text-xl md:text-2xl font-black text-brand-stone uppercase leading-tight mb-2">
                  {activity.titolo}
                </h2>
                <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase text-stone-400">
                  {activity.difficolta && (
                    <span className="flex items-center gap-1">
                      <Mountain size={12} className="text-brand-sky" />
                      {activity.difficolta}
                    </span>
                  )}
                  {activity.durata && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-brand-sky" />
                      {activity.durata}
                    </span>
                  )}
                  {!isTour && activity.lunghezza != null && (
                    <span className="flex items-center gap-1">
                      <Ruler size={12} className="text-brand-sky" />
                      {activity.lunghezza} km
                    </span>
                  )}
                  {!isTour && activity.dislivello != null && (
                    <span className="flex items-center gap-1">
                      <ArrowUp size={12} className="text-brand-sky" />
                      {activity.dislivello}m
                    </span>
                  )}
                </div>
              </div>

              {/* Body scrollabile */}
              <div
                className="flex-grow overflow-y-auto px-6 py-6 space-y-6"
                style={{
                  WebkitOverflowScrolling: "touch",
                  overscrollBehavior: "contain",
                  ...(isIOS ? {} : { transform: "translateZ(0)" }),
                }}
              >
                {/* Descrizione markdown */}
                <div className="prose prose-sm max-w-none text-stone-600 font-medium">
                  <MemoizedMarkdown
                    content={
                      activity.descrizione_estesa ?? activity.descrizione ?? ""
                    }
                  />
                </div>

                {/* Attrezzatura / Argomenti */}
                {activity.attrezzatura && (
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                    <h4 className="text-[10px] font-black uppercase text-brand-stone mb-2 flex items-center gap-2">
                      <Backpack size={14} className="text-brand-sky" />
                      {isCorso ? "Argomenti" : "Equipaggiamento"}
                    </h4>
                    <div className="text-xs text-stone-600 leading-relaxed">
                      <EquipmentList text={activity.attrezzatura} />
                    </div>
                  </div>
                )}

                {/* Mappa */}
                {hasMap && <MiniMap lat={activity.lat!} lng={activity.lng!} />}
              </div>

              {/* Footer */}
              <div className="px-4 py-4 md:px-6 md:py-6 border-t border-stone-100 flex items-center gap-4 bg-stone-50/50">
                <div className="shrink-0">
                  <span className="block text-[8px] font-black uppercase text-stone-400 leading-none mb-1">
                    Quota
                  </span>
                  <span className="text-2xl font-black text-brand-stone leading-none">
                    {activity.prezzo ? `€${activity.prezzo}` : "—"}
                  </span>
                </div>
                <button
                  onClick={handleBookingClick}
                  className={`flex-1 bg-brand-sky hover:bg-brand-stone text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-colors shadow-lg shadow-brand-sky/20 flex items-center justify-center gap-2 ${
                    isIOS ? "" : "active:scale-95"
                  }`}
                >
                  Prenota Ora <TrendingUp size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}