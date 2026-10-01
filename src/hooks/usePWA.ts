import { useEffect, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";

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
  applyUpdate: () => void; // prima si chiamava dismissUpdate
}

export function usePWA(): UsePWAReturn {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    setIsInstalled(mq.matches || (navigator as any).standalone === true);
    const handleChange = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mq.addEventListener("change", handleChange);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Unica registrazione del SW. Nessun reload automatico: solo il toast.
    updateSWRef.current = registerSW({
      immediate: true,
      onNeedRefresh() { setHasUpdate(true); },
      onRegisterError(err) { console.warn("[PWA] Registrazione SW fallita:", err); },
    });

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

  const dismissInstall = () => {
    setInstallPrompt(null);
  };

  // Unico punto in cui può partire un reload: su azione esplicita dell'utente.
  const applyUpdate = () => {
    setHasUpdate(false);
    updateSWRef.current?.(true);
  };

  return {
    isInstallable: !!installPrompt && !isInstalled,
    isInstalled,
    hasUpdate,
    promptInstall,
    dismissInstall,
    applyUpdate,
  };
}