import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

// --- CONFIGURAZIONE ---
const MOBILE_IMAGE_URL =
  "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/intro-mobile.webp";
const DESKTOP_IMAGE_URL =
  "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20220904_150458%20(1).webp";

interface AltourImmersiveIntroProps {
  onComplete: () => void;
}

// --- VARIANTI SPOSTATE FUORI DAL COMPONENTE ---
// Evita la ricreazione degli oggetti ad ogni render migliorando i frame per second (FPS)
const mobileContainerVariants: Variants = {
  initial: { opacity: 1 },
  exit: {
    opacity: 0,
    scale: 1.1,
    transition: { duration: 0.8, ease: "easeOut" }
  }
};

const desktopContainerVariants: Variants = {
  initial: { opacity: 1 },
  exit: {
    y: "-100%",
    transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] }
  }
};

const imageVariants: Variants = {
  initial: (isMobile: boolean) => ({ 
    scale: isMobile ? 1 : 1.1,
    opacity: 0 
  }),
  animate: (isMobile: boolean) => ({ 
    scale: isMobile ? 1.05 : 1,
    opacity: 1,
    transition: { duration: 1.5, ease: "easeOut" } 
  })
};

const contentVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20, transition: { duration: 0.5 } }
};

const skipButtonVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 }
};

// Funzione helper per il primo render (SSR/CSR safe)
const getInitialMobileState = () => typeof window !== 'undefined' ? window.innerWidth < 768 : false;

export default function AltourImmersiveIntro({ onComplete }: AltourImmersiveIntroProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState<boolean>(getInitialMobileState);
  const [imageLoaded, setImageLoaded] = useState(false);

  // 1. Rilevamento Device Efficiente
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. Precaricamento Condizionale (Scarica SOLO quello che serve)
  useEffect(() => {
    setImageLoaded(false); // Reset al cambio device se avviene
    const targetUrl = isMobile ? MOBILE_IMAGE_URL : DESKTOP_IMAGE_URL;
    
    const img = new Image();
    img.src = targetUrl;
    // @ts-ignore - Proprietá supportata dai browser moderni per dare priorità di rete
    img.fetchPriority = 'high';
    
    img.onload = () => setImageLoaded(true);

    // Fallback di sicurezza: se la rete è troppo lenta, mostriamo comunque il contenuto dopo 2s
    const safetyTimer = setTimeout(() => setImageLoaded(true), 2000);

    return () => {
      img.onload = null;
      clearTimeout(safetyTimer);
    };
  }, [isMobile]);

  // 3. Timer di Uscita Globale
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  // 4. Lock dello Scroll Sicuro
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleExitComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
      {isVisible && (
        <motion.div
          key="intro-container"
          aria-hidden="true"
          className="fixed inset-0 z-[9999] overflow-hidden bg-brand-stone"
          variants={isMobile ? mobileContainerVariants : desktopContainerVariants}
          initial="initial"
          exit="exit"
          style={{ willChange: 'transform, opacity', touchAction: 'none' }}
        >
          {/* IMMAGINE DI SFONDO SINGOLA E DINAMICA */}
          <div className="absolute inset-0 w-full h-full bg-brand-stone">
            {imageLoaded && (
              <motion.img
                key={isMobile ? 'mobile-bg' : 'desktop-bg'}
                src={isMobile ? MOBILE_IMAGE_URL : DESKTOP_IMAGE_URL}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover object-center"
                custom={isMobile}
                variants={imageVariants}
                initial="initial"
                animate="animate"
                loading="eager"
                fetchPriority="high"
                style={{ willChange: 'transform, opacity' }}
              />
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/20 pointer-events-none" />
          </div>

          {/* CONTENUTO BRANDING */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 pointer-events-none">
            <motion.div
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-center"
              transition={{ delay: 0.4, duration: 0.8 }}
              style={{ willChange: 'transform, opacity' }}
            >
              <div className="relative mb-4">
                <img
                  src="/altour-logo.png"
                  alt="Logo Altour Italy"
                  className="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-2xl shadow-2xl border border-white/20 mb-6"
                  loading="eager"
                  fetchPriority="high"
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

          {/* Bottone Salta */}
          <motion.button
            variants={skipButtonVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: 1.0, duration: 0.5 }}
            onClick={() => setIsVisible(false)}
            aria-label="Salta introduzione"
            className="absolute bottom-8 right-8 text-white/50 hover:text-white text-[15px] font-black uppercase tracking-widest transition-colors z-20 px-4 py-3 min-w-[44px] min-h-[44px] flex items-center cursor-pointer"
          >
            Salta →
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}