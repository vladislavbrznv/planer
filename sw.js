// Offline-Cache für Büsra's Planer.
// Bei einem Update der App: VERSION hochzählen, dann lädt das Handy die neuen Dateien.
const VERSION = "planer-v8";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  // cache: "reload" umgeht den Browser-Zwischenspeicher, damit wirklich die neuen Dateien landen
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, {cache: "reload"})))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ---------- Benachrichtigungen ----------
self.addEventListener("push", e => {
  let msg = {};
  try { msg = e.data ? e.data.json() : {}; } catch { msg = {body: e.data?.text()}; }
  e.waitUntil(self.registration.showNotification(msg.title || "Büsra's Planer", {
    body: msg.body || "",
    tag: msg.tag || undefined,
    renotify: !!msg.tag,
    icon: "icon-192.png",
    badge: "icon-192.png",
    data: {url: self.registration.scope},
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({type: "window", includeUncontrolled: true});
    const open = all.find(c => c.url.startsWith(self.registration.scope));
    if (open) return open.focus();
    return self.clients.openWindow(self.registration.scope);
  })());
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Schriftarten von Google: einmal laden, danach aus dem Cache
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(VERSION).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      try { const res = await fetch(req); c.put(req, res.clone()); return res; }
      catch { return new Response("", {status: 504}); }
    }));
    return;
  }

  if (url.origin !== location.origin) return;

  // Eigene Dateien: erst Cache (offline), im Hintergrund aktualisieren
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(req, {ignoreSearch: true});
    const net = fetch(req, {cache: "no-cache"}).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => null);
    return hit || (await net) || c.match("./index.html");
  }));
});
