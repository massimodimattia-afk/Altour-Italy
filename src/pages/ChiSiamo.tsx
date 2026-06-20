// src/pages/ChiSiamo.tsx
import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Gift, Star, TrendingUp, Send } from "lucide-react";
import Section, { isIOS } from "../components/Section";

interface ChiSiamoProps {
  onNavigate: (page: string) => void;
  onBookingClick: (title: string, mode?: "info" | "prenota") => void;
}

const PRESET_VOUCHERS = [
  { amount: 60,  tag: "Top",     highlight: true  },
  { amount: 100, tag: null,      highlight: false },
  { amount: 200, tag: "Premium", highlight: false },
];

function heroAnim(
  delay: number,
  name: "heroFadeUp" | "heroFadeIn" = "heroFadeUp",
  duration = 0.6
): React.CSSProperties {
  return {
    animation: `${name} ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s both`,
    willChange: "transform, opacity",
  };
}

const ScrollReveal = isIOS
  ? ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>
  : ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.05 }}
        transition={{ duration: 0.4, delay, ease: "easeOut" }}
        className={className}
      >
        {children}
      </motion.div>
    );

const FILOSOFIA_COLORS: Record<string, string> = {
  "Acqua e cielo":         "#7aaecd", "Avventura":             "#e94544",
  "Benessere":             "#a5d9c9", "Borghi più belli":      "#946a52",
  "Cammini":               "#e3c45d", "Cielo stellato":        "#1e2855",
  "Educazione all'aperto": "#01aa9f", "Eventi":                "#ffc0cb",
  "Formazione":            "#002f59", "Immersi nel verde":     "#358756",
  "Luoghi dello spirito":  "#c8a3c9", "Novità":                "#75c43c",
  "Speciali":              "#b8163c", "Tracce sulla neve":     "#a8cce0",
  "Trek urbano":           "#f39452",
};

const FILOSOFIA_EMOJI: Record<string, string> = {
  "Acqua e cielo":         "💧", "Avventura":             "⛰", "Benessere":             "🌿",
  "Borghi più belli":      "🏘", "Cammini":               "👣", "Cielo stellato":        "🌠",
  "Educazione all'aperto": "🌱", "Eventi":                "✨", "Formazione":            "📖",
  "Immersi nel verde":     "🌲", "Luoghi dello spirito":  "🕊", "Novità":                "🔭",
  "Speciali":              "🌟", "Tracce sulla neve":     "❄️", "Trek urbano":           "🏙",
};

const FILOSOFIA_DESC: Record<string, string> = {
  "Acqua e cielo":         "Lo sguardo che si perde all'orizzonte",
  "Avventura":             "Il brivido di ciò che non ti aspetti",
  "Benessere":             "Sentirsi parte del creato",
  "Borghi più belli":      "Storia, tradizioni e personaggi",
  "Cammini":               "Viaggi per conoscersi",
  "Cielo stellato":        "Meraviglia e stupore nel buio della notte",
  "Educazione all'aperto": "Imparare dalla Natura",
  "Eventi":                "Momenti per conoscersi",
  "Formazione":            "L'umiltà del non sentirsi arrivati",
  "Immersi nel verde":     "La ricchezza della biodiversità",
  "Luoghi dello spirito":  "Per riflettere sul senso della vita",
  "Novità":                "L'emozione della prima volta",
  "Speciali":              "L'unicità delle piccole cose",
  "Tracce sulla neve":     "Paesaggi da fiaba e suoni ovattati",
  "Trek urbano":           "Passeggiare senza fretta",
};

