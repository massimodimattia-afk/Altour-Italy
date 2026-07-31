import { forwardRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, BookOpen } from "lucide-react";
import { CorsoItem } from "../pages/Corsi";
import { isIOS } from "./Section";

interface CourseCardProps {
  corso: CorsoItem;
  idx?: number;
  onBookingClick: (title: string, mode?: 'info' | 'prenota') => void;
  openDetails: (item: CorsoItem) => void;
}

const CATEGORIA_COLORS: Record<string, string> = {
  "Avventura":             "#e94544",
  "Benessere":             "#a5d9c9",
  "Borghi più belli":      "#946a52",
  "Cammini":               "#e3c45d",
  "Educazione all'aperto": "#01aa9f",
  "Eventi":                "#ffc0cb",
  "Formazione":            "#002f59",
  "Immersi nel verde":     "#358756",
  "Luoghi dello spirito":  "#c8a3c9",
  "Novità":                "#75c43c",
  "Speciali":              "#b8163c",
  "Acqua e cielo":         "#7aaecd",
  "Trek urbano":           "#f39452",
  "Tracce sulla neve":     "#a8cce0",
  "Cielo stellato":        "#1e2855",
};

const IMG_FALLBACK = "/altour-logo.png";

function formatMarkdown(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>");
}

export const CourseCard = forwardRef<HTMLDivElement, CourseCardProps>(
  function CourseCard({ corso, idx = 0, onBookingClick, openDetails }, ref) {
    const categoria = corso.categoria || "Formazione";
    const categoryBg = CATEGORIA_COLORS[categoria] || "#002f59";

    // ─── LOGICA PREZZI E OPZIONI ───
    const hasBundle = corso.prezzo_bundle && Number(corso.prezzo_bundle) > 0;
    const hasTeoria = corso.prezzo_teorico && Number(corso.prezzo_teorico) > 0;
    const hasPratica = corso.prezzo_pratico && Number(corso.prezzo_pratico) > 0;

    // Determina il tab di default (priorità: Bundle > Teoria > Pratica)
    const defaultTab = hasBundle ? 'bundle' : hasTeoria ? 'teoria' : hasPratica ? 'pratica' : null;
    const [selectedOption, setSelectedOption] = useState<'bundle' | 'teoria' | 'pratica' | null>(defaultTab);

    // Se il corso cambia dinamicamente, resettiamo il selettore
    useEffect(() => {
      setSelectedOption(hasBundle ? 'bundle' : hasTeoria ? 'teoria' : hasPratica ? 'pratica' : null);
    }, [hasBundle, hasTeoria, hasPratica]);

    // Calcolo del prezzo mostrato in base all'opzione selezionata
    let displayPrice = corso.prezzo;
    let priceLabel = "Quota Corso";

    if (selectedOption === 'bundle') {
      displayPrice = Number(corso.prezzo_bundle);
      priceLabel = "Corso Completo";
    } else if (selectedOption === 'teoria') {
      displayPrice = Number(corso.prezzo_teorico);
      priceLabel = "Solo Teoria";
    } else if (selectedOption === 'pratica') {
      displayPrice = Number(corso.prezzo_pratico);
      priceLabel = "Solo Pratica";
    }

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: isIOS ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.22, delay: Math.min(idx % 4, 3) * 0.05 }}
        className="bg-white rounded-2xl md:rounded-[2rem] overflow-hidden flex flex-col active:scale-[0.99] transition-transform h-full"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)" }}
      >
        {/* Header Immagine con badge Categoria */}
        <div className="aspect-[3/2] md:h-52 md:aspect-auto relative overflow-hidden flex-shrink-0">
          <img
            src={corso.immagine_url || IMG_FALLBACK}
            alt={corso.titolo}
            className="absolute inset-0 w-full h-full object-cover"
            loading={idx < 4 ? "eager" : "lazy"}
            decoding="async"
            onError={(e) => { e.currentTarget.src = IMG_FALLBACK; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

          <div
            className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-md backdrop-blur-sm z-10"
            style={{
              backgroundColor: categoryBg,
              textShadow: "0 1px 2px rgba(0,0,0,0.3)"
            }}
          >
            {categoria}
          </div>
        </div>

        {/* Corpo Card */}
        <div className="p-4 md:p-5 flex flex-col flex-grow">
          <div className="flex items-center gap-2.5 mb-2 flex-wrap">
            {corso.durata && (
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-stone-400">
                <Clock size={10} /> {corso.durata}
              </span>
            )}
          </div>

          <h3 className="text-sm md:text-base font-black text-brand-stone uppercase tracking-tight leading-snug line-clamp-2 mb-1.5">
            {corso.titolo}
          </h3>

          <p
            className="text-[11px] md:text-xs text-stone-400 line-clamp-2 leading-relaxed mb-4 flex-grow font-medium"
            dangerouslySetInnerHTML={{ __html: formatMarkdown(corso.descrizione) }}
          />

          {/* Wrapper per Selettore, Prezzo e Pulsanti agganciato in fondo */}
          <div className="pt-4 border-t border-stone-100 flex flex-col gap-3 mt-auto">
            
            {/* PILL SELECTOR STANDARDIZZATO */}
            <div className="flex bg-stone-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setSelectedOption('bundle')}
                disabled={!hasBundle}
                className={`flex-1 text-[9px] font-black uppercase tracking-wider py-1.5 rounded-md transition-all ${
                  selectedOption === 'bundle' ? 'bg-white shadow-sm text-brand-stone' : 'text-stone-400 hover:text-stone-600'
                } ${!hasBundle ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                Completo
              </button>
              <button
                type="button"
                onClick={() => setSelectedOption('teoria')}
                disabled={!hasTeoria}
                className={`flex-1 text-[9px] font-black uppercase tracking-wider py-1.5 rounded-md transition-all ${
                  selectedOption === 'teoria' ? 'bg-white shadow-sm text-brand-stone' : 'text-stone-400 hover:text-stone-600'
                } ${!hasTeoria ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                Teoria
              </button>
              <button
                type="button"
                onClick={() => setSelectedOption('pratica')}
                disabled={!hasPratica}
                className={`flex-1 text-[9px] font-black uppercase tracking-wider py-1.5 rounded-md transition-all ${
                  selectedOption === 'pratica' ? 'bg-white shadow-sm text-brand-stone' : 'text-stone-400 hover:text-stone-600'
                } ${!hasPratica ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                Pratica
              </button>
            </div>

            {/* QUOTA */}
            {displayPrice !== undefined && displayPrice !== null && displayPrice > 0 && (
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">{priceLabel}</span>
                <span className="text-base font-black text-brand-stone">€{displayPrice}</span>
              </div>
            )}

            {/* PULSANTI AZIONE */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => openDetails({ 
                  ...corso, 
                  categoria,
                  selectedOption: selectedOption,
                  selectedPrice: displayPrice
                })}
                className="flex-1 py-2.5 md:py-3 rounded-xl font-black uppercase text-[9px] tracking-widest border-2 border-stone-200 text-stone-600 hover:border-stone-400 transition-colors active:scale-95 flex items-center justify-center gap-1"
              >
                <BookOpen size={11} /> Dettagli
              </button>
              <button
                type="button"
                onClick={() => onBookingClick(corso.titolo, "info")}
                className="flex-[1.5] py-2.5 md:py-3 rounded-xl font-black uppercase text-[9px] tracking-widest bg-brand-sky text-white shadow-sm hover:bg-[#0284c7] transition-colors active:scale-95"
              >
                Richiedi Info
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);