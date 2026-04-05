import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import AttivitaPage from './pages/Attivitapage';
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

function App() {
  const [currentPage, setCurrentPage]   = useState<PageType>("home");
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [bookingMode, setBookingMode]   = useState<'info' | 'prenota'>('info');

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'instant' : 'smooth' });
  }, [currentPage]);

  const handleNavigate = (page: string) => {
    const redirect: Record<string, PageType> = {
      escursioni: 'attivitapage',
      campi: 'attivitapage',
    };
    const target = redirect[page] ?? page;
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
    setTimeout(() => setSelectedTitle(''), 300);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':          return <Home onNavigate={handleNavigate} onBookingClick={openBooking} />;
      case 'corsi':         return <Corsi onNavigate={handleNavigate} onBookingClick={openBooking} />;
      case 'attivitapage':      return <AttivitaPage onNavigate={handleNavigate} onBookingClick={openBooking} />;
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
        <div key={currentPage} className="animate-[fadeIn_0.5s_ease-out]">
          {renderPage()}
        </div>
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