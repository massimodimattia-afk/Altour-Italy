// src/components/FeedbackCarousel.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import { Star, Quote, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import { isIOS } from "./Section";

interface Recensione {
  id: string;
  nome_utente: string;
  attivita_nome: string;
  voto: number;
  testo: string;
}

// Estraiamo il contenuto della card per riutilizzarlo sia nel div statico (iOS) che in motion.div (PC)
function FeedbackCardInner({ rec }: { rec: Recensione }) {
  return (
    <>
      <div className="flex text-brand-sky mb-4 gap-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} className={i < rec.voto ? "fill-current" : "text-stone-200"} />
        ))}
      </div>
      <Quote size={24} className="text-stone-100 absolute top-6 right-6 rotate-180" />
      <p className="text-stone-600 font-medium text-sm leading-relaxed mb-6 flex-grow italic">
        "{rec.testo}"
      </p>
      <div className="mt-auto">
        <p className="text-xs font-black uppercase text-brand-stone tracking-widest">{rec.nome_utente}</p>
        <p className="text-[9px] font-bold uppercase text-stone-400 mt-1">{rec.attivita_nome}</p>
      </div>
    </>
  );
}

export default function FeedbackCarousel() {
  const [recensioni, setRecensioni] = useState<Recensione[]>([]);
  const [loading, setLoading]       = useState(true);
  const carouselRef                 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchRecensioni() {
      const { data, error } = await supabase
        .from("recensioni")
        .select("*")
        .eq("is_pubblicata", true)
        .order("created_at", { ascending: false })
        .limit(6);

      if (!error && data) {
        setRecensioni(data);
      }
      setLoading(false);
    }
    fetchRecensioni();
  }, []);

  const scroll = useCallback((direction: "left" | "right") => {
    if (carouselRef.current) {
      // Scorre approssimativamente della larghezza di una card + gap
      const scrollAmount = 420; 
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  }, []);

  if (loading || recensioni.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-[#f5f2ed] overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 mb-8 md:mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          
          {/* Titolo */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-1 w-6 bg-brand-sky rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-sky">Dicono di noi</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter leading-none">
              Le Vostre <br className="md:hidden" />
              <span className="text-brand-sky italic font-light tracking-normal">Esperienze.</span>
            </h2>
          </div>

          {/* Controlli di navigazione (Visibili solo su schermi Tablet/PC) */}
          <div className="hidden md:flex gap-3 pb-1">
            <button 
              onClick={() => scroll("left")}
              className="w-11 h-11 rounded-full border border-stone-200 bg-white flex items-center justify-center text-stone-400 hover:text-brand-sky hover:border-brand-sky hover:shadow-md transition-all active:scale-95 transform-gpu"
              aria-label="Scorri a sinistra"
            >
              <ArrowLeft size={18} />
            </button>
            <button 
              onClick={() => scroll("right")}
              className="w-11 h-11 rounded-full border border-stone-200 bg-white flex items-center justify-center text-stone-400 hover:text-brand-sky hover:border-brand-sky hover:shadow-md transition-all active:scale-95 transform-gpu"
              aria-label="Scorri a destra"
            >
              <ArrowRight size={18} />
            </button>
          </div>

        </div>
      </div>

      {/* Contenitore Carosello */}
      {/* Contenitore Carosello */}
      <div 
        ref={carouselRef}
        className="flex gap-4 md:gap-6 px-5 pb-8 overflow-x-auto snap-x snap-mandatory ios-gpu-fix transform-gpu [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {recensioni.map((rec, index) => {
          const cardClasses = "snap-center shrink-0 w-[85vw] md:w-[400px] bg-white p-6 md:p-8 rounded-[2rem] shadow-lg shadow-stone-200/50 border border-stone-50 flex flex-col relative overflow-hidden";
          
          // Su iOS renderizziamo un div puramente nativo per massimizzare gli FPS durante lo swipe
          if (isIOS) {
            return (
              <div key={rec.id} className={cardClasses}>
                <FeedbackCardInner rec={rec} />
              </div>
            );
          }

          // Su PC/Android manteniamo l'entrata animata
          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className={cardClasses}
            >
              <FeedbackCardInner rec={rec} />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}