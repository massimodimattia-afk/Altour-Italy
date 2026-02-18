import { useEffect, useState } from 'react';
import { Calendar, Award, TrendingUp, Gift } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ActivityDetailModal from '../components/ActivityDetailModal';

interface HomeProps {
  onNavigate: (page: string) => void;
  onBookingClick: (title: string) => void;
}

export default function Home({ onNavigate, onBookingClick }: HomeProps) {
  const [featuredHikes, setFeaturedHikes] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: hikes } = await supabase.from('escursioni').select('*').order('data', { ascending: true }).limit(4);
        const { data: crs } = await supabase.from('corsi').select('*').limit(4);
        if (hikes) setFeaturedHikes(hikes);
        if (crs) setCourses(crs);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const openDetails = (activity: any) => {
    setSelectedActivity(activity);
    setIsDetailOpen(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white text-brand-stone font-bold uppercase tracking-widest text-xs">Caricamento...</div>;

  return (
    <div className="min-h-screen bg-stone-100">
      
      {/* SEZIONE EROICA (HERO) */}
      <section className="relative h-[85vh] flex items-center justify-center py-20 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20220904_150458%20(1).webp" 
            className="w-full h-full object-cover object-[85%_center] md:object-center transition-transform duration-[20s] scale-105 hover:scale-100" 
            alt="Dolomiti Altour Italy" 
          />
          {/* Overlay con Gradiente per migliorare la leggibilità */}
          <div className="absolute inset-0 bg-gradient-to-b from-brand-stone/40 via-brand-stone/60 to-brand-stone/80 backdrop-blur-[0.5px]" />
        </div>

        <div className="relative z-10 text-center max-w-3xl">
          {/* LOGO CON EFFETTI DI LUCE */}
          <div className="relative inline-block mb-8 group">
            <div className="absolute -inset-6 bg-white/10 rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-80 transition-opacity" />
            
            <img 
              src="/altour-logo.png" 
              className="relative w-36 h-36 md:w-44 md:h-44 mx-auto rounded-[2rem] shadow-2xl border border-white/20 object-cover" 
              alt="Logo Altour" 
            />
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white mb-4 uppercase tracking-tighter drop-shadow-2xl">
            Altour Italy
          </h1>
          <p className="text-sm md:text-base text-stone-200 mb-10 font-bold uppercase tracking-[0.4em] opacity-90 drop-shadow-md">
            Oltre i confini dell'avventura
          </p>

          <button 
            onClick={() => onBookingClick('Informazioni Generali')} 
            className="bg-brand-sky hover:bg-white hover:text-brand-sky text-white px-10 py-4 rounded-full font-black uppercase text-sm tracking-[0.2em] transition-all flex items-center gap-3 mx-auto shadow-2xl shadow-brand-sky/30 active:scale-95"
          >
            <Calendar size={18} />
            <span>Prenota un'esperienza</span>
          </button>
        </div>
      </section>

      {/* SEZIONE GIFT VOUCHER */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-white rounded-[3rem] p-10 md:p-16 border border-stone-100 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-sky/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="w-24 h-24 bg-brand-stone rounded-3xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform duration-500">
              <Gift size={48} className="text-brand-sky" />
            </div>
            
            <div className="flex-grow text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-black text-brand-stone uppercase tracking-tight mb-4">
                Regala un'Esperienza Altour
              </h2>
              <p className="text-stone-500 font-medium max-w-xl mb-0">
                L'avventura è il regalo più prezioso. Scegli un voucher prepagato e lascia che siano loro a scegliere la prossima vetta da conquistare.
              </p>
            </div>
            
            <div className="flex flex-col gap-3 w-full md:w-auto min-w-[200px]">
              <button 
                onClick={() => onBookingClick('Richiesta Gift Voucher')}
                className="bg-brand-stone text-white px-8 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-brand-sky transition-all shadow-xl shadow-stone-200 flex items-center justify-center gap-3"
              >
                Regala Voucher <TrendingUp size={16} />
              </button>
              <p className="text-[10px] text-stone-300 font-black uppercase tracking-widest text-center">Tagli da 25€, 50€, 100€</p>
            </div>
          </div>
        </div>
      </section>

      {/* SEZIONE PROSSIME USCITE */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black text-stone-900 uppercase tracking-tight">Scegli l'ispirazione, noi organizziamo</h2>
            <div className="h-1.5 w-16 bg-brand-sky mt-3" />
          </div>
          <button 
            onClick={() => onNavigate('escursioni')} 
            className="text-brand-sky font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform"
          >
            Vedi tutte <TrendingUp size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredHikes.map((esc) => (
            <div key={esc.id} className="bg-white rounded-[2rem] shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100 flex flex-col group hover:shadow-2xl transition-all duration-500">
              <div className="h-56 bg-stone-200 relative overflow-hidden">
                {esc.immagine_url && <img src={esc.immagine_url} alt={esc.titolo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter text-brand-stone">
                  {esc.difficolta}
                </div>
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <p className="text-brand-sky font-bold text-xs uppercase mb-2">
                  <Calendar size={12} className="inline mr-1" /> Su richiesta
                </p>
                <h2 className="text-xl font-black mb-6 text-brand-stone uppercase line-clamp-2">{esc.titolo}</h2>
                <p className="text-stone-500 text-sm mb-6 line-clamp-3 font-medium flex-grow">{esc.descrizione}</p>
                
                <div className="flex gap-3 mt-auto">
                  <button 
                    onClick={() => openDetails(esc)}
                    className="flex-1 border-2 border-brand-stone text-brand-stone py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-brand-stone hover:text-white transition-all"
                  >
                    Info
                  </button>
                  <button 
                    onClick={() => onBookingClick(esc.titolo)}
                    className="flex-[2] bg-brand-sky text-white py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-brand-stone transition-all shadow-lg shadow-brand-sky/20"
                  >
                    Richiedi Info
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEZIONE CORSI */}
      <section className="bg-brand-stone py-24 text-white relative">
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Award className="w-12 h-12 text-brand-sky mx-auto mb-4" />
            <h2 className="text-4xl font-black uppercase tracking-tight">Accademia Outdoor</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((corso) => (
              <div key={corso.id} className="bg-white rounded-[2rem] shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100 flex flex-col group hover:shadow-2xl transition-all duration-500">
                <div className="h-48 bg-stone-200 relative overflow-hidden">
                  {corso.immagine_url && <img src={corso.immagine_url} alt={corso.titolo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />}
                  <div className="absolute top-4 left-4 bg-brand-stone text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    {corso.categoria}
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-grow text-brand-stone">
                  <h2 className="text-xl font-black mb-4 uppercase line-clamp-2">{corso.titolo}</h2>
                  <p className="text-stone-500 text-sm mb-6 line-clamp-3 font-medium flex-grow">{corso.descrizione}</p>
                  
                  <div className="mt-auto pt-6 border-t border-stone-100 flex flex-col gap-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-stone-400 font-bold text-[10px] uppercase tracking-widest">{corso.durata}</span>
                      <span className="text-2xl font-black text-brand-sky">€{corso.prezzo}</span>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => openDetails(corso)}
                        className="flex-1 border-2 border-brand-stone text-brand-stone py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-brand-stone hover:text-white transition-all"
                      >
                        Info
                      </button>
                      <button 
                        onClick={() => onBookingClick(corso.titolo)}
                        className="flex-[2] bg-brand-stone text-white py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-brand-sky transition-all active:scale-95"
                      >
                        Richiedi Info
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ActivityDetailModal 
        activity={selectedActivity}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onBook={onBookingClick}
      />
    </div>
  );
}
