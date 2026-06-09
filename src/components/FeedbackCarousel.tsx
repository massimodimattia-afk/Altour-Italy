import { useEffect, useState } from "react";
import { Star, Quote } from "lucide-react";
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

export default function FeedbackCarousel() {
  const [recensioni, setRecensioni] = useState<Recensione[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecensioni() {
      const { data, error } = await supabase
        .from("recensioni")
        .select("*")
        .eq("is_pubblicata", true)
        .order("created_at", { ascending: false })
        .limit(6); // Mostriamo solo le ultime 6

      if (!error && data) {
        setRecensioni(data);
      }
      setLoading(false);
    }
    fetchRecensioni();
  }, []);

  // Se sta caricando o non ci sono recensioni approvate, nascondiamo la sezione per non lasciare buchi vuoti
  if (loading || recensioni.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-stone-100 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 mb-8 md:mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-1 w-8 bg-brand-sky rounded-full" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-sky">Dicono di noi</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter">
          Le Vostre <span className="text-brand-sky italic font-light tracking-normal">Esperienze.</span>
        </h2>
      </div>

      {/* Carosello con Scroll-Snapping nativo per massima fluidità su mobile */}
      <div 
        className="flex gap-4 md:gap-6 px-4 md:px-8 pb-8 overflow-x-auto snap-x snap-mandatory no-scrollbar ios-gpu-fix"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {recensioni.map((rec, index) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: isIOS ? 0 : index * 0.1 }}
            className="snap-center shrink-0 w-[85vw] md:w-[400px] bg-white p-6 md:p-8 rounded-[2rem] shadow-lg shadow-stone-200/50 border border-stone-50 flex flex-col"
          >
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
          </motion.div>
        ))}
      </div>
    </section>
  );
}