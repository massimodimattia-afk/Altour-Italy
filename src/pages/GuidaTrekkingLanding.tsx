// src/pages/GuidaTrekkingLanding.tsx
import React, { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { 
  Compass, 
  ShieldCheck, 
  Footprints, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Send, 
  Phone, 
  Mail, 
  User, 
  Clock, 
  ChevronRight,
  Flame,
  Award
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { isIOS } from "../components/Section";

interface LandingProps {
  onNavigateHome?: () => void;
}

const HIGHLIGHTS = [
  {
    num: "01",
    titolo: "Conosci Te Stesso",
    desc: "Gestione di nictofobia e acrofobia, consapevolezza dei propri limiti e ascolto del corpo sul sentiero.",
    icon: Compass,
  },
  {
    num: "02",
    titolo: "Scelta dell'Itinerario",
    desc: "Valutazione dei dislivelli, orientamento su carta topografica e il principio della riserva di energie.",
    icon: Footprints,
  },
  {
    num: "03",
    titolo: "Calzature e Piedi",
    desc: "Come evitare calvari: il test della mezza misura in più, le pedule giuste e la prevenzione del distacco suole.",
    icon: ShieldCheck,
  },
  {
    num: "04",
    titolo: "Termoregolazione e Strati",
    desc: "La tecnica del vestirsi a strati, partire 'a pilu rittu' e proteggere le zone a massima dispersione termica.",
    icon: Flame,
  },
  {
    num: "05",
    titolo: "Lo Zaino Bilanciato",
    desc: "Gestione del carico, bilanciamento del peso delle borracce, kit di primo soccorso e bastoncini.",
    icon: BookOpen,
  },
  {
    num: "06",
    titolo: "Meteo e Lettura del Cielo",
    desc: "Evoluzione rapida delle condizioni in quota, interpretazione dei bollettini e buon senso sul campo.",
    icon: Sparkles,
  },
  {
    num: "07",
    titolo: "Sicurezza e Tracciabilità",
    desc: "Cosa lasciare scritto prima di partire, vie di fuga pianificate e numeri di emergenza territoriali.",
    icon: Award,
  },
];

export default function GuidaTrekkingLanding({ onNavigateHome }: LandingProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [preferenza, setPreferenza] = useState<"whatsapp" | "email">("whatsapp");
  const [privacy, setPrivacy] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nome.trim() || !email.trim()) {
      setErrorMsg("Nome ed Email sono obbligatori.");
      return;
    }

    if (!privacy) {
      setErrorMsg("È necessario accettare l'informativa sulla privacy.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("preorders_guida").insert([
        {
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          telefono: telefono.trim() || null,
          preferenza_canale: preferenza,
          privacy_accettata: true,
          note: "Landing /guida-trekking1 - Le 7 Regole d'Oro"
        }
      ]);

      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      console.error("Errore salvataggio lead:", err);
      setErrorMsg("Si è verificato un problema durante la registrazione. Riprova tra poco.");
    } finally {
      setLoading(false);
    }
  };

  const scrollToForm = () => {
    document.getElementById("preorder-form-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-[100vw] bg-[#f5f2ed] text-brand-stone overflow-x-hidden antialiased pb-safe selection:bg-brand-sky/20">
      
      {/* ── HEADER MINIMAL ── */}
      <nav className="w-full max-w-5xl mx-auto px-5 py-6 flex items-center justify-between">
        <div 
          onClick={onNavigateHome}
          className="cursor-pointer flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-xl bg-brand-stone text-white flex items-center justify-center font-black text-xs group-hover:bg-brand-sky transition-colors">
            A
          </div>
          <span className="text-xs font-black uppercase tracking-[0.25em] text-brand-stone">Altour Italy</span>
        </div>

        <button
          onClick={scrollToForm}
          className="px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white border border-stone-200 hover:border-brand-sky hover:text-brand-sky transition-all active:scale-95 shadow-sm"
        >
          Unisciti alla Lista
        </button>
      </nav>

      {/* ── HERO SECTION ── */}
      <section className="max-w-5xl mx-auto px-5 pt-8 pb-16 md:pt-14 md:pb-24 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 text-center md:text-left">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-sky/10 border border-brand-sky/20 text-brand-sky text-[9px] font-black uppercase tracking-widest mb-6">
            <Sparkles size={11} /> Anteprima Esclusiva & Preordine
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter leading-[0.92] mb-6">
            Le 7 regole d'oro <br />
            <span className="text-brand-sky italic font-light tracking-normal">prima di partire.</span>
          </h1>

          <p className="text-stone-500 text-sm md:text-base font-medium leading-relaxed max-w-xl mx-auto md:mx-0 mb-8">
            Non un freddo manuale di nozioni, ma il distillato di oltre 10 anni di accompagnamento e formazione escursionistica sui sentieri più autentici d'Italia[cite: 1]. Domande introspettive, imprevisti reali e trucchi di mestiere per non trovarti mai impreparato[cite: 1].
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
            <button
              onClick={scrollToForm}
              className="w-full sm:w-auto px-8 py-4 min-h-[48px] rounded-2xl bg-brand-stone text-white font-black uppercase tracking-widest text-[10px] hover:bg-brand-sky transition-colors flex items-center justify-center gap-3 shadow-xl active:scale-95 transform-gpu"
            >
              Riserva il tuo Posto in Anteprima <ArrowRight size={14} />
            </button>
            <div className="flex items-center gap-2 text-stone-400 text-[10px] font-bold uppercase tracking-wider">
              <Clock size={12} className="text-brand-sky" /> Uscita imminente
            </div>
          </div>
        </div>

        {/* Mockup Copertina Vademecum */}
        <div className="w-full max-w-sm flex-shrink-0">
          <motion.div 
            initial={{ opacity: 0, y: isIOS ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative mx-auto rounded-[2.5rem] bg-white p-7 border border-stone-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.08)] transform-gpu hover:-translate-y-1 transition-transform"
          >
            <div className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-stone-900 via-stone-800 to-brand-stone p-6 flex flex-col justify-between text-white relative overflow-hidden shadow-inner">
              <div className="absolute -top-12 -right-12 w-44 h-44 bg-brand-sky/20 rounded-full blur-2xl pointer-events-none" />
              
              <div>
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-brand-sky block mb-2">Vademecum Altour</span>
                <h3 className="text-2xl font-black uppercase tracking-tight leading-none">
                  Le 7 Regole <br />
                  <span className="text-brand-sky italic font-light">d'Oro</span>
                </h3>
              </div>

              <div className="my-auto py-6">
                <p className="text-[11px] text-white/70 italic font-medium leading-relaxed border-l-2 border-brand-sky/60 pl-3">
                  "In natura il rischio zero non esiste. Ogni territorio presenta insidie: sta a te non trasformarle in rischi reali."[cite: 1]
                </p>
              </div>

              <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-wider text-white/50">A cura di</p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-white">Guida AIGAE & Istruttore[cite: 1]</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs">
                  👣
                </div>
              </div>
            </div>

            <div className="mt-5 text-center">
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-stone-400">Guida Tascabile & Digitale</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── COSA TROVERAI DENTRO (I 7 PUNTI) ── */}
      <section className="max-w-5xl mx-auto px-5 py-16 border-t border-stone-200/60">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-sky mb-2">Struttura della Guida</p>
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-brand-stone leading-tight">
            I 7 Passi della Consapevolezza <br className="hidden sm:block" />
            <span className="text-brand-sky italic font-light">sul Sentiero.</span>
          </h2>
          <p className="text-stone-400 text-xs md:text-sm font-medium mt-3 leading-relaxed">
            Ogni capitolo combina aneddoti sul campo, domande provocatorie per testare la tua prontezza e indicazioni tecniche applicabili da subito[cite: 1].
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.num}
                className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-black text-stone-300 font-mono">{item.num}</span>
                    <div className="w-9 h-9 rounded-xl bg-sky-50 text-brand-sky flex items-center justify-center">
                      <Icon size={18} />
                    </div>
                  </div>
                  <h3 className="text-base font-black uppercase tracking-tight text-brand-stone mb-2">
                    {item.titolo}
                  </h3>
                  <p className="text-xs text-stone-400 font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Card speciale "Perché questa guida" */}
          <div className="bg-gradient-to-br from-brand-stone to-stone-900 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between md:col-span-2 lg:col-span-2">
            <div>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-sky block mb-2">Valore Pratico</span>
              <h3 className="text-lg md:text-xl font-black uppercase tracking-tight mb-3">
                Non la solita teoria da manuale da salotto[cite: 1].
              </h3>
              <p className="text-stone-300 text-xs leading-relaxed font-medium">
                Dall'incontro ravvicinato con i cinghiali a Subiaco[cite: 1], alla borraccia vuota sul Picco di Circe[cite: 1], fino alle suole scollate nel canyon del Parco d'Abruzzo[cite: 1]: situazioni concrete vissute in prima persona per imparare dagli errori altrui prima di fare i propri[cite: 1].
              </p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-brand-sky text-[10px] font-black uppercase tracking-widest">
              <span>Pensata per chi viaggia a passo lento</span> <ChevronRight size={14} />
            </div>
          </div>
        </div>
      </section>

      {/* ── IL FORM PREORDER / LEAD CAPTURE ── */}
      <section id="preorder-form-section" className="max-w-3xl mx-auto px-5 py-16 md:py-24">
        <div className="bg-white rounded-[2.5rem] border border-stone-200/80 p-8 md:p-14 shadow-[0_20px_60px_rgba(0,0,0,0.06)] relative overflow-hidden">
          
          {success ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-brand-stone mb-2">
                Sei in Lista Prioritaria!
              </h3>
              <p className="text-stone-500 text-xs md:text-sm font-medium max-w-md mx-auto leading-relaxed mb-6">
                Grazie <strong>{nome}</strong>. Abbiamo registrato il tuo interesse. Ti contatteremo in anteprima non appena la guida sarà rilasciata ufficialmente.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="text-[10px] font-black uppercase tracking-widest text-brand-sky border-b border-brand-sky/30 pb-0.5 hover:text-brand-stone transition-colors"
              >
                Invia un'altra richiesta
              </button>
            </motion.div>
          ) : (
            <>
              <div className="text-center max-w-lg mx-auto mb-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-500 text-[8px] font-black uppercase tracking-widest mb-3">
                  <Sparkles size={10} className="text-brand-sky" /> Nessun Pagamento Richiesto
                </div>
                <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-brand-stone leading-tight">
                  Accedi al Preordine <br />
                  <span className="text-brand-sky italic font-light">senza impegno.</span>
                </h2>
                <p className="text-stone-400 text-xs font-medium mt-2 leading-relaxed">
                  Iscriviti per ricevere l'estratto introduttivo in anteprima e garantirti la prelazione al lancio.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold leading-snug border border-red-100">
                    {errorMsg}
                  </div>
                )}

                {/* Nome */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-stone-400 mb-1.5 ml-1">
                    Nome e Cognome *
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="es. Mario Rossi"
                      className="w-full pl-11 pr-4 py-3.5 bg-stone-50/70 border border-stone-200 rounded-xl text-[16px] md:text-sm font-medium text-brand-stone placeholder-stone-300 outline-none focus:border-brand-sky focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-stone-400 mb-1.5 ml-1">
                    Indirizzo Email *
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="es. mario.rossi@email.it"
                      className="w-full pl-11 pr-4 py-3.5 bg-stone-50/70 border border-stone-200 rounded-xl text-[16px] md:text-sm font-medium text-brand-stone placeholder-stone-300 outline-none focus:border-brand-sky focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Telefono / WhatsApp */}
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-stone-400 mb-1.5 ml-1">
                    Telefono / WhatsApp (per avviso di sblocco)
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+39 340 1234567"
                      className="w-full pl-11 pr-4 py-3.5 bg-stone-50/70 border border-stone-200 rounded-xl text-[16px] md:text-sm font-medium text-brand-stone placeholder-stone-300 outline-none focus:border-brand-sky focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Preferenza Canale */}
                <div className="pt-1">
                  <span className="block text-[9px] font-black uppercase tracking-wider text-stone-400 mb-2 ml-1">
                    Come preferisci ricevere l'avviso di uscita?
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPreferenza("whatsapp")}
                      className={`py-2.5 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                        preferenza === "whatsapp"
                          ? "border-emerald-500 bg-emerald-50/60 text-emerald-800"
                          : "border-stone-200 bg-stone-50/40 text-stone-400"
                      }`}
                    >
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferenza("email")}
                      className={`py-2.5 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                        preferenza === "email"
                          ? "border-brand-sky bg-sky-50/60 text-brand-sky"
                          : "border-stone-200 bg-stone-50/40 text-stone-400"
                      }`}
                    >
                      Email
                    </button>
                  </div>
                </div>

                {/* Privacy Checkbox */}
                <div className="pt-2 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="privacy-check"
                    checked={privacy}
                    onChange={(e) => setPrivacy(e.target.checked)}
                    className="mt-0.5 rounded border-stone-300 text-brand-sky focus:ring-brand-sky cursor-pointer"
                  />
                  <label htmlFor="privacy-check" className="text-[10px] text-stone-400 font-medium leading-tight cursor-pointer">
                    Accetto il trattamento dei dati personali unicamente per ricevere informazioni sul lancio della guida, nel pieno rispetto del GDPR.
                  </label>
                </div>

                {/* CTA Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 min-h-[48px] rounded-xl bg-brand-stone text-white font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-brand-sky transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-4"
                >
                  {loading ? (
                    <span>Registrazione in corso...</span>
                  ) : (
                    <>
                      <span>Riserva il Preordine</span>
                      <Send size={13} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

        </div>
      </section>

      {/* ── FOOTER MINIMAL ── */}
      <footer className="w-full max-w-5xl mx-auto px-5 py-8 text-center text-stone-400 text-[10px] font-medium border-t border-stone-200/40">
        <p>© {new Date().getFullYear()} Altour Italy — Tour alternativi in Italia. Tutti i diritti riservati.</p>
      </footer>

    </div>
  );
}