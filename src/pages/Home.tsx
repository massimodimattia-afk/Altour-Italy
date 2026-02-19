// src/pages/Home.tsx
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
    <div className="min-h-screen bg-[#f5f2ed]">
      {/* HERO SECTION - VERSIONE TENUE ED ELEGANTE */}
      <section className="relative h-[85vh] flex items-center justify-center py-20 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20220904_150458%20(1).webp"
            className="w-full h-full object-cover object-[85%_center] md:object-center brightness-[0.90] contrast-[1.02] saturate-[0.95] transition-transform duration-[20s] scale-105"
            alt="Dolomiti Altour Italy"
          />
          {/* GRADIENTE ULTRA-MORBIDO: Transizione fluida verso il crema senza stacchi */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/5 via-[65%] to-[#f5f2ed] to-[98%]" />
        </div>

        <div className="relative z-10 text-center max-w-3xl">
          {/* LOGO CON OMBRA MORBIDA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative inline-block mb-8 group"
          >
            <div className="absolute -inset-8 bg-white/5 rounded-full blur-3xl opacity-40" />
            <img
              src="/altour-logo.png"
              className="relative w-36 h-36 md:w-44 md:h-44 mx-auto rounded-[2.5rem] shadow-2xl border border-white/10 object-cover"
              alt="Logo Altour"
            />
          </motion.div>

          {/* HERO TITLE - STILE REPLICATO DALL'INTRO */}
          <div className="flex flex-col items-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter drop-shadow-2xl leading-none"
            >
              Altour
            </motion.h1>
            <p className="text-sm md:text-xl font-bold uppercase tracking-[0.5em] text-stone-200 opacity-90 -mt-2 md:-mt-3">
              Italy
            </p>
          </div>

          {/* SOTTOTITOLO (Mantenuto originale) */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm md:text-base text-stone-200 mt-6 mb-10 font-bold uppercase tracking-[0.4em] opacity-80"
          >
            Escursioni e Tour in natura dal 2016
          </motion.p>

          <button
            onClick={() => onBookingClick("Informazioni Generali")}
            className="bg-brand-sky hover:bg-white hover:text-brand-sky text-white px-10 py-4 rounded-full font-black uppercase text-sm tracking-[0.2em] transition-all flex items-center gap-3 mx-auto shadow-xl shadow-black/10 active:scale-95"
          >
            <Calendar size={18} />
            <span>Prenota un'esperienza</span>
          </button>
        </div>
      </section>

      {/* SEZIONE GIFT VOUCHER - SLIM & MINIMAL */}
      <section className="max-w-4xl mx-auto px-4 py-8 -mt-8 relative z-20">
        <div className="bg-white/70 backdrop-blur-md rounded-[2rem] p-6 md:p-10 border border-white shadow-2xl shadow-stone-300/40 relative overflow-hidden group">
          {/* Sottile linea decorativa stile ticket */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-brand-sky rounded-r-full" />

          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
            {/* Icona Leggera */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-[#f5f2ed] rounded-2xl flex items-center justify-center text-brand-sky group-hover:scale-110 transition-transform duration-500">
                <Gift size={32} strokeWidth={1.5} />
              </div>
            </div>

            {/* Testi Puliti */}
            <div className="flex-grow text-center md:text-left">
              <h2 className="text-xl md:text-2xl font-black text-brand-stone uppercase tracking-tight mb-1">
                Scopri i Voucher Altour
              </h2>
              <p className="text-stone-500 text-sm md:text-base font-medium max-w-md">
                Regala un'esperienza Altour a te stesso o a chi ami.
              </p>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.2em] mt-2 italic">
                Scegli tu l'importo e scrivici per ricevere il tuo codice!
              </p>
            </div>

            {/* Bottone Snello */}
            <div className="w-full md:w-auto">
              <button
                onClick={() => onBookingClick("Richiesta Gift Voucher")}
                className="w-full md:w-auto bg-brand-stone text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-brand-sky transition-all shadow-lg active:scale-95"
              >
                Regala un'esperienza
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SEZIONE PROSSIME USCITE - "TRACCIA IL TUO CAMMINO" */}
      <section className="max-w-6xl mx-auto px-4 py-32">
        <div className="flex justify-between items-end mb-10 px-2">
          <div>
            <h2 className="text-3xl font-black text-stone-900 uppercase tracking-tight">
              Scegli tu la meta, noi pensiamo al resto
            </h2>
            <div className="h-1.5 w-16 bg-brand-sky mt-3" />
          </div>
          <button
            onClick={() => onNavigate("escursioni")}
            className="text-brand-sky font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform active:scale-95"
          >
            Vedi tutte <TrendingUp size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredHikes.map((esc) => (
            <div
              key={esc.id}
              className="bg-white rounded-[2rem] shadow-xl shadow-stone-200/50 overflow-hidden border border-white flex flex-col group hover:shadow-2xl hover:shadow-stone-300/40 hover:-translate-y-2 transition-all duration-500"
            >
              <div className="h-56 bg-stone-200 relative overflow-hidden">
                {esc.immagine_url && (
                  <img
                    src={esc.immagine_url}
                    alt={esc.titolo}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                )}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter text-brand-stone">
                  {esc.difficolta}
                </div>
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <p className="text-brand-sky font-bold text-xs uppercase mb-2">
                  <Calendar size={12} className="inline mr-1" /> Su richiesta
                </p>
                <h2 className="text-xl font-black mb-6 text-brand-stone uppercase line-clamp-2">
                  {esc.titolo}
                </h2>
                <p className="text-stone-500 text-sm mb-6 line-clamp-3 font-medium flex-grow">
                  {esc.descrizione}
                </p>

                <div className="flex gap-3 mt-auto">
                  <button
                    onClick={() => openDetails(esc)}
                    className="flex-1 border-2 border-brand-stone text-brand-stone py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-brand-stone hover:text-white transition-all active:scale-95"
                  >
                    Info
                  </button>
                  <button
                    onClick={() => onBookingClick(esc.titolo)}
                    className="flex-[2] bg-brand-sky text-white py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-brand-stone transition-all shadow-lg shadow-brand-sky/20 active:scale-95"
                  >
                    Richiedi Info
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SEZIONE CORSI */}
      <section className="bg-[#f5f2ed] py-32 text-brand-stone relative">
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <Award className="w-12 h-12 text-brand-sky mx-auto mb-4" />
            <h2 className="text-4xl font-black uppercase tracking-tight text-brand-stone">
              Accademia Altour
            </h2>
            {/* Una piccola linea decorativa per dare importanza */}
            <div className="h-1 w-20 bg-brand-sky mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((corso) => (
              <div
                key={corso.id}
                className="bg-white rounded-[2rem] shadow-xl shadow-stone-200/50 overflow-hidden border border-white flex flex-col group hover:shadow-2xl hover:shadow-stone-300/40 hover:-translate-y-2 transition-all duration-500"
              >
                <div className="h-48 bg-stone-200 relative overflow-hidden">
                  {corso.immagine_url && (
                    <img
                      src={corso.immagine_url}
                      alt={corso.titolo}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  )}
                  <div className="absolute top-4 left-4 bg-brand-stone text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    {corso.categoria}
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-grow text-brand-stone">
                  <h2 className="text-xl font-black mb-4 uppercase line-clamp-2">
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
                        className="flex-1 border-2 border-brand-stone text-brand-stone py-4 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-brand-stone hover:text-white transition-all active:scale-95"
                      >
                        Info
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
