import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import ActivityDetailModal from "../components/ActivityDetailModal";

type Corso = Database["public"]["Tables"]["corsi"]["Row"];

interface CorsiPageProps {
  onNavigate: (page: string) => void;
  onBookingClick: (title: string) => void;
}

// FIX: skeleton loader al posto del testo "Caricamento..."
const SkeletonCard = () => (
  <div className="bg-white rounded-[2rem] shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100 flex flex-col">
    <div className="h-48 bg-stone-100 animate-pulse" />
    <div className="p-8 flex flex-col gap-4">
      <div className="h-6 w-3/4 bg-stone-200 rounded animate-pulse" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-stone-100 rounded animate-pulse" />
        <div className="h-3 w-5/6 bg-stone-100 rounded animate-pulse" />
        <div className="h-3 w-4/6 bg-stone-100 rounded animate-pulse" />
      </div>
      <div className="mt-auto pt-6 border-t border-stone-100 flex flex-col gap-4">
        <div className="flex justify-between">
          <div className="h-3 w-16 bg-stone-100 rounded animate-pulse" />
          <div className="h-6 w-12 bg-stone-100 rounded animate-pulse" />
        </div>
        <div className="flex gap-3">
          <div className="h-12 flex-1 bg-stone-100 rounded-xl animate-pulse" />
          <div className="h-12 flex-[2] bg-stone-100 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

// Placeholder se l'immagine remota fallisce
const IMG_FALLBACK = "/altour-logo.png";

export default function CorsiPage({ onBookingClick }: CorsiPageProps) {
  const [corsi, setCorsi] = useState<Corso[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Corso | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    async function fetchCorsi() {
      const { data } = await supabase
        .from("corsi")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setCorsi(data);
      setLoading(false);
    }
    fetchCorsi();
  }, []);

  const openDetails = (corso: Corso) => {
    setSelectedActivity(corso);
    setIsDetailOpen(true);
  };

  // FIX: skeleton loader invece del testo "Caricamento..."
  if (loading)
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="h-10 w-48 bg-stone-200 rounded animate-pulse mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-black mb-12 text-brand-stone uppercase tracking-tighter">
        I Nostri Corsi
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* FIX: empty state se Supabase restituisce zero corsi */}
        {corsi.length === 0 ? (
          <div className="col-span-3 py-24 text-center">
            <p className="text-stone-300 font-black uppercase tracking-widest text-sm">
              Nessun corso disponibile al momento.
            </p>
          </div>
        ) : (
          corsi.map((corso) => (
            <div
              key={corso.id}
              className="bg-white rounded-[2rem] shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100 flex flex-col group hover:shadow-2xl transition-all duration-500"
            >
              <div className="h-48 bg-stone-200 relative overflow-hidden">
                {corso.immagine_url && (
                  // FIX: lazy loading + fallback su immagine rotta
                  <img
                    src={corso.immagine_url}
                    alt={corso.titolo}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.src = IMG_FALLBACK;
                    }}
                  />
                )}
                <div className="absolute top-4 left-4 bg-brand-stone text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {corso.categoria}
                </div>
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <h2 className="text-xl font-black mb-4 text-brand-stone uppercase line-clamp-2">
                  {corso.titolo}
                </h2>
                <p className="text-stone-500 text-sm mb-6 line-clamp-3 font-medium flex-grow">
                  {corso.descrizione}
                </p>

                <div className="mt-auto pt-6 border-t border-stone-100 flex flex-col gap-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-stone-400 font-bold text-[10px] uppercase tracking-widest">
                      {corso.durata}
                    </span>
                    <span className="text-2xl font-black text-brand-sky">
                      €{corso.prezzo}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => openDetails(corso)}
                      className="flex-1 border-2 border-brand-stone text-brand-stone py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-brand-stone hover:text-white transition-all"
                    >
                      Dettagli
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
          ))
        )}
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
