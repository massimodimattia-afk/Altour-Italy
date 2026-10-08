// src/pages/GuidaTrekkingLanding.tsx
import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Compass,
  Footprints,
  Map,
  CheckCircle2,
  ArrowRight,
  Send,
  Phone,
  Mail,
  User,
  CloudSun,
  Shirt,
  Backpack,
  LifeBuoy,
  Check,
  Sparkles,
  TicketPercent,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { isIOS } from "../components/Section";

interface LandingProps {
  onNavigateHome?: () => void;
}

const HERO_IMG =
  "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Copertina_guida1.webp";
const AUTORE_IMG =
  "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Lettura_int_carta.webp";

const HIGHLIGHTS = [
  {
    num: "01",
    titolo: "Conosci te stesso",
    desc: "Gestisci nictofobia e paura del vuoto con un metodo graduale, per camminare sicuro anche fuori dalla tua comfort zone.",
    icon: Compass,
    img: "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Capitolo%201.jpeg",
  },
  {
    num: "02",
    titolo: "Scegli l'itinerario",
    desc: "Valuta dislivelli, difficoltà e tempi in base alle tue reali capacità, non a quelle che pensi di avere.",
    icon: Map,
    img: "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Capitolo%202.jpeg",
  },
  {
    num: "03",
    titolo: "Le calzature adatte",
    desc: "Evita vesciche e suole che si staccano a metà sentiero: come scegliere lo scarpone per ogni terreno.",
    icon: Footprints,
    img: "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Capitolo%203.jpeg",
  },
  {
    num: "04",
    titolo: "Vestiti a strati",
    desc: "La tecnica per non avere mai troppo caldo né troppo freddo, proteggendo le zone a maggiore dispersione termica.",
    icon: Shirt,
    img: "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Capitolo%204.jpeg",
  },
  {
    num: "05",
    titolo: "Lo zaino bilanciato",
    desc: "Cosa portare (e cosa lasciare a casa): acqua, kit di primo soccorso e bastoncini, senza appesantirti.",
    icon: Backpack,
    img: "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Capitolo%205.jpeg",
  },
  {
    num: "06",
    titolo: "Occhio al meteo",
    desc: "Come leggere le previsioni e riconoscere i segnali del cielo: in montagna le condizioni cambiano in fretta.",
    icon: CloudSun,
    img: "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Capitolo%206.jfif",
  },
  {
    num: "07",
    titolo: "Lascia detto dove vai",
    desc: "Le informazioni da lasciare prima di partire e i contatti utili, così qualcuno sa sempre dove cercarti.",
    icon: LifeBuoy,
    img: "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Capitolo%207.jpeg",
  },
];

