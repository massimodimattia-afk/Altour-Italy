// components/Section.tsx
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
// Eseguito una volta sola a livello di modulo, non ad ogni render.
// Usiamo maxTouchPoints per coprire anche iPad su iOS 13+
// che si maschera da macOS (navigator.platform = "MacIntel").
const isIOS =
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

// ─── Keyframes ────────────────────────────────────────────────────────────────
//
// FIX CRITICO: il `to` NON include transform.
//
// Con fill-mode:both, il browser applica lo stato `to` inline sull'elemento
// anche dopo che l'animazione è finita. Se `to` include
// `transform: translate3d(0,0,0)`, quella proprietà rimane → stacking context
// permanente → tutti i figli position:fixed vengono posizionati relativi
// alla sezione invece che al viewport (es. modal, FAB, header).
//
// La soluzione: il `from` dichiara lo stato iniziale con transform,
// il `to` dichiara solo opacity:1. Il browser interpola il transform
// da 20px→0 durante l'animazione, e al termine non rimane nessun
// transform inline sull'elemento.
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
  // Traccia il completamento dell'animazione per rimuovere lo style
  const [animDone, setAnimDone] = useState(!animate);

  useEffect(() => {
    injectKeyframes();
    if (!animate) return;

    const el = ref.current;
    if (!el) return;

    // rootMargin adattivo: su viewport piccoli (-40px),
    // su viewport grandi (-80px). Previene sezioni corte
    // che non triggerano mai su mobile.
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

  // Chiamato da onAnimationEnd — rimuove la CSS animation dall'elemento.
  // Questo è fondamentale: dopo il completamento, l'elemento torna
  // al suo stile naturale (opacity:1, nessun transform) senza
  // nessuna proprietà residua che possa creare stacking context.
  const handleAnimationEnd = useCallback(() => {
    setAnimDone(true);
  }, [isIOS, delay]);

  // ─── Logica platform-aware ────────────────────────────────────────────────
  //
  // Su iOS: CSS animations (no JS rAF, no compositing layer permanente)
  // Su Android/Desktop: Framer Motion funziona bene → questo wrapper
  // passa solo children + className, senza interferire con FM.
  //
  // In pratica: su non-iOS il wrapper è trasparente — le animazioni
  // FM definite nei componenti figli funzionano normalmente.

  const getAnimStyle = (): React.CSSProperties => {
    if (!animate) return {};

    // Non-iOS: nessuno stile di animazione dal wrapper.
    // Framer Motion nei componenti figli gestisce tutto.
    if (!isIOS) return {};

    // iOS — animazione completata: rimuovi tutto.
    // L'elemento è nello stato finale naturale (opacity:1, no transform).
    if (animDone) return {};

    // iOS — elemento non ancora visibile
    if (!visible) return { opacity: 0 };

    // iOS — animazione in corso
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
      // onAnimationEnd è un evento DOM nativo — funziona su tutti i browser
      // e viene chiamato esattamente quando la CSS animation termina.
      // Usarlo per azzerare lo style è più affidabile di un setTimeout.
      onAnimationEnd={isIOS && animate ? handleAnimationEnd : undefined}
    >
      {children}
    </Tag>
  );
}