const TEAM_MEMBERS = [
  { iniziali: "CC", immagine: "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/avatars/avatars/313cf930-636d-409a-b95d-ee964766381a.jpg", nome: "Claudio C.", ruolo: "Co-Fondatore & Guida AIGAE", filosofia: "Avventura", bio: "Guida ambientale escursionistica certificata AIGAE. Ha percorso migliaia di km tra Dolomiti e Appennini." },
  { iniziali: "GC", immagine: "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/avatars/avatars/d371fc77-3431-4725-a0b7-562f9a675a09.jpg", nome: "Gloria C.", ruolo: "Social Media", filosofia: "Benessere", bio: "Entrepreneur digitale, amante della natura, delle avventure e delle grandi storie di vita, ben raccontate." },
  { iniziali: "RS", immagine: "", nome: "Rodolfo S.", ruolo: "Co-Fondatore & Guida AIGAE", filosofia: "Cammini", bio: "Ingegnere nella vita precedente, Guida ambientale escursionistica certificata AIGAE e appassionato di cammini." },
  { iniziali: "SG", immagine: "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/avatars/avatars/Grogri.webp", nome: "Simone G.", ruolo: "Staff", filosofia: "Tracce sulla neve", bio: "Appassionato di escursioni in natura, Esperto Agente di viaggi, segue le tracce di questa nuova esperienza." },
  { iniziali: "MD", immagine: "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/avatars/avatars/9107b017-7321-47f4-bc5a-6aa5214ec3aa.jpg", nome: "Massimo D.", ruolo: "Staff", filosofia: "Cielo stellato", bio: "Data Analyst di giorno. Di notte: apprendista lettore di cartine al contrario, eterno curioso ricercatore dello zenit." },
  { iniziali: "LM", immagine: "", nome: "Lorenzo M.", ruolo: "Web Copywriter", filosofia: "Trek urbano", bio: "Scrive storie di passi, scorci urbani e itinerari alternativi nascosti nelle pieghe delle città." },
];

function PhilosophyPanel({ activePhilosophy, onNavigate }: { activePhilosophy: string; onNavigate: (page: string) => void }) {
  const color = FILOSOFIA_COLORS[activePhilosophy];
  const emoji = FILOSOFIA_EMOJI[activePhilosophy];
  const desc  = FILOSOFIA_DESC[activePhilosophy];

  const inner = (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 md:gap-8 text-center sm:text-left w-full z-10 transform-gpu">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] flex items-center justify-center text-4xl md:text-5xl flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
        {emoji}
      </div>
      <div className="flex-1 pt-1">
        <span className="text-[9px] font-black uppercase tracking-[0.3em] mb-2 block" style={{ color }}>Identità Altour</span>
        <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-brand-stone mb-2 leading-none">{activePhilosophy}</h3>
        <p className="text-stone-500 text-sm md:text-base font-medium leading-relaxed mb-5 italic max-w-lg mx-auto sm:mx-0">"{desc}"</p>
        <button onClick={() => onNavigate("attivitapage")} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform px-5 py-3 rounded-xl min-h-[44px]" style={{ backgroundColor: `${color}15`, color }}>
          Esplora attività <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );

  if (isIOS) return <div className="w-full">{inner}</div>;

  return (
    <motion.div key={activePhilosophy} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="w-full">
      {inner}
    </motion.div>
  );
}

function TeamCardInner({ membro, color }: { membro: (typeof TEAM_MEMBERS)[number]; color: string }) {
  return (
    <>
      <div className="flex items-start gap-4 mb-4">
        {/* FALLBACK INTELLIGENTE: Se l'immagine si rompe, scompare svelando le iniziali sotto! */}
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-black flex-shrink-0 relative overflow-hidden bg-stone-100" style={{ backgroundColor: color }}>
          
          {/* Base: Le iniziali colorate sono SEMPRE disegnate */}
          <div className="absolute inset-0 opacity-20 z-0" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 60%)" }} />
          <span className="relative z-0">{membro.iniziali}</span>
          
          {/* Sopra: L'immagine copre le iniziali. Se fallisce, diventa invisibile. */}
          {membro.immagine && (
            <img 
              src={membro.immagine} 
              alt={membro.nome} 
              className="absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-300 bg-white" 
              loading="lazy" 
              decoding="async"
              onError={(e) => {
                // Se l'immagine non viene trovata o è bloccata, la rendiamo trasparente!
                e.currentTarget.style.opacity = '0';
              }} 
            />
          )}
        </div>
        
        <div className="min-w-0 flex-1 pt-1">
          <h3 className="text-base font-black text-brand-stone uppercase tracking-tight leading-none mb-1">{membro.nome}</h3>
          <p className="text-[9px] font-black uppercase tracking-wider" style={{ color }}>{membro.ruolo}</p>
        </div>
      </div>
      <p className="text-xs text-stone-400 leading-relaxed flex-grow font-medium">{membro.bio}</p>
      <div className="mt-4 self-start px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest" style={{ backgroundColor: `${color}15`, color }}>
        {FILOSOFIA_EMOJI[membro.filosofia]} {membro.filosofia}
      </div>
    </>
  );
}

