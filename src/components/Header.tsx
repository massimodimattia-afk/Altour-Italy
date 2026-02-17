import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'escursioni', label: 'Escursioni' },
    { id: 'corsi', label: 'Corsi' },
    { id: 'tessera', label: 'La Mia Tessera' }
  ];

  // Funzione per gestire il click su mobile: cambia pagina e chiude il menu
  const handleMobileClick = (id: string) => {
    onNavigate(id);
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-brand-stone/95 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Logo e Nome */}
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => onNavigate('home')}
        >
          <img src="/altour-logo.png" className="h-10 w-auto rounded-lg shadow-sm" alt="Logo" />
          <span className="text-white font-black tracking-tighter text-xl group-hover:text-brand-sky transition-colors">
            ALTOUR
          </span>
        </div>

        {/* Menu Desktop (Visibile da tablet in su) */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`text-[11px] uppercase font-bold tracking-[0.2em] transition-all relative py-2
                ${currentPage === item.id 
                  ? 'text-brand-sky' 
                  : 'text-stone-300 hover:text-white'}`}
            >
              {item.label}
              {currentPage === item.id && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-sky animate-in fade-in zoom-in duration-300"></span>
              )}
            </button>
          ))}
        </nav>

        {/* Pulsante Hamburger (Solo Mobile) */}
        <button 
          className="md:hidden text-white p-2 hover:bg-white/5 rounded-lg transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle Menu"
        >
          {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Menu Mobile Dropdown con Animazione Premium */}
      <div className={`
        md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-brand-stone/98
        ${isMenuOpen ? 'max-h-[300px] opacity-100 border-t border-white/10' : 'max-h-0 opacity-0'}
      `}>
        <div className="flex flex-col p-6 gap-5">
          {navItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleMobileClick(item.id)}
              style={{ transitionDelay: isMenuOpen ? `${index * 75}ms` : '0ms' }}
              className={`
                text-left text-sm uppercase font-black tracking-[0.2em] transition-all duration-500
                ${isMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'}
                ${currentPage === item.id ? 'text-brand-sky' : 'text-stone-300'}
              `}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
