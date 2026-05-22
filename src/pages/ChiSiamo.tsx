// src/pages/ChiSiamo.tsx
//
// ⚠️  TEAM_MEMBERS: aggiorna con nomi, ruoli e filosofie reali delle guide.
//     Le iniziali+colore sono un fallback dignitoso fino a quando
//     non hai foto reali — NON usare stock photos di Unsplash.
//
// ⚠️  Immagini hero/sezioni: sostituisci con URL reali dal tuo bucket Supabase.

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, Send, Star } from "lucide-react";
import Section, { isIOS } from "../components/Section";
import { supabase } from "../lib/supabase";

interface ChiSiamoProps {
  onNavigate: (page: string) => void;
  onBookingClick: (title: string, mode?: "info" | "prenota") => void;
}

// ── Hero keyframes — stesso pattern di Home.tsx ───────────────────────────────
const HERO_KEYFRAMES = `
  @keyframes heroFadeUp {
    from { opacity: 0; transform: translate3d(0, 18px, 0); }
    to   { opacity: 1; }
  }
  @keyframes heroFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
`;

function heroAnim(
  delay: number,
  name: "heroFadeUp" | "heroFadeIn" = "heroFadeUp",
  duration = 0.65
): React.CSSProperties {
  return {
    animation: `${name} ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s both`,
  };
}

// ── ScrollReveal — stesso pattern di Home.tsx ─────────────────────────────────
//
// isIOS → wrapper trasparente (Section gestisce già l'animazione dell'intera sezione).
// Non-iOS → motion.div whileInView.
// Nessuna violazione della regola dei hooks: il ternario si risolve a compile time.
const ScrollReveal = isIOS
  ? ({ children }: { children: React.ReactNode }) => <>{children}</>
  : ({
      children,
      delay = 0,
    }: {
      children: React.ReactNode;
      delay?: number;
    }) => (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, delay, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    );

// ── Design system — ripreso 1:1 dagli altri file ──────────────────────────────
const FILOSOFIA_COLORS: Record<string, string> = {
  "Avventura":             "#e94544",
  "Benessere":             "#a5d9c9",
  "Borghi più belli":      "#946a52",
  "Cammini":               "#e3c45d",
  "Educazione all'aperto": "#01aa9f",
  "Eventi":                "#ffc0cb",
  "Formazione":            "#002f59",
  "Immersi nel verde":     "#358756",
  "Luoghi dello spirito":  "#c8a3c9",
  "Novità":                "#75c43c",
  "Speciali":              "#b8163c",
  "Acqua e cielo":         "#7aaecd",
  "Trek urbano":           "#f39452",
  "Tracce sulla neve":     "#a8cce0",
  "Cielo stellato":        "#1e2855",
};

const FILOSOFIA_EMOJI: Record<string, string> = {
  "Avventura":             "⛰",
  "Benessere":             "🌿",
  "Borghi più belli":      "🏘",
  "Cammini":               "👣",
  "Educazione all'aperto": "🌱",
  "Eventi":                "✨",
  "Formazione":            "📖",
  "Immersi nel verde":     "🌲",
  "Luoghi dello spirito":  "🕊",
  "Novità":                "🔭",
  "Speciali":              "🌟",
  "Acqua e cielo":         "💧",
  "Trek urbano":           "🏙",
  "Tracce sulla neve":     "❄️",
  "Cielo stellato":        "🌠",
};

// Colori che richiedono testo chiaro (troppo scuri per testo scuro)
const DARK_COLORS = new Set(["#002f59", "#946a52", "#b8163c", "#358756", "#1e2855"]);

// ── Team — ⚠️ aggiorna con dati reali ─────────────────────────────────────────
//
// Avatar: iniziali + colore della filosofia di specializzazione.
// Non usare foto stock: un fallback onesto vale più di un volto falso.
// Quando avrai foto reali, aggiungi { foto: "URL" } e rendila nel componente.
const TEAM_MEMBERS = [
  {
    iniziali:  "CC",
    nome:      "Claudio C.",
    ruolo:     "Co-Fondatore & Guida AIGAE",
    filosofia: "Avventura",
    anni:      "10+ anni",
    bio:       "Guida ambientale escursionistica certificata AIGAE. Ha percorso migliaia di km tra Dolomiti e Appennini e ha formato la prima generazione di guide Altour.",
  },
  {
    iniziali:  "GC",
    nome:      "Gloria C.",
    ruolo:     "Social Media",
    filosofia: "Benessere",
    anni:      "8 anni",
    bio:       "Amante della natura, delle avventure e delle grandi storie, ben raccontate.",
  },
  {
    iniziali:  "RS",
    nome:      "Rodolfo S.",
    ruolo:     "Co-Fondatore e Guida AIGAE",
    filosofia: "Cammini",
    anni:      "10+ anni",
    bio:       "Ingegnere nella vita precedente, Guida ambientale escursionistica certificata AIGAE e appassionato di cammini e natura.",
  },
];

