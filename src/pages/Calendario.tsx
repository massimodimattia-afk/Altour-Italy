import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Users, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Mountain,
  TrendingUp,
  Route
} from 'lucide-react';

// --- TIPI E INTERFACCE ---
interface Activity {
  title: string;
  type: 'Escursione' | 'Corso' | 'Evento Speciale' | 'Trek Urbano';
  difficulty: string;
  km: number;
  elevation: number; // Dislivello in metri
  duration: string;
  spots: number; // Posti disponibili
  location: string;
}

interface ActivitiesMap {
  [date: string]: Activity;
}

interface CalendarioProps {
  onBookingClick: (title: string) => void;
}

// --- MOCK DATA (Febbraio 2026) ---
const activities: ActivitiesMap = {
  "2026-02-21": { 
    title: "Ciaspolata Monte Dosso Rotondo", 
    type: "Escursione", 
    difficulty: "EAI",
    km: 8, 
    elevation: 450, 
    duration: "4h", 
    spots: 5,
    location: "Appennino Tosco-Emiliano"
  },
  "2026-02-22": { 
    title: "Corso Alpinismo Invernale (Giorno 1)", 
    type: "Corso", 
    difficulty: "F",
    km: 5, 
    elevation: 600, 
    duration: "6h", 
    spots: 2,
    location: "Terminillo"
  },
  "2026-02-28": { 
    title: "Ciaspolata al Chiar di Luna", 
    type: "Evento Speciale", 
    difficulty: "T",
    km: 6, 
    elevation: 200, 
    duration: "3h", 
    spots: 0, // Sold Out
    location: "Campo Felice"
  },
  "2026-03-07": { 
    title: "Trekking Roma Sotterranea", 
    type: "Trek Urbano", 
    difficulty: "T",
    km: 12, 
    elevation: 50, 
    duration: "5h", 
    spots: 12,
    location: "Roma Centro"
  },
};

// --- HELPER DATE ---
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  // 0 = Dom, 1 = Lun, ..., 6 = Sab. Vogliamo Lun = 0.
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; 
};

