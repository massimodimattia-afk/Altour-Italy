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
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { isIOS } from "../components/Section";

interface LandingProps {
  onNavigateHome?: () => void;
}

/**
 * NOTE IMMAGINI
 * Sostituisci questi path con foto reali (tue o della guida): scatti sul
 * sentiero, dettagli di scarponi/zaino, cielo in quota, ecc. Foto vere
 * di Altour convertono molto meglio di icone o stock generici.
 * Dimensioni consigliate: hero 1200x1500px, card 600x450px, tutte in .webp.
 */
const HERO_IMG = "/images/guida-trekking/hero-copertina.webp";
const AUTORE_IMG = "/images/guida-trekking/guida-in-natura.webp";

const HIGHLIGHTS = [
  {
    num: "01",
    titolo: "Conosci te stesso",
    desc: "Gestisci nictofobia e paura del vuoto con un metodo graduale, così cammini con più sicurezza anche fuori dalla tua comfort zone.",
    icon: Compass,
    img: "/images/guida-trekking/01-conosci-te-stesso.webp",
  },
  {
    num: "02",
    titolo: "Scegli l'itinerario giusto",
    desc: "Valuta dislivelli, difficoltà e tempi di percorrenza in base alle tue reali capacità, non a quelle che pensi di avere.",
    icon: Map,
    img: "/images/guida-trekking/02-itinerario.webp",
  },
  {
    num: "03",
    titolo: "Le calzature adatte",
    desc: "Evita vesciche e suole che si staccano a metà sentiero: come scegliere lo scarpone giusto per ogni terreno.",
    icon: Footprints,
    img: "/images/guida-trekking/03-calzature.webp",
  },
  {
    num: "04",
    titolo: "Vestiti a strati",
    desc: "La tecnica per non avere mai né troppo caldo né troppo freddo, proteggendo le zone a maggiore dispersione termica.",
    icon: Shirt,
    img: "/images/guida-trekking/04-abbigliamento.webp",
  },
  {
    num: "05",
    titolo: "Lo zaino bilanciato",
    desc: "Cosa portare (e cosa lasciare a casa): acqua, kit di primo soccorso e bastoncini, senza appesantirti inutilmente.",
    icon: Backpack,
    img: "/images/guida-trekking/05-zaino.webp",
  },
  {
    num: "06",
    titolo: "Occhio al meteo",
    desc: "Come leggere le previsioni e riconoscere i segnali del cielo, perché in montagna le condizioni cambiano in fretta.",
    icon: CloudSun,
    img: "/images/guida-trekking/06-meteo.webp",
  },
  {
    num: "07",
    titolo: "Lascia detto dove vai",
    desc: "Le informazioni da lasciare prima di partire e i contatti utili, così in caso di imprevisto qualcuno sa dove cercarti.",
    icon: LifeBuoy,
    img: "/images/guida-trekking/07-sicurezza.webp",
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
          note: "Landing /guida-trekking - Le 7 Regole d'Oro",
        },
      ]);

      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      console.error("Errore salvataggio lead:", err);
      setErrorMsg("Si è verificato un problema durante la registrazione. Riprova tra poco.");
    } finally {
      setLoading(false);
    }
  };

  const scrollToForm = () => {
    document.getElementById("preorder-form-section")?.scrollIntoView({ behavior: "smooth" });
  };

  // Classi riutilizzate per coerenza e per ridurre la duplicazione nel markup
  const inputWrap =
    "w-full pl-11 pr-4 py-3.5 bg-stone-50/70 border border-stone-200 rounded-xl text-[16px] md:text-sm font-medium text-brand-stone placeholder-stone-300 outline-none focus:border-brand-sky focus:bg-white transition-all";
  const inputLabel = "block text-[9px] font-black uppercase tracking-wider text-stone-400 mb-1.5 ml-1";
  const iconInInput = "absolute left-4 top-1/2 -translate-y-1/2 text-stone-400";

  return (
    <div className="min-h-[100dvh] w-full max-w-[100vw] bg-[#f5f2ed] text-brand-stone overflow-x-hidden antialiased pb-safe selection:bg-brand-sky/20">
      {/* ── HEADER ── */}
      <nav className="w-full max-w-5xl mx-auto px-5 py-6 flex items-center justify-between">
        <div onClick={onNavigateHome} className="cursor-pointer flex items-center gap-2.5 group">
          <img
            src="/altour-logo.png"
            alt="Altour Italy"
            className="h-8 md:h-9 w-auto object-contain group-hover:scale-105 transition-transform"
          />
          <span className="text-xs font-black uppercase tracking-[0.25em] text-brand-stone">Altour Italy</span>
        </div>

        <button
          onClick={scrollToForm}
          className="px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white border border-stone-200 hover:border-brand-sky hover:text-brand-sky transition-all active:scale-95 shadow-sm"
        >
          Iscriviti alla lista
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-5xl mx-auto px-5 pt-8 pb-16 md:pt-14 md:pb-20 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-sky/10 border border-brand-sky/20 text-brand-sky text-[9px] font-black uppercase tracking-widest mb-6">
            <Clock size={11} /> In arrivo — accesso anticipato gratuito
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter leading-[0.92] mb-6">
            Le 7 regole d'oro <br />
            <span className="text-brand-sky italic font-light tracking-normal">prima di partire.</span>
          </h1>

          <p className="text-stone-500 text-sm md:text-base font-medium leading-relaxed max-w-xl mx-auto md:mx-0 mb-8">
            La guida pratica di Altour Italy per preparare ogni escursione senza
            improvvisare: itinerario, scarpe, abbigliamento, zaino e meteo,
            spiegati con l'esperienza di oltre dieci anni di accompagnamento sui
            sentieri italiani.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
            <button
              onClick={scrollToForm}
              className="w-full sm:w-auto px-8 py-4 min-h-[48px] rounded-2xl bg-brand-sky text-white font-black uppercase tracking-widest text-[10px] hover:bg-[#0284c7] transition-colors flex items-center justify-center gap-3 shadow-lg shadow-brand-sky/25 active:scale-95 transform-gpu"
            >
              Riserva il tuo posto <ArrowRight size={14} />
            </button>
            <span className="text-stone-400 text-[10px] font-bold uppercase tracking-wider">
              Nessun pagamento richiesto ora
            </span>
          </div>
        </div>

        {/* Copertina della guida: sostituire con una foto reale della copertina/di un'escursione */}
        <div className="w-full max-w-sm flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, y: isIOS ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative mx-auto rounded-[2rem] overflow-hidden border border-stone-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.08)] transform-gpu"
          >
            <img
              src={HERO_IMG}
              alt="Copertina della guida Le 7 Regole d'Oro di Altour Italy, escursionista su un sentiero italiano"
              className="w-full aspect-[3/4] object-cover"
              loading="eager"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent p-6">
              <p className="text-white text-[10px] font-black uppercase tracking-[0.25em] mb-1">
                Vademecum Altour
              </p>
              <h3 className="text-white text-xl font-black uppercase tracking-tight leading-none">
                Le 7 Regole d'Oro
              </h3>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── I 7 PUNTI DELLA GUIDA ── */}
      <section className="max-w-5xl mx-auto px-5 py-16 border-t border-stone-200/60">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-brand-stone leading-tight">
            Cosa trovi dentro la guida
          </h2>
          <p className="text-stone-400 text-xs md:text-sm font-medium mt-3 leading-relaxed">
            Sette capitoli, un aneddoto vissuto sul campo per ognuno e le
            domande giuste per capire dove migliorare prima della prossima
            uscita.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.num}
                className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="relative aspect-[4/3]">
                  <img
                    src={item.img}
                    alt={item.titolo}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-white/90 backdrop-blur text-brand-sky flex items-center justify-center shadow-sm">
                    <Icon size={16} />
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-[10px] font-black text-stone-300 font-mono mb-1">
                    {item.num}
                  </span>
                  <h3 className="text-sm font-black uppercase tracking-tight text-brand-stone mb-2">
                    {item.titolo}
                  </h3>
                  <p className="text-xs text-stone-400 font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Card conclusiva: chiude la griglia (7 punti + 1 CTA = 8) e riporta all'azione */}
          <button
            onClick={scrollToForm}
            className="rounded-2xl border-2 border-dashed border-brand-sky/30 bg-sky-50/40 p-5 flex flex-col items-center justify-center text-center gap-2 hover:bg-sky-50 transition-colors min-h-[220px]"
          >
            <ShieldCheck size={22} className="text-brand-sky" />
            <span className="text-xs font-black uppercase tracking-wide text-brand-stone">
              Vuoi leggerla per intero?
            </span>
            <span className="text-[10px] font-bold text-brand-sky underline underline-offset-2">
              Riserva il tuo posto
            </span>
          </button>
        </div>
      </section>

      {/* ── AUTORE / CREDIBILITÀ ── */}
      <section className="max-w-5xl mx-auto px-5 py-4 md:py-8">
        <div className="bg-white rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
          <img
            src={AUTORE_IMG}
            alt="Guida Ambientale Escursionistica di Altour Italy durante un'escursione"
            loading="lazy"
            className="w-full md:w-64 h-48 md:h-auto object-cover"
          />
          <div className="p-7 md:p-8 flex flex-col justify-center">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-brand-sky mb-2">
              Scritta da chi il sentiero lo vive davvero
            </p>
            <p className="text-stone-500 text-sm font-medium leading-relaxed italic border-l-2 border-brand-sky pl-3 mb-3">
              "In natura il rischio zero non esiste. Ogni territorio presenta
              insidie: sta a te non trasformarle in rischi reali."
            </p>
            <p className="text-stone-400 text-xs font-bold uppercase tracking-wide">
              Guida Ambientale Escursionistica (AIGAE) — Istruttore di
              escursionismo 1° e 2° livello
            </p>
          </div>
        </div>
      </section>

      {/* ── FORM DI PREORDINE ── */}
      <section id="preorder-form-section" className="max-w-3xl mx-auto px-5 py-16 md:py-20">
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

              <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold leading-snug border border-red-100">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className={inputLabel}>Nome e Cognome *</label>
                  <div className="relative">
                    <User size={16} className={iconInInput} />
                    <input
                      type="text"
                      required
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="es. Mario Rossi"
                      className={inputWrap}
                    />
                  </div>
                </div>

                <div>
                  <label className={inputLabel}>Indirizzo Email *</label>
                  <div className="relative">
                    <Mail size={16} className={iconInInput} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="es. mario.rossi@email.it"
                      className={inputWrap}
                    />
                  </div>
                </div>

                <div>
                  <label className={inputLabel}>Telefono / WhatsApp (facoltativo)</label>
                  <div className="relative">
                    <Phone size={16} className={iconInInput} />
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+39 340 1234567"
                      className={inputWrap}
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <span className={inputLabel}>Come vuoi ricevere l'avviso di uscita?</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPreferenza("whatsapp")}
                      aria-pressed={preferenza === "whatsapp"}
                      className={`py-2.5 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${
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
                      aria-pressed={preferenza === "email"}
                      className={`py-2.5 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all ${
                        preferenza === "email"
                          ? "border-brand-sky bg-sky-50/60 text-brand-sky"
                          : "border-stone-200 bg-stone-50/40 text-stone-400"
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
                    className="mt-0.5 rounded border-stone-300 text-brand-sky focus:ring-brand-sky cursor-pointer"
                  />
                  <label htmlFor="privacy-check" className="text-[10px] text-stone-400 font-medium leading-tight cursor-pointer">
                    Accetto il trattamento dei dati personali unicamente per
                    ricevere informazioni sul lancio della guida, nel pieno
                    rispetto del GDPR.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 min-h-[48px] rounded-xl bg-brand-sky text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-sky/25 hover:bg-[#0284c7] transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 mt-4"
                >
                  {loading ? (
                    <span>Registrazione in corso...</span>
                  ) : (
                    <>
                      <span>Riserva il preordine</span>
                      <Send size={13} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="w-full max-w-5xl mx-auto px-5 py-8 text-center text-stone-400 text-[10px] font-medium border-t border-stone-200/40">
        <p>© {new Date().getFullYear()} Altour Italy — Tour alternativi in Italia. Tutti i diritti riservati.</p>
      </footer>
    </div>
  );
}