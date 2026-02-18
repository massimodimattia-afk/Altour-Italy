// src/pages/Tessera.tsx
import { useEffect, useState } from "react";
import {
  X,
  Loader2,
  ShieldCheck,
  Zap,
  LogOut,
  Plus,
  Footprints,
  Medal,
  Crown,
  Trophy,
  Star,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Gift,
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";

const STORAGE_KEY = "altour_session_v4";
const SLOTS_PER_PAGE = 8;

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
  { min: 0, max: 2, label: "Camminatore della Domenica", icon: Footprints, color: "text-stone-400" },
  { min: 3, max: 5, label: "Esploratore dei Sentieri", icon: Medal, color: "text-brand-sky" },
  { min: 6, max: 9, label: "Guida Alpina", icon: Crown, color: "text-amber-500" },
  { min: 10, max: 999, label: "Leggenda delle Vette", icon: Trophy, color: "text-brand-stone" },
];

export default function Tessera() {
  const [loading, setLoading] = useState(true);
  const [userTessera, setUserTessera] = useState<any>(null);
  const [inputCodice, setInputCodice] = useState("");
  const [showRedeem, setShowRedeem] = useState(false);
  const [redeemStep, setRedeemStep] = useState<"INPUT" | "COLOR">("INPUT");
  const [pendingActivity, setPendingActivity] = useState<any>(null);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) fetchUser(saved);
    else setLoading(false);
  }, []);

  async function fetchUser(codice: string) {
    setLoading(true);
    const { data } = await supabase
      .from("tessere")
      .select("*")
      .eq("codice_tessera", codice.toUpperCase())
      .single();
    if (data) {
      setUserTessera(data);
      localStorage.setItem(STORAGE_KEY, data.codice_tessera);
      // Auto-set to last page
      const count = data.escursioni_completate?.length || 0;
      setCurrentPage(Math.floor(count / SLOTS_PER_PAGE));
    }
    setLoading(false);
  }

  const vetteCount = userTessera?.escursioni_completate?.length || 0;
  const currentLevel = LEVELS.find(l => vetteCount >= l.min && vetteCount <= l.max) || LEVELS[0];
  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1] || null;
  const progressToNext = nextLevel ? ((vetteCount - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100 : 100;

  const totalPages = Math.max(1, Math.ceil((vetteCount + 1) / SLOTS_PER_PAGE));
  const vouchersCount = Math.floor(vetteCount / 8);

  const verifyCode = async () => {
    setError("");
    const { data: attivita, error: dbErr } = await supabase
      .from("escursioni")
      .select("titolo")
      .eq("codice_riscatto", inputCodice.toUpperCase().trim())
      .single();

    if (dbErr || !attivita) {
      setError("Codice non valido.");
      return;
    }

    const giaFatta = userTessera?.escursioni_completate?.some(
      (e: any) => e.titolo === attivita.titolo,
    );
    if (giaFatta) {
      setError("Vetta già conquistata!");
      return;
    }

    setPendingActivity(attivita);
    setRedeemStep("COLOR");
  };

  const saveVetta = async (selectedHex: string) => {
    if (!userTessera || !pendingActivity) return;

    const listaAtuale = Array.isArray(userTessera.escursioni_completate)
      ? userTessera.escursioni_completate
      : [];

    const updatedList = [
      ...listaAtuale,
      { titolo: pendingActivity.titolo, colore: selectedHex, data: new Date().toISOString() },
    ];

    const { data, error: upError } = await supabase
      .from("tessere")
      .update({
        escursioni_completate: updatedList,
        punti: (userTessera.punti || 0) + 100,
      })
      .eq("id", userTessera.id)
      .select();

    if (upError) return;

    if (data && data.length > 0) {
      setUserTessera(data[0]);
      setShowRedeem(false);
      setRedeemStep("INPUT");
      setInputCodice("");
      setCurrentPage(Math.floor(updatedList.length / SLOTS_PER_PAGE));
      confetti({
        particleCount: 150,
        colors: [selectedHex, "#ffffff"],
        origin: { y: 0.7 },
      });
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f2ed]">
        <Loader2 className="animate-spin text-stone-300" />
      </div>
    );

  if (!userTessera) {
    return (
      <div className="min-h-screen bg-[#f5f2ed] flex items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-sm border border-stone-100"
        >
          <div className="w-20 h-20 bg-stone-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
            <Footprints size={40} className="text-stone-300" />
          </div>
          <h2 className="text-3xl font-black uppercase mb-2 tracking-tighter text-brand-stone">
            Benvenuto
          </h2>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-8">
            Inserisci il codice passaporto
          </p>
          <input
            className="w-full bg-stone-50 border-2 border-stone-100 p-5 rounded-2xl text-center text-2xl font-black mb-6 uppercase outline-none focus:border-brand-sky transition-all"
            placeholder="ALT-XXX"
            value={inputCodice}
            onChange={(e) => setInputCodice(e.target.value)}
          />
          <button
            onClick={() => fetchUser(inputCodice)}
            className="w-full bg-brand-stone text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-brand-sky transition-all active:scale-95 shadow-xl shadow-stone-200"
          >
            Sblocca Accesso
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f2ed] pb-24 text-stone-800 font-sans">
      {/* Header Centralizzato */}
      <section className="pt-20 pb-12 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-5xl md:text-6xl font-black text-brand-stone uppercase tracking-tighter leading-none mb-4">
            Passaport Altour
          </h1>
          <div className="inline-flex items-center gap-3 bg-white px-6 py-2 rounded-full shadow-sm border border-stone-100">
            <currentLevel.icon size={18} className={currentLevel.color} />
            <span className="text-xs font-black uppercase tracking-widest text-stone-500">
              {currentLevel.label}
            </span>
          </div>
        </motion.div>

        <button
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          className="absolute top-8 right-8 text-stone-300 hover:text-brand-stone transition-colors"
        >
          <LogOut size={24} />
        </button>
      </section>

      <div className="max-w-xl mx-auto px-6 relative z-10">
        {/* Grado Esploratore & Barra XP */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-stone-100 mb-8"
        >
          <div className="flex items-center justify-between mb-6 text-center">
            <div className="w-full">
              <div className="flex items-center justify-center gap-2 mb-1">
                 <Zap size={14} className="text-brand-sky" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                   Progresso Esperienza
                 </span>
              </div>
              <div className="flex items-center justify-center gap-4">
                 <span className="text-xs font-bold text-stone-400 uppercase">{vetteCount} Vette</span>
                 <div className="flex-grow max-w-[150px] relative h-2 bg-stone-100 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressToNext}%` }}
                      className="absolute inset-y-0 left-0 bg-brand-sky"
                    />
                 </div>
                 {nextLevel && (
                    <span className="text-xs font-bold text-brand-sky uppercase">-{nextLevel.min - vetteCount} alla prossima</span>
                 )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Card Passaporto con Paginazione */}
        <div className="relative mb-8">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-[3rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-stone-50 relative overflow-hidden"
              style={{ 
                backgroundImage: "url('https://www.transparenttextures.com/patterns/paper.png')",
                backgroundColor: "#fff"
              }}
            >
              {/* Filigrana */}
              <div className="absolute -top-10 -right-10 opacity-[0.03] rotate-12 pointer-events-none">
                <Footprints size={300} />
              </div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="text-brand-sky" size={16} />
                      <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                        Tessera {currentPage + 1} / {totalPages}
                      </span>
                    </div>
                    <h2 className="text-3xl font-black uppercase leading-tight text-brand-stone tracking-tighter">
                      {userTessera.nome_escursionista}
                    </h2>
                    <p className="text-stone-300 text-[10px] font-mono uppercase mt-1 tracking-widest">
                      ID: {userTessera.codice_tessera}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center border-2 border-stone-100 shadow-inner">
                      {vetteCount >= 8 * (currentPage + 1) ? <Crown size={32} className="text-amber-500" /> : <Star size={32} className="text-stone-200" />}
                    </div>
                  </div>
                </div>

                {/* Griglia 8 Slot */}
                <div className="grid grid-cols-4 gap-4 md:gap-6">
                  {Array.from({ length: SLOTS_PER_PAGE }).map((_, i) => {
                    const globalIndex = currentPage * SLOTS_PER_PAGE + i;
                    const esc = userTessera.escursioni_completate?.[globalIndex];
                    return (
                      <div
                        key={i}
                        className="aspect-square rounded-3xl flex items-center justify-center border-2 border-dashed border-stone-200 bg-stone-50/50 relative group"
                      >
                        {esc ? (
                          <motion.div
                            initial={{ scale: 2, opacity: 0, rotate: -20 }}
                            animate={{ scale: 1, opacity: 1, rotate: Math.random() * 20 - 10 }}
                            className="flex flex-col items-center justify-center w-full h-full"
                          >
                            <Footprints
                              size={32}
                              style={{ color: esc.colore }}
                              strokeWidth={3}
                              className="drop-shadow-[2px_2px_2px_rgba(0,0,0,0.1)]"
                            />
                          </motion.div>
                        ) : (
                          <Footprints size={24} className="text-stone-100" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controlli Paginazione */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-4 mt-6">
              <button 
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-3 bg-white rounded-2xl shadow-sm border border-stone-100 disabled:opacity-30 transition-all hover:bg-stone-50"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                disabled={currentPage === totalPages - 1}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-3 bg-white rounded-2xl shadow-sm border border-stone-100 disabled:opacity-30 transition-all hover:bg-stone-50"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Premi / Voucher Digitali */}
        {vouchersCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-stone-400 mb-4 text-center">I Tuoi Premi</h3>
            <div className="space-y-4">
              {Array.from({ length: vouchersCount }).map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] border-2 border-dashed border-brand-sky/30 flex items-center justify-between relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 text-brand-sky/5 group-hover:scale-110 transition-transform">
                    <Gift size={120} />
                  </div>
                  <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-sky block mb-1">Voucher Sbloccato</span>
                    <h4 className="text-2xl font-black text-brand-stone">SCONTO 10€</h4>
                    <p className="text-[10px] font-bold text-stone-400 uppercase mt-1">Valido per la prossima escursione</p>
                  </div>
                  <div className="relative z-10 text-right">
                    <div className="bg-stone-50 px-4 py-2 rounded-xl font-mono text-sm font-black border border-stone-100 mb-2">
                      ALTOUR-{10 + i}V
                    </div>
                    <button className="text-[10px] font-black uppercase tracking-widest text-brand-sky hover:underline">Riscatta ora</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Diario delle Vette */}
        <div className="mb-12">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-stone-400 mb-6 text-center">Diario delle Vette</h3>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-100 space-y-6">
            {userTessera.escursioni_completate && userTessera.escursioni_completate.length > 0 ? (
              [...userTessera.escursioni_completate].reverse().map((esc: any, i: number) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner" style={{ backgroundColor: `${esc.colore}15` }}>
                      <Footprints size={18} style={{ color: esc.colore }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase text-brand-stone leading-none mb-1 group-hover:text-brand-sky transition-colors">{esc.titolo}</h4>
                      <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest flex items-center gap-1">
                        <Calendar size={10} /> {new Date(esc.data).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: esc.colore }} />
                </div>
              ))
            ) : (
              <p className="text-center text-stone-300 text-[10px] font-black uppercase py-8 tracking-widest">Nessun timbro ancora</p>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            setRedeemStep("INPUT");
            setShowRedeem(true);
          }}
          className="w-full bg-brand-stone text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4 hover:bg-brand-sky transition-all active:scale-95 shadow-2xl shadow-stone-300"
        >
          <Plus size={20} /> Riscatta Nuova Vetta
        </button>
      </div>

      {/* Modal Riscatto */}
      <AnimatePresence>
        {showRedeem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRedeem(false)}
              className="absolute inset-0 bg-brand-stone/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white p-10 rounded-[3rem] w-full max-w-sm relative text-center shadow-2xl border border-white/20"
            >
              <button
                onClick={() => setShowRedeem(false)}
                className="absolute top-8 right-8 text-stone-300 hover:text-brand-stone transition-colors"
              >
                <X size={28} />
              </button>

              {redeemStep === "INPUT" ? (
                <>
                  <div className="w-16 h-16 bg-brand-glacier rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Star size={32} className="text-brand-sky" />
                  </div>
                  <h3 className="text-2xl font-black uppercase mb-2 tracking-tighter text-brand-stone">
                    Codice Riscatto
                  </h3>
                  <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-8">
                    Inserisci il codice segreto ricevuto dalla guida
                  </p>
                  <input
                    autoFocus
                    className="w-full bg-stone-50 border-2 border-stone-100 p-5 rounded-2xl text-center text-3xl font-black mb-4 uppercase outline-none focus:border-brand-sky transition-all"
                    placeholder="****"
                    value={inputCodice}
                    onChange={(e) => setInputCodice(e.target.value)}
                  />
                  {error && (
                    <p className="text-red-500 text-[10px] font-black uppercase mb-6 tracking-widest">
                      {error}
                    </p>
                  )}
                  <button
                    onClick={verifyCode}
                    className="w-full bg-brand-stone text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-brand-sky transition-all shadow-xl shadow-stone-200"
                  >
                    Verifica Codice
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-black uppercase mb-2 tracking-tighter text-brand-stone">
                    Sigillo Personale
                  </h3>
                  <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-8">
                    Scegli la tonalità del tuo timbro
                  </p>
                  <div className="grid grid-cols-5 gap-3 mb-10">
                    {EARTH_PALETTE.map((color) => (
                      <button
                        key={color.hex}
                        onClick={() => saveVetta(color.hex)}
                        className="aspect-square rounded-xl flex items-center justify-center border-4 border-white shadow-md hover:scale-110 transition-transform"
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      >
                        <Footprints className="text-white/20" size={14} />
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-stone-400">
                    <ChevronRight size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Seleziona per confermare</span>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
