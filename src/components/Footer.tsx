import { Instagram, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-stone text-stone-200 mt-auto border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 sm:gap-10">
          
          {/* Brand Story */}
          <div>
            <div className="flex items-center mb-6">
              <img 
                src="/altour-logo.png" 
                alt="Altour Italy" 
                className="h-12 w-auto object-contain rounded-xl border border-white/10 shadow-lg" 
              />
            </div>
            <p className="text-sm leading-relaxed text-stone-400 max-w-xs">
              Esperienze autentiche in natura. Escursioni, corsi e formazione outdoor per
              scoprire le meraviglie delle nostre montagne con guide esperte.
            </p>
          </div>

          {/* Contatti coordinati */}
          <div>
            <h3 className="text-white font-black uppercase text-[10px] tracking-[0.3em] mb-6">Contatti</h3>
            <div className="flex flex-col space-y-4">
              <a
                href="mailto:info.altouritaly@gmail.com"
                className="flex items-center space-x-3 text-stone-300 hover:text-brand-sky transition-colors group"
              >
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-brand-sky/10">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                </div>
                <span className="text-sm font-medium">info.altouritaly@gmail.com</span>
              </a>
              <a
                href="tel:+393331234567"
                className="flex items-center space-x-3 text-stone-300 hover:text-brand-sky transition-colors group"
              >
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-brand-sky/10">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                </div>
                <span className="text-sm font-medium">+39 333 123 4567</span>
              </a>
            </div>
          </div>

          {/* Social coordinato con Brand Sky */}
          <div>
            <h3 className="text-white font-black uppercase text-[10px] tracking-[0.3em] mb-6">Seguici</h3>
            <a
              href="https://www.instagram.com/altouritaly/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-3 px-6 py-3 bg-brand-sky hover:bg-opacity-90 text-white rounded-xl transition-all shadow-lg shadow-brand-sky/20 font-bold text-sm uppercase tracking-widest active:scale-95"
            >
              <Instagram className="w-5 h-5" />
              <span>@altouritaly</span>
            </a>
          </div>
        </div>

        {/* Sezione Finale: Copyright & Sponsor */}
        <div className="border-t border-white/5 mt-12 pt-8 text-center flex flex-col gap-3">
          <p className="text-[10px] text-stone-500 uppercase tracking-[0.2em] font-medium">
            &copy; {new Date().getFullYear()} Altour Italy. Esplora con consapevolezza.
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="h-[1px] w-4 bg-white/10"></span>
            <p className="text-[9px] text-stone-600 uppercase tracking-[0.15em] font-bold">
              Sponsored by <span className="text-stone-400">GLORIONA Prod. 2026</span>
            </p>
            <span className="h-[1px] w-4 bg-white/10"></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
