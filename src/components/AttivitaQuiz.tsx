import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, RotateCcw, Sparkles, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/supabase";
import ActivityDetailModal from "./ActivityDetailModal";


type Escursione = Database["public"]["Tables"]["escursioni"]["Row"] & {
  filosofia?: string | null;
  lunghezza?: number | null;
  lat?: number | null;
  lng?: number | null;
  _tipo?: "escursione";
};

// ─── Oggetti zaino ─────────────────────────────────────────────────────────────
interface Item {
  id: string;
  emoji: string;
  label: string;
  zone: "left" | "bottom" | "right";
  zoneRow?: number;
  hint: string;       // spiegazione mostrata nel tooltip
  hintTag: string;    // pill sintetica
}

const ITEMS: Item[] = [
  {
    id: "map", emoji: "🗺️", label: "Cartina", zone: "left", zoneRow: 1,
    hint: "Ami conoscere la meta prima di partire. Cerchi percorsi culturali o naturalistici con un obiettivo preciso.",
    hintTag: "Scoperta del territorio",
  },
  {
    id: "boots", emoji: "🥾", label: "Scarponi", zone: "left", zoneRow: 2,
    hint: "Esci regolarmente e cerchi esperienze di qualità. Il giusto equilibrio tra impegno e soddisfazione.",
    hintTag: "Escursionismo regolare",
  },
  {
    id: "poles", emoji: "🥢", label: "Bastoncini", zone: "left", zoneRow: 3,
    hint: "Preferisci percorsi impegnativi con dislivelli importanti. Esci spesso e ami le sfide fisiche.",
    hintTag: "Alta difficoltà",
  },
  {
    id: "compass", emoji: "🧭", label: "Bussola", zone: "bottom",
    hint: "Ti piace esplorare da solo in luoghi poco battuti. Cerchi pace e orientamento autonomo.",
    hintTag: "Luoghi remoti",
  },
  {
    id: "water", emoji: "🧴", label: "Borraccia", zone: "bottom",
    hint: "Preferisci uscite brevi e accessibili a tutti. Ideale per escursioni in famiglia o senza troppe pretese fisiche.",
    hintTag: "Mezza giornata",
  },
  {
    id: "medkit", emoji: "🩹", label: "Kit soccorso", zone: "bottom",
    hint: "Sei prudente e previdente. Ti avvicini alla montagna con calma, magari per la prima volta o in coppia.",
    hintTag: "Approccio cauto",
  },
  {
    id: "jacket", emoji: "🧥", label: "Giacca", zone: "right", zoneRow: 1,
    hint: "Punti in alto — vette, creste, paesaggi panoramici. Non ti spaventa la fatica né il freddo.",
    hintTag: "Alta quota",
  },
  {
    id: "torch", emoji: "🔦", label: "Frontale", zone: "right", zoneRow: 2,
    hint: "Cerchi avventure lunghe, magari multi-giorno. Ti piace l'isolamento e la tranquillità della notte.",
    hintTag: "Avventura prolungata",
  },
  {
    id: "gps", emoji: "📡", label: "GPS", zone: "right", zoneRow: 3,
    hint: "Esplori zone selvagge con il gruppo o in autonomia. La tecnologia è la tua sicurezza fuori rotta.",
    hintTag: "Fuori dai sentieri",
  },
];

// ─── Segnali semantici ─────────────────────────────────────────────────────────
const ITEM_SIGNALS: Record<string, Record<string, string>> = {
  map:     { cerca: "Conoscere la meta",    luogo: "Bosco",              tempo: "Intera giornata" },
  boots:   { sforzo: "Medio",               frequenza: "Ogni mese",      cerca: "Tempo di qualità" },
  poles:   { sforzo: "Intenso",             frequenza: "Ogni settimana", luogo: "Panoramico" },
  compass: { compagnia: "Solo",             cerca: "Pace e serenità",    luogo: "Poco frequentato" },
  water:   { tempo: "Mezza giornata",       sforzo: "Basso",             compagnia: "Famiglia" },
  medkit:  { frequenza: "1/3 volte l'anno", sforzo: "Basso",             compagnia: "Coppia" },
  jacket:  { luogo: "Panoramico",           sforzo: "Intenso",           cerca: "Tempo di qualità" },
  torch:   { tempo: "Una settimana",        luogo: "Poco frequentato",   cerca: "Pace e serenità" },
  gps:     { luogo: "Poco frequentato",     sforzo: "Intenso",           compagnia: "Gruppo di amici" },
};

