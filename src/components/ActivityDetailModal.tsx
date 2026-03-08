import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Info,
  Briefcase as Backpack,
  Ruler,
  Route,
  Mountain,
} from "lucide-react";
import { useState, useEffect } from "react";

interface Activity {
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
  categoria?: string | null;
  attrezzatura_consigliata?: string | null;
  attrezzatura?: string | null;
  data?: string | null;
  _tipo?: 'corso' | 'campo' | null;
  is_italic?: boolean | null;
}

interface ActivityDetailModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onBook: (title: string, mode?: 'info' | 'prenota') => void;
}

const IMG_FALLBACK = "/altour-logo.png";

export default function ActivityDetailModal({
  activity,
  isOpen,
  onClose,
  onBook,
}: ActivityDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = activity
    ? [activity.immagine_url, ...(activity.gallery_urls || [])].filter(Boolean) as string[]
    : [];

  useEffect(() => {
    if (activity?.id) setCurrentImageIndex(0);
  }, [activity?.id]);

  useEffect(() => {
    if (!isOpen || images.length <= 1) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, images.length]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!activity) return null;

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  const LunghezzaIcon = activity.categoria?.toLowerCase() === "tour" || activity._tipo === "campo" ? Route : Ruler;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-stone/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative bg-white w-full max-w-5xl max-h-[93vh] md:max-h-[90vh] rounded-t-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
          >
            <button
              onClick={onClose}
              aria-label="Chiudi"
              className="absolute top-4 right-4 z-20 p-2 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full shadow-md transition-all active:scale-90"
            >
              <X size={20} className="text-brand-stone" />
            </button>

            {/* Gallery */}
            <div className="md:w-1/2 relative bg-stone-100 h-52 md:h-auto md:min-h-full flex-shrink-0">
              {images.length > 0 ? (
                <>
                  <img
                    src={images[currentImageIndex]}
                    alt={activity.titolo}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.src = IMG_FALLBACK; }}
                    fetchPriority="high"
                    decoding="async"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                        aria-label="Immagine precedente"
                        className="absolute left-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all"
                      >
                        <ChevronLeft size={22} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                        aria-label="Immagine successiva"
                        className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all"
                      >
                        <ChevronRight size={22} />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                            aria-label={`Vai all'immagine ${idx + 1}`}
                            className={`h-2 rounded-full transition-all ${
                              idx === currentImageIndex ? "bg-white w-6" : "bg-white/50 w-2"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300 font-bold uppercase tracking-widest text-xs">
                  Immagine non disponibile
                </div>
              )}
            </div>

            {/* Contenuto */}
            <div className="md:w-1/2 flex flex-col overflow-hidden">

              {/* Header fisso */}
              <div className="px-6 pt-6 pb-4 md:px-12 md:pt-10 md:pb-6 border-b border-stone-100 flex-shrink-0">
                <h2 className="text-xl md:text-3xl font-black text-brand-stone uppercase tracking-tighter leading-tight mb-3 pr-8">
                  {activity.titolo}
                </h2>
                <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400">
                  {activity.difficolta && (
                    <div className="flex items-center gap-1.5">
                      <Mountain size={12} className="text-brand-sky" />
                      {activity.difficolta}
                    </div>
                  )}
                  {activity.durata && (
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-brand-sky" />
                      {activity.durata}
                    </div>
                  )}
                  {activity.lunghezza && (
                    <div className="flex items-center gap-1.5">
                      <LunghezzaIcon size={12} className="text-brand-sky" />
                      {activity.lunghezza} 
                    </div>
                  )}
                </div>
              </div>

              {/* Corpo scrollabile */}
              <div className="flex-grow overflow-y-auto px-6 py-5 md:px-12 md:py-8 space-y-6">

                {/* Descrizione — is_italic da Supabase */}
                <p className={`text-stone-600 leading-relaxed text-sm md:text-base ${
                  activity.is_italic
                    ? "italic font-serif text-stone-500 border-l-2 border-brand-sky/20 pl-4 py-1"
                    : "font-medium"
                }`}>
                  {activity.descrizione_estesa || activity.descrizione}
                </p>

                {activity.attrezzatura_consigliata && (
                  <div className="p-4 md:p-6 bg-brand-glacier rounded-2xl border border-stone-100">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-sky mb-2 flex items-center gap-2">
                      <Info size={13} /> Nota Importante
                    </h4>
                    <p className="text-stone-500 text-sm italic leading-relaxed">
                      {activity.attrezzatura_consigliata}
                    </p>
                  </div>
                )}

                {activity.attrezzatura && (
                  <div className="p-4 md:p-6 bg-stone-50 rounded-2xl border border-stone-100">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-stone mb-3 flex items-center gap-2">
                      <Backpack size={14} className="text-brand-sky" />
                      {activity._tipo === 'corso'
                        ? "Di cosa parleremo"
                        : activity._tipo === 'campo'
                          ? "Attività previste"
                          : "Equipaggiamento Consigliato"}
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                      {activity.attrezzatura.split(",").map((item, index) => (
                        <li key={index} className="text-stone-600 text-sm flex items-start gap-2">
                          <span className="text-brand-sky mt-0.5">•</span>
                          <span className="font-medium">{item.trim()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Footer CTA fisso */}
              <div className="flex-shrink-0 px-6 py-5 md:px-12 md:py-8 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                <div className="flex sm:flex-col items-baseline sm:items-start gap-2 sm:gap-0">
                  <span className="text-[9px] font-black uppercase tracking-widest text-stone-400 hidden sm:block">
                    Quota di partecipazione
                  </span>
                  <span className="text-3xl md:text-4xl font-black text-brand-stone leading-none">
                    {activity.prezzo != null ? `€${activity.prezzo}` : "—"}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-stone-400 sm:hidden">
                    quota
                  </span>
                </div>
                <button
                  onClick={() => { onBook(activity.titolo, 'prenota'); onClose(); }}
                  className="flex-grow bg-brand-sky hover:bg-brand-stone text-white px-6 py-4 md:py-5 rounded-2xl font-black uppercase text-xs md:text-sm tracking-widest transition-all duration-300 shadow-xl shadow-brand-sky/20 flex items-center justify-center gap-3 active:scale-95"
                >
                  Prenota Ora
                  <TrendingUp size={18} />
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}