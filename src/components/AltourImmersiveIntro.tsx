import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

// ─── Config ───────────────────────────────────────────────────────────────────
// Immagini ottimizzate in WebP con parametri di resize
const MOBILE_IMAGE_URL =
  "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/intro-mobile.webp?width=750&quality=80";
const DESKTOP_IMAGE_URL =
  "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20220904_150458.webp?width=1600&quality=80";

// Timing ridotti al minimo per non bloccare il rendering
const MIN_DISPLAY_MS = 400;   // tempo minimo per evitare flicker
const HARD_CAP_MS    = 2000;  // uscita forzata dopo 2 secondi

interface AltourImmersiveIntroProps {
  onComplete: () => void;
}

// Varianti più leggere
const mobileContainerVariants: Variants = {
  initial: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const desktopContainerVariants: Variants = {
  initial: { opacity: 1 },
  exit: { y: "-100%", transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const contentVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25 } },
};

const skipVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { delay: 0.5, duration: 0.2 } },
};

export default function AltourImmersiveIntro({ onComplete }: AltourImmersiveIntroProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const closeRef = useRef(false);
  const mountedRef = useRef(true);

  // Rilevamento mobile con useEffect per evitare mismatch SSR
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const close = useCallback(() => {
    if (closeRef.current) return;
    closeRef.current = true;
    if (mountedRef.current) setIsVisible(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Precaricamento immagine e timer
  useEffect(() => {
    const img = new Image();
    img.src = isMobile ? MOBILE_IMAGE_URL : DESKTOP_IMAGE_URL;
    img.decoding = "async";
    
    let loaded = false;
    const onLoad = () => {
      if (loaded) return;
      loaded = true;
      setImageLoaded(true);
      // Uscita dopo il tempo minimo
      setTimeout(() => close(), MIN_DISPLAY_MS);
    };
    
    img.onload = onLoad;
    img.onerror = onLoad; // comunque chiudi se errore
    
    // Timeout di sicurezza (massimo 2 secondi)
    const timeoutId = setTimeout(() => {
      if (!loaded) onLoad();
    }, HARD_CAP_MS);
    
    return () => {
      clearTimeout(timeoutId);
      img.onload = null;
      img.onerror = null;
    };
  }, [isMobile, close]);

  // Lock scroll solo durante l'intro
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleSkip = useCallback(() => {
    close();
  }, [close]);

  const handleExitComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // Se l'immagine è già caricata in meno di 400ms, esce subito
  if (!isVisible) return null;

  return (
    <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
      {isVisible && (
        <motion.div
          key="intro"
          aria-hidden="true"
          className="fixed inset-0 z-[9999] overflow-hidden bg-brand-stone"
          variants={isMobile ? mobileContainerVariants : desktopContainerVariants}
          initial="initial"
          exit="exit"
          style={{ willChange: "transform, opacity" }}
        >
          {/* Immagine di sfondo con effetto fade-in nativo */}
          <img
            src={isMobile ? MOBILE_IMAGE_URL : DESKTOP_IMAGE_URL}
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500"
            style={{ opacity: imageLoaded ? 1 : 0 }}
          />
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />

          {/* Branding */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 pointer-events-none">
            <motion.div
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-center"
            >
              <img
                src="/altour-logo.svg"
                alt="Logo Altour Italy"
                className="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-2xl shadow-2xl border border-white/20 mb-6"
                loading="eager"
                decoding="async"
                width="128"
                height="128"
              />
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter drop-shadow-xl mb-2">
                Altour
              </h1>
              <p className="text-sm md:text-xl font-bold uppercase tracking-[0.5em] text-stone-200 opacity-90">
                Italy
              </p>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.3em] text-white/50">
                Formazione ed attività outdoor
              </p>
            </motion.div>
          </div>

          {/* Bottone Skip */}
          <motion.button
            variants={skipVariants}
            initial="initial"
            animate="animate"
            onClick={handleSkip}
            aria-label="Salta introduzione"
            className="absolute bottom-8 right-6 text-white/60 hover:text-white text-[15px] font-black uppercase tracking-widest transition-colors z-20 px-4 py-3 min-w-[44px] min-h-[44px] flex items-center gap-1.5 active:scale-95"
            whileTap={{ scale: 0.95 }}
          >
            Salta →
          </motion.button>

          {/* Barra progresso sottile */}
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-white/30"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: HARD_CAP_MS / 1000, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}