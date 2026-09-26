import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Loader2,
  ShieldCheck,
  LogOut,
  Plus,
  ChevronRight,
  ChevronLeft,
  User,
  Award,
  Trophy,
  X,
  Calendar,
  MapPin,
  CheckCircle2,
  Mountain,
  Footprints,
  Camera,
  History,
  Send,
  FileText
} from "lucide-react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { supabase } from "../lib/supabase";

const SESSION_KEY = "altour_session_v4";
const PIN_LENGTH = 6;
const SLOTS_PER_PAGE = 8;
const BADGE_UNLOCK = 4;
const BADGE_INTERMEDIO = 8;
const BADGE_COMPLETO = 16;
const MAX_REDEEM_ATTEMPTS = 5;
const REDEEM_CODE_REGEX = /^[A-Z0-9]{4,24}$/; // Aumentato a 24 per supportare codici tour lunghi

const FILOSOFIA_COLORS: Record<string, string> = {
  "Avventura":              "#e94544",
  "Benessere":              "#a5d9c9",
  "Borghi più belli":       "#946a52",
  "Cammini":                "#e3c45d",
  "Educazione all'aperto":  "#01aa9f",
  "Eventi":                 "#ffc0cb",
  "Formazione":             "#002f59",
  "Immersi nel verde":      "#358756",
  "Luoghi dello spirito":   "#c8a3c9",
  "Novità":                 "#75c43c",
  "Speciali":               "#b8163c",
  "Acqua e cielo":          "#7aaecd",
  "Trek urbano":            "#f39452",
  "Tracce sulla neve":      "#a8cce0",
  "Cielo stellato":         "#1e2855",
  "Master":                 "#fbbf24",
};

const BADGE_NAMES: Record<string, string> = {
  "Avventura":              "Avventuriero",
  "Benessere":              "Spirito Libero",
  "Borghi più belli":       "Custode dei Borghi",
  "Cammini":                "Pellegrino",
  "Educazione all'aperto":  "Maestro del Bosco",
  "Eventi":                 "Anima della Festa",
  "Formazione":             "Sapiente",
  "Immersi nel verde":      "Guardiano del Verde",
  "Luoghi dello spirito":   "Cercatore di Luce",
  "Novità":                 "Esploratore",
  "Speciali":               "Leggenda",
  "Acqua e cielo":          "Navigatore",
  "Trek urbano":            "Flaneur",
  "Tracce sulla neve":      "Segugio della Neve",
  "Cielo stellato":         "Astronomo",
  "Master":                 "Master",
};

const BADGE_EMOJI: Record<string, string> = {
  "Avventura":              "⛰",
  "Benessere":              "🌿",
  "Borghi più belli":       "🏘",
  "Cammini":                "👣",
  "Educazione all'aperto":  "🌱",
  "Eventi":                 "✨",
  "Formazione":             "📖",
  "Immersi nel verde":      "🌲",
  "Luoghi dello spirito":   "🕊",
  "Novità":                 "🔭",
  "Speciali":               "🌟",
  "Acqua e cielo":          "💧",
  "Trek urbano":            "🏙",
  "Tracce sulla neve":      "❄️",
  "Cielo stellato":         "🌠",
  "Master":                 "👑",
};

const TESSERA_LEVELS = [
  "Amante di attività all'aperto", "Elfo dei prati", "Collezionista di muschio", 
  "Principe della mappa", "Guardiano delle nuvole", "Mago della bussola", 
  "Spirito dei boschi", "Collezionista di scarponi", "Asceta dei monti", 
  "Re dell'altimetro", "Saltatore di tronchi", "Amico delle querce", 
  "Menestrello dei bastoncini", "Duca degli scalatori", "Custode del verde", 
  "Specialista dei sentieri", "Gnomo delle pigne", "Spiritello degli stagni", 
  "Appassionato naturalista", "Leggenda vivente"
];

type TabType = "TESSERA" | "BADGE" | "TRAGUARDI";
type RedeemStep = "INPUT" | "SUCCESS";
type HistoryStep = "INPUT" | "SUCCESS";
type SupportStep = "INPUT" | "SUCCESS";

interface EscursioneCompletata { titolo: string; colore: string; data: string; categoria?: string; difficolta?: string; }
interface TappaTourDettaglio { titolo: string; filosofia?: string; colore?: string; difficolta?: string; data?: string; }
interface UserTessera { 
  id: string; 
  codice_tessera: string; 
  nome_escursionista: string; 
  cognome_escursionista: string; 
  email_utente?: string; 
  pin: string; 
  avatar_url?: string; 
  escursioni_completate: EscursioneCompletata[] | string;
  livello?: string; 
  badges_filosofia?: string[] | string;
  km_totali?: number;
  dislivello_totali?: number;
  quota_raggiunta?: number;
}

const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
};

// --- Utilities ---
const HEX_TO_FILOSOFIA: Record<string, string> = Object.fromEntries(Object.entries(FILOSOFIA_COLORS).map(([k, v]) => [v, k]));
function getFilosofiaName(hex: string): string { return HEX_TO_FILOSOFIA[hex] ?? ""; }
function getFilosofiaColor(name: string | null): string { return name ? (FILOSOFIA_COLORS[name] || "#5aaadd") : "#5aaadd"; }

function parseJsonArray<T>(data: T[] | string | null | undefined): T[] {
  if (typeof data === 'string') {
    try { return JSON.parse(data) as T[]; } catch { return []; }
  } else if (Array.isArray(data)) { return data; }
  return [];
}

function getBadgeLevel(count: number): { level: number; dots: number; isUnlocked: boolean } {
  if (count >= BADGE_COMPLETO) return { level: 3, dots: 3, isUnlocked: true };
  if (count >= BADGE_INTERMEDIO) return { level: 2, dots: 2, isUnlocked: true };
  if (count >= BADGE_UNLOCK) return { level: 1, dots: 1, isUnlocked: true };
  return { level: 0, dots: 0, isUnlocked: false };
}

function computeEarnedBadges(escursioni: EscursioneCompletata[]): string[] {
  const counts: Record<string, number> = {};
  for (const e of escursioni) {
    const filo = getFilosofiaName(e.colore);
    if (filo) counts[filo] = (counts[filo] || 0) + 1;
  }
  const earnedBadges = Object.entries(counts).filter(([, n]) => n >= BADGE_UNLOCK).map(([f]) => f);
  const allFilosofie = Object.keys(BADGE_NAMES).filter(f => f !== "Master");
  const allUnlocked = allFilosofie.every(f => earnedBadges.includes(f));
  if (allUnlocked) earnedBadges.push("Master");
  return earnedBadges;
}

function getSeason(date: Date): string {
  const m = date.getUTCMonth(); 
  const d = date.getUTCDate();  
  if ((m === 2 && d >= 21) || m === 3 || m === 4 || (m === 5 && d <= 20)) return "spring";
  if ((m === 5 && d >= 21) || m === 6 || m === 7 || (m === 8 && d <= 22)) return "summer";
  if ((m === 8 && d >= 23) || m === 9 || m === 10 || (m === 11 && d <= 20)) return "autumn";
  return "winter";
}

