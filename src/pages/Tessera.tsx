import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  Loader2,
  ShieldCheck,
  LogOut,
  Plus,
  ChevronRight,
  ChevronLeft,
  Gift,
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { isIOS } from "../components/Section";



const SESSION_KEY = "altour_session_v4";
const PIN_LENGTH = 6;
const SLOTS_PER_PAGE = 8;
const BADGE_THRESHOLD = 5;
const MAX_REDEEM_ATTEMPTS = 5;
const REDEEM_CODE_REGEX = /^[A-Z0-9]{4,12}$/;

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

const TESSERA_LEVELS = ["Esploratore", "Viaggiatore", "Camminatore", "Veterano", "Leggenda"];

type TabType = "TESSERA" | "BADGE" | "TRAGUARDI";
type RedeemStep = "INPUT" | "SUCCESS";

interface EscursioneCompletata { titolo: string; colore: string; data: string; categoria?: string; difficolta?: string; }
interface UserTessera { 
  id: string; 
  codice_tessera: string; 
  nome_escursionista: string; 
  cognome_escursionista: string; 
  pin: string; 
  avatar_url?: string; 
  escursioni_completate: EscursioneCompletata[] | string;
  livello?: string; 
  badges_filosofia?: string[] | string;
  km_totali?: number;
  dislivello_totali?: number;
}

export function iosClean(className: string): string {
  if (!isIOS) return className;
  return className
    .split(" ")
    .filter(c => !c.includes("backdrop-blur") && !c.includes("backdrop-filter"))
    .join(" ");
}

// --- Utilities ---
const HEX_TO_FILOSOFIA: Record<string, string> = Object.fromEntries(
  Object.entries(FILOSOFIA_COLORS).map(([k, v]) => [v, k])
);
function getFilosofiaName(hex: string): string { return HEX_TO_FILOSOFIA[hex] ?? ""; }
function getFilosofiaColor(name: string | null): string { return name ? (FILOSOFIA_COLORS[name] || "#5aaadd") : "#5aaadd"; }



function parseJsonArray<T>(data: T[] | string | null | undefined): T[] {
  if (typeof data === 'string') {
    try { return JSON.parse(data) as T[]; } catch { return []; }
  } else if (Array.isArray(data)) { return data; }
  return [];
}

function computeEarnedBadges(escursioni: EscursioneCompletata[]): string[] {
  const counts: Record<string, number> = {};
  for (const e of escursioni) {
    const filo = getFilosofiaName(e.colore);
    if (filo) counts[filo] = (counts[filo] || 0) + 1;
  }
  return Object.entries(counts).filter(([, n]) => n >= BADGE_THRESHOLD).map(([f]) => f);
}

function getSeason(date: Date): string {
  const m = date.getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}

const ACHIEVEMENT_BADGES = [
  { id: "streak_tour", name: "Lupo dei Cammini", emoji: "🐺", description: "3 tour completati", color: "#e94544", check: (e: EscursioneCompletata[]) => e.filter((x) => x.categoria === "tour").length >= 3, progress: (e: EscursioneCompletata[]) => ({ current: Math.min(e.filter((x) => x.categoria === "tour").length, 3), total: 3 }) },
  { id: "assiduo", name: "Assiduo", emoji: "🎯", description: "8 giornate completate", color: "#01aa9f", check: (e: EscursioneCompletata[]) => e.filter((x) => x.categoria === "giornata").length >= 8, progress: (e: EscursioneCompletata[]) => ({ current: Math.min(e.filter((x) => x.categoria === "giornata").length, 8), total: 8 }) },
  { id: "collezionista", name: "Collezionista", emoji: "💎", description: "5 filosofie diverse", color: "#946a52", check: (e: EscursioneCompletata[]) => new Set(e.map((x) => getFilosofiaName(x.colore)).filter(Boolean)).size >= 5, progress: (e: EscursioneCompletata[]) => ({ current: Math.min(new Set(e.map((x) => getFilosofiaName(x.colore)).filter(Boolean)).size, 5), total: 5 }) },
  { id: "stagionale", name: "Anima delle Stagioni", emoji: "🍂", description: "Tutte e 4 le stagioni", color: "#75c43c", check: (e: EscursioneCompletata[]) => new Set(e.map((x) => getSeason(new Date(x.data)))).size >= 4, progress: (e: EscursioneCompletata[]) => ({ current: Math.min(new Set(e.map((x) => getSeason(new Date(x.data)))).size, 4), total: 4 }) },
  { id: "esploratore_verticale", name: "Esploratore Verticale", emoji: "⚡", description: "Facile → Media → Impegnativa", color: "#002f59", check: (e: EscursioneCompletata[]) => { const d = e.map((x) => x.difficolta || ""); return d.some((x) => x === "Facile") && d.some((x) => x.includes("Media")) && d.some((x) => x.includes("Impegnativa")); }, progress: (e: EscursioneCompletata[]) => { const d = e.map((x) => x.difficolta || ""); let n = 0; if (d.some((x) => x === "Facile")) n++; if (d.some((x) => x.includes("Media"))) n++; if (d.some((x) => x.includes("Impegnativa"))) n++; return { current: n, total: 3 }; } },
];

