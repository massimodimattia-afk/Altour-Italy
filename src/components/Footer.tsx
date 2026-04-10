import { Instagram, Mail, Phone, Heart, Facebook, MapPin } from "lucide-react";
import { motion } from "framer-motion";

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-[#2a2723] text-stone-200 mt-auto border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 md:py-16">
        
        {/* Griglia Principale: su mobile diventano 3 sezioni centrate */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
          
          {/* 1. BRAND STORY - Ridotto il logo su mobile per simmetria */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <motion.img
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              src="/altour-logo.png"
              alt="Altour Italy"
              className="h-16 md:h-20 w-auto object-contain rounded-2xl mb-6 bg-white/5 p-1 border border-white/10 cursor-pointer"
              onClick={() => onNavigate("home")}
            />
            <p className="text-[13px] leading-relaxed text-stone-400 max-w-xs font-medium italic">
              "Esperienze autentiche in natura. Escursioni, corsi e formazione
              outdoor con guide certificate AIGAE."
            </p>
          </div>

          {/* 2. CONTATTI RAPIDI - Layout più compatto su mobile */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-white font-black uppercase text-[9px] tracking-[0.4em] mb-8 opacity-50">
              Contatti
            </h3>
            <div className="flex flex-col space-y-4 w-full font-bold">
              <a href="mailto:info.altouritaly@gmail.com" className="flex items-center justify-center md:justify-start gap-4 text-stone-300 hover:text-brand-sky transition-colors group">
                <div className="p-2.5 bg-white/5 rounded-lg group-hover:bg-brand-sky/20 transition-all">
                  <Mail size={16} />
                </div>
                <span className="text-[12px] tracking-tight">info.altouritaly@gmail.com</span>
              </a>

              <a href="tel:+393281613762" className="flex items-center justify-center md:justify-start gap-4 text-stone-300 hover:text-brand-sky transition-colors group">
                <div className="p-2.5 bg-white/5 rounded-lg group-hover:bg-brand-sky/20 transition-all">
                  <Phone size={16} />
                </div>
                <span className="text-[12px] tracking-tight">+39 328 1613762</span>
              </a>

              <div className="flex items-center justify-center md:justify-start gap-4 text-stone-500">
                <div className="p-2.5 bg-white/5 rounded-lg">
                  <MapPin size={16} />
                </div>
                <span className="text-[12px] tracking-tight font-medium">Roma, IT</span>
              </div>
            </div>
          </div>

          {/* 3. SOCIAL COMMUNITY - Flex row su mobile per risparmiare spazio */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-white font-black uppercase text-[9px] tracking-[0.4em] mb-8 opacity-50">
              Community
            </h3>
            <div className="flex flex-row md:flex-col gap-3 w-full max-w-[300px] md:max-w-none">
              <motion.a
                href="https://www.instagram.com/altouritaly/"
                target="_blank"
                rel="noopener noreferrer"
                whileTap={{ scale: 0.95 }}
                className="flex-1 flex items-center justify-center gap-3 px-4 py-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all"
              >
                <Instagram size={18} />
                <span className="font-black text-[9px] uppercase tracking-widest hidden sm:inline md:inline">Instagram</span>
              </motion.a>

              <motion.a
                href="https://www.facebook.com/AltourItaly"
                target="_blank"
                rel="noopener noreferrer"
                whileTap={{ scale: 0.95 }}
                className="flex-1 flex items-center justify-center gap-3 px-4 py-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all"
              >
                <Facebook size={18} />
                <span className="font-black text-[9px] uppercase tracking-widest hidden sm:inline md:inline">Facebook</span>
              </motion.a>
            </div>
          </div>
        </div>

        {/* FOOTER BOTTOM - Più arioso e ordinato */}
        <div className="border-t border-white/5 mt-16 pt-10">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-10">
            {["Privacy Policy", "Cookie Policy", "Termini"].map((link) => (
              <button
                key={link}
                onClick={() => onNavigate(`legal-${link.toLowerCase().split(' ')[0]}`)}
                className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-600 hover:text-brand-sky transition-colors"
              >
                {link}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center gap-8 text-center">
            <div className="space-y-1">
              <p className="text-[9px] text-stone-500 uppercase tracking-[0.3em] font-black">
                &copy; {new Date().getFullYear()} Altour Italy
              </p>
              <p className="text-[8px] text-stone-700 font-bold uppercase tracking-[0.1em]">
                P.IVA 04412340263
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3 text-[8px] uppercase tracking-[0.3em] text-stone-600 font-bold">
                <span>Made with</span>
                <Heart size={10} className="text-brand-sky fill-brand-sky/20" />
                <span>by</span>
              </div>
              <span className="text-[10px] text-stone-500 font-black tracking-[0.4em] uppercase opacity-60">
                GLORIONA Prod. 2026
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}