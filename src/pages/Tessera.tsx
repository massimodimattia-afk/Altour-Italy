// src/pages/Tessera.tsx
import { useEffect, useState, useMemo } from "react";
import {
  X,
  Loader2,
  ShieldCheck,
  Zap,
  LogOut,
  Plus,
  Star,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Gift,
  Footprints,
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";

// --- INTERFACCE TYPESCRIPT ---
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

interface AttivitaDaRiscattare {
  titolo: string;
}

// --- COSTANTI ---
const STORAGE_KEY = "altour_session_v4";
const SLOTS_PER_PAGE = 8;
const IconaScarpone = Footprints;

const EARTH_PALETTE = [
  { name: "Terra di Siena", hex: "#A0522D" },
  { name: "Verde Bosco", hex: "#228B22" },
  { name: "Blu Abisso", hex: "#000080" },
  { name: "Grigio Roccia", hex: "#708090" },
  { name: "Ocra", hex: "#CC7722" },
  { name: "Argilla", hex: "#B66A50" },
  { name: "Muschio", hex: "#4A5D23" },
  { name: "Fango", hex: "#706552" },
  { name: "Ardesia", hex: "#2F4F4F" },
  { name: "Sabbia", hex: "#C2B280" },
];

const LEVELS = [
  {
    min: 0,
    max: 8,
    label: "Camminatore della Domenica",
    icon: IconaScarpone,
    color: "text-stone-300",
  },
  {
    min: 9,
    max: 16,
    label: "Esploratore dei Sentieri",
    icon: IconaScarpone,
    color: "text-sky-400",
  },
  {
    min: 17,
    max: 24,
    label: "Guida Alpina",
    icon: IconaScarpone,
    color: "text-amber-500",
  },
  {
    min: 25,
    max: 999,
    label: "Leggenda delle Vette",
    icon: IconaScarpone,
    color: "text-brand-stone",
  },
];

export default function Tessera() {
  // Stati di caricamento
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Dati utente
  const [userTessera, setUserTessera] = useState<UserTessera | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Stati per i form e modali
  const [loginCode, setLoginCode] = useState("");
  const [loginError, setLoginError] = useState("");

  const [showRedeem, setShowRedeem] = useState(false);
  const [redeemStep, setRedeemStep] = useState<"INPUT" | "COLOR">("INPUT");
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemError, setRedeemError] = useState("");
  const [pendingActivity, setPendingActivity] =
    useState<AttivitaDaRiscattare | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      fetchUser(saved);
    } else {
      setLoading(false);
    }
  }, []);

  // --- LOGICA DI ACCESSO ---
  async function fetchUser(codice: string) {
    if (!codice.trim()) return;
    setLoading(true);
    setLoginError("");

    try {
      const { data, error } = await supabase
        .from("tessere")
        .select("*")
        .eq("codice_tessera", codice.toUpperCase().trim())
        .single();

      if (error || !data) {
        setLoginError("Codice tessera non trovato. Verifica e riprova.");
      } else {
        setUserTessera(data as UserTessera);
        localStorage.setItem(STORAGE_KEY, data.codice_tessera);

        // Calcola la pagina iniziale basata sulle escursioni esistenti
        const count = data.escursioni_completate?.length || 0;
        setCurrentPage(Math.floor(count / SLOTS_PER_PAGE));
      }
    } catch (e) {
      setLoginError("Errore di connessione. Riprova più tardi.");
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    setUserTessera(null);
    setLoginCode("");
    localStorage.removeItem(STORAGE_KEY);
    await supabase.auth.signOut();
  };

  // --- STATI DERIVATI E OTTIMIZZATI CON USEMEMO ---
  const stats = useMemo(() => {
    if (!userTessera) return null;

    const vetteCount = userTessera.escursioni_completate?.length || 0;
    const currentLevel =
      LEVELS.find((l) => vetteCount >= l.min && vetteCount <= l.max) ||
      LEVELS[0];
    const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1] || null;
    const progressToNext = nextLevel
      ? ((vetteCount - currentLevel.min) / (nextLevel.min - currentLevel.min)) *
        100
      : 100;

    const totalPages = Math.max(
      1,
      Math.ceil((vetteCount + 1) / SLOTS_PER_PAGE),
    );
    const vouchersCount = Math.floor(vetteCount / 8);

    return {
      vetteCount,
      currentLevel,
      nextLevel,
      progressToNext,
      totalPages,
      vouchersCount,
    };
  }, [userTessera]);

  // --- LOGICA DI RISCATTO ---
  const verifyCode = async () => {
    if (!redeemCode.trim()) return;
    setRedeemError("");
    setLoading(true);

    try {
      const { data: attivita, error: dbErr } = await supabase
        .from("escursioni")
        .select("titolo")
        .eq("codice_riscatto", redeemCode.toUpperCase().trim())
        .single();

      if (dbErr || !attivita) {
        setRedeemError("Codice non valido.");
        setLoading(false);
        return;
      }

      const alreadyDone = userTessera?.escursioni_completate?.some(
        (e: EscursioneCompletata) => e.titolo === attivita.titolo,
      );

      if (alreadyDone) {
        setRedeemError("Vetta già conquistata!");
        setLoading(false);
        return;
      }

      setPendingActivity(attivita as AttivitaDaRiscattare);
      setRedeemStep("COLOR");
    } catch (e) {
      setRedeemError("Si è verificato un errore. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const saveVetta = async (selectedHex: string) => {
    if (!userTessera || !pendingActivity || isSaving) return;
    setIsSaving(true);

    const listaAttuale = Array.isArray(userTessera.escursioni_completate)
      ? userTessera.escursioni_completate
      : [];

    const updatedList: EscursioneCompletata[] = [
      ...listaAttuale,
      {
        titolo: pendingActivity.titolo,
        colore: selectedHex,
        data: new Date().toISOString(),
      },
    ];

    const { data, error: upError } = await supabase
      .from("tessere")
      .update({
        escursioni_completate: updatedList,
        punti: (userTessera.punti || 0) + 100,
      })
      .eq("id", userTessera.id)
      .select();

    if (!upError && data) {
      setUserTessera(data[0] as UserTessera);
      setShowRedeem(false);

      // Resetta stato del modale
      setRedeemStep("INPUT");
      setRedeemCode("");
      setPendingActivity(null);

      // Aggiorna la pagina per mostrare l'ultimo inserimento
      setCurrentPage(Math.floor(updatedList.length / SLOTS_PER_PAGE));

      confetti({
        particleCount: 150,
        colors: [selectedHex, "#ffffff"],
        origin: { y: 0.7 },
      });
    } else {
      setRedeemError("Errore durante il salvataggio.");
    }

    setIsSaving(false);
  };

  // --- RENDER DEL CARICAMENTO ---
  if (loading && !userTessera && !showRedeem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f2ed]">
        <Loader2 className="animate-spin text-stone-300 w-8 h-8" />
      </div>
    );
  }

  // --- RENDER DEL LOGIN ---
  if (!userTessera) {
    return (
      <div className="min-h-screen bg-[#f5f2ed] flex items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-sm border border-stone-100">
          <IconaScarpone size={48} className="text-stone-200 mx-auto mb-6" />
          <h2 className="text-2xl font-black uppercase mb-8 text-brand-stone">
            Accedi al Passaporto
          </h2>
          <input
            className="w-full bg-stone-50 border-2 border-stone-100 p-5 rounded-2xl text-center text-xl font-black mb-2 uppercase outline-none focus:border-brand-sky"
            placeholder="ALT-XXX"
            value={loginCode}
            onChange={(e) => setLoginCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUser(loginCode)}
          />
          {loginError && (
            <p className="text-red-500 text-[10px] font-black uppercase mb-4 mt-2">
              {loginError}
            </p>
          )}
          <button
            onClick={() => fetchUser(loginCode)}
            disabled={loading || !loginCode}
            className="w-full mt-4 bg-brand-stone text-white py-5 rounded-2xl font-black uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Sblocca"
            )}
          </button>
        </div>
      </div>
    );
  }

  // Per evitare errori TypeScript siccome abbiamo garantito che stats non è null qui
  if (!stats) return null;
  const {
    vetteCount,
    currentLevel,
    progressToNext,
    totalPages,
    vouchersCount,
  } = stats;

  // --- RENDER DELLA DASHBOARD PRINCIPALE ---
  return (
    <div className="min-h-screen bg-[#f5f2ed] pb-24 text-stone-800">
      <style>{`
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        .animate-shine {
          position: relative;
          overflow: hidden;
        }
        .animate-shine::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
          animation: shine 3s infinite;
        }
      `}</style>

      {/* HERO SECTION */}
      <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden mb-12">
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop"
          className="absolute inset-0 w-full h-full object-cover"
          alt="Hero"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-[#f5f2ed]" />

        <button
          onClick={handleLogout}
          className="absolute top-8 right-8 p-3 bg-white/10 backdrop-blur-md rounded-full text-white z-50 border border-white/20 hover:bg-white/20 transition-all"
        >
          <LogOut size={20} />
        </button>

        <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 mb-4">
              <currentLevel.icon size={16} className={currentLevel.color} />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">
                {currentLevel.label}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-tight drop-shadow-xl">
              La tua tessera <br /> ALTOUR
            </h1>
          </motion.div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 -mt-20 relative z-30 text-center">
        {/* PROGRESS BAR */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-stone-100 mb-8">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-sky-400 fill-sky-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                Progresso Esperienza
              </span>
            </div>
            <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                className="h-full bg-sky-400"
              />
            </div>
            <span className="text-[10px] font-bold text-stone-400 uppercase">
              {vetteCount} Scarponi Conquistati
            </span>
          </div>
        </div>

        {/* PASSPORT CARD */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-[3rem] p-10 shadow-2xl border border-stone-50 relative overflow-hidden mb-6"
            style={{
              backgroundImage:
                "url('https://www.transparenttextures.com/patterns/paper.png')",
            }}
          >
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-12">
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck size={14} className="text-sky-400" />
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                      Tessera {currentPage + 1} / {totalPages}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-brand-stone">
                    {userTessera.nome_escursionista}
                  </h2>
                </div>
                <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center border-2 border-stone-100">
                  {vetteCount >= 8 * (currentPage + 1) ? (
                    <IconaScarpone size={32} className="text-amber-500" />
                  ) : (
                    <Star size={32} className="text-stone-200" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: SLOTS_PER_PAGE }).map((_, i) => {
                  const idx = currentPage * SLOTS_PER_PAGE + i;
                  const esc = userTessera.escursioni_completate?.[idx];
                  return (
                    <div
                      key={i}
                      className="aspect-square rounded-2xl border-2 border-dashed border-stone-100 bg-stone-50/50 flex items-center justify-center relative overflow-hidden group"
                    >
                      {esc ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="animate-shine p-1 flex flex-col items-center justify-center"
                        >
                          <IconaScarpone
                            size={56}
                            style={{ color: esc.colore }}
                            className="drop-shadow-md"
                          />
                        </motion.div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <IconaScarpone
                            size={48}
                            className="text-stone-400 opacity-10"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-4 mb-10">
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-3 bg-white rounded-xl shadow-sm border border-stone-100 disabled:opacity-30 transition-opacity"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              disabled={currentPage === totalPages - 1}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-3 bg-white rounded-xl shadow-sm border border-stone-100 disabled:opacity-30 transition-opacity"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* VOUCHERS */}
        {vouchersCount > 0 && (
          <div className="mb-12">
            <h3 className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-4">
              I Tuoi Voucher
            </h3>
            {Array.from({ length: vouchersCount }).map((_, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-[2rem] border-2 border-dashed border-sky-200 flex items-center justify-between mb-4"
              >
                <div className="text-left">
                  <h4 className="text-xl font-black text-brand-stone">
                    SCONTO 10€
                  </h4>
                  <p className="text-[10px] font-bold text-stone-400 uppercase">
                    Codice: ALTOUR-{10 + i}V
                  </p>
                </div>
                <Gift className="text-sky-200" size={32} />
              </div>
            ))}
          </div>
        )}

        {/* DIARIO */}
        <div className="mb-12">
          <h3 className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-6">
            Cronologia dei Passi
          </h3>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-50 space-y-6 text-left">
            {userTessera.escursioni_completate?.length > 0 ? (
              [...userTessera.escursioni_completate]
                .reverse()
                .map((esc: EscursioneCompletata, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${esc.colore}15` }}
                      >
                        <IconaScarpone
                          size={18}
                          style={{ color: esc.colore }}
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase text-brand-stone">
                          {esc.titolo}
                        </h4>
                        <div className="flex items-center gap-1 text-stone-300 text-[9px] font-bold uppercase tracking-widest">
                          <Calendar size={10} />{" "}
                          {new Date(esc.data).toLocaleDateString("it-IT")}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-center text-stone-200 text-xs py-4 font-black uppercase tracking-widest">
                Inizia la tua avventura
              </p>
            )}
          </div>
        </div>

        {/* REDEEM FAB BUTTON */}
        <button
          onClick={() => {
            setRedeemStep("INPUT");
            setRedeemCode("");
            setRedeemError("");
            setShowRedeem(true);
          }}
          className="w-full bg-brand-stone text-white py-6 rounded-3xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-2xl transition-all hover:bg-brand-sky active:scale-95"
        >
          <Plus size={20} /> Riscatta Scarpone
        </button>
      </div>

      {/* MODAL RISCATTO */}
      <AnimatePresence>
        {showRedeem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/40">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-10 rounded-[3rem] w-full max-w-sm relative text-center shadow-2xl"
            >
              <button
                onClick={() => !isSaving && setShowRedeem(false)}
                className="absolute top-6 right-6 text-stone-300 hover:text-stone-500 transition-colors"
                disabled={isSaving}
              >
                <X size={24} />
              </button>

              {redeemStep === "INPUT" ? (
                <>
                  <h3 className="text-2xl font-black uppercase mb-6 text-brand-stone tracking-tighter">
                    Inserisci Codice
                  </h3>
                  <input
                    autoFocus
                    className="w-full bg-stone-50 border-2 border-stone-100 p-5 rounded-2xl text-center text-3xl font-black mb-2 uppercase outline-none focus:border-brand-sky"
                    placeholder="****"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && verifyCode()}
                  />
                  {redeemError && (
                    <p className="text-red-500 text-[10px] font-black uppercase mb-4 mt-2">
                      {redeemError}
                    </p>
                  )}
                  <button
                    onClick={verifyCode}
                    disabled={loading || !redeemCode}
                    className="w-full mt-4 bg-brand-stone text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-brand-sky disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      "Verifica"
                    )}
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-black uppercase mb-6 text-brand-stone tracking-tighter">
                    Scegli il Colore
                  </h3>
                  <div className="grid grid-cols-5 gap-3 mb-8">
                    {EARTH_PALETTE.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => saveVetta(c.hex)}
                        disabled={isSaving}
                        className={`aspect-square rounded-xl border-4 border-white shadow-md transition-transform ${isSaving ? "opacity-50 cursor-not-allowed" : "hover:scale-110"}`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                  {isSaving && (
                    <div className="flex justify-center mt-4">
                      <Loader2
                        className="animate-spin text-brand-sky"
                        size={24}
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
