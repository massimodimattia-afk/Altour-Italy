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
  Calendar,
  Gift,
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";

// --- NUOVO COMPONENTE ICONA (Approccio "Colora le Linee") ---
const IconaScarpone = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 15l2 0 3-6 4 2 3-1 2 2v4H4z" fill="currentColor" fillOpacity="0.2"/><path d="M9 9l1.5-3.5"/><path d="M12 11l1-3"/><path d="M15 10l.5-2"/><path d="M4 15c0 2 1.5 4 4 4h8c2 0 4-2 4-4"/>
  </svg>
);

const IconaScarponeCustom = ({
  size = 24,
  color = "#d6d3d1", // Colore di default (grigio chiaro)
  isActive = false, // Determina se è sbiadito o colorato
  className = "",
}: {
  size?: number;
  color?: string;
  isActive?: boolean;
  className?: string;
}) => {
  // Stile base comune a entrambi gli stati
  const baseStyle = {
    width: size,
    height: size,
    transition: "all 0.3s ease-in-out", // Transizione fluida
  };

  if (isActive) {
    // --- STATO ATTIVO: Colora le linee usando il componente SVG ---
    return (
      <div className={`flex-shrink-0 flex items-center justify-center ${className}`} style={baseStyle}>
        <IconaScarpone size={size} className="drop-shadow-md" style={{ color }} />
      </div>
    );
  } else {
    // --- STATO INATTIVO: Icona SVG sbiadita ---
    return (
      <div className={`flex-shrink-0 flex items-center justify-center ${className}`} style={baseStyle}>
        <IconaScarpone size={size} className="text-stone-400 opacity-10" />
      </div>
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
// Palette colori leggermente più vibrante per le linee
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
  { min: 17, max: 32, label: "Camminatore apprendista", color: "#38bdf8" },
  { min: 33, max: 50, label: "Trekker esperto", color: "#f59e0b" },
  { min: 51, max: 999, label: "Leggenda del CAI", color: "#44403c" },
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
      confetti({
        particleCount: 150,
        colors: [selectedHex, "#ffffff"],
        spread: 70,
        origin: { y: 0.6 },
      });
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
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-sm text-center">
          <IconaScarponeCustom
            size={64}
            isActive={false}
            className="mx-auto mb-6"
          />
          <h2 className="text-2xl font-black uppercase mb-8">Accesso</h2>
          <input
            className="w-full bg-stone-50 border-2 p-5 rounded-2xl text-center font-black uppercase"
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
            className="w-full mt-6 bg-stone-800 text-white py-5 rounded-2xl font-black uppercase"
          >
            Entra
          </button>
        </div>
      </div>
    );

  const { count, currentLevel, totalPages, vouchersCount } = stats!;

  return (
    <div className="min-h-screen bg-[#f5f2ed] pb-20 text-stone-800">
      {/* HEADER CON LOGOUT FISSO IN ALTO A DESTRA */}
      <div className="relative h-[30vh] w-full flex items-center justify-center text-center">
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200"
          className="absolute inset-0 w-full h-full object-cover object-center"
          alt="header bg"
        />
        {/* GRADIENTE IDENTICO ALLA HOME */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/5 via-[65%] to-[#f5f2ed] to-[98%]" />

        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2 md:p-3 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-all z-50 border border-white/10"
        >
          <LogOut size={18} className="md:w-5 md:h-5" />
        </button>

        <div className="relative z-20 mt-4 md:mt-0">
          <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 mb-3">
            {/* Icona nel badge: sempre attiva e bianca */}
            <IconaScarponeCustom size={24} color="#ffffff" isActive={true} />
            <span className="text-[10px] font-black uppercase text-white">
              {currentLevel.label}
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter drop-shadow-lg leading-tight">
            I TUOI SCARPONI <br /> ALTOUR
          </h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 md:px-6 -mt-10 relative z-30">
        {/* TESSERA */}
        <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] p-5 md:p-8 shadow-2xl border border-stone-50">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-1 mb-1 text-sky-500">
                <ShieldCheck size={14} />
                <span className="text-[9px] font-black uppercase">
                  Escursionista Ufficiale
                </span>
              </div>
              <h2 className="text-2xl font-black uppercase truncate max-w-[200px]">
                {userTessera.nome_escursionista}
              </h2>
            </div>
            <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center border border-stone-100">
              {count >= 8 * (currentPage + 1) ? (
                <Star
                  size={28}
                  className="text-amber-400 fill-amber-400 animate-pulse"
                />
              ) : (
                <Star size={28} className="text-stone-200" />
              )}
            </div>
          </div>

          {/* GRIGLIA SCARPONI */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {Array.from({ length: SLOTS_PER_PAGE }).map((_, i) => {
              const idx = currentPage * SLOTS_PER_PAGE + i;
              const esc = userTessera.escursioni_completate?.[idx];
              return (
                <div
                  key={i}
                  className="aspect-square rounded-2xl border-2 border-dashed border-stone-100 bg-stone-50/50 flex items-center justify-center relative"
                >
                  {esc ? (
                    // --- SCARPONE ATTIVO (Colorato) ---
                    // Usiamo motion.div per un leggero effetto "pop" all'apparizione
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                      className="animate-shine p-1 flex flex-col items-center justify-center"
                    >
                      <IconaScarponeCustom
                        size={56}
                        color={esc.colore}
                        isActive={true}
                      />
                    </motion.div>
                  ) : (
                    // --- SCARPONE INATTIVO (Sbiadito) ---
                    <div className="flex flex-col items-center justify-center">
                      <IconaScarponeCustom size={48} isActive={false} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center border-t border-stone-50 pt-6">
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-2 disabled:opacity-30 hover:bg-stone-50 rounded-full transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="text-[10px] font-black uppercase text-stone-400">
              Pagina {currentPage + 1} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2 disabled:opacity-30 hover:bg-stone-50 rounded-full transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* PULSANTE RISCATTA SOTTO LA TESSERA */}
        <button
          onClick={() => {
            setRedeemStep("INPUT");
            setShowRedeem(true);
          }}
          className="w-full mt-6 bg-stone-900 hover:bg-black text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95"
        >
          <Plus size={24} strokeWidth={3} /> Riscatta Scarpone
        </button>

        {/* VOUCHERS */}
        {vouchersCount > 0 && (
          <div className="mt-6 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-dashed border-amber-200 p-6 rounded-[2.5rem] flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-black uppercase text-amber-600 italic mb-1">
                Premio Sbloccato!
              </p>
              <h4 className="text-xl font-black uppercase text-stone-800">
                Hai {vouchersCount} Voucher
              </h4>
            </div>
            <div className="bg-white p-3 rounded-full shadow-md animate-bounce">
              <Gift className="text-amber-500" size={28} />
            </div>
          </div>
        )}

        {/* CRONOLOGIA */}
        <div className="mt-12 space-y-4 mb-8">
          <h3 className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">
            Ultime Vette
          </h3>
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-stone-50">
            {userTessera.escursioni_completate?.length > 0 ? (
              [...userTessera.escursioni_completate]
                .reverse()
                .slice(0, 3)
                .map((esc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-4 border-b last:border-0 border-stone-100"
                  >
                    <div className="flex items-center gap-4">
                      {/* Icona piccola colorata nella cronologia */}
                      <IconaScarponeCustom
                        size={40}
                        color={esc.colore}
                        isActive={true}
                      />
                      <div>
                        <h4 className="text-sm font-black uppercase text-stone-800">
                          {esc.titolo}
                        </h4>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-stone-400 uppercase mt-1">
                          <Calendar size={10} />{" "}
                          {new Date(esc.data).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-center text-xs text-stone-300 font-bold uppercase py-4">
                Ancora nessun passo...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* MODALE RISCATTO */}
      <AnimatePresence>
        {showRedeem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/40">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-10 rounded-[3rem] w-full max-w-sm text-center relative shadow-2xl"
            >
              <button
                onClick={() => setShowRedeem(false)}
                className="absolute top-6 right-6 text-stone-300 hover:text-stone-800 transition-colors"
              >
                <X size={24} />
              </button>

              {redeemStep === "INPUT" ? (
                <>
                  <h3 className="text-2xl font-black uppercase mb-8 text-stone-800">
                    Codice Vetta
                  </h3>
                  <input
                    className="w-full bg-stone-50 border-2 border-stone-100 p-5 rounded-2xl text-center text-3xl font-black uppercase outline-none focus:border-stone-900 transition-colors"
                    placeholder="****"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value)}
                  />
                  {redeemError && (
                    <p className="text-red-500 text-[10px] font-black mt-4 uppercase bg-red-50 py-2 rounded-lg">
                      {redeemError}
                    </p>
                  )}
                  <button
                    onClick={verifyCode}
                    disabled={loading || !redeemCode}
                    className="w-full mt-6 bg-stone-900 text-white py-5 rounded-2xl font-black uppercase hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Verifica"
                    )}
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-black uppercase mb-2 text-stone-800">
                    Scegli Colore
                  </h3>
                  <p className="text-xs font-bold text-stone-400 uppercase mb-8">
                    Colora le linee del tuo scarpone
                  </p>
                  <div className="grid grid-cols-4 gap-4 mb-8">
                    {EARTH_PALETTE.map((c) => (
                      // Anteprima nel modale: Icona attiva con il colore specifico
                      <button
                        key={c.hex}
                        onClick={() => saveVetta(c.hex)}
                        className="aspect-square rounded-2xl border-2 border-stone-100 shadow-sm hover:scale-110 transition-transform hover:shadow-md overflow-hidden flex items-center justify-center bg-stone-50"
                      >
                        <IconaScarponeCustom
                          size={40}
                          color={c.hex}
                          isActive={true}
                        />
                      </button>
                    ))}
                  </div>
                  {isSaving && (
                    <div className="flex justify-center">
                      <Loader2
                        className="animate-spin text-stone-900"
                        size={32}
                      />
                    </div>
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
