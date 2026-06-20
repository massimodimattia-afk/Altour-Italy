import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, RotateCcw, Sparkles, X, Check } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/supabase";
import ActivityDetailModal from "./ActivityDetailModal";

// ─── Types ────────────────────────────────────────────────────────────────────
type Escursione = Database["public"]["Tables"]["escursioni"]["Row"] & {
  filosofia?: string | null;
  lunghezza?: number | null;
  lat?: number | null;
  lng?: number | null;
  _tipo?: "escursione";
};

interface Item {
  id: string;
  emoji: string;
  label: string;
  zone: "left" | "bottom" | "right";
  zoneRow?: number;
  hint: string;
  hintTag: string;
}

type ItemThemeMapping = {
  categorie: string[];
  filosofie: string[];
  fallback: string[];
};

// ─── Configurazione Oggetti & Mapping ──────────────────────────────────────────
const ITEMS: Item[] = [
  { id: "map", emoji: "🗺️", label: "Cartina", zone: "left", zoneRow: 1, hint: "Ami conoscere la meta prima di partire. Cerchi percorsi culturali o naturalistici.", hintTag: "Scoperta" },
  { id: "boots", emoji: "🥾", label: "Scarponi", zone: "left", zoneRow: 2, hint: "Esci regolarmente e cerchi esperienze di qualità. Il giusto equilibrio tra impegno e relax.", hintTag: "Regolarità" },
  { id: "poles", emoji: "🥢", label: "Bastoncini", zone: "left", zoneRow: 3, hint: "Preferisci percorsi impegnativi con dislivelli importanti e sfide fisiche.", hintTag: "Performance" },
  { id: "compass", emoji: "🧭", label: "Bussola", zone: "bottom", hint: "Ti piace esplorare in solitaria in luoghi poco battuti. Cerchi pace e autonomia.", hintTag: "Esplorazione" },
  { id: "water", emoji: "🧴", label: "Borraccia", zone: "bottom", hint: "Preferisci uscite brevi e accessibili, ideali per famiglie o camminate rigeneranti.", hintTag: "Easy" },
  { id: "medkit", emoji: "🩹", label: "Kit soccorso", zone: "bottom", hint: "Sei prudente e previdente. Ti avvicini alla montagna con calma e sicurezza.", hintTag: "Prudenza" },
  { id: "jacket", emoji: "🧥", label: "Giacca", zone: "right", zoneRow: 1, hint: "Punti in alto: vette, creste e panorami. Non ti spaventa la fatica né il freddo.", hintTag: "Alta Quota" },
  { id: "torch", emoji: "🔦", label: "Frontale", zone: "right", zoneRow: 2, hint: "Cerchi avventure lunghe o notturne. Ti piace l'isolamento e il silenzio.", hintTag: "Avventura" },
  { id: "gps", emoji: "📡", label: "GPS", zone: "right", zoneRow: 3, hint: "Esplori zone selvagge. La tecnologia è la tua sicurezza fuori dai sentieri battuti.", hintTag: "Wild" },
];

const ITEM_THEME_MAPPING: Record<string, ItemThemeMapping> = {
  map: { categorie: ["tour", "intera giornata", "giornata"], filosofie: ["Borghi più belli", "Formazione", "Trek urbano", "Eventi", "Acqua e cielo"], fallback: ["Cammini"] },
  boots: { categorie: ["tour", "mezza giornata"], filosofie: ["Avventura", "Cammini", "Immersi nel verde"], fallback: ["Formazione"] },
  poles: { categorie: ["intera giornata", "giornata", "tour"], filosofie: ["Avventura", "Tracce sulla neve"], fallback: ["Immersi nel verde"] },
  compass: { categorie: ["intera giornata", "giornata"], filosofie: ["Luoghi dello spirito", "Novità", "Immersi nel verde"], fallback: ["Avventura"] },
  water: { categorie: ["mezza giornata"], filosofie: ["Benessere", "Trek urbano", "Acqua e cielo", "Educazione all'aperto"], fallback: ["Immersi nel verde"] },
  medkit: { categorie: ["mezza giornata"], filosofie: ["Educazione all'aperto", "Benessere"], fallback: ["Formazione"] },
  jacket: { categorie: ["intera giornata", "giornata", "tour"], filosofie: ["Tracce sulla neve", "Speciali"], fallback: ["Avventura"] },
  torch: { categorie: ["tour"], filosofie: ["Cielo stellato", "Cammini", "Avventura"], fallback: ["Immersi nel verde", "Speciali"] },
  gps: { categorie: ["intera giornata", "giornata", "tour"], filosofie: ["Avventura", "Novità"], fallback: ["Tracce sulla neve", "Speciali"] },
};