const ITEM_WEIGHT: Record<string, number> = {
  poles: 2, jacket: 2, gps: 2, torch: 2,
  boots: 1, compass: 1,
  map: 0, water: 0, medkit: 0,
};

const FILOSOFIA_QUIZ_MAP: Record<string, Record<string, string>> = {
  "Avventura":             { cerca: "Tempo di qualità",   sforzo: "Intenso",    frequenza: "Ogni settimana" },
  "Benessere":             { cerca: "Pace e serenità",    sforzo: "Basso",      compagnia: "Coppia" },
  "Borghi più belli":      { luogo: "Bosco",              tempo: "Intera giornata", cerca: "Conoscere la meta" },
  "Cammini":               { luogo: "Bosco",              tempo: "Più giorni",  cerca: "Pace e serenità" },
  "Educazione all'aperto": { frequenza: "Mai",            compagnia: "Famiglia" },
  "Eventi":                { compagnia: "Gruppo di amici", tempo: "Intera giornata" },
  "Formazione":            { frequenza: "Mai",            tempo: "Più giorni",  cerca: "Conoscere la meta" },
  "Immersi nel verde":     { luogo: "Bosco",              cerca: "Pace e serenità" },
  "Luoghi dello spirito":  { cerca: "Pace e serenità",   compagnia: "Solo" },
  "Novità":                { cerca: "Tempo di qualità",   compagnia: "Gruppo di amici", tempo: "Intera giornata" },
  "Speciali":              { cerca: "Tempo di qualità",   compagnia: "Gruppo di amici" },
  "Tra mare e cielo":      { luogo: "Presenza di acqua",  cerca: "Conoscere la meta" },
  "Trek urbano":           { tempo: "Mezza giornata",    sforzo: "Basso" },
  "Tracce sulla neve":     { luogo: "Panoramico",        sforzo: "Intenso",    tempo: "Intera giornata" },
  "Cielo stellato":        { cerca: "Pace e serenità",   tempo: "Una settimana", compagnia: "Solo" },
};

const PROFILI = {
  base: {
    titolo: "L'Esploratore Curioso", sottotitolo: "Pronto a iniziare",
    descrizione: "Cerchi esperienze dolci e rigeneranti, perfette per muovere i primi passi in natura con curiosità.",
    icona: "🌱", colore: "#81ccb0", bg: "rgba(129,204,176,0.10)", border: "rgba(129,204,176,0.30)",
  },
  intermedio: {
    titolo: "Il Camminatore Consapevole", sottotitolo: "Esperienza in crescita",
    descrizione: "Hai già familiarità con l'outdoor. Sei pronto per avventure più strutturate e percorsi con un po' di sfida.",
    icona: "⛰️", colore: "#5aaadd", bg: "rgba(90,170,221,0.10)", border: "rgba(90,170,221,0.30)",
  },
  avanzato: {
    titolo: "L'Avventuriero Esperto", sottotitolo: "Pronto a osare",
    descrizione: "Cerchi esperienze intense e immersive, percorsi impegnativi e atmosfere selvagge lontano dalla folla.",
    icona: "🏔️", colore: "#9f8270", bg: "rgba(159,130,112,0.10)", border: "rgba(159,130,112,0.30)",
  },
} as const;

