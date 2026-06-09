import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Attivitapage from './pages/Attivitapage';
import Corsi from './pages/Corsi';
import Tessera from './pages/Tessera';
import Legal from './pages/Legal';
import ChiSiamo from './pages/ChiSiamo';
import BookingModal from './components/BookingModal';
import PWAPrompt from "./components/PWAprompt";
import FeedbackPage from './pages/FeedbackPage';

// FIX: Aggiunto 'lascia-feedback' qui!
type PageType =
  | 'home'
  | 'corsi'
  | 'attivitapage'
  | 'tessera'
  | 'legal-privacy'
  | 'legal-cookie'
  | 'legal-termini'
  | 'chi-siamo'
  | 'lascia-feedback';

const VALID_PAGES: PageType[] = [
  'home', 'corsi', 'attivitapage', 'tessera',
  'legal-privacy', 'legal-cookie', 'legal-termini',
  'chi-siamo', 'lascia-feedback',
];

// Mappa per redirect (compatibilità con vecchie route)
const REDIRECT_MAP: Record<string, PageType> = {
  escursioni: 'attivitapage',
  campi: 'attivitapage',
};

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>("home");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [bookingMode, setBookingMode] = useState<'info' | 'prenota'>('info');

  // FIX 1: Scroll immediato al cambio pagina. Lo smooth scroll 
  // durante la mutazione del DOM causa sfarfallio grave su iOS.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPage]);

  const handleNavigate = (page: string) => {
    const target = REDIRECT_MAP[page] ?? page;
    if (VALID_PAGES.includes(target as PageType)) {
      setCurrentPage(target as PageType);
    }
  };

  const openBooking = (title: string, mode: 'info' | 'prenota' = 'info') => {
    setSelectedTitle(title);
    setBookingMode(mode);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Attendi la fine dell'animazione di uscita prima di pulire il titolo
    setTimeout(() => setSelectedTitle(''), 500);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':          return <Home onNavigate={handleNavigate} onBookingClick={openBooking} />;
      case 'corsi':         return <Corsi onNavigate={handleNavigate} onBookingClick={openBooking} />;
      case 'attivitapage':  return <Attivitapage onNavigate={handleNavigate} onBookingClick={openBooking} />;
      case 'tessera':       return <Tessera />;
      case 'legal-privacy': return <Legal initialTab="privacy" />;
      case 'legal-cookie':  return <Legal initialTab="cookie" />;
      case 'legal-termini': return <Legal initialTab="termini" />;
      case 'chi-siamo':     return <ChiSiamo onNavigate={handleNavigate} onBookingClick={openBooking} />;
      case 'lascia-feedback': return <FeedbackPage onNavigate={handleNavigate} />;
      default:              return <Home onNavigate={handleNavigate} onBookingClick={openBooking} />;
    }
  };

  return (
    // FIX 2 & 3: min-h-[100dvh] per la barra Safari e pb-[env(...)] per non accavallarsi alla riga home di iPhone
    <div className="min-h-[100dvh] flex flex-col bg-stone-50 font-sans antialiased pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />

      <main className="flex-grow relative">
        {/* FIX 4: Aggiunto ios-gpu-fix. Questo sposta il fadeIn sulla scheda grafica e previene i drop di frame */}
        <div key={currentPage} className="animate-[fadeIn_0.5s_ease-out] ios-gpu-fix">
          {renderPage()}
        </div>
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <BookingModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title={selectedTitle}
            mode={bookingMode}
          />
        )}
      </AnimatePresence>

      <Footer onNavigate={handleNavigate} />
      <PWAPrompt />
    </div>
  );
}

export default App;