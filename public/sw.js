// Service Worker di emergenza - si autodistrugge
console.log('SW EMERGENZA: Auto-deregistrazione in corso');

// Passo 1: Immediatamente skippa waiting e attivati
self.addEventListener('install', (event) => {
  console.log('SW: Installazione - mi autodistruggo');
  self.skipWaiting();
  
  // Non mettere nulla in cache
  event.waitUntil(Promise.resolve());
});

// Passo 2: Attivazione - deregistrati e elimina tutto
self.addEventListener('activate', (event) => {
  console.log('SW: Attivazione - deregistrazione forzata');
  
  event.waitUntil(
    Promise.all([
      // Elimina tutte le cache
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('Elimino cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }),
      
      // Prendi controllo di tutte le pagine
      self.clients.claim(),
      
      // Auto-deregistrazione dopo 2 secondi
      new Promise(resolve => {
        setTimeout(() => {
          self.registration.unregister();
          console.log('SW auto-deregistrato');
          resolve();
        }, 2000);
      })
    ])
  );
});

// Passo 3: NON intercettare NESSUNA richiesta
// Lascia un fetch handler vuoto che passa tutto
self.addEventListener('fetch', (event) => {
  // Lascia passare TUTTE le richieste senza caching
  event.respondWith(fetch(event.request));
});

// Auto-messaggio per distruzione
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UNREGISTER_SELF') {
    self.registration.unregister();
  }
});