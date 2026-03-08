import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import ActivityDetailModal from "../components/ActivityDetailModal";

const FILOSOFIA_COLORS: Record<string, string> = {
  "Avventura": "#e94544",
  "Benessere": "#a5d9c9",
  "Borghi più belli": "#946a52",
  "Cammini": "#e3c45d",
  "Educazione all'aperto": "#01aa9f",
  "Eventi": "#ffc0cb",
  "Formazione": "#002f59",
  "Immersi nel verde": "#358756",
  "Luoghi dello spirito": "#c8a3c9",
  "Novità": "#75c43c",
  "Speciali": "#b8163c",
  "Tra mare e cielo": "#7aaecd",
  "Trek urbano": "#f39452",
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

export interface Campo {
  id: string;
  created_at: string;
  titolo: string;
  descrizione: string | null;
  immagine_url: string | null;
  servizi: string[] | null;
  slug: string;
  prezzo?: number | null;
  durata?: string | null;
}

interface CampiPageProps {
  onBookingClick: (title: string, mode?: "info" | "prenota") => void;
}

function campoToActivity(campo: Campo) {
  return {
    id: campo.id,
    titolo: campo.titolo,
    descrizione: campo.descrizione,
    descrizione_estesa: null,
    prezzo: campo.prezzo ?? (null as unknown as number),
    immagine_url: campo.immagine_url,
    gallery_urls: null,
    difficolta: null,
    durata: null,
    lunghezza: null,
    attrezzatura_consigliata: null,
    attrezzatura: campo.servizi?.join(", ") ?? null,
    _tipo: 'campo' as const,
  };
}

const FALLBACK_IMAGES = [
  "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20241231_144800.webp",
  "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20220904_150458%20(1).webp",
];

const IMG_FALLBACK = "/altour-logo.png";

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
      <div className="mt-auto pt-6 border-t border-stone-100 flex gap-3">
        <div className="h-12 flex-1 bg-stone-100 rounded-2xl animate-pulse" />
        <div className="h-12 flex-[2] bg-stone-100 rounded-2xl animate-pulse" />
      </div>
    </div>
  </div>
);

export default function CampiPage({ onBookingClick }: CampiPageProps) {
  const [campi, setCampi] = useState<Campo[]>([]);
  const [loading, setLoading] = useState(true);
  // FIX 5: error state — distingue "vuoto" da "errore Supabase"
  const [error, setError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ReturnType<typeof campoToActivity> | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    async function loadCampi() {
      const { data, error } = await supabase
        .from("campi")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        setError("Impossibile caricare i campi. Riprova più tardi.");
      } else {
        const normalized: Campo[] = (data ?? []).map((row: any) => ({
          id: row.id,
          created_at: row.created_at,
          titolo: row.titolo,
          descrizione: row.descrizione ?? null,
          immagine_url: row.immagine_url ?? null,
          servizi:
            typeof row.servizi === "string"
              ? safeParseArray(row.servizi)
              : (row.servizi as string[] | null),
          slug: row.slug,
          prezzo: row.prezzo ?? null,
          durata: row.durata ?? null,
        }));
        setCampi(normalized);
      }
      setLoading(false);
    }
    loadCampi();
  }, []);

  function safeParseArray(v: string): string[] | null {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  const openDetails = (campo: Campo) => {
    setSelectedActivity(campoToActivity(campo));
    setIsDetailOpen(true);
  };

  // FIX 6: onClose resetta anche selectedActivity dopo l'animazione di uscita
  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setTimeout(() => setSelectedActivity(null), 300);
  };

  if (loading)
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-20">
        <div className="h-10 w-48 bg-stone-200 rounded animate-pulse mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
        </div>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 md:py-20">

      <div className="mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9] mb-4">
          I nostri <br />
          <span className="text-brand-sky italic font-light">Campi.</span>
        </h1>
        <div className="h-1.5 w-12 bg-brand-sky rounded-full" />
      </div>

      {/* FIX 5: banner errore se Supabase fallisce */}
      {error && (
        <div className="mb-8 rounded-2xl border border-rose-100 bg-rose-50 px-6 py-4 text-rose-600 text-sm font-bold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {!error && campi.length === 0 ? (
          <div className="col-span-3 py-24 text-center">
            <p className="text-stone-300 font-black uppercase tracking-widest text-sm">
              Nessun campo disponibile al momento.
            </p>
          </div>
        ) : (
          campi.map((campo, index) => {
            const imgSrc = campo.immagine_url ?? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
            return (
              <div
                key={campo.id}
                className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100 flex flex-col group hover:shadow-2xl transition-all duration-500"
              >
                <div className="h-48 md:h-56 bg-stone-200 relative overflow-hidden">
                  <img
                    src={imgSrc}
                    alt={campo.titolo}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.currentTarget.src = IMG_FALLBACK; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <FilosofiaBadge value={campo.slug} />
                </div>

                <div className="p-5 md:p-8 flex flex-col flex-grow">
                  <h2 className="text-lg md:text-xl font-black mb-4 text-brand-stone uppercase line-clamp-2">
                    {campo.titolo}
                  </h2>
                  <p className="text-stone-500 text-xs md:text-sm mb-6 line-clamp-3 font-medium flex-grow">
                    {campo.descrizione}
                  </p>


                  <div className="mt-auto pt-6 border-t border-stone-100 flex flex-col gap-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-stone-400 font-bold text-[10px] uppercase tracking-widest">
                        {campo.durata ?? "—"}
                      </span>
                      <span className="text-2xl font-black text-brand-sky">
                        {campo.prezzo != null ? `€${campo.prezzo}` : "—"}
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => openDetails(campo)}
                        className="flex-1 bg-white border-2 border-stone-900 text-stone-900 py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-stone-50 transition-all active:scale-95"
                      >
                        Dettagli
                      </button>
                      <button
                        onClick={() => onBookingClick(campo.titolo)}
                        className="flex-[1.5] py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 bg-brand-sky text-white hover:bg-[#0284c7]"
                      >
                        Richiedi Info
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        // FIX 7: onBook tipizzato correttamente con mode opzionale
        onBook={onBookingClick}
      />
    </div>
  );
}
