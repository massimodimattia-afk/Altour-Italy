import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import ActivityDetailModal from "../components/ActivityDetailModal";
import ZainoQuiz from "../components/Corsiquiz";
import ReactMarkdown from "react-markdown";
import { ArrowRight, Sparkles, BookOpen, Mountain, Tag } from "lucide-react";

type Corso = Database["public"]["Tables"]["corsi"]["Row"] & {
  prezzo_teorico?: number | null;
  prezzo_pratico?: number | null;
  prezzo_bundle?: number | null;
};

interface CorsiPageProps {
  onNavigate: (page: string) => void;
  onBookingClick: (title: string, mode?: "info" | "prenota") => void;
}

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

const FILOSOFIA_ALIAS: Record<string, string> = {
  "Outdoor Education": "Educazione all'aperto",
  "Luoghi dello Spirito": "Luoghi dello spirito",
  "Tra Mare e Cielo": "Tra mare e cielo",
  "Trek Urbano": "Trek urbano",
  "Giornata da Guida": "Novità",
};

function normalizeFilosofia(value?: string | null): string | null {
  if (!value) return value ?? null;
  const key = value.trim();
  return FILOSOFIA_ALIAS[key] ?? key;
}

function normalizeMarkdown(text: string): string {
  return text.replace(/\*\s+/g, "*").replace(/\s+\*/g, "*");
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

// ── Pricing block ─────────────────────────────────────────────────────────────
function PricingBlock({
  corso,
  onBook,
}: {
  corso: Corso;
  onBook: (title: string, mode?: "info" | "prenota") => void;
}) {
  const hasModular =
    corso.prezzo_teorico != null || corso.prezzo_pratico != null;

  const sumParts = (corso.prezzo_teorico ?? 0) + (corso.prezzo_pratico ?? 0);
  const saveAmount =
    corso.prezzo_bundle != null && sumParts > 0
      ? sumParts - corso.prezzo_bundle
      : 0;

  if (!hasModular) {
    return (
      <div className="flex gap-3">
        <button
          onClick={() => onBook(corso.titolo, "info")}
          className="flex-1 min-h-[48px] bg-white border-2 border-stone-900 text-stone-900 py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-stone-50 transition-all active:scale-95"
        >
          Dettagli
        </button>
        <button
          onClick={() => onBook(corso.titolo, "prenota")}
          className="flex-[1.5] min-h-[48px] py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 bg-brand-sky text-white hover:bg-[#0284c7]"
        >
          Richiedi Info
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {corso.prezzo_bundle != null && (
        <div
          className="rounded-2xl p-4 border"
          style={{
            background: "linear-gradient(135deg, #5aaadd0f 0%, #81ccb00f 100%)",
            borderColor: "#5aaadd40",
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Sparkles size={11} style={{ color: "#5aaadd" }} />
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#5aaadd" }}>
                Pacchetto completo
              </span>
            </div>
            <span className="text-xl font-black text-[#44403c]">
              €{corso.prezzo_bundle}
            </span>
          </div>
          {saveAmount > 0 && (
            <div className="mb-3">
              <span
                className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-white"
                style={{ background: "#81ccb0" }}
              >
                Risparmia €{saveAmount}
              </span>
            </div>
          )}
          <button
            onClick={() => onBook(`${corso.titolo} — Pacchetto Completo`, "prenota")}
            className="w-full min-h-[44px] py-3 rounded-xl font-black uppercase text-[9px] tracking-widest text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{
              background: "linear-gradient(135deg, #5aaadd, #3d8fb8)",
              boxShadow: "0 4px 14px rgba(90,170,221,0.3)",
            }}
          >
            Acquista tutto <ArrowRight size={11} />
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {corso.prezzo_teorico != null && (
          <div
            className="rounded-xl p-3 border border-stone-100 bg-white"
            style={{ boxShadow: "0 2px 8px rgba(159,130,112,0.08)" }}
          >
            <div className="flex items-center gap-1 mb-1.5">
              <BookOpen size={10} className="text-stone-400" />
              <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">Teoria</span>
            </div>
            <p className="text-base font-black text-[#44403c] mb-2">€{corso.prezzo_teorico}</p>
            <button
              onClick={() => onBook(`${corso.titolo} — Modulo Teorico`, "prenota")}
              className="w-full min-h-[40px] py-2 rounded-lg font-black uppercase text-[8px] tracking-widest border-2 border-stone-200 text-stone-600 hover:border-stone-400 transition-all active:scale-95"
            >
              Scegli
            </button>
          </div>
        )}
        {corso.prezzo_pratico != null && (
          <div
            className="rounded-xl p-3 border border-stone-100 bg-white"
            style={{ boxShadow: "0 2px 8px rgba(159,130,112,0.08)" }}
          >
            <div className="flex items-center gap-1 mb-1.5">
              <Mountain size={10} className="text-stone-400" />
              <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">Pratica</span>
            </div>
            <p className="text-base font-black text-[#44403c] mb-2">€{corso.prezzo_pratico}</p>
            <button
              onClick={() => onBook(`${corso.titolo} — Uscita Didattica`, "prenota")}
              className="w-full min-h-[40px] py-2 rounded-lg font-black uppercase text-[8px] tracking-widest border-2 border-stone-200 text-stone-600 hover:border-stone-400 transition-all active:scale-95"
            >
              Scegli
            </button>
          </div>
        )}
      </div>
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
      <div className="mt-auto pt-6 border-t border-stone-100 space-y-2">
        <div className="h-16 bg-stone-100 rounded-2xl animate-pulse" />
        <div className="flex gap-2">
          <div className="h-12 flex-1 bg-stone-100 rounded-xl animate-pulse" />
          <div className="h-12 flex-1 bg-stone-100 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

const IMG_FALLBACK = "/altour-logo.png";

export default function CorsiPage({ onBookingClick }: CorsiPageProps) {
  const [corsi, setCorsi] = useState<Corso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const coursesGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchCorsi() {
      const { data, error } = await supabase
        .from("corsi")
        .select("*")
        .order("posizione", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) {
        setError("Impossibile caricare i corsi. Riprova più tardi.");
      } else {
        const normalized = (data ?? []).map((c: any) => ({
          ...c,
          categoria: normalizeFilosofia(c?.categoria),
        }));
        setCorsi(normalized);
      }
      setLoading(false);
    }
    fetchCorsi();
  }, []);

  const openDetails = (corso: Corso) => {
    setSelectedActivity({ ...corso, _tipo: "corso" });
    setIsDetailOpen(true);
  };

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

      {/* Header */}
      <div className="mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9] mb-4">
          Accademia <br />
          <span className="text-brand-sky italic font-light">Altour.</span>
        </h1>
        <div className="h-1.5 w-12 bg-brand-sky rounded-full" />
      </div>

      {error && (
        <div className="mb-8 rounded-2xl border border-rose-100 bg-rose-50 px-6 py-4 text-rose-600 text-sm font-bold">
          {error}
        </div>
      )}

      <div ref={coursesGridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              {/* Image */}
              <div className="h-48 md:h-56 bg-stone-200 relative overflow-hidden">
                {corso.immagine_url && (
                  <img
                    src={corso.immagine_url}
                    alt={corso.titolo}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.currentTarget.src = IMG_FALLBACK; }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                <FilosofiaBadge value={corso.categoria} />

                {/* Bundle badge sull'immagine se ha prezzi modulari */}
                {(corso.prezzo_teorico != null || corso.prezzo_pratico != null) && (
                  <div
                    className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-white backdrop-blur-sm"
                    style={{ background: "rgba(90,170,221,0.75)", border: "1px solid rgba(255,255,255,0.2)" }}
                  >
                    <Tag size={9} /> Moduli separati
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="p-5 md:p-7 flex flex-col flex-grow">
                <h2 className="text-lg md:text-xl font-black mb-3 text-brand-stone uppercase line-clamp-2">
                  {corso.titolo}
                </h2>

                <div className="text-stone-500 text-xs md:text-sm mb-5 line-clamp-3 font-medium flex-grow [&_em]:italic [&_em]:font-serif [&_strong]:font-black [&_strong]:text-[#44403c]">
                  <ReactMarkdown components={{ p: ({ children }) => <span>{children}</span> }}>
                    {normalizeMarkdown(corso.descrizione ?? "")}
                  </ReactMarkdown>
                </div>

                {/* Durata */}
                {corso.durata && (
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-4">
                    {corso.durata}
                  </p>
                )}

                {/* Pricing */}
                <div className="mt-auto pt-5 border-t border-stone-100">
                  <PricingBlock corso={corso} onBook={onBookingClick} />

                  {/* Bottone dettagli sempre visibile sotto */}
                  <button
                    onClick={() => openDetails(corso)}
                    className="w-full mt-2.5 py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest border-2 border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-700 transition-all active:scale-95"
                  >
                    Vedi programma completo
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Quiz zaino ─────────────────────────────────────────────────── */}
      <div className="mt-20 md:mt-32">
        <div className="mb-10">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1 text-brand-sky">
            Non sai da dove iniziare?
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-brand-stone uppercase tracking-tighter leading-[0.9] mb-1">
            Costruisci il tuo<br />
            <span className="font-light italic" style={{ color: "#9f8270" }}>zaino ideale.</span>
          </h2>
          <div className="h-1.5 w-10 bg-brand-sky rounded-full mt-3" />
        </div>
        <ZainoQuiz onScrollToCourses={() => {
            setTimeout(() => {
              coursesGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 80);
          }} />
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