import { useEffect, useState, useMemo, useCallback } from "react";
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
  Lock,
  CheckCircle2,
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
  confetti({
    particleCount: 160,
    spread: 70,
    colors: [color, "#ffffff", "#f5f2ed"],
  });
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
  const baseStyle = {
    width: size,
    height: size,
    transition: "all 0.3s ease-in-out",
  };
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

// ─── Empty State montagna ────────────────────────────────────────────────────
const MountainEmptyState = ({ onRiscatta }: { onRiscatta: () => void }) => (
  <div className="flex flex-col items-center gap-4 py-4">
    <svg
      width="80"
      height="56"
      viewBox="0 0 80 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 52L28 12L40 32L52 20L76 52H4Z"
        fill="#e7e5e4"
        stroke="#d6d3d1"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M52 20L60 30L68 20L76 52H40L52 20Z"
        fill="#d6d3d1"
        stroke="#c4c2c0"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle
        cx="62"
        cy="12"
        r="4"
        fill="#fde68a"
        stroke="#f59e0b"
        strokeWidth="1.5"
      />
      <path
        d="M62 4V8M62 16V20M54 12H58M66 12H70"
        stroke="#f59e0b"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
    <div className="text-center">
      <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mb-1">
        Il cammino ti aspetta
      </p>
      <p className="text-[9px] text-stone-300 font-bold uppercase">
        Riscatta la tua prima escursione
      </p>
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
const Toast = ({
  message,
  color,
  onDone,
}: {
  message: string;
  color: string;
  onDone: () => void;
}) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
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
      <span className="text-[11px] font-black uppercase tracking-wide whitespace-nowrap">
        {message}
      </span>
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
  nome_escursionista: string;
  escursioni_completate: EscursioneCompletata[];
  punti: number;
}
interface ToastData {
  message: string;
  color: string;
}

type RedeemStep = "INPUT" | "REVEAL" | "COLOR" | "SUCCESS";

// ─── Costanti ────────────────────────────────────────────────────────────────
const SLOTS_PER_PAGE = 8;

// 16 colori con requisito per livello (minLevelIndex = indice in LEVELS)
const EXPANDED_PALETTE = [
  { name: "Siena", hex: "#C0623D", minLevelIndex: 0 },
  { name: "Bosco", hex: "#2E9B2E", minLevelIndex: 0 },
  { name: "Abisso", hex: "#101090", minLevelIndex: 0 },
  { name: "Roccia", hex: "#8090A0", minLevelIndex: 0 },
  { name: "Ocra", hex: "#DD8833", minLevelIndex: 0 },
  { name: "Sky", hex: "#0ea5e9", minLevelIndex: 0 },
  { name: "Sunset", hex: "#f59e0b", minLevelIndex: 0 },
  { name: "Viola", hex: "#8b5cf6", minLevelIndex: 0 },
  { name: "Nebbia", hex: "#94a3b8", minLevelIndex: 1 },
  { name: "Pino", hex: "#166534", minLevelIndex: 1 },
  { name: "Lavanda", hex: "#c4b5fd", minLevelIndex: 1 },
  { name: "Corallo", hex: "#fb7185", minLevelIndex: 1 },
  { name: "Bronzo", hex: "#92400e", minLevelIndex: 2 },
  { name: "Ghiaccio", hex: "#bae6fd", minLevelIndex: 2 },
  { name: "Grafite", hex: "#374151", minLevelIndex: 3 },
  { name: "Oro", hex: "#fbbf24", minLevelIndex: 3 },
];

const LEVELS = [
  { min: 0, max: 16, label: "Camminatore della domenica", color: "#d6d3d1" },
  { min: 17, max: 50, label: "Esploratore", color: "#38bdf8" },
  { min: 51, max: 100, label: "Guida", color: "#f59e0b" },
  { min: 100, max: 999, label: "Leggenda", color: "#44403c" },
];

