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

  // Tagli predefiniti per i voucher
  const presetVouchers = [10, 20, 50, 100];

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
      {/* 1. HERO SECTION */}
      <section className="relative h-[75vh] md:h-screen flex items-center justify-center py-10 px-4 md:px-8 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20220904_150458%20(1).webp"
            className="w-full h-full object-cover object-[center_20%] brightness-[0.8] contrast-[1.02] transition-transform duration-[20s] scale-105"
            alt="Dolomiti Altour Italy"
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
              className="relative w-28 h-28 md:w-44 md:h-44 mx-auto rounded-[2.5rem] shadow-2xl border border-white/10 object-cover"
              alt="Logo Altour"
            />
          </motion.div>

          <div className="flex flex-col items-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl md:text-6xl font-black text-white uppercase tracking-tighter drop-shadow-2xl leading-none"
            >
              Altour
            </motion.h1>
            <p className="text-sm md:text-2xl font-bold uppercase tracking-[0.5em] text-stone-200 opacity-90 mt-2">
              Italy
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-xl py-4 md:py-6 px-4 md:px-8 rounded-[2rem] md:rounded-full border border-white/20 shadow-2xl mx-auto max-w-4xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 md:gap-y-0 divide-y md:divide-y-0 md:divide-x divide-white/10">
              {[
                {
                  value: "10 anni",
                  label: "Di Esperienza",
                  icon: <TrendingUp size={18} />,
                },
                {
                  value: "AIGAE",
                  label: "Guide Certificate",
                  icon: <Shield size={18} />,
                },
                {
                  value: "800+",
                  label: "Escursionisti Soddisfatti",
                  icon: <Users size={18} />,
                },
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  className="px-4 md:px-6 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.1, type: "spring" }}
                    className="flex-shrink-0 w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-brand-sky"
                  >
                    {stat.icon}
                  </motion.div>
                  <div className="text-center md:text-left pt-2 md:pt-0">
                    <p className="text-xl md:text-2xl font-black text-white leading-none mb-1">
                      {stat.value}
                    </p>
                    <p className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-stone-300 font-bold">
                      {stat.label}
                    </p>
                  </div>
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
                    className="flex-1 border-2 border-brand-stone text-brand-stone py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:bg-stone-50 transition-all"
                  >
                    Info
                  </button>
                  <button
                    onClick={() => onBookingClick(esc.titolo)}
                    className="flex-[1.5] bg-brand-sky text-white py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-[0_10px_20px_rgba(14,165,233,0.25)] hover:bg-[#0284c7] transition-all"
                  >
                    Prenota
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
            <div className="w-20 h-20 md:w-24 md:h-24 bg-[#f5f2ed] rounded-3xl flex items-center justify-center text-brand-sky shrink-0">
              <TrendingUp size={40} strokeWidth={1.5} />
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
                Hai un'idea specifica? Progettiamo tour privati, team building
                ed eventi unici tracciando la rotta insieme a te.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onBookingClick("Esperienza su Misura")}
              className="bg-brand-stone text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg hover:bg-brand-sky transition-all flex items-center gap-3 shrink-0"
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
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-[1px] w-8 md:w-12 bg-brand-sky" />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-brand-sky">
                  Professional Training
                </span>
                <div className="h-[1px] w-8 md:w-12 bg-brand-sky" />
              </div>
              <h2 className="text-4xl md:text-5xl font-light uppercase tracking-tighter leading-none text-brand-stone">
                Accademia <span className="font-black">Altour</span>
                <span className="text-brand-sky">.</span>
              </h2>
            </motion.div>
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
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
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
                      className="flex-[1.5] bg-brand-stone text-white py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest shadow-lg hover:bg-stone-700 transition-all"
                    >
                      Iscriviti
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. VOUCHER SECTION CON TAGLI PREDEFINITI */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative group"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-sky to-brand-stone rounded-[2.5rem] blur opacity-5 group-hover:opacity-20 transition duration-1000" />
          <div className="relative bg-white rounded-[2.5rem] p-8 md:p-12 border border-stone-100 shadow-xl overflow-hidden">
            <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 flex-grow text-center md:text-left">
                <div className="shrink-0">
                  <div className="w-24 h-24 md:w-28 md:h-28 bg-[#f5f2ed] rounded-[2rem] flex items-center justify-center text-brand-sky group-hover:scale-110 transition-all duration-500">
                    <Gift size={48} strokeWidth={1.2} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                    <Star size={10} className="text-brand-sky fill-brand-sky" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-sky block">
                      Gift Experience
                    </span>
                    <Star size={10} className="text-brand-sky fill-brand-sky" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-brand-stone uppercase tracking-tighter leading-none mb-4">
                    Voucher{" "}
                    <span className="text-brand-sky italic font-light tracking-normal uppercase">
                      Regalo.
                    </span>
                  </h2>
                  <p className="text-stone-500 text-xs md:text-sm font-medium max-w-lg leading-relaxed">
                    Scegli l'importo e regala un'emozione. Il destinatario
                    riceverà un voucher utilizzabile per tutte le nostre
                    attività.
                  </p>
                </div>
              </div>

              <div className="w-full lg:w-72 shrink-0 space-y-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 text-center lg:text-left">
                  Scegli il taglio:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {presetVouchers.map((amount) => (
                    <button
                      key={amount}
                      onClick={() =>
                        onBookingClick(`Voucher Regalo da ${amount}€`)
                      }
                      className="py-4 rounded-xl border-2 border-stone-50 bg-stone-50 text-brand-stone font-black text-xs hover:border-brand-sky hover:text-brand-sky hover:bg-white transition-all active:scale-95"
                    >
                      {amount}€
                    </button>
                  ))}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    onBookingClick("Richiesta Gift Voucher Personalizzato")
                  }
                  className="w-full bg-brand-stone text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-lg group-hover:bg-brand-sky transition-all flex items-center justify-center gap-3"
                >
                  Personalizza <TrendingUp size={16} />
                </motion.button>
              </div>
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
