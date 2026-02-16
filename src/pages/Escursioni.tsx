import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';

type Escursione = Database['public']['Tables']['escursioni']['Row'];

interface EscursioniPageProps {
  onNavigate: (page: string) => void;
  onBookingClick: (title: string) => void;
}

export default function EscursioniPage({ onBookingClick }: EscursioniPageProps) {
  const [escursioni, setEscursioni] = useState<Escursione[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEscursioni() {
      const { data } = await supabase.from('escursioni').select('*').order('data', { ascending: true });
      if (data) setEscursioni(data);
      setLoading(false);
    }
    fetchEscursioni();
  }, []);

  if (loading) return <div className="p-10 text-center text-stone-400 font-bold uppercase tracking-widest">Caricamento...</div>;

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-black mb-12 text-brand-stone uppercase tracking-tighter">Prossime Escursioni</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {escursioni.map((esc) => (
          <div key={esc.id} className="bg-white rounded-[2rem] shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100">
            <div className="h-56 bg-stone-200 relative">
              {esc.immagine_url && <img src={esc.immagine_url} alt={esc.titolo} className="w-full h-full object-cover" />}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter text-brand-stone">
                {esc.difficolta}
              </div>
            </div>
            <div className="p-8">
              <p className="text-brand-sky font-bold text-xs uppercase mb-2">
                {esc.data ? new Date(esc.data).toLocaleDateString('it-IT') : 'Data da definire'}
              </p>
              <h2 className="text-xl font-black mb-6 text-brand-stone uppercase">{esc.titolo}</h2>
              <button 
                onClick={() => onBookingClick(esc.titolo)}
                className="w-full bg-brand-sky text-white py-4 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-brand-stone transition-all shadow-lg shadow-brand-sky/20"
              >
                Prenota Posto
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
