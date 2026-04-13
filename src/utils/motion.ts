// utils/motion.ts
//
// FONTE UNICA di isIOS per tutta l'app.
// Importa da qui, mai ridichiarare altrove.
//
// Calcolato una volta a livello di modulo → non causa re-render,
// non viene ricalcolato ad ogni import.

export const isIOS =
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

// motionSafe: su iOS restituisce {} (niente animazioni FM),
// su Android/Desktop restituisce le props invariate.
//
// Utilizzo:
//   <motion.div {...motionSafe({ initial: {...}, animate: {...} })}>
//
// Su iOS diventa semplicemente:
//   <motion.div>  (nessuna animazione, nessun layer GPU)
export const motionSafe = <T extends object>(props: T): T | Record<string, never> =>
  isIOS ? {} : props;

// iosClean: rimuove le classi backdrop-blur da una stringa di classi Tailwind.
// Su non-iOS restituisce la stringa invariata.
//
// Utilizzo:
//   className={iosClean("bg-white/90 backdrop-blur-md sticky top-0")}
//
// Su iOS diventa: "bg-white/90 sticky top-0"
export const iosClean = (className: string): string => {
  if (!isIOS) return className;
  return className
    .split(" ")
    .filter(
      (c) =>
        !c.includes("backdrop-blur") &&
        !c.includes("backdrop-filter") &&
        !c.includes("backdrop-saturate")
    )
    .join(" ");
};