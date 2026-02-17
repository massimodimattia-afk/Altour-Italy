import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, ChevronLeft, ChevronRight, TrendingUp, Info, Briefcase as Backpack } from 'lucide-react';
import { useState } from 'react';

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
  attrezzatura_consigliata?: string | null;
  attrezzatura?: string | null;
  data?: string;
}

interface ActivityDetailModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onBook: (title: string) => void;
}

export default function ActivityDetailModal({ activity, isOpen, onClose, onBook }: ActivityDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!activity) return null;

  const images = [activity.immagine_url, ...(activity.gallery_urls || [])].filter(Boolean) as string[];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-stone/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row"
          >
            {/* Gallery Section */}
            <div className="md:w-1/2 relative bg-stone-100 min-h-[300px] md:min-h-full">
              {images.length > 0 ? (
                <>
                  <img
                    src={images[currentImageIndex]}
                    alt={activity.titolo}
                    className="w-full h-full object-cover"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition-all"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-white transition-all"
                      >
                        <ChevronRight size={24} />
                      </button>
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all ${
                              idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300">
                  Nessuna immagine
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 hover:bg-stone-100 rounded-full transition-colors z-10"
              >
                <X size={24} className="text-brand-stone" />
              </button>

              <div className="mb-8">
                <h2 className="text-3xl font-black text-brand-stone uppercase tracking-tighter leading-none mb-4">
                  {activity.titolo}
                </h2>
                <div className="flex flex-wrap gap-4 text-xs font-black uppercase tracking-widest text-stone-400">
                  {activity.data && (
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-brand-sky" />
                      {new Date(activity.data).toLocaleDateString('it-IT')}
                    </div>
                  )}
                  {activity.durata && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-brand-sky" />
                      {activity.durata}
                    </div>
                  )}
                  {activity.difficolta && (
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} className="text-brand-sky" />
                      {activity.difficolta}
                    </div>
                  )}
                </div>
              </div>

              <div className="prose prose-stone max-w-none flex-grow overflow-y-auto mb-8 pr-4 custom-scrollbar">
                <p className="text-stone-600 leading-relaxed font-medium">
                  {activity.descrizione_estesa || activity.descrizione}
                </p>
                
                {activity.attrezzatura_consigliata && (
                  <div className="mt-8 p-6 bg-brand-glacier rounded-2xl border border-stone-100">
                    <h4 className="text-xs font-black uppercase tracking-widest text-brand-sky mb-3 flex items-center gap-2">
                      <Info size={14} /> Nota Importante
                    </h4>
                    <p className="text-stone-500 text-sm italic">
                      {activity.attrezzatura_consigliata}
                    </p>
                  </div>
                )}

                {activity.attrezzatura && (
                  <div className="mt-8 p-6 bg-stone-50 rounded-2xl border border-stone-100">
                    <h4 className="text-xs font-black uppercase tracking-widest text-brand-stone mb-4 flex items-center gap-2">
                      <Backpack size={16} className="text-brand-sky" /> Equipaggiamento Consigliato
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                      {activity.attrezzatura.split(',').map((item, index) => (
                        <li key={index} className="text-stone-600 text-sm flex items-start gap-2">
                          <span className="text-brand-sky mt-1">•</span>
                          <span className="font-medium">{item.trim()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-6 pt-8 border-t border-stone-100 mt-auto">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Quota di partecipazione</span>
                  <span className="text-4xl font-black text-brand-stone">€{activity.prezzo}</span>
                </div>
                <button
                  onClick={() => {
                    onBook(activity.titolo);
                    onClose();
                  }}
                  className="flex-grow bg-brand-sky hover:bg-brand-stone text-white px-8 py-5 rounded-2xl font-black uppercase text-sm tracking-widest transition-all duration-300 shadow-xl shadow-brand-sky/20 flex items-center justify-center gap-3 active:scale-95"
                >
                  Prenota Ora
                  <TrendingUp size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
