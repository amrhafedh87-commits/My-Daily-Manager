const CACHE_NAME = "masareefi-v1";

const FILES = [
  "./login.html",
  "./index.html",
  "./style.css",
  "./login.js",
  "./script.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        return await caches.match(request) ||
          await caches.match("./login.html");
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      return cached || fetch(request);
    })
  );
});
