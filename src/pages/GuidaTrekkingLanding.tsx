// src/pages/GuidaTrekkingLanding.tsx
import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Compass,
  ShieldCheck,
  Footprints,
  Map,
  CheckCircle2,
  ArrowRight,
  Send,
  Phone,
  Mail,
  User,
  Clock,
  CloudSun,
  Shirt,
  Backpack,
  LifeBuoy,
  Check,
  Sparkles,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { isIOS } from "../components/Section";

interface LandingProps {
  onNavigateHome?: () => void;
}

const HERO_IMG =
  "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/GPS%20e%20cartografia%20digitale.webp";
const AUTORE_IMG =
  "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Monte%20Autore.webp";

const HIGHLIGHTS = [
  {
    num: "01",
    titolo: "Conosci te stesso",
    desc: "Gestisci nictofobia e paura del vuoto con un metodo graduale, per camminare sicuro anche fuori dalla tua comfort zone.",
    icon: Compass,
    img: "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Corso%20Avanzato.webp",
  },
  {
    num: "02",
    titolo: "Scegli l'itinerario",
    desc: "Valuta dislivelli, difficoltà e tempi in base alle tue reali capacità, non a quelle che pensi di avere.",
    icon: Map,
    img: "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Ex_ferrovia.webp",
  },
  {
    num: "03",
    titolo: "Le calzature adatte",
    desc: "Evita vesciche e suole che si staccano a metà sentiero: come scegliere lo scarpone per ogni terreno.",
    icon: Footprints,
    img: "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Calzature%20e%20cura%20del%20piede.webp",
  },
  {
    num: "04",
    titolo: "Vestiti a strati",
    desc: "La tecnica per non avere mai troppo caldo né troppo freddo, proteggendo le zone a maggiore dispersione termica.",
    icon: Shirt,
    img: "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Attrezzatura%20III.webp",
  },
  {
    num: "05",
    titolo: "Lo zaino bilanciato",
    desc: "Cosa portare (e cosa lasciare a casa): acqua, kit di primo soccorso e bastoncini, senza appesantirti.",
    icon: Backpack,
    img: "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Attrezzatura%20II.webp",
  },
  {
    num: "06",
    titolo: "Occhio al meteo",
    desc: "Come leggere le previsioni e riconoscere i segnali del cielo: in montagna le condizioni cambiano in fretta.",
    icon: CloudSun,
    img: "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Elementi%20di%20Meteorologia.webp",
  },
  {
    num: "07",
    titolo: "Lascia detto dove vai",
    desc: "Le informazioni da lasciare prima di partire e i contatti utili, così qualcuno sa sempre dove cercarti.",
    icon: LifeBuoy,
    img: "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Orientamento%20strumentale%201.webp",
  },
];

