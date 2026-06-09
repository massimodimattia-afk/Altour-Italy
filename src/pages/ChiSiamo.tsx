// src/pages/ChiSiamo.tsx
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Section, { isIOS } from "../components/Section";
import { supabase } from "../lib/supabase";
import FeedbackCarousel from "../components/FeedbackCarousel";

interface ChiSiamoProps {
  onNavigate: (page: string) => void;
  onBookingClick: (title: string, mode?: "info" | "prenota") => void;
}

// ── Hero keyframes (Ottimizzate per iOS) ─────────────────────────────────────
const HERO_KEYFRAMES = `
  @keyframes heroFadeUp {
    from { opacity: 0; transform: translate3d(0, 18px, 0); }
    to   { opacity: 1; transform: translate3d(0, 0, 0); }
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

// ── ScrollReveal ──────────────────────────────────────────────────────────────
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

// ── Design system ─────────────────────────────────────────────────────────────
const FILOSOFIA_COLORS: Record<string, string> = {
  "Acqua e cielo":         "#7aaecd",
  "Avventura":             "#e94544",
  "Benessere":             "#a5d9c9",
  "Borghi più belli":      "#946a52",
  "Cammini":               "#e3c45d",
  "Cielo stellato":        "#1e2855",
  "Educazione all'aperto": "#01aa9f",
  "Eventi":                "#ffc0cb",
  "Formazione":            "#002f59",
  "Immersi nel verde":     "#358756",
  "Luoghi dello spirito":  "#c8a3c9",
  "Novità":                "#75c43c",
  "Speciali":              "#b8163c",
  "Tracce sulla neve":     "#a8cce0",
  "Trek urbano":           "#f39452",
};

const FILOSOFIA_EMOJI: Record<string, string> = {
  "Acqua e cielo":         "💧",
  "Avventura":             "⛰",
  "Benessere":             "🌿",
  "Borghi più belli":      "🏘",
  "Cammini":               "👣",
  "Cielo stellato":        "🌠",
  "Educazione all'aperto": "🌱",
  "Eventi":                "✨",
  "Formazione":            "📖",
  "Immersi nel verde":     "🌲",
  "Luoghi dello spirito":  "🕊",
  "Novità":                "🔭",
  "Speciali":              "🌟",
  "Tracce sulla neve":     "❄️",
  "Trek urbano":           "🏙",
};

const FILOSOFIA_DESC: Record<string, string> = {
  "Acqua e cielo":         "Lo sguardo che si perde all’orizzonte",
  "Avventura":             "Il brivido di ciò che non ti aspetti",
  "Benessere":             "Sentirsi parte del creato",
  "Borghi più belli":      "Storia, tradizioni e personaggi",
  "Cammini":               "Viaggi per conoscersi",
  "Cielo stellato":        "Meraviglia e stupore nel buio della notte",
  "Educazione all'aperto": "Imparare dalla Natura",
  "Eventi":                "Momenti per conoscersi",
  "Formazione":            "L’umiltà del non sentirsi arrivati",
  "Immersi nel verde":     "La ricchezza della biodiversità",
  "Luoghi dello spirito":  "Per riflettere sul senso della vita",
  "Novità":                "L’emozione della prima volta",
  "Speciali":              "L’unicità delle piccole cose",
  "Tracce sulla neve":     "Paesaggi da fiaba e suoni ovattati",
  "Trek urbano":           "Passeggiare senza fretta",
};

const TEAM_MEMBERS = [
  {
    iniziali:  "CC",
    nome:      "Claudio C.",
    ruolo:     "Co-Fondatore & Guida AIGAE",
    filosofia: "Avventura",
    bio:       "Guida ambientale escursionistica certificata AIGAE. Ha percorso migliaia di km tra Dolomiti e Appennini e ha formato la prima generazione di guide Altour.",
  },
  {
    iniziali:  "GC",
    nome:      "Gloria C.",
    ruolo:     "Social Media",
    filosofia: "Benessere",
    bio:       "Entrepreneur digitale, promotrice del Benessere, amante della natura, delle avventure e delle grandi storie di vita, ben raccontate.",
  },
  {
    iniziali:  "RS",
    nome:      "Rodolfo S.",
    ruolo:     "Co-Fondatore & Guida AIGAE",
    filosofia: "Cammini",
    bio:       "Ingegnere nella vita precedente, Guida ambientale escursionistica certificata AIGAE e appassionato di cammini e natura.",
  },
  {
    iniziali:  "SG",
    nome:      "Simone G.",
    ruolo:     "Staff",
    filosofia: "Tracce sulla neve",
    bio:       "Appassionato di escursioni in natura, Esperto Agente di viaggi nella vita di tutti i giorni, segue le tracce di questa nuova esperienza di Altour.",
  },
   {
    iniziali:  "MD",
    nome:      "Massimo D.",
    ruolo:     "Staff",
    filosofia: "Cielo stellato",
    bio:       "Data Analyst di giorno. Di notte: apprendista lettore di cartine al contrario, eterno curioso ricercatore dello zenit, aspirante smanettone.",
  },  
];

function useAnimatedCounter(target: number, duration = 1200, active = false): number {
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

export default function ChiSiamo({ onNavigate }: ChiSiamoProps) {
  const [bgAnimDone, setBgAnimDone]       = useState(false);
  const [tesserateCount, setTesserateCount] = useState(0);
  const [escursioniCount, setEscursioniCount] = useState(0);
  const [statsVisible, setStatsVisible]   = useState(false);
  
  const [activePhilosophy, setActivePhilosophy] = useState<string>("Avventura");
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [{ count: t }, { count: e }] = await Promise.all([
          supabase.from("tessere").select("*", { count: "exact", head: true }),
          supabase.from("escursioni").select("*", { count: "exact", head: true }).eq("is_active", true),
        ]);
        setTesserateCount(t ?? 800);
        setEscursioniCount(e ?? 0);
      } catch {
        setTesserateCount(800);
      }
    }
    fetchStats();
  }, []);

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
    <div className="min-h-[100dvh] bg-[#f5f2ed] overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: HERO_KEYFRAMES }} />

      {/* ── 1. HERO ───────────────────────────────────────────────────────── */}
      <Section
        animate={false}
        as="section"
        className="relative flex items-center justify-center overflow-hidden min-h-[50vh] md:min-h-[60vh] py-24 md:py-32"
      >
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
            transform: "translateZ(0)",
            WebkitTransform: "translateZ(0)"
          }}
        >
          <img
            src="https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Braies.webp"
            className="absolute inset-0 w-full h-full object-cover object-[center_30%]"
            alt="Guide Altour Italy in montagna"
            loading="eager"
            fetchpriority="high"
            decoding="sync"
          />
        </motion.div>

        <div className="absolute inset-0 bg-black/45 ios-gpu-fix" style={heroAnim(0, "heroFadeIn", 1.0)} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-[65%] to-[#f5f2ed] ios-gpu-fix" />

        <div className="relative z-10 text-center max-w-3xl w-full px-4 flex flex-col items-center mt-8">
          <div style={heroAnim(0.4)} className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/55 mb-3">
              Altour Italy
            </p>
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter drop-shadow-2xl leading-none ios-gpu-fix">
              Chi Siamo
            </h1>
          </div>

          <p
            style={heroAnim(0.7, "heroFadeUp", 0.7)}
            className="text-white/65 text-base md:text-xl font-medium max-w-sm md:max-w-md mx-auto leading-relaxed italic mt-2"
          >
            "Non organizziamo gite.<br />
            Viviamo esperienze uniche."
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
              per la nostra terra.
            </span>
          </h2>
          <div className="space-y-5 text-stone-500 text-base md:text-lg font-medium leading-relaxed">
            <p>
              Siamo partiti da un’idea semplice: Far conoscere l’Italia a chi si senta viaggiatore e non turista! 
              Ecco, quindi, il nome: <strong className="text-brand-stone font-black">Altour Italy</strong> cioè <em>Tour alternativi in Italia</em>. 
              Esperienze da condividere in piccoli gruppi accompagnati da esperte Guide Ambientali Escursionistiche che si prenderanno cura di te e ti faranno conoscere un'altra Italia, più genuina e meno turistica.
            </p>
            <p>
              Voci originali fuori dal coro, le nostre proposte, passo dopo passo ti faranno visitare luoghi unici con occhi diversi. 
              Ci consideriamo “artigiani” che confezionano un abito su misura, una parentesi spensierata, una coccola da regalarsi in un clima di amicizia, serenità e rispetto.
            </p>
            <p>
              Negli ultimi 10 anni abbiamo accompagnato centinaia di persone, abbiamo costruito un'Accademia per formare nuove guide, abbiamo creato una community di persone appassionate che raccolgono scarponi come medaglie.
            </p>
            <p>
              Non ci interessano le performance e le sfide contro il tempo. 
              Ci interessa che ogni esperienza ci arricchisca, ci faccia tornare a casa più sereni, ci regali una storia da raccontare e un’immagine da condividere così che il tempo passato insieme sia ricco di significati.
            </p>
          </div>
        </ScrollReveal>
      </Section>

      {/* ── 3. LE 15 FILOSOFIE (Interactive Showcase) ────────────────────── */}
      <Section className="max-w-5xl mx-auto px-4 py-16 md:py-24" delay={0.05}>
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
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
            </div>
            <p className="text-stone-400 text-sm font-medium max-w-sm leading-relaxed mb-1">
              Ogni attività appartiene a una filosofia — un modo diverso di sentirsi vivi. Seleziona un'identità per scoprirla.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 mb-10">
            {Object.entries(FILOSOFIA_COLORS).map(([nome, colore]) => {
              const isActive = activePhilosophy === nome;
              return (
                <button
                  key={nome}
                  onClick={() => setActivePhilosophy(nome)}
                  className={`px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 outline-none ios-gpu-fix ${
                    isActive 
                      ? "shadow-md scale-[1.02]" 
                      : "bg-white text-stone-400 hover:bg-stone-50 border border-stone-200"
                  }`}
                  style={{
                    backgroundColor: isActive ? colore : undefined,
                    color: isActive ? "#ffffff" : undefined,
                    borderColor: isActive ? colore : undefined,
                  }}
                >
                  <span className="text-sm leading-none">{FILOSOFIA_EMOJI[nome]}</span>
                  {nome}
                </button>
              );
            })}
          </div>

          <div 
            className="bg-white rounded-[2rem] p-6 md:p-8 border border-stone-50 min-h-[180px] flex items-center relative overflow-hidden transition-all duration-500 max-w-4xl mx-auto ios-gpu-fix"
            style={{
              boxShadow: `0 10px 40px -10px ${FILOSOFIA_COLORS[activePhilosophy]}20`,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activePhilosophy}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col sm:flex-row items-center sm:items-start gap-5 md:gap-8 text-center sm:text-left w-full z-10"
              >
                <div 
                  className="w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] flex items-center justify-center text-4xl md:text-5xl flex-shrink-0 transition-colors"
                  style={{ backgroundColor: `${FILOSOFIA_COLORS[activePhilosophy]}15` }}
                >
                  {FILOSOFIA_EMOJI[activePhilosophy]}
                </div>
                
                <div className="flex-1 pt-1 md:pt-2">
                  <span 
                    className="text-[9px] font-black uppercase tracking-[0.3em] mb-2 block"
                    style={{ color: FILOSOFIA_COLORS[activePhilosophy] }}
                  >
                    Identità Altour
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-brand-stone mb-2 leading-none">
                    {activePhilosophy}
                  </h3>
                  <p className="text-stone-500 text-sm md:text-base font-medium leading-relaxed mb-5 italic max-w-lg mx-auto sm:mx-0">
                    "{FILOSOFIA_DESC[activePhilosophy]}"
                  </p>
                  
                  <button
                    onClick={() => onNavigate("attivitapage")}
                    className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 px-5 py-2.5 rounded-xl ios-gpu-fix"
                    style={{ 
                      backgroundColor: `${FILOSOFIA_COLORS[activePhilosophy]}15`,
                      color: FILOSOFIA_COLORS[activePhilosophy] 
                    }}
                  >
                    Esplora attività <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="absolute -bottom-8 -right-8 text-[160px] opacity-[0.04] pointer-events-none select-none blur-[2px] rotate-12 transition-all ios-gpu-fix">
              {FILOSOFIA_EMOJI[activePhilosophy]}
            </div>
          </div>
        </ScrollReveal>
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
                  className="bg-white rounded-[2.5rem] p-7 border border-stone-100 flex flex-col h-full ios-gpu-fix"
                  style={{
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
                  }}
                >
                  <div className="flex items-start gap-4 mb-5">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-black flex-shrink-0 relative overflow-hidden ios-gpu-fix"
                      style={{ backgroundColor: color }}
                    >
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 60%)",
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
                      <p className="text-[9px] font-black uppercase tracking-wider mb-2 truncate" style={{ color }}>
                        {membro.ruolo}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-stone-400 leading-relaxed flex-grow font-medium">
                    {membro.bio}
                  </p>

                  <div
                    className="mt-5 self-start px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest"
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
      <Section className="max-w-4xl mx-auto px-4 py-12 md:py-20" delay={0.05}>
        <ScrollReveal>
          <div
            ref={statsRef}
            className="bg-white rounded-[3rem] p-10 md:p-14 border border-stone-100 ios-gpu-fix"
            style={{
              boxShadow: "0 0 80px -10px rgba(14,165,233,0.10), 0 25px 50px -12px rgba(0,0,0,0.07)",
            }}
          >
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-y-2 md:divide-y-0 md:divide-x-2 divide-stone-50">
              {[
                { value: "10", suffix: " anni", label: "Di esperienza", note: "dal 2015" },
                { value: counterTesserate.toString(), suffix: "+", label: "Tesserati", note: "e contando" },
                { value: counterEscursioni.toString(), suffix: "+", label: "Attività attive", note: "ogni stagione" },
                { value: "15", suffix: "", label: "Filosofie", note: "15 modi di stare in natura" },
              ].map((stat, i) => (
                <div key={i} className="flex flex-col items-center justify-center text-center px-4 py-6 md:py-0">
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

      {/* ── 6. FEEDBACK UTENTI (Sostituisce i vecchi box) ───────────────── */}
      <FeedbackCarousel />

    </div>
  );
}