const ACHIEVEMENT_BADGES = [
  { id: "streak_tour", name: "Cuore verde", emoji: "🌿", description: "80 attività tra tour, campi e corsi", color: "#e94544", check: (e: EscursioneCompletata[]) => e.filter(x => x.categoria === "tour" || x.categoria === "campo"|| x.categoria === "corso").length >= 80, progress: (e: EscursioneCompletata[]) => ({ current: Math.min(e.filter(x => x.categoria === "tour" || x.categoria === "campo"|| x.categoria === "corso").length, 80), total: 80 }) },
  {
    id: "assiduo", name: "Assiduo", emoji: "🎯", description: "24 attività nello stesso anno", color: "#01aa9f",
    check: (e: EscursioneCompletata[]) => {
      const perAnno: Record<number, number> = {};
      e.forEach(attivita => { const anno = new Date(attivita.data).getUTCFullYear(); perAnno[anno] = (perAnno[anno] || 0) + 1; });
      return Object.values(perAnno).some(count => count >= 24);
    },
    progress: (e: EscursioneCompletata[]) => {
      const perAnno: Record<number, number> = {};
      e.forEach(attivita => { const anno = new Date(attivita.data).getUTCFullYear(); perAnno[anno] = (perAnno[anno] || 0) + 1; });
      return { current: Math.min(Math.max(...Object.values(perAnno), 0), 24), total: 24 };
    },
  },
  {
    id: "collezionista", name: "Collezionista", emoji: "💎", description: "Completa 8 filosofie", color: "#946a52",
    check: (e: EscursioneCompletata[]) => {
      const counts: Record<string, number> = {};
      for (const attivita of e) { const filo = getFilosofiaName(attivita.colore); if (filo) counts[filo] = Math.min((counts[filo] || 0) + 1, 16); }
      return Object.values(counts).filter(count => count >= 16).length >= 8;
    },
    progress: (e: EscursioneCompletata[]) => {
      const counts: Record<string, number> = {};
      for (const attivita of e) { const filo = getFilosofiaName(attivita.colore); if (filo) counts[filo] = Math.min((counts[filo] || 0) + 1, 16); }
      return { current: Math.min(Object.values(counts).filter(count => count >= 16).length, 8), total: 8 };
    },
  },
  {
    id: "stagionale", name: "Anima delle Stagioni", emoji: "🍂", description: "16 attività in ogni stagione", color: "#75c43c",
    check: (e: EscursioneCompletata[]) => {
      const perStagione: Record<string, number> = { spring: 0, summer: 0, autumn: 0, winter: 0 };
      e.forEach(attivita => { const stagione = getSeason(new Date(attivita.data)); perStagione[stagione] = Math.min((perStagione[stagione] || 0) + 1, 16); });
      return Object.values(perStagione).every(count => count >= 16);
    },
    progress: (e: EscursioneCompletata[]) => {
      const perStagione: Record<string, number> = { spring: 0, summer: 0, autumn: 0, winter: 0 };
      e.forEach(attivita => { const stagione = getSeason(new Date(attivita.data)); perStagione[stagione] = Math.min((perStagione[stagione] || 0) + 1, 16); });
      return { current: Object.values(perStagione).reduce((sum, count) => sum + count, 0), total: 64 };
    },
  },
  {
    id: "esploratore_verticale", name: "Esploratore Verticale", emoji: "⚡", description: "🟢16 · 🟡24 · 🟠16 · 🔴10 · ⚫6", color: "#002f59",
    check: (e: EscursioneCompletata[]) => {
      let facile = 0, facile_media = 0, media = 0, media_impegnativa = 0, impegnativa = 0;
      e.forEach(attivita => {
        const diff = attivita.difficolta || "";
        if (diff === "Facile") facile = Math.min(facile + 1, 16);
        if (diff === "Facile-Media") facile_media = Math.min(facile_media + 1, 24);
        if (diff === "Media") media = Math.min(media + 1, 16);
        if (diff === "Media-Impegnativa") media_impegnativa = Math.min(media_impegnativa + 1, 10);
        if (diff === "Impegnativa") impegnativa = Math.min(impegnativa + 1, 6);
      });
      return facile >= 16 && facile_media >= 24 && media >= 16 && media_impegnativa >= 10 && impegnativa >= 6;
    },
    progress: (e: EscursioneCompletata[]) => {
      let facile = 0, facile_media = 0, media = 0, media_impegnativa = 0, impegnativa = 0;
      e.forEach(attivita => {
        const diff = attivita.difficolta || "";
        if (diff === "Facile") facile = Math.min(facile + 1, 16);
        if (diff === "Facile-Media") facile_media = Math.min(facile_media + 1, 24);
        if (diff === "Media") media = Math.min(media + 1, 16);
        if (diff === "Media-Impegnativa") media_impegnativa = Math.min(media_impegnativa + 1, 10);
        if (diff === "Impegnativa") impegnativa = Math.min(impegnativa + 1, 6);
      });
      return { current: facile + facile_media + media + media_impegnativa + impegnativa, total: 72 };
    },
  },
];

// Memoized Icon Component
const MemoIconaScarponeCustom = React.memo(({ size = 24, color = "#d6d3d1", isActive = false }: { size?: number; color?: string; isActive?: boolean }) => {
  const style: React.CSSProperties = { width: size, height: size, transition: "background-color 0.4s ease" };
  if (isActive) return <div style={{ ...style, backgroundColor: color, maskImage: "url(\"/scarpone.png\")", WebkitMaskImage: "url(\"/scarpone.png\")", maskSize: "contain", maskRepeat: "no-repeat", maskPosition: "center" }} />;
  return <img src="/scarpone.png" alt="scarpone" style={{ ...style, filter: "grayscale(100%) opacity(0.15)" }} />;
});

// Memoized Badge Component
const MemoBadgeChip = React.memo(({ filo, count, onClick }: { filo: string; count: number; onClick?: () => void }) => {
  const color = FILOSOFIA_COLORS[filo] ?? "#44403c";
  const emoji = BADGE_EMOJI[filo] ?? "★";
  const shortName = BADGE_NAMES[filo]?.split(" ")[0] ?? filo.split(" ")[0];
  const levelInfo = filo === "Master" ? (count === BADGE_COMPLETO ? { level: 3, dots: 3, isUnlocked: true } : { level: 0, dots: 0, isUnlocked: false }) : getBadgeLevel(count);
  const isUnlocked = levelInfo.isUnlocked;
  const progressText = !isUnlocked ? (filo === "Master" ? `${count}/15` : `${count}/${BADGE_UNLOCK}`) : "";

  return (
    <motion.div whileTap={{ scale: 0.93 }} onClick={onClick} className="flex flex-col items-center gap-1.5 cursor-pointer group" style={{ WebkitTapHighlightColor: "transparent" }}>
      <div className="relative">
        {isUnlocked && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i <= levelInfo.dots ? "bg-white shadow-sm" : "bg-white/30"}`} style={i <= levelInfo.dots ? { backgroundColor: color, boxShadow: `0 0 4px ${color}` } : {}} />
            ))}
          </div>
        )}
        <motion.div className="w-[52px] h-[52px] md:w-[60px] md:h-[60px] rounded-2xl flex items-center justify-center transition-colors relative overflow-hidden" style={{ ...(isUnlocked ? { backgroundColor: color, boxShadow: `0 6px 18px ${color}45, inset 0 1px 0 rgba(255,255,255,0.3)` } : { backgroundColor: "#f5f5f4" }) }} whileHover={isUnlocked ? { y: -2 } : {}}>
          {isUnlocked ? (
            <>
              <div className="absolute inset-0 opacity-20" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 60%)" }} />
              <span className="text-[22px] leading-none relative z-10 drop-shadow-sm">{emoji}</span>
            </>
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[18px] leading-none opacity-20">{emoji}</span>
              <span className="text-[9px] font-black text-stone-400 leading-none">{progressText}</span>
            </div>
          )}
        </motion.div>
        {isUnlocked && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-white flex items-center justify-center" style={{ boxShadow: `0 2px 6px ${color}55`, border: `2px solid ${color}` }}>
            <CheckCircle2 size={9} style={{ color }} />
          </motion.div>
        )}
      </div>
      <span className="text-[9px] font-black uppercase tracking-wide leading-none text-center w-full truncate px-0.5" style={{ color: isUnlocked ? color : "#d6d3d1" }}>{shortName}</span>
    </motion.div>
  );
});

const BadgeDetailPopup = ({ filo, count, onClose }: { filo: string; count: number; onClose: () => void }) => {
  const isMaster = filo === "Master";
  const isMasterUnlocked = count === BADGE_COMPLETO;
  const color = FILOSOFIA_COLORS[filo] ?? "#44403c";
  const emoji = BADGE_EMOJI[filo] ?? "★";
  const name = BADGE_NAMES[filo] ?? filo;
  const levelInfo = getBadgeLevel(count);
  const isUnlocked = levelInfo.isUnlocked;
  const nextThreshold = !isUnlocked ? BADGE_UNLOCK : (count < BADGE_INTERMEDIO ? BADGE_INTERMEDIO : (count < BADGE_COMPLETO ? BADGE_COMPLETO : null));
  const remaining = nextThreshold ? nextThreshold - count : 0;
  
  let statusText = "";
  if (!isUnlocked) statusText = `${remaining} per sbloccare`;
  else if (count < BADGE_INTERMEDIO) statusText = `${remaining} per livello 2`;
  else if (count < BADGE_COMPLETO) statusText = `${remaining} per completare`;
  else statusText = "Completato! 🎉";

  return (
    <motion.div key="badge-detail-modal" className="fixed inset-0 z-[99999] flex items-center justify-center p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-stone-900/85" />
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative z-10 w-full max-w-xs bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-stone-100">
        <button onClick={onClose} className="absolute top-5 right-5 z-10 p-2 bg-white/80 rounded-full text-stone-400 touch-manipulation"><X size={16} /></button>
        <div className="relative h-36 flex items-center justify-center overflow-hidden" style={isMaster ? { background: isMasterUnlocked ? "linear-gradient(145deg, #fbbf24cc, #f59e0b, #d97706aa)" : "linear-gradient(145deg, #f0eeec, #e8e5e2)" } : (isUnlocked ? { background: `linear-gradient(145deg, ${color}cc 0%, ${color} 60%, ${color}aa 100%)` } : { background: "linear-gradient(145deg, #f0eeec 0%, #e8e5e2 100%)" })}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)" }} />
          <motion.div initial={{ scale: 0.5, rotate: -12, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} className="relative z-10" style={{ fontSize: 56, lineHeight: 1, filter: (isMaster && !isMasterUnlocked) || (!isMaster && !isUnlocked) ? "grayscale(1) opacity(0.3)" : "drop-shadow(0 4px 12px rgba(0,0,0,0.22))" }}>{isMaster ? "👑" : emoji}</motion.div>
        </div>
        <div className="px-8 py-6 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1" style={{ color: isMaster ? (isMasterUnlocked ? "#f59e0b" : "#c4c2c0") : (isUnlocked ? color : "#c4c2c0") }}>
            {isMaster ? (isMasterUnlocked ? "Badge Leggendario" : "Badge Segreto") : (isUnlocked ? "Badge Sbloccato" : "Badge Bloccato")}
          </p>
          <h3 className="text-xl font-black uppercase tracking-tight text-stone-800 mb-0.5">{isMaster ? (isMasterUnlocked ? "Master Altour" : "???") : name}</h3>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{isMaster ? (isMasterUnlocked ? "Leggenda." : "Sbloccali tutti per rivelare") : filo}</p>
          
          {!isMaster && (
            <>
              <div className="flex justify-center gap-1.5 mt-2 mb-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-all ${i <= levelInfo.dots ? "opacity-100" : "opacity-30"}`} style={{ backgroundColor: color }} />
                ))}
              </div>
              <div className="mt-2">
                {!isUnlocked ? (
                  <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(count / BADGE_UNLOCK) * 100}%`, background: color }} /></div>
                ) : count < BADGE_COMPLETO ? (
                  <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${((count - (count < BADGE_INTERMEDIO ? BADGE_UNLOCK : BADGE_INTERMEDIO)) / (count < BADGE_INTERMEDIO ? (BADGE_INTERMEDIO - BADGE_UNLOCK) : (BADGE_COMPLETO - BADGE_INTERMEDIO))) * 100}%`, background: color }} /></div>
                ) : null}
                <p className="text-[9px] font-black uppercase tracking-widest mt-2" style={{ color }}>{statusText}</p>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const PinInput = ({ value, onChange, onComplete, length = 6, disabled }: { value: string; onChange: (v: string) => void; onComplete?: () => void; length?: number; disabled?: boolean }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => { inputRefs.current = Array(length).fill(null); }, [length]);
  useEffect(() => {
    if (disabled) return;
    const firstEmptyIndex = value.length;
    if (firstEmptyIndex < length && inputRefs.current[firstEmptyIndex]) inputRefs.current[firstEmptyIndex]?.focus();
  }, [value, length, disabled]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    if (digit) {
      const newPin = value.split('');
      newPin[index] = digit;
      const newPinStr = newPin.join('');
      onChange(newPinStr);
      if (index + 1 < length) inputRefs.current[index + 1]?.focus();
      if (index === length - 1 && newPinStr.length === length) setTimeout(() => onComplete?.(), 100);
    }
    e.target.value = digit || "";
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[index]) { const p = value.split(''); p[index] = ''; onChange(p.join('')); }
      else if (index > 0) { const p = value.split(''); p[index - 1] = ''; onChange(p.join('')); inputRefs.current[index - 1]?.focus(); }
    } else if (e.key === "ArrowLeft" && index > 0) { e.preventDefault(); inputRefs.current[index - 1]?.focus(); }
    else if (e.key === "ArrowRight" && index < length - 1) { e.preventDefault(); inputRefs.current[index + 1]?.focus(); }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    e.preventDefault();
    const pasted = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, length);
    if (pasted) {
      onChange(pasted);
      const lastIndex = Math.min(pasted.length, length) - 1;
      if (lastIndex >= 0) inputRefs.current[lastIndex]?.focus();
      if (pasted.length === length) setTimeout(() => onComplete?.(), 100);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-3 justify-center">
        {Array.from({ length: 3 }).map((_, i) => (
          <input key={i} ref={el => inputRefs.current[i] = el} type="password" inputMode="numeric" pattern="\d*" maxLength={1} value={value[i] || ""} onChange={(e) => handleChange(i, e)} onKeyDown={(e) => handleKeyDown(i, e)} onPaste={handlePaste} disabled={disabled} className="w-12 h-12 text-center text-2xl font-black bg-stone-50 border-2 border-stone-100 rounded-xl outline-none focus:border-brand-sky transition-all shadow-inner touch-manipulation text-[16px]" />
        ))}
      </div>
      <div className="flex gap-3 justify-center">
        {Array.from({ length: 3 }).map((_, i) => {
          const idx = 3 + i;
          return <input key={idx} ref={el => inputRefs.current[idx] = el} type="password" inputMode="numeric" pattern="\d*" maxLength={1} value={value[idx] || ""} onChange={(e) => handleChange(idx, e)} onKeyDown={(e) => handleKeyDown(idx, e)} onPaste={handlePaste} disabled={disabled} className="w-12 h-12 text-center text-2xl font-black bg-stone-50 border-2 border-stone-100 rounded-xl outline-none focus:border-brand-sky transition-all shadow-inner touch-manipulation text-[16px]" />;
        })}
      </div>
    </div>
  );
};

