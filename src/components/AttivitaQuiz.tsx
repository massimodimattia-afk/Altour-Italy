import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, RotateCcw, Sparkles } from "lucide-react";
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
}

const ITEMS: Item[] = [
  { id: "map",     emoji: "🗺️", label: "Cartina",     zone: "left",   zoneRow: 1 },
  { id: "boots",   emoji: "🥾", label: "Scarponi",     zone: "left",   zoneRow: 2 },
  { id: "poles",   emoji: "🥢", label: "Bastoncini",   zone: "left",   zoneRow: 3 },
  { id: "compass", emoji: "🧭", label: "Bussola",      zone: "bottom" },
  { id: "water",   emoji: "💧", label: "Borraccia",    zone: "bottom" },
  { id: "medkit",  emoji: "🩹", label: "Kit soccorso", zone: "bottom" },
  { id: "jacket",  emoji: "🧥", label: "Giacca",       zone: "right",  zoneRow: 1 },
  { id: "torch",   emoji: "🔦", label: "Frontale",     zone: "right",  zoneRow: 2 },
  { id: "gps",     emoji: "📡", label: "GPS",          zone: "right",  zoneRow: 3 },
];

// ─── Segnali semantici per oggetto ─────────────────────────────────────────────
// Ogni oggetto "vota" su 3 dimensioni che matchano FILOSOFIA_QUIZ_MAP
const ITEM_SIGNALS: Record<string, Record<string, string>> = {
  map:     { cerca: "Conoscere la meta",  luogo: "Bosco",            tempo: "Intera giornata" },
  boots:   { sforzo: "Medio",             frequenza: "Ogni mese",    cerca: "Tempo di qualità" },
  poles:   { sforzo: "Intenso",           frequenza: "Ogni settimana", luogo: "Panoramico" },
  compass: { compagnia: "Solo",           cerca: "Pace e serenità",  luogo: "Poco frequentato" },
  water:   { tempo: "Mezza giornata",     sforzo: "Basso",           compagnia: "Famiglia" },
  medkit:  { frequenza: "1/3 volte l'anno", sforzo: "Basso",         compagnia: "Coppia" },
  jacket:  { luogo: "Panoramico",         sforzo: "Intenso",         cerca: "Tempo di qualità" },
  torch:   { tempo: "Una settimana",      luogo: "Poco frequentato", cerca: "Pace e serenità" },
  gps:     { luogo: "Poco frequentato",   sforzo: "Intenso",         compagnia: "Gruppo di amici" },
};

// Peso per il profilo: oggetti tecnici = maggiore esperienza richiesta
const ITEM_WEIGHT: Record<string, number> = {
  poles: 2, jacket: 2, gps: 2, torch: 2,  // avanzato
  boots: 1, compass: 1,                    // intermedio
  map: 0, water: 0, medkit: 0,             // base
};

// ─── Mappa filosofia → segnali ─────────────────────────────────────────────────
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

// ─── Profili ────────────────────────────────────────────────────────────────────
const PROFILI = {
  base: {
    titolo: "L'Esploratore Curioso",
    sottotitolo: "Pronto a iniziare",
    descrizione: "Cerchi esperienze dolci e rigeneranti, perfette per muovere i primi passi in natura con curiosità.",
    icona: "🌱",
    colore: "#81ccb0",
    bg: "rgba(129,204,176,0.10)",
    border: "rgba(129,204,176,0.30)",
  },
  intermedio: {
    titolo: "Il Camminatore Consapevole",
    sottotitolo: "Esperienza in crescita",
    descrizione: "Hai già familiarità con l'outdoor. Sei pronto per avventure più strutturate e percorsi con un po' di sfida.",
    icona: "⛰️",
    colore: "#5aaadd",
    bg: "rgba(90,170,221,0.10)",
    border: "rgba(90,170,221,0.30)",
  },
  avanzato: {
    titolo: "L'Avventuriero Esperto",
    sottotitolo: "Pronto a osare",
    descrizione: "Cerchi esperienze intense e immersive, percorsi impegnativi e atmosfere selvagge lontano dalla folla.",
    icona: "🏔️",
    colore: "#9f8270",
    bg: "rgba(159,130,112,0.10)",
    border: "rgba(159,130,112,0.30)",
  },
} as const;

