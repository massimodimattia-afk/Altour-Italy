import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

// ─── Config ───────────────────────────────────────────────────────────────────
const MOBILE_IMAGE_URL =
  "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/intro-mobile.webp";
const DESKTOP_IMAGE_URL =
  "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20220904_150458.webp";

const MOBILE_IMAGE_SRC  = `${MOBILE_IMAGE_URL}?width=800&quality=75`;
const DESKTOP_IMAGE_SRC = `${DESKTOP_IMAGE_URL}?width=1600&quality=75`;

// Timing ridotto — esperienza fluida senza sembrare frettolosa
const MIN_DISPLAY_MS  = 800;   // era 1200
const HARD_CAP_MS     = 3000;  // era 4500
const IMAGE_TIMEOUT_MS = 2000; // era 2500

interface AltourImmersiveIntroProps {
  onComplete: () => void;
}

interface ImgWithFetchPriority extends HTMLImageElement {
  fetchPriority: "high" | "low" | "auto";
}

// ─── Variants ─────────────────────────────────────────────────────────────────
const mobileContainerVariants: Variants = {
  initial: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const desktopContainerVariants: Variants = {
  initial: { opacity: 1 },
  exit: { y: "-100%", transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
};

const contentVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { delay: 0.25, duration: 0.6, ease: "easeOut" } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.3 } },
};

const skipVariants: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { delay: 0.8, duration: 0.3, ease: "easeOut" } },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function AltourImmersiveIntro({ onComplete }: AltourImmersiveIntroProps) {
  const [isVisible, setIsVisible]   = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isMobile = useRef(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  ).current;

  const imgRef      = useRef<HTMLImageElement>(null);
  const canCloseRef = useRef(false);
  const closedRef   = useRef(false);

  const close = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    setIsVisible(false);
  }, []);

  useEffect(() => {
    const src = isMobile ? MOBILE_IMAGE_SRC : DESKTOP_IMAGE_SRC;

    const preload = new Image() as ImgWithFetchPriority;
    preload.fetchPriority = "high";
    preload.decoding = "sync";
    preload.src = src;

    // Se l'immagine è già in cache (SW attivo) il timer si accorcia
    const wasCached = preload.complete;

    const onReady = () => {
      imgRef.current?.classList.add("img-loaded");
      setImageLoaded(true);
      const delay = wasCached ? 500 : MIN_DISPLAY_MS;
      setTimeout(() => { canCloseRef.current = true; }, delay);
    };

    if (preload.complete) {
      onReady();
    } else {
      preload.onload = onReady;
    }

    const safetyTimer = setTimeout(() => {
      imgRef.current?.classList.add("img-loaded");
      setImageLoaded(true);
      canCloseRef.current = true;
    }, IMAGE_TIMEOUT_MS);

    const hardCapTimer = setTimeout(() => {
      canCloseRef.current ? close() : setTimeout(close, 300);
    }, HARD_CAP_MS);

    return () => {
      preload.onload = null;
      clearTimeout(safetyTimer);
      clearTimeout(hardCapTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleExitComplete = useCallback(() => onComplete(), [onComplete]);

  const handleSkip = useCallback(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(8);
    }
    canCloseRef.current = true;
    close();
  }, [close]);

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
          style={{ willChange: "transform, opacity", touchAction: "none" }}
        >
          {/* Immagine di sfondo */}
          <img
            ref={imgRef}
            src={isMobile ? MOBILE_IMAGE_SRC : DESKTOP_IMAGE_SRC}
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="sync"
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ opacity: 0, transition: "opacity 0.8s ease-out" }}
          />
          <style>{`.img-loaded { opacity: 1 !important; }`}</style>

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
              <motion.img
                src="/altour-logo.png"
                alt="Logo Altour Italy"
                className="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-2xl shadow-2xl border border-white/20 mb-6"
                loading="eager"
                decoding="sync"
                animate={imageLoaded
                  ? { scale: [1, 1.03, 1], transition: { duration: 0.4, delay: 0.1 } }
                  : {}}
              />
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter drop-shadow-xl mb-2">
                Altour
              </h1>
              <p className="text-sm md:text-xl font-bold uppercase tracking-[0.5em] text-stone-200 opacity-90">
                Italy
              </p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="mt-4 text-[11px] font-bold uppercase tracking-[0.3em] text-white/50"
              >
                Esperienze nell&apos;outdoor
              </motion.p>
            </motion.div>
          </div>

          {/* Skip */}
          <motion.button
            variants={skipVariants}
            initial="initial"
            animate="animate"
            onClick={handleSkip}
            aria-label="Salta introduzione"
            className="absolute bottom-8 right-6 text-white/60 hover:text-white text-[15px] font-black uppercase tracking-widest transition-colors z-20 px-4 py-3 min-w-[44px] min-h-[44px] flex items-center gap-1.5"
            whileTap={{ scale: 0.92 }}
          >
            Salta →
          </motion.button>

          {/* Barra progress — dà senso della durata */}
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-white/25"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: HARD_CAP_MS / 1000, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}