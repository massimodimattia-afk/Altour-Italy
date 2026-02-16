import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Elemento root non trovato. Controlla il file index.html');
}

const root = createRoot(container);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// ============================================================
// PULIZIA FORZATA DEL SERVICE WORKER - CODICE AGGRESSIVO
// ============================================================

if ('serviceWorker' in navigator) {
  // Funzione per deregistrare TUTTI i Service Worker
  const unregisterAllServiceWorkers = async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (let registration of registrations) {
        const success = await registration.unregister();
        console.log(`Service Worker deregistrato: ${registration.scope}`, success);
      }
      
      // Rimuovi anche qualsiasi Service Worker in attesa
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'UNREGISTER_SELF' });
      }
      
      // Pulisci la cache
      if (window.caches) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      console.log('Pulizia Service Worker completata');
      return registrations.length > 0;
    } catch (error) {
      console.error('Errore durante la pulizia del Service Worker:', error);
      return false;
    }
  };

  // Esegui immediatamente al caricamento
  window.addEventListener('load', () => {
    // Attendi un po' per essere sicuro che tutto sia caricato
    setTimeout(() => {
      unregisterAllServiceWorkers().then((hadSW) => {
        if (hadSW) {
          console.log('Vecchio Service Worker rimosso. Ricarica la pagina se vedi errori.');
          // Forza ricaricamento solo se c'era un Service Worker
          // window.location.reload();
        }
      });
    }, 1000);
  });

  // Forza anche al primo script execution
  unregisterAllServiceWorkers();
}
