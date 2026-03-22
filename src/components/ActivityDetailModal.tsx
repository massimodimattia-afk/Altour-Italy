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
  MapPin,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

function normalizeMarkdown(text: string): string {
  return text
    .replace(/\*\s+/g, "*")
    .replace(/\s+\*/g, "*");
}

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
  lat?: number | null;
  lng?: number | null;
  min_partecipanti?: number | null;
}

interface ActivityDetailModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onBook: (title: string, mode?: 'info' | 'prenota') => void;
}

const IMG_FALLBACK = "/altour-logo.png";

function MiniMap({ lat, lng, titolo }: { lat: number; lng: number; titolo: string }) {
  const delta = 0.018;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-100 relative">
      <div className="flex items-center gap-2 px-4 py-3 bg-stone-50 border-b border-stone-100">
        <MapPin size={13} className="text-brand-sky shrink-0" />
        <span className="text-[10px] font-black uppercase tracking-widest text-brand-stone">
          Dove andiamo
        </span>
        <a
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=13`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-[9px] font-black uppercase tracking-widest text-brand-sky hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Apri mappa →
        </a>
      </div>
      <div className="relative h-48">
        <iframe
          title={`Mappa — ${titolo}`}
          src={src}
          width="100%"
          height="100%"
          loading="lazy"
          style={{ border: "none", display: "block", pointerEvents: "none" }}
          sandbox="allow-scripts allow-same-origin"
          aria-label={`Mappa del punto di partenza: ${titolo}`}
        />
        <a
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=13`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0"
          aria-label="Apri la posizione su OpenStreetMap"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}

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

  const hasMap = Boolean(activity?.lat && activity?.lng);

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

            {/* ── Gallery ─────────────────────────────────────────────────── */}
            <div className="md:w-1/2 relative bg-stone-100 h-40 md:h-auto md:min-h-full flex-shrink-0">
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

            {/* ── Contenuto ───────────────────────────────────────────────── */}
            <div className="md:w-1/2 flex flex-col overflow-hidden">

              {/* Header fisso */}
              <div className="px-4 pt-4 pb-3 md:px-12 md:pt-10 md:pb-6 border-b border-stone-100 flex-shrink-0">
                <h2 className="text-base md:text-3xl font-black text-brand-stone uppercase tracking-tighter leading-tight mb-2 pr-8">
                  {activity.titolo}
                </h2>
                {/* Pills — scroll orizzontale su mobile, wrap su desktop */}
                <div className="flex md:flex-wrap gap-2 md:gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400 overflow-x-auto pb-0.5 md:pb-0 scrollbar-none">
                  {activity.difficolta && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Mountain size={11} className="text-brand-sky" />
                      {activity.difficolta}
                    </div>
                  )}
                  {activity.durata && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Clock size={11} className="text-brand-sky" />
                      {activity.durata}
                    </div>
                  )}
                  {activity.lunghezza && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <LunghezzaIcon size={11} className="text-brand-sky" />
                      {activity.lunghezza}
                    </div>
                  )}
                  {activity.min_partecipanti != null && (
                    <div className="flex items-center gap-1 flex-shrink-0 px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(129,204,176,0.12)", color: "#81ccb0", border: "1px solid rgba(129,204,176,0.28)" }}>
                      <Users size={10} />
                      Min. {activity.min_partecipanti}
                    </div>
                  )}
                </div>
              </div>

              {/* Corpo scrollabile */}
              <div className="flex-grow overflow-y-auto px-6 py-5 md:px-12 md:py-8 space-y-6">

                {/* Descrizione — Markdown: *corsivo*, **grassetto**, paragrafi */}
                <div className="text-stone-600 leading-relaxed text-sm md:text-base font-medium
                    prose prose-sm max-w-none
                    prose-p:my-1
                    prose-strong:text-brand-stone prose-strong:font-black
                    prose-em:text-stone-500 prose-em:font-serif
                    prose-a:text-brand-sky prose-a:no-underline hover:prose-a:underline">
                  <ReactMarkdown>
                    {normalizeMarkdown(activity.descrizione_estesa || activity.descrizione || "")}
                  </ReactMarkdown>
                </div>

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

                {hasMap && (
                  <MiniMap
                    lat={activity.lat!}
                    lng={activity.lng!}
                    titolo={activity.titolo}
                  />
                )}

              </div>

              {/* Footer CTA fisso */}
              <div className="flex-shrink-0 px-4 py-3 md:px-12 md:py-8 border-t border-stone-100 flex items-center gap-3">
                <div className="flex flex-col items-start shrink-0">
                  <span className="text-[8px] font-black uppercase tracking-widest text-stone-400 leading-none mb-0.5">
                    Quota
                  </span>
                  <span className="text-2xl md:text-4xl font-black text-brand-stone leading-none">
                    {activity.prezzo != null ? `€${activity.prezzo}` : "—"}
                  </span>
                </div>
                <button
                  onClick={() => { onBook(activity.titolo, 'prenota'); onClose(); }}
                  className="flex-1 bg-brand-sky hover:bg-brand-stone text-white px-4 py-3.5 md:py-5 rounded-2xl font-black uppercase text-[10px] md:text-sm tracking-widest transition-all duration-300 shadow-lg shadow-brand-sky/20 flex items-center justify-center gap-2 active:scale-95"
                >
                  Prenota Ora
                  <TrendingUp size={15} />
                </button>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}