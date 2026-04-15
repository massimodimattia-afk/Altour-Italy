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
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";

function normalizeMarkdown(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");
}

const IMG_FALLBACK = "/altour-logo.png";

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

// ─── MiniMap ─────────────────────────────────────────────────────────────────
function MiniMap({ lat, lng }: { lat: number; lng: number }) {
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
          loading="lazy"
        />
      </div>
    </div>
  );
}

// ─── Formatta lista attrezzatura ──────────────────────────────────────────────
function EquipmentList({ text }: { text: string }) {
  const items = text
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

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
}

// ─── Varianti Framer Motion ───────────────────────────────────────────────────
const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
};

const modalVariants = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: 60 },
};

const modalTransition = {
  duration: 0.22,
  ease: "easeOut" as const,
};

// ─── Componente principale ────────────────────────────────────────────────────
export default function ActivityDetailModal({
  activity,
  isOpen,
  onClose,
  onBookingClick,
}: ActivityDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [showMap, setShowMap] = useState(false); // Stato per differire la mappa

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset gallery e mappa al cambio attività
  useEffect(() => {
    if (activity?.id) {
      setCurrentImageIndex(0);
      setShowMap(false);
    }
  }, [activity?.id]);

  // 🚀 Lock/unlock scroll body integrato (Sostituisce il file scrollLock)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Aspetta che l'animazione finisca prima di caricare l'iframe pesante
      const timer = setTimeout(() => setShowMap(true), 350);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = "";
      setShowMap(false);
    }
    
    // Cleanup per sicurezza quando smonta
    return () => {
      document.body.style.overflow = "";
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

  if (!isMounted || !activity) return null;

  const images = [
    activity.immagine_url,
    ...(activity.gallery_urls ?? []),
  ].filter(Boolean) as string[];

  const hasMap  = Boolean(activity.lat && activity.lng);
  const isTour  = activity.categoria?.toLowerCase() === "tour";
  const isCorso = activity._tipo === "corso";

  // ─── Modal content ──────────────────────────────────────────────────────────
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-8"
          style={{ isolation: "isolate" }}
          role="dialog"
          aria-modal="true"
          aria-label={activity.titolo}
        >
          {/* Overlay scuro */}
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
            {/* ── Bottone chiudi ──────────────────────────────────────────── */}
            <button
              onClick={onClose}
              aria-label="Chiudi"
              className="absolute top-4 right-4 z-30 p-2 bg-white/90 rounded-full shadow-lg active:scale-90 transition-transform"
            >
              <X size={20} />
            </button>

            {/* ── Gallery ─────────────────────────────────────────────────── */}
            <div className="md:w-1/2 relative bg-stone-100 h-56 md:h-auto flex-shrink-0">
              <img
                src={images[currentImageIndex] ?? IMG_FALLBACK}
                className="absolute inset-0 w-full h-full object-cover"
                alt={activity.titolo}
                decoding="sync"
                onError={(e) => { e.currentTarget.src = IMG_FALLBACK; }}
              />

              {/* Indicatori gallery */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      aria-label={`Immagine ${i + 1}`}
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

            {/* ── Contenuto ───────────────────────────────────────────────── */}
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
                className="flex-grow overflow-y-auto px-6 py-6 space-y-6 overscroll-contain"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <div className="prose prose-sm max-w-none text-stone-600 font-medium">
                  <ReactMarkdown>
                    {normalizeMarkdown(
                      activity.descrizione_estesa ?? activity.descrizione ?? ""
                    )}
                  </ReactMarkdown>
                </div>

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

                {/* 🚀 Mappa caricata in modo differito */}
                {hasMap && showMap && (
                  <MiniMap lat={activity.lat!} lng={activity.lng!} />
                )}
                
                {/* Placeholder mentre la mappa carica */}
                {hasMap && !showMap && (
                  <div className="h-48 w-full bg-stone-50 animate-pulse rounded-2xl border border-stone-100 flex items-center justify-center mt-4">
                    <span className="text-[10px] font-black uppercase text-stone-400">Caricamento mappa...</span>
                  </div>
                )}
              </div>

              {/* Footer con prezzo e CTA */}
              <div className="px-4 py-4 md:px-6 md:py-6 border-t border-stone-100 flex items-center gap-4 bg-white">
                <div className="shrink-0">
                  <span className="block text-[8px] font-black uppercase text-stone-400 leading-none mb-1">
                    Quota
                  </span>
                  <span className="text-2xl font-black text-brand-stone leading-none">
                    {activity.prezzo ? `€${activity.prezzo}` : "—"}
                  </span>
                </div>
                <button
                  onClick={() => onBookingClick(activity.titolo, "prenota")}
                  className="flex-1 bg-brand-sky hover:bg-brand-stone text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-colors shadow-lg shadow-brand-sky/20 flex items-center justify-center gap-2 active:scale-95"
                >
                  Prenota Ora <TrendingUp size={15} />
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}