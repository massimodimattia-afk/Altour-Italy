import { Calendar, Clock, ArrowRight, } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

// Interfaccia Corso allineata al database reale
export interface Corso {
  id: string;
  titolo: string;
  descrizione: string | null;
  immagine_url: string | null;
  categoria?: string | null;
  data_inizio?: string | null;
  durata?: string | null;
  prezzo_bundle?: string | number | null;
  prezzo_teorico?: string | number | null;
  prezzo_pratico?: string | number | null;
  prezzo?: string | number | null;
  is_active?: boolean;
  posizione?: number;
}

interface CourseCardProps {
  corso: Corso;
  onBookingClick: (title: string, mode?: 'info' | 'prenota') => void;
  openDetails: (activity: any) => void;
}

const CATEGORIA_COLORS: Record<string, string> = {
  "Avventura":              "#e94544",
  "Benessere":              "#a5d9c9",
  "Borghi più belli":       "#946a52",
  "Cammini":                "#e3c45d",
  "Educazione all'aperto":  "#01aa9f",
  "Eventi":                 "#ffc0cb",
  "Formazione":             "#002f59",
  "Immersi nel verde":      "#358756",
  "Luoghi dello spirito":   "#c8a3c9",
  "Novità":                 "#75c43c",
  "Speciali":               "#b8163c",
  "Tra mare e cielo":       "#7aaecd",
  "Trek urbano":            "#f39452",
  "Tracce sulla neve":      "#a8cce0",
  "Cielo stellato":         "#1e2855",
};

function getCategoriaOpacity(color: string): string {
  const dark = ["#002f59", "#946a52", "#b8163c", "#358756", "#1e2855"];
  return dark.includes(color) ? `${color}aa` : `${color}cc`;
}

const IMG_FALLBACK = "/altour-logo.png";

export function CourseCard({ corso, onBookingClick, openDetails }: CourseCardProps) {
  const [pricingMode, setPricingMode] = useState<'bundle' | 'teoria' | 'pratica'>('bundle');
  
  const color = CATEGORIA_COLORS[corso.categoria || "Formazione"] || "#002f59";
  const bg = getCategoriaOpacity(color);

  // Safe date formatting
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "Da definire";
    try {
      return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
    } catch (e) {
      return "Da definire";
    }
  };

  // Helper per ottenere il prezzo corrente in base al toggle
  const getCurrentPrice = () => {
    if (pricingMode === 'teoria') return corso.prezzo_teorico || 0;
    if (pricingMode === 'pratica') return corso.prezzo_pratico || 0;
    return corso.prezzo_bundle || corso.prezzo || 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-[2rem] shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100 flex flex-col group hover:shadow-2xl transition-all duration-500"
    >
      <div className="aspect-[16/9] bg-stone-200 relative overflow-hidden">
        {corso.immagine_url && (
          <img
            src={corso.immagine_url}
            alt={corso.titolo}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
            onError={(e) => { e.currentTarget.src = IMG_FALLBACK; }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        {/* Categoria Badge */}
        <div
          className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md"
          style={{
            backgroundColor: bg,
            color: "white",
            boxShadow: `0 4px 12px ${color}44`,
          }}
        >
          {corso.categoria || "Formazione"}
        </div>
      </div>

      <div className="p-6 md:p-8 flex flex-col flex-grow">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            <Calendar size={12} className="text-brand-sky" />
            {formatDate(corso.data_inizio)}
          </div>
          <div className="w-1 h-1 rounded-full bg-stone-200" />
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            <Clock size={12} className="text-brand-sky" />
            {corso.durata || "3 Giorni"}
          </div>
        </div>

        <h3 className="text-xl md:text-2xl font-black text-brand-stone uppercase leading-tight mb-4 group-hover:text-brand-sky transition-colors">
          {corso.titolo}
        </h3>

        {/* Pricing Toggle - Esattamente come in Accademia */}
        <div className="flex p-1 bg-stone-50 rounded-xl mb-6">
          <button
            onClick={() => setPricingMode('bundle')}
            className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${pricingMode === 'bundle' ? 'bg-white text-brand-sky shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
          >
            Tutto
          </button>
          <button
            onClick={() => setPricingMode('teoria')}
            className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${pricingMode === 'teoria' ? 'bg-white text-brand-sky shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
          >
            Teoria
          </button>
          <button
            onClick={() => setPricingMode('pratica')}
            className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${pricingMode === 'pratica' ? 'bg-white text-brand-sky shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
          >
            Pratica
          </button>
        </div>

        <div className="mt-auto pt-6 border-t border-stone-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              {pricingMode === 'bundle' ? 'Pacchetto Completo' : pricingMode === 'teoria' ? 'Solo Teoria' : 'Solo Pratica'}
            </span>
            <span className="text-xl font-black text-brand-stone">€{getCurrentPrice()}</span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => openDetails(corso)}
              className="p-3 rounded-xl border-2 border-stone-100 text-stone-400 hover:border-brand-sky hover:text-brand-sky transition-all"
            >
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => onBookingClick(corso.titolo, 'prenota')}
              className="px-6 py-3 bg-brand-sky text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-brand-sky/20 hover:bg-brand-sky/90 transition-all active:scale-95"
            >
              Prenota
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
