/* Service Worker: App-Shell cache-first, Daten network-first (Updates kommen an,
   offline gibt es den Cache). Bei neuen Inhalten CACHE-Version hochzählen. */
var CACHE = "vamos-v13";

var SHELL = [
  "./",
  "index.html",
  "css/style.css",
  "js/store.js",
  "js/icons.js",
  "js/ui.js",
  "js/srs.js",
  "js/audio.js",
  "js/data.js",
  "js/quiz.js",
  "js/conj.js",
  "js/tutor.js",
  "js/sync.js",
  "js/grammar.js",
  "js/app.js",
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // cache: "reload" umgeht den HTTP-Cache – sonst landen alte Dateien im SW-Cache
      return c.addAll(SHELL.map(function (u) {
        return new Request(u, { cache: "reload" });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;

  if (url.pathname.indexOf("/data/") >= 0) {
    // network-first + no-cache: frische Vokabeln (revalidiert per ETag), offline aus dem Cache
    e.respondWith(
      fetch(e.request.url, { cache: "no-cache" }).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      }).catch(function () {
        return caches.match(e.request);
      })
    );
  } else {
    // cache-first: App-Shell
    e.respondWith(
      caches.match(e.request).then(function (hit) {
        return hit || fetch(e.request).then(function (res) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
          return res;
        });
      })
    );
  }
});
