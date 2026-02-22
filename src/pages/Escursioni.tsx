import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Database } from "../types/supabase";
import ActivityDetailModal from "../components/ActivityDetailModal";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Navigation } from "lucide-react";

type Escursione = Database["public"]["Tables"]["escursioni"]["Row"];

interface EscursioniPageProps {
  onNavigate: (page: string) => void;
  onBookingClick: (title: string) => void;
}

export default function EscursioniPage({
  onBookingClick,
}: EscursioniPageProps) {
  const [escursioni, setEscursioni] = useState<Escursione[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Escursione | null>(
    null,
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"giornata" | "tour">("giornata");

  useEffect(() => {
    async function fetchEscursioni() {
      const { data } = await supabase
        .from("escursioni")
        .select("*")
        .order("data", { ascending: true });
      if (data) setEscursioni(data);
      setLoading(false);
    }
    fetchEscursioni();
  }, []);

  const openDetails = (esc: Escursione) => {
    setSelectedActivity(esc);
    setIsDetailOpen(true);
  };

  const filteredEscursioni = escursioni.filter(
    (esc) => esc.categoria === activeTab,
  );

  if (loading)
    return (
      <div className="p-10 text-center text-stone-400 font-bold uppercase tracking-widest text-sm">
        Caricamento in corso...
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
        <div>
          <h1 className="text-5xl font-black text-brand-stone uppercase tracking-tighter leading-none mb-4">
            Esplora la Montagna
          </h1>
          <p className="text-stone-400 font-medium uppercase tracking-widest text-xs">
            Scegli il ritmo della tua avventura
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-brand-glacier p-2 rounded-2xl flex gap-1 border border-stone-100 self-start">
          <button
            onClick={() => setActiveTab("giornata")}
            className={`relative px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === "giornata"
                ? "text-white"
                : "text-stone-400 hover:text-brand-stone"
            }`}
          >
            {activeTab === "giornata" && (
              <motion.div
                layoutId="tab-bg"
                className="absolute inset-0 bg-brand-stone rounded-xl shadow-lg"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">Esperienze in Giornata</span>
          </button>
          <button
            onClick={() => setActiveTab("tour")}
            className={`relative px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === "tour"
                ? "text-white"
                : "text-stone-400 hover:text-brand-stone"
            }`}
          >
            {activeTab === "tour" && (
              <motion.div
                layoutId="tab-bg"
                className="absolute inset-0 bg-brand-stone rounded-xl shadow-lg"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">Tour</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredEscursioni.length > 0 ? (
            filteredEscursioni.map((esc) => (
              <div
                key={esc.id}
                className="bg-white rounded-[2.5rem] shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100 flex flex-col group hover:shadow-2xl transition-all duration-500"
              >
                <div className="h-64 bg-stone-200 relative overflow-hidden">
                  {esc.immagine_url && (
                    <img
                      src={esc.immagine_url}
                      alt={esc.titolo}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                  )}
                  <div className="absolute top-6 right-6 flex flex-col gap-2 items-end">
                    <div className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter text-brand-stone shadow-sm border border-white/20">
                      {esc.difficolta}
                    </div>
                    <div className="bg-brand-sky px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter text-white shadow-sm flex items-center gap-2">
                      <Navigation size={10} />
                      {esc.categoria === "giornata" ? "Giornata" : "Multi-day"}
                    </div>
                  </div>
                </div>
                <div className="p-8 md:p-10 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 text-brand-sky font-black text-[10px] uppercase tracking-widest mb-4">
                    <Calendar size={14} />
                    Su richiesta
                  </div>
                  <h2 className="text-2xl font-black mb-6 text-brand-stone uppercase tracking-tight leading-tight group-hover:text-brand-sky transition-colors">
                    {esc.titolo}
                  </h2>
                  <p className="text-stone-500 text-sm mb-8 line-clamp-3 font-medium flex-grow leading-relaxed">
                    {esc.descrizione}
                  </p>

                  <div className="flex gap-3 mt-auto pt-8 border-t border-stone-50">
                    <button
                      onClick={() => openDetails(esc)}
                      className="flex-1 border-2 border-brand-stone text-brand-stone py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-stone hover:text-white transition-all active:scale-95"
                    >
                      Dettagli
                    </button>
                    <button
                      onClick={() => onBookingClick(esc.titolo)}
                      className="flex-[2] bg-brand-sky text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-stone transition-all shadow-xl shadow-brand-sky/20 active:scale-95"
                    >
                      Richiedi Info
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 px-8 rounded-[3rem] bg-brand-glacier border-2 border-dashed border-stone-200 text-center">
              <div className="max-w-md mx-auto">
                <h3 className="text-2xl font-black text-brand-stone uppercase mb-4 tracking-tighter">
                  Nessuna avventura in programma?
                </h3>
                <p className="text-stone-500 font-medium mb-8">
                  Non abbiamo ancora caricato tour per questa categoria, ma
                  possiamo organizzarne uno su misura per te.
                </p>
                <button
                  onClick={() =>
                    onBookingClick("Richiesta Tour Personalizzato")
                  }
                  className="bg-brand-stone text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-brand-sky transition-all shadow-lg"
                >
                  Richiedi un tour personalizzato
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onBook={onBookingClick}
      />
    </div>
  );
}
