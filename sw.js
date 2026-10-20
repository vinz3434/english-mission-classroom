// Cache local limité au chemin de cette application, sans suivi ni API.
const PREFIX = 'english-mission:' + self.registration.scope + ':';
const CACHE = PREFIX + 'v4';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(async cache => {
      try {
        const response = await fetch(event.request);
        if (!response.ok) return (await cache.match('./index.html')) || response;
        await cache.put('./index.html', response.clone());
        await cache.put('./', response.clone());
        return response;
      } catch { return (await cache.match('./index.html')) || Response.error(); }
    }));
    return;
  }
  event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(event.request)) || fetch(event.request)));
});