export default function GuidaTrekkingLanding(_props: LandingProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [vuoleWhatsApp, setVuoleWhatsApp] = useState(false);
  const [privacy, setPrivacy] = useState(false);

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
          preferenza_canale: vuoleWhatsApp && telefono.trim() ? "whatsapp" : "email",
          privacy_accettata: true,
          note: "Lista d'attesa - Codice Sconto 48h",
        },
      ]);
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      console.error("Errore salvataggio lead:", err);
      setErrorMsg(
        "Si è verificato un problema durante la registrazione. Riprova tra poco."
      );
    } finally {
      setLoading(false);
    }
  };

  const scrollToForm = () => {
    document
      .getElementById("preorder-form-section")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  // ── Design tokens ──
  const sectionPad = "max-w-5xl mx-auto px-5";
  const inputWrap =
    "peer w-full pl-12 pr-4 py-3.5 bg-white border border-[#b4cca8] rounded-xl text-[16px] md:text-sm font-medium text-[#2c3b24] placeholder-[#8ea483] outline-none focus:border-[#48593d] focus:bg-white focus:ring-4 focus:ring-[#64735b]/15 transition-all shadow-sm";
  const inputLabel =
    "block text-[9px] font-black uppercase tracking-wider text-[#64735b] mb-1.5 ml-1";
  const iconInInput =
    "absolute left-4 top-1/2 -translate-y-1/2 text-[#8ea483] peer-focus:text-[#48593d] transition-colors pointer-events-none z-10";

  return (
    <div className="min-h-[100dvh] w-full max-w-[100vw] bg-[#d6eecf] text-[#2c3b24] overflow-x-hidden antialiased pb-safe selection:bg-[#64735b]/20">
      {/* ── HEADER ── */}
      <nav
        className={`${sectionPad} py-5 md:py-6 flex items-center justify-end gap-3`}
      >
        <button
          onClick={scrollToForm}
          className="shrink-0 px-4 md:px-5 py-2.5 md:py-3 min-h-[42px] rounded-full text-[10px] font-black uppercase tracking-widest text-[#2c3b24] bg-[#64735b]/10 border border-[#64735b]/20 hover:bg-[#2c3b24] hover:text-white transition-all active:scale-95 flex items-center gap-1.5"
        >
          <TicketPercent size={14} />
          Blocca lo Sconto
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className={`${sectionPad} pt-6 pb-12 md:pt-12 md:pb-16`}>
        <div className="grid md:grid-cols-[1.05fr_0.95fr] items-center gap-10 md:gap-14">
          {/* Testo */}
          <div className="order-2 md:order-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#64735b]/15 border border-[#64735b]/20 text-[#2c3b24] text-[9px] font-black uppercase tracking-widest mb-6 shadow-sm">
              <Sparkles size={11} /> Lista d'attesa aperta — Vantaggio esclusivo
            </div>

            <h1 className="text-[2.5rem] sm:text-5xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9] mb-5 md:mb-6 text-[#2c3b24]">
              Le 7 regole d'oro{" "}
              <span className="text-[#64735b] italic font-light tracking-normal">
                prima di partire.
              </span>
            </h1>

            <p className="text-[#64735b] text-[15px] md:text-base font-medium leading-relaxed max-w-lg mx-auto md:mx-0 mb-8">
              La guida pratica di Altour Italy per preparare ogni escursione
              senza improvvisare. Itinerario, scarpe, abbigliamento, zaino e
              meteo: dieci anni di sentieri in sette regole.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 justify-center md:justify-start mb-6">
              <button
                onClick={scrollToForm}
                className="group relative w-full sm:w-auto px-8 py-4 min-h-[52px] rounded-2xl bg-gradient-to-r from-[#48593d] to-[#2c3b24] text-white font-black uppercase tracking-widest text-[11px] hover:from-[#3a4930] hover:to-[#1e2a18] transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#2c3b24]/30 hover:shadow-xl hover:shadow-[#2c3b24]/40 active:scale-[0.98] transform-gpu"
              >
                Entra in lista e blocca lo sconto
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
              <span className="text-[#64735b] text-[10px] font-bold uppercase tracking-wider">
                Nessun vincolo di acquisto
              </span>
            </div>

            {/* Trust signals */}
            <ul className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-[10px] font-bold uppercase tracking-wider text-[#64735b]">
              <li className="flex items-center gap-1.5">
                <Check size={12} className="text-[#48593d]" />
                Codice riservato
              </li>
              <li className="flex items-center gap-1.5">
                <Check size={12} className="text-[#48593d]" />
                Valido 48 ore al lancio
              </li>
              <li className="flex items-center gap-1.5">
                <Check size={12} className="text-[#48593d]" />
                Cancellazione 1 click
              </li>
            </ul>
          </div>

          {/* Hero image */}
          <div className="order-1 md:order-2 w-full max-w-md mx-auto md:max-w-none">
            <motion.div
              initial={{ opacity: 0, y: isIOS ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative rounded-[2rem] overflow-hidden border border-white/40 shadow-[0_20px_50px_rgba(44,59,36,0.15)] transform-gpu"
            >
              <div className="relative w-full pb-[75%]">
                <img
                  src={HERO_IMG}
                  alt="Copertina della guida Le 7 Regole d'Oro di Altour Italy"
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="eager"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1e2a18]/90 via-[#1e2a18]/40 to-transparent p-5 md:p-6">
                <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.25em] mb-1">
                  Vademecum Altour
                </p>
                <h3 className="text-white text-lg md:text-xl font-black uppercase tracking-tight leading-none">
                  Le 7 Regole d'Oro
                </h3>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── I 7 PUNTI ── */}
      <section
        className={`${sectionPad} py-14 md:py-20 border-t border-[#b4cca8]/60`}
      >
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-[#2c3b24] leading-tight">
            Cosa trovi dentro la guida
          </h2>
          <p className="text-[#64735b] text-xs md:text-sm font-medium mt-3 leading-relaxed max-w-md mx-auto">
            Sette capitoli, un aneddoto sul campo per ognuno e le domande
            giuste per capire dove migliorare.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 auto-rows-fr">
          {HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.num}
                className="group bg-white rounded-2xl border border-white shadow-sm overflow-hidden flex flex-col h-full hover:shadow-xl hover:-translate-y-1 hover:border-[#b4cca8] transition-all duration-300"
              >
                <div className="relative w-full pb-[75%] overflow-hidden shrink-0">
                  <img
                    src={item.img}
                    alt={item.titolo}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 w-9 h-9 rounded-xl bg-white/95 backdrop-blur text-[#48593d] flex items-center justify-center shadow-md">
                    <Icon size={17} />
                  </div>
                  <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-[#2c3b24]/80 backdrop-blur text-white text-[10px] font-black font-mono tracking-wider">
                    {item.num}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-sm font-black uppercase tracking-tight text-[#2c3b24] mb-2 min-h-[2.5rem] leading-tight">
                    {item.titolo}
                  </h3>
                  <p className="text-xs text-[#64735b] font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </article>
            );
          })}

          {/* CTA card — Sfondo Scuro */}
          <button
            onClick={scrollToForm}
            className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#48593d] via-[#3a4930] to-[#1e2a18] p-6 flex flex-col items-center justify-center text-center gap-3 shadow-lg shadow-[#2c3b24]/20 hover:shadow-xl hover:shadow-[#2c3b24]/40 hover:-translate-y-1 transition-all duration-300 h-full min-h-[280px] sm:min-h-0"
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 20%, rgba(214,238,207,0.35), transparent 55%), radial-gradient(circle at 80% 80%, rgba(214,238,207,0.2), transparent 50%)",
              }}
            />
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
                <TicketPercent size={24} className="text-[#d6eecf]" />
              </div>
              <span className="text-sm font-black uppercase tracking-wide text-white leading-tight">
                Assicurati il codice
                <br />
                sconto di lancio
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#2c3b24] bg-[#d6eecf] border border-[#d6eecf] rounded-full px-3 py-1.5 group-hover:bg-white group-hover:border-white transition-colors">
                Entra in lista
                <ArrowRight
                  size={11}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* ── AUTORE ── */}
      <section className={`${sectionPad} pb-14 md:pb-20`}>
        <div className="bg-white rounded-[2rem] border border-white shadow-sm overflow-hidden grid md:grid-cols-[280px_1fr]">
          <div className="relative w-full pb-[75%] md:pb-0 md:aspect-auto md:h-full md:min-h-[220px]">
            <img
              src={AUTORE_IMG}
              alt="Guida Ambientale Escursionistica di Altour Italy"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          <div className="p-7 md:p-10 flex flex-col justify-center">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#48593d] mb-3">
              Scritta da chi il sentiero lo vive davvero
            </p>
            <p className="text-[#64735b] text-sm md:text-[15px] font-medium leading-relaxed italic border-l-2 border-[#8ea483] pl-4 mb-4">
              "In natura il rischio zero non esiste. Ogni territorio presenta
              insidie: sta a te non trasformarle in rischi reali."
            </p>
            <p className="text-[#48593d] text-[11px] font-bold uppercase tracking-wide leading-relaxed">
              Guida Ambientale Escursionistica (AIGAE)
              <span className="hidden sm:inline"> — </span>
              <br className="sm:hidden" />
              Istruttore di escursionismo 1° e 2° livello
            </p>
          </div>
        </div>
      </section>

      {/* ── FORM ── */}
      <section
        id="preorder-form-section"
        className="max-w-3xl mx-auto px-5 py-14 md:py-20 scroll-mt-6"
      >
        <div className="bg-white rounded-[2.5rem] border border-white p-6 sm:p-10 md:p-14 shadow-[0_20px_60px_rgba(44,59,36,0.08)] relative overflow-hidden">
          {/* Accent decorativo in alto */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#8ea483] via-[#48593d] to-[#8ea483]" />

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#d6eecf] text-[#2c3b24] flex items-center justify-center mx-auto mb-5 shadow-sm">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-[#2c3b24] mb-2">
                Sei nella lista VIP!
              </h3>
              <p className="text-[#64735b] text-xs md:text-sm font-medium max-w-md mx-auto leading-relaxed mb-6">
                Ottima scelta, <strong>{nome}</strong>. Il giorno del lancio riceverai un'email {vuoleWhatsApp ? "e un messaggio WhatsApp " : ""}con il tuo <strong>codice sconto personale</strong>, valido esclusivamente per le prime 48 ore.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="text-[10px] font-black uppercase tracking-widest text-[#48593d] border-b border-[#48593d]/30 pb-0.5 hover:text-[#2c3b24] hover:border-[#2c3b24] transition-colors"
              >
                Invia un'altra iscrizione
              </button>
            </motion.div>
          ) : (
            <>
              <div className="text-center max-w-lg mx-auto mb-8">
                <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-[#2c3b24] leading-tight">
                  Ricevi il codice sconto
                </h2>
                <p className="text-[#64735b] text-xs md:text-sm font-medium mt-3 leading-relaxed">
                  Il giorno del lancio la guida uscirà per tutti. Ma solo iscrivendoti a questa lista riceverai il tuo <strong className="text-[#2c3b24]">codice sconto riservato, valido solo per 48 ore</strong>. Nessun vincolo di acquisto.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-4 max-w-md mx-auto"
              >
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold leading-snug border border-red-100 flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">⚠️</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div>
                  <label htmlFor="input-nome" className={inputLabel}>
                    Nome e Cognome *
                  </label>
                  <div className="relative">
                    <User size={18} className={iconInInput} strokeWidth={2.2} />
                    <input
                      id="input-nome"
                      type="text"
                      required
                      autoComplete="name"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="es. Mario Rossi"
                      className={inputWrap}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="input-email" className={inputLabel}>
                    Indirizzo Email * (Dove riceverai il codice)
                  </label>
                  <div className="relative">
                    <Mail size={18} className={iconInInput} strokeWidth={2.2} />
                    <input
                      id="input-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="es. mario.rossi@email.it"
                      className={inputWrap}
                    />
                  </div>
                </div>

                {/* Blocco Telefono + Checkbox WhatsApp integrata */}
                <div className="space-y-2.5">
                  <div>
                    <label htmlFor="input-tel" className={inputLabel}>
                      Cellulare (facoltativo)
                    </label>
                    <div className="relative">
                      <Phone size={18} className={iconInInput} strokeWidth={2.2} />
                      <input
                        id="input-tel"
                        type="tel"
                        autoComplete="tel"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="+39 340 1234567"
                        className={inputWrap}
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 ml-1">
                    <input
                      type="checkbox"
                      id="wa-check"
                      checked={vuoleWhatsApp}
                      onChange={(e) => setVuoleWhatsApp(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-[#8ea483] text-[#48593d] focus:ring-2 focus:ring-[#64735b]/30 focus:ring-offset-0 cursor-pointer"
                    />
                    <label
                      htmlFor="wa-check"
                      className="text-[10px] text-[#64735b] font-medium leading-tight cursor-pointer"
                    >
                      Invia il codice segreto e l'avviso anche su WhatsApp
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="privacy-check"
                    checked={privacy}
                    onChange={(e) => setPrivacy(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[#8ea483] text-[#48593d] focus:ring-2 focus:ring-[#64735b]/30 focus:ring-offset-0 cursor-pointer"
                  />
                  <label
                    htmlFor="privacy-check"
                    className="text-[10px] text-[#64735b] font-medium leading-tight cursor-pointer"
                  >
                    Accetto il trattamento dei dati personali unicamente per
                    ricevere comunicazioni sul lancio della guida, nel pieno
                    rispetto del GDPR.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full py-4 min-h-[52px] rounded-xl bg-gradient-to-r from-[#48593d] to-[#2c3b24] text-white font-black uppercase tracking-widest text-[11px] shadow-lg shadow-[#2c3b24]/30 hover:from-[#3a4930] hover:to-[#1e2a18] hover:shadow-xl hover:shadow-[#2c3b24]/40 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 mt-5"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      <span>Registrazione in corso...</span>
                    </>
                  ) : (
                    <>
                      <span>Entra in lista e blocca lo sconto</span>
                      <Send
                        size={14}
                        className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                      />
                    </>
                  )}
                </button>

                <p className="text-center text-[9px] font-bold uppercase tracking-widest text-[#8ea483] pt-1">
                  Zero spam · Zero costi · Cancellazione immediata
                </p>
              </form>
            </>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className={`${sectionPad} py-8 text-center text-[#64735b] text-[10px] font-medium border-t border-[#b4cca8]/50`}
      >
        <p>
          © {new Date().getFullYear()} Altour Italy — Tour alternativi in
          Italia. Tutti i diritti riservati.
        </p>
      </footer>
    </div>
  );
}