const ITEM_WEIGHT: Record<string, number> = {
  poles: 2, jacket: 2, gps: 2, torch: 2,
  boots: 1, compass: 1,
  map: 0, water: 0, medkit: 0,
};

const PROFILI = {
  base: { titolo: "L'Esploratore Curioso", sottotitolo: "Pronto a iniziare", descrizione: "Cerchi esperienze dolci e rigeneranti, perfette per muovere i primi passi in natura con curiosità.", icona: "🌱", colore: "#81ccb0", bg: "rgba(129,204,176,0.10)", border: "rgba(129,204,176,0.30)" },
  intermedio: { titolo: "Il Camminatore Consapevole", sottotitolo: "Esperienza in crescita", descrizione: "Hai già familiarità con l'outdoor. Sei pronto per avventure più strutturate e percorsi con un po' di sfida.", icona: "⛰️", colore: "#5aaadd", bg: "rgba(90,170,221,0.10)", border: "rgba(90,170,221,0.30)" },
  avanzato: { titolo: "L'Avventuriero Esperto", sottotitolo: "Pronto a osare", descrizione: "Cerchi esperienze intense e immersive, percorsi impegnativi e atmosfere selvagge lontano dalla folla.", icona: "🏔️", colore: "#9f8270", bg: "rgba(159,130,112,0.10)", border: "rgba(159,130,112,0.30)" },
} as const;

const PROFILE_DIFFICULTY_MAP: Record<keyof typeof PROFILI, string[]> = {
  base: ["Facile", "Facile-Media", "Media"],
  intermedio: ["Facile-Media", "Media", "Media-Impegnativa"],
  avanzato: ["Media", "Media-Impegnativa", "Impegnativa", "Molto Impegnativa"]
};

function scoreEscursione(esc: Escursione, selectedItems: string[]): number {
  let score = 0;
  const catDB = esc.categoria?.toLowerCase() || "";
  const filoDB = esc.filosofia || "";

  selectedItems.forEach(itemId => {
    const mapping = ITEM_THEME_MAPPING[itemId];
    if (!mapping) return;
    if (mapping.filosofie.includes(filoDB)) score += 15;
    else if (mapping.fallback.includes(filoDB)) score += 8;
    if (mapping.categorie.some(c => catDB.includes(c))) score += 10;
  });

  const has = (id: string) => selectedItems.includes(id);
  if (has("map") && has("gps") && (filoDB === "Avventura" || filoDB === "Novità")) score += 25;
  if (has("compass") && has("torch") && (filoDB === "Luoghi dello spirito" || filoDB === "Cammini")) score += 25;
  if (has("water") && has("medkit") && (filoDB === "Benessere" || filoDB === "Educazione all'aperto")) score += 25;
  if (has("poles") && has("jacket") && (filoDB === "Tracce sulla neve" || filoDB === "Avventura")) score += 25;

  return score;
}

function computeProfile(selectedItems: string[]): keyof typeof PROFILI {
  const weight = selectedItems.reduce((acc, id) => acc + (ITEM_WEIGHT[id] ?? 0), 0);
  if (weight >= 4) return "avanzato";
  if (weight >= 2) return "intermedio";
  return "base";
}

