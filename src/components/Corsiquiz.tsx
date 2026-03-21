import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RotateCcw, ArrowRight, ChevronRight, CheckCircle2, Circle } from "lucide-react";

// ─── Altour brand ─────────────────────────────────────────────────────────────
type Level = "base" | "intermedio" | "avanzato";

interface Item {
  id: string;
  emoji: string;
  label: string;
  level: Level;
  modules: string[];
  zone: "left" | "bottom" | "right";
  zoneRow?: number;
}

interface Profile {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  accent: string;
  recommendedLevel: Level;
  prerequisiteMessage?: string;
  // livelli già acquisiti (per la progress path)
  completedLevels: Level[];
}

// ─── Prerequisiti per livello ─────────────────────────────────────────────────
const PREREQUISITES: Record<Level, string[]> = {
  base: [],
  intermedio: [
    "Abbigliamento", "Attrezzatura I", "Calzature",
    "Lettura e interpretazione di una carta geografica",
  ],
  avanzato: [
    "Abbigliamento", "Attrezzatura I", "Calzature",
    "Lettura e interpretazione di una carta geografica",
    "Alimentazione", "Allenamento", "Comportamenti ecocompatibili",
    "Orientamento strumentale", "Prevenzione pericoli",
    "Primo soccorso", "Sentieristica",
  ],
};

const LEVEL_META: Record<Level, { label: string; color: string }> = {
  base:       { label: "Base",       color: "#81ccb0" },
  intermedio: { label: "Intermedio", color: "#5aaadd" },
  avanzato:   { label: "Avanzato",   color: "#9f8270" },
};

const ITEMS: Item[] = [
  { id: "map",       emoji: "🗺️", label: "Cartina",    level: "base",       zone: "left",   zoneRow: 1, modules: ["Lettura e interpretazione di una carta geografica"] },
  { id: "boots",    emoji: "🥾", label: "Scarponi",    level: "base",       zone: "left",   zoneRow: 2, modules: ["Calzature"] },
  { id: "poles",     emoji: "🥢", label: "Bastoncini",  level: "base",       zone: "left",   zoneRow: 3, modules: ["Calzature"] },
  { id: "compass",   emoji: "🧭", label: "Bussola",     level: "intermedio", zone: "bottom",             modules: ["Orientamento strumentale", "Sentieristica"] },
  { id: "altimeter", emoji: "⏱️", label: "Altimetro",   level: "intermedio", zone: "bottom",             modules: ["Allenamento", "Alimentazione"] },
  { id: "medkit",    emoji: "🩹", label: "Kit 1° soc.", level: "intermedio", zone: "bottom",             modules: ["Primo soccorso", "Prevenzione pericoli", "Comportamenti ecocompatibili"] },
  { id: "jacket",    emoji: "🧥", label: "Guscio",      level: "avanzato",   zone: "right",  zoneRow: 1, modules: ["Attrezzatura II", "Elementi di Meteorologia"] },
  { id: "torch",     emoji: "🔦", label: "Frontale",    level: "avanzato",   zone: "right",  zoneRow: 2, modules: ["Progettazione di una escursione", "Parchi e Aree protette"] },
  { id: "gloves",    emoji: "🧤", label: "Guanti",      level: "avanzato",   zone: "right",  zoneRow: 3, modules: ["Elementi di Geodesia"] },
];

