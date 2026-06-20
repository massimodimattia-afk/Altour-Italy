// src/components/ActivityDetailModal.tsx
import { motion, AnimatePresence } from "framer-motion";
import {
  X, TrendingUp,
  Briefcase as Backpack, Mountain, MapPin, ArrowUp, ExternalLink, Users, Clock
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
  servizi?: string | null;
  data?: string | null;
  _tipo?: 'escursione' | 'campo' | 'corso' | null;
  lat?: number | null;
  lng?: number | null;
  slug?: string | null;
  min_partecipanti?: string | null;
  selectedPrice?: number;
  selectedOption?: "bundle" | "teorico";
}

interface ActivityDetailModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingClick: (title: string, mode?: 'info' | 'prenota') => void;
}

// Passiamo un prop aggiuntivo per sapere se possiamo renderizzare l'iframe
function MiniMap({ lat, lng, isAnimationDone }: { lat: number; lng: number; isAnimationDone: boolean }) {
  const nLat = Number(lat);
  const nLng = Number(lng);
  if (isNaN(nLat) || isNaN(nLng) || (nLat === 0 && nLng === 0)) return null;
  
  const delta = 0.005;
  const bbox = `${nLng - delta},${nLat - delta},${nLng + delta},${nLat + delta}`;
  const osmSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${nLat},${nLng}`;
  const googleMapsUrl = `http://googleusercontent.com/maps.google.com/maps?q=${nLat},${nLng}`;

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-100 relative mt-4 shadow-sm transform-gpu">
      <div className="flex items-center justify-between px-4 py-3 bg-stone-50 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <MapPin size={13} className="text-brand-sky shrink-0" />
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-stone">Punto di partenza</span>
        </div>
        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
          className="text-[9px] font-black uppercase text-brand-sky flex items-center gap-1 hover:text-brand-stone transition-colors">
          Apri App <ExternalLink size={10} />
        </a>
      </div>
      
      <div className="relative h-48 bg-stone-100 w-full">
        {/* L'iframe viene caricato solo al termine dell'animazione per evitare crolli di framerate su iOS */}
        {isAnimationDone ? (
          <iframe title="Mappa" src={osmSrc} width="100%" height="100%" style={{ border: "none" }} loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300 animate-pulse">
            <MapPin size={24} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ActivityDetailModal({ activity, isOpen, onClose, onBookingClick }: ActivityDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  
  // Stato fondamentale per le performance
  const [isAnimationDone, setIsAnimationDone] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (activity?.id) {
      setCurrentImageIndex(0);
      setIsAnimationDone(false); // Reset all'apertura di una nuova attività
    }
  }, [activity?.id]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setIsAnimationDone(false); // Reset alla chiusura
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!mounted) return null;

  const images = activity ? [activity.immagine_url, ...(activity.gallery_urls || [])].filter(Boolean) as string[] : [];
  const hasMap = Boolean(activity?.lat && activity?.lng);
  const isTour = activity?.categoria?.toLowerCase() === "tour";
  const isCampo = activity?._tipo === "campo";

  const displayPrice = activity?.selectedPrice ?? activity?.prezzo;
  const bookingTitle = activity?.selectedOption
    ? `${activity.titolo} — ${activity.selectedOption === "bundle" ? "Pacchetto Completo" : "Modulo Teorico"}`
    : activity?.titolo;

  const formatEquipmentList = (equipment: string) => {
    const items = equipment.split(/[,\n]+/).map(s => s.trim()).filter(s => s);
    if (items.length > 1) {
      return <ul className="list-disc list-inside space-y-1">{items.map((item, idx) => <li key={idx}>{item}</li>)}</ul>;
    }
    return <p>{equipment}</p>;
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && activity && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8" style={{ isolation: 'isolate' }}>
          
          {/* Overlay scuro: Rimosso il backdrop-blur-sm per prestazioni iOS di picco */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/65"
          />

          {/* Container Principale Modale */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            onAnimationComplete={() => setIsAnimationDone(true)} // Sblocca i componenti pesanti
            style={{ willChange: "transform, opacity" }} // Suggerimento vitale per la GPU
            className="relative bg-white w-full max-w-5xl flex flex-col md:flex-row overflow-hidden rounded-[2rem] shadow-2xl max-h-[90vh] z-[10001] transform-gpu"
          >
            {/* Bottone Chiudi */}
            <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg active:scale-90 transition-transform">
              <X size={20} />
            </button>

            {/* Colonna Immagine */}
            <div className="w-full md:w-1/2 h-64 md:h-auto relative shrink-0">
              <img src={images[currentImageIndex] || IMG_FALLBACK} className="absolute inset-0 w-full h-full object-cover" alt={activity.titolo} />
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`h-1.5 rounded-full transition-all shadow-sm ${i === currentImageIndex ? "bg-white w-4" : "bg-white/60 w-1.5"}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Colonna Testo (Destra) */}
            <div className="w-full md:w-1/2 flex flex-col overflow-hidden bg-white">
              
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-stone-50 shrink-0">
                <h2 className="text-xl md:text-2xl font-black text-brand-stone uppercase leading-tight mb-2 pr-8">{activity.titolo}</h2>
                <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase text-stone-400">
                  {activity.difficolta && <span className="flex items-center gap-1"><Mountain size={12} className="text-brand-sky" /> {activity.difficolta}</span>}
                  {activity._tipo === 'corso' && activity.durata && (<span className="flex items-center gap-1"><Clock size={12} className="text-brand-sky" /> {activity.durata}</span>)}
                  {!isTour && activity.lunghezza != null && <span className="flex items-center gap-1"><MapPin size={12} className="text-brand-sky" /> {activity.lunghezza}{!isCampo && " km"}</span>}
                  {!isTour && activity.dislivello != null && <span className="flex items-center gap-1"><ArrowUp size={12} className="text-brand-sky" /> {activity.dislivello} m</span>}
                  {isTour && activity.lunghezza_tour && (<span className="flex items-center gap-1"><MapPin size={12} className="text-brand-sky" /> {activity.lunghezza_tour}</span>)}
                  {activity.min_partecipanti != null && (
                    <span className="flex items-center gap-1">
                      <Users size={12} className="text-brand-sky" />partecipanti: {activity.min_partecipanti}
                    </span>
                  )}
                </div>
              </div>

              {/* Corpo del Modale */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
                <div className="prose prose-sm max-w-none text-stone-600 font-medium">
                  <ReactMarkdown>{normalizeMarkdown(activity.descrizione_estesa || activity.descrizione || "")}</ReactMarkdown>
                </div>
                
                {activity.attrezzatura && (
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                    <h4 className="text-[10px] font-black uppercase text-brand-stone mb-2 flex items-center gap-2">
                      <Backpack size={14} className="text-brand-sky" />
                      {activity._tipo === 'corso' ? "Argomenti trattati" : "Equipaggiamento consigliato"}
                    </h4>
                    <div className="text-xs text-stone-600 leading-relaxed">{formatEquipmentList(activity.attrezzatura)}</div>
                  </div>
                )}
                
                {isCampo && activity.servizi && (
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                    <h4 className="text-[10px] font-black uppercase text-brand-stone mb-2 flex items-center gap-2">
                      <Backpack size={14} className="text-brand-sky" />
                      Attività in programma
                    </h4>
                    <div className="text-xs text-stone-600 leading-relaxed">
                      {formatEquipmentList(activity.servizi)}
                    </div>
                  </div>
                )}

                {/* La mappa aspetta il permesso dallo stato dell'animazione */}
                {hasMap && <MiniMap lat={activity.lat!} lng={activity.lng!} isAnimationDone={isAnimationDone} />}
              </div>

              {/* Footer */}
              <div className="px-4 py-4 md:px-6 md:py-6 border-t border-stone-100 flex items-center gap-4 bg-stone-50/50 shrink-0">
                <div className="shrink-0">
                  <span className="block text-[8px] font-black uppercase text-stone-400 leading-none mb-1">Quota</span>
                  <span className="text-2xl font-black text-brand-stone leading-none">€{displayPrice || "—"}</span>
                </div>
                <button
                  onClick={() => onBookingClick(bookingTitle || "", 'prenota')}
                  className="flex-1 bg-brand-sky hover:bg-brand-stone text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-brand-sky/20 flex items-center justify-center gap-2 active:scale-95 transform-gpu"
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