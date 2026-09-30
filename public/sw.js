/**
 * public/sw.js
 * ============
 * Service worker d'AubeShop — ce qui rend la PWA installable et utilisable
 * hors connexion.
 *
 * Conçu pour un réseau mobile burkinabè : souvent lent, parfois absent.
 * D'où deux stratégies distinctes plutôt qu'un cache global.
 *
 * Ce qui n'est JAMAIS mis en cache : les appels à Firebase. Servir une
 * réponse périmée pour un stock ou une commande serait pire que l'échec —
 * l'utilisateur commanderait un article déjà vendu.
 */

const VERSION = 'aubeshop-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;

/** Le strict nécessaire pour afficher quelque chose sans réseau. */
const SHELL = ['/', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

/** Hôtes dont les réponses ne doivent jamais être servies depuis le cache. */
const LIVE_HOSTS = [
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firebasestorage.googleapis.com',
  'www.googleapis.com',
];

// ============================================
// CYCLE DE VIE
// ============================================

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // `addAll` échoue en bloc si une seule ressource manque : on tolère
      // les absences pour ne pas empêcher l'installation.
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter((name) => !name.startsWith(VERSION)).map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ============================================
// INTERCEPTION
// ============================================

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // On ne touche qu'aux lectures : une commande ou une connexion doit
  // partir sur le réseau, ou échouer franchement.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Données vivantes : jamais de cache, jamais de repli périmé.
  if (LIVE_HOSTS.some((host) => url.hostname.endsWith(host))) return;

  // Navigation : le réseau d'abord, le cache en secours. L'utilisateur voit
  // toujours la version la plus récente quand il a du réseau, et garde une
  // app fonctionnelle quand il n'en a pas.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(SHELL_CACHE).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(async () => (await caches.match('/')) ?? Response.error())
    );
    return;
  }

  // Ressources statiques (scripts, styles, polices, images) : le cache
  // d'abord. Elles portent une empreinte dans leur nom, donc une version
  // en cache reste valable indéfiniment.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            // Une réponse partielle ou opaque n'a pas à être conservée.
            if (response.ok && response.type === 'basic') {
              const copy = response.clone();
              void caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
  }
});

/** Permet à la page de forcer l'activation d'une nouvelle version. */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') void self.skipWaiting();
});