// ── Animated counter con easeOutExpo ─────────────────────────────────────────
function useAnimatedCounter(
  target: number,
  duration = 1200,
  active = false
): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active || target === 0) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
      else setValue(target);
    };
    requestAnimationFrame(tick);
  }, [target, duration, active]);
  return value;
}

// ── Componente principale ─────────────────────────────────────────────────────
export default function ChiSiamo({ onNavigate, onBookingClick }: ChiSiamoProps) {
  const [bgAnimDone, setBgAnimDone]       = useState(false);
  const [tesserateCount, setTesserateCount] = useState(0);
  const [escursioniCount, setEscursioniCount] = useState(0);
  const [statsVisible, setStatsVisible]   = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  // Fetch dati reali — fallback ai valori dell'hero di Home in caso di errore
  useEffect(() => {
    async function fetchStats() {
      try {
        const [{ count: t }, { count: e }] = await Promise.all([
          supabase
            .from("tessere")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("escursioni")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true),
        ]);
        setTesserateCount(t ?? 800);
        setEscursioniCount(e ?? 0);
      } catch {
        setTesserateCount(800);
      }
    }
    fetchStats();
  }, []);

  // Avvia i counter quando la sezione entra nel viewport
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const counterTesserate  = useAnimatedCounter(tesserateCount,  1200, statsVisible);
  const counterEscursioni = useAnimatedCounter(escursioniCount, 1000, statsVisible);

  return (
    <div className="min-h-screen bg-[#f5f2ed] overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: HERO_KEYFRAMES }} />

      {/* ── 1. HERO ───────────────────────────────────────────────────────── */}
      {/*
        animate={false}: nessuna Section animation — l'hero usa heroAnim.
        fullHeight: usa --vh di App.tsx per evitare il bug iOS con la barra browser.
      */}
      <Section
        animate={false}
        fullHeight
        as="section"
        className="flex items-center justify-center overflow-hidden"
      >
        {/* Zoom background — will-change rimosso dopo l'animazione */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          onAnimationComplete={() => setBgAnimDone(true)}
          style={{
            willChange:              bgAnimDone ? "auto" : "transform",
            backfaceVisibility:      "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {/* ⚠️ Sostituisci con un'immagine del team in azione */}
          <img
            src="https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Braies.webp"
            className="absolute inset-0 w-full h-full object-cover object-[center_30%]"
            alt="Guide Altour Italy in montagna"
            loading="eager"
            fetchpriority="high"
            decoding="sync"
          />
        </motion.div>

        {/* Overlay scuro + dissolvenza verso il bg della pagina */}
        <div
          className="absolute inset-0 bg-black/45"
          style={heroAnim(0, "heroFadeIn", 1.0)}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-[65%] to-[#f5f2ed]" />

        {/* Contenuto hero */}
        <div className="relative z-10 text-center max-w-3xl w-full px-4 flex flex-col items-center">
          <div style={heroAnim(0.4)} className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/55 mb-5">
              Altour Italy
            </p>
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter drop-shadow-2xl leading-none">
              Chi Siamo
            </h1>
          </div>

          <p
            style={heroAnim(0.7, "heroFadeUp", 0.7)}
            className="text-white/65 text-base md:text-xl font-medium max-w-sm md:max-w-md mx-auto leading-relaxed italic"
          >
            "Non organizziamo gite.<br />
            Costruiamo esperienze."
          </p>
        </div>
      </Section>

      {/* ── 2. MANIFESTO ─────────────────────────────────────────────────── */}
      <Section className="max-w-3xl mx-auto px-4 py-20 md:py-28">
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-1 w-8 bg-brand-sky rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-sky">
              La nostra storia
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9] mb-8">
            Nati dall'amore <br />
            <span className="text-brand-sky italic font-light tracking-normal">
              per la natura.
            </span>
          </h2>
          <div className="space-y-5 text-stone-500 text-base md:text-lg font-medium leading-relaxed">
            <p>
              Altour Italy nasce da un'idea semplice: il territorio italiano è straordinario,
              e troppo spesso lo guardiamo dal finestrino. La nostra filosofia è{" "}
              <strong className="text-brand-stone font-black">osservare
              luoghi unici con occhi diversi</strong>,
              immergersi nella bellezza che ci circonda.
            </p>
            <p>
              In 10 anni abbiamo accompagnato centinaia di persone su sentieri, borghi,
              cammini e vette. Abbiamo costruito un'Accademia per formare nuove guide.
              Abbiamo creato una community di escursionisti che raccolgono scarponi
              come medaglie.
            </p>
            <p>
              Non ci interessano i numeri. Ci interessa che ogni uscita lasci qualcosa:
              una prospettiva nuova, un muscolo allenato, una storia da raccontare.
            </p>
          </div>
        </ScrollReveal>
      </Section>

      {/* ── 3. LE 15 FILOSOFIE ───────────────────────────────────────────── */}
      {/*
        Questa sezione è il cuore identitario della pagina.
        Le filosofie non sono "categorie": sono il modo in cui Altour
        legge il mondo. Spiegarle qui dà contesto a tutto il resto del sito.
      */}
      <Section className="max-w-5xl mx-auto px-4 py-16 md:py-24" delay={0.05}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-14">
          <ScrollReveal>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-1 w-8 bg-brand-sky rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-sky">
                  Le nostre filosofie
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9]">
                15 modi di <br />
                <span className="text-brand-sky italic font-light tracking-normal">
                  vedere il mondo.
                </span>
              </h2>
              <p className="text-stone-400 text-sm font-medium mt-4 max-w-md leading-relaxed">
                Ogni attività appartiene a una filosofia — un modo diverso di stare in natura.
                Non sono categorie: sono identità.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <button
              onClick={() => onNavigate("attivitapage")}
              className="group flex items-center gap-3 text-stone-400 hover:text-brand-sky transition-colors"
            >
              <span className="text-[10px] font-black uppercase tracking-widest">
                Esplora le attività
              </span>
              <div className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center group-hover:border-brand-sky group-hover:bg-brand-sky group-hover:text-white transition-all">
                <ArrowRight size={16} />
              </div>
            </button>
          </ScrollReveal>
        </div>

        {/* Grid filosofie */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 md:gap-3">
          {Object.entries(FILOSOFIA_COLORS).map(([nome, colore], idx) => {
            const isDark = DARK_COLORS.has(colore);
            return (
              <ScrollReveal key={nome} delay={Math.min(idx * 0.04, 0.4)}>
                <motion.button
                  whileHover={{ y: -3, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNavigate("attivitapage")}
                  className="w-full flex flex-col items-center gap-2 p-3 md:p-4 rounded-2xl transition-colors"
                  style={{
                    backgroundColor: `${colore}15`,
                    border:          `1.5px solid ${colore}30`,
                  }}
                >
                  <span className="text-xl md:text-2xl leading-none select-none">
                    {FILOSOFIA_EMOJI[nome]}
                  </span>
                  <span
                    className="text-[8px] md:text-[9px] font-black uppercase tracking-wide leading-tight text-center"
                    style={{ color: isDark ? colore : colore }}
                  >
                    {nome}
                  </span>
                </motion.button>
              </ScrollReveal>
            );
          })}
        </div>
      </Section>

      {/* ── 4. IL TEAM ───────────────────────────────────────────────────── */}
      <Section className="max-w-5xl mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1 w-8 bg-brand-sky rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-sky">
                Le guide e lo Staff
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9]">
              Chi ti porta <br />
              <span className="text-brand-sky italic font-light tracking-normal">
                in cima.
              </span>
            </h2>
          </div>

         
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TEAM_MEMBERS.map((membro, idx) => {
            const color = FILOSOFIA_COLORS[membro.filosofia] ?? "#5aaadd";
            return (
              <ScrollReveal key={membro.nome} delay={idx * 0.1}>
                <div
                  className="bg-white rounded-[2rem] p-7 border border-stone-100 flex flex-col h-full"
                  style={{
                    boxShadow:
                      "0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
                  }}
                >
                  {/* Avatar: iniziali + colore filosofia di specializzazione */}
                  <div className="flex items-start gap-4 mb-5">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-black flex-shrink-0 relative overflow-hidden"
                      style={{ backgroundColor: color }}
                    >
                      {/* Gloss effect */}
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 60%)",
                        }}
                      />
                      <span className="relative z-10 drop-shadow-sm">
                        {membro.iniziali}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-base font-black text-brand-stone uppercase tracking-tight leading-none mb-1">
                        {membro.nome}
                      </h3>
                      <p
                        className="text-[9px] font-black uppercase tracking-wider mb-2 truncate"
                        style={{ color }}
                      >
                        {membro.ruolo}
                      </p>
                    
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-stone-400 leading-relaxed flex-grow font-medium">
                    {membro.bio}
                  </p>

                  {/* Filosofia tag in fondo alla card */}
                  <div
                    className="mt-5 self-start px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest"
                    style={{ backgroundColor: `${color}15`, color }}
                  >
                    {FILOSOFIA_EMOJI[membro.filosofia]} {membro.filosofia}
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </Section>

      {/* ── 5. NUMERI ────────────────────────────────────────────────────── */}
      {/*
        I counter si avviano con IntersectionObserver quando la sezione
        entra nel viewport — nessun timeout arbitrario, nessun jank.
        I valori di tessere e escursioni vengono da Supabase; gli altri
        sono editoriali e vanno aggiornati manualmente.
      */}
      <Section className="max-w-4xl mx-auto px-4 py-12 md:py-20" delay={0.05}>
        <ScrollReveal>
          <div
            ref={statsRef}
            className="bg-white rounded-[2.5rem] p-10 md:p-14 border border-stone-100"
            style={{
              boxShadow:
                "0 0 80px -10px rgba(14,165,233,0.10), 0 25px 50px -12px rgba(0,0,0,0.07)",
            }}
          >
            {/* Intestazione */}
            <div className="text-center mb-10 md:mb-12">
              <div className="flex items-center gap-3 mb-4 justify-center">
                <div className="h-1 w-8 bg-brand-sky rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-sky">
                  In numeri
                </span>
                <div className="h-1 w-8 bg-brand-sky rounded-full" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-brand-stone uppercase tracking-tighter leading-[0.95]">
                10 anni di{" "}
                <span className="text-brand-sky italic font-light tracking-normal">
                  avventure.
                </span>
              </h2>
            </div>

            {/* Griglia stat */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-y-2 md:divide-y-0 md:divide-x-2 divide-stone-50">
              {[
                {
                  value:  "10",
                  suffix: " anni",
                  label:  "Di esperienza",
                  note:   "dal 2015",
                },
                {
                  value:  counterTesserate.toString(),
                  suffix: "+",
                  label:  "Tesserati",
                  note:   "e contando",
                },
                {
                  value:  counterEscursioni.toString(),
                  suffix: "+",
                  label:  "Attività attive",
                  note:   "ogni stagione",
                },
                {
                  value:  "15",
                  suffix: "",
                  label:  "Filosofie",
                  note:   "15 modi di stare in natura",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center text-center px-4 py-6 md:py-0"
                >
                  <p className="text-3xl md:text-4xl font-black text-brand-stone leading-none mb-1 tabular-nums">
                    {stat.value}
                    <span className="text-brand-sky">{stat.suffix}</span>
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-[9px] text-stone-300 font-medium">{stat.note}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </Section>

      {/* ── 6. LA TESSERA ────────────────────────────────────────────────── */}
      {/*
        Stesso pattern card delle sezioni Voucher e Tailor-made in Home.
        Immagine a sinistra, contenuto a destra, gradient di transizione.
        Obiettivo: convertire la curiosità in iscrizione alla community.
      */}
      <Section className="max-w-4xl mx-auto px-4 py-8" delay={0.05}>
        <ScrollReveal>
          <div
            className="bg-white rounded-[2.5rem] overflow-hidden border border-stone-50"
            style={{
              boxShadow:
                "0 0 80px -10px rgba(14,165,233,0.18), 0 0 40px -20px rgba(68,64,60,0.1), 0 25px 50px -12px rgba(0,0,0,0.1)",
            }}
          >
            <div className="flex flex-col md:flex-row min-h-[280px]">
              {/* Immagine sinistra */}
              <div className="w-full md:w-2/5 relative h-52 md:h-auto overflow-hidden">
                <img
                  src="https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20241231_144800.webp"
                  alt="Tessera fedeltà Altour Italy"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-brand-stone/70 to-transparent" />
                <div className="absolute bottom-6 left-8 text-white z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={14} className="text-brand-sky fill-brand-sky" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em]">
                      Passaporto Altour
                    </span>
                  </div>
                  <h3 className="text-2xl font-black uppercase leading-none tracking-tighter italic">
                    Ogni scarpone<br />racconta.
                  </h3>
                </div>
              </div>

              {/* Contenuto destra */}
              <div className="w-full md:w-3/5 p-8 md:p-14 flex flex-col justify-center bg-[#faf9f7]">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-sky mb-3 block">
                  Community
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-brand-stone uppercase tracking-tighter leading-none mb-3">
                  Unisciti alla{" "}
                  <span className="text-brand-sky italic font-light tracking-normal">
                    nostra community.
                  </span>
                </h2>
                <p className="text-stone-500 text-sm font-medium max-w-sm leading-relaxed mb-6">
                  Con la Tessera Altour ogni escursione diventa uno scarpone nel tuo passaporto.
                  Colleziona badge, sblocca voucher, costruisci la tua storia.
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigate("tessera")}
                  className="w-full md:w-auto bg-brand-stone text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-brand-sky transition-colors flex items-center justify-center gap-3"
                >
                  Scopri la Tessera <ArrowRight size={14} />
                </motion.button>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </Section>

      {/* ── 7. CTA FINALE ────────────────────────────────────────────────── */}
      {/*
        Stesso pattern della sezione Tailor-made in Home.
        Due CTA: una verso le attività (scoperta), una verso il booking (conversione).
      */}
      <Section className="max-w-4xl mx-auto px-4 py-8 pb-24" delay={0.05}>
        <ScrollReveal>
          <div
            className="bg-white rounded-[2.5rem] overflow-hidden border border-stone-50"
            style={{
              boxShadow:
                "0 0 80px -10px rgba(14,165,233,0.18), 0 0 40px -20px rgba(68,64,60,0.1), 0 25px 50px -12px rgba(0,0,0,0.1)",
            }}
          >
            <div className="flex flex-col md:flex-row min-h-[260px]">
              {/* Immagine sinistra */}
              <div className="w-full md:w-2/5 relative h-52 md:h-auto overflow-hidden">
                <img
                  src="https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20220904_150458.webp"
                  alt="Dolomiti Altour Italy"
                  className="absolute inset-0 w-full h-full object-cover object-[center_20%]"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-brand-stone/70 to-transparent" />
                <div className="absolute bottom-6 left-8 text-white z-10">
                  <h3 className="text-2xl font-black uppercase leading-none tracking-tighter italic">
                    Inizia la tua<br />avventura.
                  </h3>
                </div>
              </div>

              {/* Contenuto destra */}
              <div className="w-full md:w-3/5 p-8 md:p-14 flex flex-col justify-center bg-[#faf9f7]">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-sky mb-3 block">
                  Inizia ora
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-brand-stone uppercase tracking-tighter leading-none mb-3">
                  Vieni con{" "}
                  <span className="text-brand-sky italic font-light tracking-normal">
                    noi.
                  </span>
                </h2>
                <p className="text-stone-500 text-sm font-medium max-w-sm leading-relaxed mb-7">
                  Esplora le attività in programma o contattaci per progettare
                  un'esperienza su misura per te o per il tuo gruppo.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onNavigate("attivitapage")}
                    className="flex-1 bg-brand-sky text-white px-6 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-[#0284c7] transition-colors flex items-center justify-center gap-2 active:scale-95"
                  >
                    Esplora Attività <ArrowRight size={12} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() =>
                      onBookingClick("Contatto da Chi Siamo", "info")
                    }
                    className="flex-1 bg-brand-stone text-white px-6 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-brand-sky transition-colors flex items-center justify-center gap-2 active:scale-95"
                  >
                    Contattaci <Send size={12} />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </Section>
    </div>
  );
}