import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  X,
  Loader2,
  ShieldCheck,
  LogOut,
  Plus,
  Star,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Gift,
  CheckCircle2,
  User,
  Camera,
  Award,
  Mail,
  FileDown,
  Trophy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";

const SESSION_KEY = "altour_session_v4";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const MAX_REDEEM_ATTEMPTS = 10;
const REDEEM_CODE_REGEX = /^[A-Z0-9]{3,10}$/;
const TESSERA_CODE_REGEX = /^ALT[A-Z0-9]{1,10}$/;

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
  "Tra mare e cielo":       "#7aaecd",
  "Trek urbano":            "#f39452",
  "Tracce sulla neve":      "#a8cce0",
  "Cielo stellato":         "#1e2855",
};

const DEFAULT_BOOT_COLOR = "#5aaadd";
const BADGE_THRESHOLD = 5;

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
  "Tra mare e cielo":       "Navigatore",
  "Trek urbano":            "Flaneur",
  "Tracce sulla neve":      "Segugio della Neve",
  "Cielo stellato":         "Astronomo",
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
  "Tra mare e cielo":       "🌊",
  "Trek urbano":            "🏙",
  "Tracce sulla neve":      "❄️",
  "Cielo stellato":         "🌠",
};

const FILOSOFIA_ALIAS: Record<string, string> = {
  "Outdoor Education":    "Educazione all'aperto",
  "Luoghi dello Spirito": "Luoghi dello spirito",
  "Tra Mare e Cielo":     "Tra mare e cielo",
  "Trek Urbano":          "Trek urbano",
  "Giornata da Guida":    "Novità",
};

function normalizeFilosofia(value?: string | null): string | null {
  if (!value) return value ?? null;
  return FILOSOFIA_ALIAS[value.trim()] ?? value.trim();
}

function getFilosofiaColor(filosofia?: string | null): string {
  if (!filosofia) return DEFAULT_BOOT_COLOR;
  const f = normalizeFilosofia(filosofia);
  return FILOSOFIA_COLORS[f ?? ""] ?? DEFAULT_BOOT_COLOR;
}

// O(1) reverse map — built once at module level
const HEX_TO_FILOSOFIA: Record<string, string> = Object.fromEntries(
  Object.entries(FILOSOFIA_COLORS).map(([k, v]) => [v, k])
);
function getFilosofiaName(hex: string): string {
  return HEX_TO_FILOSOFIA[hex] ?? "";
}

interface EscursioneCompletata { titolo: string; colore: string; data: string; categoria?: string; difficolta?: string; }

function computeEarnedBadges(escursioni: EscursioneCompletata[]): string[] {
  const counts: Record<string, number> = {};
  for (const e of escursioni) {
    const filo = getFilosofiaName(e.colore);
    if (filo) counts[filo] = (counts[filo] || 0) + 1;
  }
  return Object.entries(counts).filter(([, n]) => n >= BADGE_THRESHOLD).map(([f]) => f);
}

// ─── Achievement Badges (comportamentali) ────────────────────────────────────
function getSeason(date: Date): string {
  const m = date.getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}

interface AchievementBadge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  check: (escursioni: EscursioneCompletata[]) => boolean;
  progress: (escursioni: EscursioneCompletata[]) => { current: number; total: number };
}

const ACHIEVEMENT_BADGES: AchievementBadge[] = [
  {
    id: "streak_tour",
    name: "Lupo dei Cammini",
    emoji: "🐺",
    description: "3 tour completati",
    color: "#e94544",
    check: (e) => e.filter(x => x.categoria === "tour").length >= 3,
    progress: (e) => ({ current: Math.min(e.filter(x => x.categoria === "tour").length, 3), total: 3 }),
  },
  {
    id: "assiduo",
    name: "Assiduo",
    emoji: "🎯",
    description: "8 giornate completate",
    color: "#01aa9f",
    check: (e) => e.filter(x => x.categoria === "giornata").length >= 8,
    progress: (e) => ({ current: Math.min(e.filter(x => x.categoria === "giornata").length, 8), total: 8 }),
  },
  {
    id: "collezionista",
    name: "Collezionista",
    emoji: "💎",
    description: "5 filosofie diverse",
    color: "#946a52",
    check: (e) => new Set(e.map(x => getFilosofiaName(x.colore)).filter(Boolean)).size >= 5,
    progress: (e) => ({ current: Math.min(new Set(e.map(x => getFilosofiaName(x.colore)).filter(Boolean)).size, 5), total: 5 }),
  },
  {
    id: "stagionale",
    name: "Anima delle Stagioni",
    emoji: "🍂",
    description: "Tutte e 4 le stagioni",
    color: "#75c43c",
    check: (e) => new Set(e.map(x => getSeason(new Date(x.data)))).size >= 4,
    progress: (e) => ({ current: Math.min(new Set(e.map(x => getSeason(new Date(x.data)))).size, 4), total: 4 }),
  },
  {
    id: "esploratore_verticale",
    name: "Esploratore Verticale",
    emoji: "⚡",
    description: "Facile → Media → Impegnativa",
    color: "#002f59",
    check: (e) => {
      const diffs = e.map(x => x.difficolta ?? "").filter(Boolean);
      return (
        diffs.some(d => d === "Facile") &&
        diffs.some(d => d === "Media" || d === "Facile-Media" || d === "Media-Impegnativa") &&
        diffs.some(d => d === "Impegnativa" || d === "Media-Impegnativa")
      );
    },
    progress: (e) => {
      const diffs = e.map(x => x.difficolta ?? "").filter(Boolean);
      let n = 0;
      if (diffs.some(d => d === "Facile")) n++;
      if (diffs.some(d => d === "Media" || d === "Facile-Media" || d === "Media-Impegnativa")) n++;
      if (diffs.some(d => d === "Impegnativa" || d === "Media-Impegnativa")) n++;
      return { current: n, total: 3 };
    },
  },
];

// ─── Utilities ───────────────────────────────────────────────────────────────
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function fetchTessera(codice: string) {
  return supabase
    .from("tessere")
    .select("*")
    .eq("codice_tessera", codice.toUpperCase().trim())
    .single();
}

async function fetchTesseraSession(codice: string) {
  return supabase
    .from("tessere")
    .select("*")
    .eq("codice_tessera", codice.toUpperCase().trim())
    .single();
}
function saveSession(codice: string) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ code: codice, expires: Date.now() + SESSION_DURATION_MS }));
}
function loadSession(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { code, expires } = JSON.parse(raw);
    if (Date.now() < expires) return code;
    localStorage.removeItem(SESSION_KEY);
    return null;
  } catch { localStorage.removeItem(SESSION_KEY); return null; }
}

async function fireConfetti(color: string) {
  const { default: confetti } = await import("canvas-confetti");
  confetti({ particleCount: 160, spread: 70, colors: [color, "#ffffff", "#f5f2ed"] });
}
async function fireBadgeConfetti(color: string) {
  const { default: confetti } = await import("canvas-confetti");
  confetti({ particleCount: 80, spread: 50, origin: { x: 0.3, y: 0.6 }, colors: [color, "#ffffff", "#f5f2ed"] });
  setTimeout(() => confetti({ particleCount: 80, spread: 50, origin: { x: 0.7, y: 0.6 }, colors: [color, "#ffffff", "#f5f2ed"] }), 150);
}

const IconaScarponeCustom = ({ size = 24, color = "#d6d3d1", isActive = false, className = "" }: { size?: number; color?: string; isActive?: boolean; className?: string }) => {
  const baseStyle = { width: size, height: size, transition: "all 0.3s ease-in-out" };
  if (isActive) return (
    <div className={`flex-shrink-0 ${className}`} style={{ ...baseStyle, backgroundColor: color, maskImage: "url('/scarpone.png')", WebkitMaskImage: "url('/scarpone.png')", maskRepeat: "no-repeat", WebkitMaskRepeat: "no-repeat", maskPosition: "center", WebkitMaskPosition: "center", maskSize: "contain", WebkitMaskSize: "contain", filter: `drop-shadow(0px 2px 3px ${color}40)` }} />
  );
  return <img src="/scarpone.png" alt="scarpone" className={`flex-shrink-0 ${className}`} style={{ ...baseStyle, filter: "grayscale(100%) opacity(0.2)" }} />;
};

