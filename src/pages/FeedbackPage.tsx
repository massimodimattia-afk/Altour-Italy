import FeedbackCarousel from "../components/FeedbackCarousel";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

interface FeedbackPageProps {
  onNavigate: (page: string) => void;
}

export default function FeedbackPage({ onNavigate }: FeedbackPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nome_utente: "",
    attivita_nome: "",
    voto: 0,
    testo: "",
  });

  // Scrolla in alto al caricamento
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome_utente.trim() || !formData.attivita_nome.trim() || !formData.testo.trim()) {
      setError("Compila tutti i campi di testo.");
      return;
    }
    if (formData.voto === 0) {
      setError("Per favore, seleziona una valutazione a stelle.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: sbError } = await supabase.from("recensioni").insert([
        {
          nome_utente: formData.nome_utente.trim(),
          attivita_nome: formData.attivita_nome.trim(),
          voto: formData.voto,
          testo: formData.testo.trim(),
          // is_pubblicata non viene inviato, così Supabase applica il default 'false'
        }
      ]);

      if (sbError) throw sbError;
      
      setSent(true);
    } catch (err: any) {
      setError(`Errore durante l'invio: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // min-h-[100dvh] + safe-area prevengono i problemi di UI della barra di iOS
    <div className="min-h-[100dvh] bg-stone-50 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[env(safe-area-inset-bottom)] px-4 flex flex-col ios-gpu-fix">
      
      {/* Header minimale */}
      <div className="w-full max-w-lg mx-auto mb-8 flex items-center justify-between">
        <button 
          onClick={() => onNavigate("home")}
          className="p-3 bg-white rounded-full shadow-sm text-stone-400 hover:text-brand-stone active:scale-95 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="h-1 w-12 bg-brand-sky rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mx-auto bg-white rounded-[2rem] shadow-xl shadow-stone-200/50 p-6 md:p-10 mb-8"
      >
        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-8">
                <h1 className="text-3xl font-black text-brand-stone uppercase tracking-tighter leading-none mb-2">
                  La tua <span className="text-brand-sky italic font-light">Opinione.</span>
                </h1>
                <p className="text-sm font-medium text-stone-400 leading-relaxed">
                  Aiutaci a migliorare. Il tuo feedback sarà un prezioso faro per i futuri esploratori.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                
                {/* 1. Nome & Attività */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Il tuo Nome</label>
                    {/* text-base è FONDAMENTALE su iOS per impedire l'auto-zoom sul focus */}
                    <input
                      type="text"
                      required
                      placeholder="es. Giulia R."
                      value={formData.nome_utente}
                      onChange={(e) => setFormData({ ...formData, nome_utente: e.target.value })}
                      className="w-full p-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-brand-sky/20 focus:bg-white text-base font-bold text-brand-stone transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Attività Svolta</label>
                    <input
                      type="text"
                      required
                      placeholder="es. Soriano al Cimino"
                      value={formData.attivita_nome}
                      onChange={(e) => setFormData({ ...formData, attivita_nome: e.target.value })}
                      className="w-full p-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-brand-sky/20 focus:bg-white text-base font-bold text-brand-stone transition-all outline-none"
                    />
                  </div>
                </div>

                {/* 2. Stelle Interattive */}
                <div className="space-y-2 py-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Valutazione</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, voto: star })}
                        // p-2 assicura una hit-area di 44px+ per le dita
                        className="p-2 active:scale-75 transition-transform"
                      >
                        <Star 
                          size={32} 
                          className={`transition-colors duration-300 ${star <= formData.voto ? "fill-brand-sky text-brand-sky" : "fill-stone-100 text-stone-200"}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Recensione Testuale */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Il tuo pensiero</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Raccontaci la tua esperienza..."
                    value={formData.testo}
                    onChange={(e) => setFormData({ ...formData, testo: e.target.value })}
                    // text-base previene lo zoom anche sulla textarea
                    className="w-full p-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-brand-sky/20 focus:bg-white text-base font-medium text-brand-stone resize-none transition-all outline-none"
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-[10px] font-black uppercase text-center bg-red-50 py-3 rounded-xl">
                    {error}
                  </p>
                )}

                {/* Bottone Invio */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-stone hover:bg-brand-sky disabled:bg-stone-200 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Invia Feedback <Send size={14} /></>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            /* Schermata di Successo */
            <motion.div 
              key="success" 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="py-12 text-center"
            >
              <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-black text-brand-stone mb-3 uppercase tracking-tighter leading-none">
                Grazie di <br/><span className="text-emerald-500 italic font-light">Cuore.</span>
              </h2>
              <p className="text-stone-500 font-medium mb-8">
                La tua opinione ci aiuta a crescere. Speriamo di rivederti presto sul sentiero.
              </p>
              <button 
                onClick={() => onNavigate("home")}
                className="bg-stone-100 hover:bg-stone-200 text-brand-stone py-4 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors"
              >
                Torna alla Home
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}