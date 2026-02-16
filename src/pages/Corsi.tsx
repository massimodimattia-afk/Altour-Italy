import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Corso = Database['public']['Tables']['corsi']['Row'];

interface CorsiPageProps {
  onNavigate: (page: string) => void;
  onBookingClick: (title: string) => void;
}

export default function CorsiPage({ onBookingClick }: CorsiPageProps) {
  const [corsi, setCorsi] = useState<Corso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCorsi() {
      const { data } = await supabase.from('corsi').select('*').order('created_at', { ascending: false });
      if (data) setCorsi(data);
      setLoading(false);
    }
    fetchCorsi();
  }, []);

  if (loading) return <div className="p-10 text-center text-stone-400 font-bold uppercase tracking-widest">Caricamento...</div>;

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-black mb-12 text-brand-stone uppercase tracking-tighter">I Nostri Corsi</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {corsi.map((corso) => (
          <div key={corso.id} className="bg-white rounded-[2rem] shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100 flex flex-col">
            <div className="h-48 bg-stone-200">
              {corso.immagine_url && <img src={corso.immagine_url} alt={corso.titolo} className="w-full h-full object-cover" />}
            </div>
            <div className="p-8 flex flex-col flex-grow">
              <h2 className="text-xl font-black mb-4 text-brand-stone uppercase">{corso.titolo}</h2>
              <div className="mt-auto pt-6 border-t border-stone-100 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 font-bold text-xs uppercase tracking-widest">{corso.durata}</span>
                  <span className="text-2xl font-black text-brand-sky">€{corso.prezzo}</span>
                </div>
                <button 
                  onClick={() => onBookingClick(corso.titolo)}
                  className="w-full bg-brand-stone text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-brand-sky transition-all active:scale-95"
                >
                  Prenota Ora
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
