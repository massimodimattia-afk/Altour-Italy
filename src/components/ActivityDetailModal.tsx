import { motion, AnimatePresence } from "framer-motion";
import { 
  X, TrendingUp, 
  Briefcase as Backpack, Ruler, Mountain, MapPin, ArrowUp, ExternalLink, Clock
} from "lucide-react";
import { useState, useEffect } from "react";
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
  _tipo?: 'escursione' | 'campo' | 'corso' | null;
  lat?: number | null;
  lng?: number | null;
  slug?: string | null;
  min_partecipanti?: number | null;
}

interface ActivityDetailModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingClick: (title: string, mode?: 'info' | 'prenota') => void;
}

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
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-stone">Punto di partenza</span>
        </div>
        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
          className="text-[9px] font-black uppercase text-brand-sky flex items-center gap-1 hover:text-brand-stone transition-colors">
          Apri App <ExternalLink size={10} />
        </a>
      </div>
      <div className="relative h-48 bg-stone-100 w-full">
        <iframe title="Mappa" src={osmSrc} width="100%" height="100%" style={{ border: "none" }} loading="lazy" />
      </div>
    </div>
  );
}

export default function ActivityDetailModal({ activity, isOpen, onClose, onBookingClick }: ActivityDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (activity?.id) setCurrentImageIndex(0);
  }, [activity?.id]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!activity) return null;

  const images = [activity.immagine_url, ...(activity.gallery_urls || [])].filter(Boolean) as string[];
  const hasMap = Boolean(activity.lat && activity.lng);
  const isTour = activity.categoria?.toLowerCase() === "tour";

  const formatEquipmentList = (equipment: string) => {
    const items = equipment.split(/[,\n]+/).map(s => s.trim()).filter(s => s);
    if (items.length > 1) {
      return <ul className="list-disc list-inside space-y-1">{items.map((item, idx) => <li key={idx}>{item}</li>)}</ul>;
    }
    return <p>{equipment}</p>;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-8" style={{ isolation: 'isolate' }}>
          {/* Overlay scuro (senza backdrop-blur per evitare bug iOS) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/60"
          />

          {/* Modale */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.2, ease: "easeOut" }} // animazione lineare, no spring
            className="relative bg-white w-full max-w-5xl max-h-[93vh] md:max-h-[90vh] rounded-t-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row z-[10001]"
          >
            {/* Bottone Chiudi */}
            <button onClick={onClose} className="absolute top-4 right-4 z-30 p-2 bg-white/90 rounded-full shadow-lg active:scale-90 transition-transform">
              <X size={20} />
            </button>

            {/* Gallery */}
            <div className="md:w-1/2 relative bg-stone-100 h-56 md:h-auto flex-shrink-0">
              <img src={images[currentImageIndex] || IMG_FALLBACK} className="absolute inset-0 w-full h-full object-cover" alt={activity.titolo} />
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setCurrentImageIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${i === currentImageIndex ? "bg-white w-4" : "bg-white/50 w-1.5"}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Contenuto */}
            <div className="md:w-1/2 flex flex-col overflow-hidden bg-white">
              <div className="px-6 pt-6 pb-4 border-b border-stone-50">
                <h2 className="text-xl md:text-2xl font-black text-brand-stone uppercase leading-tight mb-2">{activity.titolo}</h2>
                <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase text-stone-400">
                  {activity.difficolta && <span className="flex items-center gap-1"><Mountain size={12} className="text-brand-sky" /> {activity.difficolta}</span>}
                  {activity.durata && <span className="flex items-center gap-1"><Clock size={12} className="text-brand-sky" /> {activity.durata}</span>}
                  {!isTour && activity.lunghezza != null && <span className="flex items-center gap-1"><Ruler size={12} className="text-brand-sky" /> {activity.lunghezza} km</span>}
                  {!isTour && activity.dislivello != null && <span className="flex items-center gap-1"><ArrowUp size={12} className="text-brand-sky" /> {activity.dislivello}m</span>}
                </div>
              </div>

              <div className="flex-grow overflow-y-auto px-6 py-6 space-y-6 overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
                <div className="prose prose-sm max-w-none text-stone-600 font-medium">
                  <ReactMarkdown>{normalizeMarkdown(activity.descrizione_estesa || activity.descrizione || "")}</ReactMarkdown>
                </div>
                {activity.attrezzatura && (
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                    <h4 className="text-[10px] font-black uppercase text-brand-stone mb-2 flex items-center gap-2">
                      <Backpack size={14} className="text-brand-sky" />
                      {activity._tipo === 'corso' ? "Argomenti" : "Equipaggiamento"}
                    </h4>
                    <div className="text-xs text-stone-600 leading-relaxed">{formatEquipmentList(activity.attrezzatura)}</div>
                  </div>
                )}
                {hasMap && <MiniMap lat={activity.lat!} lng={activity.lng!} />}
              </div>

              <div className="px-4 py-4 md:px-6 md:py-6 border-t border-stone-100 flex items-center gap-4 bg-stone-50/50">
                <div className="shrink-0">
                  <span className="block text-[8px] font-black uppercase text-stone-400 leading-none mb-1">Quota</span>
                  <span className="text-2xl font-black text-brand-stone leading-none">€{activity.prezzo || "—"}</span>
                </div>
                <button onClick={() => onBookingClick(activity.titolo, 'prenota')}
                  className="flex-1 bg-brand-sky hover:bg-brand-stone text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-brand-sky/20 flex items-center justify-center gap-2 active:scale-95">
                  Prenota Ora <TrendingUp size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}