// ── BadgeChip: text size bumped 8px → 9px for legibility ─────────────────────
const BadgeChip = ({ filo, isUnlocked, count, onClick }: { filo: string; isUnlocked: boolean; count: number; onClick?: () => void }) => {
  const color = FILOSOFIA_COLORS[filo] ?? "#44403c";
  const emoji = BADGE_EMOJI[filo] ?? "★";
  const shortName = BADGE_NAMES[filo]?.split(" ")[0] ?? filo.split(" ")[0];
  return (
    <motion.div
      whileTap={{ scale: 0.91 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 cursor-pointer group"
    >
      <div className="relative">
        <motion.div
          className="w-[52px] h-[52px] md:w-[60px] md:h-[60px] rounded-2xl flex items-center justify-center transition-all relative overflow-hidden"
          style={isUnlocked
            ? { backgroundColor: color, boxShadow: `0 6px 18px ${color}45, inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.1)` }
            : { backgroundColor: "#f5f5f4" }}
          whileHover={isUnlocked ? { scale: 1.06, y: -2 } : { scale: 1.03 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          {isUnlocked ? (
            <>
              <div className="absolute inset-0 opacity-20" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 60%)" }} />
              <span className="text-[22px] leading-none relative z-10 drop-shadow-sm">{emoji}</span>
            </>
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[18px] leading-none opacity-20">{emoji}</span>
              {/* #3 — was text-[8px], now text-[9px] */}
              <span className="text-[9px] font-black text-stone-400 leading-none">{count}/{BADGE_THRESHOLD}</span>
            </div>
          )}
        </motion.div>
        {isUnlocked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.1 }}
            className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-white flex items-center justify-center"
            style={{ boxShadow: `0 2px 6px ${color}55`, border: `2px solid ${color}` }}
          >
            <CheckCircle2 size={9} style={{ color }} />
          </motion.div>
        )}
      </div>
      {/* #3 — was text-[8px], now text-[9px] */}
      <span
        className="text-[9px] font-black uppercase tracking-wide leading-none text-center w-full truncate px-0.5"
        style={{ color: isUnlocked ? color : "#d6d3d1" }}
      >
        {shortName}
      </span>
    </motion.div>
  );
};

const BadgeDetailPopup = ({ filo, isUnlocked, count, onClose }: { filo: string; isUnlocked: boolean; count: number; onClose: () => void }) => {
  const color = FILOSOFIA_COLORS[filo] ?? "#44403c";
  const emoji = BADGE_EMOJI[filo] ?? "★";
  const name = BADGE_NAMES[filo] ?? filo;
  const remaining = BADGE_THRESHOLD - count;
  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-4 backdrop-blur-sm bg-black/30" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ y: 60, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0, scale: 0.97 }} transition={{ type: "spring", stiffness: 380, damping: 28 }} className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-stone-100 relative text-center">
        <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-stone-50 rounded-full text-stone-300 hover:text-stone-700 transition-colors"><X size={16} /></button>
        <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.05 }} className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4"
          style={isUnlocked ? { backgroundColor: color, boxShadow: `0 8px 24px ${color}55, inset 0 1px 0 rgba(255,255,255,0.25)` } : { backgroundColor: "#f5f5f4", border: "2px dashed #e7e5e4", filter: "grayscale(1) opacity(0.5)" }}>
          {emoji}
        </motion.div>
        {isUnlocked ? (
          <>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color }}>Badge Sbloccato</p>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-stone-800 mb-1">{name}</h3>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{filo}</p>
            <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest" style={{ backgroundColor: `${color}18`, color }}>
              <Award size={12} /> {BADGE_THRESHOLD} escursioni completate
            </div>
          </>
        ) : (
          <>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-stone-300">Badge Bloccato</p>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-stone-800 mb-1">{name}</h3>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-5">{filo}</p>
            <div className="w-full bg-stone-100 rounded-full h-1.5 mb-2 overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ backgroundColor: color }} initial={{ width: 0 }} animate={{ width: `${(count / BADGE_THRESHOLD) * 100}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>{count}/{BADGE_THRESHOLD} — ancora {remaining} {remaining === 1 ? "escursione" : "escursioni"}</p>
          </>
        )}
      </motion.div>
    </div>
  );
};

// ── AchievementChip: progress counter 8px → 9px ───────────────────────────────
const AchievementChip = ({ badge, isUnlocked, progress, onClick }: { badge: AchievementBadge; isUnlocked: boolean; progress: { current: number; total: number }; onClick?: () => void }) => (
  <motion.div
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className="flex items-center gap-3 cursor-pointer rounded-2xl p-3 transition-all"
    style={isUnlocked
      ? { backgroundColor: `${badge.color}10`, border: `1.5px solid ${badge.color}25` }
      : { backgroundColor: "#fafaf9", border: "1.5px solid #f0eeec" }}
    whileHover={{ scale: 1.01 }}
    transition={{ type: "spring", stiffness: 400, damping: 20 }}
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 relative overflow-hidden"
      style={isUnlocked
        ? { backgroundColor: badge.color, boxShadow: `0 4px 12px ${badge.color}40, inset 0 1px 0 rgba(255,255,255,0.3)` }
        : { backgroundColor: "#eeeceb" }}
    >
      {isUnlocked && <div className="absolute inset-0 opacity-20" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 60%)" }} />}
      <span className={`leading-none relative z-10 ${isUnlocked ? "drop-shadow-sm" : "opacity-30"}`}>{badge.emoji}</span>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-black uppercase tracking-tight leading-none truncate" style={{ color: isUnlocked ? badge.color : "#c4c2c0" }}>
          {badge.name}
        </span>
        {isUnlocked
          ? <CheckCircle2 size={12} style={{ color: badge.color }} className="flex-shrink-0 ml-1" />
          : <span className="text-[9px] font-black text-stone-300 flex-shrink-0 ml-1">{progress.current}/{progress.total}</span>}
      </div>
      <div className="w-full bg-stone-100 rounded-full h-1 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: isUnlocked ? badge.color : "#d6d3d1" }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min((progress.current / progress.total) * 100, 100)}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
        />
      </div>
    </div>
  </motion.div>
);

const AchievementDetailPopup = ({ badge, isUnlocked, progress, onClose }: { badge: AchievementBadge; isUnlocked: boolean; progress: { current: number; total: number }; onClose: () => void }) => {
  const remaining = progress.total - progress.current;
  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-4 backdrop-blur-sm bg-black/30" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ y: 60, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0, scale: 0.97 }} transition={{ type: "spring", stiffness: 380, damping: 28 }} className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-stone-100 relative text-center">
        <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-stone-50 rounded-full text-stone-300 hover:text-stone-700 transition-colors"><X size={16} /></button>
        <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.05 }}
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4"
          style={isUnlocked
            ? { backgroundColor: badge.color, boxShadow: `0 8px 24px ${badge.color}55, inset 0 1px 0 rgba(255,255,255,0.25)` }
            : { backgroundColor: "#f5f5f4", border: "2px dashed #e7e5e4", filter: "grayscale(1) opacity(0.5)" }}>
          {badge.emoji}
        </motion.div>
        {isUnlocked ? (
          <>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: badge.color }}>Traguardo Sbloccato</p>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-stone-800 mb-1">{badge.name}</h3>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{badge.description}</p>
            <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest" style={{ backgroundColor: `${badge.color}18`, color: badge.color }}>
              <Trophy size={12} /> Completato!
            </div>
          </>
        ) : (
          <>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-stone-300">Traguardo Bloccato</p>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-stone-800 mb-1">{badge.name}</h3>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-5">{badge.description}</p>
            <div className="w-full bg-stone-100 rounded-full h-1.5 mb-2 overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ backgroundColor: badge.color }} initial={{ width: 0 }} animate={{ width: `${(progress.current / progress.total) * 100}%` }} transition={{ duration: 0.6, ease: "easeOut" }} />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: badge.color }}>
              {progress.current}/{progress.total} — ancora {remaining} {remaining === 1 ? "passo" : "passi"}
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};

