// Service worker minimal, juste pour rendre le site "installable"
// (Chrome exige un service worker actif avec un gestionnaire fetch).
// Ne met rien en cache pour l'instant : le site fonctionne normalement,
// juste avec la possibilité d'être installé comme une app.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Passe simplement la requête telle quelle au réseau (aucun cache pour l'instant)
  event.respondWith(fetch(event.request));
});
