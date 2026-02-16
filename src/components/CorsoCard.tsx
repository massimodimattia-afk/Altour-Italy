import { Clock, Euro, BookOpen, TrendingUp } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Corso = Database['public']['Tables']['corsi']['Row'];

interface CorsoCardProps {
  corso: Corso;
  onBook: () => void;
}

export default function CorsoCard({ corso, onBook }: CorsoCardProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 flex flex-col h-full border border-stone-100 group">
      {/* Immagine con Overlay Gradiente */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={corso.immagine_url || 'https://images.pexels.com/photos/1252500/pexels-photo-1252500.jpeg'}
          alt={corso.titolo}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Badge Categoria - Ora in Brand Stone */}
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-brand-stone text-white shadow-lg">
            {corso.categoria}
          </span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-black text-brand-stone mb-3 leading-tight uppercase tracking-tight">
          {corso.titolo}
        </h3>

        <p className="text-stone-500 text-sm leading-relaxed mb-6 flex-grow font-medium">
          {corso.descrizione}
        </p>

        {/* Dettagli Tecnici */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center space-x-3 text-stone-700">
            <div className="p-2 bg-brand-glacier rounded-lg">
              <Clock className="w-4 h-4 text-brand-sky flex-shrink-0" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Durata: {corso.durata}</span>
          </div>
          <div className="flex items-center space-x-3 text-stone-700">
            <div className="p-2 bg-brand-glacier rounded-lg">
              <BookOpen className="w-4 h-4 text-brand-sky flex-shrink-0" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Materiale didattico incluso</span>
          </div>
        </div>

        {/* Footer Card - Prezzo e Prenotazione */}
        <div className="flex items-center justify-between gap-4 pt-6 border-t border-stone-100">
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black text-brand-stone">{corso.prezzo}</span>
            <Euro className="w-4 h-4 text-stone-400 flex-shrink-0" />
          </div>
          
          <div className="flex flex-col items-end">
            <button
              onClick={onBook}
              className="bg-brand-sky hover:bg-brand-stone text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all duration-300 shadow-lg shadow-brand-sky/20 flex items-center space-x-2 active:scale-95"
            >
              <span>Iscriviti</span>
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