// ─── Sub-Component: BackpackSVG ────────────────────────────────────────────────
function BackpackSVG({ glowing, itemCount }: { glowing: boolean; itemCount: number }) {
  return (
    <div className="relative w-full max-w-[280px] mx-auto py-4">
      <motion.div
        animate={glowing ? { scale: [1, 1.05, 1], rotate: [0, -1, 1, 0] } : { scale: 1 }}
        transition={{ duration: 0.6, repeat: glowing ? Infinity : 0 }}
        className="relative z-10"
        style={{ transform: "translateZ(0)", WebkitBackfaceVisibility: "hidden" }}
      >
        <AnimatePresence>
          {glowing && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: [0.2, 0.5, 0.2] }} exit={{ opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-[-20%] rounded-full z-0 blur-2xl"
              style={{ background: "radial-gradient(circle, rgba(129,204,176,0.4) 0%, transparent 70%)" }}
            />
          )}
        </AnimatePresence>
        <img
          src="/zaino.png" alt="Zaino da trekking" draggable={false}
          className="w-full h-auto drop-shadow-2xl relative z-10 select-none"
          style={{
            filter: glowing
              ? "drop-shadow(0 0 14px rgba(129,204,176,0.8)) brightness(1.05)"
              : `drop-shadow(0 ${4 + itemCount * 2}px ${8 + itemCount * 3}px rgba(60,100,60,0.22))`,
            transition: "filter 0.4s ease",
          }}
        />
      </motion.div>
    </div>
  );
}

