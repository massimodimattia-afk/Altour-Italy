import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RotateCcw, ArrowRight } from "lucide-react";

type Level = "base" | "intermedio" | "avanzato";

interface Item {
  id: string;
  emoji: string;
  label: string;
  level: Level;
  col: number;
  row: number;
}

interface Profile {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  nudge: string;
  icon: string;
  accent: string;
  recommendedLevel: Level;
}

const ITEMS: Item[] = [
  // Base — col 1
  { id: "map",      emoji: "🗺️", label: "Cartina",    level: "base",       col: 1, row: 1 },
  { id: "bag",      emoji: "🎒", label: "Zaino",       level: "base",       col: 1, row: 2 },
  { id: "poles",    emoji: "🥢", label: "Bastoncini",  level: "base",       col: 1, row: 3 },
  // Intermedio — col 2 e 3 sopra e sotto lo zaino
  { id: "compass",  emoji: "🧭", label: "Bussola",     level: "intermedio", col: 2, row: 1 },
  { id: "altimeter",emoji: "⏱️", label: "Altimetro",   level: "intermedio", col: 3, row: 1 },
  { id: "medkit",   emoji: "🩹", label: "Kit 1° soc.", level: "intermedio", col: 2, row: 3 },
  // Avanzato — col 4
  { id: "jacket",   emoji: "🧥", label: "Guscio",      level: "avanzato",   col: 4, row: 1 },
  { id: "torch",    emoji: "🔦", label: "Frontale",    level: "avanzato",   col: 4, row: 2 },
  { id: "gloves",   emoji: "🧤", label: "Guanti",      level: "avanzato",   col: 4, row: 3 },
];

const LEVEL_META: Record<Level, { label: string; color: string }> = {
  base:       { label: "Base",       color: "#81ccb0" },
  intermedio: { label: "Intermedio", color: "#5aaadd" },
  avanzato:   { label: "Avanzato",   color: "#9f8270" },
};

const PROFILES: Record<string, Profile> = {
  base: {
    id: "base",
    name: "Il Principiante Pronto",
    subtitle: "Curioso · Motivato · In partenza",
    description: "Hai l'equipaggiamento giusto per muovere i primi passi. La montagna ti aspetta — e tu sei più pronto di quanto pensi.",
    nudge: "Il tuo prossimo passo sono i corsi base.",
    icon: "🗺️", accent: "#81ccb0", recommendedLevel: "base",
  },
  intermedio: {
    id: "intermedio",
    name: "L'Escursionista Formato",
    subtitle: "Consapevole · Autonomo · Preciso",
    description: "Sai orientarti e gestire l'imprevisto. Hai le fondamenta solide — ora è il momento di alzare l'asticella.",
    nudge: "Il tuo prossimo passo sono i corsi intermedi.",
    icon: "🧭", accent: "#5aaadd", recommendedLevel: "intermedio",
  },
  avanzato: {
    id: "avanzato",
    name: "L'Alpinista Compiuto",
    subtitle: "Esperto · Tecnico · Pronto a guidare",
    description: "Il tuo kit parla da solo: sei pronto per le condizioni più impegnative. Il passo successivo è la formazione avanzata.",
    nudge: "Il tuo prossimo passo sono i corsi avanzati.",
    icon: "🧥", accent: "#9f8270", recommendedLevel: "avanzato",
  },
  gap: {
    id: "gap",
    name: "L'Esploratore con il Gap",
    subtitle: "Ambizioso · Coraggioso · Da consolidare",
    description: "Hai entusiasmo e visione, ma nel tuo zaino mancano gli strumenti del mezzo. Costruisci prima le fondamenta.",
    nudge: "Parti dai corsi intermedi per colmare il gap.",
    icon: "🧭", accent: "#f4d98c", recommendedLevel: "intermedio",
  },
  transizione_base: {
    id: "transizione_base",
    name: "Il Trekker in Crescita",
    subtitle: "In transizione · Determinato · Curioso",
    description: "Stai costruendo un kit serio. Hai le basi e inizi a guardare oltre — è il momento giusto per il salto di livello.",
    nudge: "Consolida con i corsi intermedi.",
    icon: "🧭", accent: "#5aaadd", recommendedLevel: "intermedio",
  },
  transizione_avanzato: {
    id: "transizione_avanzato",
    name: "L'Alpinista in Divenire",
    subtitle: "Tecnico · Ambizioso · Quasi pronto",
    description: "Il tuo kit mescola tecnica e audacia. Hai quasi tutto ciò che serve — manca solo il passo formale.",
    nudge: "Completa con i corsi avanzati.",
    icon: "🧥", accent: "#9f8270", recommendedLevel: "avanzato",
  },
  completo: {
    id: "completo",
    name: "L'Escursionista Completo",
    subtitle: "Versatile · Equilibrato · Pronto a tutto",
    description: "Il tuo zaino racconta di chi non si ferma a un solo livello. Hai la visione d'insieme.",
    nudge: "Sei pronto per un percorso formativo integrato.",
    icon: "⛰️", accent: "#5aaadd", recommendedLevel: "avanzato",
  },
};

