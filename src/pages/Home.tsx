import { useEffect, useState } from "react";
import { Calendar, Award, TrendingUp, Gift } from "lucide-react";
import { supabase } from "../lib/supabase";
import ActivityDetailModal from "../components/ActivityDetailModal";
import { motion } from "framer-motion";

interface HomeProps {
  onNavigate: (page: string) => void;
  onBookingClick: (title: string) => void;
}

export default function Home({ onNavigate, onBookingClick }: HomeProps) {
  const [featuredHikes, setFeaturedHikes] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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
        if (hikes) setFeaturedHikes(hikes);
        if (crs) setCourses(crs);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const openDetails = (activity: any) => {
    setSelectedActivity(activity);
    setIsDetailOpen(true);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f2ed] text-brand-stone font-bold uppercase tracking-widest text-xs">
        Caricamento...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#f5f2ed] overflow-x-hidden">
      {/* 1. HERO SECTION - MOBILE OPTIMIZED */}
      <section className="relative h-[80vh] md:h-[85vh] flex items-center justify-center py-10 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20220904_150458%20(1).webp"
            className="w-full h-full object-cover object-[85%_center] md:object-center brightness-[0.85] contrast-[1.02] transition-transform duration-[20s] scale-105"
            alt="Dolomiti Altour Italy"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 via-[65%] to-[#f5f2ed]" />
        </div>

        <div className="relative z-10 text-center max-w-3xl w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative inline-block mb-6 md:mb-8"
          >
            <div className="absolute -inset-8 bg-white/5 rounded-full blur-3xl opacity-40" />
            <img
              src="/altour-logo.png"
              className="relative w-28 h-28 md:w-44 md:h-44 mx-auto rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border border-white/10 object-cover"
              alt="Logo Altour"
            />
          </motion.div>

          <div className="flex flex-col items-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter drop-shadow-2xl leading-none"
            >
              Altour
            </motion.h1>
            <p className="text-xs md:text-xl font-bold uppercase tracking-[0.4em] md:tracking-[0.5em] text-stone-200 opacity-90 mt-1 md:mt-4">
              Italy
            </p>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-[10px] md:text-base text-stone-200 mt-6 mb-8 md:mb-10 font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] opacity-80 px-4"
          >
            Escursioni e Tour in natura dal 2016
          </motion.p>

          <button
            onClick={() => onBookingClick("Informazioni Generali")}
            className="bg-brand-sky hover:bg-white hover:text-brand-sky text-white px-8 md:px-10 py-3.5 md:py-4 rounded-full font-black uppercase text-xs tracking-[0.1em] transition-all flex items-center gap-2 mx-auto shadow-xl active:scale-95"
          >
            <Calendar size={16} />
            <span>Prenota un'esperienza</span>
          </button>
        </div>
      </section>

      {/* 2. ESCURSIONI SECTION */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-4 px-2">
          <div className="max-w-md">
            <h2 className="text-2xl md:text-4xl font-black text-stone-900 uppercase tracking-tight leading-tight">
              Scegli la meta,
              <br className="hidden md:block" /> noi pensiamo al resto.
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
                {esc.immagine_url && (
                  <img
                    src={esc.immagine_url}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    alt={esc.titolo}
                  />
                )}
                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-[9px] font-black uppercase text-brand-stone shadow-sm">
                  {esc.difficolta}
                </div>
              </div>
              <div className="p-5 md:p-8 flex flex-col flex-grow">
                <p className="text-brand-sky font-bold text-[10px] uppercase mb-2 flex items-center">
                  <Calendar size={12} className="mr-1.5" /> Su richiesta
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
                    className="flex-1 border-2 border-brand-stone text-brand-stone py-3 md:py-4 rounded-xl font-bold uppercase text-[9px] tracking-wider"
                  >
                    Info
                  </button>
                  <button
                    onClick={() => onBookingClick(esc.titolo)}
                    className="flex-[1.5] bg-brand-sky text-white py-3 md:py-4 rounded-xl font-bold uppercase text-[9px] tracking-wider shadow-md"
                  >
                    Prenota
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. VOUCHER SECTION - ANIMATA */}
      <section className="max-w-4xl mx-auto px-4 py-12 md:py-16 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-white/90 backdrop-blur-md rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-10 border border-stone-200/60 shadow-xl relative overflow-hidden group"
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 md:h-12 bg-brand-sky rounded-r-full group-hover:h-full transition-all duration-500" />

          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-10 relative z-10">
            <div className="hidden md:flex flex-shrink-0">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-[#f5f2ed] rounded-2xl flex items-center justify-center text-brand-sky group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <Gift size={32} strokeWidth={1.5} />
              </div>
            </div>

            <div className="flex-grow text-center md:text-left">
              <h2 className="text-lg md:text-2xl font-black text-brand-stone uppercase tracking-tight">
                Voucher Altour
              </h2>
              <p className="text-stone-500 text-xs md:text-base font-medium mt-1">
                Regala un'esperienza autentica a chi ami.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onBookingClick("Richiesta Gift Voucher")}
              className="w-full md:w-auto bg-brand-stone text-white px-8 py-3.5 md:py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg hover:bg-brand-sky transition-colors duration-300"
            >
              Regala ora
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* 4. ACCADEMIA SECTION */}
      <section className="bg-stone-100 py-12 md:py-20 text-brand-stone">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10 md:mb-16">
            <Award className="w-10 h-10 md:w-12 md:h-12 text-brand-sky mx-auto mb-3" />
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
              Accademia Altour
            </h2>
            <div className="h-1 w-16 bg-brand-sky mx-auto mt-3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {courses.map((corso) => (
              <div
                key={corso.id}
                className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-lg overflow-hidden flex flex-col group"
              >
                <div className="h-40 md:h-48 relative overflow-hidden">
                  {corso.immagine_url && (
                    <img
                      src={corso.immagine_url}
                      className="w-full h-full object-cover group-hover:scale-105 transition-duration-700"
                      alt={corso.titolo}
                    />
                  )}
                  <div className="absolute top-3 left-3 bg-brand-stone text-white px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest">
                    {corso.categoria}
                  </div>
                </div>
                <div className="p-6 md:p-8 flex flex-col flex-grow">
                  <h3 className="text-lg md:text-xl font-black mb-3 uppercase line-clamp-2 leading-snug">
                    {corso.titolo}
                  </h3>
                  <p className="text-stone-500 text-xs md:text-sm mb-6 line-clamp-2 md:line-clamp-3 font-medium leading-relaxed">
                    {corso.descrizione}
                  </p>
                  <div className="mt-auto pt-4 border-t border-stone-100">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-stone-400 font-bold text-[9px] uppercase tracking-widest">
                        {corso.durata}
                      </span>
                      <span className="text-xl md:text-2xl font-black text-brand-sky">
                        €{corso.prezzo}
                      </span>
                    </div>
                    <div className="flex gap-2 md:gap-3">
                      <button
                        onClick={() => openDetails(corso)}
                        className="flex-1 border-2 border-brand-stone py-3 rounded-xl font-bold uppercase text-[9px] tracking-widest"
                      >
                        Scopri
                      </button>
                      <button
                        onClick={() => onBookingClick(corso.titolo)}
                        className="flex-[1.5] bg-brand-stone text-white py-3 rounded-xl font-bold uppercase text-[9px] tracking-widest"
                      >
                        Iscriviti
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
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
