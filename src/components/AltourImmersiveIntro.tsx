import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

// ─── Config ───────────────────────────────────────────────────────────────────
const MOBILE_IMAGE_URL =
  "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/intro-mobile.webp";
const DESKTOP_IMAGE_URL =
  "https://rpzbiqzjyculxquespos.supabase.co/storage/v1/object/public/Images/IMG_20220904_150458%20(1).webp";

// Supabase Storage supports image transforms via query params.
// Resize to display size to avoid downloading a 4MB photo for a 400px slot.
const MOBILE_IMAGE_SRC  = `${MOBILE_IMAGE_URL}?width=800&quality=75`;
const DESKTOP_IMAGE_SRC = `${DESKTOP_IMAGE_URL}?width=1600&quality=75`;

const MIN_DISPLAY_AFTER_LOAD_MS = 1200; // reduced: 1.2s is plenty
const HARD_CAP_MS       = 4500;
const IMAGE_TIMEOUT_MS  = 2500;

interface AltourImmersiveIntroProps {
  onComplete: () => void;
}

interface ImgWithFetchPriority extends HTMLImageElement {
  fetchPriority: "high" | "low" | "auto";
}

// ─── Container exit variants (image has NO variants — pure CSS transition) ───
const mobileContainerVariants: Variants = {
  initial: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const desktopContainerVariants: Variants = {
  initial: { opacity: 1 },
  exit: { y: "-100%", transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] } },
};

const contentVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { delay: 0.3, duration: 0.7, ease: "easeOut" },
  },
  exit: { opacity: 0, y: -12, transition: { duration: 0.35 } },
};

const skipVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { delay: 1.0, duration: 0.4 } },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function AltourImmersiveIntro({ onComplete }: AltourImmersiveIntroProps) {
  const [isVisible, setIsVisible] = useState(true);

  const isMobile = useRef(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  ).current;

  // Ref to the <img> DOM node — we toggle its opacity via CSS class,
  // avoiding a React re-render and the associated layout thrash.
  const imgRef = useRef<HTMLImageElement>(null);

  const canCloseRef = useRef(false);
  const closedRef   = useRef(false);

  const close = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    setIsVisible(false);
  }, []);

  useEffect(() => {
    const src = isMobile ? MOBILE_IMAGE_SRC : DESKTOP_IMAGE_SRC;

    // Preload via JS Image() so the browser caches it before the <img> needs it.
    // The <img> is already in the DOM with opacity:0 — when the cache is warm
    // the browser paints it in the SAME frame as the class switch, no jank.
    const preload = new Image() as ImgWithFetchPriority;
    preload.fetchPriority = "high";
    preload.decoding = "sync";
    preload.src = src;

    const onReady = () => {
      // Flip CSS class — no React state, no re-render, no layout pass.
      // The `transition: opacity 0.9s` defined inline on the <img> handles the fade.
      imgRef.current?.classList.add("img-loaded");
      setTimeout(() => { canCloseRef.current = true; }, MIN_DISPLAY_AFTER_LOAD_MS);
    };

    if (preload.complete) {
      // Already in browser cache (e.g. second visit)
      onReady();
    } else {
      preload.onload = onReady;
    }

    const safetyTimer = setTimeout(() => {
      imgRef.current?.classList.add("img-loaded");
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
          {/* ── Background image ──────────────────────────────────────────────
              Always in the DOM from the first render with opacity:0.
              The browser can start decoding immediately — no insertion jank.
              Opacity is flipped via CSS class (no React state = no re-render).
              No scale transform: opacity-only fade is ~3x cheaper on mobile GPU. */}
          <img
            ref={imgRef}
            src={isMobile ? MOBILE_IMAGE_SRC : DESKTOP_IMAGE_SRC}
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="sync"
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{
              opacity: 0,
              // CSS transition instead of Framer Motion — avoids JS animation frame overhead
              transition: "opacity 0.9s ease-out",
            }}
          />
          {/* img-loaded class sets opacity:1 — injected once by the preload callback */}
          <style>{`.img-loaded { opacity: 1 !important; }`}</style>

          <div className="absolute inset-0 bg-black/20 pointer-events-none" />

          {/* ── Branding ──────────────────────────────────────────────────── */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 pointer-events-none">
            <motion.div
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-center"
            >
              <img
                src="/altour-logo.png"
                alt="Logo Altour Italy"
                className="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-2xl shadow-2xl border border-white/20 mb-6"
                loading="eager"
                decoding="sync"
              />
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter drop-shadow-xl mb-2">
                Altour
              </h1>
              <p className="text-sm md:text-xl font-bold uppercase tracking-[0.5em] text-stone-200 opacity-90">
                Italy
              </p>
            </motion.div>
          </div>

          {/* ── Skip ──────────────────────────────────────────────────────── */}
          <motion.button
            variants={skipVariants}
            initial="initial"
            animate="animate"
            onClick={handleSkip}
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