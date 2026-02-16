import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Escursioni from './pages/Escursioni';
import Corsi from './pages/Corsi';
import Tessera from './pages/Tessera';
import Calendario from './pages/Calendario.tsx'; // Import for Calendario page
// Import corretto: usiamo il modale che già esiste nel progetto
import BookingModal from './components/BookingModal'; 
import AltourImmersiveIntro from './components/AltourImmersiveIntro';

// Tipo per le pagine disponibili
type PageType = 'home' | 'escursioni' | 'corsi' | 'tessera' | 'calendario'; // Added 'calendario'

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  
  // STATI PER IL MODALE (FORM DI CONTATTO)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState('');

  // Riporta la pagina in alto quando si cambia sezione
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Gestore della navigazione tra le pagine
  const handleNavigate = (page: string) => {
    if (['home', 'escursioni', 'corsi', 'tessera', 'calendario'].includes(page)) {
      setCurrentPage(page as PageType);
    }
  };

  // Funzione per attivare il form di prenotazione
  const openBooking = (title: string) => {
    setSelectedTitle(title);
    setIsModalOpen(true);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        // Passiamo entrambi i parametri richiesti da HomeProps
        return <Home onNavigate={handleNavigate} onBookingClick={openBooking} />;
      case 'escursioni':
        // Passiamo entrambi i parametri richiesti da EscursioniPageProps
        return <Escursioni onNavigate={handleNavigate} onBookingClick={openBooking} />;
      case 'corsi':
        // Passiamo entrambi i parametri richiesti da CorsiPageProps
        return <Corsi onNavigate={handleNavigate} onBookingClick={openBooking} />;
      case 'tessera':
        return <Tessera />;
      case 'calendario': // New case for Calendario page
        return <Calendario onBookingClick={openBooking} />;
      default:
        return <Home onNavigate={handleNavigate} onBookingClick={openBooking} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans antialiased">
      {/* INTRO IMMERSIVO */}
      {showIntro && (
        <AltourImmersiveIntro onComplete={() => setShowIntro(false)} />
      )}

      {/* Header per la navigazione principale */}
      <Header currentPage={currentPage} onNavigate={handleNavigate} />
      
      <main className="flex-grow relative">
        <div 
          key={currentPage} 
          className="animate-[fadeIn_0.5s_ease-out]"
        >
          {renderPage()}
        </div>
      </main>

      {/* Il modale che gestisce l'invio della richiesta email */}
      <BookingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedTitle} 
      />

      <Footer />
    </div>
  );
}

export default App;