const IconaScarponeCustom = ({ size = 24, color = "#d6d3d1", isActive = false }: { size?: number; color?: string; isActive?: boolean }) => {
  const style = { width: size, height: size, transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)" };
  if (isActive) return <div style={{ ...style, backgroundColor: color, maskImage: "url(\"/scarpone.png\")", WebkitMaskImage: "url(\"/scarpone.png\")", maskSize: "contain", maskRepeat: "no-repeat", maskPosition: "center" }} />;
  return <img src="/scarpone.png" alt="scarpone" style={{ ...style, filter: "grayscale(100%) opacity(0.15)" }} />;
};


// --- BadgeChip (versione premium con effetti) ---
const BadgeChip = ({ filo, isUnlocked, count, onClick }: { filo: string; isUnlocked: boolean; count: number; onClick?: () => void }) => {
  const color = FILOSOFIA_COLORS[filo] ?? "#44403c";
  const emoji = BADGE_EMOJI[filo] ?? "★";
  const name  = BADGE_NAMES[filo] ?? filo;
  const pct   = Math.min((count / BADGE_THRESHOLD) * 100, 100);


 
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.04 }}
      whileTap={{ scale: 0.93 }}
      transition={{ type: "spring", stiffness: 380, damping: 18 }}
    >
      <div className="relative">
        {isUnlocked && (
          <div className="absolute -inset-1.5 rounded-[22px] opacity-30 blur-md" style={{ background: color }} />
        )}
        <div
          className="relative w-[58px] h-[62px] md:w-[66px] md:h-[70px] rounded-[18px] flex flex-col items-center justify-center gap-0.5 overflow-hidden"
          style={isUnlocked
            ? { background: `linear-gradient(145deg, ${color}ee 0%, ${color} 60%, ${color}cc 100%)`, boxShadow: `0 4px 14px ${color}55, 0 1px 0 rgba(255,255,255,0.3) inset, 0 -1px 0 rgba(0,0,0,0.12) inset` }
            : { background: "linear-gradient(145deg, #f7f6f4 0%, #edecea 100%)", boxShadow: "0 2px 6px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.8) inset" }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: isUnlocked ? "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 45%, rgba(0,0,0,0.06) 100%)" : "linear-gradient(135deg, rgba(255,255,255,0.7) 0%, transparent 60%)" }} />
          <span className="relative z-10 leading-none select-none" style={{ fontSize: isUnlocked ? 26 : 22, filter: isUnlocked ? "drop-shadow(0 1px 2px rgba(0,0,0,0.18))" : "grayscale(1) opacity(0.22)" }}>
            {emoji}
          </span>
          {!isUnlocked && (
            <div className="relative z-10 w-[38px] h-[3px] rounded-full overflow-hidden bg-stone-200/80 mt-0.5">
              <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: "easeOut" }} />
            </div>
          )}
          {isUnlocked && <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: "rgba(255,255,255,0.25)" }} />}
        </div>
        {isUnlocked && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 14, delay: 0.08 }} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white flex items-center justify-center" style={{ boxShadow: `0 0 0 2px ${color}, 0 2px 6px ${color}55` }}>
            <CheckCircle2 size={10} style={{ color }} />
          </motion.div>
        )}
        {!isUnlocked && count > 0 && (
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full text-[8px] font-black tabular-nums leading-none whitespace-nowrap" style={{ background: "white", color: color, boxShadow: `0 1px 4px rgba(0,0,0,0.12), 0 0 0 1.5px ${color}40` }}>
            {count}/{BADGE_THRESHOLD}
          </div>
        )}
      </div>
      <div className="text-center px-0.5 mt-1">
        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wide leading-tight line-clamp-2" style={{ color: isUnlocked ? color : "#c4c2c0" }}>
          {name}
        </span>
      </div>
    </motion.div>
  );
};

