import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface UsePWAReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  hasUpdate: boolean;
  promptInstall: () => Promise<void>;
  dismissInstall: () => void;
  dismissUpdate: () => void;
}

export function usePWA(): UsePWAReturn {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled]     = useState(false);
  const [hasUpdate, setHasUpdate]         = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // ── Rileva se già installata come PWA ────────────────────────────────────
    const mq = window.matchMedia("(display-mode: standalone)");
    setIsInstalled(mq.matches || (navigator as any).standalone === true);
    const handleChange = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mq.addEventListener("change", handleChange);

    // ── Intercetta il prompt di installazione nativo ─────────────────────────
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // ── Registra il Service Worker ───────────────────────────────────────────
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("[PWA] Service Worker registrato:", reg.scope);

          // Controlla aggiornamenti ogni 60 minuti
          setInterval(() => reg.update(), 60 * 60 * 1000);

          // SW in attesa → nuovo aggiornamento disponibile
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setHasUpdate(true);
              }
            });
          });
        })
        .catch((err) => console.warn("[PWA] Registrazione SW fallita:", err));

      // Ricarica quando il nuovo SW prende il controllo
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    }

    return () => {
      mq.removeEventListener("change", handleChange);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
      setIsInstalled(true);
    }
  };

  // Hides the banner without calling prompt() — the native prompt is preserved
  // so the browser can show it again later (e.g. via address bar mini-infobar).
  const dismissInstall = () => {
    setInstallPrompt(null);
  };

  const dismissUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
    setHasUpdate(false);
  };

  return {
    isInstallable: !!installPrompt && !isInstalled,
    isInstalled,
    hasUpdate,
    promptInstall,
    dismissInstall,
    dismissUpdate,
  };
}