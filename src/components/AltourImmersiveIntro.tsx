import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- CONFIGURAZIONE COSTANTI ---
const MOBILE_IMAGE_URL =
  "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/intro-mobile.webp";
const DESKTOP_IMAGE_URL =
  "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20220904_150458%20(1).webp";

interface AltourImmersiveIntroProps {
  onComplete: () => void;
}

export default function AltourImmersiveIntro({
  onComplete,
}: AltourImmersiveIntroProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Hook per rilevare se siamo su mobile (< 768px)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Timer per gestire la durata dell'intro (3.5s)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence mode="wait" onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          key="intro-container"
          className="fixed inset-0 z-[9999] overflow-hidden bg-brand-stone"
          initial={{ opacity: 1 }}
          exit={
            isMobile
              ? {
                  opacity: 0,
                  scale: 1.1,
                  transition: { duration: 0.8, ease: "easeInOut" },
                }
              : {
                  y: "-100%",
                  transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
                }
          }
        >
          {/* --- IMMAGINE DI SFONDO (KEN BURNS) --- */}
          <div className="absolute inset-0 w-full h-full">
            {/* Versione Mobile */}
            <motion.img
              src={MOBILE_IMAGE_URL}
              alt="Altour Intro Mobile"
              className="w-full h-full object-cover object-center block md:hidden"
              initial={{ scale: 1 }}
              animate={{ scale: 1.05 }}
              transition={{ duration: 3.5, ease: "easeOut" }}
              loading="eager"
              // @ts-ignore
              fetchpriority="high"
              onError={(e) => {
                e.currentTarget.src = DESKTOP_IMAGE_URL;
              }}
            />

            {/* Versione Desktop */}
            <motion.img
              src={DESKTOP_IMAGE_URL}
              alt="Altour Intro Desktop"
              className="w-full h-full object-cover object-center hidden md:block"
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 3.5, ease: "easeOut" }}
              loading="eager"
              // @ts-ignore
              fetchpriority="high"
            />

            {/* Overlay Scuro */}
            <div className="absolute inset-0 bg-black/20" />
          </div>

          {/* --- CONTENUTO BRANDING --- */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.5 } }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-center"
            >
              <div className="relative mb-4">
                <img
                  src="/altour-logo.png"
                  alt="Logo"
                  className="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-2xl shadow-2xl border border-white/20 mb-6"
                />
              </div>

              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter drop-shadow-xl mb-2">
                Altour
              </h1>
              <p className="text-sm md:text-xl font-bold uppercase tracking-[0.5em] text-stone-200 opacity-90">
                Italy
              </p>
            </motion.div>
          </div>

          {/* Tasto "Salta" — appare dopo 1.2s */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            onClick={() => setIsVisible(false)}
            className="absolute bottom-8 right-8 text-white/50 hover:text-white text-[15px] font-black uppercase tracking-widest transition-colors z-20"
          >
            Salta →
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
