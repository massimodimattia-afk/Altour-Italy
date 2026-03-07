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
  Gift,
  CheckCircle2,
  User,
  Camera,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";

// ─── Costanti sessione ───────────────────────────────────────────────────────
const SESSION_KEY = "altour_session_v4";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const MAX_REDEEM_ATTEMPTS = 10;

const REDEEM_CODE_REGEX = /^[A-Z0-9]{3,10}$/;
const TESSERA_CODE_REGEX = /^ALT[A-Z0-9]{1,10}$/;

// ─── Mappa Filosofia → Colore ────────────────────────────────────────────────
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
};

const DEFAULT_BOOT_COLOR = "#5aaadd";

// ─── Badge sistema filosofia ─────────────────────────────────────────────────
const BADGE_THRESHOLD = 3;

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
};


const BADGE_EMOJI: Record<string, string> = {
  "Avventura":              "⛰",
  "Benessere":              "🌿",
  "Borghi più belli":       "🏘",
  "Cammini":                "🥾",
  "Educazione all'aperto":  "🌱",
  "Eventi":                 "✨",
  "Formazione":             "📖",
  "Immersi nel verde":      "🌲",
  "Luoghi dello spirito":   "🕊",
  "Novità":                 "🔭",
  "Speciali":               "🌟",
  "Tra mare e cielo":       "🌊",
  "Trek urbano":            "🏙",
};

function computeEarnedBadges(escursioni: EscursioneCompletata[]): string[] {
  const counts: Record<string, number> = {};
  for (const e of escursioni) {
    const filo = getFilosofiaName(e.colore);
    if (filo) counts[filo] = (counts[filo] || 0) + 1;
  }
  return Object.entries(counts)
    .filter(([, n]) => n >= BADGE_THRESHOLD)
    .map(([filo]) => filo);
}

const FILOSOFIA_ALIAS: Record<string, string> = {
  "Outdoor Education":    "Educazione all'aperto",
  "Luoghi dello Spirito": "Luoghi dello spirito",
  "Tra Mare e Cielo":     "Tra mare e cielo",
  "Trek Urbano":          "Trek urbano",
  "Giornata da Guida":    "Novità",
};

function normalizeFilosofia(value?: string | null): string | null {
  if (!value) return value ?? null;
  const key = value.trim();
  return FILOSOFIA_ALIAS[key] ?? key;
}

function getFilosofiaColor(filosofia?: string | null): string {
  if (!filosofia) return DEFAULT_BOOT_COLOR;
  const f = normalizeFilosofia(filosofia);
  return FILOSOFIA_COLORS[f ?? ""] ?? DEFAULT_BOOT_COLOR;
}

function getFilosofiaName(hex: string): string {
  return Object.entries(FILOSOFIA_COLORS).find(([, v]) => v === hex)?.[0] ?? "";
}