// --- COMPONENTE PRINCIPALE ---
export default function Calendario({ onBookingClick }: CalendarioProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1)); // Febbraio 2026 (mese 1 perché 0-indexed)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  // Generazione griglia giorni
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyStartDays = Array.from({ length: firstDayIndex }, (_, i) => i);

  // Formattazione data selezionata per visualizzazione
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
    setSelectedDate(null);
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    if (activities[dateStr]) {
      setSelectedDate(dateStr);
    }
  };

  const handleBooking = () => {
    if (selectedDate && activities[selectedDate].spots > 0) {
      onBookingClick(activities[selectedDate].title);
    }
  };

  const currentActivity = selectedDate ? activities[selectedDate] : null;

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#44403C] font-sans p-4 md:p-8 flex flex-col items-center">
      
      {/* --- HEADER CALENDARIO --- */}
      <div className="w-full max-w-md mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-[#44403C]">
            {currentDate.toLocaleDateString('it-IT', { month: 'long' })} 
            <span className="text-[#0ea5e9] ml-2">{year}</span>
          </h2>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">
            Seleziona la tua avventura
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handlePrevMonth}
            className="p-3 bg-white border border-stone-200 rounded-full shadow-sm hover:bg-stone-50 transition-colors"
          >
            <ChevronLeft size={20} className="text-stone-600"/>
          </button>
          <button 
            onClick={handleNextMonth}
            className="p-3 bg-white border border-stone-200 rounded-full shadow-sm hover:bg-stone-50 transition-colors"
          >
            <ChevronRight size={20} className="text-stone-600"/>
          </button>
        </div>
      </div>

      {/* --- GRIGLIA CALENDARIO --- */}
      <motion.div 
        layout
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl shadow-stone-200/50 p-6 mb-8"
      >
        {/* Giorni della settimana */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
            <div key={d} className="text-center text-[10px] font-black uppercase text-stone-400">
              {d}
            </div>
          ))}
        </div>

        {/* Giorni del mese */}
        <div className="grid grid-cols-7 gap-2">
          {emptyStartDays.map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {daysArray.map((day) => {
            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const activity = activities[dateStr];
            const isSelected = selectedDate === dateStr;

            return (
              <motion.button
                key={day}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDayClick(day)}
                disabled={!activity}
                className={`
                  aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300
                  ${!activity ? 'text-stone-300 cursor-default' : 'cursor-pointer'}
                  ${activity && !isSelected ? 'bg-white border border-[#0ea5e9]/30 hover:border-[#0ea5e9] hover:shadow-md' : ''}
                  ${isSelected ? 'bg-[#0ea5e9] text-white shadow-lg shadow-sky-200 ring-2 ring-[#0ea5e9] ring-offset-2' : ''}
                `}
              >
                <span className={`text-lg ${activity ? 'font-black' : 'font-medium'}`}>
                  {day}
                </span>
                
                {/* Badge Tipo Attività */}
                {activity && !isSelected && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-stone-100 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-[#44403C]">
                      {activity.type.charAt(0)}
                    </span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* --- SCHEDA DETTAGLIO (BOOKING CARD) --- */}
      <AnimatePresence mode='wait'>
        {currentActivity && (
          <motion.div
            key={selectedDate}
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-stone-300/50 overflow-hidden border border-stone-100 sticky bottom-4 z-10"
          >
            {/* Header Card */}
            <div className="bg-[#44403C] p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                  <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-widest">
                    {currentActivity.type}
                  </span>
                  <div className="flex items-center gap-1 text-[#0ea5e9] font-black">
                    <Mountain size={14} />
                    <span className="text-xs">{currentActivity.difficulty}</span>
                  </div>
                </div>
                <h3 className="text-xl font-black uppercase leading-tight mb-1">
                  {currentActivity.title}
                </h3>
                <div className="flex items-center gap-2 text-stone-300 text-xs">
                  <MapPin size={12} />
                  <span>{currentActivity.location}</span>
                </div>
              </div>
              
              {/* Decorazione Sfondo */}
              <Mountain className="absolute -bottom-4 -right-4 text-white/5 w-32 h-32 rotate-12" />
            </div>

            {/* Body Card */}
            <div className="p-6">
              {/* Technical Strip */}
              <div className="flex justify-between py-4 border-b border-stone-100 mb-6">
                <div className="flex flex-col items-center gap-1">
                  <Route size={18} className="text-[#0ea5e9]" />
                  <span className="text-[10px] font-black uppercase text-stone-400">Distanza</span>
                  <span className="text-sm font-bold text-stone-600">{currentActivity.km} km</span>
                </div>
                <div className="flex flex-col items-center gap-1 border-l border-r border-stone-100 px-6 w-full">
                  <TrendingUp size={18} className="text-[#0ea5e9]" />
                  <span className="text-[10px] font-black uppercase text-stone-400">Dislivello</span>
                  <span className="text-sm font-bold text-stone-600">{currentActivity.elevation} m</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Clock size={18} className="text-[#0ea5e9]" />
                  <span className="text-[10px] font-black uppercase text-stone-400">Durata</span>
                  <span className="text-sm font-bold text-stone-600">{currentActivity.duration}</span>
                </div>
              </div>

              {/* Disponibilità e Booking */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-stone-500 font-medium">
                    <CalendarIcon size={16} />
                    <span className="capitalize">{selectedDate && formatDateDisplay(selectedDate)}</span>
                  </div>
                  <div className={`flex items-center gap-2 font-bold ${currentActivity.spots > 0 ? 'text-[#0ea5e9]' : 'text-red-500'}`}>
                    <Users size={16} />
                    <span>{currentActivity.spots > 0 ? `${currentActivity.spots} posti rimasti` : 'Sold Out'}</span>
                  </div>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={currentActivity.spots === 0}
                  className={`
                    w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all
                    ${currentActivity.spots > 0 
                        ? 'bg-[#44403C] text-white shadow-xl shadow-stone-400/50 hover:bg-stone-800 active:scale-95' 
                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'}
                  `}
                >
                  {currentActivity.spots > 0 ? (
                    'Prenota il tuo posto'
                  ) : (
                    'Sold Out'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Placeholder per stato vuoto */}
      {!selectedDate && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="text-center p-8 max-w-xs"
        >
          <p className="text-stone-400 text-sm font-medium italic">
            Seleziona una data evidenziata per vedere i dettagli dell'avventura.
          </p>
        </motion.div>
      )}

    </div>
  );
}
