import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Clock, Layers } from "lucide-react";
import { CorsoItem } from "../pages/Corsi";
import { isIOS } from "./Section";

interface ModuleCardProps {
  modulo: CorsoItem;
  parentTitle?: string;
  parentCategory?: string;
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

export const ModuleCard = forwardRef<HTMLDivElement, ModuleCardProps>(
  function ModuleCard({ modulo, parentTitle, parentCategory, idx = 0, onBookingClick, openDetails }, ref) {
    // Legge la categoria dal modulo o dal corso padre (default: Formazione)
    const categoria = modulo.categoria || parentCategory || "Formazione";
    const categoryBg = CATEGORIA_COLORS[categoria] || "#002f59";

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
        {/* Header Immagine con badge Categoria (es. FORMAZIONE) */}
        <div className="aspect-[3/2] md:h-52 md:aspect-auto relative overflow-hidden flex-shrink-0">
          <img
            src={modulo.immagine_url || IMG_FALLBACK}
            alt={modulo.titolo}
            className="absolute inset-0 w-full h-full object-cover"
            loading={idx < 4 ? "eager" : "lazy"}
            decoding="async"
            onError={(e) => { e.currentTarget.src = IMG_FALLBACK; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

          {/* BADGE CATEGORIA ESCLUSIVO (in alto a destra) */}
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
            {parentTitle && (
              <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wide text-brand-sky bg-sky-50 px-2 py-0.5 rounded-md">
                <Layers size={10} /> Corso: {parentTitle}
              </span>
            )}
            {modulo.durata && (
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-stone-400">
                <Clock size={10} /> {modulo.durata}
              </span>
            )}
          </div>

          <h3 className="text-sm md:text-base font-black text-brand-stone uppercase tracking-tight leading-snug line-clamp-2 mb-1.5">
            {modulo.titolo}
          </h3>

          <p
            className="text-[11px] md:text-xs text-stone-400 line-clamp-2 leading-relaxed mb-4 flex-grow font-medium"
            dangerouslySetInnerHTML={{ __html: formatMarkdown(modulo.descrizione) }}
          />

          {/* Prezzo e Pulsanti */}
          <div className="pt-3 border-t border-stone-100 flex flex-col gap-3 mt-auto">
            {modulo.prezzo !== undefined && modulo.prezzo !== null && modulo.prezzo > 0 && (
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Quota Modulo</span>
                <span className="text-base font-black text-brand-stone">€{modulo.prezzo}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => openDetails({ ...modulo, categoria })}
                className="flex-1 py-2.5 md:py-3 rounded-xl font-black uppercase text-[9px] tracking-widest border-2 border-stone-200 text-stone-600 hover:border-stone-400 transition-colors active:scale-95"
              >
                Dettagli
              </button>
              <button
                type="button"
                onClick={() => onBookingClick(parentTitle ? `${modulo.titolo} (${parentTitle})` : modulo.titolo, "info")}
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