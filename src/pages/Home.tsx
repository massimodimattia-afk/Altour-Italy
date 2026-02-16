// cSpell:disable
import { useEffect, useState } from 'react';
import { Calendar, Award, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import EscursioneCard from '../components/EscursioneCard';
import CorsoCard from '../components/CorsoCard';
import { hikeImage, courseImage } from '../lib/imageUtils';

interface HomeProps {
  onNavigate: (page: string) => void;
  onBookingClick: (title: string) => void;
}

export default function Home({ onNavigate, onBookingClick }: HomeProps) {
  const [featuredHikes, setFeaturedHikes] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      try {
        const { data: hikes } = await supabase.from('escursioni').select('*').gte('data', today).order('data', { ascending: true }).limit(4);
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white text-brand-stone font-bold uppercase tracking-widest text-xs">Caricamento...</div>;

  const hikePlaceholders = Array.from({ length: Math.max(0, 4 - featuredHikes.length) }).map((_, i) => ({
    id: `ph-hike-${i}`,
    titolo: 'Prossimamente',
    descrizione: 'Nuove esperienze in arrivo',
    data: null,
    difficolta: 'E',
    prezzo: 0,
    immagine_url: hikeImage('Prossimamente'),
  }));

  const coursePlaceholders = Array.from({ length: Math.max(0, 4 - courses.length) }).map((_, i) => ({
    id: `ph-course-${i}`,
    titolo: 'Prossimamente',
    descrizione: 'Nuovi corsi in arrivo',
    durata: 'TBD',
    prezzo: 0,
    immagine_url: courseImage('Prossimamente', 'In preparazione'),
    categoria: 'In preparazione',
  }));

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

      {/* SEZIONE PROSSIME USCITE */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black text-stone-900 uppercase tracking-tight">Prossime Uscite</h2>
            <div className="h-1.5 w-16 bg-brand-sky mt-3" />
          </div>
          <button 
            onClick={() => onNavigate('escursioni')} 
            className="text-brand-sky font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform"
          >
            Vedi tutte <TrendingUp size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[...featuredHikes, ...hikePlaceholders].map(h => (
            <EscursioneCard key={h.id} escursione={h} onBook={() => onBookingClick(h.titolo)} />
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[...courses, ...coursePlaceholders].map(corso => (
              <CorsoCard
                key={corso.id}
                corso={corso}
                onBook={() => onBookingClick(corso.titolo)}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
