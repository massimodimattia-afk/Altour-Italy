// src/pages/Tessera.tsx
import { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";

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
  } else {
    return (
      <img
        src="/scarpone.png"
        alt="scarpone"
        className={`flex-shrink-0 ${className}`}
        style={{
          ...baseStyle,
          filter: "grayscale(100%) opacity(0.2)",
        }}
      />
    );
  }
};

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

const SLOTS_PER_PAGE = 8;
const EARTH_PALETTE = [
  { name: "Siena", hex: "#C0623D" },
  { name: "Bosco", hex: "#2E9B2E" },
  { name: "Abisso", hex: "#101090" },
  { name: "Roccia", hex: "#8090A0" },
  { name: "Ocra", hex: "#DD8833" },
  { name: "Sky", hex: "#0ea5e9" },
  { name: "Sunset", hex: "#f59e0b" },
  { name: "Viola", hex: "#8b5cf6" },
];

const LEVELS = [
  { min: 0, max: 16, label: "Camminatore della domenica", color: "#d6d3d1" },
  { min: 17, max: 50, label: "Esploratore", color: "#38bdf8" },
  { min: 51, max: 100, label: "Guida", color: "#f59e0b" },
  { min: 100, max: 999, label: "Leggenda", color: "#44403c" },
];

export default function Tessera() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userTessera, setUserTessera] = useState<UserTessera | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loginCode, setLoginCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showRedeem, setShowRedeem] = useState(false);
  const [redeemStep, setRedeemStep] = useState<"INPUT" | "COLOR">("INPUT");
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemError, setRedeemError] = useState("");
  const [pendingActivity, setPendingActivity] = useState<{
    titolo: string;
  } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("altour_session_v4");
    if (saved) fetchUser(saved);
    else setLoading(false);
  }, []);

  async function fetchUser(codice: string) {
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
      localStorage.setItem("altour_session_v4", data.codice_tessera);
      setCurrentPage(
        Math.floor((data.escursioni_completate?.length || 0) / SLOTS_PER_PAGE),
      );
      setLoading(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("altour_session_v4");
    window.location.reload();
  };

  const verifyCode = async () => {
    if (!redeemCode.trim()) return;
    setLoading(true);
    setRedeemError("");
    const { data, error } = await supabase
      .from("escursioni")
      .select("titolo")
      .eq("codice_riscatto", redeemCode.toUpperCase().trim())
      .single();
    if (error || !data) {
      setRedeemError("Codice non valido.");
      setLoading(false);
    } else {
      setPendingActivity(data);
      setRedeemStep("COLOR");
      setLoading(false);
    }
  };

  const saveVetta = async (selectedHex: string) => {
    if (!userTessera || !pendingActivity) return;
    setIsSaving(true);
    const updatedList = [
      ...(userTessera.escursioni_completate || []),
      {
        titolo: pendingActivity.titolo,
        colore: selectedHex,
        data: new Date().toISOString(),
      },
    ];
    const { data } = await supabase
      .from("tessere")
      .update({ escursioni_completate: updatedList })
      .eq("id", userTessera.id)
      .select();
    if (data) {
      setUserTessera(data[0]);
      setShowRedeem(false);
      setRedeemCode("");
      setRedeemStep("INPUT");
      confetti({ particleCount: 150, colors: [selectedHex, "#ffffff"] });
    }
    setIsSaving(false);
  };

  const stats = useMemo(() => {
    if (!userTessera) return null;
    const count = userTessera.escursioni_completate?.length || 0;
    const currentLevel =
      LEVELS.find((l) => count >= l.min && count <= l.max) || LEVELS[0];
    const totalPages = Math.max(1, Math.ceil((count + 1) / SLOTS_PER_PAGE));
    const vouchersCount = Math.floor(count / 8);
    return { count, currentLevel, totalPages, vouchersCount };
  }, [userTessera]);

  if (loading && !userTessera)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f2ed]">
        <Loader2 className="animate-spin" />
      </div>
    );

  if (!userTessera)
    return (
      <div className="min-h-screen bg-[#f5f2ed] flex items-center justify-center p-6">
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl w-full max-w-sm text-center">
          <IconaScarponeCustom
            size={64}
            isActive={false}
            className="mx-auto mb-6"
          />
          <h2 className="text-xl md:text-2xl font-black uppercase mb-6 md:mb-8">
            Accesso
          </h2>
          <input
            className="w-full bg-stone-50 border-2 p-4 md:p-5 rounded-2xl text-center font-black uppercase outline-none"
            placeholder="ALT-XXX"
            value={loginCode}
            onChange={(e) => setLoginCode(e.target.value)}
          />
          {loginError && (
            <p className="text-red-500 text-[10px] mt-2 font-black uppercase">
              {loginError}
            </p>
          )}
          <button
            onClick={() => fetchUser(loginCode)}
            className="w-full mt-6 bg-stone-800 text-white py-4 md:py-5 rounded-2xl font-black uppercase active:scale-95 transition-transform"
          >
            Entra
          </button>
        </div>
      </div>
    );

  const { count, currentLevel, totalPages, vouchersCount } = stats!;

  return (
    <div className="min-h-screen bg-[#f5f2ed] pb-20 text-stone-800">
      {/* HERO CON GRADIENTE COERENTE ALLA HOME */}
      <div className="relative h-[25vh] md:h-[30vh] w-full flex items-center justify-center text-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200"
          className="absolute inset-0 w-full h-full object-cover"
          alt="header bg"
        />
        {/* Overlay Gradiente: da scuro a colore sfondo pagina */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#f5f2ed]" />

        {/* Logout fisso in alto a destra, più piccolo su mobile */}
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2 md:p-3 bg-black/20 backdrop-blur-md rounded-full text-white border border-white/10 z-50"
        >
          <LogOut size={18} className="md:w-5 md:h-5" />
        </button>

        <div className="relative z-20 px-4">
          <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-md px-5 py-3 rounded-full border border-white/10 mb-2">
            <IconaScarponeCustom size={30} color="#ffffff" isActive={true} />
            <span className="text-[12px] font-black uppercase text-white tracking-tighter">
              {currentLevel.label}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase drop-shadow-md">
            Passaporto Altour
          </h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 md:px-6 -mt-8 relative z-30">
        {/* TESSERA OTTIMIZZATA MOBILE */}
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
              {count >= 8 * (currentPage + 1) ? (
                <Star size={24} className="text-amber-400 fill-amber-400" />
              ) : (
                <Star size={24} className="text-stone-200" />
              )}
            </div>
          </div>

          {/* Griglia scarponi: gap ridotto su mobile */}
          <div className="grid grid-cols-4 gap-2 md:gap-4 mb-6">
            {Array.from({ length: SLOTS_PER_PAGE }).map((_, i) => {
              const idx = currentPage * SLOTS_PER_PAGE + i;
              const esc = userTessera.escursioni_completate?.[idx];
              return (
                <div
                  key={i}
                  className="aspect-square rounded-xl md:rounded-2xl border-2 border-dashed border-stone-50 bg-stone-50/30 flex items-center justify-center"
                >
                  {esc ? (
                    <IconaScarponeCustom
                      size={window.innerWidth < 768 ? 45 : 65}
                      color={esc.colore}
                      isActive={true}
                    />
                  ) : (
                    <IconaScarponeCustom
                      size={window.innerWidth < 768 ? 45 : 65}
                      isActive={false}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center border-t border-stone-50 pt-4 md:pt-6">
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-2 disabled:opacity-20"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-[9px] md:text-[10px] font-black uppercase text-stone-300">
              Pagina {currentPage + 1} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2 disabled:opacity-20"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Pulsante riscatta: più compatto su mobile */}
        <button
          onClick={() => {
            setRedeemStep("INPUT");
            setShowRedeem(true);
          }}
          className="w-full mt-4 md:mt-6 bg-stone-900 text-white py-5 md:py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
        >
          <Plus size={20} strokeWidth={3} />{" "}
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
                  {vouchersCount} Voucher disponibili
                </h4>
              </div>
            </div>
          </div>
        )}

        {/* CRONOLOGIA COMPATTA */}
        <div className="mt-8 space-y-3 mb-8">
          <h3 className="text-center text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">
            Cronologia
          </h3>
          <div className="bg-white/60 rounded-[2rem] p-4 md:p-6 border border-white/50">
            {userTessera.escursioni_completate?.length > 0 ? (
              [...userTessera.escursioni_completate]
                .reverse()
                .slice(0, 3)
                .map((esc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-3 border-b last:border-0 border-stone-50"
                  >
                    <div className="flex items-center gap-3">
                      <IconaScarponeCustom
                        size={20}
                        color={esc.colore}
                        isActive={true}
                      />
                      <span className="text-[10px] md:text-xs font-black uppercase text-stone-700 truncate max-w-[120px]">
                        {esc.titolo}
                      </span>
                    </div>
                    <span className="text-[8px] font-bold text-stone-300 uppercase">
                      {new Date(esc.data).toLocaleDateString()}
                    </span>
                  </div>
                ))
            ) : (
              <p className="text-center text-[9px] text-stone-300 font-bold uppercase">
                Inizia il cammino!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* MODALE OTTIMIZZATO */}
      <AnimatePresence>
        {showRedeem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 backdrop-blur-md bg-black/40">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 md:p-10 rounded-[2.5rem] w-full max-w-sm text-center relative shadow-2xl"
            >
              <button
                onClick={() => setShowRedeem(false)}
                className="absolute top-5 right-5 text-stone-300"
              >
                <X size={24} />
              </button>

              {redeemStep === "INPUT" ? (
                <>
                  <h3 className="text-xl font-black uppercase mb-6">
                    Codice Vetta
                  </h3>
                  <input
                    className="w-full bg-stone-50 border-2 border-stone-100 p-4 rounded-xl text-center text-2xl font-black uppercase"
                    placeholder="****"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value)}
                  />
                  {redeemError && (
                    <p className="text-red-500 text-[9px] font-black mt-3 uppercase">
                      {redeemError}
                    </p>
                  )}
                  <button
                    onClick={verifyCode}
                    className="w-full mt-6 bg-stone-900 text-white py-4 rounded-xl font-black uppercase active:scale-95 transition-all"
                  >
                    Verifica
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-black uppercase mb-1">Colore</h3>
                  <p className="text-[9px] font-bold text-stone-400 uppercase mb-6 tracking-widest">
                    Scegli la tonalità
                  </p>
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    {EARTH_PALETTE.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => saveVetta(c.hex)}
                        className="aspect-square rounded-xl border-2 border-stone-50 shadow-sm active:scale-90 transition-transform bg-stone-50 flex items-center justify-center"
                      >
                        <IconaScarponeCustom
                          size={32}
                          color={c.hex}
                          isActive={true}
                        />
                      </button>
                    ))}
                  </div>
                  {isSaving && (
                    <Loader2 className="animate-spin mx-auto text-stone-900" />
                  )}
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
