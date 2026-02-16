import { Calendar } from 'lucide-react';

interface Escursione {
  id: string;
  titolo: string;
  descrizione: string;
  data: string;
  difficolta: string;
  prezzo: number;
  immagine_url: string | null;
}

interface Props {
  escursione: Escursione;
  onBook: () => void;
}

export default function EscursioneCard({ escursione, onBook }: Props) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-slate-100 flex flex-col h-full w-full">
      <div className="relative h-48 w-full">
        <img 
          src={escursione.immagine_url || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800'} 
          className="w-full h-full object-cover"
          alt={escursione.titolo}
        />
        <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-[10px] font-bold uppercase border">
          {escursione.difficolta || 'E'}
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center gap-2 text-sky-600 text-[10px] font-bold mb-1">
          <Calendar size={12} /> {new Date(escursione.data).toLocaleDateString('it-IT')}
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-4 line-clamp-2">{escursione.titolo}</h3>
        
        <div className="mt-auto pt-3 border-t flex justify-between items-center">
          <span className="text-lg font-black text-slate-900">€{escursione.prezzo}</span>
          <button 
            onClick={onBook}
            className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-sky-600 transition-colors"
          >
            Dettagli
          </button>
        </div>
      </div>
    </div>
  );
}