// ─── Sub-Component: ItemCard ───────────────────────────────────────────────────
function ItemCard({ item, isIn, isDisabled, onAdd, onRemove }: any) {
  const [showPopup, setShowPopup] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Scroll-lock robusto (con ripristino posizione) quando il popup è apert su mobile
  useEffect(() => {
    if (showPopup && isMobile) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [showPopup, isMobile]);

  const getTooltipPosition = () => {
    if (item.zone === "bottom") return "bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 origin-bottom";
    if (item.zone === "left") return "top-1/2 -translate-y-1/2 left-[calc(100%+12px)] origin-left";
    return "top-1/2 -translate-y-1/2 right-[calc(100%+12px)] origin-right";
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={!isDisabled ? { scale: 1.08 } : {}}
        whileTap={{ scale: 0.92 }}
        onClick={() => {
          if (isDisabled) return;
          isIn ? onRemove() : setShowPopup(true);
        }}
        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl transition-all shadow-sm border ${
          isIn ? "bg-white border-[#81ccb0] shadow-lg z-10" : isDisabled ? "bg-stone-100 opacity-30 grayscale" : "bg-white border-transparent"
        }`}
        style={{ transform: "translateZ(0)", WebkitBackfaceVisibility: "hidden" }}
      >
        <span className={isIn ? "opacity-100" : "opacity-80"}>{item.emoji}</span>
        {isIn && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#81ccb0] rounded-full flex items-center justify-center text-white">
            <Check size={12} strokeWidth={4} />
          </motion.div>
        )}
      </motion.button>

      <AnimatePresence>
        {showPopup && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className={`fixed inset-0 z-[100] ${isMobile ? "bg-black/40" : "bg-transparent"}`}
              style={isMobile ? {
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                transform: "translateZ(0)",
                WebkitBackfaceVisibility: "hidden",
              } : undefined}
              onClick={() => setShowPopup(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: isMobile ? 20 : 0 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: isMobile ? 20 : 0 }}
              transition={{ duration: 0.18 }}
              className={`z-[101] ${isMobile ? "fixed inset-0 flex items-center justify-center p-6" : `absolute w-64 ${getTooltipPosition()}`}`}
              style={{ transform: "translateZ(0)", WebkitBackfaceVisibility: "hidden" }}
            >
              <div className="bg-white rounded-3xl p-6 shadow-2xl border border-stone-100 w-full max-w-[320px]">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#81ccb0] bg-[#81ccb0]/10 px-2 py-1 rounded-full">
                      {item.hintTag}
                    </span>
                  </div>
                  <button onClick={() => setShowPopup(false)} className="text-stone-300 hover:text-stone-500"><X size={18}/></button>
                </div>
                <p className="text-sm text-stone-500 leading-relaxed mb-6 font-medium">{item.hint}</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowPopup(false)} className="flex-1 py-3 text-[10px] font-black uppercase text-stone-400 border border-stone-100 rounded-2xl">Chiudi</button>
                  <button onClick={() => { setShowPopup(false); onAdd(); }} className="flex-[2] py-3 text-[10px] font-black uppercase text-white bg-[#81ccb0] rounded-2xl shadow-lg shadow-[#81ccb0]/30">Aggiungi ✓</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface AttivitaQuizProps {
  onBookingClick: (title: string, mode?: "info" | "prenota") => void;
  /** Se fornito, evita la fetch interna a Supabase (passata già da AttivitaPage) */
  escursioni?: Escursione[];
  /** Nasconde il titolo interno (usato quando il drawer ha già il proprio header) */
  hideHeader?: boolean;
}

export default function AttivitaQuiz({ onBookingClick, escursioni, hideHeader }: AttivitaQuizProps) {
  const [step, setStep] = useState<"items" | "result">("items");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [recommended, setRecommended] = useState<Escursione | null>(null);
  const [profile, setProfile] = useState<keyof typeof PROFILI>("base");
  const [escursioniPool, setEscursioniPool] = useState<Escursione[]>(escursioni ?? []);
  const [shownIds, setShownIds] = useState<string[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isComputing, setIsComputing] = useState(false);

  // Fetch interna SOLO se il parent non ha già fornito i dati (evita doppia query Supabase)
  useEffect(() => {
    if (escursioni && escursioni.length > 0) {
      setEscursioniPool(escursioni);
      return;
    }
    supabase.from("escursioni").select("*").eq("is_active", true).order("data", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setEscursioniPool((data as any[]).map(e => ({ ...e, _tipo: "escursione" })));
      });
  }, [escursioni]);

  const isFull = selectedItems.length === 3;
  const addItem = (id: string) => !isFull && setSelectedItems(p => [...p, id]);
  const removeItem = (id: string) => setSelectedItems(p => p.filter(i => i !== id));

  const runAnalysis = () => {
    if (!isFull || escursioniPool.length === 0) return;
    setIsComputing(true);

    setTimeout(() => {
      const currentProfileKey = computeProfile(selectedItems);
      setProfile(currentProfileKey);

      const allowedDifficulties = PROFILE_DIFFICULTY_MAP[currentProfileKey];

      let poolSicuro = escursioniPool.filter(esc => {
        const diff = esc.difficolta || "Media";
        return allowedDifficulties.includes(diff);
      });

      if (poolSicuro.length === 0) poolSicuro = escursioniPool;

      let bestMatch = poolSicuro[0];
      let maxScore = -Infinity;

      poolSicuro.forEach(esc => {
        let currentScore = scoreEscursione(esc, selectedItems);
        if (shownIds.includes(esc.id)) currentScore -= 30;
        currentScore += Math.random() * 2;
        if (currentScore > maxScore) {
          maxScore = currentScore;
          bestMatch = esc;
        }
      });

      setRecommended(bestMatch);
      setShownIds(prev => [...prev, bestMatch.id]);
      setIsComputing(false);
      setStep("result");
    }, 1200);
  };

  const reset = () => { setStep("items"); setSelectedItems([]); setRecommended(null); };

  const leftItems = ITEMS.filter(i => i.zone === "left").sort((a, b) => (a.zoneRow || 0) - (b.zoneRow || 0));
  const rightItems = ITEMS.filter(i => i.zone === "right").sort((a, b) => (a.zoneRow || 0) - (b.zoneRow || 0));
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
        {step === "items" && (
          <motion.div key="items" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.25 }} className="p-5 sm:p-7 md:p-8">
            {!hideHeader && (
              <div className="mb-5">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1" style={{ color: "#81ccb0" }}>Trova la tua escursione</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#44403c] uppercase tracking-tighter leading-[0.9] mb-1">
                  Cosa metti<br />
                  <span className="font-light italic" style={{ color: "#9f8270" }}>nel tuo zaino?</span>
                </h2>
                <div className="h-1 w-10 rounded-full mt-2.5" style={{ background: "#81ccb0" }} />
                <p className="text-stone-400 text-xs font-medium mt-2.5">
                  Scegli <strong className="text-[#44403c]">3 oggetti</strong> — tocca un oggetto per scoprire cosa rappresenta
                </p>
              </div>
            )}

            <div className="flex gap-2 sm:gap-4 items-center mb-3">
              <div className="flex flex-col gap-3 sm:gap-4 items-center w-14 sm:w-16 shrink-0">
                {leftItems.map(item => (
                  <ItemCard key={item.id} item={item} isIn={selectedItems.includes(item.id)} isDisabled={!selectedItems.includes(item.id) && isFull} onAdd={() => addItem(item.id)} onRemove={() => removeItem(item.id)} />
                ))}
              </div>

              <div className="flex-1 flex flex-col items-center justify-center">
                <BackpackSVG glowing={isFull} itemCount={selectedItems.length} />
                <div className="flex gap-2 mt-3 min-h-[44px] items-center justify-center">
                  <AnimatePresence>
                    {selectedItems.map(id => {
                      const it = ITEMS.find(i => i.id === id);
                      return (
                        <motion.button key={id} initial={{ opacity: 0, scale: 0.5, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.5, y: 8 }} onClick={() => removeItem(id)} className="relative w-11 h-11 rounded-2xl flex items-center justify-center text-2xl focus:outline-none active:scale-90" style={{ background: "white", boxShadow: "0 2px 8px rgba(129,204,176,0.3), 0 0 0 2px #81ccb0" }}>
                          {it?.emoji}
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-stone-400 text-white flex items-center justify-center text-[9px] font-black leading-none">✕</span>
                        </motion.button>
                      );
                    })}
                    {selectedItems.length === 0 && <p className="text-[9px] font-medium text-stone-300 tracking-wide">Nessun oggetto selezionato</p>}
                  </AnimatePresence>
                </div>
                <div className="flex gap-2 mt-2">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} animate={{ backgroundColor: i < selectedItems.length ? "#81ccb0" : "#d6d3d1", scale: i < selectedItems.length ? 1.3 : 1 }} className="w-2 h-2 rounded-full" />
                  ))}
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mt-1">{selectedItems.length}/3</p>
              </div>

              <div className="flex flex-col gap-3 sm:gap-4 items-center w-14 sm:w-16 shrink-0">
                {rightItems.map(item => (
                  <ItemCard key={item.id} item={item} isIn={selectedItems.includes(item.id)} isDisabled={!selectedItems.includes(item.id) && isFull} onAdd={() => addItem(item.id)} onRemove={() => removeItem(item.id)} />
                ))}
              </div>
            </div>

            <div className="flex justify-center gap-3 sm:gap-6 py-3 px-2 rounded-2xl mb-4" style={{ background: "rgba(90,170,221,0.06)", border: "1px dashed rgba(90,170,221,0.2)" }}>
              {bottomItems.map(item => (
                <ItemCard key={item.id} item={item} isIn={selectedItems.includes(item.id)} isDisabled={!selectedItems.includes(item.id) && isFull} onAdd={() => addItem(item.id)} onRemove={() => removeItem(item.id)} />
              ))}
            </div>

            <AnimatePresence>
              {isFull && (
                <motion.button
                  initial={{ opacity: 0, y: 12, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} transition={{ type: "spring", stiffness: 320, damping: 26 }} onClick={runAnalysis} disabled={isComputing}
                  className="w-full min-h-[52px] py-4 rounded-2xl font-black uppercase text-xs tracking-widest text-white flex items-center justify-center gap-3 active:scale-95 transition-transform disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #81ccb0 0%, #5aa89a 100%)", boxShadow: "0 8px 28px rgba(129,204,176,0.35)" }}
                >
                  {isComputing ? <><RotateCcw className="animate-spin" size={16} /> Analisi in corso…</> : <><Sparkles size={16} /> Scopri l'escursione perfetta <ArrowRight size={14} /></>}
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

        {step === "result" && recommended && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="p-5 sm:p-7 md:p-10 text-center">
            <div className="flex justify-center gap-3 mb-5">
              {selectedItems.map((id, idx) => {
                const it = ITEMS.find(i => i.id === id);
                return (
                  <motion.div key={id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + idx * 0.05 }} className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl" style={{ background: "white", boxShadow: "0 2px 10px rgba(159,130,112,0.12), 0 0 0 2px rgba(129,204,176,0.4)" }}>
                      {it?.emoji}
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-wider text-stone-400 text-center leading-tight max-w-[52px]">{it?.label}</span>
                  </motion.div>
                );
              })}
            </div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-2xl p-4 mb-4 text-center" style={{ background: currentProfile.bg, border: `1.5px solid ${currentProfile.border}` }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.16, type: "spring", stiffness: 340, damping: 18 }} className="text-4xl mb-2">{currentProfile.icona}</motion.div>
              <h3 className="text-xl font-black uppercase tracking-tighter mb-0.5" style={{ color: currentProfile.colore }}>{currentProfile.titolo}</h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-2">{currentProfile.sottotitolo}</p>
              <p className="text-xs text-stone-500 font-medium leading-relaxed">{currentProfile.descrizione}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="rounded-2xl overflow-hidden mb-4" style={{ background: "white", boxShadow: "0 2px 12px rgba(159,130,112,0.1), 0 0 0 1px rgba(159,130,112,0.08)" }}>
              <div className="relative h-44">
                <img src={recommended.immagine_url || "/altour-logo.png"} className="w-full h-full object-cover" alt={recommended.titolo} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/70 mb-0.5">{recommended.filosofia || recommended.difficolta || "Escursione"}</p>
                  <h4 className="text-base font-black uppercase text-white leading-tight line-clamp-2">{recommended.titolo}</h4>
                </div>
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-white" style={{ background: currentProfile.colore }}>✦ Per te</div>
              </div>
              <div className="p-4">
                <p className="text-xs text-stone-500 leading-relaxed line-clamp-2 mb-3 font-medium">{recommended.descrizione}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xl font-black" style={{ color: "#44403c" }}>{recommended.prezzo ? `€${recommended.prezzo}` : "—"}</span>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedActivity(recommended); setIsDetailOpen(true); }} className="py-2.5 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all active:scale-95" style={{ background: "white", boxShadow: "0 2px 8px rgba(159,130,112,0.1), 0 0 0 1.5px rgba(159,130,112,0.2)", color: "#44403c" }}>
                      Dettagli
                    </button>
                    <button onClick={() => onBookingClick(recommended.titolo, "info")} className="py-2.5 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest text-white active:scale-95 transition-all" style={{ background: `linear-gradient(135deg, ${currentProfile.colore}, ${currentProfile.colore}cc)`, boxShadow: `0 4px 16px ${currentProfile.colore}40` }}>
                      Richiedi Info
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32 }} className="flex gap-2">
              <button onClick={runAnalysis} className="flex-1 min-h-[48px] py-3.5 rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 active:scale-95 hover:bg-stone-100 transition-all" style={{ background: "white", boxShadow: "0 2px 8px rgba(159,130,112,0.1), 0 0 0 1.5px rgba(159,130,112,0.15)", color: "#44403c" }}>
                <RotateCcw size={11} /> Altra proposta
              </button>
              <button onClick={reset} className="flex-1 min-h-[48px] py-3.5 rounded-2xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 active:scale-95 hover:bg-stone-100 transition-all" style={{ background: "white", boxShadow: "0 2px 8px rgba(159,130,112,0.1), 0 0 0 1.5px rgba(159,130,112,0.15)", color: "#44403c" }}>
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