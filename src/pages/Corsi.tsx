import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import ActivityDetailModal from "../components/ActivityDetailModal";

type Corso = Database["public"]["Tables"]["corsi"]["Row"];

interface CorsiPageProps {
  onNavigate: (page: string) => void; // mantenuta per compatibilità con App.tsx
  onBookingClick: (title: string, mode?: "info" | "prenota") => void;
}

const FILOSOFIA_COLORS: Record<string, string> = {
  Avventura: "#e94544",
  Benessere: "#a5daca",
  "Borghi più belli": "#946a52",
  Formazione: "#002f59",
  "Giornata da Guida": "#75c43c",
  "Immersi nel verde": "#358756",
  "Luoghi dello Spirito": "#c8a3c9",
  "Outdoor Education": "#01aa9f",
  Speciali: "#b8163c",
  "Tra Mare e Cielo": "#7aaecd",
  "Trek Urbano": "#f39452",
};

function getFilosofiaOpacity(color: string): string {
  const dark = ["#002f59", "#946a52", "#b8163c", "#358756"];
  return dark.includes(color) ? `${color}aa` : `${color}cc`;
}

function FilosofiaBadge({ value }: { value: string | null | undefined }) {
  if (!value) return null;
  const color = FILOSOFIA_COLORS[value] ?? "#44403c";
  const bg = getFilosofiaOpacity(color);
  return (
    <div
      className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-sm"
      style={{
        backgroundColor: bg,
        color: "rgba(255,255,255,0.95)",
        textShadow: "0 1px 3px rgba(0,0,0,0.35)",
        boxShadow: `0 2px 12px ${color}55, inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0 1px ${color}`,
      }}
    >
      {value}
    </div>
  );
}

const SkeletonCard = () => (
  <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100 flex flex-col">
    <div className="h-48 md:h-56 bg-stone-100 animate-pulse" />
    <div className="p-5 md:p-8 flex flex-col gap-4">
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

const IMG_FALLBACK = "/altour-logo.png";

export default function CorsiPage({ onBookingClick }: CorsiPageProps) {
  const [corsi, setCorsi] = useState<Corso[]>([]);
  const [loading, setLoading] = useState(true);
  // FIX 1: error state — distingue "vuoto" da "errore Supabase"
  const [error, setError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Corso | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    async function fetchCorsi() {
      const { data, error } = await supabase
        .from("corsi")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        setError("Impossibile caricare i corsi. Riprova più tardi.");
      } else {
        setCorsi(data ?? []);
      }
      setLoading(false);
    }
    fetchCorsi();
  }, []);

  const openDetails = (corso: Corso) => {
    setSelectedActivity(corso);
    setIsDetailOpen(true);
  };

  // FIX 2: onClose resetta anche selectedActivity dopo l'animazione di uscita
  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setTimeout(() => setSelectedActivity(null), 300);
  };

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
        Accademia <br />
        <span className="text-brand-sky italic font-light">Altour.</span>
      </h1>

      {/* FIX 1: banner errore se Supabase fallisce */}
      {error && (
        <div className="col-span-3 mb-8 rounded-2xl border border-rose-100 bg-rose-50 px-6 py-4 text-rose-600 text-sm font-bold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {!error && corsi.length === 0 ? (
          <div className="col-span-3 py-24 text-center">
            <p className="text-stone-300 font-black uppercase tracking-widest text-sm">
              Nessun corso disponibile al momento.
            </p>
          </div>
        ) : (
          corsi.map((corso) => (
            <div
              key={corso.id}
              className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100 flex flex-col group hover:shadow-2xl transition-all duration-500"
            >
              <div className="h-48 md:h-56 bg-stone-200 relative overflow-hidden">
                {corso.immagine_url && (
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
                <FilosofiaBadge value={corso.categoria} />
              </div>
              <div className="p-5 md:p-8 flex flex-col flex-grow">
                <h2 className="text-lg md:text-xl font-black mb-4 text-brand-stone uppercase line-clamp-2">
                  {corso.titolo}
                </h2>
                <p className="text-stone-500 text-xs md:text-sm mb-6 line-clamp-3 font-medium flex-grow">
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
                      // FIX 3: aggiunto active:scale-95 — coerente con Campi ed Escursioni
                      className="flex-1 bg-white border-2 border-stone-900 text-stone-900 py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-stone-50 transition-all active:scale-95"
                    >
                      Dettagli
                    </button>
                    <button
                      onClick={() => onBookingClick(corso.titolo)}
                      className="flex-[1.5] py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 bg-brand-sky text-white hover:bg-[#0284c7]"
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
        onClose={handleCloseDetail}
        onBook={onBookingClick}
      />
    </div>
  );
}