// ─── Helpers localStorage ────────────────────────────────────────────────────
function saveSession(codice: string) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ code: codice, expires: Date.now() + SESSION_DURATION_MS }),
  );
}
function loadSession(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { code, expires } = JSON.parse(raw);
    if (Date.now() < expires) return code;
    localStorage.removeItem(SESSION_KEY);
    return null;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

async function fireConfetti(color: string) {
  const { default: confetti } = await import("canvas-confetti");
  confetti({ particleCount: 160, spread: 70, colors: [color, "#ffffff", "#f5f2ed"] });
}

async function fireBadgeConfetti(color: string) {
  const { default: confetti } = await import("canvas-confetti");
  confetti({ particleCount: 80, spread: 50, origin: { x: 0.3, y: 0.6 }, colors: [color, "#ffffff", "#f5f2ed"] });
  setTimeout(() => {
    confetti({ particleCount: 80, spread: 50, origin: { x: 0.7, y: 0.6 }, colors: [color, "#ffffff", "#f5f2ed"] });
  }, 150);
}

// ─── Icona Scarpone ──────────────────────────────────────────────────────────
const IconaScarponeCustom = ({
  size = 24,
  color = "#d6d3d1",
  isActive = false,
  className = "",
}: {
  size?: number;
  color?: string;
  isActive?: boolean;
  className?: string;
}) => {
  const baseStyle = { width: size, height: size, transition: "all 0.3s ease-in-out" };
  if (isActive) {
    return (
      <div
        className={`flex-shrink-0 ${className}`}
        style={{
          ...baseStyle,
          backgroundColor: color,
          maskImage: "url('/scarpone.png')",
          WebkitMaskImage: "url('/scarpone.png')",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
          maskSize: "contain",
          WebkitMaskSize: "contain",
          filter: `drop-shadow(0px 2px 3px ${color}40)`,
        }}
      />
    );
  }
  return (
    <img
      src="/scarpone.png"
      alt="scarpone"
      className={`flex-shrink-0 ${className}`}
      style={{ ...baseStyle, filter: "grayscale(100%) opacity(0.2)" }}
    />
  );
};

// ─── Badge Chip ──────────────────────────────────────────────────────────────
const BadgeChip = ({
  filo,
  isUnlocked,
  count,
  onClick,
}: {
  filo: string;
  isUnlocked: boolean;
  count: number;
  onClick?: () => void;
}) => {
  const color = FILOSOFIA_COLORS[filo] ?? "#44403c";
  const emoji = BADGE_EMOJI[filo] ?? "★";

  return (
    <motion.div
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className="flex flex-col items-center cursor-pointer"
    >
      <div className="relative">
        <motion.div
          className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-xl transition-all"
          style={
            isUnlocked
              ? { backgroundColor: color, boxShadow: `0 4px 14px ${color}55, inset 0 1px 0 rgba(255,255,255,0.25)` }
              : { backgroundColor: "#f5f5f4", border: "2px dashed #e7e5e4" }
          }
          whileHover={isUnlocked ? { scale: 1.08, y: -2 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          {isUnlocked ? (
            <span className="text-lg leading-none">{emoji}</span>
          ) : (
            <span className="text-stone-300 text-[9px] font-black">{count}/{BADGE_THRESHOLD}</span>
          )}
        </motion.div>
        {isUnlocked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm"
            style={{ border: `2px solid ${color}` }}
          >
            <CheckCircle2 size={8} style={{ color }} />
          </motion.div>
        )}
      </div>

    </motion.div>
  );
};

// ─── Badge Detail Popup ───────────────────────────────────────────────────────
const BadgeDetailPopup = ({
  filo,
  isUnlocked,
  count,
  onClose,
}: {
  filo: string;
  isUnlocked: boolean;
  count: number;
  onClose: () => void;
}) => {
  const color = FILOSOFIA_COLORS[filo] ?? "#44403c";
  const emoji = BADGE_EMOJI[filo] ?? "★";
  const name = BADGE_NAMES[filo] ?? filo;
  const remaining = BADGE_THRESHOLD - count;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-4 backdrop-blur-sm bg-black/30"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="bg-white w-full max-w-xs rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-stone-100 relative text-center"
      >
        <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-stone-50 rounded-full text-stone-300 hover:text-stone-700 transition-colors">
          <X size={16} />
        </button>

        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.05 }}
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4"
          style={
            isUnlocked
              ? { backgroundColor: color, boxShadow: `0 8px 24px ${color}55, inset 0 1px 0 rgba(255,255,255,0.25)` }
              : { backgroundColor: "#f5f5f4", border: "2px dashed #e7e5e4", filter: "grayscale(1) opacity(0.5)" }
          }
        >
          {emoji}
        </motion.div>

        {isUnlocked ? (
          <>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color }}>Badge Sbloccato</p>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-stone-800 mb-1">{name}</h3>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{filo}</p>
            <div
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest"
              style={{ backgroundColor: `${color}18`, color }}
            >
              <Award size={12} /> {BADGE_THRESHOLD} escursioni completate
            </div>
          </>
        ) : (
          <>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-stone-300">Badge Bloccato</p>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-stone-800 mb-1">{name}</h3>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-5">{filo}</p>
            {/* Progress bar verso sblocco */}
            <div className="w-full bg-stone-100 rounded-full h-1.5 mb-2 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${(count / BADGE_THRESHOLD) * 100}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>
              {count}/{BADGE_THRESHOLD} — ancora {remaining} {remaining === 1 ? "escursione" : "escursioni"}
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};

// ─── Empty State montagna ────────────────────────────────────────────────────
const MountainEmptyState = ({ onRiscatta }: { onRiscatta: () => void }) => (
  <div className="flex flex-col items-center gap-4 py-4">
    <svg width="80" height="56" viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 52L28 12L40 32L52 20L76 52H4Z" fill="#e7e5e4" stroke="#d6d3d1" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M52 20L60 30L68 20L76 52H40L52 20Z" fill="#d6d3d1" stroke="#c4c2c0" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="62" cy="12" r="4" fill="#fde68a" stroke="#f59e0b" strokeWidth="1.5" />
      <path d="M62 4V8M62 16V20M54 12H58M66 12H70" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
    <div className="text-center">
      <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-1">Il cammino ti aspetta</p>
      <p className="text-[9px] text-stone-300 font-bold uppercase">Riscatta la tua prima escursione</p>
    </div>
    <button
      onClick={onRiscatta}
      className="mt-1 px-5 py-2.5 bg-stone-800 text-white text-[9px] font-black uppercase tracking-widest rounded-full active:scale-95 transition-all hover:bg-stone-700"
    >
      Riscatta ora →
    </button>
  </div>
);

// ─── Toast ───────────────────────────────────────────────────────────────────
const Toast = ({ message, color, onDone }: { message: string; color: string; onDone: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10"
    >
      <IconaScarponeCustom size={20} color={color} isActive={true} />
      <span className="text-[11px] font-black uppercase tracking-wide whitespace-nowrap">{message}</span>
    </motion.div>
  );
};

// ─── Tipi ────────────────────────────────────────────────────────────────────
interface EscursioneCompletata {
  titolo: string;
  colore: string;
  data: string;
}
interface UserTessera {
  id: string;
  codice_tessera: string;
  pin?: string | null;
  nome_escursionista: string;
  cognome_escursionista: string;
  avatar_url: string | null;
  escursioni_completate: EscursioneCompletata[];
  punti: number;
  badges_filosofia?: string[];
}
interface ToastData {
  message: string;
  color: string;
}

type RedeemStep = "INPUT" | "REVEAL" | "SUCCESS";

// ─── Costanti ────────────────────────────────────────────────────────────────
const SLOTS_PER_PAGE = 8;