// VARIANTS per lo scorrimento del carosello dettagli senza popLayout
const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 80, scale: 0.95 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -80, scale: 0.95 })
};

export default function Tessera() {
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userTessera, setUserTessera] = useState<UserTessera | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("TESSERA");
  const [currentPage, setCurrentPage] = useState(0);
  const [loginCode, setLoginCode] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [loginStep, setLoginStep] = useState<"code" | "pin">("code");
  const [loginError, setLoginError] = useState("");
  const [pendingTessera, setPendingTessera] = useState<UserTessera | null>(null);

  // Stati Riscatto Modificati per Multi-Boot
  const [showRedeem, setShowRedeem] = useState(false);
  const [redeemStep, setRedeemStep] = useState<RedeemStep>("INPUT");
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemError, setRedeemError] = useState("");
  const [redeemAttempts, setRedeemAttempts] = useState(0);
  
  const [unlockedBootsPreview, setUnlockedBootsPreview] = useState<EscursioneCompletata[]>([]);
  const [newlyUnlockedBadges, setNewlyUnlockedBadges] = useState<string[]>([]);
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState<any[]>([]);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyStep, setHistoryStep] = useState<HistoryStep>("INPUT");
  const [historyEmail, setHistoryEmail] = useState("");
  const [isSubmittingHistory, setIsSubmittingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportStep, setSupportStep] = useState<SupportStep>("INPUT");
  const [supportData, setSupportData] = useState({ nome: "", codice: "", contatto: "", problema: "", richiediStorico: false });
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [supportError, setSupportError] = useState("");
  const inputSupportRef = useRef<HTMLInputElement>(null);

  const [selectedBootIndex, setSelectedBootIndex] = useState<number | null>(null);
  const [slideDirection, setSlideDirection] = useState(1);
  
  const [selectedBadge, setSelectedBadge] = useState<{ filo: string; count: number } | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<any | null>(null);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const escursioniCompletateParsed = useMemo(() => parseJsonArray<EscursioneCompletata>(userTessera?.escursioni_completate), [userTessera?.escursioni_completate]);
  const badgesFilosofiaParsed = useMemo(() => parseJsonArray<string>(userTessera?.badges_filosofia), [userTessera?.badges_filosofia]);

  const stats = useMemo(() => {
    if (!userTessera) return null;
    const count = escursioniCompletateParsed.length || 0;
    const levelIdx = Math.min(Math.floor((count - 1) / 8), TESSERA_LEVELS.length - 1);
    return {
      currentLevelLabel: count > 0 ? TESSERA_LEVELS[levelIdx] : TESSERA_LEVELS[0],
      totalPages: Math.max(1, Math.ceil(count / SLOTS_PER_PAGE)),
      kmTotali: userTessera.km_totali || 0,
      dislivelloTotali: userTessera.dislivello_totali || 0,
      quotaRaggiunta: userTessera.quota_raggiunta || 0,
    };
  }, [userTessera, escursioniCompletateParsed]);

  const badgeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    escursioniCompletateParsed.forEach(e => {
      const f = getFilosofiaName(e.colore);
      if (f) counts[f] = (counts[f] || 0) + 1;
    });
    const allFilosofie = Object.keys(BADGE_NAMES).filter(f => f !== "Master");
    const allUnlocked = allFilosofie.every(f => (counts[f] || 0) >= BADGE_UNLOCK);
    const unlockedFilosofieCount = allFilosofie.filter(f => (counts[f] || 0) >= BADGE_UNLOCK).length;
    counts["Master"] = allUnlocked ? BADGE_COMPLETO : unlockedFilosofieCount;
    return counts;
  }, [escursioniCompletateParsed]);

  const handleNextBoot = useCallback((e?: React.MouseEvent | TouchEvent | PointerEvent | any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (selectedBootIndex !== null && selectedBootIndex < escursioniCompletateParsed.length - 1) {
      setSlideDirection(1);
      setSelectedBootIndex(prev => prev! + 1);
    }
  }, [selectedBootIndex, escursioniCompletateParsed.length]);

  const handlePrevBoot = useCallback((e?: React.MouseEvent | TouchEvent | PointerEvent | any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (selectedBootIndex !== null && selectedBootIndex > 0) {
      setSlideDirection(-1);
      setSelectedBootIndex(prev => prev! - 1);
    }
  }, [selectedBootIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedBootIndex === null) return;
      if (e.key === "ArrowRight") handleNextBoot();
      if (e.key === "ArrowLeft") handlePrevBoot();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedBootIndex, handleNextBoot, handlePrevBoot]);

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) { const { code } = JSON.parse(saved); fetchUser(code, true); }
    else setLoading(false);
  }, []);

  useEffect(() => {
    if (showSupportModal && supportStep === "INPUT" && inputSupportRef.current) {
      setTimeout(() => inputSupportRef.current?.focus(), 100);
    }
  }, [showSupportModal, supportStep]);

  const isOverlayActive = showRedeem || showHistoryModal || showSupportModal || selectedBootIndex !== null || !!selectedBadge || !!selectedAchievement;
  useEffect(() => {
    if (isOverlayActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    }
  }, [isOverlayActive]);

  async function fetchUser(codice: string, isSession = false) {
    setLoading(true); setLoginError("");
    const { data, error } = await supabase
      .from("tessere").select("*")
      .eq("codice_tessera", codice.toUpperCase().trim()).single();
    if (error || !data) {
      if (!isSession) setLoginError("Codice tessera non trovato.");
      setLoading(false);
    } else {
      if (isSession) {
        setActiveTab("TESSERA");
        setCurrentPage(0);
        setUserTessera(data as UserTessera);
        setLoading(false);
      } else {
        setPendingTessera(data as UserTessera);
        setLoginStep("pin");
        setLoading(false);
      }
    }
  }

  async function loadDemo() {
    setLoading(true);
    const { data } = await supabase.from("tessere").select("*").eq("codice_tessera", "ALT000").single();
    if (data) { setIsDemo(true); setUserTessera(data as UserTessera); }
    setLoading(false);
  }

  async function completeLogin(tessera: UserTessera) {
    const { data } = await supabase
      .from("tessere").select("*")
      .eq("codice_tessera", tessera.codice_tessera).single();
    const clean = (data ?? tessera) as UserTessera;
    setActiveTab("TESSERA");
    setCurrentPage(0);
    setUserTessera(clean);
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      code: clean.codice_tessera,
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000
    }));
  }

  async function handleVerifyPin() {
    if (!pendingTessera) return;
    const dbPin = pendingTessera.pin != null ? String(pendingTessera.pin).trim().replace(/\D/g, "") : "";
    const enteredPin = loginPin.trim().replace(/\D/g, "");
    if (enteredPin.length !== PIN_LENGTH) { setLoginError(`Inserisci ${PIN_LENGTH} cifre.`); return; }
    if (enteredPin === dbPin) { await completeLogin(pendingTessera); }
    else { setLoginError("PIN errato. Riprova."); setLoginPin(""); }
  }

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUserTessera(null);
    setIsDemo(false);
    setLoginStep("code");
    setLoginCode("");
    setLoginPin("");
    setActiveTab("TESSERA");
    setCurrentPage(0);
  };

  const closeRedeem = useCallback(() => {
    if (isVerifying) return;
    setShowRedeem(false); setRedeemCode(""); setRedeemStep("INPUT"); setRedeemError("");
    setUnlockedBootsPreview([]);
    setNewlyUnlockedBadges([]); setNewlyUnlockedAchievements([]); setRedeemAttempts(0);
  }, [isVerifying]);

  const verifyCode = async () => {
    if (!redeemCode.trim() || !userTessera) return;
    if (redeemAttempts >= MAX_REDEEM_ATTEMPTS) { setRedeemError("Troppi tentativi."); return; }
    
    const normalized = redeemCode.toUpperCase().trim();
    if (!REDEEM_CODE_REGEX.test(normalized)) { setRedeemError("Formato non valido."); return; }
    
    setIsVerifying(true); setRedeemError(""); setRedeemAttempts(n => n + 1);
    
    const { data, error } = await supabase.from("escursioni")
      .select("id, titolo, filosofia, categoria, difficolta, codici_usati, durata, tappe, data")
      .contains("codici_riscatto", [normalized])
      .single();
      
    if (error || !data) { setRedeemError("Codice non valido."); setIsVerifying(false); return; }
    if ((data.codici_usati as string[] | null)?.includes(normalized)) { setRedeemError("Codice già usato."); setIsVerifying(false); return; }
    
    let bootsToAdd: EscursioneCompletata[] = [];
    const baseColor = getFilosofiaColor(data.filosofia);
    const isTour = data.categoria?.toLowerCase() === "tour";
    
    const validBaseTime = data.data && !isNaN(new Date(data.data).getTime()) ? new Date(data.data).getTime() : Date.now();
    const tappeDettaglio = parseJsonArray<TappaTourDettaglio>(data.tappe);

    if (isTour && tappeDettaglio.length > 0) {
      bootsToAdd = tappeDettaglio.map((tappa, idx) => ({
        titolo: tappa.titolo.trim(),
        colore: tappa.colore || (tappa.filosofia ? getFilosofiaColor(tappa.filosofia) : baseColor),
        data: tappa.data || new Date(validBaseTime + idx * 86400000).toISOString(),
        categoria: data.categoria,
        difficolta: tappa.difficolta || data.difficolta
      }));
    } else if (isTour) {
      const matchGiorni = (data.durata || "").match(/\d+/);
      const numGiorni = matchGiorni ? parseInt(matchGiorni[0], 10) : 1;
      bootsToAdd = Array.from({ length: numGiorni }).map((_, idx) => ({
        titolo: `${data.titolo} (Tappa ${idx + 1})`,
        colore: baseColor,
        data: new Date(validBaseTime + idx * 86400000).toISOString(),
        categoria: data.categoria,
        difficolta: data.difficolta
      }));
    } else {
      bootsToAdd = [{
        titolo: data.titolo,
        colore: baseColor,
        data: new Date(validBaseTime).toISOString(),
        categoria: data.categoria,
        difficolta: data.difficolta
      }];
    }

    const alreadyRedeemed = bootsToAdd.some(b => escursioniCompletateParsed.some(e => e.titolo === b.titolo));
    if (alreadyRedeemed) { setRedeemError("Hai già riscattato questa attività."); setIsVerifying(false); return; }
    
    const updatedList = [...escursioniCompletateParsed, ...bootsToAdd];
    
    const oldBadges = computeEarnedBadges(escursioniCompletateParsed);
    const newBadges = computeEarnedBadges(updatedList);
    const justUnlockedBadges = newBadges.filter(b => !oldBadges.includes(b));
    
    const oldAchievements = ACHIEVEMENT_BADGES.filter(ab => ab.check(escursioniCompletateParsed)).map(ab => ab.id);
    const newAchievements = ACHIEVEMENT_BADGES.filter(ab => ab.check(updatedList)).map(ab => ab.id);
    const justUnlockedAchvIds = newAchievements.filter(id => !oldAchievements.includes(id));
    const justUnlockedAchvObjects = ACHIEVEMENT_BADGES.filter(ab => justUnlockedAchvIds.includes(ab.id));
    
    const updatePayload: any = { escursioni_completate: updatedList };
    if (justUnlockedBadges.length > 0) { updatePayload.badges_filosofia = [...badgesFilosofiaParsed, ...justUnlockedBadges]; }
    
    const { data: saved, error: saveErr } = await supabase.from("tessere").update(updatePayload).eq("id", userTessera.id).select();
    if (saveErr || !saved) { setRedeemError("Errore salvataggio."); setIsVerifying(false); return; }
    
    setUserTessera(saved[0] as UserTessera);
    setUnlockedBootsPreview(bootsToAdd);
    setNewlyUnlockedBadges(justUnlockedBadges);
    setNewlyUnlockedAchievements(justUnlockedAchvObjects);
    setRedeemStep("SUCCESS"); setIsVerifying(false);

    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) { window.navigator.vibrate([40, 60, 40]); }
  };

  const closeHistoryModal = useCallback(() => {
    if (isSubmittingHistory) return;
    setShowHistoryModal(false); setHistoryStep("INPUT"); setHistoryError("");
  }, [isSubmittingHistory]);

  const submitHistoryRequest = async () => {
    if (!userTessera) return;
    if (!historyEmail.trim() || !/^\S+@\S+\.\S+$/.test(historyEmail)) { setHistoryError("Inserisci un indirizzo email valido."); return; }
    setIsSubmittingHistory(true); setHistoryError("");
    try {
      const { error } = await supabase.from("contatti").insert([{
        nome: `${userTessera.nome_escursionista} ${userTessera.cognome_escursionista}`.trim(),
        email: historyEmail.trim().toLowerCase(),
        messaggio: `RICHIESTA CARICAMENTO STORICO VECCHIE ATTIVITÀ\nCodice Tessera: ${userTessera.codice_tessera}`,
        attivita: "[INFO] Popolamento Storico Tessera"
      }]);
      if (error) throw error;
      setHistoryStep("SUCCESS");
    } catch (err) {
      setHistoryError("Errore durante l'invio della richiesta. Riprova.");
    } finally { setIsSubmittingHistory(false); }
  };

  const closeSupportModal = useCallback(() => {
    if (isSubmittingSupport) return;
    setShowSupportModal(false); setSupportStep("INPUT"); setSupportError("");
    setSupportData({ nome: "", codice: "", contatto: "", problema: "", richiediStorico: false });
  }, [isSubmittingSupport]);

  const submitSupportRequest = async () => {
    if (!supportData.nome || !supportData.contatto) { setSupportError("Nome e Contatto sono obbligatori."); return; }
    setIsSubmittingSupport(true); setSupportError("");
    try {
      const { error } = await supabase.from("contatti").insert([{
        nome: supportData.nome.trim(),
        email: supportData.contatto.trim(),
        messaggio: `RICHIESTA SUPPORTO ACCESSO TESSERA\nCodice Inserito: ${supportData.codice || "Non fornito"}\nRichiede anche storico: ${supportData.richiediStorico ? "SÌ" : "NO"}\nProblema descritto:\n${supportData.problema || "Nessun dettaglio extra."}`,
        attivita: "[INFO] Problemi Login"
      }]);
      if (error) throw error;
      setSupportStep("SUCCESS");
    } catch (err) {
      setSupportError("Si è verificato un errore, riprova o scrivici su WhatsApp.");
    } finally { setIsSubmittingSupport(false); }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userTessera) return;
    if (file.size > 20 * 1024 * 1024) { alert("Foto troppo grande (max 20MB)."); if (fileInputRef.current) fileInputRef.current.value = ""; return; }
    setAvatarUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Impossibile leggere il file."));
        reader.readAsDataURL(file);
      });
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Impossibile decodificare l'immagine."));
        img.src = dataUrl;
      });
      const OUTPUT = 400;
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT; canvas.height = OUTPUT;
      const ctx = canvas.getContext("2d")!;
      const w = image.naturalWidth; const h = image.naturalHeight;
      const shortSide = Math.min(w, h);
      const cropSize = Math.round(shortSide * 0.75);
      const cropX = Math.round((w - cropSize) / 2);
      let cropY: number;
      if (h > w) { const targetCenter = Math.round(h * 0.25); cropY = Math.max(0, Math.min(targetCenter - Math.round(cropSize / 2), h - cropSize)); } 
      else { cropY = Math.round((h - cropSize) / 2); }
      ctx.drawImage(image, cropX, cropY, cropSize, cropSize, 0, 0, OUTPUT, OUTPUT);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Errore generazione immagine."))), "image/jpeg", 0.88);
      });
      const storagePath = `avatars/${userTessera.id}.jpg`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(storagePath, blob, { upsert: true, contentType: "image/jpeg" });
      if (uploadError) throw new Error(`Upload fallito: ${uploadError.message}`);
      const { data: pubData } = supabase.storage.from("avatars").getPublicUrl(storagePath);
      const freshUrl = `${pubData.publicUrl}?t=${Date.now()}`;
      const { error: dbError } = await supabase.from("tessere").update({ avatar_url: freshUrl }).eq("id", userTessera.id);
      if (dbError) throw new Error(`Salvataggio fallito: ${dbError.message}`);
      setUserTessera((prev) => (prev ? { ...prev, avatar_url: freshUrl } : prev));
    } catch (err) {
      console.error("[Avatar upload]", err);
      alert(err instanceof Error ? err.message : "Errore sconosciuto.");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    const totalPages = stats?.totalPages || 1;
    if (info.offset.x < -swipeThreshold && currentPage < totalPages - 1) { setCurrentPage((p) => p + 1); } 
    else if (info.offset.x > swipeThreshold && currentPage > 0) { setCurrentPage((p) => p - 1); }
  };

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center bg-[#f5f2ed]"><Loader2 className="animate-spin text-sky-500" /></div>;

  const selectedBoot = selectedBootIndex !== null ? escursioniCompletateParsed[selectedBootIndex] : null;

  return (
    <div className="min-h-[100dvh] bg-[#f5f2ed] text-stone-800 pb-20">
      
      <ModalPortal>
        <AnimatePresence>
          {!userTessera && (
            <motion.div key="login-modal" className="fixed inset-0 z-[99999] flex items-center justify-center p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#f5f2ed]" />
              <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative z-10 w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl border border-white/60 text-center flex flex-col">
                <button onClick={() => window.location.href = '/'} className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/80 border border-stone-200 shadow-sm hover:bg-stone-100 transition-colors touch-manipulation"><ChevronLeft size={14} /><span className="text-[10px] font-black uppercase tracking-wide text-stone-600">Home</span></button>
                <img src="/Accesso_tessera.png" alt="Altour Italy" className="h-32 w-auto mx-auto mb-4 rounded-xl" onError={(e) => { e.currentTarget.src = "/Accesso_tessera.png"; }} />
                <h1 className="text-2xl font-black uppercase mb-6">TESSERA ALTOUR</h1>
                {loginStep === "code" ? (
                  <div className="space-y-4">
                    <input type="text" inputMode="numeric" value={"ALT" + loginCode}
                      onChange={(e) => { const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); if (val.startsWith("ALT")) setLoginCode(val.slice(3)); }}
                      onKeyDown={(e) => { if (e.key === "Backspace" && loginCode.length === 0) e.preventDefault(); if (e.key === "Enter" && loginCode.length > 0) fetchUser("ALT" + loginCode); }}
                      maxLength={9} className="w-full p-4 rounded-2xl bg-stone-50 border border-stone-100 text-center font-black uppercase text-stone-800 tracking-[0.3em] text-[16px] md:text-lg outline-none focus:border-brand-sky focus:ring-2 focus:ring-brand-sky/20 transition-all touch-manipulation"
                    />
                    <button onClick={() => fetchUser("ALT" + loginCode)} disabled={loginCode.length === 0} className="w-full p-4 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest disabled:opacity-30 transition-all active:scale-95 touch-manipulation">Avanti</button>
                    <button onClick={loadDemo} className="w-full p-3 rounded-2xl font-black uppercase tracking-widest text-[10px] text-stone-900 border border-stone-100 hover:bg-stone-50 transition-all active:scale-95 touch-manipulation">Anteprima senza tessera</button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-xs font-bold text-stone-400 uppercase">Inserisci il tuo PIN a {PIN_LENGTH} cifre</p>
                    <PinInput value={loginPin} onChange={setLoginPin} onComplete={handleVerifyPin} length={PIN_LENGTH} disabled={isVerifying} />
                    <button onClick={handleVerifyPin} disabled={isVerifying || loginPin.length !== PIN_LENGTH} className="w-full p-4 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest touch-manipulation">{isVerifying ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Accedi"}</button>
                    <button onClick={() => { setLoginStep("code"); setLoginPin(""); setLoginError(""); }} className="text-[10px] font-black uppercase text-stone-300 mt-4 touch-manipulation">Indietro</button>
                  </div>
                )}
                {loginError && <p className="mt-4 text-red-500 text-xs font-bold">{loginError}</p>}
                <div className="mt-8 pt-6 border-t border-stone-100">
                  <button onClick={() => setShowSupportModal(true)} className="text-[10px] font-black uppercase text-stone-400 hover:text-sky-500 transition-colors underline underline-offset-4 active:scale-95 touch-manipulation">Problemi ad accedere? Contattaci</button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Modal Supporto Form */}
          {showSupportModal && (
            <motion.div key="support-modal" className="fixed inset-0 z-[99999] flex items-center justify-center p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeSupportModal} className="absolute inset-0 bg-stone-900/85" />
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative z-10 w-full max-w-sm bg-white rounded-[3rem] p-8 md:p-10 shadow-2xl overflow-hidden border border-white/20">
                <button onClick={closeSupportModal} disabled={isSubmittingSupport} className="absolute top-6 right-6 p-2 bg-stone-50 rounded-full text-stone-400 hover:text-stone-600 transition-colors active:scale-90 touch-manipulation"><X size={20} /></button>
                <AnimatePresence mode="wait">
                  {supportStep === "INPUT" ? (
                    <motion.div key="input" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="min-h-[400px] flex flex-col justify-center">
                      <div className="text-center mb-5">
                        <h3 className="text-xl font-black uppercase tracking-tight">Supporto</h3>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Non trovi il PIN o la tessera?</p>
                      </div>
                      <div className="space-y-3">
                        <input type="text" placeholder="Nome e Cognome" className="w-full bg-stone-50 p-4 rounded-2xl text-[16px] md:text-sm font-bold border-2 border-transparent focus:border-sky-500 outline-none transition-colors touch-manipulation" value={supportData.nome} onChange={(e) => setSupportData({...supportData, nome: e.target.value})} />
                        <input ref={inputSupportRef} type="text" inputMode="numeric" placeholder="Codice Tessera (opzionale)" className="w-full bg-stone-50 p-4 rounded-2xl text-[16px] md:text-sm font-bold border-2 border-transparent focus:border-sky-500 outline-none transition-colors touch-manipulation" value={supportData.codice} onChange={(e) => setSupportData({...supportData, codice: e.target.value.replace(/\D/g, "")})} />
                        <input type="text" placeholder="La tua Email o Cellulare" className="w-full bg-stone-50 p-4 rounded-2xl text-[16px] md:text-sm font-bold border-2 border-transparent focus:border-sky-500 outline-none transition-colors touch-manipulation" value={supportData.contatto} onChange={(e) => setSupportData({...supportData, contatto: e.target.value})} />
                        <label className="flex items-center gap-3 p-2 bg-stone-50 rounded-2xl cursor-pointer select-none active:scale-[0.99] transition-transform touch-manipulation">
                          <input type="checkbox" checked={supportData.richiediStorico} onChange={(e) => setSupportData({...supportData, richiediStorico: e.target.checked})} className="w-5 h-5 rounded-md border-stone-300 text-sky-500 focus:ring-sky-500 cursor-pointer" />
                          <span className="text-[10px] font-black uppercase text-stone-600 tracking-wider leading-tight">Richiedi anche caricamento storico attività passate</span>
                        </label>
                        <textarea placeholder="Descrivi il problema (opzionale)..." className="w-full bg-stone-50 p-4 rounded-2xl text-[16px] md:text-sm font-bold h-20 resize-none border-2 border-transparent focus:border-sky-500 outline-none transition-colors touch-manipulation" value={supportData.problema} onChange={(e) => setSupportData({...supportData, problema: e.target.value})} />
                        {supportError && <p className="text-red-500 text-[10px] font-black mt-2 uppercase text-center py-2 bg-red-50 rounded-lg">{supportError}</p>}
                        <button onClick={submitSupportRequest} disabled={isSubmittingSupport} className="w-full mt-2 bg-sky-500 text-white p-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-sky-200 active:scale-95 transition-transform flex justify-center items-center gap-2 touch-manipulation">{isSubmittingSupport ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Invia Richiesta</>}</button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center min-h-[400px]">
                      <div className="mb-4"><CheckCircle2 size={48} className="text-emerald-400 mx-auto" /></div>
                      <div className="mb-6 p-6 rounded-3xl bg-emerald-50"><FileText size={40} className="text-emerald-500" /></div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-stone-800 mb-1">Richiesta Inviata</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-6 leading-relaxed">Il team ha ricevuto la tua segnalazione e ti aiuterà al più presto a rientrare!</p>
                      <button onClick={closeSupportModal} className="w-full mt-2 bg-stone-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-transform shadow-lg touch-manipulation">Perfetto!</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}

          {/* Modal Riscatto Scarpone */}
          {showRedeem && (
            <motion.div key="redeem-modal" className="fixed inset-0 z-[99999] flex items-center justify-center p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeRedeem} className="absolute inset-0 bg-stone-900/85" />
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative z-10 w-full max-w-sm bg-white rounded-[3rem] p-8 md:p-10 shadow-2xl overflow-hidden border border-white/20">
                <button onClick={closeRedeem} disabled={isVerifying} className="absolute top-6 right-6 p-2 bg-stone-50 rounded-full text-stone-400 hover:text-stone-600 transition-colors active:scale-90 touch-manipulation"><X size={20} /></button>
                <AnimatePresence mode="wait">
                  {redeemStep === "INPUT" ? (
                    <motion.div key="input" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="min-h-[300px] flex flex-col justify-center">
                      <div className="text-center mb-8"><div className="inline-flex p-4 bg-sky-50 rounded-2xl mb-4"><Plus className="text-sky-500" size={28} /></div><h3 className="text-2xl font-black uppercase tracking-tight">Codice Scarpone</h3><p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Inserisci il codice ricevuto</p></div>
                      <input 
                        className="w-full bg-stone-50 border-2 border-stone-100 p-5 rounded-2xl text-center text-2xl font-black uppercase outline-none focus:border-sky-500 transition-colors shadow-inner touch-manipulation text-[16px]" 
                        placeholder="ES. TREK24" 
                        autoCapitalize="characters"
                        autoCorrect="off"
                        spellCheck={false}
                        value={redeemCode} 
                        onChange={(e) => setRedeemCode(e.target.value.toUpperCase().trim())} 
                        onKeyDown={(e) => e.key === "Enter" && verifyCode()} 
                      />
                      {redeemError && <p className="text-red-500 text-[10px] font-black mt-3 uppercase text-center py-2 bg-red-50 rounded-lg">{redeemError}</p>}
                      <button onClick={verifyCode} disabled={isVerifying || !redeemCode.trim()} className="w-full mt-6 bg-stone-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-transform disabled:opacity-50 shadow-lg touch-manipulation">{isVerifying ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Verifica Codice"}</button>
                    </motion.div>
                  ) : (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center w-full min-h-[300px]">
                      <div className="mb-2"><CheckCircle2 size={48} className="text-emerald-400 mx-auto" /></div>
                      {unlockedBootsPreview.length > 1 ? (
                        <>
                          <h3 className="text-xl font-black uppercase tracking-tight text-stone-800 mb-1">Tour Completato 🏔️</h3>
                          <p className="text-[11px] font-black uppercase tracking-widest text-emerald-500 mb-4">+{unlockedBootsPreview.length} Scarponi Aggiunti!</p>
                          <div className="flex flex-wrap justify-center gap-3 my-4 w-full">
                            {unlockedBootsPreview.map((boot, idx) => (
                              <motion.div key={idx} initial={{ scale: 0, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={{ delay: idx * 0.15, type: "spring", stiffness: 300 }} className="flex flex-col items-center">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md" style={{ backgroundColor: `${boot.colore}15`, border: `1px solid ${boot.colore}30` }}><MemoIconaScarponeCustom size={40} color={boot.colore} isActive={true} /></div>
                                <span className="text-[9px] font-black uppercase mt-2 text-stone-500 max-w-[70px] leading-tight line-clamp-2">{boot.titolo.split('(')[1]?.replace(')','') || `Tappa ${idx+1}`}</span>
                              </motion.div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="mb-4 p-6 rounded-3xl mt-2" style={{ backgroundColor: `${unlockedBootsPreview[0]?.colore}15` }}><MemoIconaScarponeCustom size={80} color={unlockedBootsPreview[0]?.colore || "#5aaadd"} isActive={true} /></div>
                          <h3 className="text-xl font-black uppercase tracking-tight text-stone-800 mb-1 leading-tight px-4">{unlockedBootsPreview[0]?.titolo}</h3>
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-4 mt-2">Scarpone Riscattato! 🎉</p>
                        </>
                      )}
                      {newlyUnlockedBadges.length > 0 && <div className="w-full p-3 rounded-xl bg-sky-50 text-center mt-2"><span className="text-[9px] font-black uppercase tracking-widest text-sky-700">{newlyUnlockedBadges.length > 1 ? `Nuovi badge: ${newlyUnlockedBadges.join(', ')}` : `Nuovo badge: ${newlyUnlockedBadges[0]}`}</span></div>}
                      {newlyUnlockedAchievements.length > 0 && <div className="w-full p-3 rounded-xl bg-purple-50 text-center mt-2"><span className="text-[9px] font-black uppercase tracking-widest text-purple-700">{newlyUnlockedAchievements.length > 1 ? `${newlyUnlockedAchievements.length} Traguardi Sbloccati!` : `Traguardo Sbloccato: ${newlyUnlockedAchievements[0].name}!`}</span></div>}
                      <button onClick={closeRedeem} className="w-full mt-6 bg-stone-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-transform shadow-lg touch-manipulation">Perfetto!</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}

          {/* Modal Richiesta Storico */}
          {showHistoryModal && (
            <motion.div key="history-modal" className="fixed inset-0 z-[99999] flex items-center justify-center p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeHistoryModal} className="absolute inset-0 bg-stone-900/85" />
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative z-10 w-full max-w-sm bg-white rounded-[3rem] p-8 md:p-10 shadow-2xl overflow-hidden border border-white/20">
                <button onClick={closeHistoryModal} disabled={isSubmittingHistory} className="absolute top-6 right-6 p-2 bg-stone-50 rounded-full text-stone-400 hover:text-stone-600 transition-colors active:scale-90 touch-manipulation"><X size={20} /></button>
                <AnimatePresence mode="wait">
                  {historyStep === "INPUT" ? (
                    <motion.div key="input" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="min-h-[300px] flex flex-col justify-center">
                      <div className="text-center mb-6">
                        <div className="inline-flex p-4 bg-stone-100 rounded-2xl mb-4"><History className="text-stone-600" size={28} /></div>
                        <h3 className="text-2xl font-black uppercase tracking-tight">Aggiorna Storico</h3>
                        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mt-2 mb-4 leading-relaxed">Conferma l'email per consentire al team di associare correttamente i tuoi vecchi scarponi a questa tessera digitale.</p>
                      </div>
                      <input type="text" placeholder="Inserisci la tua email..." className="w-full bg-stone-50 p-4 rounded-2xl text-[16px] md:text-sm font-bold border-2 border-transparent focus:border-sky-500 outline-none transition-colors mb-2 touch-manipulation" value={historyEmail} onChange={(e) => setHistoryEmail(e.target.value)} />
                      {historyError && <p className="text-red-500 text-[10px] font-black mb-2 mt-2 uppercase text-center py-2 bg-red-50 rounded-lg">{historyError}</p>}
                      <button onClick={submitHistoryRequest} disabled={isSubmittingHistory} className="w-full mt-4 bg-stone-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-transform shadow-lg flex justify-center items-center gap-2 touch-manipulation">{isSubmittingHistory ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Invia Richiesta</>}</button>
                    </motion.div>
                  ) : (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center min-h-[300px]">
                      <div className="mb-4"><CheckCircle2 size={48} className="text-emerald-400 mx-auto" /></div>
                      <div className="mb-6 p-6 rounded-3xl bg-emerald-50"><FileText size={40} className="text-emerald-500" /></div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-stone-800 mb-1">Richiesta Inviata</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-6 leading-relaxed">L'organizzazione ha ricevuto la richiesta. La tua Tessera verrà aggiornata al termine delle verifiche!</p>
                      <button onClick={closeHistoryModal} className="w-full mt-2 bg-stone-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-transform shadow-lg touch-manipulation">Perfetto!</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}

          {/* Dettaglio Scarpone (Swipeable) */}
          {selectedBoot && selectedBootIndex !== null && (
            <motion.div key="boot-detail-modal" className="fixed inset-0 z-[99999] flex items-center justify-center p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedBootIndex(null)} className="absolute inset-0 bg-stone-900/85" />
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative w-full max-w-sm bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/20 z-10">
                <div className="absolute top-0 left-0 right-0 z-[100] flex justify-between items-center p-6">
                  <div className="flex gap-2">
                     <button onClick={handlePrevBoot} disabled={selectedBootIndex === 0} className="p-3 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-600 disabled:opacity-30 active:scale-90 transition-all shadow-sm touch-manipulation cursor-pointer"><ChevronLeft size={20} /></button>
                     <button onClick={handleNextBoot} disabled={selectedBootIndex === escursioniCompletateParsed.length - 1} className="p-3 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-600 disabled:opacity-30 active:scale-90 transition-all shadow-sm touch-manipulation cursor-pointer"><ChevronRight size={20} /></button>
                  </div>
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedBootIndex(null); }} className="p-3 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-500 hover:text-stone-700 active:scale-90 transition-all shadow-sm touch-manipulation cursor-pointer"><X size={20} /></button>
                </div>
                {/* Fixed height container for flawless popLayout alternative */}
                <div className="relative w-full h-[400px] overflow-hidden mt-16 mb-4">
                  <AnimatePresence custom={slideDirection}>
                    <motion.div
                      key={selectedBootIndex}
                      custom={slideDirection}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.2}
                      onDragEnd={(_e, info) => {
                        const swipeThreshold = 40;
                        if (info.offset.x < -swipeThreshold) handleNextBoot();
                        else if (info.offset.x > swipeThreshold) handlePrevBoot();
                      }}
                      className="absolute inset-0 flex flex-col items-center justify-center text-center touch-pan-y cursor-grab active:cursor-grabbing w-full px-8"
                      style={{ WebkitBackfaceVisibility: 'hidden' }}
                    >
                      <div className="w-32 h-32 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-xl" style={{ backgroundColor: selectedBoot.colore + "15", border: `1px solid ${selectedBoot.colore}20` }}>
                        <MemoIconaScarponeCustom size={80} color={selectedBoot.colore} isActive={true} />
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 mb-4 pointer-events-none">
                        <div className="px-4 py-1.5 rounded-full bg-stone-100 text-[10px] font-black uppercase text-stone-500 tracking-widest border border-stone-200/50">{getFilosofiaName(selectedBoot.colore)}</div>
                        {selectedBoot.difficolta && <div className="px-4 py-1.5 rounded-full bg-stone-100 text-[10px] font-black uppercase text-stone-500 tracking-widest border border-stone-200/50">{selectedBoot.difficolta}</div>}
                      </div>
                      <h3 className="text-2xl font-black uppercase leading-tight mb-4 tracking-tight pointer-events-none">{selectedBoot.titolo}</h3>
                      <div className="flex flex-col gap-2 w-full pt-6 border-t border-stone-50 pointer-events-none">
                        <div className="flex items-center justify-center gap-2 text-stone-400">
                          <Calendar size={14} />
                          <p className="text-[11px] font-bold uppercase tracking-widest">{new Date(selectedBoot.data).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</p>
                        </div>
                        {selectedBoot.categoria && (
                          <div className="flex items-center justify-center gap-2 text-stone-400">
                            <MapPin size={14} />
                            <p className="text-[11px] font-bold uppercase tracking-widest">{selectedBoot.categoria}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5">
                  {escursioniCompletateParsed.map((_, idx) => (
                    <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === selectedBootIndex ? "w-4 bg-stone-800" : "w-1.5 bg-stone-200"}`} />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Dettaglio Badge */}
          {selectedBadge && (
            <BadgeDetailPopup key="badge-popup" filo={selectedBadge.filo} count={selectedBadge.count} onClose={() => setSelectedBadge(null)} />
          )}

          {/* Dettaglio Traguardo (Achievement) */}
          {selectedAchievement && (
            <motion.div key="achievement-modal" className="fixed inset-0 z-[99999] flex items-center justify-center p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedAchievement(null)} className="absolute inset-0 bg-stone-900/85" />
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 40 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative z-10 w-full max-w-sm bg-white rounded-[3rem] p-8 md:p-10 shadow-2xl overflow-hidden border border-white/20">
                <button onClick={() => setSelectedAchievement(null)} className="absolute top-6 right-6 p-2 bg-stone-50 rounded-full text-stone-400 hover:text-stone-600 transition-colors active:scale-90 touch-manipulation"><X size={20} /></button>
                <div className="flex flex-col items-center text-center">
                  <div className="w-32 h-32 rounded-[2.5rem] flex items-center justify-center mb-8 bg-stone-50 border-2 border-stone-100 shadow-xl"><span className="text-6xl drop-shadow-sm">{selectedAchievement.emoji}</span></div>
                  <h3 className="text-2xl font-black uppercase leading-tight mb-3 tracking-tight">{selectedAchievement.name}</h3>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-8 leading-relaxed">{selectedAchievement.description}</p>
                  <div className="w-full p-6 bg-stone-50 rounded-[2rem] border border-stone-100">
                    <p className="text-[10px] font-black uppercase text-stone-400 mb-3 tracking-widest">Progresso Attuale</p>
                    {(() => {
                      const prog = selectedAchievement.progress(escursioniCompletateParsed);
                      return (
                        <>
                          <div className="flex items-center justify-between mb-2"><span className="text-sm font-black uppercase tabular-nums">{prog.current} / {prog.total}</span><span className="text-sm font-black text-sky-500 tabular-nums">{Math.round((prog.current / prog.total) * 100)}%</span></div>
                          <div className="h-2.5 w-full bg-stone-200 rounded-full mt-1.5 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${(prog.current / prog.total) * 100}%` }} transition={{ duration: 1.2, ease: "easeOut" }} className="h-full bg-sky-500" /></div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </ModalPortal>

      {userTessera && (
        <>
          {/* HERO */}
          <div className="relative h-[45vh] md:h-[55vh] w-full flex items-center justify-center text-center overflow-hidden">
            <img src="https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Hero_tessera.webp" className="absolute inset-0 w-full h-full object-cover object-[center_60%]" alt="header bg" />
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-[50%] to-black/40" />
            <button onClick={handleLogout} className="absolute top-4 right-4 p-3 bg-black/20 backdrop-blur-md rounded-full text-white border border-white/10 z-50 hover:bg-black/40 transition-colors touch-manipulation"><LogOut size={18} /></button>
            <div className="relative z-20 px-4 flex flex-col items-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <h1 className="text-3xl md:text-5xl font-black text-white uppercase drop-shadow-lg tracking-tight">Passaporto Altour</h1>
                <p className="text-white font-black text-lg md:text-2xl uppercase tracking-tight mt-1 leading-none drop-shadow-md">{userTessera.nome_escursionista} {userTessera.cognome_escursionista}</p>
                <p className="text-white/70 font-black tracking-[0.4em] text-[10px] md:text-[12px] uppercase mt-2 mb-6">Cod. {userTessera.codice_tessera}</p>
                <div className="inline-flex items-center gap-4 px-6 py-4 rounded-[2rem] backdrop-blur-xl border border-white/20 bg-white/15 shadow-2xl">
                  <MemoIconaScarponeCustom size={50} color="#5aaadd" isActive={true} />
                  <div className="flex flex-col items-start">
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/60 leading-none mb-1">Profilo Escursionista</span>
                    <span className="text-[13px] md:text-[16px] font-black uppercase tracking-wide text-white leading-none drop-shadow-sm">{userTessera.livello || stats?.currentLevelLabel}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="sticky top-0 z-40 bg-[#f5f2ed]/90 backdrop-blur-sm border-b border-stone-200/40 px-4 py-4 mb-8">
            <div className="max-w-xl mx-auto flex gap-3">
              {(["TESSERA", "BADGE", "TRAGUARDI"] as TabType[]).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 touch-manipulation ${activeTab === tab ? "bg-[#5aaadd] text-white shadow-xl scale-[1.02]" : "bg-white text-stone-400 border border-stone-100 hover:bg-stone-50"}`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="max-w-xl mx-auto px-4 relative z-30 -mt-10">
            <AnimatePresence mode="wait">
             {activeTab === "TESSERA" && (
                <motion.div key="tessera" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.2 }}>
                  <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-white/60">
                    <div className="flex items-center gap-5 mb-8">
                      <div className="relative flex-shrink-0">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-20 h-20 rounded-[2rem] bg-stone-50 border border-stone-100 overflow-hidden flex items-center justify-center shadow-inner cursor-pointer touch-manipulation" onClick={() => fileInputRef.current?.click()}>
                          {userTessera.avatar_url ? <img src={userTessera.avatar_url} className="w-full h-full object-cover object-center" alt="avatar" /> : <User size={32} className="text-stone-300" />}
                          {avatarUploading && <div className="absolute inset-0 bg-black/30 rounded-[2rem] flex items-center justify-center"><Loader2 className="w-6 h-6 text-white animate-spin" /></div>}
                        </motion.div>
                        <button onClick={() => fileInputRef.current?.click()} disabled={avatarUploading} className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-white border border-stone-200 shadow-md flex items-center justify-center hover:bg-stone-50 active:scale-90 transition-all disabled:opacity-50 touch-manipulation"><Camera size={13} className="text-stone-600" /></button>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-sky-500 mb-1">
                          <ShieldCheck size={14} />
                          <span className="text-[10px] font-black uppercase tracking-wider">Escursionista Verificato</span>
                        </div>
                        <h2 className="text-2xl font-black uppercase leading-tight">{userTessera.nome_escursionista} {userTessera.cognome_escursionista}</h2>
                        <p className="text-[11px] font-black text-stone-400 uppercase tracking-widest mt-0.5">{userTessera.livello || stats?.currentLevelLabel} · {escursioniCompletateParsed.length || 0} Scarponi</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
                      <div className="p-2 md:p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100/70 border border-sky-100 shadow-sm flex flex-col items-center justify-center text-center transition-transform active:scale-[0.98]">
                        <Footprints className="w-5 h-5 md:w-7 md:h-7 text-sky-600 mb-2" />
                        <p className="text-[8px] md:text-[9px] font-black uppercase text-sky-500 tracking-wider">Distanza</p>
                        <p className="text-base md:text-xl font-black text-sky-950 leading-tight">{stats?.kmTotali} <span className="text-[9px] md:text-sm font-bold text-sky-400">km</span></p>
                      </div>
                      <div className="p-2 md:p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/70 border border-emerald-100 shadow-sm flex flex-col items-center justify-center text-center transition-transform active:scale-[0.98]">
                        <Mountain className="w-5 h-5 md:w-7 md:h-7 text-emerald-600 mb-2" />
                        <p className="text-[8px] md:text-[9px] font-black uppercase text-emerald-500 tracking-wider">Dislivello</p>
                        <p className="text-base md:text-xl font-black text-emerald-950 leading-tight">{stats?.dislivelloTotali} <span className="text-[9px] md:text-sm font-bold text-emerald-400">m</span></p>
                      </div>
                      <div className="p-2 md:p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/70 border border-amber-100 shadow-sm flex flex-col items-center justify-center text-center transition-transform active:scale-[0.98]">
                        <span className="text-xl md:text-2xl mb-2">⛰️</span>
                        <p className="text-[8px] md:text-[9px] font-black uppercase text-amber-600 tracking-wider">Quota</p>
                        <p className="text-base md:text-xl font-black text-amber-950 leading-tight">{stats?.quotaRaggiunta} <span className="text-[9px] md:text-sm font-bold text-amber-500">m</span></p>
                      </div>
                    </div>

                    <motion.div 
                      drag="x" 
                      dragConstraints={{ left: 0, right: 0 }} 
                      dragElastic={0.2} 
                      onDragEnd={handleDragEnd} 
                      className="grid grid-cols-4 gap-2 md:gap-4 mb-8 touch-pan-y"
                    >
                      {Array.from({ length: SLOTS_PER_PAGE }).map((_, i) => {
                        const esc = escursioniCompletateParsed?.[currentPage * SLOTS_PER_PAGE + i];
                        return (
                          <motion.div key={i} whileTap={esc ? { scale: 0.95 } : {}} onClick={() => esc && setSelectedBootIndex(currentPage * SLOTS_PER_PAGE + i)} className={`aspect-square rounded-xl md:rounded-2xl bg-stone-50 border-2 border-dashed border-stone-100 flex items-center justify-center transition-colors duration-200 ${ esc ? "cursor-pointer bg-white shadow-sm border-solid border-stone-50" : "opacity-40" }`} style={{ WebkitTapHighlightColor: "transparent" }}>
                            <MemoIconaScarponeCustom size={window.innerWidth < 768 ? 44 : 64} color={esc?.colore} isActive={!!esc} />
                          </motion.div>
                        );
                      })}
                    </motion.div>

                    <div className="flex justify-between items-center pt-6 border-t border-stone-50">
                      <button disabled={currentPage === 0} onClick={() => setCurrentPage((p) => p - 1)} className="p-3 bg-stone-50 rounded-full disabled:opacity-20 hover:bg-stone-100 transition-all active:scale-90 touch-manipulation"><ChevronLeft size={20} /></button>
                      <span className="text-[11px] font-black uppercase text-stone-300 tracking-[0.2em]">Pagina {currentPage + 1} di {stats?.totalPages}</span>
                      <button disabled={currentPage >= (stats?.totalPages || 1) - 1} onClick={() => setCurrentPage((p) => p + 1)} className="p-3 bg-stone-50 rounded-full disabled:opacity-20 hover:bg-stone-100 transition-all active:scale-90 touch-manipulation"><ChevronRight size={20} /></button>
                    </div>
                  </div>

                  <motion.button 
                    onClick={() => setShowRedeem(true)} 
                    disabled={isDemo} 
                    whileHover={isDemo ? {} : { scale: 1.02 }} 
                    whileTap={isDemo ? {} : { scale: 0.98 }} 
                    className="w-full mt-6 p-6 bg-sky-500 text-white rounded-[2.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-4 shadow-xl shadow-sky-200 relative overflow-hidden transition-transform disabled:opacity-40 disabled:pointer-events-none touch-manipulation"
                  >
                    {!isDemo && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />
                    )}
                    <Plus size={24} strokeWidth={3} /> Riscatta Scarpone
                  </motion.button>

                  <motion.button 
                    onClick={() => {
                      setHistoryEmail(userTessera.email_utente || ""); 
                      setShowHistoryModal(true);
                    }} 
                    disabled={isDemo} 
                    whileHover={isDemo ? {} : { scale: 1.02 }} 
                    whileTap={isDemo ? {} : { scale: 0.98 }} 
                    className="w-full mt-4 p-5 bg-white border-2 border-stone-200 text-stone-700 rounded-[2.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-sm hover:border-stone-300 hover:shadow-md transition-all disabled:opacity-40 disabled:pointer-events-none touch-manipulation"
                  >
                    <History size={20} strokeWidth={2.5} /> Richiedi Storico
                  </motion.button>
                  
                  <motion.button 
                    onClick={() => {
                      const target = document.getElementById("lascia-feedback");
                      if (target) { target.scrollIntoView({ behavior: "smooth" }); } 
                      else { window.open("https://www.altouritaly.it/#lascia-feedback", "_blank", "noopener,noreferrer"); }
                    }}
                    disabled={isDemo} 
                    whileHover={isDemo ? {} : { scale: 1.02 }} 
                    whileTap={isDemo ? {} : { scale: 0.98 }} 
                    className="w-full mt-4 p-5 bg-stone-50 border border-stone-200 text-stone-600 rounded-[2.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-sm hover:bg-white hover:border-stone-300 hover:shadow-md transition-all disabled:opacity-40 disabled:pointer-events-none touch-manipulation"
                  >
                    <span className="text-xl">⭐</span> Lascia un Feedback
                  </motion.button>
                </motion.div>
              )}

              {activeTab === "BADGE" && (
                <motion.div key="badge" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.2 }} className="bg-white rounded-[3rem] p-8 shadow-2xl border border-white/60">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-stone-900 flex items-center justify-center shadow-lg"><Award size={24} className="text-white" /></div>
                    <div>
                      <h3 className="text-xl font-black uppercase leading-none">Collezione Filosofie</h3>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">4 per sbloccare · 8 per dimezzare · 16 per completare</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-x-4 gap-y-8">
                    {Object.keys(BADGE_NAMES).map(filo => (
                      <MemoBadgeChip key={filo} filo={filo} count={badgeCounts[filo] || 0} onClick={() => setSelectedBadge({ filo, count: badgeCounts[filo] || 0 })} />
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "TRAGUARDI" && (
                <motion.div key="traguardi" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.2 }} className="bg-white rounded-[3rem] p-8 shadow-2xl border border-white/60">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-stone-900 flex items-center justify-center shadow-lg"><Trophy size={24} className="text-white" /></div>
                    <div>
                      <h3 className="text-xl font-black uppercase leading-none">Traguardi Speciali</h3>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Sfide comportamentali e di costanza</p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    {ACHIEVEMENT_BADGES.map(badge => {
                      const isUnlocked = badge.check(escursioniCompletateParsed);
                      const prog = badge.progress(escursioniCompletateParsed);
                      return (
                        <motion.div key={badge.id} whileHover={{ scale: 1.02, x: 5 }} whileTap={{ scale: 0.98 }} onClick={() => setSelectedAchievement(badge)} className={`p-5 rounded-[2rem] border transition-colors cursor-pointer ${isUnlocked ? "bg-stone-50 border-stone-200 shadow-sm" : "bg-white border-stone-100 opacity-50"}`}>
                          <div className="flex items-center gap-4">
                            <span className="text-3xl drop-shadow-sm">{badge.emoji}</span>
                            <div className="flex-1">
                              <h4 className="text-xs font-black uppercase tracking-wide">{badge.name}</h4>
                              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{badge.description}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[11px] font-black uppercase text-stone-400 tabular-nums">{prog.current}/{prog.total}</span>
                              <div className="w-16 h-1.5 bg-stone-100 rounded-full mt-1.5 overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${(prog.current / prog.total) * 100}%` }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-sky-500" /></div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  <div className="mt-8 pt-6 border-t border-stone-100 text-center">
                    <p className="text-[12px] italic text-stone-500 leading-relaxed max-w-[90%] mx-auto">“Solo coloro che tentano l'assurdo raggiungeranno l'impossibile”</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mt-2">— M.C. Escher</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <style>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
        </>
      )}
    </div>
  );
}