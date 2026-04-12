import React, { useRef, useEffect, useState, ElementType, useCallback } from "react";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  delay?: number;
  fullHeight?: boolean;
  as?: ElementType;
}

// ─── Rilevamento iOS ──────────────────────────────────────────────────────────
// Esportato: Home.tsx (e altri) lo usano per decidere se montare
// Framer Motion whileInView oppure un wrapper trasparente.
//
// maxTouchPoints > 1 copre iPad su iOS 13+ che si maschera da macOS
// (navigator.platform === "MacIntel" su Safari iPadOS).
export const isIOS =
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

// ─── Keyframes ────────────────────────────────────────────────────────────────
//
// IMPORTANTE: il `to` non include transform.
//
// Con fill-mode:both, al termine dell'animazione il browser mantiene lo
// stato `to` come stile inline sull'elemento. Se `to` includesse
// `transform: translate3d(0,0,0)`, quella proprietà rimarrebbe attiva
// creando uno stacking context permanente → tutti i figli position:fixed
// (modal, FAB, header) verrebbero posizionati relativi alla sezione
// invece che al viewport.
//
// Soluzione: `to` dichiara solo opacity:1. Il browser interpola il
// transform da 20px→0 durante l'animazione, poi al termine non rimane
// nessun transform inline. onAnimationEnd azzera anche l'animation stessa.
const KEYFRAMES = `
  @keyframes sectionFadeUp {
    from {
      opacity: 0;
      transform: translate3d(0, 20px, 0);
    }
    to {
      opacity: 1;
    }
  }

  @keyframes sectionFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
`;

let keyframesInjected = false;
function injectKeyframes() {
  if (keyframesInjected || typeof document === "undefined") return;
  const style = document.createElement("style");
  style.textContent = KEYFRAMES;
  document.head.appendChild(style);
  keyframesInjected = true;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function Section({
  children,
  className = "",
  animate = true,
  delay = 0,
  fullHeight = false,
  as: Tag = "section",
}: SectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!animate);
  const [animDone, setAnimDone] = useState(!animate);

  useEffect(() => {
    injectKeyframes();
    if (!animate) return;

    const el = ref.current;
    if (!el) return;

    // rootMargin adattivo: viewport piccoli (mobile) → margine ridotto
    // per evitare che sezioni corte non triggerino mai
    const margin = window.innerHeight < 700 ? "-40px 0px" : "-80px 0px";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: margin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [animate]);

  // Rimuove la CSS animation al termine: l'elemento torna al suo stile
  // naturale (opacity:1, nessun transform) senza proprietà residue
  const handleAnimationEnd = useCallback(() => {
    setAnimDone(true);
  }, []);

  const getAnimStyle = (): React.CSSProperties => {
    if (!animate) return {};

    // Non-iOS: wrapper trasparente.
    // Le animazioni Framer Motion definite nei componenti figli
    // funzionano normalmente senza interferenze.
    if (!isIOS) return {};

    // iOS — animazione completata: rimuovi tutto.
    // Nessun transform, nessun opacity inline → stato naturale del DOM.
    if (animDone) return {};

    // iOS — elemento non ancora entrato nel viewport
    if (!visible) return { opacity: 0 };

    // iOS — animazione in corso (no willChange esplicito:
    // il browser lo gestisce internamente per la durata della CSS animation)
    return {
      animation: `sectionFadeUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s both`,
    };
  };

  const heightStyle: React.CSSProperties = fullHeight
    ? { height: "calc(var(--vh, 1vh) * 100)" }
    : {};

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      className={`relative w-full ${className}`}
      style={{ ...getAnimStyle(), ...heightStyle }}
      onAnimationEnd={isIOS && animate ? handleAnimationEnd : undefined}
    >
      {children}
    </Tag>
  );
}