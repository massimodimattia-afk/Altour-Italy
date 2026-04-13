import { motion, AnimatePresence } from "framer-motion";
import { Download, RefreshCw, X } from "lucide-react";
import { usePWA } from "../hooks/usePWA";
import { isIOS } from "../utils/motion";

export function iosClean(className: string): string {
  if (!isIOS) return className;
  return className
    .split(" ")
    .filter(c => !c.includes("backdrop-blur") && !c.includes("backdrop-filter"))
    .join(" ");
}

export default function PWAPrompt() {
  const { isInstallable, hasUpdate, promptInstall, dismissInstall, dismissUpdate } = usePWA();

  return (
    <>
      {/* ── Banner installa app ────────────────────────────────────────────── */}
      <AnimatePresence>
        {isInstallable && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-[200]"
          >
            <div className="bg-[#1c1917] text-white rounded-[1.5rem] p-5 shadow-2xl border border-white/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-sky/20 flex items-center justify-center flex-shrink-0">
                <Download size={18} className="text-brand-sky" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-sky mb-0.5">
                  Installa l'app
                </p>
                <p className="text-xs font-bold text-white/80 leading-snug">
                  Aggiungi Altour alla home screen
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={promptInstall}
                  className="bg-brand-sky text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0284c7] transition-all active:scale-95"
                >
                  Installa
                </button>
                {/* Il dismiss nasconde solo il banner, non blocca future installazioni */}
                <button
                  onClick={dismissInstall}
                  className="text-white/30 hover:text-white/60 transition-colors p-1"
                  aria-label="Chiudi"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast aggiornamento disponibile ───────────────────────────────── */}
      <AnimatePresence>
        {hasUpdate && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            className="fixed top-4 left-4 right-4 md:left-auto md:right-6 md:w-80 z-[200]"
          >
            <div className="bg-white rounded-[1.5rem] p-4 shadow-2xl border border-stone-100 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-sky/10 flex items-center justify-center flex-shrink-0">
                <RefreshCw size={16} className="text-brand-sky" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-sky mb-0.5">
                  Aggiornamento
                </p>
                <p className="text-xs font-bold text-stone-600 leading-snug">
                  Nuova versione disponibile
                </p>
              </div>
              <button
                onClick={dismissUpdate}
                className="bg-brand-stone text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-sky transition-all active:scale-95 flex-shrink-0"
              >
                Aggiorna
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}