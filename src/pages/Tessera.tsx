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
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";

const STORAGE_KEY = "altour_session_v4";

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
    }
    setLoading(false);
  }

  const vetteCount = userTessera?.escursioni_completate?.length || 0;
  const currentLevel = LEVELS.find(l => vetteCount >= l.min && vetteCount <= l.max) || LEVELS[0];
  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1] || null;
  const progressToNext = nextLevel ? ((vetteCount - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100 : 100;

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

    const listaAttuale = Array.isArray(userTessera.escursioni_completate)
      ? userTessera.escursioni_completate
      : [];

    const updatedList = [
      ...listaAttuale,
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
      <div className="min-h-screen bg-[#f5f2ed] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-sm text-center border border-stone-100"
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
      {/* Hero Section Immersiva */}
      <section className="relative h-80 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80" 
          className="w-full h-full object-cover"
          alt="Mountain Hero"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#f5f2ed] via-brand-stone/40 to-brand-stone/60" />
        
        <div className="absolute inset-0 flex flex-col justify-end p-8 max-w-2xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none mb-2">
              Passaporto delle Vette
            </h1>
            <p className="text-white/80 text-sm font-bold uppercase tracking-[0.2em]">
              Stato: <span className="text-brand-sky">{currentLevel.label}</span>
            </p>
          </motion.div>
        </div>

        <button
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
        >
          <LogOut size={24} />
        </button>
      </section>

      <div className="max-w-xl mx-auto px-6 -mt-8 relative z-10">
        {/* Grado Esploratore & Barra XP */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-stone-100 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={`p-4 bg-stone-50 rounded-2xl shadow-inner ${currentLevel.color}`}>
                <currentLevel.icon size={32} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-1">
                  Grado Attuale
                </span>
                <h3 className="text-xl font-black uppercase text-brand-stone leading-none">
                  {currentLevel.label}
                </h3>
              </div>
            </div>
            {nextLevel && (
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 block mb-1">
                  Prossimo: {nextLevel.label}
                </span>
                <span className="text-xs font-bold text-brand-sky uppercase">
                  {nextLevel.min - vetteCount} vette rimanenti
                </span>
              </div>
            )}
          </div>

          <div className="relative h-4 bg-stone-100 rounded-full overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressToNext}%` }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-sky to-brand-stone"
            />
          </div>
        </motion.div>

        {/* Card Passaporto Fisica */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[3rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-stone-50 relative overflow-hidden mb-8"
          style={{ 
            backgroundImage: "url('https://www.transparenttextures.com/patterns/paper.png')",
            backgroundColor: "#fff"
          }}
        >
          {/* Filigrana */}
          <div className="absolute -top-10 -right-10 opacity-[0.03] rotate-12">
            <Footprints size={300} />
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-12">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="text-brand-sky" size={16} />
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                    Esploratore Certificato
                  </span>
                </div>
                <h2 className="text-3xl font-black uppercase leading-tight text-brand-stone tracking-tighter">
                  {userTessera.nome_escursionista}
                </h2>
                <p className="text-stone-300 text-[10px] font-bold uppercase mt-1 tracking-widest">
                  ID: {userTessera.codice_tessera}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center border-2 border-stone-100 shadow-inner">
                  {vetteCount >= 10 ? <Crown size={32} className="text-amber-500" /> : <Star size={32} className="text-stone-200" />}
                </div>
              </div>
            </div>

            {/* Griglia Timbri */}
            <div className="grid grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 12 }).map((_, i) => {
                const esc = userTessera.escursioni_completate?.[i];
                return (
                  <div
                    key={i}
                    className="aspect-square rounded-3xl flex items-center justify-center border-2 border-dashed border-stone-200 bg-stone-50/50 relative group"
                  >
                    {esc ? (
                      <motion.div
                        initial={{ scale: 2, opacity: 0, rotate: -20 }}
                        animate={{ scale: 1, opacity: 1, rotate: Math.random() * 20 - 10 }}
                        className="flex flex-col items-center"
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

        {/* Statistiche Chiave */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Vette", value: vetteCount, icon: Trophy, color: "bg-amber-50 text-amber-500" },
            { label: "XP Totali", value: userTessera.punti, icon: Zap, color: "bg-brand-sky/10 text-brand-sky" },
            { label: "Livello", value: LEVELS.indexOf(currentLevel) + 1, icon: Medal, color: "bg-brand-stone/10 text-brand-stone" }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="bg-white p-4 rounded-3xl border border-stone-100 shadow-sm text-center"
            >
              <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <stat.icon size={20} />
              </div>
              <span className="text-xl font-black block leading-none text-brand-stone">{stat.value}</span>
              <span className="text-[9px] text-stone-400 font-black uppercase tracking-widest">{stat.label}</span>
            </motion.div>
          ))}
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