// ─── Componente principale ───────────────────────────────────────────────────
export default function Tessera() {
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [userTessera, setUserTessera] = useState<UserTessera | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loginCode, setLoginCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showRedeem, setShowRedeem] = useState(false);
  const [redeemStep, setRedeemStep] = useState<RedeemStep>("INPUT");
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemError, setRedeemError] = useState("");
  const [redeemAttempts, setRedeemAttempts] = useState(0);
  const [pendingActivity, setPendingActivity] = useState<{
    titolo: string;
  } | null>(null);
  const [previewColor, setPreviewColor] = useState<string | null>(null);
  const [chosenColor, setChosenColor] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [selectedBoot, setSelectedBoot] = useState<EscursioneCompletata | null>(
    null,
  );
  const [iconSize, setIconSize] = useState(50);

  useEffect(() => {
    const update = () => setIconSize(window.innerWidth < 768 ? 50 : 70);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Escape chiude modali (prima selectedBoot, poi redeem)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedBoot) {
          setSelectedBoot(null);
          return;
        }
        if (showRedeem) closeRedeem();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [showRedeem, selectedBoot]);

  useEffect(() => {
    const savedCode = loadSession();
    if (savedCode) fetchUserFromSession(savedCode);
    else setLoading(false);
  }, []);

  async function fetchUserFromSession(codice: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from("tessere")
      .select("*")
      .eq("codice_tessera", codice.toUpperCase().trim())
      .single();
    if (error || !data) {
      localStorage.removeItem(SESSION_KEY);
      setLoading(false);
    } else {
      setUserTessera(data as UserTessera);
      saveSession(data.codice_tessera);
      setCurrentPage(
        Math.floor((data.escursioni_completate?.length || 0) / SLOTS_PER_PAGE),
      );
      setLoading(false);
    }
  }

  async function fetchUser(codice: string) {
    if (loading) return;
    setLoading(true);
    setLoginError("");
    const { data, error } = await supabase
      .from("tessere")
      .select("*")
      .eq("codice_tessera", codice.toUpperCase().trim())
      .single();
    if (error || !data) {
      setLoginError("Codice non trovato.");
      setLoading(false);
    } else {
      setUserTessera(data as UserTessera);
      saveSession(data.codice_tessera);
      setCurrentPage(
        Math.floor((data.escursioni_completate?.length || 0) / SLOTS_PER_PAGE),
      );
      setLoading(false);
    }
  }

  function handleLogin() {
    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      setLoginError("Troppi tentativi. Ricarica la pagina per riprovare.");
      return;
    }
    const normalized = loginCode.toUpperCase().trim();
    if (!TESSERA_CODE_REGEX.test(normalized)) {
      setLoginError("Formato non valido. Usa il formato ALTXXX.");
      return;
    }
    setLoginAttempts((n) => n + 1);
    fetchUser(loginCode);
  }

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    window.location.reload();
  };

  const closeRedeem = useCallback(() => {
    if (isSaving) return;
    setShowRedeem(false);
    setRedeemCode("");
    setRedeemStep("INPUT");
    setRedeemError("");
    setSaveError("");
    setPendingActivity(null);
    setPreviewColor(null);
    setChosenColor(null);
  }, [isSaving]);

  const verifyCode = async () => {
    if (!redeemCode.trim()) return;
    if (redeemAttempts >= MAX_REDEEM_ATTEMPTS) {
      setRedeemError("Troppi tentativi. Riprova più tardi.");
      return;
    }
    const normalized = redeemCode.toUpperCase().trim();
    if (!REDEEM_CODE_REGEX.test(normalized)) {
      setRedeemError("Formato codice non valido.");
      return;
    }
    setIsVerifying(true);
    setRedeemError("");
    setRedeemAttempts((n) => n + 1);
    const { data, error } = await supabase
      .from("escursioni")
      .select("titolo, codice_riscatto")
      .eq("codice_riscatto", normalized)
      .single();
    if (error || !data) {
      setRedeemError("Codice non valido.");
      setIsVerifying(false);
    } else {
      const alreadyRedeemed = userTessera?.escursioni_completate?.some(
        (e) => e.titolo === data.titolo,
      );
      if (alreadyRedeemed) {
        setRedeemError("Hai già riscattato questa escursione.");
        setIsVerifying(false);
        return;
      }
      setPendingActivity(data);
      setRedeemStep("REVEAL");
      setIsVerifying(false);
    }
  };

  const saveVetta = async (selectedHex: string) => {
    if (!userTessera || !pendingActivity || isSaving) return;
    setIsSaving(true);
    setSaveError("");
    navigator.vibrate?.(50);

    const updatedList = [
      ...(userTessera.escursioni_completate || []),
      {
        titolo: pendingActivity.titolo,
        colore: selectedHex,
        data: new Date().toISOString(),
      },
    ];
    const { data, error } = await supabase
      .from("tessere")
      .update({ escursioni_completate: updatedList })
      .eq("id", userTessera.id)
      .select();

    if (error || !data) {
      setSaveError("Errore nel salvataggio. Riprova.");
      setIsSaving(false);
      return;
    }

    const updatedTessera = data[0] as UserTessera;
    setUserTessera(updatedTessera);
    const newCount = updatedTessera.escursioni_completate?.length || 0;
    setCurrentPage(Math.floor((newCount - 1) / SLOTS_PER_PAGE));
    setChosenColor(selectedHex);
    setRedeemStep("SUCCESS");
    setIsSaving(false);
    fireConfetti(selectedHex);
  };

  const handleSuccessClose = () => {
    if (chosenColor && pendingActivity) {
      const colorName =
        EXPANDED_PALETTE.find((c) => c.hex === chosenColor)?.name ?? "";
      setToast({
        message: `🥾 ${colorName} aggiunto alla tessera!`,
        color: chosenColor,
      });
    }
    closeRedeem();
  };

  const stats = useMemo(() => {
    if (!userTessera) return null;
    const count = userTessera.escursioni_completate?.length || 0;
    const rawIndex = LEVELS.findIndex((l) => count >= l.min && count <= l.max);
    const currentLevelIndex = rawIndex === -1 ? 0 : rawIndex;
    const currentLevel = LEVELS[currentLevelIndex];
    const totalPages = Math.max(1, Math.ceil(count / SLOTS_PER_PAGE));
    const vouchersCount = Math.floor(count / 8);
    const progressInCycle = count % 8;
    const toNextVoucher = 8 - progressInCycle;
    return {
      count,
      currentLevel,
      currentLevelIndex,
      totalPages,
      vouchersCount,
      progressInCycle,
      toNextVoucher,
    };
  }, [userTessera]);

  // ─── Loading / Login ────────────────────────────────────────────────────────
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 md:p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full max-w-sm text-center relative border border-white/50 backdrop-blur-sm"
        >
          <div className="flex justify-center mb-8">
            <motion.img
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              src="/altour-logo.png"
              alt="Altour Italy"
              className="h-24 w-auto object-contain rounded-2xl p-1"
            />
          </div>
          <div className="space-y-2 mb-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-stone-800">
              Passaporto Altour
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
              Inserisci il tuo codice escursionista
            </p>
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
            {loginError && (
              <p className="text-red-500 text-[10px] font-black uppercase py-2 bg-red-50 rounded-lg">
                {loginError}
              </p>
            )}
            <button
              onClick={handleLogin}
              disabled={loginAttempts >= MAX_LOGIN_ATTEMPTS || loading}
              className="w-full mt-2 bg-stone-800 text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin mx-auto" size={20} />
              ) : (
                "Accedi al Passaporto"
              )}
            </button>
          </div>
        </motion.div>
      </div>
    );

  const {
    currentLevel,
    currentLevelIndex,
    totalPages,
    vouchersCount,
    progressInCycle,
    toNextVoucher,
  } = stats!;

  // ─── Main ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f2ed] pb-20 text-stone-800">
      {/* HERO */}
      <div className="relative h-[28vh] md:h-[32vh] w-full flex items-center justify-center text-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200"
          className="absolute inset-0 w-full h-full object-cover object-center"
          alt="header bg"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#f5f2ed]" />
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2 md:p-3 bg-black/20 backdrop-blur-md rounded-full text-white border border-white/10 z-50"
        >
          <LogOut size={18} className="md:w-5 md:h-5" />
        </button>
        <div className="relative z-20 px-4 flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase drop-shadow-md">
            Passaporto Altour
          </h1>
          <p className="text-white/80 font-bold tracking-[0.3em] text-[10px] md:text-xs uppercase mt-1 mb-4">
            Cod. {userTessera.codice_tessera}
          </p>
          <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <IconaScarponeCustom
              size={18}
              color={currentLevel.color}
              isActive={true}
            />
            <span className="text-[10px] font-black uppercase text-white tracking-tight">
              {currentLevel.label}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 md:px-6 -mt-8 relative z-30">
        {/* TESSERA con swipe */}
        <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] p-5 md:p-8 shadow-2xl border border-white/50">
          <div className="flex justify-between items-start mb-6">
            <div className="max-w-[70%]">
              <div className="flex items-center gap-1 mb-0.5 text-sky-500">
                <ShieldCheck size={12} />
                <span className="text-[8px] md:text-[9px] font-black uppercase">
                  Escursionista Verificato
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black uppercase truncate leading-tight">
                {userTessera.nome_escursionista}
              </h2>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-stone-50 rounded-xl flex items-center justify-center border border-stone-100">
              {userTessera.escursioni_completate?.length >=
              8 * (currentPage + 1) ? (
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
              if (info.offset.x < -60 && currentPage < totalPages - 1)
                setCurrentPage((p) => p + 1);
              if (info.offset.x > 60 && currentPage > 0)
                setCurrentPage((p) => p - 1);
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
                  className={`aspect-square rounded-xl md:rounded-2xl border-2 border-dashed border-stone-50 bg-stone-50/30 flex items-center justify-center transition-colors ${
                    esc
                      ? "cursor-pointer hover:bg-stone-100/60 hover:border-stone-200"
                      : ""
                  }`}
                >
                  <IconaScarponeCustom
                    size={iconSize}
                    color={esc?.colore || "#d6d3d1"}
                    isActive={!!esc}
                  />
                </motion.div>
              );
            })}
          </motion.div>

          <div className="flex justify-between items-center border-t border-stone-50 pt-4 md:pt-6">
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-2 disabled:opacity-20 hover:bg-stone-50 rounded-full transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-[9px] md:text-[10px] font-black uppercase text-stone-300 tracking-widest">
              Pagina {currentPage + 1} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2 disabled:opacity-20 hover:bg-stone-50 rounded-full transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* PROGRESS BAR verso prossimo voucher */}
        <div className="mt-4 md:mt-6 bg-white/70 rounded-[2rem] p-4 md:p-5 border border-white/50 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[8px] md:text-[9px] font-black uppercase text-stone-400 tracking-widest">
              Prossimo voucher
            </span>
            <span className="text-[8px] md:text-[9px] font-black uppercase text-stone-400 tracking-widest">
              {progressInCycle}/8 escursioni
              {toNextVoucher < 8 && (
                <span className="text-sky-400 ml-1">
                  · mancano {toNextVoucher}
                </span>
              )}
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

        {/* Pulsante Riscatta */}
        <button
          onClick={() => {
            setRedeemStep("INPUT");
            setShowRedeem(true);
          }}
          className="w-full mt-4 md:mt-6 bg-[#0ea5e9] text-white py-5 md:py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-sky-100 flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-[#0284c7]"
        >
          <Plus size={20} strokeWidth={3} />
          <span className="text-sm md:text-base">Riscatta Scarpone</span>
        </button>

        {/* VOUCHER */}
        {vouchersCount > 0 && (
          <div className="mt-4 md:mt-6 bg-amber-50/50 border-2 border-dashed border-amber-100 p-4 md:p-6 rounded-[2rem] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-full shadow-sm text-amber-500">
                <Gift size={20} />
              </div>
              <div>
                <p className="text-[8px] md:text-[10px] font-black uppercase text-amber-600">
                  Premio Sbloccato
                </p>
                <h4 className="text-sm md:text-lg font-black uppercase">
                  {vouchersCount} Voucher di 10 € disponibile
                </h4>
              </div>
            </div>
          </div>
        )}

        {/* CRONOLOGIA */}
        <div className="mt-8 space-y-3 mb-8">
          <h3 className="text-center text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">
            Cronologia Recente
          </h3>
          <div className="bg-white/60 rounded-[2rem] p-4 md:p-6 border border-white/50 shadow-inner">
            {userTessera.escursioni_completate?.length > 0 ? (
              [...userTessera.escursioni_completate]
                .reverse()
                .slice(0, 4)
                .map((esc, i) => (
                  <div
                    key={i}
                    className="group relative flex items-center justify-between py-3 border-b last:border-0 border-stone-50/50"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <IconaScarponeCustom
                        size={20}
                        color={esc.colore}
                        isActive={true}
                      />
                      <div className="relative flex-1 min-w-0">
                        <span className="block text-[10px] md:text-xs font-black uppercase text-stone-700 truncate cursor-help">
                          {esc.titolo}
                        </span>
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block group-focus-within:block group-active:block z-[60] pointer-events-none">
                          <div className="bg-stone-900 text-white text-[9px] font-bold uppercase py-2 px-3 rounded-xl shadow-2xl whitespace-nowrap border border-white/10">
                            {esc.titolo}
                            <div className="absolute top-full left-4 border-[6px] border-transparent border-t-stone-900" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="text-[8px] font-bold text-stone-300 uppercase ml-3 flex-shrink-0">
                      {new Date(esc.data).toLocaleDateString()}
                    </span>
                  </div>
                ))
            ) : (
              <MountainEmptyState
                onRiscatta={() => {
                  setRedeemStep("INPUT");
                  setShowRedeem(true);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* ─── MODALE RISCATTO ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showRedeem && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 backdrop-blur-md bg-black/40"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeRedeem();
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-8 md:p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] w-full max-w-sm text-center relative border border-stone-100 overflow-hidden"
            >
              <button
                onClick={closeRedeem}
                disabled={isSaving}
                className="absolute top-6 right-6 p-2 bg-stone-50 rounded-full text-stone-300 hover:text-stone-800 transition-colors disabled:opacity-30 z-10"
              >
                <X size={20} />
              </button>

              <AnimatePresence mode="wait">
                {/* ── STEP 1: INPUT ─────────────────────────────────────────── */}
                {redeemStep === "INPUT" && (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <div className="mb-8">
                      <div className="inline-flex p-3 bg-brand-sky/10 rounded-2xl mb-4">
                        <Plus className="text-brand-sky" size={24} />
                      </div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter">
                        Codice scarpone
                      </h3>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">
                        Inserisci il codice ricevuto in cima
                      </p>
                      {redeemAttempts > 0 &&
                        redeemAttempts < MAX_REDEEM_ATTEMPTS && (
                          <p className="text-[9px] font-bold text-stone-300 uppercase mt-1">
                            Tentativi: {redeemAttempts}/{MAX_REDEEM_ATTEMPTS}
                          </p>
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
                    {redeemError && (
                      <p className="text-red-500 text-[10px] font-black mt-3 uppercase py-2 bg-red-50 rounded-lg">
                        {redeemError}
                      </p>
                    )}
                    <button
                      onClick={verifyCode}
                      disabled={
                        isVerifying || redeemAttempts >= MAX_REDEEM_ATTEMPTS
                      }
                      className="w-full mt-6 bg-stone-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-stone-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isVerifying ? (
                        <Loader2 className="animate-spin mx-auto" size={20} />
                      ) : (
                        "Verifica Codice"
                      )}
                    </button>
                  </motion.div>
                )}

                {/* ── STEP 2: REVEAL ────────────────────────────────────────── */}
                {redeemStep === "REVEAL" && pendingActivity && (
                  <motion.div
                    key="reveal"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col items-center"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 15,
                        delay: 0.1,
                      }}
                      className="mb-6 p-6 bg-stone-50 rounded-3xl"
                    >
                      <IconaScarponeCustom
                        size={72}
                        color="#0ea5e9"
                        isActive={true}
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <p className="text-[9px] font-black uppercase text-sky-400 tracking-widest mb-2">
                        Escursione sbloccata!
                      </p>
                      <h3 className="text-xl font-black uppercase tracking-tighter text-stone-800 mb-1">
                        {pendingActivity.titolo}
                      </h3>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1 mb-8">
                        Scegli il colore del tuo scarpone
                      </p>
                    </motion.div>
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      onClick={() => setRedeemStep("COLOR")}
                      className="w-full bg-[#0ea5e9] text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-sky-100 hover:bg-[#0284c7]"
                    >
                      Scegli il colore →
                    </motion.button>
                  </motion.div>
                )}

                {/* ── STEP 3: COLOR ─────────────────────────────────────────── */}
                {redeemStep === "COLOR" && (
                  <motion.div
                    key="color"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    {/* Preview scarpone live */}
                    <div className="flex justify-center mb-4">
                      <motion.div
                        animate={{ scale: previewColor ? 1.08 : 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 20,
                        }}
                        className="p-4 bg-stone-50 rounded-3xl"
                      >
                        <IconaScarponeCustom
                          size={64}
                          color={previewColor ?? EXPANDED_PALETTE[0].hex}
                          isActive={true}
                        />
                      </motion.div>
                    </div>
                    <div className="mb-5">
                      <h3 className="text-2xl font-black uppercase tracking-tighter">
                        Colora la Vetta
                      </h3>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1 h-4">
                        {previewColor
                          ? (EXPANDED_PALETTE.find(
                              (c) => c.hex === previewColor,
                            )?.name ?? "")
                          : "Passa su un colore per la preview"}
                      </p>
                    </div>

                    {/* Griglia 4×4 con lucchetti */}
                    <div className="grid grid-cols-4 gap-2.5 mb-5">
                      {EXPANDED_PALETTE.map((c) => {
                        const locked = c.minLevelIndex > currentLevelIndex;
                        return (
                          <div key={c.hex} className="relative group/color">
                            <button
                              onClick={() => !locked && saveVetta(c.hex)}
                              onMouseEnter={() =>
                                !locked && setPreviewColor(c.hex)
                              }
                              onMouseLeave={() => setPreviewColor(null)}
                              disabled={isSaving || locked}
                              className={`
                                aspect-square w-full rounded-2xl border-2 transition-all
                                flex items-center justify-center p-1.5 shadow-sm
                                ${
                                  locked
                                    ? "border-stone-100 bg-stone-50/50 cursor-not-allowed opacity-50"
                                    : "border-transparent hover:border-brand-sky active:scale-90 bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                                }
                              `}
                            >
                              {locked ? (
                                <Lock size={16} className="text-stone-300" />
                              ) : (
                                <IconaScarponeCustom
                                  size={34}
                                  color={c.hex}
                                  isActive={true}
                                />
                              )}
                            </button>
                            {locked && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/color:block z-[60] pointer-events-none">
                                <div className="bg-stone-900 text-white text-[8px] font-bold uppercase py-1.5 px-2.5 rounded-xl shadow-2xl whitespace-nowrap border border-white/10">
                                  {LEVELS[c.minLevelIndex]?.label}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-stone-900" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Legenda livelli */}
                    <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                      {LEVELS.map((l, idx) => (
                        <div
                          key={l.label}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-[7px] font-black uppercase border ${
                            idx <= currentLevelIndex
                              ? "border-stone-200 bg-stone-50 text-stone-600"
                              : "border-stone-100 bg-stone-50/30 text-stone-300"
                          }`}
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor:
                                idx <= currentLevelIndex ? l.color : "#d6d3d1",
                            }}
                          />
                          {l.label}
                        </div>
                      ))}
                    </div>

                    {isSaving && (
                      <div className="flex justify-center mt-2">
                        <Loader2 className="animate-spin text-brand-sky w-8 h-8" />
                      </div>
                    )}
                    {saveError && (
                      <p className="text-red-500 text-[10px] font-black uppercase py-2 bg-red-50 rounded-lg mt-2">
                        {saveError}
                      </p>
                    )}
                  </motion.div>
                )}

                {/* ── STEP 4: SUCCESS ───────────────────────────────────────── */}
                {redeemStep === "SUCCESS" && pendingActivity && chosenColor && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 12,
                        delay: 0.05,
                      }}
                      className="mb-2"
                    >
                      <CheckCircle2
                        size={36}
                        className="text-emerald-400 mx-auto"
                      />
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 280,
                        damping: 14,
                        delay: 0.15,
                      }}
                      className="mb-6 p-6 bg-stone-50 rounded-3xl"
                    >
                      <IconaScarponeCustom
                        size={80}
                        color={chosenColor}
                        isActive={true}
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                    >
                      <p className="text-[9px] font-black uppercase text-emerald-400 tracking-widest mb-1">
                        Scarpone guadagnato!
                      </p>
                      <h3 className="text-xl font-black uppercase tracking-tighter text-stone-800 mb-1">
                        {pendingActivity.titolo}
                      </h3>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-8">
                        Colore:{" "}
                        {
                          EXPANDED_PALETTE.find((c) => c.hex === chosenColor)
                            ?.name
                        }
                      </p>
                    </motion.div>
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.55 }}
                      onClick={handleSuccessClose}
                      className="w-full bg-stone-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg"
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

      {/* ─── POPUP DETTAGLIO SCARPONE ────────────────────────────────────── */}
      <AnimatePresence>
        {selectedBoot && (
          <div
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 md:p-6 backdrop-blur-sm bg-black/30"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedBoot(null);
            }}
          >
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-stone-100 relative"
            >
              {/* Chiudi */}
              <button
                onClick={() => setSelectedBoot(null)}
                className="absolute top-5 right-5 p-2 bg-stone-50 rounded-full text-stone-300 hover:text-stone-700 transition-colors"
              >
                <X size={18} />
              </button>

              {/* Scarpone grande */}
              <div className="flex justify-center mb-5">
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 16,
                    delay: 0.05,
                  }}
                  className="p-5 rounded-3xl"
                  style={{ backgroundColor: `${selectedBoot.colore}15` }}
                >
                  <IconaScarponeCustom
                    size={72}
                    color={selectedBoot.colore}
                    isActive={true}
                  />
                </motion.div>
              </div>

              {/* Info */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-center"
              >
                {/* Nome colore */}
                <p
                  className="text-[9px] font-black uppercase tracking-widest mb-1"
                  style={{ color: selectedBoot.colore }}
                >
                  {EXPANDED_PALETTE.find((c) => c.hex === selectedBoot.colore)
                    ?.name ?? "Personalizzato"}
                </p>

                {/* Titolo escursione */}
                <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-stone-800 leading-tight mb-4 px-2">
                  {selectedBoot.titolo}
                </h3>

                {/* Data */}
                <div className="inline-flex items-center gap-2 bg-stone-50 px-4 py-2 rounded-full">
                  <span className="text-[9px] font-black uppercase text-stone-400 tracking-widest">
                    Completata il
                  </span>
                  <span className="text-[9px] font-black uppercase text-stone-600 tracking-widest">
                    {new Date(selectedBoot.data).toLocaleDateString("it-IT", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── TOAST ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            color={toast.color}
            onDone={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
