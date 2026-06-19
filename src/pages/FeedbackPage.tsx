import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Send, CheckCircle2, ArrowLeft, Loader2, MessageSquare, Compass } from "lucide-react";
import { supabase } from "../lib/supabase";

interface FeedbackPageProps {
  onNavigate: (page: string) => void;
}

export default function FeedbackPage({ onNavigate }: FeedbackPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Stati per la gestione dinamica (Generale vs Attività)
  const [isGeneral, setIsGeneral] = useState(true);
  const [isLocked, setIsLocked] = useState(false); // Blocca il selettore se l'attività viene passata dall'URL
  
  const [formData, setFormData] = useState({
    nome_utente: "",
    attivita_nome: "",
    voto: 0,
    testo: "",
  });

  // Scrolla in alto e intercetta i parametri URL al caricamento
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Leggiamo i parametri della query dell'URL (es. ?attivita=Trekking%20Soratte)
    const params = new URLSearchParams(window.location.search);
    const urlAttivita = params.get("attivita");
    
    if (urlAttivita) {
      const decodedAttivita = decodeURIComponent(urlAttivita);
      setFormData(prev => ({ ...prev, attivita_nome: decodedAttivita }));
      setIsGeneral(false); // Forza il form sulla modalità "Attività"
      setIsLocked(true);   // Impedisce all'utente di cambiare modalità
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validazione condizionale basata sul tipo di feedback
    if (!formData.nome_utente.trim() || !formData.testo.trim()) {
      setError("Compila tutti i campi di testo obbligatori.");
      return;
    }
    
    if (!isGeneral && !formData.attivita_nome.trim()) {
      setError("Per favore, specifica il nome dell'attività svolta.");
      return;
    }

    if (formData.voto === 0) {
      setError("Per favore, seleziona una valutazione a stelle.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Se è una recensione generale, salviamo 'null' nel database per l'attività
    const finalAttivitaNome = isGeneral ? null : formData.attivita_nome.trim();

    try {
      const { error: sbError } = await supabase.from("recensioni").insert([
        {
          nome_utente: formData.nome_utente.trim(),
          attivita_nome: finalAttivitaNome,
          voto: formData.voto,
          testo: formData.testo.trim(),
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
    <div className="min-h-[100dvh] bg-stone-50 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[env(safe-area-inset-bottom)] px-4 flex flex-col ios-gpu-fix">
      
      {/* Header minimale */}
      <div className="w-full max-w-lg mx-auto mb-8 flex items-center justify-between">
        <button 
          onClick={() => onNavigate("home")}
          className="p-3 bg-white rounded-full shadow-sm text-stone-400 hover:text-brand-stone active:scale-95 transition-all touch-manipulation"
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
              
              {/* Selettore Tab stile iOS - Mostrato solo se non si proviene da link email specifico */}
              {!isLocked && (
                <div className="bg-stone-100 p-1 rounded-2xl flex gap-1 text-[10px] font-black uppercase tracking-wider mb-6">
                  <button
                    type="button"
                    onClick={() => setIsGeneral(true)}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all touch-manipulation ${isGeneral ? "bg-white text-brand-stone shadow-sm scale-[1.01]" : "text-stone-400"}`}
                  >
                    <MessageSquare size={12} /> Servizio Altour
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGeneral(false)}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all touch-manipulation ${!isGeneral ? "bg-white text-brand-stone shadow-sm scale-[1.01]" : "text-stone-400"}`}
                  >
                    <Compass size={12} /> Singola Attività
                  </button>
                </div>
              )}

              {/* Titoli Dinamici in base al Contesto */}
              <div className="mb-8">
                <h1 className="text-3xl font-black text-brand-stone uppercase tracking-tighter leading-none mb-2">
                  {isGeneral ? "Valuta " : "La tua "}<span className="text-brand-sky italic font-light">{isGeneral ? "Altour." : "Opinione."}</span>
                </h1>
                <p className="text-sm font-medium text-stone-400 leading-relaxed">
                  {isGeneral 
                    ? "Dicci come ti trovi con la nostra piattaforma web, l'assistenza e il servizio complessivo."
                    : "Aiutaci a migliorare. Il tuo feedback sarà un prezioso faro per i futuri esploratori del sentiero."
                  }
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                
                {/* Campi di Testo */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Il tuo Nome</label>
                    <input
                      type="text"
                      required
                      placeholder="es. Giulia R."
                      value={formData.nome_utente}
                      onChange={(e) => setFormData({ ...formData, nome_utente: e.target.value })}
                      className="w-full p-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-brand-sky/20 focus:bg-white text-base font-bold text-brand-stone transition-all outline-none touch-manipulation"
                    />
                  </div>

                  {/* Rendering Condizionale del campo Attività */}
                  {!isGeneral && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Attività Svolta</label>
                      {isLocked ? (
                        /* Se bloccato da URL mostriamo un badge bloccato super elegante, anziché l'input modificabile */
                        <div className="w-full p-4 bg-sky-50/40 border-2 border-brand-sky/10 rounded-2xl text-base font-bold text-brand-sky">
                          {formData.attivita_nome}
                        </div>
                      ) : (
                        /* Altrimenti l'utente può inserire liberamente l'attività */
                        <input
                          type="text"
                          required
                          placeholder="es. Soriano al Cimino"
                          value={formData.attivita_nome}
                          onChange={(e) => setFormData({ ...formData, attivita_nome: e.target.value })}
                          className="w-full p-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-brand-sky/20 focus:bg-white text-base font-bold text-brand-stone transition-all outline-none touch-manipulation"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Stelle Interattive */}
                <div className="space-y-2 py-2">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Valutazione</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, voto: star })}
                        className="p-2 active:scale-75 transition-transform touch-manipulation"
                      >
                        <Star 
                          size={32} 
                          className={`transition-colors duration-300 ${star <= formData.voto ? "fill-brand-sky text-brand-sky" : "fill-stone-100 text-stone-200"}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recensione Testuale con Placeholder Dinamico */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-1">Il tuo pensiero</label>
                  <textarea
                    required
                    rows={4}
                    placeholder={isGeneral ? "Cosa apprezzi di più di Altour? Come possiamo migliorare?" : "Raccontaci com'era il sentiero, la guida o l'organizzazione..."}
                    value={formData.testo}
                    onChange={(e) => setFormData({ ...formData, testo: e.target.value })}
                    className="w-full p-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-brand-sky/20 focus:bg-white text-base font-medium text-brand-stone  resize-none transition-all outline-none touch-manipulation"
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
                  className="w-full bg-brand-stone hover:bg-brand-sky disabled:bg-stone-200 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg touch-manipulation"
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
                className="bg-stone-100 hover:bg-stone-200 text-brand-stone py-4 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors touch-manipulation"
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