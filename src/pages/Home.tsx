import { useEffect, useState } from "react";
import {
  Calendar,
  TrendingUp,
  Gift,
  Star,
  Send,
  Shield,
  Users,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import ActivityDetailModal from "../components/ActivityDetailModal";
import { motion } from "framer-motion";

// FIX: Estensione tipi per supportare la nuova colonna Supabase
type Escursione = Database["public"]["Tables"]["escursioni"]["Row"] & {
  posti_disponibili: number;
};
type Corso = Database["public"]["Tables"]["corsi"]["Row"] & {
  posti_disponibili: number;
};
type Activity = Escursione | Corso;

interface HomeProps {
  onNavigate: (page: string) => void;
  onBookingClick: (title: string) => void;
}

const SkeletonCard = () => (
  <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-lg overflow-hidden flex flex-col">
    <div className="h-48 md:h-56 bg-stone-100 animate-pulse" />
    <div className="p-5 md:p-8 flex flex-col gap-3">
      <div className="h-2 w-24 bg-stone-100 rounded animate-pulse" />
      <div className="h-5 w-3/4 bg-stone-200 rounded animate-pulse" />
      <div className="space-y-2">
        <div className="h-2 w-full bg-stone-50 rounded animate-pulse" />
        <div className="h-2 w-5/6 bg-stone-50 rounded animate-pulse" />
      </div>
      <div className="flex gap-2 mt-2">
        <div className="h-12 flex-1 bg-stone-100 rounded-2xl animate-pulse" />
        <div className="h-12 flex-[1.5] bg-stone-100 rounded-2xl animate-pulse" />
      </div>
    </div>
  </div>
);

const IMG_FALLBACK = "/altour-logo.png";

export default function Home({ onNavigate, onBookingClick }: HomeProps) {
  const [featuredHikes, setFeaturedHikes] = useState<Escursione[]>([]);
  const [courses, setCourses] = useState<Corso[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const presetVouchers = [10, 20, 60, 100, 200, 300];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: hikes } = await supabase
          .from("escursioni")
          .select("*")
          .order("data", { ascending: true })
          .limit(4);
        const { data: crs } = await supabase.from("corsi").select("*").limit(4);
        if (hikes) setFeaturedHikes(hikes as Escursione[]);
        if (crs) setCourses(crs as Corso[]);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const openDetails = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsDetailOpen(true);
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#f5f2ed] overflow-x-hidden">
        <div className="h-[80vh] md:h-screen bg-stone-200 animate-pulse" />
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3].map((n) => (
              <SkeletonCard key={n} />
            ))}
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f5f2ed] overflow-x-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative h-[80vh] md:h-screen flex items-center justify-center py-10 px-4 md:px-8 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20220904_150458%20(1).webp"
            className="w-full h-full object-cover object-[center_20%] brightness-[0.8] contrast-[1.02] transition-transform duration-[20s] scale-105"
            alt="Dolomiti Altour Italy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.src = IMG_FALLBACK;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/10 via-[70%] to-[#f5f2ed] to-[98%]" />
        </div>

        <div className="relative z-10 text-center max-w-5xl w-full px-2 mt-[-5vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative inline-block mb-6 md:mb-10"
          >
            <div className="absolute -inset-8 bg-white/5 rounded-full blur-3xl opacity-40" />
            <img
              src="/altour-logo.png"
              className="relative w-20 h-20 md:w-44 md:h-44 mx-auto rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl border border-white/10 object-cover"
              alt="Logo Altour"
            />
          </motion.div>

          <div className="flex flex-col items-center mb-10 md:mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter drop-shadow-2xl leading-none"
            >
              Altour
            </motion.h1>
            <p className="text-[10px] md:text-2xl font-bold uppercase tracking-[0.5em] text-stone-200 opacity-90 mt-2">
              Italy
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-xl py-4 md:py-6 px-2 md:px-8 rounded-[1.5rem] md:rounded-full border border-white/20 shadow-2xl mx-auto max-w-4xl"
          >
            <div className="grid grid-cols-3 gap-0 divide-x divide-white/10">
              {[
                {
                  value: "10 anni",
                  label: "Exp.",
                  icon: <TrendingUp size={14} />,
                },
                { value: "AIGAE", label: "Guide", icon: <Shield size={14} /> },
                { value: "800+", label: "Clienti", icon: <Users size={14} /> },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center justify-center px-1"
                >
                  <div className="text-brand-sky mb-1 md:hidden">
                    {stat.icon}
                  </div>
                  <p className="text-xs md:text-2xl font-black text-white leading-none">
                    {stat.value}
                  </p>
                  <p className="text-[7px] md:text-[10px] uppercase tracking-widest text-stone-300 font-bold mt-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. ESCURSIONI SECTION */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-4 px-2">
          <div className="max-w-md">
            <h2 className="text-2xl md:text-4xl font-black text-stone-900 uppercase tracking-tight leading-tight">
              Scegli la meta, <br className="hidden md:block" /> noi pensiamo al
              resto.
            </h2>
            <div className="h-1 w-12 bg-brand-sky mt-3" />
          </div>
          <button
            onClick={() => onNavigate("escursioni")}
            className="text-brand-sky font-black uppercase text-[10px] tracking-widest flex items-center gap-2 self-end md:self-auto"
          >
            Vedi tutte <TrendingUp size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {featuredHikes.map((esc) => (
            <div
              key={esc.id}
              className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-lg overflow-hidden flex flex-col group"
            >
              <div className="h-48 md:h-56 relative overflow-hidden">
                <img
                  src={esc.immagine_url || IMG_FALLBACK}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt={esc.titolo}
                  loading="lazy"
                />
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-[9px] font-black uppercase text-brand-stone shadow-sm">
                  {esc.difficolta}
                </div>
              </div>
              <div className="p-5 md:p-8 flex flex-col flex-grow">
                {/* URGENZA POSTI */}
                <div className="mb-4 flex items-center gap-2">
                  {esc.posti_disponibili > 0 ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        {esc.posti_disponibili <= 3 && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        )}
                        <span
                          className={`relative inline-flex rounded-full h-2 w-2 ${esc.posti_disponibili <= 3 ? "bg-red-500" : "bg-orange-500"}`}
                        ></span>
                      </span>
                      <p
                        className={`text-[10px] font-black uppercase tracking-widest ${esc.posti_disponibili <= 3 ? "text-red-600" : "text-orange-600"}`}
                      >
                        {esc.posti_disponibili <= 3
                          ? `SOLO ${esc.posti_disponibili} POSTI RIMASTI!`
                          : `${esc.posti_disponibili} posti disponibili`}
                      </p>
                    </>
                  ) : (
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                      Esaurito / Sold Out
                    </p>
                  )}
                </div>
                <p className="text-brand-sky font-bold text-[10px] uppercase mb-2 flex items-center">
                  <Calendar size={12} className="mr-1.5" />
                  {esc.data
                    ? new Date(esc.data).toLocaleDateString("it-IT", {
                        day: "2-digit",
                        month: "long",
                      })
                    : "Su richiesta"}
                </p>
                <h3 className="text-lg md:text-xl font-black mb-3 md:mb-4 text-brand-stone uppercase line-clamp-2">
                  {esc.titolo}
                </h3>
                <p className="text-stone-500 text-xs md:text-sm mb-6 line-clamp-3 font-medium flex-grow leading-relaxed">
                  {esc.descrizione}
                </p>
                <div className="flex gap-2 md:gap-3">
                  <button
                    onClick={() => openDetails(esc)}
                    className="flex-1 border-2 border-brand-stone text-brand-stone py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-stone-50 transition-all"
                  >
                    Info
                  </button>
                  <button
                    onClick={() =>
                      esc.posti_disponibili > 0 && onBookingClick(esc.titolo)
                    }
                    disabled={esc.posti_disponibili <= 0}
                    className={`flex-[1.5] py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all ${esc.posti_disponibili > 0 ? "bg-brand-sky text-white shadow-lg hover:bg-[#0284c7]" : "bg-stone-200 text-stone-400 cursor-not-allowed"}`}
                  >
                    {esc.posti_disponibili > 0 ? "Prenota" : "Completo"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. TAILOR-MADE SECTION */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="relative bg-white rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden group">
          <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10 text-center md:text-left">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-[#f5f2ed] rounded-2xl md:rounded-3xl flex items-center justify-center text-brand-sky shrink-0">
              <TrendingUp size={32} strokeWidth={1.5} />
            </div>
            <div className="flex-grow">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-sky mb-2 block">
                Progetti Personalizzati
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-brand-stone uppercase tracking-tighter leading-none mb-3">
                Avventura{" "}
                <span className="text-brand-sky italic font-light tracking-normal">
                  su misura.
                </span>
              </h2>
              <p className="text-stone-500 text-xs md:text-sm font-medium max-w-lg leading-relaxed">
                Hai un'idea specifica? Progettiamo tour privati e team building
                tracciando la rotta insieme a te.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onBookingClick("Esperienza su Misura")}
              className="w-full md:w-auto bg-brand-stone text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg hover:bg-brand-sky transition-all flex items-center justify-center gap-3 shrink-0"
            >
              <span>Contattaci</span>
              <Send size={14} />
            </motion.button>
          </div>
        </div>
      </section>

      {/* 4. ACCADEMIA SECTION */}
      <section className="bg-stone-100 py-12 md:py-20 text-brand-stone">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-4xl md:text-5xl font-light uppercase tracking-tighter leading-none text-brand-stone">
              Accademia <span className="font-black">Altour</span>
              <span className="text-brand-sky">.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {courses.map((corso) => (
              <div
                key={corso.id}
                className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-lg overflow-hidden flex flex-col group"
              >
                <div className="h-40 md:h-48 relative overflow-hidden">
                  <img
                    src={corso.immagine_url || IMG_FALLBACK}
                    className="w-full h-full object-cover"
                    alt={corso.titolo}
                  />
                  <div className="absolute top-3 left-3 bg-brand-stone text-white px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest">
                    {corso.categoria}
                  </div>
                </div>
                <div className="p-6 md:p-8 flex flex-col flex-grow">
                  <div className="mb-4 flex items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-sky">
                      Iscrizioni aperte
                    </p>
                  </div>
                  <h3 className="text-lg md:text-xl font-black mb-3 uppercase line-clamp-2">
                    {corso.titolo}
                  </h3>
                  <p className="text-stone-500 text-xs md:text-sm mb-6 line-clamp-2 font-medium leading-relaxed">
                    {corso.descrizione}
                  </p>
                  <div className="mt-auto pt-4 border-t border-stone-100 flex gap-2 md:gap-3">
                    <button
                      onClick={() => openDetails(corso)}
                      className="flex-1 border-2 border-brand-stone text-brand-stone py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-stone-50 transition-all"
                    >
                      Scopri
                    </button>
                    <button
                      onClick={() => onBookingClick(corso.titolo)}
                      className="flex-[1.5] py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all bg-brand-sky text-white shadow-lg hover:bg-[#0284c7]"
                    >
                      Richiedi info
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. VOUCHER SECTION */}
      <section className="max-w-5xl mx-auto px-4 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Glow visibile */}
          <div className="absolute -inset-1 bg-gradient-to-br from-brand-sky/30 to-brand-stone/20 rounded-[2rem] md:rounded-[2.5rem] blur-xl opacity-40 pointer-events-none" />

          <div className="relative bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-stone-100 shadow-xl">
            {/* Header con sfondo tono-su-tono */}
            <div className="bg-[#f5f2ed] px-6 md:px-12 pt-8 md:pt-10 pb-6 md:pb-8 flex flex-col md:flex-row items-center gap-4 md:gap-8 text-center md:text-left border-b border-stone-100">
              <div className="shrink-0 relative">
                {/* Glow dietro icona */}
                <div className="absolute inset-0 bg-brand-sky/20 rounded-[2rem] blur-xl" />
                <div className="relative w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl md:rounded-[1.5rem] flex items-center justify-center text-brand-sky shadow-md border border-white/80">
                  <Gift size={28} className="md:w-9 md:h-9" strokeWidth={1.5} />
                </div>
              </div>

              <div className="flex-grow">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5">
                  <Star size={7} className="text-brand-sky fill-brand-sky" />
                  <span className="text-[8px] font-black uppercase tracking-[0.35em] text-brand-sky">
                    Gift Experience
                  </span>
                  <Star size={7} className="text-brand-sky fill-brand-sky" />
                </div>
                <h2 className="text-2xl md:text-4xl font-black text-brand-stone uppercase tracking-tighter leading-none mb-2">
                  Regala un'
                  <span className="text-brand-sky italic font-light tracking-normal">
                    avventura.
                  </span>
                </h2>
                <p className="text-stone-500 text-[11px] md:text-sm font-medium max-w-md leading-relaxed">
                  Un'emozione in montagna per chi ami — utilizzabile per
                  escursioni, corsi e tour privati.
                </p>
              </div>
            </div>

            {/* Body: preset + CTA */}
            <div className="px-6 md:px-12 py-6 md:py-8">
              <p className="text-[8px] font-black uppercase tracking-widest text-stone-400 mb-4 text-center md:text-left">
                Scegli l'importo e apri il modulo regalo
              </p>

              {/* Preset grid — 2 col mobile, 3 su md, 6 su lg */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4">
                {presetVouchers.map((amount, idx) => {
                  const tag =
                    idx === 0
                      ? "Starter"
                      : idx === 2
                        ? "Più scelto"
                        : idx === 4
                          ? "Premium"
                          : null;
                  const isHighlighted = idx === 2;

                  return (
                    <motion.button
                      key={amount}
                      whileHover={{ y: -2, scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() =>
                        onBookingClick(`Voucher Regalo da ${amount}€`)
                      }
                      className={`relative flex flex-col items-center justify-center py-4 md:py-5 rounded-2xl font-black transition-all border-2 ${
                        isHighlighted
                          ? "border-brand-sky bg-brand-sky text-white shadow-lg shadow-sky-100"
                          : "border-stone-100 bg-stone-50 text-brand-stone hover:border-brand-sky hover:text-brand-sky hover:bg-white hover:shadow-md"
                      }`}
                    >
                      {tag && (
                        <span
                          className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[7px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap ${
                            isHighlighted
                              ? "bg-brand-stone text-white"
                              : "bg-stone-200 text-stone-500"
                          }`}
                        >
                          {tag}
                        </span>
                      )}
                      <span className="text-lg md:text-xl font-black leading-none">
                        {amount}€
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Separatore */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-stone-100" />
                <span className="text-[8px] font-black uppercase tracking-widest text-stone-300">
                  oppure
                </span>
                <div className="flex-1 h-px bg-stone-100" />
              </div>

              {/* CTA Personalizza */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  onBookingClick("Richiesta Gift Voucher Personalizzato")
                }
                className="w-full bg-brand-stone text-white py-4 md:py-5 rounded-2xl font-black uppercase text-[10px] md:text-[11px] tracking-widest shadow-lg hover:bg-brand-sky transition-all flex items-center justify-center gap-2.5"
              >
                <Gift size={14} />
                Importo personalizzato
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onBook={onBookingClick}
      />
    </div>
  );
}
