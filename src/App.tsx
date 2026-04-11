import { useState, useEffect } from 'react';
import { AnimatePresence, motion, type Transition } from 'framer-motion';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Attivitapage from './pages/Attivitapage';
import Corsi from './pages/Corsi';
import Tessera from './pages/Tessera';
import Legal from './pages/Legal';
import BookingModal from './components/BookingModal';
import PWAPrompt from "./components/PWAprompt";

type PageType =
  | 'home'
  | 'corsi'
  | 'attivitapage'
  | 'tessera'
  | 'legal-privacy'
  | 'legal-cookie'
  | 'legal-termini';

const VALID_PAGES: PageType[] = [
  'home', 'corsi', 'attivitapage', 'tessera',
  'legal-privacy', 'legal-cookie', 'legal-termini',
];

// Varianti fuori dal componente → oggetto stabile, nessuna ri-creazione ad ogni render
const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
};

const pageTransition: Transition = {
  duration: 0.22,
  ease: 'easeOut',
};

function App() {
  const [currentPage, setCurrentPage]     = useState<PageType>('home');
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [bookingMode, setBookingMode]     = useState<'info' | 'prenota'>('info');

  // Scroll to top al cambio pagina — instant su iOS per evitare glitch
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'instant' : 'instant' });
    // Nota: 'smooth' su iOS Safari causa un secondo flickering durante lo scroll animato
    // → usiamo sempre 'instant' e lasciamo la transizione opacity fare il lavoro visivo
  }, [currentPage]);

  // Fix altezza viewport iOS: la barra URL che appare/scompare
  // cambia window.innerHeight → impostiamo una CSS var una sola volta
  useEffect(() => {
    const setVh = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    setVh();
    // resize solo su orientamento, non su scroll (evita re-render continui)
    window.addEventListener('orientationchange', setVh);
    return () => window.removeEventListener('orientationchange', setVh);
  }, []);

  const handleNavigate = (page: string) => {
    const redirect: Record<string, PageType> = {
      escursioni: 'attivitapage',
      campi:      'attivitapage',
    };
    const target = (redirect[page] ?? page) as PageType;
    if (VALID_PAGES.includes(target)) setCurrentPage(target);
  };

  const openBooking = (title: string, mode: 'info' | 'prenota' = 'info') => {
    setSelectedTitle(title);
    setBookingMode(mode);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedTitle(''), 300);
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
      default:              return <Home onNavigate={handleNavigate} onBookingClick={openBooking} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans antialiased">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />

      <main className="flex-grow relative">
        {/*
          AnimatePresence mode="wait" → aspetta che la pagina uscente finisca
          prima di montare quella entrante.
          Questo evita il doppio-mount che causa flickering su iOS.

          IMPORTANTE: willChange="opacity" è l'unica proprietà animata →
          iOS crea un singolo compositing layer leggero, niente scale/translate.
        */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentPage}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            style={{ willChange: 'opacity' }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {selectedTitle && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={selectedTitle}
          mode={bookingMode}
        />
      )}

      <Footer onNavigate={handleNavigate} />
      <PWAPrompt />
    </div>
  );
}

export default App;