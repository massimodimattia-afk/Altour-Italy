// components/Section.tsx
import React, { useRef, useEffect, useState, ElementType, useCallback } from "react";
import { isIOS } from "../utils/motion"; // ← fonte unica, non ridichiarare

export { isIOS }; // ri-esporta per chi importa da Section per retrocompatibilità

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  delay?: number;
  fullHeight?: boolean;
  as?: ElementType;
}

// Il `to` non include transform per evitare stacking context permanente.
// Vedi commento esteso in versioni precedenti.
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
`;

let keyframesInjected = false;
function injectKeyframes() {
  if (keyframesInjected || typeof document === "undefined") return;
  const style = document.createElement("style");
  style.textContent = KEYFRAMES;
  document.head.appendChild(style);
  keyframesInjected = true;
}

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

  const handleAnimationEnd = useCallback(() => {
    setAnimDone(true);
  }, []);

  const getAnimStyle = (): React.CSSProperties => {
    if (!animate) return {};
    if (!isIOS) return {};
    if (animDone) return {};
    if (!visible) return { opacity: 0 };
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