function getProfile(ids: string[]): Profile {
  const levels = ids.map(id => ITEMS.find(i => i.id === id)?.level).filter(Boolean) as Level[];
  const hasBase  = levels.includes("base");
  const hasInter = levels.includes("intermedio");
  const hasAdv   = levels.includes("avanzato");
  const countBase  = levels.filter(l => l === "base").length;
  const countInter = levels.filter(l => l === "intermedio").length;

  if (!hasInter && !hasAdv)           return PROFILES["base"];
  if (!hasBase  && !hasAdv)           return PROFILES["intermedio"];
  if (!hasBase  && !hasInter)         return PROFILES["avanzato"];
  if (hasBase && hasAdv && !hasInter) return PROFILES["gap"];
  if (hasBase && hasInter && hasAdv)  return PROFILES["completo"];
  if (countBase >= countInter)        return PROFILES["transizione_base"];
  return PROFILES["transizione_avanzato"];
}

// ─── Zaino SVG rifinito ────────────────────────────────────────────────────────
function BackpackSVG({ glowing, accent }: { glowing: boolean; accent: string }) {
  return (
    <svg viewBox="0 0 160 190" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <radialGradient id="bglow2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bbody2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b09484" />
          <stop offset="100%" stopColor="#7a6254" />
        </linearGradient>
        <linearGradient id="bfront2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4a590" />
          <stop offset="100%" stopColor="#a8856e" />
        </linearGradient>
        <linearGradient id="bstrap2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a6e5e" />
          <stop offset="100%" stopColor="#6b5244" />
        </linearGradient>
        <filter id="bshadow" x="-10%" y="-5%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#00000025" />
        </filter>
      </defs>

      {/* Glow quando pieno */}
      {glowing && (
        <ellipse cx="80" cy="100" rx="72" ry="78" fill="url(#bglow2)">
          <animate attributeName="rx" values="68;76;68" dur="1.8s" repeatCount="indefinite" />
        </ellipse>
      )}

      {/* Spallacci */}
      <path d="M58 18 C54 18 50 22 50 28 L50 52 C50 56 53 58 56 58 L64 58 C67 58 70 56 70 52 L70 28 C70 22 66 18 62 18 Z"
        fill="url(#bstrap2)" rx="5" />
      <path d="M98 18 C94 18 90 22 90 28 L90 52 C90 56 93 58 96 58 L104 58 C107 58 110 56 110 52 L110 28 C110 22 106 18 102 18 Z"
        fill="url(#bstrap2)" />
      {/* Dettaglio spallacci — cuciture */}
      <line x1="57" y1="28" x2="57" y2="50" stroke="rgba(0,0,0,0.12)" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="99" y1="28" x2="99" y2="50" stroke="rgba(0,0,0,0.12)" strokeWidth="1" strokeDasharray="3 3" />

      {/* Manico */}
      <path d="M66 22 C66 16 94 16 94 22" stroke="#c4a590" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M66 22 C66 16 94 16 94 22" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

      {/* Corpo principale */}
      <rect x="18" y="42" width="124" height="126" rx="22" fill="url(#bbody2)" filter="url(#bshadow)" />
      {/* Highlight top */}
      <path d="M18 52 C18 42 26 42 40 42 L120 42 C134 42 142 42 142 52 L142 64 C142 64 110 68 80 68 C50 68 18 64 18 64 Z"
        fill="rgba(255,255,255,0.1)" />

      {/* Tasca laterale sinistra */}
      <rect x="8" y="72" width="16" height="52" rx="8" fill="#8a6e5e" />
      <line x1="16" y1="80" x2="16" y2="116" stroke="rgba(0,0,0,0.15)" strokeWidth="1" strokeDasharray="2 3" />
      {/* Tasca laterale destra */}
      <rect x="136" y="72" width="16" height="52" rx="8" fill="#8a6e5e" />
      <line x1="144" y1="80" x2="144" y2="116" stroke="rgba(0,0,0,0.15)" strokeWidth="1" strokeDasharray="2 3" />

      {/* Tasca frontale */}
      <rect x="26" y="100" width="108" height="58" rx="14" fill="url(#bfront2)" />
      {/* Highlight tasca */}
      <rect x="26" y="100" width="108" height="18" rx="14" fill="rgba(255,255,255,0.08)" />

      {/* Zip tasca frontale */}
      <path d="M38 100 Q80 94 122 100" stroke="rgba(0,0,0,0.2)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M38 100 Q80 94 122 100" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" strokeLinecap="round" strokeDasharray="4 3" />
      {/* Cursore zip */}
      <rect x="76" y="91" width="8" height="10" rx="3" fill="#d4c4b8" />
      <rect x="77" y="92" width="6" height="8" rx="2" fill="#c0afa4" />

      {/* Cinghia di compressione */}
      <path d="M30 76 L130 76" stroke="rgba(0,0,0,0.15)" strokeWidth="3" strokeLinecap="round" />
      <rect x="72" y="72" width="16" height="8" rx="3" fill="#8a6e5e" />
      <rect x="74" y="74" width="12" height="4" rx="2" fill="#7a6254" />

      {/* Patch logo */}
      <rect x="62" y="50" width="36" height="24" rx="5"
        fill="rgba(90,170,221,0.15)" stroke="rgba(90,170,221,0.5)" strokeWidth="1.5" />
      <text x="80" y="65" textAnchor="middle" fill="#5aaadd"
        fontSize="9" fontWeight="900" letterSpacing="1.5" fontFamily="monospace">ALT</text>

      {/* Cuciture decorative corpo */}
      <path d="M26 130 Q80 126 134 130" stroke="rgba(0,0,0,0.08)" strokeWidth="1" fill="none" strokeDasharray="3 4" />
    </svg>
  );
}

