import React, { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export default function BookingModal({ isOpen, onClose, title }: BookingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    messaggio: ''
  });

  // Blocca lo scroll del body quando la modale è aperta
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Chiudi con tasto ESC (solo se non sta inviando)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): string | null => {
    if (!formData.nome.trim()) return 'Il nome è obbligatorio';
    if (!formData.email.trim()) return 'L\'email è obbligatoria';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return 'Inserisci un indirizzo email valido';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // Inserimento dati: solo i campi necessari, gli altri hanno default su Supabase
      const { error } = await supabase
        .from('contatti')
        .insert([
          {
            nome: formData.nome.trim(),
            email: formData.email.trim(),
            messaggio: formData.messaggio.trim() || null, // se vuoto → NULL
            attivita: title || 'Attività non specificata'
          }
        ]);

      if (error) throw error;

      // Successo
      setSent(true);
      setFormData({ nome: '', email: '', messaggio: '' });

      // Dopo 3 secondi chiudi la modale
      setTimeout(() => {
        setSent(false);
        onClose();
      }, 3000);
    } catch (error: any) {
      console.error('Errore durante l\'invio:', error);
      // Messaggio amichevole per l'utente
      if (
        error.message?.includes('relation') || 
        error.message?.includes('does not exist') ||
        error.message?.includes('Could not find the table')
      ) {
        alert('⚠️ Problema API: La tabella "contatti" non è accessibile.\n\nPotrebbe essere un problema di CACHE o PERMESSI.\n\nEsegui lo script "fix_permissions.sql" su Supabase per risolvere.');
      } else {
        alert(`Errore: ${error.message || 'Impossibile inviare la richiesta'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-stone/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[3xl] p-8 md:p-12 relative shadow-2xl overflow-hidden border border-white/20">
        {/* Pulsante di chiusura */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-stone-400 hover:text-brand-stone transition-colors"
          disabled={isSubmitting}
          aria-label="Chiudi"
        >
          <X className="w-8 h-8" />
        </button>

        {!sent ? (
          /* Stato modulo di invio */
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black text-brand-stone mb-2 uppercase tracking-tighter">
              Richiedi Info
            </h2>
            <p className="text-stone-500 mb-10 font-medium leading-tight">
              Stai scrivendo per:<br />
              <span className="text-brand-sky font-bold uppercase">{title}</span>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                required
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="IL TUO NOME"
                className="w-full p-5 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-sky font-bold text-xs uppercase tracking-widest text-brand-stone transition-all"
              />

              <input
                required
                name="email"
                value={formData.email}
                onChange={handleChange}
                type="email"
                placeholder="LA TUA EMAIL"
                className="w-full p-5 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-sky font-bold text-xs uppercase tracking-widest text-brand-stone transition-all"
              />

              <textarea
                name="messaggio"
                value={formData.messaggio}
                onChange={handleChange}
                placeholder="MESSAGGIO O DOMANDE (OPZIONALE)"
                rows={4}
                className="w-full p-5 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-brand-sky font-bold text-xs uppercase tracking-widest text-brand-stone resize-none transition-all"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-sky hover:bg-brand-stone disabled:bg-stone-300 text-white py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 transition-all shadow-xl shadow-brand-sky/30 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <span>Invio...</span>
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </>
                ) : (
                  <>
                    <span>Invia Richiesta</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Stato di successo */
          <div className="py-12 text-center animate-in zoom-in duration-500">
            <div className="bg-emerald-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-black text-brand-stone mb-4 uppercase tracking-tighter">
              Ottimo lavoro!
            </h2>
            <p className="text-stone-500 font-medium px-4">
              La tua richiesta è stata inviata. Ti risponderemo a breve!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