const PinRecoveryModal = ({ codice, onClose }: { codice: string; onClose: () => void }) => {
  const subject = encodeURIComponent("Recupero PIN Tessera Altour");
  const body = encodeURIComponent(`Salve,\n\nHo bisogno di assistenza per il recupero del PIN della mia Tessera Altour.\n\nCodice tessera: ${codice}\n\nGrazie`);
  return (
    <div className="fixed inset-0 z-[120] flex items-end md:items-center justify-center p-4 backdrop-blur-sm bg-black/30" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ y: 60, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0, scale: 0.97 }} transition={{ type: "spring", stiffness: 380, damping: 28 }} className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-stone-100 relative text-center">
        <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-stone-50 rounded-full text-stone-300 hover:text-stone-700 transition-colors"><X size={16} /></button>
        <div className="w-16 h-16 rounded-3xl bg-brand-sky/10 flex items-center justify-center mx-auto mb-5">
          <Mail size={28} className="text-brand-sky" />
        </div>
        <h3 className="text-xl font-black uppercase tracking-tighter text-stone-800 mb-2">Recupero PIN</h3>
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Il PIN è assegnato da Altour.</p>
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-6">Scrivi per ricevere assistenza.</p>
        <div className="bg-stone-50 rounded-2xl px-4 py-3 mb-6 border border-stone-100">
          <p className="text-[9px] font-black uppercase tracking-widest text-stone-300 mb-0.5">Codice tessera</p>
          <p className="text-sm font-black uppercase tracking-widest text-brand-sky">{codice}</p>
        </div>
        <a href={`mailto:info@altouritaly.it?subject=${subject}&body=${body}`} className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-brand-sky text-white font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-lg shadow-sky-100 hover:bg-[#0284c7]">
          <Mail size={14} /> Scrivi ad Altour
        </a>
        <button onClick={onClose} className="mt-3 w-full py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-stone-500 transition-colors">Annulla</button>
      </motion.div>
    </div>
  );
};

const Toast = ({ message, color, onDone }: { message: string; color: string; onDone: () => void }) => {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10">
      <IconaScarponeCustom size={20} color={color} isActive={true} />
      <span className="text-[11px] font-black uppercase tracking-wide whitespace-nowrap">{message}</span>
    </motion.div>
  );
};

interface UserTessera {
  id: string;
  codice_tessera: string;
  pin?: string | null;
  nome_escursionista: string;
  cognome_escursionista: string;
  email?: string | null;
  avatar_url: string | null;
  escursioni_completate: EscursioneCompletata[];
  punti: number;
  badges_filosofia?: string[];
}
interface ToastData { message: string; color: string; }
type RedeemStep = "INPUT" | "REVEAL" | "SUCCESS";

const SLOTS_PER_PAGE = 8;
const TESSERA_LEVELS = [
  "Amante di attività all'aperto","Elfo dei prati","Collezionista di muschio","Principe della mappa",
  "Guardiano delle nuvole","Mago della bussola","Spirito dei boschi","Collezionista di scarponi",
  "Asceta dei monti","Re dell'altimetro","Saltatore di tronchi","Amico delle querce",
  "Menestrello dei bastoncini","Duca degli scalatori","Custode del verde","Specialista dei sentieri",
  "Gnomo delle pigne","Spiritello degli stagni","Appassionato naturalista","Leggenda vivente",
];

const PinInput = ({ value, onChange, onComplete }: { value: string; onChange: (v: string) => void; onComplete?: () => void }) => {
  const ref0 = useRef<HTMLInputElement>(null);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const refsRef = useRef([ref0, ref1, ref2, ref3]);
  const refs = refsRef.current;
  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (value[i]) { onChange(value.slice(0, i) + value.slice(i + 1)); }
      else if (i > 0) { refs[i - 1].current?.focus(); onChange(value.slice(0, i - 1) + value.slice(i)); }
    }
  };
  const handleChange = (i: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    const next = (value.slice(0, i) + digit + value.slice(i + 1)).slice(0, 4);
    onChange(next);
    if (i < 3) refs[i + 1].current?.focus();
    else if (next.length === 4) onComplete?.();
  };
  return (
    <div className="flex gap-3 justify-center">
      {([ref0, ref1, ref2, ref3] as const).map((ref, i) => (
        <input key={i} ref={ref} type="password" inputMode="numeric" maxLength={1} value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)} onKeyDown={(e) => handleKey(i, e)}
          onFocus={(e) => e.target.select()}
          className="w-14 h-14 text-center text-xl font-black bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none focus:border-brand-sky focus:bg-white transition-all shadow-inner" />
      ))}
    </div>
  );
};

// Fix #16: pure function moved to module level
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const maxSide = 400;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const targetW = Math.max(1, Math.round(bitmap.width * scale));
  const targetH = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = targetW; canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non disponibile");
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  let quality = 0.8;
  const targetBytes = 100 * 1024;
  let blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
  while (blob && blob.size > targetBytes && quality > 0.4) {
    quality -= 0.1;
    blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
  }
  if (!blob) throw new Error("Impossibile generare l'immagine");
  return blob;
}