// ─── Oggetto item con SVG rifinito ────────────────────────────────────────────
function ItemCard({
  item,
  isIn,
  isDisabled,
  onToggle,
}: {
  item: Item;
  isIn: boolean;
  isDisabled: boolean;
  onToggle: () => void;
}) {
  const levelColor = LEVEL_META[item.level].color;

  return (
    <motion.button
      layoutId={`cq-${item.id}`}
      onClick={() => !isDisabled && onToggle()}
      style={{ gridColumn: item.col, gridRow: item.row }}
      animate={{
        opacity: isIn ? 0 : isDisabled ? 0.2 : 1,
        scale:   isIn ? 0.3 : 1,
        pointerEvents: isIn ? "none" : "auto",
      }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      whileHover={!isIn && !isDisabled ? { scale: 1.1, y: -3 } : {}}
      whileTap={!isIn && !isDisabled ? { scale: 0.92 } : {}}
      className="flex flex-col items-center gap-1 focus:outline-none"
    >
      <div className="relative">
        <div
          className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-2xl md:text-3xl transition-shadow"
          style={{
            background: "white",
            boxShadow: `0 3px 12px rgba(159,130,112,0.14), 0 1px 3px rgba(0,0,0,0.06), 0 0 0 1.5px ${levelColor}35`,
          }}
        >
          {item.emoji}
        </div>
        {/* Dot livello */}
        <div
          className="absolute top-0.5 left-0.5 w-2 h-2 rounded-full border border-white"
          style={{ background: levelColor }}
        />
      </div>
      <span className="text-[8px] font-black uppercase tracking-widest text-stone-400 text-center leading-tight max-w-[56px]">
        {item.label}
      </span>
    </motion.button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CorsiQuiz({
  onCourseClick,
}: {
  onCourseClick?: (level: Level) => void;
}) {
  const [selected, setSelected]     = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [profile, setProfile]       = useState<Profile | null>(null);

  const isFull      = selected.length === 3;
  const accentColor = profile?.accent ?? "#5aaadd";

  const toggle = (id: string) => {
    if (selected.includes(id)) setSelected(p => p.filter(s => s !== id));
    else if (!isFull)          setSelected(p => [...p, id]);
  };

  const discover = () => { setProfile(getProfile(selected)); setShowResult(true); };
  const reset    = () => { setSelected([]); setShowResult(false); setProfile(null); };

  return (
    <div
      className="relative w-full max-w-2xl mx-auto rounded-[2.5rem] overflow-hidden"
      style={{
        background: "#f5f2ed",
        boxShadow: "0 20px 60px rgba(159,130,112,0.18), 0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(159,130,112,0.12)",
      }}
    >
      {/* Top bar */}
      <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #81ccb0, #5aaadd, #f4d98c)" }} />

      <AnimatePresence mode="wait">
        {!showResult ? (

          /* ── QUIZ ── */
          <motion.div
            key="quiz"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="p-5 md:p-8"
          >
            {/* Header */}
            <div className="mb-5">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1" style={{ color: "#81ccb0" }}>
                Trova il tuo corso
              </p>
              <h2 className="text-2xl md:text-4xl font-black text-[#44403c] uppercase tracking-tighter leading-[0.9] mb-1">
                Cosa metti<br />
                <span className="font-light italic" style={{ color: "#9f8270" }}>nel tuo zaino?</span>
              </h2>
              <div className="h-1 w-10 rounded-full mt-2.5" style={{ background: "#81ccb0" }} />
              <p className="text-stone-400 text-xs font-medium mt-2.5">
                Scegli 3 oggetti — scopri il tuo prossimo passo
              </p>
            </div>

            {/* Legenda */}
            <div className="flex gap-4 mb-4">
              {(Object.entries(LEVEL_META) as [Level, { label: string; color: string }][]).map(([, v]) => (
                <div key={v.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: v.color }} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">{v.label}</span>
                </div>
              ))}
            </div>

            {/* Grid oggetti + zaino */}
            <div
              className="grid items-center justify-items-center gap-1.5 md:gap-3 mb-5"
              style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", gridTemplateRows: "auto auto auto" }}
            >
              {ITEMS.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isIn={selected.includes(item.id)}
                  isDisabled={!selected.includes(item.id) && isFull}
                  onToggle={() => toggle(item.id)}
                />
              ))}

              {/* Zaino — centro */}
              <div
                className="relative flex flex-col items-center"
                style={{ gridColumn: "2 / 4", gridRow: "1 / 4" }}
              >
                <div className="relative w-32 h-40 md:w-44 md:h-52">
                  <BackpackSVG glowing={isFull} accent="#81ccb0" />

                  {/* Slot oggetti */}
                  <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 md:gap-2">
                    {[0, 1, 2].map(i => {
                      const slotItem = ITEMS.find(it => it.id === selected[i]);
                      const slotColor = slotItem ? LEVEL_META[slotItem.level].color : null;
                      return (
                        <motion.div
                          key={i}
                          animate={slotItem ? { scale: [1, 1.15, 1] } : {}}
                          transition={{ duration: 0.28 }}
                          className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center relative"
                          style={{
                            background: slotItem ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.22)",
                            border: slotItem
                              ? `1.5px solid ${slotColor}60`
                              : "1.5px dashed rgba(255,255,255,0.4)",
                            boxShadow: slotItem ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                          }}
                        >
                          {slotItem && (
                            <>
                              <motion.button
                                layoutId={`cq-${slotItem.id}`}
                                onClick={() => toggle(slotItem.id)}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 24 }}
                                className="text-lg md:text-xl leading-none focus:outline-none"
                              >
                                {slotItem.emoji}
                              </motion.button>
                              <div
                                className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full"
                                style={{ background: slotColor ?? "#ccc" }}
                              />
                            </>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Dot progress */}
                <div className="flex gap-2 mt-2">
                  {[0, 1, 2].map(i => {
                    const dotItem = ITEMS.find(it => it.id === selected[i]);
                    return (
                      <motion.div
                        key={i}
                        animate={{
                          backgroundColor: dotItem ? LEVEL_META[dotItem.level].color : "#d6d3d1",
                          scale: dotItem ? 1.25 : 1,
                        }}
                        transition={{ duration: 0.25 }}
                        className="w-2 h-2 rounded-full"
                      />
                    );
                  })}
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mt-1">
                  {selected.length}/3
                </p>
              </div>
            </div>

            {/* CTA */}
            <AnimatePresence>
              {isFull && (
                <motion.button
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  onClick={discover}
                  className="w-full min-h-[52px] py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-white flex items-center justify-center gap-3 active:scale-95 transition-transform"
                  style={{
                    background: "linear-gradient(135deg, #81ccb0 0%, #5aa89a 100%)",
                    boxShadow: "0 8px 28px rgba(129,204,176,0.35)",
                  }}
                >
                  <Sparkles size={14} />
                  Scopri il tuo prossimo passo
                  <ArrowRight size={14} />
                </motion.button>
              )}
            </AnimatePresence>

            {!isFull && selected.length > 0 && (
              <p className="text-center text-[9px] font-medium text-stone-400 mt-2">
                Ancora {3 - selected.length} {3 - selected.length === 1 ? "oggetto" : "oggetti"}
              </p>
            )}
          </motion.div>

        ) : (

          /* ── RESULT ── */
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="p-5 md:p-10"
          >
            <div className="h-px w-full rounded-full mb-6 opacity-40"
              style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />

            {/* Profile hero */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.1 }}
                className="w-18 h-18 md:w-20 md:h-20 mx-auto rounded-[1.5rem] flex items-center justify-center text-4xl mb-4"
                style={{
                  width: "72px", height: "72px",
                  background: "white",
                  boxShadow: `0 8px 28px ${accentColor}33, 0 0 0 1.5px ${accentColor}40`,
                }}
              >
                {profile?.icon}
              </motion.div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-2" style={{ color: accentColor }}>
                Il tuo profilo formativo
              </p>
              <h3 className="text-xl md:text-3xl font-black text-[#44403c] uppercase tracking-tighter leading-tight mb-1">
                {profile?.name}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                {profile?.subtitle}
              </p>
            </div>

            {/* Items recap */}
            <div className="flex justify-center gap-3 mb-6">
              {selected.map((id, idx) => {
                const item = ITEMS.find(i => i.id === id);
                const lc   = item ? LEVEL_META[item.level].color : accentColor;
                return (
                  <motion.div key={id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + idx * 0.07 }} className="flex flex-col items-center gap-1"
                  >
                    <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-xl md:text-2xl relative"
                      style={{ background: "white", boxShadow: `0 2px 10px ${lc}22, 0 0 0 1.5px ${lc}50` }}>
                      {item?.emoji}
                      <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full border border-white" style={{ background: lc }} />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-wider text-stone-400 text-center leading-tight max-w-[48px]">
                      {item?.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Description + nudge */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="rounded-2xl p-4 md:p-5 mb-6"
              style={{ background: "white", boxShadow: "0 2px 12px rgba(159,130,112,0.1), 0 0 0 1px rgba(159,130,112,0.08)", borderLeft: `3px solid ${accentColor}` }}
            >
              <p className="text-stone-500 text-sm leading-relaxed italic font-serif mb-3">
                "{profile?.description}"
              </p>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: accentColor }}>
                  <ArrowRight size={9} className="text-white" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: accentColor }}>
                  {profile?.nudge}
                </p>
              </div>
            </motion.div>

            {/* Level badge + CTA */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="rounded-2xl p-4 mb-5 flex items-center justify-between"
              style={{ background: `${accentColor}12`, border: `1.5px solid ${accentColor}30` }}
            >
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-0.5">
                  Livello consigliato
                </p>
                <p className="text-lg font-black uppercase tracking-tighter" style={{ color: accentColor }}>
                  {profile ? LEVEL_META[profile.recommendedLevel].label : ""}
                </p>
              </div>
              <button
                className="min-h-[44px] px-5 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest text-white flex items-center gap-2 active:scale-95 transition-transform"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                  boxShadow: `0 4px 16px ${accentColor}40`,
                }}
                onClick={() => onCourseClick?.(profile?.recommendedLevel ?? "base")}
              >
                Vedi i corsi <ArrowRight size={11} />
              </button>
            </motion.div>

            {/* Reset */}
            <button onClick={reset}
              className="w-full min-h-[48px] py-3.5 rounded-2xl font-black uppercase text-[9px] tracking-widest text-[#44403c] flex items-center justify-center gap-2 active:scale-95 hover:bg-stone-100 transition-all"
              style={{ background: "white", boxShadow: "0 2px 8px rgba(159,130,112,0.1), 0 0 0 1.5px rgba(159,130,112,0.15)" }}
            >
              <RotateCcw size={11} /> Rifai il quiz
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}