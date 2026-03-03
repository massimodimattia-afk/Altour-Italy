import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Escursioni from './pages/Escursioni';
import Corsi from './pages/Corsi';
import Tessera from './pages/Tessera';
import Calendario from './pages/Calendario.tsx';
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
  const [showIntro, setShowIntro] = useState(true);
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <AltourImmersiveIntro onComplete={() => setShowIntro(false)} />
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

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedTitle}
      />

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default App;