const NoPinMailLink = ({ codice }: { codice: string }) => {
  const subject = encodeURIComponent("Richiesta PIN Tessera Altour");
  const body = encodeURIComponent(`Salve,\n\nVorrei ricevere il PIN per accedere alla mia Tessera Altour.\n\nCodice tessera: ${codice}\n\nGrazie`);
  return (
    <a href={`mailto:info@altouritaly.it?subject=${subject}&body=${body}`}
      className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-brand-sky text-white font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-lg shadow-sky-100 hover:bg-[#0284c7] mb-3">
      <Mail size={14} /> Richiedi il PIN
    </a>
  );
};

export default function Tessera() {
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [userTessera, setUserTessera] = useState<UserTessera | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loginCode, setLoginCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [loginStep, setLoginStep] = useState<"code" | "pin" | "no-pin">("code");
  const [loginPin, setLoginPin] = useState("");
  const [pendingTessera, setPendingTessera] = useState<UserTessera | null>(null);
  const [showPinRecovery, setShowPinRecovery] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [redeemStep, setRedeemStep] = useState<RedeemStep>("INPUT");
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemError, setRedeemError] = useState("");
  const [redeemAttempts, setRedeemAttempts] = useState(0);
  const [pendingActivity, setPendingActivity] = useState<{ titolo: string; filosofia?: string | null; categoria?: string; difficolta?: string } | null>(null);
  const [pendingCodeId, setPendingCodeId] = useState<string | null>(null);
  const [pendingColor, setPendingColor] = useState<string>(DEFAULT_BOOT_COLOR);
  const [chosenColor, setChosenColor] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [selectedBoot, setSelectedBoot] = useState<EscursioneCompletata | null>(null);
  const [iconSize, setIconSize] = useState(50);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<string | null>(null);
  const [newlyUnlockedAchievement, setNewlyUnlockedAchievement] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<{ filo: string; isUnlocked: boolean; count: number } | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementBadge | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  // ── Accordion state: default open so nothing is hidden on first load ──────────
  const [badgeOpen, setBadgeOpen] = useState(true);
  const [traguardiOpen, setTraguardiOpen] = useState(true);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const update = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setIconSize(window.innerWidth < 768 ? 50 : 70), 80);
    };
    setIconSize(window.innerWidth < 768 ? 50 : 70);
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("resize", update); clearTimeout(timer); };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showPinRecovery) { setShowPinRecovery(false); return; }
        if (selectedAchievement) { setSelectedAchievement(null); return; }
        if (selectedBadge) { setSelectedBadge(null); return; }
        if (selectedBoot) { setSelectedBoot(null); return; }
        if (showRedeem) closeRedeem();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [showRedeem, selectedBoot, selectedBadge, showPinRecovery, selectedAchievement]);

  useEffect(() => {
    const savedCode = loadSession();
    if (savedCode) fetchUserFromSession(savedCode);
    else setLoading(false);
  }, []);

  async function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      if (!userTessera) return;
      const file = e.target.files?.[0];
      if (!file) return;
      setAvatarUploading(true);
      let compressed: Blob;
      try { compressed = await compressImage(file); } catch { compressed = file; }
      const path = `avatars/${userTessera.id}.jpg`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, compressed, { upsert: true, contentType: "image/jpeg" });
      if (upErr) { setToast({ message: `Errore upload: ${upErr.message}`, color: "#ef4444" }); throw upErr; }
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const freshUrl = `${pub.publicUrl}?t=${new Date().getTime()}`;
      const { error: dbErr } = await supabase.from("tessere").update({ avatar_url: pub.publicUrl }).eq("id", userTessera.id);
      if (dbErr) { setToast({ message: `Errore salvataggio: ${dbErr.message}`, color: "#ef4444" }); throw dbErr; }
      setUserTessera((prev) => (prev ? { ...prev, avatar_url: freshUrl } : prev));
      setToast({ message: "Avatar aggiornato", color: "#10b981" });
    } catch (err) { console.error("Errore upload avatar:", err); }
    finally { setAvatarUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  }

  async function fetchUserFromSession(codice: string) {
    setLoading(true);
    const { data, error } = await fetchTesseraSession(codice);
    if (error || !data) { localStorage.removeItem(SESSION_KEY); setLoading(false); }
    else {
      const count = data.escursioni_completate?.length || 0;
      setUserTessera(data as UserTessera);
      saveSession(data.codice_tessera);
      setCurrentPage(count === 0 ? 0 : Math.floor((count - 1) / SLOTS_PER_PAGE));
      setLoading(false);
    }
  }

  async function fetchUser(codice: string) {
    if (loading) return;
    setLoading(true); setLoginError("");
    const { data, error } = await fetchTessera(codice);
    if (error || !data) { setLoginError("Codice non trovato."); setLoginAttempts((n) => n + 1); setLoading(false); }
    else {
      const tessera = data as UserTessera;
      setPendingTessera(tessera); setLoginPin(""); setLoginError("");
      setLoginStep(tessera.pin ? "pin" : "no-pin");
      setLoading(false);
    }
  }

  async function completeLogin(tessera: UserTessera) {
    const { data } = await fetchTesseraSession(tessera.codice_tessera);
    const clean = (data ?? tessera) as UserTessera;
    const count = clean.escursioni_completate?.length || 0;
    setUserTessera(clean);
    saveSession(clean.codice_tessera);
    setCurrentPage(count === 0 ? 0 : Math.floor((count - 1) / SLOTS_PER_PAGE));
  }

  async function handleVerifyPin() {
    if (!pendingTessera) return;
    if (loginPin.length !== 4) { setLoginError("Inserisci 4 cifre."); return; }
    if (loginPin !== pendingTessera.pin) { setLoginError("PIN errato."); setLoginAttempts((n) => n + 1); setLoginPin(""); return; }
    completeLogin(pendingTessera);
  }

  function handleLogin() {
    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) { setLoginError("Troppi tentativi. Ricarica la pagina per riprovare."); return; }
    const normalized = loginCode.toUpperCase().trim();
    if (!TESSERA_CODE_REGEX.test(normalized)) { setLoginError("Formato non valido. Usa il formato ALTXXX."); return; }
    fetchUser(normalized);
  }

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUserTessera(null);
    setLoginStep("code");
    setLoginCode("");
    setLoginError("");
    setLoginAttempts(0);
    setPendingTessera(null);
    setCurrentPage(0);
  };

  const closeRedeem = useCallback(() => {
    if (isSaving) return;
    setShowRedeem(false); setRedeemCode(""); setRedeemStep("INPUT"); setRedeemError("");
    setSaveError(""); setPendingActivity(null); setPendingCodeId(null); setPendingColor(DEFAULT_BOOT_COLOR); setChosenColor(null);
    setNewlyUnlockedBadge(null); setNewlyUnlockedAchievement(null);
    setRedeemAttempts(0);
  }, [isSaving]);

  const verifyCode = async () => {
    if (!redeemCode.trim()) return;
    if (redeemAttempts >= MAX_REDEEM_ATTEMPTS) { setRedeemError("Troppi tentativi. Riprova più tardi."); return; }
    const normalized = redeemCode.toUpperCase().trim();
    if (!REDEEM_CODE_REGEX.test(normalized)) { setRedeemError("Formato codice non valido."); return; }
    setIsVerifying(true); setRedeemError(""); setRedeemAttempts((n) => n + 1);

    // Cerca il codice nella tabella dedicata, join con escursioni per i dati
    const { data, error } = await supabase
      .from("codici_riscatto")
      .select("id, codice, used_by, escursioni(titolo, filosofia, categoria, difficolta)")
      .eq("codice", normalized)
      .single();

    if (error || !data) {
      setRedeemError("Codice non valido.");
      setIsVerifying(false);
      return;
    }
    // Codice già usato da un altro utente
    if (data.used_by && data.used_by !== userTessera?.codice_tessera) {
      setRedeemError("Questo codice è già stato utilizzato.");
      setIsVerifying(false);
      return;
    }
    // Codice già usato da questo stesso utente
    if (data.used_by === userTessera?.codice_tessera) {
      setRedeemError("Hai già riscattato questo scarpone.");
      setIsVerifying(false);
      return;
    }
    const escRaw = data.escursioni;
    const esc = (Array.isArray(escRaw) ? escRaw[0] : escRaw) as { titolo: string; filosofia?: string | null; categoria?: string; difficolta?: string } | null;
    if (!esc) { setRedeemError("Dati attività non trovati."); setIsVerifying(false); return; }
    // Check duplicato sulla tessera (sicurezza extra)
    if (userTessera?.escursioni_completate?.some((e) => e.titolo === esc.titolo)) {
      setRedeemError("Hai già riscattato questa escursione.");
      setIsVerifying(false);
      return;
    }
    setPendingActivity(esc);
    setPendingCodeId(data.id);
    setPendingColor(getFilosofiaColor(esc.filosofia));
    setRedeemStep("REVEAL");
    setIsVerifying(false);
  };

  const saveVetta = async () => {
    if (!userTessera || !pendingActivity || isSaving) return;
    setIsSaving(true); setSaveError(""); navigator.vibrate?.(50);
    const newEntry: EscursioneCompletata = {
      titolo: pendingActivity.titolo,
      colore: pendingColor,
      data: new Date().toISOString(),
      ...(pendingActivity.categoria ? { categoria: pendingActivity.categoria } : {}),
      ...(pendingActivity.difficolta ? { difficolta: pendingActivity.difficolta } : {}),
    };
    const updatedList = [...(userTessera.escursioni_completate || []), newEntry];
    const oldBadges = computeEarnedBadges(userTessera.escursioni_completate || []);
    const newBadges = computeEarnedBadges(updatedList);
    const justUnlocked = newBadges.find((b) => !oldBadges.includes(b)) ?? null;
    const oldAchievements = ACHIEVEMENT_BADGES.filter(ab => ab.check(userTessera.escursioni_completate || [])).map(ab => ab.id);
    const newAchievements = ACHIEVEMENT_BADGES.filter(ab => ab.check(updatedList)).map(ab => ab.id);
    const justUnlockedAchievement = newAchievements.find(id => !oldAchievements.includes(id)) ?? null;
    const updatePayload: Record<string, unknown> = { escursioni_completate: updatedList };
    if (justUnlocked) updatePayload.badges_filosofia = [...(userTessera.badges_filosofia ?? []), justUnlocked];
    const { data, error } = await supabase.from("tessere").update(updatePayload).eq("id", userTessera.id).select();
    if (error || !data) { setSaveError("Errore nel salvataggio. Riprova."); setIsSaving(false); return; }

    // Marca il codice come usato (atomico — se fallisce logga ma non blocca)
    if (pendingCodeId) {
      await supabase
        .from("codici_riscatto")
        .update({ used_by: userTessera.codice_tessera, used_at: new Date().toISOString() })
        .eq("id", pendingCodeId)
        .is("used_by", null); // solo se ancora libero (sicurezza race condition)
    }
    const updatedTessera = data[0] as UserTessera;
    setUserTessera(updatedTessera);
    const newCount = updatedTessera.escursioni_completate?.length || 1;
    setCurrentPage(Math.floor((newCount - 1) / SLOTS_PER_PAGE));
    setChosenColor(pendingColor);
    setNewlyUnlockedBadge(justUnlocked);
    setNewlyUnlockedAchievement(justUnlockedAchievement);
    setRedeemStep("SUCCESS"); setIsSaving(false);
    fireConfetti(pendingColor);
    if (justUnlocked) setTimeout(() => fireBadgeConfetti(FILOSOFIA_COLORS[justUnlocked] ?? pendingColor), 600);
    if (justUnlockedAchievement) {
      const ab = ACHIEVEMENT_BADGES.find(x => x.id === justUnlockedAchievement);
      if (ab) setTimeout(() => fireBadgeConfetti(ab.color), justUnlocked ? 1200 : 600);
    }
  };

  const handleSuccessClose = () => {
    if (chosenColor && pendingActivity) setToast({ message: `Scarpone ${getFilosofiaName(chosenColor) || pendingActivity.filosofia || ""} aggiunto!`, color: chosenColor });
    closeRedeem();
  };

  const stats = useMemo(() => {
    if (!userTessera) return null;
    const count = userTessera.escursioni_completate?.length || 0;
    const totalPages = Math.max(1, Math.ceil(count / SLOTS_PER_PAGE));
    const vouchersCount = Math.floor(count / SLOTS_PER_PAGE);
    const completedTessere = Math.floor(count / SLOTS_PER_PAGE);
    const currentLevelLabel = TESSERA_LEVELS[Math.min(completedTessere, TESSERA_LEVELS.length - 1)];
    return { count, currentLevelLabel, totalPages, vouchersCount };
  }, [userTessera]);

  const { badgeCounts, earnedBadges } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of userTessera?.escursioni_completate ?? []) {
      const filo = getFilosofiaName(e.colore);
      if (filo) counts[filo] = (counts[filo] || 0) + 1;
    }
    const earned = Object.entries(counts).filter(([, n]) => n >= BADGE_THRESHOLD).map(([f]) => f);
    return { badgeCounts: counts, earnedBadges: earned };
  }, [userTessera]);

  const earnedAchievements = useMemo(
    () => ACHIEVEMENT_BADGES.filter(ab => ab.check(userTessera?.escursioni_completate ?? [])),
    [userTessera],
  );

  const generatePDF = async () => {
    if (!userTessera) return;
    setIsPdfGenerating(true);
    try {
      const escursioni = userTessera.escursioni_completate ?? [];
      const nome = escapeHtml([userTessera.nome_escursionista, userTessera.cognome_escursionista].filter(Boolean).join(" "));
      const codiceEscaped = escapeHtml(userTessera.codice_tessera);
      const today = new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
      const rows = escursioni.map((e, i) => {
        const filo = escapeHtml(getFilosofiaName(e.colore) || "—");
        const titolo = escapeHtml(e.titolo);
        const data = new Date(e.data).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
        const bg = i % 2 === 0 ? "#fafaf9" : "#ffffff";
        const cat = escapeHtml(e.categoria ?? "—");
        return `<tr style="background:${bg}"><td style="padding:8px 12px;font-size:11px;color:#44403c;border-bottom:1px solid #f5f5f4;">${String(i + 1).padStart(2, "0")}</td><td style="padding:8px 12px;font-size:11px;color:#1c1917;font-weight:700;border-bottom:1px solid #f5f5f4;">${titolo}</td><td style="padding:8px 12px;border-bottom:1px solid #f5f5f4;"><span style="display:inline-block;background:${e.colore}22;color:${e.colore};font-size:9px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;padding:2px 8px;border-radius:100px;">${filo}</span></td><td style="padding:8px 12px;font-size:11px;color:#78716c;border-bottom:1px solid #f5f5f4;">${cat}</td><td style="padding:8px 12px;font-size:11px;color:#78716c;border-bottom:1px solid #f5f5f4;">${data}</td></tr>`;
      }).join("");
      const badgesList = earnedBadges.map(f =>
        `<span style="display:inline-flex;align-items:center;gap:4px;background:${FILOSOFIA_COLORS[f] ?? "#44403c"}18;color:${FILOSOFIA_COLORS[f] ?? "#44403c"};font-size:9px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;padding:4px 10px;border-radius:100px;margin:2px;">${BADGE_EMOJI[f] ?? "★"} ${BADGE_NAMES[f] ?? f}</span>`
      ).join("");
      const achievementsList = earnedAchievements.map(ab =>
        `<span style="display:inline-flex;align-items:center;gap:4px;background:${ab.color}18;color:${ab.color};font-size:9px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;padding:4px 10px;border-radius:100px;margin:2px;">${ab.emoji} ${ab.name}</span>`
      ).join("");
      const html = `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><style>* { margin:0;padding:0;box-sizing:border-box; } body { font-family:'Helvetica Neue',Arial,sans-serif;background:#fff;color:#1c1917; } @media print { body { -webkit-print-color-adjust:exact;print-color-adjust:exact; } }</style></head><body><div style="max-width:800px;margin:0 auto;padding:40px 40px 60px;"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:3px solid #e7e5e4;"><div><div style="font-size:22px;font-weight:900;letter-spacing:-0.04em;text-transform:uppercase;color:#1c1917;">Altour Italy</div><div style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#a8a29e;margin-top:2px;">Esperienze nell'outdoor</div><div style="font-size:9px;color:#a8a29e;margin-top:6px;line-height:1.6;">info@altouritaly.it · www.altouritaly.it</div></div><div style="text-align:right;"><div style="font-size:9px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#a8a29e;">Estratto Passaporto</div><div style="font-size:9px;color:#a8a29e;margin-top:3px;">Generato il ${today}</div></div></div><div style="background:#f5f2ed;border-radius:16px;padding:20px 24px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:center;"><div><div style="font-size:9px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:#a8a29e;margin-bottom:4px;">Escursionista</div><div style="font-size:20px;font-weight:900;letter-spacing:-0.03em;text-transform:uppercase;color:#1c1917;">${nome}</div><div style="font-size:10px;font-weight:700;color:#5aaadd;letter-spacing:0.1em;text-transform:uppercase;margin-top:2px;">Cod. ${codiceEscaped}</div></div><div style="text-align:right;"><div style="font-size:28px;font-weight:900;color:#1c1917;">${escursioni.length}</div><div style="font-size:9px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#a8a29e;">escursioni</div></div></div><div style="font-size:9px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:#a8a29e;margin-bottom:10px;">Registro Escursioni</div><table style="width:100%;border-collapse:collapse;margin-bottom:28px;"><thead><tr style="background:#1c1917;"><th style="padding:10px 12px;font-size:9px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;color:#a8a29e;text-align:left;">#</th><th style="padding:10px 12px;font-size:9px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;color:#a8a29e;text-align:left;">Titolo</th><th style="padding:10px 12px;font-size:9px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;color:#a8a29e;text-align:left;">Filosofia</th><th style="padding:10px 12px;font-size:9px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;color:#a8a29e;text-align:left;">Tipo</th><th style="padding:10px 12px;font-size:9px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;color:#a8a29e;text-align:left;">Data</th></tr></thead><tbody>${rows || `<tr><td colspan="5" style="padding:24px;text-align:center;font-size:11px;color:#a8a29e;">Nessuna escursione registrata</td></tr>`}</tbody></table>${(earnedBadges.length > 0 || earnedAchievements.length > 0) ? `<div style="margin-bottom:32px;"><div style="font-size:9px;font-weight:900;letter-spacing:0.2em;text-transform:uppercase;color:#a8a29e;margin-bottom:10px;">Badge Conseguiti</div><div style="display:flex;flex-wrap:wrap;gap:4px;">${badgesList}${achievementsList}</div></div>` : ""}<div style="margin-top:48px;padding-top:24px;border-top:1px solid #e7e5e4;display:flex;justify-content:space-between;align-items:flex-end;"><div><div style="font-size:9px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#a8a29e;margin-bottom:6px;">Firma della Guida</div><div style="font-size:13px;font-weight:900;color:#1c1917;font-style:italic;">Claudio Corazza</div><div style="font-size:9px;color:#a8a29e;margin-top:2px;">Guida Ambientale Escursionistica · Altour Italy</div></div><div style="text-align:right;"><div style="width:120px;border-top:2px solid #e7e5e4;padding-top:6px;margin-left:auto;"><div style="font-size:9px;color:#a8a29e;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">Timbro / Data</div></div></div></div><div style="margin-top:32px;font-size:8px;color:#d6d3d1;text-align:center;letter-spacing:0.1em;text-transform:uppercase;">Documento generato dal Passaporto Digitale Altour Italy · Solo per uso personale</div></div></body></html>`;
      const win = window.open("", "_blank");
      if (!win) { setToast({ message: "Abilita i popup per scaricare il PDF", color: "#ef4444" }); return; }
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 500);
    } catch (err) {
      console.error("PDF error:", err);
      setToast({ message: "Errore nella generazione del PDF", color: "#ef4444" });
    } finally {
      setIsPdfGenerating(false);
    }
  };

  if (loading && !userTessera) return <div className="min-h-screen flex items-center justify-center bg-[#f5f2ed]"><Loader2 className="animate-spin text-brand-stone" /></div>;

  // ── LOGIN SCREEN ──────────────────────────────────────────────────────────────
  if (!userTessera) return (
    <div className="min-h-screen bg-[#f5f2ed] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-brand-sky/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-stone-400/5 rounded-full blur-3xl" />
      <motion.div key={loginStep} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-10 md:p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-sm text-center relative border border-white/50 backdrop-blur-sm">
        <div className="flex justify-center mb-8">
          <motion.img whileHover={{ scale: 1.05, rotate: 2 }} transition={{ type: "spring", stiffness: 400, damping: 10 }} src="/altour-logo.png" alt="Altour Italy" className="h-24 w-auto object-contain rounded-2xl p-1" />
        </div>
        {loginStep === "code" && (
          <>
            <div className="space-y-2 mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-stone-800">Passaporto Altour</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Inserisci il tuo codice escursionista</p>
            </div>
            <div className="space-y-4">
              <input className="w-full bg-stone-50 border-2 border-stone-100 p-5 rounded-2xl text-center font-black uppercase outline-none focus:border-brand-sky focus:bg-white transition-all text-lg tracking-widest placeholder:text-stone-300 shadow-inner"
                placeholder="ALTXXX" value={loginCode} onChange={(e) => setLoginCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()} disabled={loginAttempts >= MAX_LOGIN_ATTEMPTS || loading} />
              {loginError && <p className="text-red-500 text-[10px] font-black uppercase py-2 bg-red-50 rounded-lg px-3">{loginError}</p>}
              <button onClick={handleLogin} disabled={loginAttempts >= MAX_LOGIN_ATTEMPTS || loading}
                className="w-full mt-2 bg-stone-800 text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Continua"}
              </button>
            </div>
          </>
        )}
        {loginStep === "pin" && (
          <>
            <div className="space-y-2 mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-stone-800">Inserisci il PIN</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Codice <span className="text-brand-sky">{pendingTessera?.codice_tessera}</span></p>
            </div>
            <div className="space-y-4">
              <PinInput value={loginPin} onChange={setLoginPin} onComplete={handleVerifyPin} />
              {loginError && <p className="text-red-500 text-[10px] font-black uppercase py-2 bg-red-50 rounded-lg px-3">{loginError}</p>}
              <button onClick={handleVerifyPin} disabled={loginPin.length < 4 || loading || loginAttempts >= MAX_LOGIN_ATTEMPTS}
                className="w-full mt-2 bg-stone-800 text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Accedi al Passaporto"}
              </button>
              <div className="flex justify-between items-center pt-1">
                <button onClick={() => { setLoginStep("code"); setLoginError(""); setPendingTessera(null); }} className="text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-stone-500 transition-colors">← Cambia codice</button>
                <button onClick={() => setShowPinRecovery(true)} className="text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-brand-sky transition-colors">PIN dimenticato?</button>
              </div>
            </div>
          </>
        )}
        {loginStep === "no-pin" && (
          <>
            <div className="space-y-2 mb-6">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-stone-800">PIN non ancora attivo</h2>
            </div>
            <div className="bg-stone-50 rounded-2xl p-5 mb-6 border border-stone-100 text-left space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                Il PIN per la tessera <span className="text-brand-sky">{pendingTessera?.codice_tessera}</span> non è ancora stato configurato.
              </p>
              <p className="text-[10px] font-bold text-stone-300 uppercase tracking-wide">Contatta Altour per riceverlo.</p>
            </div>
            <NoPinMailLink codice={pendingTessera?.codice_tessera ?? ""} />
            <button onClick={() => { setLoginStep("code"); setLoginError(""); setPendingTessera(null); }} className="text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-stone-500 transition-colors">← Cambia codice</button>
          </>
        )}
      </motion.div>
      <AnimatePresence>
        {showPinRecovery && pendingTessera && <PinRecoveryModal codice={pendingTessera.codice_tessera} onClose={() => setShowPinRecovery(false)} />}
      </AnimatePresence>
    </div>
  );

  const { currentLevelLabel, totalPages, vouchersCount } = stats!;
  // Last 3 escursioni in reverse chronological order
  

  return (
    <div className="min-h-screen bg-[#f5f2ed] pb-20 text-stone-800">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div className="relative h-[45vh] md:h-[50vh] w-full flex items-center justify-center text-center overflow-hidden">
        <img src="https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Trentino_neve.webp" className="absolute inset-0 w-full h-full object-cover object-[center_60%]" alt="header bg" />
        {/* Stessa luminosità dell'intro (bg-black/20) + lieve rinforzo in basso per leggibilità testo */}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-[50%] to-black/30" />
        {/* #8 — logout touch target: p-2 → p-3 (44px+) */}
        <button onClick={handleLogout} className="absolute top-4 right-4 md:top-6 md:right-6 p-3 bg-black/20 backdrop-blur-md rounded-full text-white border border-white/10 z-50 active:scale-90 transition-transform">
          <LogOut size={18} />
        </button>
        <div className="relative z-20 px-4 flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase drop-shadow-md">Passaporto Altour</h1>
          {/* #2 — nome escursionista nell'hero per personalizzazione immediata */}
          <p className="text-white font-black text-base md:text-lg uppercase tracking-tight mt-1 leading-none drop-shadow-sm">
            {[userTessera.nome_escursionista, userTessera.cognome_escursionista].filter(Boolean).join("\u00a0")}
          </p>
          <p className="text-white/60 font-bold tracking-[0.3em] text-[10px] uppercase mt-1 mb-4">Cod. {userTessera.codice_tessera}</p>
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl backdrop-blur-md border border-white/20" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)", boxShadow: "0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.1)" }}>
            <IconaScarponeCustom size={40} color="#5aaadd" isActive={true} />
            <div className="flex flex-col items-start">
              <span className="text-[7px] font-black uppercase tracking-[0.25em] text-white/50 leading-none mb-0.5">Livello</span>
              <span className="text-[11px] md:text-[13px] font-black uppercase tracking-wide text-white leading-none" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>{currentLevelLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <div className="max-w-xl mx-auto px-4 md:px-6 -mt-8 relative z-30">

        {/* ── TESSERA CARD ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] p-5 md:p-8 shadow-2xl border border-white/50">
          <div className="flex justify-between items-start mb-6">
            <div className="max-w-[70%] flex items-center gap-4">
              <div className="relative">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border border-stone-200 shadow-sm bg-stone-100 flex items-center justify-center">
                  {userTessera.avatar_url ? <img src={userTessera.avatar_url} alt="Avatar escursionista" className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-stone-400" />}
                  {avatarUploading && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Loader2 className="w-6 h-6 text-white animate-spin" /></div>}
                </motion.div>
                <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-stone-200 shadow flex items-center justify-center hover:bg-stone-50 transition-colors" aria-label="Carica avatar"><Camera className="w-4 h-4 text-stone-600" /></button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
              </div>
              <div>
                <div className="flex items-center gap-1 mb-0.5 text-sky-500"><ShieldCheck size={12} /><span className="text-[9px] font-black uppercase">Escursionista Verificato</span></div>
                <h2 className="text-xl md:text-2xl font-black uppercase truncate leading-tight">{[userTessera.nome_escursionista, userTessera.cognome_escursionista].filter(Boolean).join(" ")}</h2>
              </div>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-stone-50 rounded-xl flex items-center justify-center border border-stone-100">
              {userTessera.escursioni_completate?.length >= 8 * (currentPage + 1) ? <Star size={24} className="text-amber-400 fill-amber-400" /> : <Star size={24} className="text-stone-200" />}
            </div>
          </div>

          <motion.div drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.15}
            onDragEnd={(_, info) => { if (info.offset.x < -60 && currentPage < totalPages - 1) setCurrentPage((p) => p + 1); if (info.offset.x > 60 && currentPage > 0) setCurrentPage((p) => p - 1); }}
            className="grid grid-cols-4 gap-2 md:gap-4 mb-6 cursor-grab active:cursor-grabbing select-none">
            {Array.from({ length: SLOTS_PER_PAGE }).map((_, i) => {
              const idx = currentPage * SLOTS_PER_PAGE + i;
              const esc = userTessera.escursioni_completate?.[idx];
              return (
                <motion.div key={i} whileTap={esc ? { scale: 0.92 } : {}} onClick={() => esc && setSelectedBoot(esc)}
                  className={`aspect-square rounded-xl md:rounded-2xl border-2 border-dashed border-stone-50 bg-stone-50/30 flex items-center justify-center transition-colors ${esc ? "cursor-pointer hover:bg-stone-100/60 hover:border-stone-200" : ""}`}>
                  <IconaScarponeCustom size={iconSize} color={esc?.colore || "#d6d3d1"} isActive={!!esc} />
                </motion.div>
              );
            })}
          </motion.div>

          <div className="flex justify-between items-center border-t border-stone-50 pt-4 md:pt-6">
            <button disabled={currentPage === 0} onClick={() => setCurrentPage((p) => p - 1)} className="p-2 disabled:opacity-20 hover:bg-stone-50 rounded-full transition-colors"><ChevronLeft size={20} /></button>
            <span className="text-[10px] font-black uppercase text-stone-300 tracking-widest">
              Tessera {currentPage + 1}{totalPages > 1 && <span className="text-stone-200"> · {TESSERA_LEVELS[Math.min(currentPage, TESSERA_LEVELS.length - 1)]}</span>}
            </span>
            <button disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage((p) => p + 1)} className="p-2 disabled:opacity-20 hover:bg-stone-50 rounded-full transition-colors"><ChevronRight size={20} /></button>
          </div>
        </div>

        {/* ── ULTIME ESCURSIONI ─────────────────────────────────────────────── */}
        {/* ── RISCATTA ──────────────────────────────────────────────────────── */}
        <motion.button
          onClick={() => { setRedeemStep("INPUT"); setShowRedeem(true); }}
          whileTap={{ scale: 0.97 }}
          className="w-full mt-4 md:mt-5 relative overflow-hidden rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
          style={{
            background: "linear-gradient(135deg, #5aaadd 0%, #3b91c4 100%)",
            boxShadow: "0 8px 28px rgba(90,170,221,0.35), 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)",
            padding: "1.25rem 1.5rem",
          }}
        >
          {/* Shimmer */}
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)" }} />
          <div className="relative flex items-center gap-3 text-white">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Plus size={18} strokeWidth={3} />
            </div>
            <div className="text-left">
              <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-white/60 leading-none mb-0.5">
                Hai partecipato a un'escursione?
              </span>
              <span className="block text-sm font-black uppercase tracking-wide leading-none">
                Riscatta il tuo Scarpone
              </span>
            </div>
          </div>
        </motion.button>

        {/* ── VOUCHER ───────────────────────────────────────────────────────── */}
        {/* #5 — redesign: da border-dashed pallido a card con gradiente amber */}
        {vouchersCount > 0 && (
          <div className="mt-4 md:mt-5 rounded-[2rem] p-5 md:p-6 flex items-center justify-between overflow-hidden relative"
            style={{ background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 60%, #fcd34d 100%)", boxShadow: "0 8px 24px rgba(251,191,36,0.22)" }}>
            <div className="absolute inset-0 opacity-25" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.55) 0%, transparent 55%)" }} />
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2.5 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm">
                <Gift size={22} className="text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-amber-700 tracking-widest leading-none mb-1">Premio sbloccato 🎉</p>
                <h4 className="text-sm md:text-base font-black uppercase text-amber-900 leading-tight">
                  {vouchersCount} Voucher {vouchersCount === 1 ? "da" : "da"} 10 €&nbsp;
                  <span className="font-bold">{vouchersCount === 1 ? "disponibile" : "disponibili"}</span>
                </h4>
              </div>
            </div>
            <div className="relative z-10 text-3xl font-black text-amber-400/50 select-none leading-none">✦</div>
          </div>
        )}

        {/* ── BADGE FILOSOFIA (accordion) ───────────────────────────────────── */}
        <div className="mt-4 md:mt-5 bg-white rounded-[2rem] overflow-hidden border border-stone-100/80 shadow-sm">
          {/* Header — cliccabile */}
          <button
            onClick={() => setBadgeOpen(o => !o)}
            className="w-full flex justify-between items-center px-5 pt-5 pb-4 text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-stone-800 flex items-center justify-center flex-shrink-0">
                <Award size={12} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-700 leading-none">Collezione Filosofie</p>
                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wide mt-0.5 leading-none">5 escursioni per categoria</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0 min-w-[80px]">
              <div className="flex items-center justify-between w-full">
                <span className="text-[8px] font-black uppercase tracking-widest text-stone-400 tabular-nums">
                  {earnedBadges.length}/{Object.keys(BADGE_NAMES).length}
                </span>
                <span className="text-[8px] font-black tabular-nums" style={{ color: "#81ccb0" }}>
                  {Math.round((earnedBadges.length / Object.keys(BADGE_NAMES).length) * 100)}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #81ccb0, #5aaadd)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(earnedBadges.length / Object.keys(BADGE_NAMES).length) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <ChevronDown size={13} className={`text-stone-300 transition-transform duration-300 ${badgeOpen ? "rotate-180" : ""} self-end`} />
            </div>
          </button>

          <AnimatePresence initial={false}>
            {badgeOpen && (
              <motion.div
                key="badge-body"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                <div className="h-px bg-stone-50 mx-5" />
                {/* #4 — grid-cols-4 on mobile (was 5 — too cramped), md stays 5 cols */}
                <div className="p-5 pt-4">
                  <div className="grid grid-cols-4 gap-x-2 gap-y-4 md:grid-cols-5 md:gap-x-3">
                    {Object.keys(BADGE_NAMES).map((filo) => (
                      <BadgeChip key={filo} filo={filo} isUnlocked={earnedBadges.includes(filo)} count={badgeCounts[filo] ?? 0}
                        onClick={() => setSelectedBadge({ filo, isUnlocked: earnedBadges.includes(filo), count: badgeCounts[filo] ?? 0 })} />
                    ))}
                  </div>
                  {earnedBadges.length === 0 && (
                    <p className="text-center text-[9px] font-bold text-stone-300 uppercase tracking-widest mt-4">
                      Tocca un badge per scoprire come sbloccarlo
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── TRAGUARDI SPECIALI (accordion) ────────────────────────────────── */}
        <div className="mt-4 md:mt-5 bg-white rounded-[2rem] overflow-hidden border border-stone-100/80 shadow-sm">
          {/* Header — cliccabile */}
          <button
            onClick={() => setTraguardiOpen(o => !o)}
            className="w-full flex justify-between items-center px-5 pt-5 pb-4 text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-stone-800 flex items-center justify-center flex-shrink-0">
                <Trophy size={12} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-700 leading-none">Traguardi Speciali</p>
                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wide mt-0.5 leading-none">Sfide di esplorazione</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0 min-w-[80px]">
              <div className="flex items-center justify-between w-full">
                <span className="text-[8px] font-black uppercase tracking-widest text-stone-400 tabular-nums">
                  {earnedAchievements.length}/{ACHIEVEMENT_BADGES.length}
                </span>
                <span className="text-[8px] font-black tabular-nums" style={{ color: "#f4d98c" }}>
                  {Math.round((earnedAchievements.length / ACHIEVEMENT_BADGES.length) * 100)}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #f4d98c, #9f8270)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(earnedAchievements.length / ACHIEVEMENT_BADGES.length) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                />
              </div>
              <ChevronDown size={13} className={`text-stone-300 transition-transform duration-300 ${traguardiOpen ? "rotate-180" : ""} self-end`} />
            </div>
          </button>

          <AnimatePresence initial={false}>
            {traguardiOpen && (
              <motion.div
                key="traguardi-body"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                <div className="h-px bg-stone-50 mx-5" />
                <div className="px-4 py-3 space-y-2">
                  {ACHIEVEMENT_BADGES.map((ab) => {
                    const isUnlocked = earnedAchievements.some(x => x.id === ab.id);
                    const prog = ab.progress(userTessera.escursioni_completate ?? []);
                    return (
                      <AchievementChip key={ab.id} badge={ab} isUnlocked={isUnlocked} progress={prog} onClick={() => setSelectedAchievement(ab)} />
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── PDF DOWNLOAD ──────────────────────────────────────────────────── */}
        <button
          onClick={generatePDF}
          disabled={isPdfGenerating || (userTessera.escursioni_completate?.length ?? 0) === 0}
          className="w-full mt-4 md:mt-5 mb-8 border-2 border-stone-200 text-stone-500 py-4 rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all hover:border-stone-300 hover:text-stone-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPdfGenerating ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
          <span className="text-[11px] md:text-xs">Scarica Registro Escursioni</span>
        </button>
      </div>

      {/* ── MODAL: RISCATTA ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showRedeem && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 md:p-6 backdrop-blur-md bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) closeRedeem(); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white p-8 md:p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] w-full max-w-sm text-center relative border border-stone-100 overflow-hidden">
              <button onClick={closeRedeem} disabled={isSaving} className="absolute top-6 right-6 p-2 bg-stone-50 rounded-full text-stone-300 hover:text-stone-800 transition-colors disabled:opacity-30 z-10"><X size={20} /></button>
              <AnimatePresence mode="wait">
                {redeemStep === "INPUT" && (
                  <motion.div key="input" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="mb-8">
                      <div className="inline-flex p-3 bg-brand-sky/10 rounded-2xl mb-4"><Plus className="text-brand-sky" size={24} /></div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter">Codice scarpone</h3>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Inserisci il codice ricevuto in cima</p>
                      {redeemAttempts > 0 && redeemAttempts < MAX_REDEEM_ATTEMPTS && <p className="text-[9px] font-bold text-stone-300 uppercase mt-1">Tentativi: {redeemAttempts}/{MAX_REDEEM_ATTEMPTS}</p>}
                    </div>
                    <input className="w-full bg-stone-50 border-2 border-stone-100 p-5 rounded-2xl text-center text-2xl font-black uppercase outline-none focus:border-brand-sky transition-all shadow-inner"
                      placeholder="****" value={redeemCode} onChange={(e) => setRedeemCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && verifyCode()} disabled={redeemAttempts >= MAX_REDEEM_ATTEMPTS} />
                    {redeemError && <p className="text-red-500 text-[10px] font-black mt-3 uppercase py-2 bg-red-50 rounded-lg">{redeemError}</p>}
                    <button onClick={verifyCode} disabled={isVerifying || redeemAttempts >= MAX_REDEEM_ATTEMPTS} className="w-full mt-6 bg-stone-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed">
                      {isVerifying ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Verifica Codice"}
                    </button>
                  </motion.div>
                )}
                {redeemStep === "REVEAL" && pendingActivity && (
                  <motion.div key="reveal" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center">
                    <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }} className="mb-4 p-6 rounded-3xl" style={{ backgroundColor: `${pendingColor}18` }}>
                      <IconaScarponeCustom size={80} color={pendingColor} isActive={true} />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="w-full">
                      {pendingActivity.filosofia && <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: pendingColor }}>{pendingActivity.filosofia}</p>}
                      <h3 className="text-xl font-black uppercase tracking-tighter text-stone-800 mb-1">{pendingActivity.titolo}</h3>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1 mb-8">Scarpone sbloccato — aggiungilo alla tessera</p>
                    </motion.div>
                    <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} onClick={saveVetta} disabled={isSaving}
                      className="w-full text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: pendingColor }}>
                      {isSaving ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Aggiungi alla Tessera →"}
                    </motion.button>
                    {saveError && <p className="text-red-500 text-[10px] font-black uppercase py-2 bg-red-50 rounded-lg mt-3 w-full">{saveError}</p>}
                  </motion.div>
                )}
                {redeemStep === "SUCCESS" && pendingActivity && chosenColor && (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.05 }} className="mb-2"><CheckCircle2 size={36} className="text-emerald-400 mx-auto" /></motion.div>
                    <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 280, damping: 14, delay: 0.15 }} className="mb-4 p-6 rounded-3xl" style={{ backgroundColor: `${chosenColor}18` }}>
                      <IconaScarponeCustom size={80} color={chosenColor} isActive={true} />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                      <p className="text-[9px] font-black uppercase text-emerald-400 tracking-widest mb-1">Scarpone guadagnato!</p>
                      <h3 className="text-xl font-black uppercase tracking-tighter text-stone-800 mb-1">{pendingActivity.titolo}</h3>
                      {pendingActivity.filosofia && <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: chosenColor }}>{pendingActivity.filosofia}</p>}
                    </motion.div>
                    {newlyUnlockedBadge && (
                      <motion.div initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.65, type: "spring", stiffness: 300, damping: 18 }}
                        className="mt-5 mb-1 w-full rounded-2xl p-4 flex items-center gap-4" style={{ backgroundColor: `${FILOSOFIA_COLORS[newlyUnlockedBadge] ?? "#44403c"}15` }}>
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: FILOSOFIA_COLORS[newlyUnlockedBadge] ?? "#44403c", boxShadow: `0 4px 12px ${FILOSOFIA_COLORS[newlyUnlockedBadge] ?? "#44403c"}55` }}>
                          {BADGE_EMOJI[newlyUnlockedBadge] ?? "★"}
                        </div>
                        <div className="text-left">
                          <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: FILOSOFIA_COLORS[newlyUnlockedBadge] ?? "#44403c" }}>Badge Sbloccato! 🎉</p>
                          <p className="text-sm font-black uppercase text-stone-800 leading-tight">{BADGE_NAMES[newlyUnlockedBadge]}</p>
                        </div>
                      </motion.div>
                    )}
                    {newlyUnlockedAchievement && (() => {
                      const ab = ACHIEVEMENT_BADGES.find(x => x.id === newlyUnlockedAchievement);
                      if (!ab) return null;
                      return (
                        <motion.div initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: newlyUnlockedBadge ? 1.0 : 0.65, type: "spring", stiffness: 300, damping: 18 }}
                          className="mt-3 mb-1 w-full rounded-2xl p-4 flex items-center gap-4" style={{ backgroundColor: `${ab.color}15` }}>
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: ab.color, boxShadow: `0 4px 12px ${ab.color}55` }}>
                            {ab.emoji}
                          </div>
                          <div className="text-left">
                            <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: ab.color }}>Traguardo Sbloccato! 🏆</p>
                            <p className="text-sm font-black uppercase text-stone-800 leading-tight">{ab.name}</p>
                          </div>
                        </motion.div>
                      );
                    })()}
                    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: (newlyUnlockedBadge || newlyUnlockedAchievement) ? 1.3 : 0.55 }} onClick={handleSuccessClose}
                      className="w-full mt-4 bg-stone-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg">Perfetto!</motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: DETTAGLIO SCARPONE ─────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedBoot && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 md:p-6 backdrop-blur-sm bg-black/30" onClick={(e) => { if (e.target === e.currentTarget) setSelectedBoot(null); }}>
            <motion.div initial={{ y: 60, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0, scale: 0.97 }} transition={{ type: "spring", stiffness: 380, damping: 28 }} className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-stone-100 relative">
              <button onClick={() => setSelectedBoot(null)} className="absolute top-5 right-5 p-2 bg-stone-50 rounded-full text-stone-300 hover:text-stone-700 transition-colors"><X size={18} /></button>
              <div className="flex justify-center mb-5">
                <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.05 }} className="p-5 rounded-3xl" style={{ backgroundColor: `${selectedBoot.colore}18` }}>
                  <IconaScarponeCustom size={72} color={selectedBoot.colore} isActive={true} />
                </motion.div>
              </div>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-center">
                <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: selectedBoot.colore }}>{getFilosofiaName(selectedBoot.colore) || "Personalizzato"}</p>
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-stone-800 leading-tight mb-4 px-2">{selectedBoot.titolo}</h3>
                <div className="inline-flex items-center gap-2 bg-stone-50 px-4 py-2 rounded-full">
                  <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Completata il</span>
                  <span className="text-[9px] font-black uppercase text-stone-600 tracking-widest">{new Date(selectedBoot.data).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedBadge && <BadgeDetailPopup filo={selectedBadge.filo} isUnlocked={selectedBadge.isUnlocked} count={selectedBadge.count} onClose={() => setSelectedBadge(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {selectedAchievement && (
          <AchievementDetailPopup
            badge={selectedAchievement}
            isUnlocked={earnedAchievements.some(x => x.id === selectedAchievement.id)}
            progress={selectedAchievement.progress(userTessera.escursioni_completate ?? [])}
            onClose={() => setSelectedAchievement(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <Toast message={toast.message} color={toast.color} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}