// --- BadgeDetailPopup ---
const BadgeDetailPopup = ({ filo, isUnlocked, count, onClose }: { filo: string; isUnlocked: boolean; count: number; onClose: () => void }) => {
  const color = FILOSOFIA_COLORS[filo] ?? "#44403c";
  const emoji = BADGE_EMOJI[filo] ?? "★";
  const name = BADGE_NAMES[filo] ?? filo;
  const remaining = BADGE_THRESHOLD - count;
  const pct = Math.min((count / BADGE_THRESHOLD) * 100, 100);

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-4 bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ y: 60, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 60, opacity: 0, scale: 0.96 }} transition={{ type: "spring", stiffness: 380, damping: 28 }} className="bg-white w-full max-w-xs rounded-[2.5rem] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.18)] border border-stone-100 relative">
        <button onClick={onClose} className="absolute top-5 right-5 z-10 p-2 bg-white/60 backdrop-blur-sm rounded-full text-stone-400 hover:text-stone-700 transition-colors"><X size={16} /></button>
        <div className="relative h-36 flex items-center justify-center overflow-hidden" style={isUnlocked ? { background: `linear-gradient(145deg, ${color}cc 0%, ${color} 60%, ${color}aa 100%)` } : { background: "linear-gradient(145deg, #f0eeec 0%, #e8e5e2 100%)" }}>
          {isUnlocked && <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 60%, rgba(255,255,255,0.25) 0%, transparent 70%)` }} />}
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)" }} />
          <motion.div initial={{ scale: 0.5, rotate: -12, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.06 }} className="relative z-10" style={{ fontSize: 56, lineHeight: 1, filter: isUnlocked ? "drop-shadow(0 4px 12px rgba(0,0,0,0.22))" : "grayscale(1) opacity(0.3)" }}>
            {emoji}
          </motion.div>
          {isUnlocked && (
            <>
              <motion.span initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 0.6, scale: 1 }} transition={{ delay: 0.25 }} className="absolute top-4 left-8 text-white/60 text-xs select-none">✦</motion.span>
              <motion.span initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 0.4, scale: 1 }} transition={{ delay: 0.35 }} className="absolute bottom-5 right-7 text-white/40 text-[10px] select-none">✦</motion.span>
            </>
          )}
        </div>
        <div className="px-8 py-6 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1" style={{ color: isUnlocked ? color : "#c4c2c0" }}>{isUnlocked ? "Badge Sbloccato ✓" : "Badge Bloccato"}</p>
          <h3 className="text-xl font-black uppercase tracking-tight text-stone-800 mb-0.5">{name}</h3>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{filo}</p>
          {isUnlocked ? (
            <div className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest" style={{ background: `${color}15`, color }}>
              <Award size={12} /> {BADGE_THRESHOLD} escursioni completate
            </div>
          ) : (
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Avanzamento</span>
                <span className="text-[9px] font-black tabular-nums" style={{ color }}>{count}/{BADGE_THRESHOLD}</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: "easeOut" }} />
              </div>
              <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-2">Ancora {remaining} {remaining === 1 ? "escursione" : "escursioni"}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// --- PinInput ---
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

  const firstRowCount = 3;
  const secondRowCount = 3;
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-3 justify-center">
        {Array.from({ length: firstRowCount }).map((_, i) => (
          <input key={i} ref={el => inputRefs.current[i] = el} type="password" inputMode="numeric" maxLength={1} value={value[i] || ""} onChange={(e) => handleChange(i, e)} onKeyDown={(e) => handleKeyDown(i, e)} onPaste={handlePaste} disabled={disabled} className="w-12 h-12 text-center text-2xl font-black bg-stone-50 border-2 border-stone-100 rounded-xl outline-none focus:border-brand-sky transition-all shadow-inner" />
        ))}
      </div>
      <div className="flex gap-3 justify-center">
        {Array.from({ length: secondRowCount }).map((_, i) => {
          const idx = firstRowCount + i;
          return <input key={idx} ref={el => inputRefs.current[idx] = el} type="password" inputMode="numeric" maxLength={1} value={value[idx] || ""} onChange={(e) => handleChange(idx, e)} onKeyDown={(e) => handleKeyDown(idx, e)} onPaste={handlePaste} disabled={disabled} className="w-12 h-12 text-center text-2xl font-black bg-stone-50 border-2 border-stone-100 rounded-xl outline-none focus:border-brand-sky transition-all shadow-inner" />;
        })}
      </div>
    </div>
  );
};

export default function Tessera() {
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userTessera, setUserTessera] = useState<UserTessera | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("TESSERA");
  const [currentPage, setCurrentPage] = useState(0);
  const [loginCode, setLoginCode] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [loginStep, setLoginStep] = useState<"code" | "pin">("code");
  const [loginError, setLoginError] = useState("");
  const [pendingTessera, setPendingTessera] = useState<UserTessera | null>(null);

  // Redeem states
  const [showRedeem, setShowRedeem] = useState(false);
  const [redeemStep, setRedeemStep] = useState<RedeemStep>("INPUT");
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemError, setRedeemError] = useState("");
  const [redeemAttempts, setRedeemAttempts] = useState(0);
  const [pendingActivity, setPendingActivity] = useState<{ titolo: string; filosofia?: string | null; categoria?: string; difficolta?: string } | null>(null);
  const [chosenColor, setChosenColor] = useState<string | null>(null);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<string | null>(null);
  const [newlyUnlockedAchievement, setNewlyUnlockedAchievement] = useState<string | null>(null);

  // Modal states
  const [selectedBoot, setSelectedBoot] = useState<EscursioneCompletata | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<{ filo: string; isUnlocked: boolean; count: number } | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<any | null>(null);

  // ── Avatar upload ──────────────────────────────────────────────────────────
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userTessera) return;
    setAvatarUploading(true);
    try {
      // Comprimi canvas a max 400×400 JPEG
      const bitmap = await createImageBitmap(file);
      const size = Math.min(bitmap.width, bitmap.height, 400);
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const sx = (bitmap.width - size) / 2;
      const sy = (bitmap.height - size) / 2;
      ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, size, size);
      const blob = await new Promise<Blob>((res) => canvas.toBlob(b => res(b!), "image/jpeg", 0.82));

      const path = `avatars/${userTessera.id}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const freshUrl = `${pub.publicUrl}?t=${Date.now()}`;

      const { error: dbErr } = await supabase
        .from("tessere")
        .update({ avatar_url: freshUrl })
        .eq("id", userTessera.id);
      if (dbErr) throw dbErr;

      setUserTessera((prev) => prev ? { ...prev, avatar_url: freshUrl } : prev);
    } catch (err) {
      console.error("Errore upload avatar:", err);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  // ──────────────────────────────────────────────────────────────────────────

  const escursioniCompletateParsed = useMemo(() => parseJsonArray<EscursioneCompletata>(userTessera?.escursioni_completate), [userTessera?.escursioni_completate]);
  const badgesFilosofiaParsed = useMemo(() => parseJsonArray<string>(userTessera?.badges_filosofia), [userTessera?.badges_filosofia]);

  const stats = useMemo(() => {
    if (!userTessera) return null;
    const count = escursioniCompletateParsed.length || 0;
    const levelIdx = Math.min(Math.floor(count / 8), TESSERA_LEVELS.length - 1);
    return {
      currentLevelLabel: TESSERA_LEVELS[levelIdx],
      totalPages: Math.max(1, Math.ceil(count / SLOTS_PER_PAGE)),
      vouchersCount: Math.floor(count / 8),
      kmTotali: userTessera.km_totali || 0,
      dislivelloTotali: userTessera.dislivello_totali || 0,
    };
  }, [userTessera, escursioniCompletateParsed]);

  const earnedBadges = useMemo(() => userTessera ? computeEarnedBadges(escursioniCompletateParsed) : [], [userTessera, escursioniCompletateParsed]);
  const badgeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    escursioniCompletateParsed.forEach(e => { const f = getFilosofiaName(e.colore); if (f) counts[f] = (counts[f] || 0) + 1; });
    return counts;
  }, [escursioniCompletateParsed]);

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) { const { code } = JSON.parse(saved); fetchUser(code, true); }
    else setLoading(false);
  }, []);

  async function fetchUser(codice: string, isSession = false) {
    setLoading(true); setLoginError("");
    const { data, error } = await supabase.from("tessere").select("*, km_totali, dislivello_totali").eq("codice_tessera", codice.toUpperCase().trim()).single();
    if (error || !data) {
      if (!isSession) setLoginError("Codice tessera non trovato.");
      setLoading(false);
    } else {
      if (isSession) { setUserTessera(data as UserTessera); setLoading(false); }
      else { setPendingTessera(data as UserTessera); setLoginStep("pin"); setLoading(false); }
    }
  }

  async function completeLogin(tessera: UserTessera) {
    const { data } = await supabase.from("tessere").select("*").eq("codice_tessera", tessera.codice_tessera).single();
    const clean = (data ?? tessera) as UserTessera;
    setUserTessera(clean);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ code: clean.codice_tessera, expires: Date.now() + 7 * 24 * 60 * 60 * 1000 }));
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
    setUserTessera(null); setLoginStep("code"); setLoginCode(""); setLoginPin("");
  };

  const closeRedeem = useCallback(() => {
    if (isVerifying) return;
    setShowRedeem(false); setRedeemCode(""); setRedeemStep("INPUT"); setRedeemError("");
    setPendingActivity(null); setChosenColor(null);
    setNewlyUnlockedBadge(null); setNewlyUnlockedAchievement(null); setRedeemAttempts(0);
  }, [isVerifying]);

  const verifyCode = async () => {
    if (!redeemCode.trim() || !userTessera) return;
    if (redeemAttempts >= MAX_REDEEM_ATTEMPTS) { setRedeemError("Troppi tentativi."); return; }
    const normalized = redeemCode.toUpperCase().trim();
    if (!REDEEM_CODE_REGEX.test(normalized)) { setRedeemError("Formato non valido."); return; }
    setIsVerifying(true); setRedeemError(""); setRedeemAttempts(n => n + 1);
    const { data, error } = await supabase.from("escursioni").select("id, titolo, filosofia, categoria, difficolta, codici_usati").contains("codici_riscatto", [normalized]).single();
    if (error || !data) { setRedeemError("Codice non valido."); setIsVerifying(false); return; }
    if ((data.codici_usati as string[] | null)?.includes(normalized)) { setRedeemError("Codice già usato."); setIsVerifying(false); return; }
    if (escursioniCompletateParsed.some(e => e.titolo === data.titolo)) { setRedeemError("Già riscattato."); setIsVerifying(false); return; }
    const color = getFilosofiaColor(data.filosofia);
    const newEntry: EscursioneCompletata = { titolo: data.titolo, colore: color, data: new Date().toISOString(), ...(data.categoria ? { categoria: data.categoria } : {}), ...(data.difficolta ? { difficolta: data.difficolta } : {}) };
    const updatedList = [...escursioniCompletateParsed, newEntry];
    const oldBadges = computeEarnedBadges(escursioniCompletateParsed);
    const newBadges = computeEarnedBadges(updatedList);
    const justUnlocked = newBadges.find(b => !oldBadges.includes(b)) ?? null;
    const oldAchievements = ACHIEVEMENT_BADGES.filter(ab => ab.check(escursioniCompletateParsed)).map(ab => ab.id);
    const newAchievements = ACHIEVEMENT_BADGES.filter(ab => ab.check(updatedList)).map(ab => ab.id);
    const justUnlockedAchievement = newAchievements.find(id => !oldAchievements.includes(id)) ?? null;
    const updatePayload: any = { escursioni_completate: updatedList };
    if (justUnlocked) updatePayload.badges_filosofia = [...badgesFilosofiaParsed, justUnlocked];
    const { data: saved, error: saveErr } = await supabase.from("tessere").update(updatePayload).eq("id", userTessera.id).select();
    if (saveErr || !saved) { setRedeemError("Errore salvataggio."); setIsVerifying(false); return; }
    setUserTessera(saved[0] as UserTessera);
    setPendingActivity({ titolo: data.titolo, filosofia: data.filosofia ?? null, categoria: data.categoria ?? undefined, difficolta: data.difficolta ?? undefined });
    setChosenColor(color); setNewlyUnlockedBadge(justUnlocked); setNewlyUnlockedAchievement(justUnlockedAchievement);
    setRedeemStep("SUCCESS"); setIsVerifying(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f5f2ed]"><Loader2 className="animate-spin text-sky-500" /></div>;

  return (
    <div className="min-h-screen bg-[#f5f2ed] text-stone-800 pb-20">
      {/* Login Screen */}
      <AnimatePresence mode="wait">
        {!userTessera && (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#f5f2ed]">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", damping: 20, stiffness: 250 }} className="w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl border border-white/60 text-center">
              <button onClick={() => window.location.href = '/'} className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-stone-200 shadow-sm hover:bg-stone-100 hover:border-stone-300 transition-all duration-200 active:scale-95" aria-label="Torna alla home">
                <ChevronLeft size={14} />
                <span className="text-[10px] font-black uppercase tracking-wide text-stone-600">Home</span>
              </button>
              <img src="/altour-logo.png" alt="Altour Italy" className="h-16 w-auto mx-auto mb-4 rounded-xl" onError={(e) => { e.currentTarget.src = "/altour-logo.png"; }} />
              <h1 className="text-2xl font-black uppercase mb-6">TESSERA ALTOUR</h1>
              {loginStep === "code" ? (
                <div className="space-y-4">
                  <input type="text" placeholder="ALTXXX" value={loginCode} onChange={(e) => setLoginCode(e.target.value)} className="w-full p-4 rounded-2xl bg-stone-50 border border-stone-100 text-center font-bold uppercase" />
                  <button onClick={() => fetchUser(loginCode)} className="w-full p-4 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest">Avanti</button>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-xs font-bold text-stone-400 uppercase">Inserisci il tuo PIN a {PIN_LENGTH} cifre</p>
                  <PinInput value={loginPin} onChange={setLoginPin} onComplete={handleVerifyPin} length={PIN_LENGTH} disabled={isVerifying} />
                  <button onClick={handleVerifyPin} disabled={isVerifying || loginPin.length !== PIN_LENGTH} className="w-full p-4 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest">
                    {isVerifying ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Accedi"}
                  </button>
                  <button onClick={() => { setLoginStep("code"); setLoginPin(""); setLoginError(""); }} className="text-[10px] font-black uppercase text-stone-300 mt-4">Indietro</button>
                </div>
              )}
              {loginError && <p className="mt-4 text-red-500 text-xs font-bold">{loginError}</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {userTessera && (
        <>
          {/* HERO */}
          <div className="relative h-[45vh] md:h-[55vh] w-full flex items-center justify-center text-center overflow-hidden">
            <img src="https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Trentino_neve.webp" className="absolute inset-0 w-full h-full object-cover object-[center_60%]" alt="header bg" />
            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-[50%] to-black/40" />
            <button onClick={handleLogout} className="absolute top-4 right-4 p-3 bg-black/20 backdrop-blur-md rounded-full text-white border border-white/10 z-50 hover:bg-black/40 transition-all"><LogOut size={18} /></button>
            <div className="relative z-20 px-4 flex flex-col items-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <h1 className="text-3xl md:text-5xl font-black text-white uppercase drop-shadow-lg tracking-tight">Passaporto Altour</h1>
                <p className="text-white font-black text-lg md:text-2xl uppercase tracking-tight mt-1 leading-none drop-shadow-md">{userTessera.nome_escursionista} {userTessera.cognome_escursionista}</p>
                <p className="text-white/70 font-black tracking-[0.4em] text-[10px] md:text-[12px] uppercase mt-2 mb-6">Cod. {userTessera.codice_tessera}</p>
                <div className="inline-flex items-center gap-4 px-6 py-4 rounded-[2rem] backdrop-blur-xl border border-white/20 bg-white/15 shadow-2xl">
                  <IconaScarponeCustom size={50} color="#5aaadd" isActive={true} />
                  <div className="flex flex-col items-start">
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/60 leading-none mb-1">Profilo Escursionista</span>
                    <span className="text-[13px] md:text-[16px] font-black uppercase tracking-wide text-white leading-none drop-shadow-sm">{userTessera.livello || stats?.currentLevelLabel}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="sticky top-0 z-40 bg-[#f5f2ed]/85 border-b border-stone-200/40 px-4 py-4 mb-8">
            <div className="max-w-xl mx-auto flex gap-3">
              {(["TESSERA", "BADGE", "TRAGUARDI"] as TabType[]).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab ? "bg-[#5aaadd] text-white shadow-xl scale-[1.02]" : "bg-white text-stone-400 border border-stone-100 hover:bg-stone-50"}`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="max-w-xl mx-auto px-4 relative z-30 -mt-10">
            <AnimatePresence mode="wait">
              {activeTab === "TESSERA" && (
                <motion.div key="tessera" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ type: "spring", damping: 25, stiffness: 200 }}>
                  <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-white/60">
                    <div className="flex items-center gap-5 mb-8">

                      {/* ── Avatar con upload ─────────────────────────────── */}
                      <div className="relative flex-shrink-0">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="w-20 h-20 rounded-[2rem] bg-stone-50 border border-stone-100 overflow-hidden flex items-center justify-center shadow-inner cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                          title="Tocca per cambiare foto"
                        >
                          {userTessera.avatar_url
                            ? <img src={userTessera.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                            : <User size={32} className="text-stone-300" />
                          }
                          {avatarUploading && (
                            <div className="absolute inset-0 bg-black/30 rounded-[2rem] flex items-center justify-center">
                              <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                          )}
                        </motion.div>
                        {/* Bottone fotocamera */}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={avatarUploading}
                          className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-white border border-stone-200 shadow-md flex items-center justify-center hover:bg-stone-50 active:scale-90 transition-all disabled:opacity-50"
                          aria-label="Carica foto profilo"
                        >
                          <Camera size={13} className="text-stone-600" />
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
                      </div>
                      {/* ───────────────────────────────────────────────────── */}

                      <div>
                        <div className="flex items-center gap-1.5 text-sky-500 mb-1"><ShieldCheck size={14} /><span className="text-[10px] font-black uppercase tracking-wider">Escursionista Verificato</span></div>
                        <h2 className="text-2xl font-black uppercase leading-tight">{userTessera.nome_escursionista} {userTessera.cognome_escursionista}</h2>
                        <p className="text-[11px] font-black text-stone-400 uppercase tracking-widest mt-0.5">{userTessera.livello || stats?.currentLevelLabel} · {escursioniCompletateParsed.length || 0} Scarponi</p>
                      </div>
                    </div>

                    {/* Box Km Totali e Dislivello Totali */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="p-5 rounded-[2rem] bg-sky-50 border border-sky-100 shadow-sm flex flex-col items-center justify-center">
                        <Footprints size={32} className="text-sky-500 mb-2" />
                        <p className="text-[10px] font-black uppercase text-sky-400 tracking-widest">Km Totali</p>
                        <h4 className="text-xl font-black uppercase text-sky-950 leading-tight mt-1">{stats?.kmTotali} km</h4>
                      </div>
                      <div className="p-5 rounded-[2rem] bg-emerald-50 border border-emerald-100 shadow-sm flex flex-col items-center justify-center">
                        <Mountain size={32} className="text-emerald-500 mb-2" />
                        <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Dislivello Totale</p>
                        <h4 className="text-xl font-black uppercase text-emerald-950 leading-tight mt-1">{stats?.dislivelloTotali} m</h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 md:gap-6 mb-8">
                      {Array.from({ length: SLOTS_PER_PAGE }).map((_, i) => {
                        const esc = escursioniCompletateParsed?.[currentPage * SLOTS_PER_PAGE + i];
                        return (
                          <motion.div key={i} whileHover={esc ? { scale: 1.05, y: -5 } : {}} whileTap={esc ? { scale: 0.95 } : {}} onClick={() => esc && setSelectedBoot(esc)}
                            className={`aspect-square rounded-[1.5rem] md:rounded-[2rem] bg-stone-50 border-2 border-dashed border-stone-100 flex items-center justify-center transition-all duration-300 ${esc ? "cursor-pointer bg-white shadow-md border-solid border-stone-50" : "opacity-40"}`}>
                            <IconaScarponeCustom size={window.innerWidth < 768 ? 48 : 64} color={esc?.colore} isActive={!!esc} />
                          </motion.div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between items-center pt-6 border-t border-stone-50">
                      <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)} className="p-3 bg-stone-50 rounded-full disabled:opacity-20 hover:bg-stone-100 transition-all"><ChevronLeft size={20} /></button>
                      <span className="text-[11px] font-black uppercase text-stone-300 tracking-[0.2em]">Pagina {currentPage + 1} di {stats?.totalPages}</span>
                      <button disabled={currentPage >= (stats?.totalPages || 1) - 1} onClick={() => setCurrentPage(p => p + 1)} className="p-3 bg-stone-50 rounded-full disabled:opacity-20 hover:bg-stone-100 transition-all"><ChevronRight size={20} /></button>
                    </div>
                  </div>

                  <motion.button onClick={() => setShowRedeem(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full mt-6 p-6 bg-sky-500 text-white rounded-[2.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-4 shadow-xl shadow-sky-200 relative overflow-hidden transition-all">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />
                    <Plus size={24} strokeWidth={3} /> Riscatta Scarpone
                  </motion.button>

                  {stats && stats.vouchersCount > 0 && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 rounded-[2.5rem] p-6 flex items-center justify-between bg-gradient-to-br from-amber-100 via-amber-200 to-amber-400 shadow-xl shadow-amber-100 border border-white/40">
                      <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-white/70 backdrop-blur-md rounded-2xl shadow-sm"><Gift size={26} className="text-amber-600" /></div>
                        <div>
                          <p className="text-[11px] font-black uppercase text-amber-800 tracking-widest leading-none mb-1.5">VOUCHER SBLOCCATI 🎉</p>
                          <h4 className="text-base md:text-lg font-black uppercase text-amber-950 leading-tight">{stats.vouchersCount} Voucher da 10 € maturati</h4>
                        </div>
                      </div>
                      <div className="text-4xl font-black text-amber-900/20 select-none">✦</div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {activeTab === "BADGE" && (
                <motion.div key="badge" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="bg-white rounded-[3rem] p-8 shadow-2xl border border-white/60">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-stone-900 flex items-center justify-center shadow-lg"><Award size={24} className="text-white" /></div>
                    <div>
                      <h3 className="text-xl font-black uppercase leading-none">Collezione Filosofie</h3>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">5 escursioni per sbloccare il badge</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-x-4 gap-y-8">
                    {Object.keys(BADGE_NAMES).map(filo => (
                      <BadgeChip key={filo} filo={filo} isUnlocked={earnedBadges.includes(filo)} count={badgeCounts[filo] || 0}
                        onClick={() => setSelectedBadge({ filo, isUnlocked: earnedBadges.includes(filo), count: badgeCounts[filo] || 0 })} />
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "TRAGUARDI" && (
                <motion.div key="traguardi" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="bg-white rounded-[3rem] p-8 shadow-2xl border border-white/60">
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
                        <motion.div key={badge.id} whileHover={{ scale: 1.02, x: 5 }} whileTap={{ scale: 0.98 }} onClick={() => setSelectedAchievement(badge)}
                          className={`p-5 rounded-[2rem] border transition-all cursor-pointer ${isUnlocked ? "bg-stone-50 border-stone-200 shadow-sm" : "bg-white border-stone-100 opacity-50"}`}>
                          <div className="flex items-center gap-4">
                            <span className="text-3xl drop-shadow-sm">{badge.emoji}</span>
                            <div className="flex-1">
                              <h4 className="text-xs font-black uppercase tracking-wide">{badge.name}</h4>
                              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{badge.description}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[11px] font-black uppercase text-stone-400 tabular-nums">{prog.current}/{prog.total}</span>
                              <div className="w-16 h-1.5 bg-stone-100 rounded-full mt-1.5 overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${(prog.current / prog.total) * 100}%` }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-sky-500" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* MODALS */}
          <AnimatePresence>
            {showRedeem && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeRedeem} className="absolute inset-0 bg-stone-900/70" />
                <motion.div initial={{ scale: 0.8, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: 40 }} transition={{ type: "spring", damping: 20, stiffness: 250 }} className="relative w-full max-w-sm bg-white rounded-[3rem] p-10 shadow-2xl overflow-hidden border border-white/20">
                  <button onClick={closeRedeem} disabled={isVerifying} className="absolute top-8 right-8 p-2.5 bg-stone-50 rounded-full text-stone-400 hover:text-stone-600 transition-all active:scale-90"><X size={20} /></button>
                  <AnimatePresence mode="wait">
                    {redeemStep === "INPUT" ? (
                      <motion.div key="input" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <div className="text-center mb-8">
                          <div className="inline-flex p-4 bg-sky-50 rounded-2xl mb-4"><Plus className="text-sky-500" size={28} /></div>
                          <h3 className="text-2xl font-black uppercase tracking-tight">Codice Scarpone</h3>
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Inserisci il codice ricevuto</p>
                        </div>
                        <input className="w-full bg-stone-50 border-2 border-stone-100 p-5 rounded-2xl text-center text-2xl font-black uppercase outline-none focus:border-sky-500 transition-all shadow-inner"
                          placeholder="****" value={redeemCode} onChange={(e) => setRedeemCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && verifyCode()} />
                        {redeemError && <p className="text-red-500 text-[10px] font-black mt-3 uppercase text-center py-2 bg-red-50 rounded-lg">{redeemError}</p>}
                        <button onClick={verifyCode} disabled={isVerifying} className="w-full mt-6 bg-stone-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg">
                          {isVerifying ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Verifica Codice"}
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center">
                        <div className="mb-4"><CheckCircle2 size={48} className="text-emerald-400 mx-auto" /></div>
                        <div className="mb-6 p-6 rounded-3xl" style={{ backgroundColor: `${chosenColor}15` }}>
                          <IconaScarponeCustom size={80} color={chosenColor || "#5aaadd"} isActive={true} />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-stone-800 mb-1">{pendingActivity?.titolo}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-4">Scarpone Riscattato! 🎉</p>
                        {newlyUnlockedBadge && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="w-full p-4 rounded-2xl mb-3 flex items-center gap-4 text-left" style={{ backgroundColor: `${FILOSOFIA_COLORS[newlyUnlockedBadge]}15` }}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg" style={{ backgroundColor: FILOSOFIA_COLORS[newlyUnlockedBadge] }}>{BADGE_EMOJI[newlyUnlockedBadge]}</div>
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-0.5">Nuovo Badge!</p>
                              <p className="text-sm font-black uppercase text-stone-800">{BADGE_NAMES[newlyUnlockedBadge]}</p>
                            </div>
                          </motion.div>
                        )}
                        {newlyUnlockedAchievement && (() => {
                          const ab = ACHIEVEMENT_BADGES.find(x => x.id === newlyUnlockedAchievement);
                          if (!ab) return null;
                          return (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: newlyUnlockedBadge ? 0.5 : 0.3 }} className="w-full p-4 rounded-2xl mb-3 flex items-center gap-4 text-left" style={{ backgroundColor: `${ab.color}15` }}>
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg" style={{ backgroundColor: ab.color }}>{ab.emoji}</div>
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-0.5">Traguardo Raggiunto!</p>
                                <p className="text-sm font-black uppercase text-stone-800">{ab.name}</p>
                              </div>
                            </motion.div>
                          );
                        })()}
                        <button onClick={closeRedeem} className="w-full mt-4 bg-stone-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg">Perfetto!</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}

            {selectedBoot && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedBoot(null)} className="absolute inset-0 bg-stone-900/70 backdrop-blur-md" />
                <motion.div initial={{ scale: 0.8, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: 40 }} transition={{ type: "spring", damping: 20, stiffness: 250 }} className="relative w-full max-w-sm bg-white rounded-[3rem] p-10 shadow-2xl overflow-hidden border border-white/20">
                  <button onClick={() => setSelectedBoot(null)} className="absolute top-8 right-8 p-2.5 bg-stone-50 rounded-full text-stone-400 hover:text-stone-600 transition-all active:scale-90"><X size={20} /></button>
                  <div className="flex flex-col items-center text-center">
                    <motion.div initial={{ rotate: -10, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: 0.1, type: "spring" }} className="w-32 h-32 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl" style={{ backgroundColor: selectedBoot.colore + "15", border: `1px solid ${selectedBoot.colore}20` }}>
                      <IconaScarponeCustom size={80} color={selectedBoot.colore} isActive={true} />
                    </motion.div>
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                      <div className="px-4 py-1.5 rounded-full bg-stone-100 text-[10px] font-black uppercase text-stone-500 tracking-widest border border-stone-200/50">{getFilosofiaName(selectedBoot.colore)}</div>
                      {selectedBoot.difficolta && <div className="px-4 py-1.5 rounded-full bg-stone-100 text-[10px] font-black uppercase text-stone-500 tracking-widest border border-stone-200/50">{selectedBoot.difficolta}</div>}
                    </div>
                    <h3 className="text-2xl font-black uppercase leading-tight mb-4 tracking-tight">{selectedBoot.titolo}</h3>
                    <div className="flex flex-col gap-2 w-full pt-6 border-t border-stone-50">
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
                  </div>
                </motion.div>
              </div>
            )}

            {selectedBadge && (
              <BadgeDetailPopup filo={selectedBadge.filo} isUnlocked={selectedBadge.isUnlocked} count={selectedBadge.count} onClose={() => setSelectedBadge(null)} />
            )}

            {selectedAchievement && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedAchievement(null)} className="absolute inset-0 bg-stone-900/70 backdrop-blur-md" />
                <motion.div initial={{ scale: 0.8, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: 40 }} transition={{ type: "spring", damping: 20, stiffness: 250 }} className="relative w-full max-w-sm bg-white rounded-[3rem] p-10 shadow-2xl overflow-hidden border border-white/20">
                  <button onClick={() => setSelectedAchievement(null)} className="absolute top-8 right-8 p-2.5 bg-stone-50 rounded-full text-stone-400 hover:text-stone-600 transition-all active:scale-90"><X size={20} /></button>
                  <div className="flex flex-col items-center text-center">
                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", delay: 0.1 }} className="w-32 h-32 rounded-[2.5rem] flex items-center justify-center mb-8 bg-stone-50 border-2 border-stone-100 shadow-xl">
                      <span className="text-6xl drop-shadow-sm">{selectedAchievement.emoji}</span>
                    </motion.div>
                    <h3 className="text-2xl font-black uppercase leading-tight mb-3 tracking-tight">{selectedAchievement.name}</h3>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-8 leading-relaxed">{selectedAchievement.description}</p>
                    <div className="w-full p-6 bg-stone-50 rounded-[2rem] border border-stone-100">
                      <p className="text-[10px] font-black uppercase text-stone-400 mb-3 tracking-widest">Progresso Attuale</p>
                      {(() => {
                        const prog = selectedAchievement.progress(escursioniCompletateParsed);
                        return (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-black uppercase tabular-nums">{prog.current} / {prog.total}</span>
                              <span className="text-sm font-black text-sky-500 tabular-nums">{Math.round((prog.current / prog.total) * 100)}%</span>
                            </div>
                            <div className="h-2.5 w-full bg-stone-200 rounded-full mt-1.5 overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${(prog.current / prog.total) * 100}%` }} transition={{ duration: 1.2, ease: "easeOut" }} className="h-full bg-sky-500" />
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

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