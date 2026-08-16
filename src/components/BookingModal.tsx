// src/components/BookingModal.tsx
import React, { useState, useEffect, useRef } from "react";
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
    telefono: "",
    messaggio: "",
  });
  
  const [mounted, setMounted] = useState(false);
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Inizializzazione messaggio
  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        messaggio: initialMessage || "",
      }));
    }
  }, [isOpen, initialMessage]);

  // Reset stato alla chiusura
  useEffect(() => {
    if (isOpen) {
      setSent(false);
      setFormError(null);
    } else {
      const t = setTimeout(() => {
        setFormData({ nome: "", email: "", telefono: "", messaggio: "" });
        setFormError(null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // OTTIMIZZAZIONE iOS SAFARI: Blocco scroll reale (evita rubber-banding e scroll dello sfondo)
  useEffect(() => {
    if (isOpen) {
      scrollPositionRef.current = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollPositionRef.current}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      
      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollPositionRef.current);
      };
    }
  }, [isOpen]);

  // Gestione tasto ESC (Desktop)
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
    
    if (!formData.telefono.trim()) return "Il numero di telefono è obbligatorio";
    const cleanPhone = formData.telefono.replace(/[\s\-\.\(\)]/g, "");
    if (!/^\+?[0-9]{7,15}$/.test(cleanPhone))
      return "Inserisci un numero di telefono valido";

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
      telefono: (formData.telefono || "").trim(),
      messaggio: (formData.messaggio || "").trim() || null,
      attivita: `[${mode === 'prenota' ? 'PRENOTA' : 'INFO'}] ${(title || "Prenotazione").trim()}`,
    };

    try {
      const { error } = await supabase.from("contatti").insert([payload]);
      if (error) throw error;
      setSent(true);
      setFormData({ nome: "", email: "", telefono: "", messaggio: "" });
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
          // OTTMIZZAZIONE iOS: h-[100dvh] + safe area support
          className="fixed inset-0 w-full h-[100dvh] flex items-center justify-center p-3 sm:p-4 md:p-8"
          style={{
            zIndex: 99999, 
            isolation: 'isolate',
            WebkitTapHighlightColor: 'transparent',
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-modal-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={!isSubmitting ? onClose : undefined}
            className="absolute inset-0 bg-stone-900/70"
            style={{ zIndex: 1, touchAction: 'none' }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            // OTTMIZZAZIONE iOS: max-h-[92dvh] per lasciare sempre margine con la tastiera virtuale aperta
            className="relative w-full max-w-lg bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_30px_100px_rgba(28,25,23,0.3)] flex flex-col overflow-hidden transform-gpu max-h-[92dvh]"
            style={{ zIndex: 2, willChange: "transform, opacity" }}
          >
            {/* Header Modale */}
            <div className="bg-[#f5f2ed] p-5 sm:p-7 relative border-b border-stone-100 flex-shrink-0">
              <button
                onClick={onClose}
                aria-label="Chiudi modale"
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-brand-stone hover:bg-stone-200/50 rounded-full transition-all z-10 touch-manipulation active:scale-90"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>

              <motion.div initial={{ x: -6, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-[1.5px] w-5 bg-brand-sky" />
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-brand-sky">
                    {mode === "prenota" ? "Prenotazione" : "Richiesta Info"}
                  </span>
                </div>
                <h2
                  id="booking-modal-title"
                  className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight leading-tight text-brand-stone pr-8"
                >
                  {title}
                </h2>
              </motion.div>
            </div>

            {/* Corpo Modale Scrollabile */}
            <div 
              className="p-5 sm:p-7 bg-white overflow-y-auto flex-1 overscroll-y-contain pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]"
              style={{ 
                WebkitOverflowScrolling: "touch",
                overscrollBehaviorY: "contain" 
              }}
            >
              <AnimatePresence mode="wait">
                {!sent ? (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    className="space-y-4"
                    noValidate
                  >
                    <div className="space-y-3.5">
                      {/* Nome Completo */}
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
                          type="text"
                          autoComplete="name"
                          autoCapitalize="words"
                          value={formData.nome}
                          onChange={handleChange}
                          placeholder="es. Mario Rossi"
                          // text-[16px] evita lo zoom indesiderato di Safari su iPhone
                          className="w-full p-3.5 sm:p-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-brand-sky/30 focus:bg-white focus:ring-0 font-bold text-[16px] md:text-sm text-brand-stone transition-all outline-none"
                        />
                      </div>

                      {/* Email di Contatto */}
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
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          autoCapitalize="off"
                          autoCorrect="off"
                          spellCheck={false}
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="mario@esempio.it"
                          className="w-full p-3.5 sm:p-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-brand-sky/30 focus:bg-white focus:ring-0 font-bold text-[16px] md:text-sm text-brand-stone transition-all outline-none"
                        />
                      </div>

                      {/* Telefono / WhatsApp */}
                      <div className="space-y-1">
                        <label
                          htmlFor="booking-telefono"
                          className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1"
                        >
                          Telefono / WhatsApp
                        </label>
                        <input
                          id="booking-telefono"
                          required
                          name="telefono"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          value={formData.telefono}
                          onChange={handleChange}
                          placeholder="es. +39 333 1234567"
                          className="w-full p-3.5 sm:p-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-brand-sky/30 focus:bg-white focus:ring-0 font-bold text-[16px] md:text-sm text-brand-stone transition-all outline-none"
                        />
                      </div>

                      {/* Note / Messaggio */}
                      <div className="space-y-1">
                        <label
                          htmlFor="booking-messaggio"
                          className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1"
                        >
                          Note / Importo Voucher (Opzionale)
                        </label>
                        <textarea
                          id="booking-messaggio"
                          name="messaggio"
                          value={formData.messaggio}
                          onChange={handleChange}
                          placeholder="Scrivi eventuali richieste particolari..."
                          rows={3}
                          maxLength={500}
                          className="w-full p-3.5 sm:p-4 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-brand-sky/30 focus:bg-white focus:ring-0 font-bold text-[16px] md:text-sm text-brand-stone resize-none transition-all outline-none"
                        />
                        <p className="text-right text-[9px] font-bold text-stone-300 mr-1 mt-0.5">
                          {formData.messaggio.length} / 500
                        </p>
                      </div>
                    </div>

                    {/* Alert Errore */}
                    <AnimatePresence>
                      {formError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          role="alert"
                          className="text-red-500 text-[10px] font-black uppercase text-center bg-red-50 py-2.5 px-3 rounded-xl"
                        >
                          {formError}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {/* Bottone di Invio */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-brand-sky hover:bg-[#0284c7] disabled:bg-stone-200 text-white py-4 sm:py-4.5 rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] sm:text-[11px] flex items-center justify-center gap-3 transition-all shadow-[0_12px_24px_rgba(14,165,233,0.25)] active:scale-[0.98] touch-manipulation transform-gpu mt-1 select-none"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Invio in corso...</span>
                        </>
                      ) : (
                        <>
                          <span>Invia Richiesta</span>
                          <Send className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-8 text-center"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="bg-emerald-50 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-brand-stone mb-1 uppercase tracking-tight">
                      Richiesta Inviata
                    </h2>
                    <p className="text-stone-500 font-medium text-xs sm:text-sm">
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