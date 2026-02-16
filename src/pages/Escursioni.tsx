import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import ActivityDetailModal from '../components/ActivityDetailModal';

type Escursione = Database['public']['Tables']['escursioni']['Row'];

interface EscursioniPageProps {
  onNavigate: (page: string) => void;
  onBookingClick: (title: string) => void;
}

export default function EscursioniPage({ onBookingClick }: EscursioniPageProps) {
  const [escursioni, setEscursioni] = useState<Escursione[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Escursione | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    async function fetchEscursioni() {
      const { data } = await supabase.from('escursioni').select('*').order('data', { ascending: true });
      if (data) setEscursioni(data);
      setLoading(false);
    }
    fetchEscursioni();
  }, []);

  const openDetails = (esc: Escursione) => {
    setSelectedActivity(esc);
    setIsDetailOpen(true);
  };

  if (loading) return <div className="p-10 text-center text-stone-400 font-bold uppercase tracking-widest">Caricamento...</div>;

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-black mb-12 text-brand-stone uppercase tracking-tighter">Prossime Escursioni</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {escursioni.map((esc) => (
          <div key={esc.id} className="bg-white rounded-[2rem] shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100 flex flex-col group hover:shadow-2xl transition-all duration-500">
            <div className="h-56 bg-stone-200 relative overflow-hidden">
              {esc.immagine_url && <img src={esc.immagine_url} alt={esc.titolo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter text-brand-stone">
                {esc.difficolta}
              </div>
            </div>
            <div className="p-8 flex flex-col flex-grow">
              <p className="text-brand-sky font-bold text-xs uppercase mb-2">
                {esc.data ? new Date(esc.data).toLocaleDateString('it-IT') : 'Data da definire'}
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
                  Prenota
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ActivityDetailModal 
        activity={selectedActivity}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onBook={onBookingClick}
      />
    </div>
  );
}
