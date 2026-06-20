// src/components/BookingModal.tsx
import React, { useState, useEffect } from "react";
import { X, Send, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialMessage?: string;
  mode?: "info" | "prenota";
}

export default function BookingModal({
  isOpen,
  onClose,
  title,
  initialMessage = "",
  mode = "info",
}: BookingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    messaggio: "",
  });
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset form quando si apre
  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        messaggio: initialMessage || "",
      }));
    }
  }, [isOpen, initialMessage]);

  // Reset stato quando si chiude
  useEffect(() => {
    if (isOpen) {
      setSent(false);
      setFormError(null);
    } else {
      const t = setTimeout(() => {
        setFormData({ nome: "", email: "", messaggio: "" });
        setFormError(null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Blocco scroll armonizzato
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Gestione tasto ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isSubmitting, onClose]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.nome.trim()) return "Il nome è obbligatorio";
    if (!formData.email.trim()) return "L'email è obbligatoria";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email))
      return "Inserisci un indirizzo email valido";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
        
    setIsSubmitting(true);
    setFormError(null);
    const payload = {
      nome: (formData.nome || "").trim(),
      email: (formData.email || "").trim(),
      messaggio: (formData.messaggio || "").trim() || null,
      attivita: `[${mode === 'prenota' ? 'PRENOTA' : 'INFO'}] ${(title || "Prenotazione").trim()}`,
    };

    try {
      const { error } = await supabase.from("contatti").insert([payload]);
      if (error) throw error;
      setSent(true);
      setFormData({ nome: "", email: "", messaggio: "" });
      setTimeout(() => {
        setSent(false);
        onClose();
      }, 3500);
    } catch (error: any) {
      setFormError(`Si è verificato un errore: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          // OTTMIZZAZIONE IOS: h-[100dvh] calcola l'altezza dinamica per la tastiera
          className="fixed top-0 left-0 w-full h-[100dvh] flex items-center justify-center p-4 md:p-8"
          style={{
            zIndex: 99999, 
            isolation: 'isolate',
            pointerEvents: 'auto',
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-modal-title"
        >
          {/* Sfondo scuro: tolto il blur per prestazioni della GPU */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={!isSubmitting ? onClose : undefined}
            className="absolute inset-0 bg-stone-900/65"
            style={{ zIndex: 1 }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            // OTTMIZZAZIONE GPU: max-h-[90dvh] per permettere lo scorrimento se si apre la tastiera
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_40px_120px_rgba(28,25,23,0.25)] flex flex-col overflow-hidden transform-gpu max-h-[90dvh]"
            style={{ zIndex: 2, willChange: "transform, opacity" }}
          >
            
            {/* Header Modale */}
            <div className="bg-[#f5f2ed] p-6 md:p-8 relative border-b border-stone-100 flex-shrink-0">
              <button
                onClick={onClose}
                aria-label="Chiudi"
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-brand-stone hover:bg-stone-200/50 rounded-full transition-all z-10"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>

              <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-[1px] w-6 bg-brand-sky" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-sky">
                    {mode === "prenota" ? "Prenotazione" : "Richiesta Info"}
                  </span>
                </div>
                <h2
                  id="booking-modal-title"
                  className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-tight text-brand-stone pr-8"
                >
                  {title}
                </h2>
              </motion.div>
            </div>

            {/* Corpo Modale con Scroll Indipendente */}
            <div 
              className="p-6 md:p-8 bg-white overflow-y-auto flex-1 overscroll-contain"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <AnimatePresence mode="wait">
                {!sent ? (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    className="space-y-4"
                    noValidate
                  >
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label
                          htmlFor="booking-nome"
                          className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1"
                        >
                          Nome Completo
                        </label>
                        <input
                          id="booking-nome"
                          required
                          name="nome"
                          value={formData.nome}
                          onChange={handleChange}
                          placeholder="es. Mario Rossi"
                          // OTTMIZZAZIONE IOS: text-base su mobile evita lo zoom forzato di Safari 
                          className="w-full p-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-brand-sky/20 focus:bg-white focus:ring-0 font-bold text-base md:text-sm text-brand-stone transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label
                          htmlFor="booking-email"
                          className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1"
                        >
                          Email di Contatto
                        </label>
                        <input
                          id="booking-email"
                          required
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          type="email"
                          placeholder="mario@esempio.it"
                          // OTTMIZZAZIONE IOS: text-base su mobile
                          className="w-full p-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-brand-sky/20 focus:bg-white focus:ring-0 font-bold text-base md:text-sm text-brand-stone transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label
                          htmlFor="booking-messaggio"
                          className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1"
                        >
                          Note / Importo Voucher
                        </label>
                        <textarea
                          id="booking-messaggio"
                          name="messaggio"
                          value={formData.messaggio}
                          onChange={handleChange}
                          placeholder="Scrivi qui..."
                          rows={3}
                          maxLength={500}
                          // OTTMIZZAZIONE IOS: text-base su mobile
                          className="w-full p-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-brand-sky/20 focus:bg-white focus:ring-0 font-bold text-base md:text-sm text-brand-stone resize-none transition-all outline-none"
                        />
                        <p className="text-right text-[9px] font-bold text-stone-300 mr-1 mt-1">
                          {formData.messaggio.length} / 500
                        </p>
                      </div>
                    </div>

                    <AnimatePresence>
                      {formError && (
                        <motion.p
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          role="alert"
                          className="text-red-500 text-[10px] font-black uppercase text-center bg-red-50 py-3 rounded-xl"
                        >
                          {formError}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-brand-sky hover:bg-[#0284c7] disabled:bg-stone-200 text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-4 transition-all shadow-[0_15px_30px_rgba(14,165,233,0.25)] active:scale-95 transform-gpu mt-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Invio in corso...</span>
                        </>
                      ) : (
                        <>
                          <span>Invia Richiesta</span>
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-10 text-center"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-black text-brand-stone mb-2 uppercase tracking-tighter">
                      Richiesta Inviata
                    </h2>
                    <p className="text-stone-500 font-medium text-sm">
                      Grazie. Ti risponderemo entro 24 ore.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}