import { Instagram, Mail, Phone, Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="bg-[#2a2723] text-stone-200 mt-auto border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {/* Brand Story - Logo con Bounce */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center mb-5">
              <motion.img
                whileHover={{ scale: 1.1, rotate: 2 }}
                whileTap={{ scale: 0.9, rotate: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                src="/altour-logo.png"
                alt="Altour Italy"
                className="h-10 md:h-12 w-auto object-contain rounded-xl border border-white/10 shadow-lg cursor-pointer"
              />
            </div>
            <p className="text-sm leading-relaxed text-stone-400 max-w-xs">
              Esperienze autentiche in natura. Escursioni, corsi e formazione
              outdoor con guide e istruttori certificati AIGAE.
            </p>
          </div>

          {/* Contatti */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-white font-black uppercase text-[10px] tracking-[0.3em] mb-6">
              Contatti
            </h3>
            <div className="flex flex-col space-y-5 w-full max-w-[280px] md:max-w-none">
              <a
                href="mailto:info.altouritaly@gmail.com"
                className="flex items-center justify-center md:justify-start space-x-3 text-stone-300 hover:text-brand-sky transition-colors group"
              >
                <div className="p-2.5 bg-white/5 rounded-lg group-hover:bg-brand-sky/10">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                </div>
                <span className="text-sm font-medium">
                  info.altouritaly@gmail.com
                </span>
              </a>
              <a
                href="tel:+393281613762"
                className="flex items-center justify-center md:justify-start space-x-3 text-stone-300 hover:text-brand-sky transition-colors group"
              >
                <div className="p-2.5 bg-white/5 rounded-lg group-hover:bg-brand-sky/10">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                </div>
                <span className="text-sm font-medium">+39 3281613762</span>
              </a>
            </div>
          </div>

          {/* Social */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-white font-black uppercase text-[10px] tracking-[0.3em] mb-6">
              Seguici
            </h3>
            <a
              href="https://www.instagram.com/altouritaly/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto inline-flex items-center justify-center space-x-3 px-8 py-4 bg-brand-sky hover:bg-opacity-90 text-white rounded-xl transition-all shadow-lg font-bold text-sm uppercase tracking-widest active:scale-95"
            >
              <Instagram className="w-5 h-5" />
              <span>@altouritaly</span>
            </a>
          </div>
        </div>

        {/* Sezione Finale: Ripristinato Made with */}
        <div className="border-t border-white/5 mt-12 pt-8 text-center flex flex-col gap-4">
          <p className="text-[10px] text-stone-500 uppercase tracking-[0.2em] font-medium">
            &copy; {new Date().getFullYear()} Altour Italy. Non solo trekking.
          </p>

          <div className="flex items-center justify-center gap-3">
            <span className="h-[1px] w-4 bg-white/5 hidden sm:block"></span>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-stone-500 font-bold">
              <span>Made with</span>
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="inline-block"
              >
                <Heart size={10} className="text-brand-sky fill-brand-sky" />
              </motion.span>
              <span className="text-stone-500 ml-0.5">by</span>
              <span className="text-stone-400">GLORIONA Prod. 2026</span>
            </div>
            <span className="h-[1px] w-4 bg-white/5 hidden sm:block"></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