const PROFILES: Record<string, Profile> = {
  base: {
    id: "base", name: "Il Principiante Pronto", subtitle: "Curioso · Motivato · In partenza",
    description: "Hai l'equipaggiamento giusto per muovere i primi passi. La montagna ti aspetta — inizia dalle fondamenta.",
    icon: "🗺️", accent: "#81ccb0", recommendedLevel: "base", completedLevels: [],
  },
  intermedio: {
    id: "intermedio", name: "L'Escursionista Formato", subtitle: "Consapevole · Autonomo · Preciso",
    description: "Hai le basi solide e stai sviluppando tecnica. È il momento di alzare l'asticella con gli strumenti giusti.",
    icon: "🧭", accent: "#5aaadd", recommendedLevel: "intermedio", completedLevels: ["base"],
    prerequisiteMessage: "Per affrontare il corso intermedio è utile aver già acquisito le conoscenze base.",
  },
  avanzato: {
    id: "avanzato", name: "L'Alpinista Compiuto", subtitle: "Esperto · Tecnico · Pronto a guidare",
    description: "Il tuo kit parla da solo. Sei pronto per le condizioni più impegnative e la formazione avanzata.",
    icon: "🧥", accent: "#9f8270", recommendedLevel: "avanzato", completedLevels: ["base", "intermedio"],
    prerequisiteMessage: "Il corso avanzato richiede le conoscenze dei livelli base e intermedio.",
  },
  gap: {
    id: "gap", name: "L'Esploratore con il Gap", subtitle: "Ambizioso · Coraggioso · Da consolidare",
    description: "Hai entusiasmo e visione avanzata, ma mancano gli strumenti del livello intermedio. Costruisci prima quelle fondamenta.",
    icon: "🧭", accent: "#f4d98c", recommendedLevel: "intermedio", completedLevels: ["base"],
    prerequisiteMessage: "Prima di passare al livello avanzato, consolida il percorso intermedio.",
  },
  transizione_base: {
    id: "transizione_base", name: "Il Trekker in Crescita", subtitle: "In transizione · Determinato · Curioso",
    description: "Stai costruendo un kit serio. Hai le basi e inizi a guardare oltre — è il momento giusto per il salto.",
    icon: "🧭", accent: "#5aaadd", recommendedLevel: "intermedio", completedLevels: ["base"],
    prerequisiteMessage: "Hai già le conoscenze base — sei pronto per il livello intermedio.",
  },
  transizione_avanzato: {
    id: "transizione_avanzato", name: "L'Alpinista in Divenire", subtitle: "Tecnico · Ambizioso · Quasi pronto",
    description: "Il tuo kit mescola tecnica e audacia. Hai quasi tutto ciò che serve — manca solo il passo formale.",
    icon: "🧥", accent: "#9f8270", recommendedLevel: "avanzato", completedLevels: ["base", "intermedio"],
    prerequisiteMessage: "Hai già le conoscenze base e intermedio — sei pronto per affrontare il livello avanzato.",
  },
  completo: {
    id: "completo", name: "L'Escursionista Completo", subtitle: "Versatile · Equilibrato · Pronto a tutto",
    description: "Il tuo zaino racconta di chi non si ferma a un solo livello. Hai la visione d'insieme del percorso.",
    icon: "⛰️", accent: "#5aaadd", recommendedLevel: "avanzato", completedLevels: ["base", "intermedio"],
    prerequisiteMessage: "Hai già le conoscenze base e intermedio — sei pronto per affrontare il corso avanzato completo.",
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

// ─── Progress Path component ──────────────────────────────────────────────────
function LearningPath({ recommended, completed }: { recommended: Level; completed: Level[] }) {
  const levels: Level[] = ["base", "intermedio", "avanzato"];
  return (
    <div className="flex items-center gap-0 w-full">
      {levels.map((lv, idx) => {
        const isDone  = completed.includes(lv);
        const isRec   = lv === recommended;
        const meta    = LEVEL_META[lv];
        return (
          <div key={lv} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-1 min-w-0">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 + idx * 0.1, type: "spring", stiffness: 300, damping: 22 }}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm mb-1.5"
                style={{
                  background: isDone ? `${meta.color}20` : isRec ? meta.color : "rgba(0,0,0,0.04)",
                  border: `2px solid ${isDone || isRec ? meta.color : "#d6d3d1"}`,
                  boxShadow: isRec ? `0 0 0 3px ${meta.color}25` : "none",
                }}
              >
                {isDone
                  ? <CheckCircle2 size={14} style={{ color: meta.color }} />
                  : isRec
                    ? <span className="text-white text-[10px] font-black">→</span>
                    : <Circle size={12} className="text-stone-300" />
                }
              </motion.div>
              <span
                className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-center leading-tight"
                style={{ color: isDone || isRec ? meta.color : "#a8a29e" }}
              >
                {meta.label}
              </span>
              {isRec && (
                <span className="text-[7px] font-black uppercase tracking-widest mt-0.5"
                  style={{ color: meta.color }}>
                  consigliato
                </span>
              )}
            </div>
            {idx < 2 && (
              <div className="w-6 sm:w-8 h-0.5 mx-0.5 shrink-0 rounded-full"
                style={{ background: completed.includes(levels[idx + 1]) || levels[idx + 1] === recommended ? LEVEL_META[levels[idx + 1]].color + "50" : "#e7e5e4" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Backpack SVG ──────────────────────────────────────────────────────────────
function BackpackSVG({ glowing, itemCount }: { glowing: boolean; itemCount: number }) {
  return (
    // Layer 1 — respiro idle
    <motion.div
      animate={{}}
      transition={{}}
      style={{ transformOrigin: "50% 10%", position: "relative" }}
    >
      {/* Layer 2 — peso fisico */}
      <motion.div
        key={itemCount}
        initial={false}
        animate={itemCount > 0
          ? { y: [0, 7, -2, 1, 0], scaleY: [1, 1.04, 0.97, 1.01, 1], scaleX: [1, 0.98, 1.02, 1, 1] }
          : {}}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ transformOrigin: "50% 100%", position: "relative" }}
      >
        {/* Layer 3 — bounce glow quando pieno */}
        <motion.div
          animate={glowing
            ? { scale: [1, 1.03, 1.02, 1.04, 1], rotate: [0, -1, 1, -0.6, 0] }
            : { scale: 1 }}
          transition={glowing ? { duration: 0.65 } : {}}
          style={{ position: "relative" }}
        >
          {/* Glow verde Altour */}
          <AnimatePresence>
            {glowing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.65, 0.3] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.8, repeat: Infinity }}
                style={{
                  position: "absolute", inset: "-20%", borderRadius: "50%", zIndex: 0,
                  background: "radial-gradient(ellipse at 50% 55%, rgba(129,204,176,0.6) 0%, rgba(129,204,176,0.2) 45%, transparent 70%)",
                  filter: "blur(16px)", pointerEvents: "none",
                }}
              />
            )}
          </AnimatePresence>

          {/* Ombra a terra dinamica */}
          <motion.div
            animate={{
              scaleX: glowing ? 1.2 : itemCount > 0 ? 1.05 : 0.85,
              opacity: glowing ? 0.45 : 0.22,
            }}
            transition={{ duration: 0.4 }}
            style={{
              position: "absolute", bottom: "-4%", left: "15%", right: "15%",
              height: "12px", borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(60,100,60,0.4) 0%, transparent 70%)",
              filter: "blur(4px)", zIndex: 0, pointerEvents: "none",
            }}
          />

          {/* Immagine zaino PNG trasparente */}
          <img
            src="/zaino.png"
            alt="Zaino da trekking"
            draggable={false}
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              position: "relative",
              zIndex: 1,
              filter: glowing
                ? `drop-shadow(0 0 14px rgba(129,204,176,0.8)) brightness(1.05)`
                : `drop-shadow(0 ${4 + itemCount * 2}px ${8 + itemCount * 3}px rgba(60,100,60,0.22))`,
              transition: "filter 0.4s ease",
            }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}


function ItemCard({ item, isIn, isDisabled, onToggle }: {
  item: Item; isIn: boolean; isDisabled: boolean; onToggle: () => void;
}) {
  return (
    <motion.button
      onClick={() => !isDisabled && onToggle()}
      animate={{ opacity: isDisabled ? 0.25 : 1, scale: isDisabled ? 0.92 : 1 }}
      transition={{ duration: 0.18 }}
      whileHover={!isDisabled ? { scale: 1.08, y: -2 } : {}}
      whileTap={!isDisabled ? { scale: 0.91 } : {}}
      className="flex flex-col items-center gap-1.5 focus:outline-none w-full relative"
    >
      <div
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl relative transition-all duration-200"
        style={{
          background: isIn ? "rgba(129,204,176,0.15)" : "white",
          boxShadow: isIn
            ? "0 0 0 2.5px #81ccb0, 0 3px 12px rgba(129,204,176,0.25)"
            : "0 3px 12px rgba(159,130,112,0.13), 0 1px 3px rgba(0,0,0,0.06), 0 0 0 1.5px rgba(159,130,112,0.16)",
        }}
      >
        {item.emoji}
        {/* Checkmark quando selezionato */}
        {isIn && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white flex items-center justify-center text-[9px] font-black"
            style={{ background: "#81ccb0" }}
          >✓</motion.span>
        )}
      </div>
      <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-center leading-tight w-full px-0.5"
        style={{ color: isIn ? "#81ccb0" : undefined }}>
        {item.label}
      </span>
    </motion.button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ZainoQuiz({
  onScrollToCourses,
}: {
  onScrollToCourses?: (level?: string) => void;
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

  const activeModules = [...new Set(
    selected.flatMap(id => ITEMS.find(i => i.id === id)?.modules ?? [])
  )];

  const leftItems   = ITEMS.filter(i => i.zone === "left").sort((a, b) => (a.zoneRow ?? 0) - (b.zoneRow ?? 0));
  const rightItems  = ITEMS.filter(i => i.zone === "right").sort((a, b) => (a.zoneRow ?? 0) - (b.zoneRow ?? 0));
  const bottomItems = ITEMS.filter(i => i.zone === "bottom");

  return (
    <div
      className="relative w-full max-w-2xl mx-auto rounded-[2.5rem] overflow-hidden"
      style={{
        background: "#f5f2ed",
        boxShadow: "0 20px 60px rgba(159,130,112,0.18), 0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(159,130,112,0.12)",
      }}
    >
      <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #81ccb0, #5aaadd, #f4d98c)" }} />

      <AnimatePresence mode="wait">
        {!showResult ? (
          <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}
            className="p-5 sm:p-7 md:p-8"
          >
            <div className="mb-5">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1" style={{ color: "#81ccb0" }}>
                Trova il tuo corso
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#44403c] uppercase tracking-tighter leading-[0.9] mb-1">
                Cosa metti<br />
                <span className="font-light italic" style={{ color: "#9f8270" }}>nel tuo zaino?</span>
              </h2>
              <div className="h-1 w-10 rounded-full mt-2.5" style={{ background: "#81ccb0" }} />
              <p className="text-stone-400 text-xs font-medium mt-2.5">
                Scegli 3 oggetti — scopri il tuo prossimo passo
              </p>
            </div>

            <div className="flex gap-2 sm:gap-4 items-center mb-3">
              <div className="flex flex-col gap-3 sm:gap-4 items-center w-14 sm:w-16 shrink-0">
                {leftItems.map(item => (
                  <ItemCard key={item.id} item={item}
                    isIn={selected.includes(item.id)}
                    isDisabled={!selected.includes(item.id) && isFull}
                    onToggle={() => toggle(item.id)} />
                ))}
              </div>

              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative w-full mx-auto" style={{ maxWidth: "520px" }}>
                  <BackpackSVG glowing={isFull} itemCount={selected.length} />
                </div>
                {/* Strip oggetti selezionati */}
                <div className="flex gap-2 mt-3 min-h-[44px] items-center justify-center">
                  <AnimatePresence>
                    {selected.map((id) => {
                      const item = ITEMS.find(i => i.id === id);
                      return (
                        <motion.button
                          key={id}
                          initial={{ opacity: 0, scale: 0.5, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.5, y: 8 }}
                          transition={{ type: "spring", stiffness: 400, damping: 24 }}
                          onClick={() => toggle(id)}
                          className="relative w-11 h-11 rounded-2xl flex items-center justify-center text-2xl focus:outline-none active:scale-90"
                          style={{
                            background: "white",
                            boxShadow: "0 2px 8px rgba(129,204,176,0.3), 0 0 0 2px #81ccb0",
                          }}
                          title={`Rimuovi ${item?.label}`}
                        >
                          {item?.emoji}
                          {/* X badge */}
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-stone-400 text-white flex items-center justify-center text-[9px] font-black leading-none">✕</span>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                  {selected.length === 0 && (
                    <p className="text-[9px] font-medium text-stone-300 tracking-wide">Nessun oggetto selezionato</p>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i}
                      animate={{ backgroundColor: i < selected.length ? "#81ccb0" : "#d6d3d1", scale: i < selected.length ? 1.3 : 1 }}
                      transition={{ duration: 0.22 }}
                      className="w-2 h-2 rounded-full" />
                  ))}
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mt-1">{selected.length}/3</p>
              </div>

              <div className="flex flex-col gap-3 sm:gap-4 items-center w-14 sm:w-16 shrink-0">
                {rightItems.map(item => (
                  <ItemCard key={item.id} item={item}
                    isIn={selected.includes(item.id)}
                    isDisabled={!selected.includes(item.id) && isFull}
                    onToggle={() => toggle(item.id)} />
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-3 sm:gap-6 py-3 px-2 rounded-2xl mb-4"
              style={{ background: "rgba(90,170,221,0.06)", border: "1px dashed rgba(90,170,221,0.2)" }}>
              {bottomItems.map(item => (
                <ItemCard key={item.id} item={item}
                  isIn={selected.includes(item.id)}
                  isDisabled={!selected.includes(item.id) && isFull}
                  onToggle={() => toggle(item.id)} />
              ))}
            </div>

            <AnimatePresence>
              {activeModules.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.28 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="rounded-2xl p-3.5"
                    style={{ background: "white", boxShadow: "0 2px 8px rgba(159,130,112,0.08), 0 0 0 1px rgba(159,130,112,0.08)" }}>
                    <p className="text-[8px] font-black uppercase tracking-widest text-stone-400 mb-2">
                      Moduli che stai attivando
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeModules.map((mod, i) => (
                        <motion.span key={mod} initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                          className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(129,204,176,0.12)", color: "#81ccb0", border: "1px solid rgba(129,204,176,0.28)" }}
                        >
                          {mod}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isFull && (
                <motion.button initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  onClick={discover}
                  className="w-full min-h-[52px] py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-white flex items-center justify-center gap-3 active:scale-95 transition-transform"
                  style={{ background: "linear-gradient(135deg, #81ccb0 0%, #5aa89a 100%)", boxShadow: "0 8px 28px rgba(129,204,176,0.35)" }}
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
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}
            className="p-5 sm:p-7 md:p-10"
          >
            <div className="h-px w-full rounded-full mb-5 opacity-40"
              style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />

            <div className="text-center mb-5">
              <motion.div initial={{ scale: 0, rotate: -12 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.1 }}
                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-[1.5rem] flex items-center justify-center text-3xl sm:text-4xl mb-3"
                style={{ background: "white", boxShadow: `0 8px 28px ${accentColor}33, 0 0 0 1.5px ${accentColor}40` }}
              >
                {profile?.icon}
              </motion.div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1.5" style={{ color: accentColor }}>
                Il tuo profilo formativo
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-[#44403c] uppercase tracking-tighter leading-tight mb-1">
                {profile?.name}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                {profile?.subtitle}
              </p>
            </div>

            <div className="flex justify-center gap-3 mb-5">
              {selected.map((id, idx) => {
                const item = ITEMS.find(i => i.id === id);
                return (
                  <motion.div key={id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 + idx * 0.07 }} className="flex flex-col items-center gap-1">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl"
                      style={{ background: "white", boxShadow: "0 2px 10px rgba(159,130,112,0.12), 0 0 0 1.5px rgba(159,130,112,0.15)" }}>
                      {item?.emoji}
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-wider text-stone-400 text-center leading-tight max-w-[48px]">
                      {item?.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }}
              className="rounded-2xl p-4 mb-4"
              style={{ background: "white", boxShadow: "0 2px 12px rgba(159,130,112,0.1), 0 0 0 1px rgba(159,130,112,0.08)" }}
            >
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-3">
                Il tuo percorso formativo
              </p>
              <LearningPath
                recommended={profile?.recommendedLevel ?? "base"}
                completed={profile?.completedLevels ?? []}
              />
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.30 }}
              className="rounded-2xl p-4 mb-4"
              style={{ background: "white", boxShadow: "0 2px 12px rgba(159,130,112,0.1), 0 0 0 1px rgba(159,130,112,0.08)", borderLeft: `3px solid ${accentColor}` }}
            >
              <p className="text-stone-500 text-sm leading-relaxed italic font-serif">
                "{profile?.description}"
              </p>
              {profile?.prerequisiteMessage && (
                <div className="flex items-start gap-2 mt-3 pt-3 border-t border-stone-100">
                  <ChevronRight size={12} className="shrink-0 mt-0.5" style={{ color: accentColor }} />
                  <p className="text-[10px] font-black uppercase tracking-widest leading-snug" style={{ color: accentColor }}>
                    {profile.prerequisiteMessage}
                  </p>
                </div>
              )}
            </motion.div>

            {profile && PREREQUISITES[profile.recommendedLevel].length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.38 }}
                className="rounded-2xl p-4 mb-4"
                style={{ background: "white", boxShadow: "0 2px 12px rgba(159,130,112,0.1), 0 0 0 1px rgba(159,130,112,0.08)" }}
              >
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-3">
                  Preparazione consigliata
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-3">
                  {PREREQUISITES[profile.recommendedLevel].map((prereq, i) => (
                    <motion.div key={prereq} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.42 + i * 0.04 }} className="flex items-center gap-2">
                      <CheckCircle2 size={12} style={{ color: accentColor, flexShrink: 0 }} />
                      <span className="text-[10px] font-medium text-stone-500 leading-tight">{prereq}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.44 }}
              className="rounded-2xl p-4 mb-4"
              style={{ background: "white", boxShadow: "0 2px 12px rgba(159,130,112,0.1), 0 0 0 1px rgba(159,130,112,0.08)" }}
            >
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-2.5">
                Moduli collegati agli oggetti scelti
              </p>
              <div className="flex flex-wrap gap-1.5">
                {activeModules.map((mod, i) => (
                  <motion.span key={mod} initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.48 + i * 0.04 }}
                    className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{ background: `${accentColor}14`, color: accentColor, border: `1px solid ${accentColor}30` }}
                  >
                    {mod}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="rounded-2xl p-4 mb-4 flex items-center justify-between gap-3"
              style={{ background: `${accentColor}10`, border: `1.5px solid ${accentColor}28` }}
            >
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-0.5">
                  Livello consigliato
                </p>
                <p className="text-xl font-black uppercase tracking-tighter" style={{ color: accentColor }}>
                  {profile ? LEVEL_META[profile.recommendedLevel].label : ""}
                </p>
              </div>
              <button
                className="min-h-[48px] px-5 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest text-white flex items-center gap-2 active:scale-95 transition-transform shrink-0"
                style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`, boxShadow: `0 4px 16px ${accentColor}40` }}
                onClick={() => { onScrollToCourses?.(profile?.recommendedLevel); }}
              >
                Vedi i corsi <ArrowRight size={11} />
              </button>
            </motion.div>

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