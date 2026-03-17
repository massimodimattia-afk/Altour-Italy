import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

// ── Pricing block — toggle tre opzioni ────────────────────────────────────────
type PricingOption = "bundle" | "teorico" | "pratico";

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

  const [selected, setSelected] = useState<PricingOption>("bundle");

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
          className="flex-[1.5] min-h-[48px] py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 bg-brand-sky text-white"
        >
          Richiedi Info
        </button>
      </div>
    );
  }

  // Opzioni disponibili
  const opts: { key: PricingOption; label: string; price: number | null | undefined; icon: React.ReactNode }[] = [
    ...(corso.prezzo_bundle != null ? [{ key: "bundle" as PricingOption, label: "Tutto", price: corso.prezzo_bundle, icon: <Sparkles size={10} /> }] : []),
    ...(corso.prezzo_teorico != null ? [{ key: "teorico" as PricingOption, label: "Teoria", price: corso.prezzo_teorico, icon: <BookOpen size={10} /> }] : []),
    ...(corso.prezzo_pratico != null ? [{ key: "pratico" as PricingOption, label: "Pratica", price: corso.prezzo_pratico, icon: <Mountain size={10} /> }] : []),
  ];

  const currentOpt = opts.find(o => o.key === selected) ?? opts[0];
  const bookLabel =
    selected === "bundle" ? `${corso.titolo} — Pacchetto Completo`
    : selected === "teorico" ? `${corso.titolo} — Modulo Teorico`
    : `${corso.titolo} — Uscita Didattica`;

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <div className="flex rounded-2xl p-1 gap-1" style={{ background: "rgba(0,0,0,0.04)" }}>
        {opts.map(opt => {
          const isActive = selected === opt.key;
          const isBundle = opt.key === "bundle";
          return (
            <button
              key={opt.key}
              onClick={() => setSelected(opt.key)}
              className="relative flex-1 flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all duration-200 active:scale-95 focus:outline-none"
              style={{
                background: isActive ? "white" : "transparent",
                boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.10)" : "none",
              }}
            >
              {/* Badge risparmio solo sul bundle */}
              {isBundle && saveAmount > 0 && (
                <span
                  className="absolute -top-2 left-1/2 -translate-x-1/2 text-[7px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full text-white whitespace-nowrap"
                  style={{ background: "#81ccb0" }}
                >
                  −€{saveAmount}
                </span>
              )}
              <span className="flex items-center gap-1 mb-0.5" style={{ color: isActive ? (isBundle ? "#5aaadd" : "#9f8270") : "#a8a29e" }}>
                {opt.icon}
                <span className="text-[8px] font-black uppercase tracking-widest">{opt.label}</span>
              </span>
              <span className="text-sm font-black" style={{ color: isActive ? "#44403c" : "#a8a29e" }}>
                €{opt.price}
              </span>
            </button>
          );
        })}
      </div>

      {/* CTA unico */}
      <button
        onClick={() => onBook(bookLabel, "prenota")}
        className="w-full min-h-[48px] py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest text-white flex items-center justify-center gap-2 active:scale-95 transition-all"
        style={{
          background: selected === "bundle"
            ? "linear-gradient(135deg, #5aaadd, #3d8fb8)"
            : "linear-gradient(135deg, #9f8270, #7a6050)",
          boxShadow: selected === "bundle"
            ? "0 4px 14px rgba(90,170,221,0.3)"
            : "0 4px 14px rgba(159,130,112,0.25)",
        }}
      >
        {selected === "bundle" ? <Sparkles size={11} /> : selected === "teorico" ? <BookOpen size={11} /> : <Mountain size={11} />}
        Richiedi Info — €{currentOpt.price}
        <ArrowRight size={11} />
      </button>
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
  const [drawerOpen, setDrawerOpen] = useState(false);
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

      {/* ── Quiz zaino — inline desktop, drawer mobile ─────────────────── */}

      {/* Desktop: inline come prima */}
      <div className="hidden md:block mt-32">
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

      {/* Mobile: bottone sticky + bottom drawer */}
      <div className="md:hidden">
        {/* Bottone fisso in basso */}
        <AnimatePresence>
          {!drawerOpen && (
            <motion.button
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              onClick={() => setDrawerOpen(true)}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-6 py-4 rounded-full text-white font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-transform"
              style={{
                background: "linear-gradient(135deg, #81ccb0, #5aaadd)",
                boxShadow: "0 8px 32px rgba(90,170,221,0.35)",
              }}
            >
              <Sparkles size={14} />
              Trova il tuo corso
            </motion.button>
          )}
        </AnimatePresence>

        {/* Backdrop */}
        <AnimatePresence>
          {drawerOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Drawer */}
        <AnimatePresence>
          {drawerOpen && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[2rem] overflow-hidden"
              style={{
                background: "#f5f2ed",
                maxHeight: "92dvh",
                boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
              }}
            >
              {/* Handle + header */}
              <div className="flex flex-col items-center pt-3 pb-1 px-5">
                <div className="w-10 h-1 rounded-full bg-stone-300 mb-3" />
                <div className="flex items-center justify-between w-full mb-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-sky">
                    Non sai da dove iniziare?
                  </p>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 active:scale-90 transition-transform"
                    style={{ background: "rgba(0,0,0,0.06)" }}
                  >
                    ✕
                  </button>
                </div>
              </div>
              {/* Quiz scrollabile */}
              <div className="overflow-y-auto px-4 pb-8" style={{ maxHeight: "calc(92dvh - 72px)" }}>
                <ZainoQuiz onScrollToCourses={() => {
                  setDrawerOpen(false);
                  setTimeout(() => {
                    coursesGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 380);
                }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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