// ─── Scoring ───────────────────────────────────────────────────────────────────
function scoreEscursione(esc: Escursione, selectedItems: string[]): number {
  let score = 0;
  const t = esc.titolo?.toLowerCase() || "";
  const d = esc.descrizione?.toLowerCase() || "";
  const diffDB = esc.difficolta ?? "";
  const cat = esc.categoria?.toLowerCase() || "";
  const fs = FILOSOFIA_QUIZ_MAP[esc.filosofia ?? ""] ?? {};
  selectedItems.forEach(itemId => {
    const signals = ITEM_SIGNALS[itemId];
    Object.entries(signals).forEach(([dim, val]) => { if (fs[dim] === val) score += 8; });
    const sforzo = signals.sforzo;
    if (sforzo && diffDB) {
      if (sforzo === "Basso"    && (diffDB === "Facile" || diffDB === "Facile-Media"))          score += 4;
      if (sforzo === "Moderato" && (diffDB === "Facile-Media" || diffDB === "Media"))           score += 4;
      if (sforzo === "Medio"    && diffDB === "Media")                                          score += 4;
      if (sforzo === "Intenso"  && (diffDB === "Media-Impegnativa" || diffDB === "Impegnativa")) score += 4;
    }
    const tempo = signals.tempo;
    if (tempo) {
      if (tempo === "Mezza giornata"  && cat.includes("mezza"))                             score += 8;
      if (tempo === "Intera giornata" && (cat === "giornata" || cat.includes("intera")))    score += 8;
      if (tempo === "Una settimana"   && cat === "tour")                                    score += 8;
      if (tempo === "Più giorni"      && (cat === "giornata" || cat === "tour"))            score += 4;
    }
    const luogo = signals.luogo;
    if (luogo) {
      if (luogo === "Panoramico"        && (t.includes("cima") || t.includes("vetta") || d.includes("panoram"))) score += 4;
      if (luogo === "Bosco"             && (d.includes("bosco") || d.includes("foresta"))) score += 4;
      if (luogo === "Poco frequentato"  && (d.includes("nascost") || d.includes("solitari") || d.includes("selvag"))) score += 4;
      if (luogo === "Presenza di acqua" && (t.includes("lago") || t.includes("mare") || d.includes("acqua"))) score += 4;
    }
    const cerca = signals.cerca;
    if (cerca) {
      if (cerca === "Pace e serenità"   && d.includes("pace"))                                                score += 3;
      if (cerca === "Conoscere la meta" && (d.includes("storia") || d.includes("cultura") || d.includes("scopri"))) score += 3;
      if (cerca === "Tempo di qualità"  && (d.includes("esperienz") || d.includes("emozione")))              score += 3;
    }
  });
  return score;
}

function computeProfile(selectedItems: string[]): keyof typeof PROFILI {
  const weight = selectedItems.reduce((acc, id) => acc + (ITEM_WEIGHT[id] ?? 0), 0);
  if (weight >= 4) return "avanzato";
  if (weight >= 2) return "intermedio";
  return "base";
}

