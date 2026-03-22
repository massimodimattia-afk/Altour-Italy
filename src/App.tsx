import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Escursioni from './pages/Escursioni';
import Corsi from './pages/Corsi';
import Tessera from './pages/Tessera';
import Campi from './pages/CampiPage';
import Legal from './pages/Legal';
import BookingModal from './components/BookingModal';
import AltourImmersiveIntro from './components/AltourImmersiveIntro';
import PWAPrompt from "./components/PWAprompt";

type PageType =
  | 'home'
  | 'escursioni'
  | 'corsi'
  | 'tessera'
  | 'campi'
  | 'legal-privacy'
  | 'legal-cookie'
  | 'legal-termini';

const VALID_PAGES: PageType[] = [
  'home', 'escursioni', 'corsi', 'tessera', 'campi',
  'legal-privacy', 'legal-cookie', 'legal-termini',
];

const INTRO_TS_KEY  = "altour-intro-ts";
const LAST_PAGE_KEY = "altour-last-page";
const DAY_MS        = 24 * 60 * 60 * 1000;

function shouldShowIntro(): boolean {
  const ts = localStorage.getItem(INTRO_TS_KEY);
  if (!ts) return true;
  return Date.now() - parseInt(ts, 10) > DAY_MS;
}

function App() {
  const [showIntro, setShowIntro]     = useState(() => shouldShowIntro());
  const [currentPage, setCurrentPage] = useState<PageType>(() => {
    const saved = localStorage.getItem(LAST_PAGE_KEY) as PageType | null;
    return saved && VALID_PAGES.includes(saved) ? saved : "home";
  });
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [bookingMode, setBookingMode]   = useState<'info' | 'prenota'>('info');

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'instant' : 'smooth' });
    localStorage.setItem(LAST_PAGE_KEY, currentPage);
  }, [currentPage]);

  const handleNavigate = (page: string) => {
    if (VALID_PAGES.includes(page as PageType)) {
      setCurrentPage(page as PageType);
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

  const handleIntroComplete = () => {
    localStorage.setItem(INTRO_TS_KEY, String(Date.now()));
    setShowIntro(false);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':           return <Home onNavigate={handleNavigate} onBookingClick={openBooking} />;
      case 'escursioni':     return <Escursioni onNavigate={handleNavigate} onBookingClick={openBooking} />;
      case 'corsi':          return <Corsi onNavigate={handleNavigate} onBookingClick={openBooking} />;
      case 'tessera':        return <Tessera />;
      case 'campi':          return <Campi onBookingClick={openBooking} />;
      case 'legal-privacy':  return <Legal initialTab="privacy" />;
      case 'legal-cookie':   return <Legal initialTab="cookie" />;
      case 'legal-termini':  return <Legal initialTab="termini" />;
      default:               return <Home onNavigate={handleNavigate} onBookingClick={openBooking} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans antialiased">
      {showIntro && (
        <AltourImmersiveIntro onComplete={handleIntroComplete} />
      )}

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