const TESSERA_LEVELS = [
  "Amante di attività all'aperto",
  "Elfo dei prati",
  "Collezionista di muschio",
  "Principe della mappa",
  "Guardiano delle nuvole",
  "Mago della bussola",
  "Spirito dei boschi",
  "Collezionista di scarponi",
  "Asceta dei monti",
  "Re dell'altimetro",
  "Saltatore di tronchi",
  "Amico delle querce",
  "Menestrello dei bastoncini",
  "Duca degli scalatori",
  "Custode del verde",
  "Specialista dei sentieri",
  "Gnomo delle pigne",
  "Spiritello degli stagni",
  "Appassionato naturalista",
  "Leggenda vivente",
];

// ─── Componente principale ───────────────────────────────────────────────────
// ─── PIN Input Component ─────────────────────────────────────────────────────
const PinInput = ({
  value,
  onChange,
  onComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: () => void;
}) => {
  const ref0 = useRef<HTMLInputElement>(null);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const refs = [ref0, ref1, ref2, ref3];

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (value[i]) {
        onChange(value.slice(0, i) + value.slice(i + 1));
      } else if (i > 0) {
        refs[i - 1].current?.focus();
        onChange(value.slice(0, i - 1) + value.slice(i));
      }
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
        <input
          key={i}
          ref={ref}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onFocus={(e) => e.target.select()}
          className="w-14 h-14 text-center text-xl font-black bg-stone-50 border-2 border-stone-100 rounded-2xl outline-none focus:border-brand-sky focus:bg-white transition-all shadow-inner"
        />
      ))}
    </div>
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
  const [loginStep, setLoginStep] = useState<"code" | "pin" | "set-pin">("code");
  const [loginPin, setLoginPin] = useState("");
  const [loginPinConfirm, setLoginPinConfirm] = useState("");
  const [pendingTessera, setPendingTessera] = useState<UserTessera | null>(null);
  const [showRedeem, setShowRedeem] = useState(false);
  const [redeemStep, setRedeemStep] = useState<RedeemStep>("INPUT");
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemError, setRedeemError] = useState("");
  const [redeemAttempts, setRedeemAttempts] = useState(0);
  const [pendingActivity, setPendingActivity] = useState<{ titolo: string; filosofia?: string | null } | null>(null);
  const [pendingColor, setPendingColor] = useState<string>(DEFAULT_BOOT_COLOR);
  const [chosenColor, setChosenColor] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [selectedBoot, setSelectedBoot] = useState<EscursioneCompletata | null>(null);
  const [iconSize, setIconSize] = useState(50);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<string | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<{ filo: string; isUnlocked: boolean; count: number } | null>(null);

  useEffect(() => {
    const update = () => setIconSize(window.innerWidth < 768 ? 50 : 70);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedBadge) { setSelectedBadge(null); return; }
        if (selectedBoot) { setSelectedBoot(null); return; }
        if (showRedeem) closeRedeem();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [showRedeem, selectedBoot, selectedBadge]);

  useEffect(() => {
    const savedCode = loadSession();
    if (savedCode) fetchUserFromSession(savedCode);
    else setLoading(false);
  }, []);

  async function compressImage(file: File): Promise<Blob> {
    const bitmap = await createImageBitmap(file);
    const maxSide = 400;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const targetW = Math.max(1, Math.round(bitmap.width * scale));
    const targetH = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
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
      const publicUrl = pub.publicUrl;
      const freshUrl = `${publicUrl}?t=${new Date().getTime()}`;
      const { error: dbErr } = await supabase.from("tessere").update({ avatar_url: publicUrl }).eq("id", userTessera.id);
      if (dbErr) { setToast({ message: `Errore salvataggio: ${dbErr.message}`, color: "#ef4444" }); throw dbErr; }
      setUserTessera((prev) => (prev ? { ...prev, avatar_url: freshUrl } : prev));
      setToast({ message: "Avatar aggiornato", color: "#10b981" });
    } catch (err) {
      console.error("Errore upload avatar:", err);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function fetchUserFromSession(codice: string) {
    setLoading(true);
    const { data, error } = await supabase.from("tessere").select("*").eq("codice_tessera", codice.toUpperCase().trim()).single();
    if (error || !data) { localStorage.removeItem(SESSION_KEY); setLoading(false); }
    else {
      setUserTessera(data as UserTessera);
      saveSession(data.codice_tessera);
      setCurrentPage(Math.floor((data.escursioni_completate?.length || 0) / SLOTS_PER_PAGE));
      setLoading(false);
    }
  }

  async function fetchUser(codice: string) {
    if (loading) return;
    setLoading(true);
    setLoginError("");
    const { data, error } = await supabase.from("tessere").select("*").eq("codice_tessera", codice.toUpperCase().trim()).single();
    if (error || !data) {
      setLoginError("Codice non trovato.");
      setLoginAttempts((n) => n + 1);
      setLoading(false);
    } else {
      const tessera = data as UserTessera;
      setPendingTessera(tessera);
      setLoginPin("");
      setLoginPinConfirm("");
      setLoginError("");
      setLoginStep(tessera.pin ? "pin" : "set-pin");
      setLoading(false);
    }
  }

  function completeLogin(tessera: UserTessera) {
    setUserTessera(tessera);
    saveSession(tessera.codice_tessera);
    setCurrentPage(Math.floor((tessera.escursioni_completate?.length || 0) / SLOTS_PER_PAGE));
  }

  async function handleVerifyPin() {
    if (!pendingTessera) return;
    if (loginPin.length !== 4) { setLoginError("Inserisci 4 cifre."); return; }
    if (loginPin !== pendingTessera.pin) {
      setLoginError("PIN errato.");
      setLoginAttempts((n) => n + 1);
      setLoginPin("");
      return;
    }
    completeLogin(pendingTessera);
  }

  async function handleSetPin() {
    if (!pendingTessera) return;
    if (loginPin.length !== 4) { setLoginError("Il PIN deve essere di 4 cifre."); return; }
    if (loginPin !== loginPinConfirm) { setLoginError("I PIN non corrispondono."); return; }
    setLoading(true);
    const { error } = await supabase.from("tessere").update({ pin: loginPin }).eq("id", pendingTessera.id);
    if (error) { setLoginError("Errore nel salvataggio. Riprova."); setLoading(false); return; }
    const updated = { ...pendingTessera, pin: loginPin };
    completeLogin(updated as UserTessera);
    setLoading(false);
  }

  function handleLogin() {
    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) { setLoginError("Troppi tentativi. Ricarica la pagina per riprovare."); return; }
    const normalized = loginCode.toUpperCase().trim();
    if (!TESSERA_CODE_REGEX.test(normalized)) { setLoginError("Formato non valido. Usa il formato ALTXXX."); return; }
    fetchUser(normalized);
  }

  const handleLogout = () => { localStorage.removeItem(SESSION_KEY); window.location.reload(); };

  const closeRedeem = useCallback(() => {
    if (isSaving) return;
    setShowRedeem(false);
    setRedeemCode("");
    setRedeemStep("INPUT");
    setRedeemError("");
    setSaveError("");
    setPendingActivity(null);
    setPendingColor(DEFAULT_BOOT_COLOR);
    setChosenColor(null);
    setNewlyUnlockedBadge(null);
  }, [isSaving]);

  const verifyCode = async () => {
    if (!redeemCode.trim()) return;
    if (redeemAttempts >= MAX_REDEEM_ATTEMPTS) { setRedeemError("Troppi tentativi. Riprova più tardi."); return; }
    const normalized = redeemCode.toUpperCase().trim();
    if (!REDEEM_CODE_REGEX.test(normalized)) { setRedeemError("Formato codice non valido."); return; }
    setIsVerifying(true);
    setRedeemError("");
    setRedeemAttempts((n) => n + 1);
    const { data, error } = await supabase.from("escursioni").select("titolo, codice_riscatto, filosofia").eq("codice_riscatto", normalized).single();
    if (error || !data) { setRedeemError("Codice non valido."); setIsVerifying(false); }
    else {
      const alreadyRedeemed = userTessera?.escursioni_completate?.some((e) => e.titolo === data.titolo);
      if (alreadyRedeemed) { setRedeemError("Hai già riscattato questa escursione."); setIsVerifying(false); return; }
      setPendingActivity(data);
      setPendingColor(getFilosofiaColor(data.filosofia));
      setRedeemStep("REVEAL");
      setIsVerifying(false);
    }
  };

  const saveVetta = async () => {
    if (!userTessera || !pendingActivity || isSaving) return;
    setIsSaving(true);
    setSaveError("");
    navigator.vibrate?.(50);

    const updatedList = [
      ...(userTessera.escursioni_completate || []),
      { titolo: pendingActivity.titolo, colore: pendingColor, data: new Date().toISOString() },
    ];

    // ── Rileva nuovo badge ──────────────────────────────────────────────────
    const oldBadges = computeEarnedBadges(userTessera.escursioni_completate || []);
    const newBadges = computeEarnedBadges(updatedList);
    const justUnlocked = newBadges.find((b) => !oldBadges.includes(b)) ?? null;

    const updatePayload: Record<string, unknown> = { escursioni_completate: updatedList };
    if (justUnlocked) {
      const existing = userTessera.badges_filosofia ?? [];
      updatePayload.badges_filosofia = [...existing, justUnlocked];
    }

    const { data, error } = await supabase.from("tessere").update(updatePayload).eq("id", userTessera.id).select();
    if (error || !data) { setSaveError("Errore nel salvataggio. Riprova."); setIsSaving(false); return; }

    const updatedTessera = data[0] as UserTessera;
    setUserTessera(updatedTessera);
    setCurrentPage(Math.floor(((updatedTessera.escursioni_completate?.length || 1) - 1) / SLOTS_PER_PAGE));
    setChosenColor(pendingColor);
    setNewlyUnlockedBadge(justUnlocked);
    setRedeemStep("SUCCESS");
    setIsSaving(false);
    fireConfetti(pendingColor);
    if (justUnlocked) setTimeout(() => fireBadgeConfetti(FILOSOFIA_COLORS[justUnlocked] ?? pendingColor), 600);
  };

  const handleSuccessClose = () => {
    if (chosenColor && pendingActivity) {
      const colorName = getFilosofiaName(chosenColor) || pendingActivity.filosofia || "";
      setToast({ message: `Scarpone ${colorName} aggiunto!`, color: chosenColor });
    }
    closeRedeem();
  };

  const stats = useMemo(() => {
    if (!userTessera) return null;
    const count = userTessera.escursioni_completate?.length || 0;
    const totalPages = Math.max(1, Math.ceil(count / SLOTS_PER_PAGE));
    const vouchersCount = Math.floor(count / 8);
    const progressInCycle = count % 8;
    const toNextVoucher = 8 - progressInCycle;
    const completedTessere = Math.floor(count / SLOTS_PER_PAGE);
    const currentLevelLabel = TESSERA_LEVELS[Math.min(completedTessere, TESSERA_LEVELS.length - 1)];
    return { count, currentLevelLabel, totalPages, vouchersCount, progressInCycle, toNextVoucher };
  }, [userTessera]);

  const badgeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of userTessera?.escursioni_completate ?? []) {
      const filo = getFilosofiaName(e.colore);
      if (filo) counts[filo] = (counts[filo] || 0) + 1;
    }
    return counts;
  }, [userTessera]);

  const earnedBadges = useMemo(
    () => computeEarnedBadges(userTessera?.escursioni_completate ?? []),
    [userTessera],
  );

  // ─── Loading / Login ─────────────────────────────────────────────────────
  if (loading && !userTessera)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f2ed]">
        <Loader2 className="animate-spin text-brand-stone" />
      </div>
    );

  if (!userTessera)
    return (
      <div className="min-h-screen bg-[#f5f2ed] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-brand-sky/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-stone-400/5 rounded-full blur-3xl" />
        <motion.div
          key={loginStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 md:p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-sm text-center relative border border-white/50 backdrop-blur-sm"
        >
          <div className="flex justify-center mb-8">
            <motion.img whileHover={{ scale: 1.05, rotate: 2 }} transition={{ type: "spring", stiffness: 400, damping: 10 }} src="/altour-logo.png" alt="Altour Italy" className="h-24 w-auto object-contain rounded-2xl p-1" />
          </div>

          {/* ── STEP 1: CODICE ── */}
          {loginStep === "code" && (
            <>
              <div className="space-y-2 mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-stone-800">Passaporto Altour</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Inserisci il tuo codice escursionista</p>
              </div>
              <div className="space-y-4">
                <input
                  className="w-full bg-stone-50 border-2 border-stone-100 p-5 rounded-2xl text-center font-black uppercase outline-none focus:border-brand-sky focus:bg-white transition-all text-lg tracking-widest placeholder:text-stone-300 shadow-inner"
                  placeholder="ALTXXX"
                  value={loginCode}
                  onChange={(e) => setLoginCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  disabled={loginAttempts >= MAX_LOGIN_ATTEMPTS || loading}
                />
                {loginError && <p className="text-red-500 text-[10px] font-black uppercase py-2 bg-red-50 rounded-lg px-3">{loginError}</p>}
                <button
                  onClick={handleLogin}
                  disabled={loginAttempts >= MAX_LOGIN_ATTEMPTS || loading}
                  className="w-full mt-2 bg-stone-800 text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Continua"}
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2: VERIFICA PIN ── */}
          {loginStep === "pin" && (
            <>
              <div className="space-y-2 mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-stone-800">Inserisci il PIN</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                  Codice <span className="text-brand-sky">{pendingTessera?.codice_tessera}</span>
                </p>
              </div>
              <div className="space-y-4">
                <PinInput value={loginPin} onChange={setLoginPin} onComplete={handleVerifyPin} />
                {loginError && <p className="text-red-500 text-[10px] font-black uppercase py-2 bg-red-50 rounded-lg px-3">{loginError}</p>}
                <button
                  onClick={handleVerifyPin}
                  disabled={loginPin.length < 4 || loading || loginAttempts >= MAX_LOGIN_ATTEMPTS}
                  className="w-full mt-2 bg-stone-800 text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Accedi al Passaporto"}
                </button>
                <button onClick={() => { setLoginStep("code"); setLoginError(""); setPendingTessera(null); }} className="text-[9px] font-black uppercase tracking-widest text-stone-300 hover:text-stone-500 transition-colors">
                  ← Cambia codice
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: IMPOSTA PIN (primo accesso) ── */}
          {loginStep === "set-pin" && (
            <>
              <div className="space-y-2 mb-2">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-stone-800">Crea il tuo PIN</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">È il tuo primo accesso — scegli un PIN di 4 cifre</p>
              </div>
              <div className="space-y-6 mt-6">
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">PIN</p>
                  <PinInput value={loginPin} onChange={(v) => { setLoginPin(v); setLoginError(""); }} />
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Conferma PIN</p>
                  <PinInput value={loginPinConfirm} onChange={(v) => { setLoginPinConfirm(v); setLoginError(""); }} onComplete={loginPin.length === 4 ? handleSetPin : undefined} />
                </div>
                {loginError && <p className="text-red-500 text-[10px] font-black uppercase py-2 bg-red-50 rounded-lg px-3">{loginError}</p>}
                <button
                  onClick={handleSetPin}
                  disabled={loginPin.length < 4 || loginPinConfirm.length < 4 || loading}
                  className="w-full bg-stone-800 text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Salva e Accedi"}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    );

  const { currentLevelLabel, totalPages, vouchersCount, progressInCycle, toNextVoucher } = stats!;

  return (
    <div className="min-h-screen bg-[#f5f2ed] pb-20 text-stone-800">
      {/* HERO */}
      <div className="relative h-[45vh] md:h-[50vh] w-full flex items-center justify-center text-center overflow-hidden">
        <img src="https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/Trentino_neve.webp" className="absolute inset-0 w-full h-full object-cover object-[center_60%]" alt="header bg" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#f5f2ed]" />
        <button onClick={handleLogout} className="absolute top-4 right-4 md:top-6 md:right-6 p-2 md:p-3 bg-black/20 backdrop-blur-md rounded-full text-white border border-white/10 z-50">
          <LogOut size={18} className="md:w-5 md:h-5" />
        </button>
        <div className="relative z-20 px-4 flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase drop-shadow-md">Passaporto Altour</h1>
          <p className="text-white/80 font-bold tracking-[0.3em] text-[10px] md:text-xs uppercase mt-1 mb-4">Cod. {userTessera.codice_tessera}</p>
          <div
            className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl backdrop-blur-md border border-white/20"
            style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)", boxShadow: "0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.1)" }}
          >
            <IconaScarponeCustom size={40} color="#5aaadd" isActive={true} />
            <div className="flex flex-col items-start">
              <span className="text-[7px] font-black uppercase tracking-[0.25em] text-white/50 leading-none mb-0.5">Livello</span>
              <span className="text-[11px] md:text-[13px] font-black uppercase tracking-wide text-white leading-none" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
                {currentLevelLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 md:px-6 -mt-8 relative z-30">
        {/* TESSERA */}
        <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] p-5 md:p-8 shadow-2xl border border-white/50">
          <div className="flex justify-between items-start mb-6">
            <div className="max-w-[70%] flex items-center gap-4">
              <div className="relative">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border border-stone-200 shadow-sm bg-stone-100 flex items-center justify-center"
                >
                  {userTessera.avatar_url ? (
                    <img src={userTessera.avatar_url} alt="Avatar escursionista" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-stone-400" />
                  )}
                  {avatarUploading && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </motion.div>
                <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-stone-200 shadow flex items-center justify-center hover:bg-stone-50 transition-colors" aria-label="Carica avatar">
                  <Camera className="w-4 h-4 text-stone-600" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
              </div>
              <div>
                <div className="flex items-center gap-1 mb-0.5 text-sky-500">
                  <ShieldCheck size={12} />
                  <span className="text-[8px] md:text-[9px] font-black uppercase">Escursionista Verificato</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black uppercase truncate leading-tight">
                  {[userTessera.nome_escursionista, userTessera.cognome_escursionista].filter(Boolean).join(" ")}
                </h2>
              </div>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-stone-50 rounded-xl flex items-center justify-center border border-stone-100">
              {userTessera.escursioni_completate?.length >= 8 * (currentPage + 1) ? (
                <Star size={24} className="text-amber-400 fill-amber-400" />
              ) : (
                <Star size={24} className="text-stone-200" />
              )}
            </div>
          </div>

          {/* Griglia swipeable */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60 && currentPage < totalPages - 1) setCurrentPage((p) => p + 1);
              if (info.offset.x > 60 && currentPage > 0) setCurrentPage((p) => p - 1);
            }}
            className="grid grid-cols-4 gap-2 md:gap-4 mb-6 cursor-grab active:cursor-grabbing select-none"
          >
            {Array.from({ length: SLOTS_PER_PAGE }).map((_, i) => {
              const idx = currentPage * SLOTS_PER_PAGE + i;
              const esc = userTessera.escursioni_completate?.[idx];
              return (
                <motion.div
                  key={i}
                  whileTap={esc ? { scale: 0.92 } : {}}
                  onClick={() => esc && setSelectedBoot(esc)}
                  className={`aspect-square rounded-xl md:rounded-2xl border-2 border-dashed border-stone-50 bg-stone-50/30 flex items-center justify-center transition-colors ${esc ? "cursor-pointer hover:bg-stone-100/60 hover:border-stone-200" : ""}`}
                >
                  <IconaScarponeCustom size={iconSize} color={esc?.colore || "#d6d3d1"} isActive={!!esc} />
                </motion.div>
              );
            })}
          </motion.div>

          <div className="flex justify-between items-center border-t border-stone-50 pt-4 md:pt-6">
            <button disabled={currentPage === 0} onClick={() => setCurrentPage((p) => p - 1)} className="p-2 disabled:opacity-20 hover:bg-stone-50 rounded-full transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="text-[9px] md:text-[10px] font-black uppercase text-stone-300 tracking-widest">
              Tessera {currentPage + 1}
              {totalPages > 1 && <span className="text-stone-200"> · {TESSERA_LEVELS[Math.min(currentPage, TESSERA_LEVELS.length - 1)]}</span>}
            </span>
            <button disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage((p) => p + 1)} className="p-2 disabled:opacity-20 hover:bg-stone-50 rounded-full transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="mt-4 md:mt-6 bg-white/70 rounded-[2rem] p-4 md:p-5 border border-white/50 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[8px] md:text-[9px] font-black uppercase text-stone-400 tracking-widest">Prossimo voucher</span>
            <span className="text-[8px] md:text-[9px] font-black uppercase text-stone-400 tracking-widest">
              {progressInCycle}/8 escursioni
              {toNextVoucher < 8 && <span className="text-sky-400 ml-1">· mancano {toNextVoucher}</span>}
            </span>
          </div>
          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-500"
              initial={{ width: 0 }}
              animate={{ width: `${(progressInCycle / 8) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* ─── BADGE FILOSOFIA ───────────────────────────────────────────────── */}
        <div className="mt-4 md:mt-6 bg-white rounded-[2rem] p-5 md:p-6 border border-white/50 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <Award size={14} className="text-stone-400" />
              <span className="text-[8px] md:text-[9px] font-black uppercase text-stone-400 tracking-widest">Badge Filosofia</span>
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-stone-50 text-stone-400">
              {earnedBadges.length}/{Object.keys(BADGE_NAMES).length}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2 md:gap-3">
            {Object.keys(BADGE_NAMES).map((filo) => (
              <BadgeChip
                key={filo}
                filo={filo}
                isUnlocked={earnedBadges.includes(filo)}
                count={badgeCounts[filo] ?? 0}
                onClick={() => setSelectedBadge({ filo, isUnlocked: earnedBadges.includes(filo), count: badgeCounts[filo] ?? 0 })}
              />
            ))}
          </div>
          {earnedBadges.length === 0 && (
            <p className="text-center text-[9px] font-bold text-stone-300 uppercase tracking-widest mt-5">
              Completa 3 escursioni della stessa categoria per sbloccare un badge
            </p>
          )}
        </div>

        {/* Pulsante Riscatta */}
        <button
          onClick={() => { setRedeemStep("INPUT"); setShowRedeem(true); }}
          className="w-full mt-4 md:mt-6 bg-[#5aaadd] text-white py-5 md:py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-sky-100 flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-[#0284c7]"
        >
          <Plus size={20} strokeWidth={3} />
          <span className="text-sm md:text-base">Riscatta Scarpone</span>
        </button>

        {/* VOUCHER */}
        {vouchersCount > 0 && (
          <div className="mt-4 md:mt-6 bg-amber-50/50 border-2 border-dashed border-amber-100 p-4 md:p-6 rounded-[2rem] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-full shadow-sm text-amber-500"><Gift size={20} /></div>
              <div>
                <p className="text-[8px] md:text-[10px] font-black uppercase text-amber-600">Premio Sbloccato</p>
                <h4 className="text-sm md:text-lg font-black uppercase">{vouchersCount} Voucher di 10 € disponibile</h4>
              </div>
            </div>
          </div>
        )}

        {/* CRONOLOGIA */}
        <div className="mt-8 space-y-3 mb-8">
          <h3 className="text-center text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Cronologia Recente</h3>
          <div className="bg-white/60 rounded-[2rem] p-4 md:p-6 border border-white/50 shadow-inner">
            {userTessera.escursioni_completate?.length > 0 ? (
              [...userTessera.escursioni_completate].reverse().slice(0, 4).map((esc, i) => (
                <div key={i} className="group relative flex items-center justify-between py-3 border-b last:border-0 border-stone-50/50">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <IconaScarponeCustom size={20} color={esc.colore} isActive={true} />
                    <div className="relative flex-1 min-w-0">
                      <span className="block text-[10px] md:text-xs font-black uppercase text-stone-700 truncate cursor-help">{esc.titolo}</span>
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block group-focus-within:block group-active:block z-[60] pointer-events-none">
                        <div className="bg-stone-900 text-white text-[9px] font-bold uppercase py-2 px-3 rounded-xl shadow-2xl whitespace-nowrap border border-white/10">
                          {esc.titolo}
                          <div className="absolute top-full left-4 border-[6px] border-transparent border-t-stone-900" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-[8px] font-bold text-stone-300 uppercase ml-3 flex-shrink-0">{new Date(esc.data).toLocaleDateString()}</span>
                </div>
              ))
            ) : (
              <MountainEmptyState onRiscatta={() => { setRedeemStep("INPUT"); setShowRedeem(true); }} />
            )}
          </div>
        </div>
      </div>

      {/* ─── MODALE RISCATTO ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showRedeem && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 backdrop-blur-md bg-black/40"
            onClick={(e) => { if (e.target === e.currentTarget) closeRedeem(); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-8 md:p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] w-full max-w-sm text-center relative border border-stone-100 overflow-hidden"
            >
              <button onClick={closeRedeem} disabled={isSaving} className="absolute top-6 right-6 p-2 bg-stone-50 rounded-full text-stone-300 hover:text-stone-800 transition-colors disabled:opacity-30 z-10">
                <X size={20} />
              </button>

              <AnimatePresence mode="wait">
                {/* STEP 1: INPUT */}
                {redeemStep === "INPUT" && (
                  <motion.div key="input" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <div className="mb-8">
                      <div className="inline-flex p-3 bg-brand-sky/10 rounded-2xl mb-4"><Plus className="text-brand-sky" size={24} /></div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter">Codice scarpone</h3>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Inserisci il codice ricevuto in cima</p>
                      {redeemAttempts > 0 && redeemAttempts < MAX_REDEEM_ATTEMPTS && (
                        <p className="text-[9px] font-bold text-stone-300 uppercase mt-1">Tentativi: {redeemAttempts}/{MAX_REDEEM_ATTEMPTS}</p>
                      )}
                    </div>
                    <input
                      className="w-full bg-stone-50 border-2 border-stone-100 p-5 rounded-2xl text-center text-2xl font-black uppercase outline-none focus:border-brand-sky transition-all shadow-inner"
                      placeholder="****"
                      value={redeemCode}
                      onChange={(e) => setRedeemCode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && verifyCode()}
                      disabled={redeemAttempts >= MAX_REDEEM_ATTEMPTS}
                    />
                    {redeemError && <p className="text-red-500 text-[10px] font-black mt-3 uppercase py-2 bg-red-50 rounded-lg">{redeemError}</p>}
                    <button
                      onClick={verifyCode}
                      disabled={isVerifying || redeemAttempts >= MAX_REDEEM_ATTEMPTS}
                      className="w-full mt-6 bg-stone-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isVerifying ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Verifica Codice"}
                    </button>
                  </motion.div>
                )}

                {/* STEP 2: REVEAL */}
                {redeemStep === "REVEAL" && pendingActivity && (
                  <motion.div key="reveal" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                      className="mb-4 p-6 rounded-3xl"
                      style={{ backgroundColor: `${pendingColor}18` }}
                    >
                      <IconaScarponeCustom size={80} color={pendingColor} isActive={true} />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="w-full">
                      {pendingActivity.filosofia && (
                        <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: pendingColor }}>{pendingActivity.filosofia}</p>
                      )}
                      <h3 className="text-xl font-black uppercase tracking-tighter text-stone-800 mb-1">{pendingActivity.titolo}</h3>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1 mb-8">Scarpone sbloccato — aggiungilo alla tessera</p>
                    </motion.div>
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      onClick={saveVetta}
                      disabled={isSaving}
                      className="w-full text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: pendingColor }}
                    >
                      {isSaving ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Aggiungi alla Tessera →"}
                    </motion.button>
                    {saveError && <p className="text-red-500 text-[10px] font-black uppercase py-2 bg-red-50 rounded-lg mt-3 w-full">{saveError}</p>}
                  </motion.div>
                )}

                {/* STEP 3: SUCCESS */}
                {redeemStep === "SUCCESS" && pendingActivity && chosenColor && (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.05 }} className="mb-2">
                      <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 280, damping: 14, delay: 0.15 }}
                      className="mb-4 p-6 rounded-3xl"
                      style={{ backgroundColor: `${chosenColor}18` }}
                    >
                      <IconaScarponeCustom size={80} color={chosenColor} isActive={true} />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                      <p className="text-[9px] font-black uppercase text-emerald-400 tracking-widest mb-1">Scarpone guadagnato!</p>
                      <h3 className="text-xl font-black uppercase tracking-tighter text-stone-800 mb-1">{pendingActivity.titolo}</h3>
                      {pendingActivity.filosofia && (
                        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: chosenColor }}>{pendingActivity.filosofia}</p>
                      )}
                    </motion.div>

                    {/* ── Badge sbloccato ── */}
                    {newlyUnlockedBadge && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.65, type: "spring", stiffness: 300, damping: 18 }}
                        className="mt-5 mb-1 w-full rounded-2xl p-4 flex items-center gap-4"
                        style={{ backgroundColor: `${FILOSOFIA_COLORS[newlyUnlockedBadge] ?? "#44403c"}15` }}
                      >
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{
                            backgroundColor: FILOSOFIA_COLORS[newlyUnlockedBadge] ?? "#44403c",
                            boxShadow: `0 4px 12px ${FILOSOFIA_COLORS[newlyUnlockedBadge] ?? "#44403c"}55`,
                          }}
                        >
                          {BADGE_EMOJI[newlyUnlockedBadge] ?? "★"}
                        </div>
                        <div className="text-left">
                          <p className="text-[8px] font-black uppercase tracking-widest mb-0.5" style={{ color: FILOSOFIA_COLORS[newlyUnlockedBadge] ?? "#44403c" }}>
                            Badge Sbloccato! 🎉
                          </p>
                          <p className="text-sm font-black uppercase text-stone-800 leading-tight">{BADGE_NAMES[newlyUnlockedBadge]}</p>
                        </div>
                      </motion.div>
                    )}

                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: newlyUnlockedBadge ? 0.95 : 0.55 }}
                      onClick={handleSuccessClose}
                      className="w-full mt-4 bg-stone-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                    >
                      Perfetto!
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── POPUP DETTAGLIO SCARPONE ──────────────────────────────────────── */}
      <AnimatePresence>
        {selectedBoot && (
          <div
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 md:p-6 backdrop-blur-sm bg-black/30"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedBoot(null); }}
          >
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-stone-100 relative"
            >
              <button onClick={() => setSelectedBoot(null)} className="absolute top-5 right-5 p-2 bg-stone-50 rounded-full text-stone-300 hover:text-stone-700 transition-colors">
                <X size={18} />
              </button>
              <div className="flex justify-center mb-5">
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.05 }}
                  className="p-5 rounded-3xl"
                  style={{ backgroundColor: `${selectedBoot.colore}18` }}
                >
                  <IconaScarponeCustom size={72} color={selectedBoot.colore} isActive={true} />
                </motion.div>
              </div>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-center">
                <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: selectedBoot.colore }}>
                  {getFilosofiaName(selectedBoot.colore) || "Personalizzato"}
                </p>
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-stone-800 leading-tight mb-4 px-2">{selectedBoot.titolo}</h3>
                <div className="inline-flex items-center gap-2 bg-stone-50 px-4 py-2 rounded-full">
                  <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Completata il</span>
                  <span className="text-[9px] font-black uppercase text-stone-600 tracking-widest">
                    {new Date(selectedBoot.data).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── POPUP DETTAGLIO BADGE ─────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedBadge && (
          <BadgeDetailPopup
            filo={selectedBadge.filo}
            isUnlocked={selectedBadge.isUnlocked}
            count={selectedBadge.count}
            onClose={() => setSelectedBadge(null)}
          />
        )}
      </AnimatePresence>

      {/* ─── TOAST ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} color={toast.color} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}