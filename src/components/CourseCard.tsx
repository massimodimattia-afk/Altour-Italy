import { Calendar, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, BookOpen, Mountain, ArrowRight } from "lucide-react";

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
  "Acqua e cielo":          "#7aaecd",
  "Trek urbano":            "#f39452",
  "Tracce sulla neve":      "#a8cce0",
  "Cielo stellato":         "#1e2855",
};

function getCategoriaOpacity(color: string): string {
  const dark = ["#002f59", "#946a52", "#b8163c", "#358756", "#1e2855"];
  return dark.includes(color) ? `${color}aa` : `${color}cc`;
}

const IMG_FALLBACK = "/altour-logo.png";

function normalizeMarkdown(text: string): string {
  if (!text) return "";
  return text.replace(/\*\s+/g, "*").replace(/\s+\*/g, "*");
}

type PricingOption = "bundle" | "teorico" | "pratico";

export function CourseCard({ corso, onBookingClick, openDetails }: CourseCardProps) {
  const [selected, setSelected] = useState<PricingOption>("bundle");
  
  const hasModular = corso.prezzo_teorico != null || corso.prezzo_pratico != null;
  const sumParts = (Number(corso.prezzo_teorico) || 0) + (Number(corso.prezzo_pratico) || 0);
  const saveAmount = corso.prezzo_bundle != null && sumParts > 0 ? sumParts - Number(corso.prezzo_bundle) : 0;

  const color = CATEGORIA_COLORS[corso.categoria || "Formazione"] || "#002f59";
  const bg = getCategoriaOpacity(color);

  // Opzioni disponibili per il toggle
  const opts: { key: PricingOption; label: string; price: number | null | undefined; icon: React.ReactNode }[] = [
    ...(corso.prezzo_bundle != null ? [{ key: "bundle" as PricingOption, label: "Tutto", price: Number(corso.prezzo_bundle), icon: <Sparkles size={10} /> }] : []),
    ...(corso.prezzo_teorico != null ? [{ key: "teorico" as PricingOption, label: "Teoria", price: Number(corso.prezzo_teorico), icon: <BookOpen size={10} /> }] : []),
    ...(corso.prezzo_pratico != null ? [{ key: "pratico" as PricingOption, label: "Pratica", price: Number(corso.prezzo_pratico), icon: <Mountain size={10} /> }] : []),
  ];

  const currentOpt = opts.find(o => o.key === selected) ?? opts[0];
  const bookLabel = selected === "bundle" ? `${corso.titolo} — Pacchetto Completo`
    : selected === "teorico" ? `${corso.titolo} — Modulo Teorico`
    : `${corso.titolo} — Uscita Didattica`;

  // Safe date formatting
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
    } catch (e) {
      return null;
    }
  };

  const formattedDate = formatDate(corso.data_inizio);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100 flex flex-col group hover:shadow-2xl transition-all duration-500 relative"
    >
      {/* Image */}
      <div className="aspect-[16/9] md:h-56 md:aspect-auto bg-stone-200 relative overflow-hidden">
        {corso.immagine_url && (
          <img
            src={corso.immagine_url}
            alt={corso.titolo}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
            onError={(e) => { e.currentTarget.src = IMG_FALLBACK; }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        
        {/* Categoria Badge */}
        <div
          className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-sm"
          style={{
            backgroundColor: bg,
            color: "rgba(255,255,255,0.95)",
            textShadow: "0 1px 3px rgba(0,0,0,0.35)",
            boxShadow: `0 2px 12px ${color}55, inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0 1px ${color}`,
          }}
        >
          {corso.categoria || "Formazione"}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 md:p-7 flex flex-col flex-grow">
        {/* Iscrizioni aperte - badge */}
        <div className="flex items-center gap-2.5 mb-2">
          <span className="text-[9px] font-bold uppercase tracking-wide text-brand-sky">
            Iscrizioni aperte
          </span>
          {formattedDate && (
            <>
              <span className="w-1 h-1 rounded-full bg-stone-300" />
              <span className="text-[9px] font-bold uppercase tracking-wide text-stone-400">
                {formattedDate}
              </span>
            </>
          )}
        </div>
        
        <h2 className="text-lg md:text-xl font-black mb-3 text-brand-stone uppercase line-clamp-2">
          {corso.titolo}
        </h2>

        <div className="text-stone-500 text-xs md:text-sm mb-5 line-clamp-3 font-medium flex-grow [&_em]:italic [&_em]:font-serif [&_strong]:font-black [&_strong]:text-[#44403c]">
          <ReactMarkdown components={{ p: ({ children }) => <span>{children}</span> }}>
            {normalizeMarkdown(corso.descrizione ?? "")}
          </ReactMarkdown>
        </div>

        {/* Pricing */}
        <div className="mt-auto pt-5 border-t border-stone-100">
          {hasModular ? (
            <div className="space-y-3">
              {/* Toggle prezzi */}
              <div className="flex rounded-2xl p-1 gap-1" style={{ background: "rgba(0,0,0,0.04)" }}>
                {opts.map(opt => {
                  const isActive = selected === opt.key;
                  const isBundle = opt.key === "bundle";
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setSelected(opt.key)}
                      className="relative flex-1 flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all duration-200 active:scale-95 focus:outline-none"
                      style={{
                        background: isActive ? "white" : "transparent",
                        boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.10)" : "none",
                      }}
                    >
                      {isBundle && saveAmount > 0 && (
                        <span
                          className="absolute -top-2 left-1/2 -translate-x-1/2 text-[7px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full text-white whitespace-nowrap"
                          style={{ background: "#81ccb0" }}
                        >
                          −€{saveAmount}
                        </span>
                      )}
                      <span className="flex items-center gap-1 mb-0.5" style={{ color: isActive ? (isBundle ? "#5aaadd" : "#9f8270") : "#a8a29e" }}>
                        {opt.icon}
                        <span className="text-[8px] font-black uppercase tracking-widest">{opt.label}</span>
                      </span>
                      <span className="text-sm font-black" style={{ color: isActive ? "#44403c" : "#a8a29e" }}>
                        €{opt.price}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* CTA Richiedi Info */}
              <button
                onClick={() => onBookingClick(bookLabel, "prenota")}
                className="w-full min-h-[48px] py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest text-white flex items-center justify-center gap-2 active:scale-95 transition-all"
                style={{
                  background: selected === "bundle"
                    ? "linear-gradient(135deg, #5aaadd, #3d8fb8)"
                    : "linear-gradient(135deg, #9f8270, #7a6050)",
                  boxShadow: selected === "bundle"
                    ? "0 4px 14px rgba(90,170,221,0.3)"
                    : "0 4px 14px rgba(159,130,112,0.25)",
                }}
              >
                {selected === "bundle" ? <Sparkles size={11} /> : selected === "teorico" ? <BookOpen size={11} /> : <Mountain size={11} />}
                Richiedi Info — €{currentOpt?.price || 0}
                <ArrowRight size={11} />
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => onBookingClick(corso.titolo, "info")}
                className="flex-1 min-h-[48px] bg-white border-2 border-stone-900 text-stone-900 py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-stone-50 transition-all active:scale-95"
              >
                Dettagli
              </button>
              <button
                onClick={() => onBookingClick(corso.titolo, "prenota")}
                className="flex-[1.5] min-h-[48px] py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 bg-brand-sky text-white"
              >
                Richiedi Info
              </button>
            </div>
          )}

          {/* Bottone Vedi programma completo */}
          <button
            onClick={() => openDetails(corso)}
            className="w-full mt-2.5 py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest border-2 border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-all active:scale-95"
          >
            Vedi programma completo
          </button>
        </div>
      </div>
    </motion.div>
  );
}