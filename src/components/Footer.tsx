import { Instagram, Mail, Phone, Heart, Facebook, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="bg-[#2a2723] text-stone-200 mt-auto border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
          {/* 1. BRAND STORY */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center mb-6">
              <motion.img
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                src="/altour-logo.png"
                alt="Altour Italy"
                className="h-20 md:h-24 w-auto object-contain rounded-[1.5rem] border border-white/10 shadow-2xl bg-white/5 p-1 cursor-pointer"
              />
            </div>
            <p className="text-sm leading-relaxed text-stone-400 max-w-xs font-medium">
              Esperienze autentiche in natura. Escursioni, corsi e formazione
              outdoor con guide e istruttori certificati AIGAE.
            </p>
          </div>

          {/* 2. CONTATTI RAPIDI */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-white font-black uppercase text-[10px] tracking-[0.3em] mb-8">
              Contatti
            </h3>
            <div className="flex flex-col space-y-6 w-full max-w-[280px] md:max-w-none font-bold">
              <a
                href="mailto:info.altouritaly@gmail.com"
                className="flex items-center justify-center md:justify-start space-x-4 text-stone-300 hover:text-brand-sky transition-colors group"
              >
                <div className="p-3 bg-white/5 rounded-xl group-hover:bg-brand-sky/20 group-hover:scale-110 transition-all">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                </div>
                <span className="text-[13px] tracking-tight">
                  info.altouritaly@gmail.com
                </span>
              </a>

              <a
                href="tel:+393281613762"
                className="flex items-center justify-center md:justify-start space-x-4 text-stone-300 hover:text-brand-sky transition-colors group"
              >
                <div className="p-3 bg-white/5 rounded-xl group-hover:bg-brand-sky/20 group-hover:scale-110 transition-all">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                </div>
                <span className="text-[13px] tracking-tight">
                  +39 328 1613762
                </span>
              </a>

              <div className="flex items-center justify-center md:justify-start space-x-4 text-stone-500">
                <div className="p-3 bg-white/5 rounded-xl">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                </div>
                <span className="text-[13px] tracking-tight text-center md:text-left">
                  Roma, IT
                </span>
              </div>
            </div>
          </div>

          {/* 3. SOCIAL COMMUNITY */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-white font-black uppercase text-[10px] tracking-[0.3em] mb-8">
              Community
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-4 w-full">
              {/* Instagram */}
              <motion.a
                href="https://www.instagram.com/altouritaly/"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="relative group overflow-hidden inline-flex items-center justify-center space-x-3 px-5 py-4 bg-white/5 border border-white/10 text-white rounded-2xl transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex items-center space-x-2">
                  <Instagram className="w-5 h-5" />
                  <span className="font-black text-[10px] uppercase tracking-widest">
                    Instagram
                  </span>
                </div>
              </motion.a>

              {/* Facebook */}
              <motion.a
                href="https://www.facebook.com/AltourItaly"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="relative group overflow-hidden inline-flex items-center justify-center space-x-3 px-5 py-4 bg-white/5 border border-white/10 text-white rounded-2xl transition-all"
              >
                <div className="absolute inset-0 bg-[#1877F2] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex items-center space-x-2">
                  <Facebook className="w-5 h-5" />
                  <span className="font-black text-[10px] uppercase tracking-widest">
                    Facebook
                  </span>
                </div>
              </motion.a>
            </div>
          </div>
        </div>

        {/* FOOTER BOTTOM - OTTIMIZZATO MOBILE */}
        <div className="border-t border-white/5 mt-16 pt-10 flex flex-col items-center">
          {/* Legal Links Stack - Molto più pulito su mobile */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-4 mb-10">
            <a
              href="#"
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-brand-sky transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-brand-sky transition-colors"
            >
              Cookie Policy
            </a>
            <a
              href="#"
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-brand-sky transition-colors"
            >
              Termini
            </a>
          </div>

          <div className="flex flex-col items-center gap-6 text-center">
            {/* Copyright & P.IVA */}
            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-stone-500 uppercase tracking-[0.3em] font-black">
                &copy; {new Date().getFullYear()} Altour Italy
              </p>
              <p className="text-[9px] text-stone-600 font-bold uppercase tracking-[0.2em]">
                P.IVA 04412340263
              </p>
            </div>

            {/* Made with - Design più leggero e centrato */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.4em] text-stone-600 font-bold">
                <span>Made with</span>
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Heart size={10} className="text-brand-sky fill-brand-sky" />
                </motion.span>
                <span>by</span>
              </div>
              <span className="text-[10px] text-stone-400 font-black tracking-[0.5em] uppercase">
                GLORIONA Prod. 2026
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
