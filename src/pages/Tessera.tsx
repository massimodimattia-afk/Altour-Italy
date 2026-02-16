// cSpell:disable
import { useEffect, useState } from 'react';
import { 
  X, Trophy, Star, Loader2, Mountain, 
  QrCode, Check, ShieldCheck, Zap,
  MapPin, Calendar as CalendarIcon,
  Footprints, Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import WeeklyCalendar from '../components/WeeklyCalendar';

// --- CONFIGURAZIONE ---
const SLOTS_PER_PAGE = 8;
const SECRET_CODE = 'ALT2026';
const STORAGE_KEY = 'tessera_v2_premium';

interface SlotData { id: number; unlocked: boolean; date?: string; title?: string; }
interface EventItem { id: string; title: string; date: string; type: 'escursione' | 'corso'; }

export default function Tessera() {
  const [history, setHistory] = useState<SlotData[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEvents, setTotalEvents] = useState(0);
  const [activeTab, setActiveTab] = useState<'collezione' | 'attivita'>('collezione');
  const [showRedeem, setShowRedeem] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');

  // Caricamento dati da Supabase per la tab Attività
  useEffect(() => {
    async function loadData() {
      const { data: h } = await supabase.from('escursioni').select('id, titolo, data');
      const { data: c } = await supabase.from('corsi').select('id, titolo, data');
      const combined = [
        ...(h || []).map(i => ({ id: i.id, title: i.titolo, date: i.data, type: 'escursione' as const })),
        ...(c || []).map(i => ({ id: i.id, title: i.titolo, date: i.data, type: 'corso' as const }))
      ];
      setEvents(combined);

      // Fetch total events for 2026
      const { count: escursioniCount } = await supabase
        .from('escursioni')
        .select('*', { count: 'exact', head: true })
        .gte('data', '2026-01-01')
        .lte('data', '2026-12-31');

      const { count: corsiCount } = await supabase
        .from('corsi')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', '2026-01-01T00:00:00.000Z') // Assuming created_at is used for courses
        .lte('created_at', '2026-12-31T23:59:59.999Z');

      setTotalEvents((escursioniCount || 0) + (corsiCount || 0));
      setLoading(false);
    }
    loadData();
  }, []);

  const totalUnlocked = history.filter(s => s.unlocked).length;

  const handleRedeem = () => {
    if (redeemCode.toUpperCase() === SECRET_CODE) {
      const newId = history.length;
      // Associa all'evento più recente o uno generico
      const newSlot = { 
        id: newId, 
        unlocked: true, 
        date: new Date().toISOString(),
        title: events[newId]?.title || "Nuova Vetta"
      };
      const updated = [...history, newSlot];
      setHistory(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setShowRedeem(false);
      setRedeemCode('');
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#0ea5e9', '#44403c'] });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <Loader2 className="animate-spin text-brand-sky" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-100 text-brand-stone pb-24 font-sans">
      
      {/* --- HEADER --- */}
      <div className="bg-white border-b border-stone-200 pt-16 pb-8 px-6 shadow-sm">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">Passaporto</h1>
            <p className="text-brand-sky text-[10px] font-bold uppercase tracking-[0.2em]">Altour Italy Explorer</p>
          </div>
          <div className="bg-stone-100 p-3 rounded-2xl">
            <Mountain className="text-brand-stone" size={24} />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 mt-8">
        {/* --- WEEKLY CALENDAR --- */}
        <WeeklyCalendar events={events} />
        
        {/* --- TESSERA "BRIGHT" --- */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-stone-200/50 border border-white relative overflow-hidden mb-8"
        >
          {/* Watermark Soft */}
          <div className="absolute -bottom-10 -right-10 opacity-[0.03] rotate-12">
            <Footprints size={200} />
          </div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="text-green-500" size={14} />
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Socio Attivo 2026</span>
                </div>
                <h2 className="text-2xl font-black text-brand-stone uppercase">Mario Rossi</h2>
              </div>
              <div className="bg-brand-sky/10 text-brand-sky px-3 py-1 rounded-full text-[10px] font-black uppercase">
                {totalEvents} Eventi 2026
              </div>
            </div>

            {/* Grid Impronte */}
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: SLOTS_PER_PAGE }).map((_, i) => {
                const slot = history.find(s => s.id === i);
                return (
                  <motion.div 
                    key={i} 
                    whileHover={slot ? { scale: 1.05 } : {}}
                    className={`aspect-square rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${
                      slot 
                        ? 'bg-brand-sky/5 border-brand-sky/20 shadow-inner' 
                        : 'bg-stone-50 border-stone-100'
                    }`}
                  >
                    <Footprints 
                      size={24} 
                      className={slot ? 'text-brand-sky' : 'text-stone-200'} 
                      strokeWidth={slot ? 2.5 : 1.5}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* --- TABS NAVIGATION --- */}
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-stone-200 mb-8">
          <button 
            onClick={() => setActiveTab('collezione')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'collezione' ? 'bg-brand-stone text-white' : 'text-stone-400'}`}
          >
            Collezione
          </button>
          <button 
            onClick={() => setActiveTab('attivita')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'attivita' ? 'bg-brand-stone text-white' : 'text-stone-400'}`}
          >
            Le mie Attività
          </button>
        </div>

        {/* --- TAB CONTENT --- */}
        <AnimatePresence mode="wait">
          {activeTab === 'collezione' ? (
            <motion.div 
              key="coll" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200 text-center">
                  <Zap className="text-amber-500 mx-auto mb-2" size={20} />
                  <span className="text-2xl font-black block">{totalUnlocked * 120}</span>
                  <span className="text-[9px] text-stone-400 uppercase font-bold">Punti XP</span>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200 text-center">
                  <Trophy className="text-brand-sky mx-auto mb-2" size={20} />
                  <span className="text-2xl font-black block">#{Math.floor(totalUnlocked / 2) + 1}</span>
                  <span className="text-[9px] text-stone-400 uppercase font-bold">Grado</span>
                </div>
              </div>

              <button 
                onClick={() => setShowRedeem(true)}
                className="w-full bg-brand-sky text-white py-5 rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-lg shadow-sky-200 hover:bg-sky-500 transition-all active:scale-95"
              >
                <QrCode size={18} /> Riscatta Nuova Vetta
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="act" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              className="space-y-3"
            >
              {history.length === 0 ? (
                <div className="bg-white/50 border-2 border-dashed border-stone-200 rounded-[2rem] p-12 text-center">
                  <Info className="mx-auto text-stone-300 mb-2" />
                  <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Nessun cammino completato</p>
                </div>
              ) : (
                history.slice().reverse().map((act, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-brand-stone">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase">{act.title}</h4>
                        <div className="flex items-center gap-2 text-[9px] text-stone-400 font-bold uppercase mt-0.5">
                          <CalendarIcon size={10} /> {new Date(act.date!).toLocaleDateString('it-IT')}
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                      <Check className="text-green-500" size={14} strokeWidth={3} />
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- MODALE RISCATTO (Chiara) --- */}
      <AnimatePresence>
        {showRedeem && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-brand-stone/40 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-white p-10 rounded-[3rem] w-full max-w-sm shadow-2xl relative"
            >
              <button onClick={() => setShowRedeem(false)} className="absolute top-8 right-8 text-stone-300 hover:text-brand-stone">
                <X size={24} />
              </button>
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-brand-sky/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Star className="text-brand-sky fill-brand-sky" size={28} />
                </div>
                <h3 className="text-xl font-black uppercase">Codice Vetta</h3>
                <p className="text-stone-400 text-[10px] font-bold uppercase mt-1">Convalida la tua escursione</p>
              </div>

              <input 
                autoFocus
                className="w-full bg-stone-100 border-2 border-stone-100 p-5 rounded-2xl text-center text-3xl font-black text-brand-stone outline-none focus:border-brand-sky focus:bg-white transition-all mb-6 uppercase tracking-[0.3em]"
                placeholder="****"
                maxLength={9}
                value={redeemCode}
                onChange={e => setRedeemCode(e.target.value)}
              />

              <button 
                onClick={handleRedeem}
                className="w-full bg-brand-stone text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-stone-300 transition-transform active:scale-95"
              >
                Verifica Codice
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}