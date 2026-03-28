// ─── Altour Italy — Service Worker ───────────────────────────────────────────
// Strategia:
//   • Cache-first   → asset statici (JS, CSS, immagini, font)
//   • Network-first → chiamate Supabase (dati sempre freschi, fallback cache)
//   • Offline page  → quando non c'è rete e la cache è vuota

const CACHE_VERSION = "altour-v1";
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const DATA_CACHE    = `${CACHE_VERSION}-data`;

// Asset da pre-cachare all'installazione
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/altour-logo.png",
  "/collage-escursioni.webp",
  "/offline.html",
];

// ─── INSTALL: pre-cacha gli asset fondamentali ────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        // Non bloccare l'install se un asset non è disponibile
        console.warn("[SW] Precache parziale:", err);
      });
    })
  );
  // Forza attivazione immediata senza aspettare il refresh
  self.skipWaiting();
});

// ─── ACTIVATE: rimuove cache vecchie ─────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith("altour-") && k !== STATIC_CACHE && k !== DATA_CACHE)
          .map((k) => {
            console.log("[SW] Elimino cache obsoleta:", k);
            return caches.delete(k);
          })
      )
    )
  );
  // Prendi controllo di tutte le tab aperte immediatamente
  self.clients.claim();
});

// ─── FETCH: intercetta le richieste ──────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora richieste non-GET e richieste browser-extension
  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  // ── Supabase API → Network-first ──────────────────────────────────────────
  if (url.hostname.includes("supabase.co")) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }

  // ── Navigazione HTML → Network-first con fallback offline ─────────────────
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/offline.html").then((r) => r || caches.match("/"))
      )
    );
    return;
  }

  // ── Asset statici (JS/CSS/immagini/font) → Cache-first ────────────────────
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|svg|woff2?|ttf|ico)$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // ── Tutto il resto → Network-first ────────────────────────────────────────
  event.respondWith(networkFirst(request, DATA_CACHE));
});

// ─── Strategie ────────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Asset non disponibile offline", { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: "Offline — dati non disponibili" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}