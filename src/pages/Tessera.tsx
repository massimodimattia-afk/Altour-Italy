// src/pages/Tessera.tsx
import { useEffect, useState } from "react";
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
} from "lucide-react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";

const STORAGE_KEY = "altour_session_v4";
const SLOTS_PER_PAGE = 8;

const IconaScarpone = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 15l2 0 3-6 4 2 3-1 2 2v4H4z" fill="currentColor" fillOpacity="0.2"/><path d="M9 9l1.5-3.5"/><path d="M12 11l1-3"/><path d="M15 10l.5-2"/><path d="M4 15c0 2 1.5 4 4 4h8c2 0 4-2 4-4"/>
  </svg>
);

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
  { min: 0, max: 8, label: "Camminatore della Domenica", icon: IconaScarpone, color: "text-stone-300" },
  { min: 9, max: 16, label: "Esploratore dei Sentieri", icon: IconaScarpone, color: "text-sky-400" },
  { min: 17, max: 24, label: "Guida Alpina", icon: IconaScarpone, color: "text-amber-500" },
  { min: 25, max: 999, label: "Leggenda delle Vette", icon: IconaScarpone, color: "text-brand-stone" },
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
      const count = data.escursioni_completate?.length || 0;
      setCurrentPage(Math.floor(count / SLOTS_PER_PAGE));
    }
    setLoading(false);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

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

    const alreadyDone = userTessera?.escursioni_completate?.some((e: any) => e.titolo === attivita.titolo);
    if (alreadyDone) {
      setError("Vetta già conquistata!");
      return;
    }

    setPendingActivity(attivita);
    setRedeemStep("COLOR");
  };

  const saveVetta = async (selectedHex: string) => {
    const listaAttuale = Array.isArray(userTessera.escursioni_completate) ? userTessera.escursioni_completate : [];
    const updatedList = [...listaAttuale, { titolo: pendingActivity.titolo, colore: selectedHex, data: new Date().toISOString() }];

    const { data, error: upError } = await supabase
      .from("tessere")
      .update({ escursioni_completate: updatedList, punti: (userTessera.punti || 0) + 100 })
      .eq("id", userTessera.id)
      .select();

    if (!upError && data) {
      setUserTessera(data[0]);
      setShowRedeem(false);
      setRedeemStep("INPUT");
      setInputCodice("");
      setCurrentPage(Math.floor(updatedList.length / SLOTS_PER_PAGE));
      confetti({ particleCount: 150, colors: [selectedHex, "#ffffff"], origin: { y: 0.7 } });
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
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-sm border border-stone-100">
          <IconaScarpone size={48} className="text-stone-200 mx-auto mb-6" />
          <h2 className="text-2xl font-black uppercase mb-8 text-brand-stone">Accedi al Passaporto</h2>
          <input
            className="w-full bg-stone-50 border-2 border-stone-100 p-5 rounded-2xl text-center text-xl font-black mb-6 uppercase outline-none focus:border-brand-sky"
            placeholder="ALT-XXX"
            value={inputCodice}
            onChange={(e) => setInputCodice(e.target.value)}
          />
          <button onClick={() => fetchUser(inputCodice)} className="w-full bg-brand-stone text-white py-5 rounded-2xl font-black uppercase tracking-widest">Sblocca</button>
        </div>
      </div>
    );
  }

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
        <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover" alt="Hero" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-[#f5f2ed]" />

        <button onClick={handleLogout} className="absolute top-8 right-8 p-3 bg-white/10 backdrop-blur-md rounded-full text-white z-50 border border-white/20 hover:bg-white/20 transition-all">
          <LogOut size={20} />
        </button>

        <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 mb-4">
              <currentLevel.icon size={16} className={currentLevel.color} />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">{currentLevel.label}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-tight drop-shadow-xl">I TUOI SCARPONI <br /> ALTOUR</h1>
          </motion.div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 -mt-20 relative z-30 text-center">
        {/* PROGRESS BAR */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-stone-100 mb-8">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-sky-400 fill-sky-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Progresso Esperienza</span>
            </div>
            <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden mb-2">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progressToNext}%` }} className="h-full bg-sky-400" />
            </div>
            <span className="text-[10px] font-bold text-stone-400 uppercase">{vetteCount} Scarponi Conquistati</span>
          </div>
        </div>

        {/* PASSPORT CARD */}
        <AnimatePresence mode="wait">
          <motion.div key={currentPage} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-[3rem] p-10 shadow-2xl border border-stone-50 relative overflow-hidden mb-6" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/paper.png')" }}>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-12">
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck size={14} className="text-sky-400" />
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Tessera {currentPage + 1} / {totalPages}</span>
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-brand-stone">{userTessera.nome_escursionista}</h2>
                </div>
                <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center border-2 border-stone-100">
                  {vetteCount >= 8 * (currentPage + 1) ? <IconaScarpone size={32} className="text-amber-500" /> : <Star size={32} className="text-stone-200" />}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: SLOTS_PER_PAGE }).map((_, i) => {
                  const idx = currentPage * SLOTS_PER_PAGE + i;
                  const esc = userTessera.escursioni_completate?.[idx];
                  return (
                    <div key={i} className="aspect-square rounded-2xl border-2 border-dashed border-stone-100 bg-stone-50/50 flex items-center justify-center relative overflow-hidden group">
                      {esc ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: idx * 45 }} className="animate-shine p-1 flex flex-col items-center justify-center">
                          <IconaScarpone size={56} style={{ color: esc.colore }} className="drop-shadow-md" />
                        </motion.div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <IconaScarpone size={48} className="text-stone-400 opacity-10" />
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
            <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)} className="p-3 bg-white rounded-xl shadow-sm border border-stone-100 disabled:opacity-30"><ChevronLeft size={20} /></button>
            <button disabled={currentPage === totalPages - 1} onClick={() => setCurrentPage(p => p + 1)} className="p-3 bg-white rounded-xl shadow-sm border border-stone-100 disabled:opacity-30"><ChevronRight size={20} /></button>
          </div>
        )}

        {/* VOUCHERS */}
        {vouchersCount > 0 && (
          <div className="mb-12">
            <h3 className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-4">I Tuoi Voucher</h3>
            {Array.from({ length: vouchersCount }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-[2rem] border-2 border-dashed border-sky-200 flex items-center justify-between mb-4">
                <div className="text-left">
                  <h4 className="text-xl font-black text-brand-stone">SCONTO 10€</h4>
                  <p className="text-[10px] font-bold text-stone-400 uppercase">Codice: ALTOUR-{10 + i}V</p>
                </div>
                <Gift className="text-sky-200" size={32} />
              </div>
            ))}
          </div>
        )}

        {/* DIARIO */}
        <div className="mb-12">
          <h3 className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 mb-6">Cronologia dei Passi</h3>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-stone-50 space-y-6 text-left">
            {userTessera.escursioni_completate?.length > 0 ? (
              [...userTessera.escursioni_completate].reverse().map((esc: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${esc.colore}15` }}>
                      <IconaScarpone size={18} style={{ color: esc.colore }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase text-brand-stone">{esc.titolo}</h4>
                      <div className="flex items-center gap-1 text-stone-300 text-[9px] font-bold uppercase tracking-widest">
                        <Calendar size={10} /> {new Date(esc.data).toLocaleDateString("it-IT")}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-stone-200 text-xs py-4 font-black uppercase tracking-widest">Inizia la tua avventura</p>
            )}
          </div>
        </div>

        <button onClick={() => { setRedeemStep("INPUT"); setShowRedeem(true); }} className="w-full bg-brand-stone text-white py-6 rounded-3xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-2xl transition-all hover:bg-brand-sky active:scale-95"><Plus size={20} /> Riscatta Scarpone</button>
      </div>

      <AnimatePresence>
        {showRedeem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/40">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white p-10 rounded-[3rem] w-full max-w-sm relative text-center shadow-2xl">
              <button onClick={() => setShowRedeem(false)} className="absolute top-6 right-6 text-stone-300"><X size={24} /></button>
              {redeemStep === "INPUT" ? (
                <>
                  <h3 className="text-2xl font-black uppercase mb-6 text-brand-stone tracking-tighter">Inserisci Codice</h3>
                  <input autoFocus className="w-full bg-stone-50 border-2 border-stone-100 p-5 rounded-2xl text-center text-3xl font-black mb-4 uppercase outline-none focus:border-brand-sky" placeholder="****" value={inputCodice} onChange={(e) => setInputCodice(e.target.value)} />
                  {error && <p className="text-red-500 text-[10px] font-black uppercase mb-4">{error}</p>}
                  <button onClick={verifyCode} className="w-full bg-brand-stone text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-brand-sky">Verifica</button>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-black uppercase mb-6 text-brand-stone tracking-tighter">Scegli il Colore</h3>
                  <div className="grid grid-cols-5 gap-3 mb-8">
                    {EARTH_PALETTE.map((c) => (
                      <button key={c.hex} onClick={() => saveVetta(c.hex)} className="aspect-square rounded-xl border-4 border-white shadow-md hover:scale-110 transition-transform" style={{ backgroundColor: c.hex }} />
                    ))}
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