export default function GuidaTrekkingLanding({ onNavigateHome }: LandingProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [preferenza, setPreferenza] = useState<"whatsapp" | "email">("whatsapp");
  const [privacy, setPrivacy] = useState(false); // GDPR: opt-in esplicito

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
          note: "Landing /guida-trekking - Le 7 Regole d'Oro",
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
    "peer w-full pl-12 pr-4 py-3.5 bg-stone-50/80 border border-stone-200 rounded-xl text-[16px] md:text-sm font-medium text-brand-stone placeholder-stone-300 outline-none focus:border-brand-sky focus:bg-white focus:ring-4 focus:ring-brand-sky/10 transition-all";
  const inputLabel =
    "block text-[9px] font-black uppercase tracking-wider text-stone-400 mb-1.5 ml-1";
  const iconInInput =
    "absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 peer-focus:text-brand-sky transition-colors pointer-events-none z-10";

  return (
    <div className="min-h-[100dvh] w-full max-w-[100vw] bg-[#f5f2ed] text-brand-stone overflow-x-hidden antialiased pb-safe selection:bg-brand-sky/20">
      {/* ── HEADER ── */}
      <nav
        className={`${sectionPad} py-5 md:py-6 flex items-center justify-between gap-3`}
      >
        <div
          onClick={onNavigateHome}
          className="cursor-pointer flex items-center gap-2.5 group min-w-0"
        >
          <img
            src="/altour-logo.png"
            alt="Altour Italy"
            className="h-8 md:h-9 w-auto object-contain group-hover:scale-105 transition-transform shrink-0"
          />
          <span className="text-[11px] md:text-xs font-black uppercase tracking-[0.25em] text-brand-stone truncate">
            Altour Italy
          </span>
        </div>

        <button
          onClick={scrollToForm}
          className="shrink-0 px-4 md:px-5 py-2.5 md:py-3 min-h-[42px] rounded-full text-[10px] font-black uppercase tracking-widest text-brand-sky bg-brand-sky/10 border border-brand-sky/20 hover:bg-brand-sky hover:text-white transition-all active:scale-95"
        >
          Iscriviti gratis
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className={`${sectionPad} pt-6 pb-12 md:pt-12 md:pb-16`}>
        <div className="grid md:grid-cols-[1.05fr_0.95fr] items-center gap-10 md:gap-14">
          {/* Testo */}
          <div className="order-2 md:order-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-sky/10 border border-brand-sky/20 text-brand-sky text-[9px] font-black uppercase tracking-widest mb-6">
              <Sparkles size={11} /> In arrivo — accesso anticipato gratuito
            </div>

            <h1 className="text-[2.5rem] sm:text-5xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9] mb-5 md:mb-6">
              Le 7 regole d'oro{" "}
              <span className="text-brand-sky italic font-light tracking-normal">
                prima di partire.
              </span>
            </h1>

            <p className="text-stone-500 text-[15px] md:text-base font-medium leading-relaxed max-w-lg mx-auto md:mx-0 mb-8">
              La guida pratica di Altour Italy per preparare ogni escursione
              senza improvvisare. Itinerario, scarpe, abbigliamento, zaino e
              meteo: dieci anni di sentieri in sette regole.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 justify-center md:justify-start mb-6">
              <button
                onClick={scrollToForm}
                className="group relative w-full sm:w-auto px-8 py-4 min-h-[52px] rounded-2xl bg-gradient-to-r from-brand-sky to-sky-600 text-white font-black uppercase tracking-widest text-[11px] hover:from-sky-600 hover:to-sky-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-brand-sky/30 hover:shadow-xl hover:shadow-brand-sky/40 active:scale-[0.98] transform-gpu"
              >
                Riserva il tuo posto
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
              <span className="text-stone-400 text-[10px] font-bold uppercase tracking-wider">
                Nessun pagamento ora
              </span>
            </div>

            {/* Trust signals */}
            <ul className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
              <li className="flex items-center gap-1.5">
                <Check size={12} className="text-emerald-500" />
                Accesso gratuito
              </li>
              <li className="flex items-center gap-1.5">
                <Check size={12} className="text-emerald-500" />
                No spam
              </li>
              <li className="flex items-center gap-1.5">
                <Check size={12} className="text-emerald-500" />
                Cancellazione 1 click
              </li>
            </ul>
          </div>

          {/* Hero image: 4:3 bulletproof con padding-bottom */}
          <div className="order-1 md:order-2 w-full max-w-md mx-auto md:max-w-none">
            <motion.div
              initial={{ opacity: 0, y: isIOS ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative rounded-[2rem] overflow-hidden border border-stone-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.08)] transform-gpu"
            >
              {/* Wrapper 4:3 garantito */}
              <div className="relative w-full pb-[75%]">
                <img
                  src={HERO_IMG}
                  alt="Copertina della guida Le 7 Regole d'Oro di Altour Italy"
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="eager"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5 md:p-6">
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
        className={`${sectionPad} py-14 md:py-20 border-t border-stone-200/60`}
      >
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-brand-stone leading-tight">
            Cosa trovi dentro la guida
          </h2>
          <p className="text-stone-400 text-xs md:text-sm font-medium mt-3 leading-relaxed max-w-md mx-auto">
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
                className="group bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-lg hover:-translate-y-1 hover:border-brand-sky/30 transition-all duration-300"
              >
                {/* Immagine 4:3 bulletproof */}
                <div className="relative w-full pb-[75%] overflow-hidden shrink-0">
                  <img
                    src={item.img}
                    alt={item.titolo}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Icona in alto a sinistra */}
                  <div className="absolute top-3 left-3 w-9 h-9 rounded-xl bg-white/95 backdrop-blur text-brand-sky flex items-center justify-center shadow-md">
                    <Icon size={17} />
                  </div>
                  {/* Numero in basso a destra */}
                  <div className="absolute bottom-3 right-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur text-white text-[10px] font-black font-mono tracking-wider">
                    {item.num}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-sm font-black uppercase tracking-tight text-brand-stone mb-2 min-h-[2.5rem] leading-tight">
                    {item.titolo}
                  </h3>
                  <p className="text-xs text-stone-500 font-medium leading-relaxed line-clamp-3">
                    {item.desc}
                  </p>
                </div>
              </article>
            );
          })}

          {/* CTA card — gradient pieno, molto più attrattivo */}
          <button
            onClick={scrollToForm}
            className="group relative rounded-2xl overflow-hidden bg-gradient-to-br from-brand-sky via-sky-600 to-sky-700 p-6 flex flex-col items-center justify-center text-center gap-3 shadow-lg shadow-brand-sky/30 hover:shadow-xl hover:shadow-brand-sky/50 hover:-translate-y-1 transition-all duration-300 h-full min-h-[280px] sm:min-h-0"
          >
            {/* Pattern decorativo */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 55%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2), transparent 50%)",
              }}
            />
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
                <ShieldCheck size={24} className="text-white" />
              </div>
              <span className="text-sm font-black uppercase tracking-wide text-white leading-tight">
                Vuoi leggerla
                <br />
                per intero?
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white bg-white/15 border border-white/25 rounded-full px-3 py-1.5 group-hover:bg-white group-hover:text-brand-sky transition-colors">
                Riserva ora
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
        <div className="bg-white rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden grid md:grid-cols-[280px_1fr]">
          <div className="relative w-full pb-[75%] md:pb-0 md:aspect-auto md:h-full md:min-h-[220px]">
            <img
              src={AUTORE_IMG}
              alt="Guida Ambientale Escursionistica di Altour Italy"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          <div className="p-7 md:p-10 flex flex-col justify-center">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-brand-sky mb-3">
              Scritta da chi il sentiero lo vive davvero
            </p>
            <p className="text-stone-500 text-sm md:text-[15px] font-medium leading-relaxed italic border-l-2 border-brand-sky pl-4 mb-4">
              "In natura il rischio zero non esiste. Ogni territorio presenta
              insidie: sta a te non trasformarle in rischi reali."
            </p>
            <p className="text-stone-400 text-[11px] font-bold uppercase tracking-wide leading-relaxed">
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
        <div className="bg-white rounded-[2.5rem] border border-stone-200/80 p-6 sm:p-10 md:p-14 shadow-[0_20px_60px_rgba(0,0,0,0.06)] relative overflow-hidden">
          {/* Accent decorativo in alto */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-sky via-sky-400 to-brand-sky" />

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
                Sei in lista!
              </h3>
              <p className="text-stone-500 text-xs md:text-sm font-medium max-w-md mx-auto leading-relaxed mb-6">
                Grazie <strong>{nome}</strong>, abbiamo registrato la tua
                richiesta. Ti scriveremo appena la guida sarà disponibile.
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
                <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-brand-stone leading-tight">
                  Riserva il tuo posto
                </h2>
                <p className="text-stone-400 text-xs font-medium mt-2 leading-relaxed">
                  Iscriviti per ricevere un estratto in anteprima e avere
                  accesso prioritario al lancio, senza alcun impegno.
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
                    Indirizzo Email *
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

                <div>
                  <label htmlFor="input-tel" className={inputLabel}>
                    Telefono / WhatsApp (facoltativo)
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

                <div className="pt-1">
                  <span className={inputLabel}>
                    Come vuoi ricevere l'avviso di uscita?
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPreferenza("whatsapp")}
                      aria-pressed={preferenza === "whatsapp"}
                      className={`py-3 px-3 min-h-[44px] rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all active:scale-[0.98] ${
                        preferenza === "whatsapp"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-500/20"
                          : "border-stone-200 bg-stone-50/40 text-stone-400 hover:border-stone-300"
                      }`}
                    >
                      WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferenza("email")}
                      aria-pressed={preferenza === "email"}
                      className={`py-3 px-3 min-h-[44px] rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all active:scale-[0.98] ${
                        preferenza === "email"
                          ? "border-brand-sky bg-sky-50 text-brand-sky shadow-sm shadow-brand-sky/20"
                          : "border-stone-200 bg-stone-50/40 text-stone-400 hover:border-stone-300"
                      }`}
                    >
                      Email
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="privacy-check"
                    checked={privacy}
                    onChange={(e) => setPrivacy(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-stone-300 text-brand-sky focus:ring-2 focus:ring-brand-sky/30 focus:ring-offset-0 cursor-pointer"
                  />
                  <label
                    htmlFor="privacy-check"
                    className="text-[10px] text-stone-400 font-medium leading-tight cursor-pointer"
                  >
                    Accetto il trattamento dei dati personali unicamente per
                    ricevere informazioni sul lancio della guida, nel pieno
                    rispetto del GDPR.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full py-4 min-h-[52px] rounded-xl bg-gradient-to-r from-brand-sky to-sky-600 text-white font-black uppercase tracking-widest text-[11px] shadow-lg shadow-brand-sky/30 hover:from-sky-600 hover:to-sky-700 hover:shadow-xl hover:shadow-brand-sky/40 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 mt-5"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      <span>Registrazione in corso...</span>
                    </>
                  ) : (
                    <>
                      <span>Riserva il preordine</span>
                      <Send
                        size={14}
                        className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                      />
                    </>
                  )}
                </button>

                <p className="text-center text-[9px] font-bold uppercase tracking-widest text-stone-300 pt-1">
                  Zero spam · Zero costi · Cancellazione immediata
                </p>
              </form>
            </>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className={`${sectionPad} py-8 text-center text-stone-400 text-[10px] font-medium border-t border-stone-200/40`}
      >
        <p>
          © {new Date().getFullYear()} Altour Italy — Tour alternativi in
          Italia. Tutti i diritti riservati.
        </p>
      </footer>
    </div>
  );
}