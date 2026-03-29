import { motion, AnimatePresence } from "framer-motion";
import { 
  X, TrendingUp, 
  Briefcase as Backpack, Ruler, Route, Mountain, MapPin, Users, ArrowUp
} from "lucide-react";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

function normalizeMarkdown(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");
}

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
  dislivello?: number | null;
  categoria?: string | null;
  filosofia?: string | null;
  attrezzatura_consigliata?: string | null;
  attrezzatura?: string | null;
  data?: string | null;
  _tipo?: 'escursione' | 'campo' | 'corso' | null;
  lat?: number | null;
  lng?: number | null;
  min_partecipanti?: number | null;
}

interface ActivityDetailModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingClick: (title: string) => void;
}

const IMG_FALLBACK = "/altour-logo.png";

function MiniMap({ lat, lng, titolo }: { lat: number; lng: number; titolo: string }) {
  const delta = 0.018;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  return (
    <div className="rounded-2xl overflow-hidden border border-stone-100 relative mt-4">
      <div className="flex items-center gap-2 px-4 py-3 bg-stone-50 border-b border-stone-100">
        <MapPin size={13} className="text-brand-sky shrink-0" />
        <span className="text-[10px] font-black uppercase tracking-widest text-brand-stone">Punto di partenza</span>
      </div>
      <div className="relative h-48">
        <iframe title={titolo} src={src} width="100%" height="100%" style={{ border: "none" }} />
        <a href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
          target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10" />
      </div>
    </div>
  );
}

export default function ActivityDetailModal({ activity, isOpen, onClose, onBookingClick }: ActivityDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => { if (activity?.id) setCurrentImageIndex(0); }, [activity?.id]);
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!activity) return null;

  const images = [activity.immagine_url, ...(activity.gallery_urls || [])].filter(Boolean) as string[];
  const hasMap = Boolean(activity.lat && activity.lng);
  const LunghezzaIcon = activity.categoria?.toLowerCase() === "tour" ? Route : Ruler;

  const formatEquipmentList = (equipment: string) => {
    const items = equipment.split(/[,\n]+/).map(s => s.trim()).filter(s => s);
    if (items.length > 1) {
      return (
        <ul className="list-disc list-inside text-xs text-stone-600 space-y-1">
          {items.map((item, idx) => <li key={idx}>{item}</li>)}
        </ul>
      );
    }
    return <p className="text-xs text-stone-500 leading-relaxed">{equipment}</p>;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-8">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-brand-stone/80 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
            className="relative bg-white w-full max-w-5xl max-h-[93vh] md:max-h-[90vh] rounded-t-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
          >
            <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-white/80 rounded-full shadow-md">
              <X size={20} />
            </button>

            {/* Gallery */}
            <div className="md:w-1/2 relative bg-stone-100 h-48 md:h-auto flex-shrink-0">
              <img
                src={images[currentImageIndex] || IMG_FALLBACK}
                className="absolute inset-0 w-full h-full object-cover"
                alt={activity.titolo}
              />
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setCurrentImageIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${i === currentImageIndex ? "bg-white w-4" : "bg-white/50 w-1.5"}`} />
                  ))}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="md:w-1/2 flex flex-col overflow-hidden bg-white">

              {/* Header — titolo + badge tecnici (senza durata) */}
              <div className="px-6 pt-6 pb-4 border-b border-stone-50">
                <h2 className="text-xl md:text-2xl font-black text-brand-stone uppercase leading-tight mb-2">
                  {activity.titolo}
                </h2>
                <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase text-stone-400">
                  {activity.difficolta && (
                    <span className="flex items-center gap-1">
                      <Mountain size={12} className="text-brand-sky" /> {activity.difficolta}
                    </span>
                  )}
                  {activity.dislivello != null && (
                    <span className="flex items-center gap-1">
                      <ArrowUp size={12} className="text-brand-sky" /> {activity.dislivello}m
                    </span>
                  )}
                  {activity.lunghezza != null && (
                    <span className="flex items-center gap-1">
                      <LunghezzaIcon size={12} className="text-brand-sky" /> {activity.lunghezza}
                    </span>
                  )}
                  {activity.min_partecipanti != null && (
                    <div
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(129,204,176,0.12)", color: "#81ccb0", border: "1px solid rgba(129,204,176,0.28)" }}
                    >
                      <Users size={10} />
                      Min. {activity.min_partecipanti} persone
                    </div>
                  )}
                </div>
              </div>

              {/* Body scrollabile */}
              <div className="flex-grow overflow-y-auto px-6 py-6 space-y-6">
                <div className="prose prose-sm max-w-none text-stone-600 font-medium">
                  <ReactMarkdown>
                    {normalizeMarkdown(activity.descrizione_estesa || activity.descrizione || "")}
                  </ReactMarkdown>
                </div>

                {activity.attrezzatura && (
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
                    <h4 className="text-[10px] font-black uppercase text-brand-stone mb-2 flex items-center gap-2">
                      <Backpack size={14} className="text-brand-sky" />
                      {activity._tipo === 'corso' ? "Di cosa parleremo"
                        : activity._tipo === 'campo' ? "Attività previste"
                        : "Attrezzatura consigliata"}
                    </h4>
                    {formatEquipmentList(activity.attrezzatura)}
                  </div>
                )}

                {hasMap && <MiniMap lat={activity.lat!} lng={activity.lng!} titolo={activity.titolo} />}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 md:px-6 md:py-6 border-t border-stone-100 flex items-center gap-3 bg-stone-50/50">
                <div className="shrink-0">
                  <span className="block text-[8px] font-black uppercase text-stone-400 leading-none mb-0.5">Quota</span>
                  <span className="text-2xl font-black text-brand-stone leading-none">
                    €{activity.prezzo || "—"}
                  </span>
                </div>
                <button
                  onClick={() => onBookingClick(activity.titolo)}
                  className="flex-1 bg-brand-sky hover:bg-brand-stone text-white py-3.5 md:py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-brand-sky/20 flex items-center justify-center gap-2 active:scale-95"
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
}