// ─── BackpackSVG (da CorsiquizNuovo) ──────────────────────────────────────────
function BackpackSVG({ glowing, itemCount }: { glowing: boolean; itemCount: number }) {
  return (
    <motion.div style={{ transformOrigin: "50% 10%", position: "relative" }}>
      <motion.div
        key={itemCount}
        initial={false}
        animate={itemCount > 0
          ? { y: [0, 7, -2, 1, 0], scaleY: [1, 1.04, 0.97, 1.01, 1], scaleX: [1, 0.98, 1.02, 1, 1] }
          : {}}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ transformOrigin: "50% 100%", position: "relative" }}
      >
        <motion.div
          animate={glowing ? { scale: [1, 1.03, 1.02, 1.04, 1], rotate: [0, -1, 1, -0.6, 0] } : { scale: 1 }}
          transition={glowing ? { duration: 0.65 } : {}}
          style={{ position: "relative" }}
        >
          <AnimatePresence>
            {glowing && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: [0.3, 0.65, 0.3] }} exit={{ opacity: 0 }}
                transition={{ duration: 1.8, repeat: Infinity }}
                style={{
                  position: "absolute", inset: "-20%", borderRadius: "50%", zIndex: 0,
                  background: "radial-gradient(ellipse at 50% 55%, rgba(129,204,176,0.6) 0%, rgba(129,204,176,0.2) 45%, transparent 70%)",
                  filter: "blur(16px)", pointerEvents: "none",
                }}
              />
            )}
          </AnimatePresence>
          <motion.div
            animate={{ scaleX: glowing ? 1.2 : itemCount > 0 ? 1.05 : 0.85, opacity: glowing ? 0.45 : 0.22 }}
            transition={{ duration: 0.4 }}
            style={{
              position: "absolute", bottom: "-4%", left: "15%", right: "15%", height: "12px",
              borderRadius: "50%", background: "radial-gradient(ellipse, rgba(60,100,60,0.4) 0%, transparent 70%)",
              filter: "blur(4px)", zIndex: 0, pointerEvents: "none",
            }}
          />
          <img
            src="/zaino.png" alt="Zaino da trekking" draggable={false}
            style={{
              width: "100%", height: "auto", display: "block", position: "relative", zIndex: 1,
              filter: glowing
                ? "drop-shadow(0 0 14px rgba(129,204,176,0.8)) brightness(1.05)"
                : `drop-shadow(0 ${4 + itemCount * 2}px ${8 + itemCount * 3}px rgba(60,100,60,0.22))`,
              transition: "filter 0.4s ease",
            }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ─── Componente ItemCard Aggiornato con Safe Responsive Modal/Tooltip ────────────────
// Sostituisci l'intero componente ItemCard nel tuo file AttivitaQuiz.tsx
// (dovrebbe trovarsi intorno alla riga 210-360 del file originale)

function ItemCard({
  item,
  isIn,
  isDisabled,
  onAdd,
  onRemove,
}: {
  item: Item;
  isIn: boolean;
  isDisabled: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const [showPopup, setShowPopup] = useState(false);
  const itemCardRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Rileva se il viewport è mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // Corrisponde al breakpoint 'sm' di Tailwind
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Gestione dello scroll del body quando il modal mobile è aperto
  useEffect(() => {
    if (showPopup && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showPopup, isMobile]);

  // Logica di posizionamento intelligente per desktop tooltip
  const getDesktopTooltipPositionClasses = () => {
    if (item.zone === "bottom") {
      return "bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 origin-bottom";
    } else if (item.zone === "left") {
      return "top-1/2 -translate-y-1/2 left-[calc(100%+12px)] origin-left";
    } else {
      return "top-1/2 -translate-y-1/2 right-[calc(100%+12px)] origin-right";
    }
  };

  // Logica per la freccina del desktop tooltip
  const getDesktopArrowClasses = () => {
    if (item.zone === "bottom") {
      return "bottom-[-4px] left-1/2 -translate-x-1/2 rotate-45";
    } else if (item.zone === "left") {
      return "top-1/2 -translate-y-1/2 left-[-4px] rotate-45";
    } else {
      return "top-1/2 -translate-y-1/2 right-[-4px] rotate-45";
    }
  };

  return (
    <div className="relative" ref={itemCardRef}>
      <motion.button
        whileHover={!isDisabled ? { scale: 1.05, y: -2 } : {}}
        whileTap={!isDisabled ? { scale: 0.95 } : {}}
        onClick={() => {
          if (isDisabled) return;
          if (isIn) onRemove();
          else setShowPopup(true);
        }}
        className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl transition-all duration-300 ${
          isIn
            ? "bg-white shadow-[0_4px_12px_rgba(129,204,176,0.4),0_0_0_2px_#81ccb0] z-10"
            : isDisabled
            ? "bg-stone-100 opacity-40 cursor-not-allowed grayscale"
            : "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_16px_rgba(159,130,112,0.15),0_0_0_1px_rgba(159,130,112,0.1)]"
        }`}
      >
        <span className={isIn ? "opacity-100" : "opacity-80"}>{item.emoji}</span>
        {isIn && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#81ccb0] rounded-full flex items-center justify-center text-white shadow-sm"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </motion.div>
        )}
      </motion.button>

      <AnimatePresence>
        {showPopup && (
          <>
            {/* Backdrop per Mobile Modal e Desktop Tooltip (per chiusura click-outside) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed inset-0 z-[9998] ${isMobile ? "bg-black/60 backdrop-blur-md" : ""}`}
              onClick={() => setShowPopup(false)}
            />

            {/* Contenuto del Popup (Modal su Mobile, Tooltip su Desktop) */}
            <motion.div
              initial={{ opacity: 0, scale: isMobile ? 0.95 : 0.88, y: isMobile ? 20 : 0 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: isMobile ? 0.95 : 0.88, y: isMobile ? 20 : 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              className={`rounded-2xl p-3.5 sm:p-4 z-[9999] ${isMobile ? "fixed inset-0 flex items-center justify-center p-4" : `absolute w-[220px] sm:w-56 ${getDesktopTooltipPositionClasses()}`}`}
              style={{
                background: "white",
                boxShadow: "0 12px 40px rgba(159,130,112,0.25), 0 0 0 1.5px rgba(159,130,112,0.15)",
              }}
            >
              {/* Contenitore interno per il modal mobile */}
              {isMobile ? (
                <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl p-3.5 sm:p-4"
                  style={{
                    background: "white",
                    boxShadow: "0 12px 40px rgba(159,130,112,0.25), 0 0 0 1.5px rgba(159,130,112,0.15)",
                  }}
                >
                  <div className="flex items-start justify-between gap-1.5 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg sm:text-xl leading-none">{item.emoji}</span>
                      <span
                        className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full leading-none"
                        style={{ background: "rgba(129,204,176,0.15)", color: "#81ccb0", border: "1px solid rgba(129,204,176,0.3)" }}
                      >
                        {item.hintTag}
                      </span>
                    </div>
                    <button onClick={() => setShowPopup(false)} className="text-stone-300 hover:text-stone-500 transition-colors flex-shrink-0 p-1">
                      <X size={14} />
                    </button>
                  </div>

                  <p className="text-[11px] sm:text-xs text-stone-500 leading-relaxed font-medium mb-3.5">
                    {item.hint}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPopup(false)}
                      className="flex-1 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-stone-400 border border-stone-200 hover:border-stone-300 hover:bg-stone-50 active:scale-95 transition-all"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={() => { setShowPopup(false); onAdd(); }}
                      className="flex-[1.5] py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white active:scale-95 transition-all shadow-md"
                      style={{ background: "linear-gradient(135deg, #81ccb0, #5aa89a)" }}
                    >
                      Aggiungi ✓
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Freccietta per Desktop Tooltip */}
                  <div
                    className={`absolute w-3 h-3 bg-white ${getDesktopArrowClasses()}`}
                    style={{
                      boxShadow: item.zone === "bottom" ? "2px 2px 2px rgba(159,130,112,0.05)" : "-1px -1px 2px rgba(159,130,112,0.12)",
                      zIndex: -1,
                    }}
                  />

                  <div className="flex items-start justify-between gap-1.5 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg sm:text-xl leading-none">{item.emoji}</span>
                      <span
                        className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full leading-none"
                        style={{ background: "rgba(129,204,176,0.15)", color: "#81ccb0", border: "1px solid rgba(129,204,176,0.3)" }}
                      >
                        {item.hintTag}
                      </span>
                    </div>
                    <button onClick={() => setShowPopup(false)} className="text-stone-300 hover:text-stone-500 transition-colors flex-shrink-0 p-1">
                      <X size={14} />
                    </button>
                  </div>

                  <p className="text-[11px] sm:text-xs text-stone-500 leading-relaxed font-medium mb-3.5">
                    {item.hint}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPopup(false)}
                      className="flex-1 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-stone-400 border border-stone-200 hover:border-stone-300 hover:bg-stone-50 active:scale-95 transition-all"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={() => { setShowPopup(false); onAdd(); }}
                      className="flex-[1.5] py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white active:scale-95 transition-all shadow-md"
                      style={{ background: "linear-gradient(135deg, #81ccb0, #5aa89a)" }}
                    >
                      Aggiungi ✓
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Componente principale ──────────────────────────────────────────────────────
interface AttivitaQuizProps {
  onBookingClick: (title: string, mode?: "info" | "prenota") => void;
}

export default function AttivitaQuiz({ onBookingClick }: AttivitaQuizProps) {
  const [step, setStep] = useState<"items" | "result">("items");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [recommended, setRecommended] = useState<Escursione | null>(null);
  const [profile, setProfile] = useState<keyof typeof PROFILI>("base");
  const [escursioniPool, setEscursioniPool] = useState<Escursione[]>([]);
  const [shownIds, setShownIds] = useState<string[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isComputing, setIsComputing] = useState(false);

  useEffect(() => {
    supabase.from("escursioni").select("*").eq("is_active", true).order("data", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setEscursioniPool((data as any[]).map(e => ({ ...e, _tipo: "escursione" })));
      });
  }, []);

  const isFull = selectedItems.length === 3;
  const addItem    = (id: string) => { if (!isFull) setSelectedItems(p => [...p, id]); };
  const removeItem = (id: string) => setSelectedItems(p => p.filter(i => i !== id));

  const compute = () => {
    if (!isFull || escursioniPool.length === 0) return;
    setIsComputing(true);
    setTimeout(() => {
      let bestMatch = escursioniPool[0];
      let maxScore = -Infinity;
      escursioniPool.forEach(esc => {
        let s = scoreEscursione(esc, selectedItems);
        if (shownIds.includes(esc.id)) s -= 14;
        s += Math.random() * 2;
        if (s > maxScore) { maxScore = s; bestMatch = esc; }
      });
      setRecommended(bestMatch);
      setShownIds(prev => [...prev, bestMatch.id]);
      setProfile(computeProfile(selectedItems));
      setIsComputing(false);
      setStep("result");
    }, 600);
  };

  const reset = () => { setStep("items"); setSelectedItems([]); setRecommended(null); };

  const leftItems   = ITEMS.filter(i => i.zone === "left").sort((a, b) => (a.zoneRow||0) - (b.zoneRow||0));
  const rightItems  = ITEMS.filter(i => i.zone === "right").sort((a, b) => (a.zoneRow||0) - (b.zoneRow||0));
  const bottomItems = ITEMS.filter(i => i.zone === "bottom");
  const currentProfile = PROFILI[profile];

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

        {/* ── STEP items ────────────────────────────────────────────────── */}
        {step === "items" && (
          <motion.div key="items" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}
            className="p-5 sm:p-7 md:p-8"
          >
            <div className="mb-5">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1" style={{ color: "#81ccb0" }}>
                Trova la tua escursione
              </p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#44403c] uppercase tracking-tighter leading-[0.9] mb-1">
                Cosa metti<br />
                <span className="font-light italic" style={{ color: "#9f8270" }}>nel tuo zaino?</span>
              </h2>
              <div className="h-1 w-10 rounded-full mt-2.5" style={{ background: "#81ccb0" }} />
              <p className="text-stone-400 text-xs font-medium mt-2.5">
                Scegli <strong className="text-[#44403c]">3 oggetti</strong> — tocca un oggetto per scoprire cosa rappresenta
              </p>
            </div>

            <div className="flex gap-2 sm:gap-4 items-center mb-3">
              {/* Colonna sinistra */}
              <div className="flex flex-col gap-3 sm:gap-4 items-center w-14 sm:w-16 shrink-0">
                {leftItems.map(item => (
                  <ItemCard key={item.id} item={item}
                    isIn={selectedItems.includes(item.id)}
                    isDisabled={!selectedItems.includes(item.id) && isFull}
                    onAdd={() => addItem(item.id)} onRemove={() => removeItem(item.id)}
                  />
                ))}
              </div>

              {/* Centro zaino */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative w-full mx-auto" style={{ maxWidth: "520px" }}>
                  <BackpackSVG glowing={isFull} itemCount={selectedItems.length} />
                </div>
                <div className="flex gap-2 mt-3 min-h-[44px] items-center justify-center">
                  <AnimatePresence>
                    {selectedItems.map(id => {
                      const it = ITEMS.find(i => i.id === id);
                      return (
                        <motion.button key={id}
                          initial={{ opacity: 0, scale: 0.5, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.5, y: 8 }}
                          transition={{ type: "spring", stiffness: 400, damping: 24 }}
                          onClick={() => removeItem(id)}
                          className="relative w-11 h-11 rounded-2xl flex items-center justify-center text-2xl focus:outline-none active:scale-90"
                          style={{ background: "white", boxShadow: "0 2px 8px rgba(129,204,176,0.3), 0 0 0 2px #81ccb0" }}
                          title={`Rimuovi ${it?.label}`}
                        >
                          {it?.emoji}
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-stone-400 text-white flex items-center justify-center text-[9px] font-black leading-none">✕</span>
                        </motion.button>
                      );
                    })}
                    {selectedItems.length === 0 && (
                      <p className="text-[9px] font-medium text-stone-300 tracking-wide">Nessun oggetto selezionato</p>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex gap-2 mt-2">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i}
                      animate={{ backgroundColor: i < selectedItems.length ? "#81ccb0" : "#d6d3d1", scale: i < selectedItems.length ? 1.3 : 1 }}
                      transition={{ duration: 0.22 }}
                      className="w-2 h-2 rounded-full"
                    />
                  ))}
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mt-1">{selectedItems.length}/3</p>
              </div>

              {/* Colonna destra */}
              <div className="flex flex-col gap-3 sm:gap-4 items-center w-14 sm:w-16 shrink-0">
                {rightItems.map(item => (
                  <ItemCard key={item.id} item={item}
                    isIn={selectedItems.includes(item.id)}
                    isDisabled={!selectedItems.includes(item.id) && isFull}
                    onAdd={() => addItem(item.id)} onRemove={() => removeItem(item.id)}
                  />
                ))}
              </div>
            </div>

            {/* Riga in basso */}
            <div className="flex justify-center gap-3 sm:gap-6 py-3 px-2 rounded-2xl mb-4"
              style={{ background: "rgba(90,170,221,0.06)", border: "1px dashed rgba(90,170,221,0.2)" }}
            >
              {bottomItems.map(item => (
                <ItemCard key={item.id} item={item}
                  isIn={selectedItems.includes(item.id)}
                  isDisabled={!selectedItems.includes(item.id) && isFull}
                  onAdd={() => addItem(item.id)} onRemove={() => removeItem(item.id)}
                />
              ))}
            </div>

            <AnimatePresence>
              {isFull && (
                <motion.button
                  initial={{ opacity: 0, y: 12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  onClick={compute} disabled={isComputing}
                  className="w-full min-h-[52px] py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-white flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #81ccb0 0%, #5aa89a 100%)", boxShadow: "0 8px 28px rgba(129,204,176,0.35)" }}
                >
                  {isComputing
                    ? <><span className="animate-spin text-base">🧭</span> Analisi in corso…</>
                    : <><Sparkles size={14} /> Scopri l'escursione perfetta <ArrowRight size={14} /></>
                  }
                </motion.button>
              )}
            </AnimatePresence>

            {!isFull && selectedItems.length > 0 && (
              <p className="text-center text-[9px] font-medium text-stone-400 mt-2">
                Ancora {3 - selectedItems.length} {3 - selectedItems.length === 1 ? "oggetto" : "oggetti"}
              </p>
            )}
          </motion.div>
        )}

        {/* ── STEP result ───────────────────────────────────────────────── */}
        {step === "result" && recommended && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}
            className="p-5 sm:p-7 md:p-10"
          >
            <div className="flex justify-center gap-3 mb-5">
              {selectedItems.map((id, idx) => {
                const it = ITEMS.find(i => i.id === id);
                return (
                  <motion.div key={id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 + idx * 0.07 }}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl"
                      style={{ background: "white", boxShadow: "0 2px 10px rgba(159,130,112,0.12), 0 0 0 2px rgba(129,204,176,0.4)" }}>
                      {it?.emoji}
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-wider text-stone-400 text-center leading-tight max-w-[52px]">
                      {it?.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="rounded-2xl p-4 mb-4 text-center"
              style={{ background: currentProfile.bg, border: `1.5px solid ${currentProfile.border}` }}
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 16 }}
                className="text-4xl mb-2"
              >
                {currentProfile.icona}
              </motion.div>
              <h3 className="text-xl font-black uppercase tracking-tighter mb-0.5" style={{ color: currentProfile.colore }}>
                {currentProfile.titolo}
              </h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-2">{currentProfile.sottotitolo}</p>
              <p className="text-xs text-stone-500 font-medium leading-relaxed">{currentProfile.descrizione}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
              className="rounded-2xl overflow-hidden mb-4"
              style={{ background: "white", boxShadow: "0 2px 12px rgba(159,130,112,0.1), 0 0 0 1px rgba(159,130,112,0.08)" }}
            >
              <div className="relative h-44">
                <img src={recommended.immagine_url || "/altour-logo.png"} className="w-full h-full object-cover" alt={recommended.titolo} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/70 mb-0.5">
                    {recommended.filosofia || recommended.difficolta || "Escursione"}
                  </p>
                  <h4 className="text-base font-black uppercase text-white leading-tight line-clamp-2">{recommended.titolo}</h4>
                </div>
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-white"
                  style={{ background: currentProfile.colore }}>
                  ✦ Per te
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-stone-500 leading-relaxed line-clamp-2 mb-3 font-medium">{recommended.descrizione}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xl font-black" style={{ color: "#44403c" }}>
                    {recommended.prezzo ? `€${recommended.prezzo}` : "—"}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSelectedActivity(recommended); setIsDetailOpen(true); }}
                      className="py-2.5 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all active:scale-95"
                      style={{ background: "white", boxShadow: "0 2px 8px rgba(159,130,112,0.1), 0 0 0 1.5px rgba(159,130,112,0.2)", color: "#44403c" }}
                    >
                      Dettagli
                    </button>
                    <button
                      onClick={() => onBookingClick(recommended.titolo, "info")}
                      className="py-2.5 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest text-white active:scale-95 transition-all"
                      style={{ background: `linear-gradient(135deg, ${currentProfile.colore}, ${currentProfile.colore}cc)`, boxShadow: `0 4px 16px ${currentProfile.colore}40` }}
                    >
                      Richiedi Info
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.44 }} className="flex gap-2">
              <button
                onClick={() => {
                  setIsComputing(true);
                  setTimeout(() => {
                    let bestMatch = escursioniPool[0]; let maxScore = -Infinity;
                    escursioniPool.forEach(esc => {
                      let s = scoreEscursione(esc, selectedItems);
                      if (shownIds.includes(esc.id)) s -= 14;
                      s += Math.random() * 2;
                      if (s > maxScore) { maxScore = s; bestMatch = esc; }
                    });
                    setRecommended(bestMatch); setShownIds(prev => [...prev, bestMatch.id]); setIsComputing(false);
                  }, 400);
                }}
                className="flex-1 min-h-[48px] py-3.5 rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 active:scale-95 hover:bg-stone-100 transition-all"
                style={{ background: "white", boxShadow: "0 2px 8px rgba(159,130,112,0.1), 0 0 0 1.5px rgba(159,130,112,0.15)", color: "#44403c" }}
              >
                <RotateCcw size={11} /> Altra proposta
              </button>
              <button
                onClick={reset}
                className="flex-1 min-h-[48px] py-3.5 rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 active:scale-95 hover:bg-stone-100 transition-all"
                style={{ background: "white", boxShadow: "0 2px 8px rgba(159,130,112,0.1), 0 0 0 1.5px rgba(159,130,112,0.15)", color: "#44403c" }}
              >
                <Sparkles size={11} /> Cambia zaino
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onBookingClick={onBookingClick}
      />
    </div>
  );
}