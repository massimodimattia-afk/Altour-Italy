import { Instagram, Mail, Phone, Heart, Facebook, MapPin, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

import glorionaLogo from "/gloriona-logo_2.jpg";

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-[#2a2723] text-stone-200 mt-auto border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10 md:py-12">
        
        {/* Griglia Principale */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          
          {/* 1. BRAND STORY */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <motion.img
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              src="/altour-logo.png"
              alt="Altour Italy"
              className="h-14 md:h-16 w-auto object-contain rounded-2xl mb-4 bg-white/5 p-1 border border-white/10 cursor-pointer"
              onClick={() => onNavigate("home")}
            />
            <p className="text-[13px] leading-relaxed text-stone-400 max-w-xs font-medium italic">
              "Esperienze autentiche in natura. Escursioni, corsi e formazione
              outdoor con guide certificate AIGAE."
            </p>
          </div>

          {/* 2. CONTATTI RAPIDI */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-white font-black uppercase text-[9px] tracking-[0.4em] mb-5 opacity-50">
              Contatti
            </h3>
            <div className="flex flex-col space-y-3 w-full font-bold">
              <a href="mailto:info@altouritaly.it" className="flex items-center justify-center md:justify-start gap-4 text-stone-300 hover:text-brand-sky transition-colors group">
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-brand-sky/20 transition-all">
                  <Mail size={16} />
                </div>
                <span className="text-[12px] tracking-tight">info@altouritaly.it</span>
              </a>

              <a href="tel:+393281613762" className="flex items-center justify-center md:justify-start gap-4 text-stone-300 hover:text-brand-sky transition-colors group">
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-brand-sky/20 transition-all">
                  <Phone size={16} />
                </div>
                <span className="text-[12px] tracking-tight">+39 328 1613762</span>
              </a>

              <div className="flex items-center justify-center md:justify-start gap-4 text-stone-500">
                <div className="p-2 bg-white/5 rounded-lg">
                  <MapPin size={16} />
                </div>
                <span className="text-[12px] tracking-tight font-medium">Roma, IT</span>
              </div>
            </div>
          </div>

          {/* 3. SOCIAL COMMUNITY */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-white font-black uppercase text-[9px] tracking-[0.4em] mb-5 opacity-50">
              Community
            </h3>
            <div className="flex flex-row md:flex-col gap-3 w-full max-w-[300px] md:max-w-none">
              
              {/* INSTAGRAM */}
              <motion.a
                href="https://www.instagram.com/altouritaly/"
                target="_blank"
                rel="noopener noreferrer"
                whileTap={{ scale: 0.95 }}
                className="flex-1 flex items-center justify-center gap-3 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 hover:text-pink-600 transition-all"
              >
                <Instagram size={18} />
                <span className="font-black text-[9px] uppercase tracking-widest hidden sm:inline md:inline">Instagram</span>
              </motion.a>

              {/* FACEBOOK */}
              <motion.a
                href="https://www.facebook.com/AltourItaly"
                target="_blank"
                rel="noopener noreferrer"
                whileTap={{ scale: 0.95 }}
                className="flex-1 flex items-center justify-center gap-3 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 hover:text-blue-600 transition-all"
              >
                <Facebook size={18} />
                <span className="font-black text-[9px] uppercase tracking-widest hidden sm:inline md:inline">Facebook</span>
              </motion.a>

              {/* WHATSAPP - Ora allineato agli altri */}
              <motion.a
                href="https://wa.me/393281613762"
                target="_blank"
                rel="noopener noreferrer"
                whileTap={{ scale: 0.95 }}
                className="flex-1 flex items-center justify-center gap-3 px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 hover:text-[#25D366] transition-all"
              >
                <MessageCircle size={18} />
                <span className="font-black text-[9px] uppercase tracking-widest hidden sm:inline md:inline">WhatsApp</span>
              </motion.a>

            </div>
          </div>
        </div>

        {/* FOOTER BOTTOM */}
        <div className="border-t border-white/5 mt-12 pt-8">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-8">
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

          <div className="flex flex-col items-center text-center">
            
            <p className="text-[9px] text-stone-500 uppercase tracking-[0.3em] font-black mb-6">
              &copy; GLORIONA Prod. {new Date().getFullYear()} Altour Italy
            </p>

            {/* SEZIONE CREDITI GLORIONA - Ricostruita con Testo React */}
            <div className="flex flex-col items-center gap-2.5">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold">
                <span>Made with</span>
                <Heart size={12} className="text-brand-sky fill-brand-sky/20" />
                <span>by</span>
              </div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-[#f0f0f0] px-4 py-2.5 rounded-xl shadow-lg cursor-pointer flex flex-col items-center justify-center gap-1"
              >
                <img
                  src={glorionaLogo}
                  alt="Gloriona Production"
                  className="w-20 md:w-24 h-auto object-contain mix-blend-darken opacity-80 hover:opacity-100 transition-opacity"
                />
                <div className="text-center mt-0.5">
                  <span className="block text-[#161c28] font-black text-[10px] md:text-[11px] tracking-widest leading-none">
                    GLORIONA
                  </span>
                  <span className="block text-[#161c28] font-bold text-[8px] md:text-[9px] tracking-widest leading-tight mt-0.5">
                    PRODUCTION
                  </span>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
}