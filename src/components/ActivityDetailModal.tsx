// src/components/ActivityDetailModal.tsx
import { motion, AnimatePresence, useReducedMotion, Variants } from "framer-motion";
import {
  X, TrendingUp, Share2,
  Briefcase, Compass, Mountain, MapPin, ArrowUp, ExternalLink, Users, Clock, Layers
} from "lucide-react";
import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const normalizeMarkdown = (text: string | null | undefined): string => {
  if (!text) return "";
  return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");
};

const formatEquipmentList = (equipment: string) => {
  const items = equipment.split(/[,\n]+/).map(s => s.trim()).filter(s => s);
  if (items.length > 1) {
    return <ul className="list-disc list-inside space-y-1">{items.map((item, idx) => <li key={idx}>{item}</li>)}</ul>;
  }
  return <p>{equipment}</p>;
};

const IMG_FALLBACK = "/altour-logo.png";

// ─── SCROLL LOCK CONDIVISO ───
// Il contatore vive su window: ActivityDetailModal e BookingModal sono file separati
// e prima avevano due contatori indipendenti. Aprendo la booking sopra la activity,
// veniva iniettato un secondo <style> con padding-right: 0 (scrollbar già nascosta),
// facendo scattare di ~15px il layout dietro le modali.
const LOCK_STYLE_ID = 'altour-scroll-lock';

function useBodyScrollLock(isOpen: boolean) {
  useIsomorphicLayoutEffect(() => {
    if (!isOpen) return;

    const w = window as any;
    w.__altourLockCount = w.__altourLockCount || 0;

    if (w.__altourLockCount === 0 && !document.getElementById(LOCK_STYLE_ID)) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      // Calcola il padding attuale della navbar per sommarlo correttamente
      const nav = document.querySelector('header');
      const navPr = nav ? window.getComputedStyle(nav).paddingRight : '0px';

      const style = document.createElement('style');
      style.id = LOCK_STYLE_ID;
      style.textContent = `
        body {
          overflow: hidden !important;
          padding-right: ${scrollbarWidth}px !important;
        }
        header, nav {
          padding-right: calc(${navPr} + ${scrollbarWidth}px) !important;
        }
      `;
      document.head.appendChild(style);
    }
    w.__altourLockCount++;

    return () => {
      w.__altourLockCount--;
      if (w.__altourLockCount === 0) {
        const style = document.getElementById(LOCK_STYLE_ID);
        if (style) style.remove();
      }
    };
  }, [isOpen]);
}

function MiniMap({ lat, lng, isAnimationDone }: { lat: number; lng: number; isAnimationDone: boolean }) {
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (isNaN(nLat) || isNaN(nLng) || (nLat === 0 && nLng === 0)) return null;

  const delta = 0.005;
  const bbox = `${nLng - delta},${nLat - delta},${nLng + delta},${nLat + delta}`;
  const osmSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${nLat},${nLng}`;
  const googleMapsUrl = `https://maps.google.com/maps?q=${nLat},${nLng}`;

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-100 relative mt-4 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-stone-50 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <MapPin size={13} className="text-brand-sky shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-stone">Punto di partenza</span>
        </div>
        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
          className="text-[9px] font-black uppercase text-brand-sky flex items-center gap-1 hover:text-brand-stone transition-colors min-h-[30px]">
          Apri App <ExternalLink size={10} />
        </a>
      </div>

      <div className="relative h-48 bg-stone-100 w-full">
        {isAnimationDone ? (
          <iframe title="Mappa" src={osmSrc} width="100%" height="100%" style={{ border: "none" }} loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300 animate-pulse bg-stone-100">
            <MapPin size={24} />
          </div>
        )}
      </div>
    </div>
  );
}

export interface Activity {
  id: string;
  titolo: string;
  descrizione: string | null;
  descrizione_estesa?: string | null;
  prezzo?: number | string | null;
  prezzo_teorico?: number | string | null;
  prezzo_pratico?: number | string | null;
  prezzo_bundle?: number | string | null;
  selectedPrice?: number | string | null;
  selectedOption?: 'bundle' | 'teoria' | 'pratica';
  bookingSummary?: string;
  parentTitle?: string;
  parent_corso_id?: string | null;
  immagine_url: string | null;
  gallery_urls?: string[] | null;
  difficolta?: string | null;
  durata?: string | null;
  lunghezza?: number | null;
  lunghezza_tour?: string | null;
  dislivello?: number | null;
  categoria?: string | null;
  filosofia?: string | null;
  attrezzatura?: string | null;
  servizi?: string | null;
  _tipo?: 'escursione' | 'campo' | 'corso' | null;
  lat?: number | null;
  lng?: number | null;
  slug?: string | null;
  min_partecipanti?: string | null;
}

interface ActivityDetailModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingClick: (title: string) => void;
}

// Varianti a livello di modulo: oggetti stabili, non ricreati a ogni render.
// FIX LAMPEGGIO: niente scale (cambiava la scala di raster a fine spring, e Chrome
// lasciava la card non dipinta per qualche frame). Solo opacity + y.
const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const modalVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      opacity: { duration: 0.2 },
      y: { type: "spring", stiffness: 400, damping: 35 }
    }
  },
  exit: { opacity: 0, y: 16, transition: { duration: 0.18 } }
};

const reducedModalVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } }
};

export default function ActivityDetailModal({ activity, isOpen, onClose, onBookingClick }: ActivityDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAnimationDone, setIsAnimationDone] = useState(false);
  const scrollableContentRef = useRef<HTMLDivElement>(null);

  const shouldReduceMotion = useReducedMotion();

  // Applica il blocco istantaneo
  useBodyScrollLock(isOpen);

  // Dipende dall'id, non dall'oggetto: se il parent ricrea l'oggetto activity
  // (spread, selectedPrice, ecc.) l'effect non deve resettare lo stato a modale aperta.
  useEffect(() => {
    if (activity?.id) {
      setCurrentImageIndex(0);
      setIsAnimationDone(false);
      scrollableContentRef.current?.scrollTo(0, 0);
    }
  }, [activity?.id]);

  const images = useMemo(() => {
    return activity ? [activity.immagine_url, ...(activity.gallery_urls || [])].filter(Boolean) as string[] : [];
  }, [activity]);

  const hasMap = Boolean(activity?.lat && activity?.lng);
  const isTour = activity?.categoria?.toLowerCase() === "tour";
  const isCampo = activity?._tipo === "campo";

  const isCorso =
    activity?._tipo === 'corso' ||
    activity?.prezzo_bundle !== undefined ||
    activity?.prezzo_teorico !== undefined ||
    activity?.parentTitle != null;

  const currentPrice = useMemo(() => {
    if (!activity) return null;
    if (activity.selectedPrice != null) return Number(activity.selectedPrice);
    if (activity.prezzo != null && activity.prezzo !== "") return Number(activity.prezzo);
    return null;
  }, [activity]);

  const bookingLabel = useMemo(() => {
    if (!activity) return "";
    if (activity.selectedOption) {
      const optionName = activity.selectedOption === 'bundle' ? "Corso Completo" : activity.selectedOption === 'teoria' ? "Solo Teoria" : "Solo Pratica";
      return `${activity.titolo} - ${optionName} (€${currentPrice})`;
    }
    if (activity.parentTitle) return `${activity.titolo} (${activity.parentTitle})`;
    return activity.titolo;
  }, [activity, currentPrice]);

  const normalizedDesc = useMemo(() => {
    return normalizeMarkdown(activity?.descrizione_estesa || activity?.descrizione);
  }, [activity]);

  const handleShare = useCallback(async () => {
    if (!activity?.slug) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}#attivitapage/${activity.slug}`;

    if (navigator.share && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: activity.titolo, url: shareUrl });
      } catch (error) {
        console.log('Errore condivisione:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copiato negli appunti!");
      } catch (error) {
        console.log('Errore copia link:', error);
      }
    }
  }, [activity]);

  // Il setState a fine animazione serve solo alla mappa: senza mappa evitiamo
  // il re-render proprio nel frame in cui la spring termina.
  const handleAnimationComplete = useCallback(() => {
    if (hasMap) setIsAnimationDone(true);
  }, [hasMap]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && activity && (
        <motion.div
          key="activity-modal-wrapper"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-6 lg:p-8 overscroll-none"
          style={{ isolation: 'isolate' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/70 cursor-pointer"
            aria-hidden="true"
          />

          {/*
            FIX LAMPEGGIO:
            - rimosso transformTemplate (translateZ(0) riscritto a ogni frame)
            - rimosso scale dalle varianti
            - rimossi i transform-gpu sui figli (layer annidati dentro un antenato
              con overflow-hidden + rounded + animazione di transform)
            - will-change fisso: il layer resta promosso e stabile prima, durante e dopo
            - exit="exit" (prima puntava a "hidden" e la variante exit non veniva mai usata)
          */}
          <motion.div
            variants={shouldReduceMotion ? reducedModalVariants : modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onAnimationComplete={handleAnimationComplete}
            className="relative bg-white w-full h-full md:h-[80vh] md:min-h-[500px] md:max-h-[750px] max-w-5xl flex flex-col md:flex-row shadow-2xl rounded-none md:rounded-3xl overflow-hidden overscroll-none"
            style={{ zIndex: 10001, willChange: "transform, opacity" }}
          >

            {/* Azioni Alte MOBILE */}
            <div className="absolute top-4 right-4 z-50 flex md:hidden items-center gap-2">
              {activity.slug && (
                <button
                  onClick={handleShare}
                  className="p-3 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Share2 size={18} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-3 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            {/* --- COLONNA SINISTRA: IMMAGINE --- */}
            <div className="relative w-full md:w-1/2 h-[35vh] md:h-full shrink-0 bg-stone-100 overflow-hidden">
              <img
                src={images[currentImageIndex] || IMG_FALLBACK}
                className="w-full h-full object-cover"
                alt={activity.titolo}
                loading={images.length > 1 && currentImageIndex > 0 ? "lazy" : "eager"}
              />

              {activity.categoria && (
                <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-black/50 text-white border border-white/20">
                  {activity.categoria}
                </div>
              )}

              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/20 px-3 py-1.5 rounded-full">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${i === currentImageIndex ? "bg-white w-4" : "bg-white/60 w-1.5"}`}
                      aria-label={`Vedi immagine ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* --- COLONNA DESTRA: CONTENUTO E TESTO --- */}
            <div className="w-full md:w-1/2 flex flex-col h-full overflow-hidden bg-white min-h-0">

              <div className="px-5 pt-5 pb-3 border-b border-stone-50 shrink-0">
                {activity.parentTitle && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wide text-brand-sky bg-sky-50 px-2.5 py-1 rounded-md">
                      <Layers size={10} /> Corso: {activity.parentTitle}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-start gap-4 mb-2">
                  <h2 id="modal-title" className="text-xl md:text-2xl font-black text-brand-stone uppercase leading-tight">
                    {activity.titolo}
                  </h2>

                  <div className="hidden md:flex items-center gap-2 shrink-0">
                    {activity.slug && (
                      <button
                        onClick={handleShare}
                        className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-full transition-colors"
                        title="Condividi"
                      >
                        <Share2 size={18} />
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-full transition-colors"
                      title="Chiudi"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] font-black uppercase text-stone-400 mt-1">
                  {activity.difficolta && <span className="flex items-center gap-1"><Mountain size={12} className="text-brand-sky stroke-[2.5]" /> {activity.difficolta}</span>}
                  {activity.durata && (<span className="flex items-center gap-1"><Clock size={12} className="text-brand-sky stroke-[2.5]" /> {activity.durata}</span>)}
                  {!isTour && activity.lunghezza != null && <span className="flex items-center gap-1"><MapPin size={12} className="text-brand-sky stroke-[2.5]" /> {activity.lunghezza}{!isCampo && " km"}</span>}
                  {!isTour && activity.dislivello != null && <span className="flex items-center gap-1"><ArrowUp size={12} className="text-brand-sky stroke-[2.5]" /> {activity.dislivello} m</span>}
                  {activity.min_partecipanti != null && (
                    <span className="flex items-center gap-1">
                      <Users size={12} className="text-brand-sky stroke-[2.5]" />posti: {activity.min_partecipanti}
                    </span>
                  )}
                </div>
              </div>

              <div
                ref={scrollableContentRef}
                className="flex-1 overflow-y-auto px-5 py-5 space-y-6 overscroll-contain bg-white min-h-0"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <div className="prose prose-sm max-w-none prose-stone text-stone-600 font-medium prose-headings:font-black prose-headings:uppercase prose-headings:text-brand-stone prose-a:text-brand-sky prose-strong:text-brand-stone">
                  <ReactMarkdown>{normalizedDesc}</ReactMarkdown>
                </div>

                {activity.attrezzatura && (
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                    <h4 className="text-[10px] font-black uppercase text-brand-stone mb-2 flex items-center gap-2">
                      {isCorso ? <Briefcase size={14} className="text-brand-sky" /> : <Compass size={14} className="text-brand-sky" />}
                      {isCorso ? "Argomenti trattati" : "Equipaggiamento consigliato"}
                    </h4>
                    <div className="text-xs text-stone-600 leading-relaxed font-medium">{formatEquipmentList(activity.attrezzatura)}</div>
                  </div>
                )}

                {isCampo && activity.servizi && (
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                    <h4 className="text-[10px] font-black uppercase text-brand-stone mb-2 flex items-center gap-2">
                      <Compass size={14} className="text-brand-sky" />
                      Attività in programma
                    </h4>
                    <div className="text-xs text-stone-600 leading-relaxed font-medium">
                      {formatEquipmentList(activity.servizi)}
                    </div>
                  </div>
                )}

                {hasMap && <MiniMap lat={activity.lat!} lng={activity.lng!} isAnimationDone={isAnimationDone} />}
              </div>

              <div
                className="pl-5 pr-16 py-4 md:px-6 md:py-5 border-t border-stone-100 flex items-center gap-4 bg-stone-50/95 shrink-0 overscroll-none z-10"
                style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
              >
                <div className="shrink-0 flex flex-col justify-center min-w-[4rem]">
                  <span className="block text-[8px] font-black uppercase text-stone-400 leading-none mb-1">
                    {activity.selectedOption ? (activity.selectedOption === 'bundle' ? 'Quota Bundle' : activity.selectedOption === 'teoria' ? 'Quota Teoria' : 'Quota Pratica') : 'Quota'}
                  </span>
                  <span className="text-2xl font-black text-brand-stone leading-none">
                    €{currentPrice ?? "—"}
                  </span>
                </div>

                <button
                  onClick={() => onBookingClick(bookingLabel)}
                  className="flex-1 bg-brand-sky hover:bg-brand-stone text-white py-3.5 px-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-md hover:shadow-lg shadow-brand-sky/20 flex items-center justify-center gap-2 active:scale-[0.98] min-h-[48px]"
                >
                  <span className="truncate">Prenota</span>
                  <TrendingUp size={15} className="shrink-0" />
                </button>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}