// ─── Algoritmo scoring ─────────────────────────────────────────────────────────
function scoreEscursione(esc: Escursione, selectedItems: string[]): number {
  let score = 0;
  const t = esc.titolo?.toLowerCase() || "";
  const d = esc.descrizione?.toLowerCase() || "";
  const diffDB = esc.difficolta ?? "";
  const cat = esc.categoria?.toLowerCase() || "";
  const fs = FILOSOFIA_QUIZ_MAP[esc.filosofia ?? ""] ?? {};

  selectedItems.forEach(itemId => {
    const signals = ITEM_SIGNALS[itemId];

    // Match segnali oggetto vs filosofia dell'escursione (+8 per segnale allineato)
    Object.entries(signals).forEach(([dim, val]) => {
      if (fs[dim] === val) score += 8;
    });

    // Match sforzo → difficoltà DB (+4)
    const sforzo = signals.sforzo;
    if (sforzo && diffDB) {
      if (sforzo === "Basso"     && (diffDB === "Facile" || diffDB === "Facile-Media")) score += 4;
      if (sforzo === "Moderato"  && (diffDB === "Facile-Media" || diffDB === "Media")) score += 4;
      if (sforzo === "Medio"     && diffDB === "Media") score += 4;
      if (sforzo === "Intenso"   && (diffDB === "Media-Impegnativa" || diffDB === "Impegnativa")) score += 4;
    }

    // Match tempo → categoria DB (+8)
    const tempo = signals.tempo;
    if (tempo) {
      if (tempo === "Mezza giornata"  && cat.includes("mezza")) score += 8;
      if (tempo === "Intera giornata" && (cat === "giornata" || cat.includes("intera"))) score += 8;
      if (tempo === "Una settimana"   && cat === "tour") score += 8;
      if (tempo === "Più giorni"      && (cat === "giornata" || cat === "tour")) score += 4;
    }

    // Match luogo → parole chiave (+4)
    const luogo = signals.luogo;
    if (luogo) {
      if (luogo === "Panoramico"        && (t.includes("cima") || t.includes("vetta") || d.includes("panoram"))) score += 4;
      if (luogo === "Bosco"             && (d.includes("bosco") || d.includes("foresta"))) score += 4;
      if (luogo === "Poco frequentato"  && (d.includes("nascost") || d.includes("solitari") || d.includes("selvag"))) score += 4;
      if (luogo === "Presenza di acqua" && (t.includes("lago") || t.includes("mare") || d.includes("acqua"))) score += 4;
    }

    // Match cerca → parole chiave (+3)
    const cerca = signals.cerca;
    if (cerca) {
      if (cerca === "Pace e serenità"   && d.includes("pace")) score += 3;
      if (cerca === "Conoscere la meta" && (d.includes("storia") || d.includes("cultura") || d.includes("scopri"))) score += 3;
      if (cerca === "Tempo di qualità"  && (d.includes("esperienz") || d.includes("emoziont"))) score += 3;
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

// ─── UI: singolo oggetto ────────────────────────────────────────────────────────
function ItemButton({
  item,
  selected,
  disabled,
  onClick,
}: {
  item: Item;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={!disabled || selected ? { scale: 1.08, y: -2 } : {}}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 18 }}
      className={`flex flex-col items-center gap-0.5 p-2 rounded-2xl transition-colors relative
        ${selected
          ? "bg-brand-sky/15 ring-2 ring-brand-sky shadow-md shadow-sky-100"
          : disabled
          ? "bg-stone-50 opacity-40 cursor-not-allowed"
          : "bg-white shadow-sm hover:shadow-md cursor-pointer"
        }`}
    >
      <motion.span
        className="text-2xl leading-none"
        animate={selected ? { rotate: [0, -8, 8, 0] } : { rotate: 0 }}
        transition={{ duration: 0.35 }}
      >
        {item.emoji}
      </motion.span>
      <span className={`text-[8px] font-black uppercase tracking-wide leading-none text-center
        ${selected ? "text-brand-sky" : "text-stone-400"}`}>
        {item.label}
      </span>
      {selected && (
        <motion.div
          layoutId={`check-${item.id}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-sky flex items-center justify-center shadow"
        >
          <span className="text-white text-[9px] font-black leading-none">✓</span>
        </motion.div>
      )}
    </motion.button>
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
    supabase
      .from("escursioni")
      .select("*")
      .eq("is_active", true)
      .order("data", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          setEscursioniPool((data as any[]).map(e => ({ ...e, _tipo: "escursione" })));
        }
      });
  }, []);

  const isFull = selectedItems.length === 3;

  const toggleItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(prev => prev.filter(i => i !== id));
    } else if (!isFull) {
      setSelectedItems(prev => [...prev, id]);
    }
  };

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
    }, 600); // piccola pausa per feedback visivo
  };

  const reset = () => {
    setStep("items");
    setSelectedItems([]);
    setRecommended(null);
  };

  const leftItems   = ITEMS.filter(i => i.zone === "left").sort((a,b) => (a.zoneRow||0)-(b.zoneRow||0));
  const rightItems  = ITEMS.filter(i => i.zone === "right").sort((a,b) => (a.zoneRow||0)-(b.zoneRow||0));
  const bottomItems = ITEMS.filter(i => i.zone === "bottom");

  const currentProfile = PROFILI[profile];

  return (
    <div className="relative w-full max-w-2xl mx-auto mt-12 md:mt-20 rounded-[2.5rem] overflow-hidden border border-stone-100 shadow-2xl"
      style={{ background: "#faf9f7" }}>

      {/* Barra colorata in cima */}
      <div className="h-1.5 w-full bg-gradient-to-r from-brand-sky via-[#81ccb0] to-brand-sky" />

      <AnimatePresence mode="wait">

        {/* ── STEP: selezione oggetti ──────────────────────────────────────── */}
        {step === "items" && (
          <motion.div
            key="items"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="p-5 sm:p-7"
          >
            {/* Header */}
            <div className="mb-5">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-sky mb-1">
                Trova la tua escursione
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9]">
                Cosa metti<br />
                <span className="font-light italic text-stone-400">nel tuo zaino?</span>
              </h2>
              <div className="h-1 w-8 bg-brand-sky rounded-full mt-2" />
              <p className="text-stone-400 text-[11px] mt-2 font-medium">
                Scegli <strong className="text-brand-stone">3 oggetti</strong> — scopriremo l'escursione perfetta per te
              </p>
            </div>

            {/* Layout zaino + oggetti */}
            <div className="flex gap-2 sm:gap-3 items-center mb-2">

              {/* Colonna sinistra */}
              <div className="flex flex-col gap-2 w-[72px] sm:w-20 shrink-0">
                {leftItems.map(item => (
                  <ItemButton
                    key={item.id}
                    item={item}
                    selected={selectedItems.includes(item.id)}
                    disabled={isFull && !selectedItems.includes(item.id)}
                    onClick={() => toggleItem(item.id)}
                  />
                ))}
              </div>

              {/* Centro: zaino */}
              <div className="flex-1 flex flex-col items-center">
                <motion.div
                  className="relative w-full max-w-[140px] sm:max-w-[160px]"
                  animate={isFull
                    ? { filter: ["drop-shadow(0 0 0px #81ccb0)", "drop-shadow(0 0 14px #81ccb0)", "drop-shadow(0 0 8px #81ccb0)"] }
                    : { filter: "drop-shadow(0 0 0px #81ccb0)" }
                  }
                  transition={{ duration: 1.2, repeat: isFull ? Infinity : 0, repeatType: "reverse" }}
                >
                  <img src="/zaino.png" alt="Zaino" className="w-full h-auto" />
                </motion.div>

                {/* Slot oggetti selezionati */}
                <div className="flex gap-2 mt-3 min-h-[40px] items-center">
                  <AnimatePresence>
                    {selectedItems.map(id => {
                      const it = ITEMS.find(i => i.id === id);
                      return (
                        <motion.button
                          key={id}
                          initial={{ scale: 0, y: 8 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0, y: 8 }}
                          transition={{ type: "spring", stiffness: 380, damping: 22 }}
                          onClick={() => toggleItem(id)}
                          className="w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center text-xl relative hover:bg-red-50 transition-colors"
                          title={`Rimuovi ${it?.label}`}
                        >
                          {it?.emoji}
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-stone-300 text-white text-[8px] leading-none flex items-center justify-center font-black">✕</span>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Progress dots */}
                <div className="flex gap-1.5 mt-2">
                  {[0,1,2].map(i => (
                    <motion.div
                      key={i}
                      className="rounded-full"
                      animate={{
                        width: i < selectedItems.length ? 16 : 8,
                        backgroundColor: i < selectedItems.length ? "#5aaadd" : "#d6d3d1",
                      }}
                      style={{ height: 8 }}
                      transition={{ type: "spring", stiffness: 320, damping: 22 }}
                    />
                  ))}
                </div>
              </div>

              {/* Colonna destra */}
              <div className="flex flex-col gap-2 w-[72px] sm:w-20 shrink-0">
                {rightItems.map(item => (
                  <ItemButton
                    key={item.id}
                    item={item}
                    selected={selectedItems.includes(item.id)}
                    disabled={isFull && !selectedItems.includes(item.id)}
                    onClick={() => toggleItem(item.id)}
                  />
                ))}
              </div>
            </div>

            {/* Riga in basso */}
            <div className="grid grid-cols-3 gap-2 py-3 px-2 bg-stone-100/60 rounded-2xl mb-4">
              {bottomItems.map(item => (
                <ItemButton
                  key={item.id}
                  item={item}
                  selected={selectedItems.includes(item.id)}
                  disabled={isFull && !selectedItems.includes(item.id)}
                  onClick={() => toggleItem(item.id)}
                />
              ))}
            </div>

            {/* CTA — appare solo quando zaino pieno */}
            <AnimatePresence>
              {isFull && (
                <motion.button
                  initial={{ opacity: 0, y: 16, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 16, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 340, damping: 26 }}
                  onClick={compute}
                  disabled={isComputing}
                  className="w-full flex items-center justify-center gap-2 text-white font-black uppercase text-xs tracking-widest py-4 rounded-2xl active:scale-95 transition-all disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #5aaadd 0%, #3b91c4 100%)",
                    boxShadow: "0 6px 20px rgba(90,170,221,0.35)",
                  }}
                >
                  {isComputing
                    ? <><span className="animate-spin text-base">🧭</span> Analisi in corso…</>
                    : <><Sparkles size={14} /> Scopri l'escursione perfetta <ArrowRight size={14} /></>
                  }
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── STEP: risultato ──────────────────────────────────────────────── */}
        {step === "result" && recommended && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="p-5 sm:p-7"
          >
            {/* Profilo */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl p-4 mb-5 text-center"
              style={{ background: currentProfile.bg, border: `1.5px solid ${currentProfile.border}` }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 16 }}
                className="text-4xl mb-2"
              >
                {currentProfile.icona}
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <h3 className="text-xl font-black uppercase tracking-tighter" style={{ color: currentProfile.colore }}>
                  {currentProfile.titolo}
                </h3>
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-1">{currentProfile.sottotitolo}</p>
                <p className="text-xs text-stone-500 font-medium leading-relaxed">{currentProfile.descrizione}</p>
              </motion.div>

              {/* Oggetti scelti */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex justify-center gap-1.5 mt-3"
              >
                {selectedItems.map(id => {
                  const it = ITEMS.find(i => i.id === id);
                  return (
                    <span key={id} className="text-lg" title={it?.label}>{it?.emoji}</span>
                  );
                })}
              </motion.div>
            </motion.div>

            {/* Card escursione consigliata */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl overflow-hidden shadow-lg mb-4 border border-stone-100"
            >
              <div className="relative h-44">
                <img
                  src={recommended.immagine_url || "/altour-logo.png"}
                  className="w-full h-full object-cover"
                  alt={recommended.titolo}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/70 mb-0.5">
                    {recommended.filosofia || recommended.difficolta || "Escursione"}
                  </p>
                  <h4 className="text-base font-black uppercase text-white leading-tight line-clamp-2">
                    {recommended.titolo}
                  </h4>
                </div>
                {/* Badge "Consigliato" */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-white"
                  style={{ background: currentProfile.colore }}>
                  ✦ Per te
                </div>
              </div>

              <div className="p-4">
                <p className="text-xs text-stone-500 leading-relaxed line-clamp-2 mb-3 font-medium">
                  {recommended.descrizione}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xl font-black text-brand-stone">
                    {recommended.prezzo ? `€${recommended.prezzo}` : "—"}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSelectedActivity(recommended); setIsDetailOpen(true); }}
                      className="py-2.5 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest border-2 border-stone-200 text-stone-600 hover:border-brand-sky hover:text-brand-sky transition-all active:scale-95"
                    >
                      Dettagli
                    </button>
                    <button
                      onClick={() => onBookingClick(recommended.titolo, "info")}
                      className="py-2.5 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest bg-brand-sky text-white active:scale-95 transition-all"
                    >
                      Richiedi Info
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Azioni secondarie */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex gap-2"
            >
              <button
                onClick={() => {
                  // Rifai con stessi oggetti: ricalcola esclusione precedente
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
                    setIsComputing(false);
                  }, 400);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 border-2 border-stone-200 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest text-stone-500 hover:border-stone-400 active:scale-95 transition-all"
              >
                <RotateCcw size={11} /> Altra proposta
              </button>
              <button
                onClick={reset}
                className="flex-1 flex items-center justify-center gap-1.5 border-2 border-stone-200 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest text-stone-500 hover:border-stone-400 active:scale-95 transition-all"
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