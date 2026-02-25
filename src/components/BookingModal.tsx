import React, { useState, useEffect } from "react";
import { X, Send, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialMessage?: string;
}

export default function BookingModal({
  isOpen,
  onClose,
  title,
  initialMessage = "",
}: BookingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  // FIX: errore inline invece di alert()
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    messaggio: "",
  });

  // Aggiorna il messaggio quando la modale si apre (per i voucher)
  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        messaggio: initialMessage || "",
      }));
    }
  }, [isOpen, initialMessage]);

  // FIX: reset form e stato sent quando la modale si riapre/chiude
  useEffect(() => {
    if (isOpen) {
      // FIX: sent non rimane se la modale viene riaperta prima del timeout
      setSent(false);
      setFormError(null);
    } else {
      // FIX: piccolo delay per non vedere il reset durante l'animazione di chiusura
      const t = setTimeout(() => {
        setFormData({ nome: "", email: "", messaggio: "" });
        setFormError(null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

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
    // FIX: pulisce l'errore al primo keystroke dopo che è apparso
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
    // FIX: errore inline invece di alert()
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
      attivita: (title || "Prenotazione").trim(),
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
      // FIX: errore server inline invece di alert()
      setFormError(`Si è verificato un errore: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isSubmitting ? onClose : undefined}
            className="absolute inset-0 bg-stone-200/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_40px_120px_rgba(28,25,23,0.15)] overflow-hidden border border-white"
          >
            <div className="bg-[#f5f2ed] p-8 md:p-10 relative border-b border-stone-100">
              <button
                onClick={onClose}
                aria-label="Chiudi"
                className="absolute top-6 right-6 p-2 text-stone-400 hover:text-brand-stone hover:bg-stone-200/50 rounded-full transition-all"
                disabled={isSubmitting}
              >
                <X className="w-6 h-6" />
              </button>

              <motion.div
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-[1px] w-6 bg-brand-sky" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-sky">
                    Contatto Diretto
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-tight text-brand-stone">
                  {title}
                </h2>
              </motion.div>
            </div>

            <div className="p-8 md:p-10 bg-white">
              <AnimatePresence mode="wait">
                {!sent ? (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    className="space-y-5"
                  >
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">
                          Nome Completo
                        </label>
                        <input
                          required
                          name="nome"
                          value={formData.nome}
                          onChange={handleChange}
                          placeholder="es. Mario Rossi"
                          className="w-full p-5 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-brand-sky/20 focus:bg-white focus:ring-0 font-bold text-xs text-brand-stone transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">
                          Email di Contatto
                        </label>
                        <input
                          required
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          type="email"
                          placeholder="mario@esempio.it"
                          className="w-full p-5 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-brand-sky/20 focus:bg-white focus:ring-0 font-bold text-xs text-brand-stone transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest ml-1">
                          Note / Importo Voucher
                        </label>
                        <textarea
                          name="messaggio"
                          value={formData.messaggio}
                          onChange={handleChange}
                          placeholder="Scrivi qui..."
                          rows={3}
                          maxLength={500}
                          className="w-full p-5 bg-stone-50 rounded-2xl border-2 border-transparent focus:border-brand-sky/20 focus:bg-white focus:ring-0 font-bold text-xs text-brand-stone resize-none transition-all outline-none"
                        />
                        {/* FIX: contatore caratteri sul campo note */}
                        <p className="text-right text-[9px] font-bold text-stone-300 mr-1">
                          {formData.messaggio.length} / 500
                        </p>
                      </div>
                    </div>

                    {/* FIX: errore inline al posto di alert() */}
                    <AnimatePresence>
                      {formError && (
                        <motion.p
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="text-red-500 text-[10px] font-black uppercase text-center bg-red-50 py-3 rounded-xl"
                        >
                          {formError}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-brand-sky hover:bg-[#0284c7] disabled:bg-stone-200 text-white py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-4 transition-all shadow-[0_15px_30px_rgba(14,165,233,0.25)] active:scale-95"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
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
                    className="py-12 text-center"
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
}
