import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Escursioni from './pages/Escursioni';
import Corsi from './pages/Corsi';
import Tessera from './pages/Tessera';
import Calendario from './pages/Calendario'; // FIX 1: rimossa estensione .tsx dall'import
import Legal from './pages/Legal';
import BookingModal from './components/BookingModal';
import AltourImmersiveIntro from './components/AltourImmersiveIntro';

type PageType =
  | 'home'
  | 'escursioni'
  | 'corsi'
  | 'tessera'
  | 'calendario'
  | 'legal-privacy'
  | 'legal-cookie'
  | 'legal-termini';

const VALID_PAGES: PageType[] = [
  'home', 'escursioni', 'corsi', 'tessera', 'calendario',
  'legal-privacy', 'legal-cookie', 'legal-termini',
];

function App() {
  // FIX 3: sessionStorage — l'intro non si ripete se l'utente ricarica nella stessa sessione
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem('intro-seen');
  });
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState('');

  useEffect(() => {
    // FIX 2: rispetta prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'instant' : 'smooth' });
  }, [currentPage]);

  const handleNavigate = (page: string) => {
    if (VALID_PAGES.includes(page as PageType)) {
      setCurrentPage(page as PageType);
    }
  };

  const openBooking = (title: string) => {
    setSelectedTitle(title);
    setIsModalOpen(true);
  };

  // FIX 5: reset selectedTitle dopo la chiusura (delay per non vederlo durante l'animazione exit)
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedTitle(''), 300);
  };

  const handleIntroComplete = () => {
    sessionStorage.setItem('intro-seen', '1');
    setShowIntro(false);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} onBookingClick={openBooking} />;
      case 'escursioni':
        return <Escursioni onNavigate={handleNavigate} onBookingClick={openBooking} />;
      case 'corsi':
        return <Corsi onNavigate={handleNavigate} onBookingClick={openBooking} />;
      case 'tessera':
        return <Tessera />;
      case 'calendario':
        return <Calendario onBookingClick={openBooking} />;
      case 'legal-privacy':
        return <Legal initialTab="privacy" />;
      case 'legal-cookie':
        return <Legal initialTab="cookie" />;
      case 'legal-termini':
        return <Legal initialTab="termini" />;
      default:
        return <Home onNavigate={handleNavigate} onBookingClick={openBooking} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans antialiased">
      {showIntro && (
        <AltourImmersiveIntro onComplete={handleIntroComplete} />
      )}

      <Header currentPage={currentPage} onNavigate={handleNavigate} />

      <main className="flex-grow relative">
        <div
          key={currentPage}
          className="animate-[fadeIn_0.5s_ease-out]"
        >
          {renderPage()}
        </div>
      </main>

      {/* FIX 4: BookingModal montato solo quando c'è un titolo valido */}
      {selectedTitle && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={selectedTitle}
        />
      )}

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default App;