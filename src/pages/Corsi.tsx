import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import ActivityDetailModal from '../components/ActivityDetailModal';

type Corso = Database['public']['Tables']['corsi']['Row'];

interface CorsiPageProps {
  onNavigate: (page: string) => void;
  onBookingClick: (title: string) => void;
}

export default function CorsiPage({ onBookingClick }: CorsiPageProps) {
  const [corsi, setCorsi] = useState<Corso[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Corso | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    async function fetchCorsi() {
      const { data } = await supabase.from('corsi').select('*').order('created_at', { ascending: false });
      if (data) setCorsi(data);
      setLoading(false);
    }
    fetchCorsi();
  }, []);

  const openDetails = (corso: Corso) => {
    setSelectedActivity(corso);
    setIsDetailOpen(true);
  };

  if (loading) return <div className="p-10 text-center text-stone-400 font-bold uppercase tracking-widest">Caricamento...</div>;

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-black mb-12 text-brand-stone uppercase tracking-tighter">I Nostri Corsi</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {corsi.map((corso) => (
          <div key={corso.id} className="bg-white rounded-[2rem] shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100 flex flex-col group hover:shadow-2xl transition-all duration-500">
            <div className="h-48 bg-stone-200 relative overflow-hidden">
              {corso.immagine_url && <img src={corso.immagine_url} alt={corso.titolo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />}
              <div className="absolute top-4 left-4 bg-brand-stone text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                {corso.categoria}
              </div>
            </div>
            <div className="p-8 flex flex-col flex-grow">
              <h2 className="text-xl font-black mb-4 text-brand-stone uppercase line-clamp-2">{corso.titolo}</h2>
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
                    Prenota
                  </button>
                </div>
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