export default function ChiSiamo({ onNavigate, onBookingClick }: ChiSiamoProps) {
  const [activePhilosophy, setActivePhilosophy] = useState<string>("Avventura");

  const handlePhilosophyClick = useCallback((nome: string) => {
    setActivePhilosophy(nome);
  }, []);

  const activeColor = FILOSOFIA_COLORS[activePhilosophy];

  return (
    // FIX ANTI-WOBBLE: Aggiunti w-full max-w-[100vw]
    <div className="min-h-[100dvh] w-full max-w-[100vw] bg-[#f5f2ed] overflow-x-hidden antialiased selection:bg-brand-sky/20">

      {/* ─── 1. HERO ───────────────────── */}
      <Section animate={false} as="section" className="relative flex items-center justify-center overflow-hidden min-h-[45vh] md:min-h-[60vh]">
        <div className="absolute inset-0 transform-gpu scale-100">
          <picture>
            <source media="(max-width: 768px)" srcSet="https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Braies.webp" /> 
            <img
              src="https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Braies.webp"
              className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
              alt="Guide Altour Italy in montagna"
              loading="eager"
              fetchPriority="high"
              decoding="sync"
            />
          </picture>
        </div>
        <div className="absolute inset-0 bg-black/45 ios-gpu-fix" style={heroAnim(0, "heroFadeIn", 1.0)} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-[65%] to-[#f5f2ed] ios-gpu-fix" />

        <div className="relative z-10 text-center max-w-3xl w-full px-4 flex flex-col items-center" style={{ paddingTop: "max(2rem, env(safe-area-inset-top))" }}>
          <div style={heroAnim(0.4)} className="mb-4 ios-gpu-fix">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/55 mb-3">Altour Italy</p>
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">Chi Siamo</h1>
          </div>
          <p style={heroAnim(0.7, "heroFadeUp", 0.7)} className="text-white/65 text-base md:text-xl font-medium max-w-sm md:max-w-md mx-auto leading-relaxed italic mt-2 ios-gpu-fix">
            "Non organizziamo gite.<br />Viviamo esperienze uniche."
          </p>
        </div>
      </Section>

      {/* ─── 2. MANIFESTO ───────────────────── */}
      <Section className="max-w-3xl mx-auto px-5 py-20 md:py-28">
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-1 w-8 bg-brand-sky rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-sky">La nostra storia</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9] mb-8">
            Nati dall'amore <br />
            <span className="text-brand-sky italic font-light tracking-normal">per la nostra terra.</span>
          </h2>
          <div className="space-y-5 text-stone-500 text-base md:text-lg font-medium leading-relaxed">
            <p>
              Siamo partiti da un'idea semplice: far conoscere l'Italia a chi si senta viaggiatore e non turista!
              Ecco, quindi, il nome: <strong className="text-brand-stone font-black">Altour Italy</strong> cioè <em>Tour alternativi in Italia</em>.
              Esperienze da condividere in piccoli gruppi accompagnati da esperte Guide Ambientali Escursionistiche che si prenderanno
              cura di te e ti faranno conoscere un'altra Italia, più genuina e meno turistica.
            </p>
            <p>
              Voci originali fuori dal coro, le nostre proposte, passo dopo passo ti faranno visitare luoghi unici con occhi diversi.
              Ci consideriamo "artigiani" che confezionano un abito su misura, una parentesi spensierata, una coccola da regalarsi in
              un clima di amicizia, serenità e rispetto.
            </p>
            <p>
              Negli ultimi 10 anni abbiamo accompagnato centinaia di persone, abbiamo costruito un'Accademia per formare nuove guide,
              abbiamo creato una community di persone appassionate che raccolgono scarponi come medaglie.
            </p>
            <p>
              Non ci interessano le performance e le sfide contro il tempo. Ci interessa che ogni esperienza ci arricchisca, ci faccia
              tornare a casa più sereni, ci regali una storia da raccontare e un'immagine da condividere così che il tempo passato
              insieme sia ricco di significati.
            </p>
          </div>
        </ScrollReveal>
      </Section>

      {/* ─── 3. LE 15 FILOSOFIE (Layout Flex Wrap confermato) ───────────────────── */}
      <Section className="max-w-5xl mx-auto px-5 py-12 md:py-20">
        <ScrollReveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-1 w-6 bg-brand-sky rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-sky">Le nostre filosofie</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter leading-[0.95]">
                15 modi di <br /><span className="text-brand-sky italic font-light tracking-normal">vedere il mondo.</span>
              </h2>
            </div>
            <p className="text-stone-400 text-xs md:text-sm font-medium max-w-xs leading-relaxed">
              Ogni attività appartiene a una filosofia. Seleziona un'identità per scoprirla.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:gap-2.5 mb-8 transform-gpu">
            {Object.entries(FILOSOFIA_COLORS).map(([nome, colore]) => {
              const isActive = activePhilosophy === nome;
              return (
                <button
                  key={nome}
                  onClick={() => handlePhilosophyClick(nome)}
                  className={`px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 outline-none transition-all duration-150 active:scale-95 shrink-0 min-h-[40px] ${
                    isActive ? "shadow-sm" : "bg-white text-stone-400 border border-stone-200 hover:border-stone-300"
                  }`}
                  style={{
                    backgroundColor: isActive ? colore : undefined,
                    color: isActive ? "#ffffff" : undefined,
                    borderColor: isActive ? colore : undefined,
                  }}
                >
                  <span className="text-xs leading-none">{FILOSOFIA_EMOJI[nome]}</span>
                  {nome}
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-[1.75rem] p-6 md:p-8 border border-stone-100 min-h-[160px] flex items-center relative overflow-hidden transform-gpu" style={{ boxShadow: `0 12px 30px -15px ${activeColor}25` }}>
            <AnimatePresence mode="wait">
              <PhilosophyPanel key={activePhilosophy} activePhilosophy={activePhilosophy} onNavigate={onNavigate} />
            </AnimatePresence>
            <div className="absolute -bottom-6 -right-6 text-[130px] opacity-[0.03] pointer-events-none select-none blur-[1px] rotate-12">
              {FILOSOFIA_EMOJI[activePhilosophy]}
            </div>
          </div>
        </ScrollReveal>
      </Section>

      {/* ─── 4. IL TEAM (Layout Griglia Verticale confermato) ───────────────────── */}
      <Section className="max-w-5xl mx-auto px-5 py-12 md:py-20">
        <div className="mb-8 md:mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-1 w-6 bg-brand-sky rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-sky">Le guide e lo Staff</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter leading-[0.95]">
            Chi ti porta <br /><span className="text-brand-sky italic font-light tracking-normal">in cima.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {TEAM_MEMBERS.map((membro, idx) => {
            const color = FILOSOFIA_COLORS[membro.filosofia] ?? "#5aaadd";
            return (
              <ScrollReveal key={membro.nome} delay={isIOS ? 0 : idx * 0.05} className="h-full">
                <div 
                  className="bg-white rounded-[2rem] p-5 md:p-6 border border-stone-100 flex flex-col h-full transform-gpu transition-all duration-300 hover:shadow-md md:hover:-translate-y-0.5"
                  style={{ boxShadow: isIOS ? "0 4px 16px rgba(0,0,0,0.02)" : undefined }}
                >
                  <TeamCardInner membro={membro} color={color} />
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </Section>

      {/* ─── 5. GIFT EXPERIENCE ───────────────────── */}
      <Section className="max-w-4xl mx-auto px-4 py-12 md:py-16" delay={0.05}>
        <ScrollReveal>
          <div className="bg-white rounded-[2.5rem] overflow-hidden border border-stone-50 transform-gpu" style={{ boxShadow: "0 0 80px -10px rgba(14,165,233,0.18), 0 0 40px -20px rgba(68,64,60,0.1), 0 25px 50px -12px rgba(0,0,0,0.1)" }}>
            <div className="flex flex-col md:flex-row min-h-[360px]">
              <div className="w-full md:w-2/5 relative h-48 md:h-auto overflow-hidden">
                <img src="https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20241231_144800.webp" alt="Paesaggio innevato" className="absolute inset-0 w-full h-full object-cover object-center" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-brand-stone/70 to-transparent" />
                <div className="absolute bottom-6 left-8 text-white z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={14} className="text-brand-sky fill-brand-sky" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em]">Gift Experience</span>
                  </div>
                  <h3 className="text-2xl font-black uppercase leading-none tracking-tighter italic">Regala un'<br />avventura.</h3>
                </div>
              </div>
              <div className="w-full md:w-3/5 p-8 md:p-14 flex flex-col justify-center bg-[#faf9f7]">
                <p className="text-stone-500 text-sm font-medium leading-relaxed mb-6">Un'emozione da regalare a chi ami — utilizzabile per ogni tipo di esperienza Altour.</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-4">Scegli l'importo</p>
                <div className="grid grid-cols-3 gap-2.5 mb-5">
                  {PRESET_VOUCHERS.map(({ amount, tag, highlight }) => (
                    <motion.button key={amount} whileHover={{ y: -2, scale: 1.04 }} whileTap={{ scale: 0.95 }} onClick={() => onBookingClick(`Voucher Regalo da ${amount}€`)} className={`relative flex flex-col items-center justify-center py-4 rounded-xl font-black transition-colors border-2 transform-gpu ${highlight ? "border-brand-sky bg-brand-sky text-white shadow-md shadow-sky-100" : "border-stone-200 bg-white text-brand-stone hover:border-brand-sky hover:text-brand-sky"}`}>
                      <span className="text-base font-black leading-none">{amount}€</span>
                      {tag && <span className={`text-[7px] font-black uppercase tracking-wider mt-1 ${highlight ? "text-white/75" : "text-stone-400"}`}>{tag}</span>}
                    </motion.button>
                  ))}
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-stone-200" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-stone-300">oppure</span>
                  <div className="flex-1 h-px bg-stone-200" />
                </div>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => onBookingClick("Richiesta Gift Voucher Personalizzato")} className="w-full bg-brand-stone text-white py-4 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg hover:bg-brand-sky transition-colors flex items-center justify-center gap-2 transform-gpu">
                  <Gift size={12} /> Importo personalizzato
                </motion.button>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </Section>

      {/* ─── 6. PROGETTI PERSONALIZZATI ───────────────────── */}
      <Section className="max-w-4xl mx-auto px-4 pb-24 md:pb-32" delay={0.05}>
        <ScrollReveal>
          <div className="bg-white rounded-[2.5rem] overflow-hidden border border-stone-50 transform-gpu" style={{ boxShadow: "0 0 80px -10px rgba(14,165,233,0.18), 0 0 40px -20px rgba(68,64,60,0.1), 0 25px 50px -12px rgba(0,0,0,0.1)" }}>
            <div className="flex flex-col md:flex-row min-h-[280px]">
              <div className="w-full md:w-2/5 relative h-48 md:h-auto overflow-hidden">
                <img src="https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Box_avventura.webp" alt="Escursione personalizzata" className="absolute inset-0 w-full h-full object-cover object-[center_30%]" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-brand-stone/70 to-transparent" />
                <div className="absolute bottom-6 left-8 text-white z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={14} className="text-brand-sky" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em]">Progetti Personalizzati</span>
                  </div>
                  <h3 className="text-2xl font-black uppercase leading-none tracking-tighter italic">Su misura, <br /> per te.</h3>
                </div>
              </div>
              <div className="w-full md:w-3/5 p-10 md:p-14 flex flex-col justify-center bg-[#faf9f7]">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-sky mb-3 block">Progetti Personalizzati</span>
                <h2 className="text-2xl md:text-3xl font-black text-brand-stone uppercase tracking-tighter leading-none mb-3">Avventura <span className="text-brand-sky italic font-light tracking-normal">su misura.</span></h2>
                <p className="text-stone-500 text-sm font-medium max-w-sm leading-relaxed mb-8">Hai un'idea specifica? Progettiamo tour privati e team building tracciando la rotta insieme a te.</p>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => onBookingClick("Esperienza su Misura", "info")} className="w-full md:w-auto bg-brand-stone text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-brand-sky transition-colors flex items-center justify-center gap-3 transform-gpu">
                  Contattaci <Send size={14} />
                </motion.button>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </Section>

    </div>
  );
}