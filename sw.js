// Offline-Cache für Büsra's Planer.
// Bei einem Update der App: VERSION hochzählen, dann lädt das Handy die neuen Dateien.
const VERSION = "planer-v10";
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
// Texte kommen verschlüsselt an ("c") und werden nur hier auf dem Handy entschlüsselt.
// Der Schlüssel liegt in IndexedDB und wurde von der App auf diesem Gerät erzeugt.
function keyGet() {
  return new Promise((res, rej) => {
    const r = indexedDB.open("planer-keys", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("k");
    r.onerror = () => rej(r.error);
    r.onsuccess = () => {
      const q = r.result.transaction("k").objectStore("k").get("note");
      q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error);
    };
  });
}
const fromB64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), c => c.charCodeAt(0));
async function unseal(c) {
  const key = await keyGet(); if (!key) throw new Error("kein Schlüssel");
  const raw = fromB64u(c);
  const pt = await crypto.subtle.decrypt({name: "AES-GCM", iv: raw.slice(0, 12)}, key, raw.slice(12));
  return JSON.parse(new TextDecoder().decode(pt));
}

self.addEventListener("push", e => {
  e.waitUntil((async () => {
    let msg = {};
    try { msg = e.data ? e.data.json() : {}; } catch { msg = {body: e.data?.text()}; }
    let title = msg.title, body = msg.body;
    if (msg.c) {
      try { const p = await unseal(msg.c); title = p.t; body = p.b; }
      catch { title = "Büsra's Planer"; body = "Du hast eine Erinnerung. Öffne die App."; }
    }
    await self.registration.showNotification(title || "Büsra's Planer", {
      body: body || "",
      tag: msg.tag || undefined,
      renotify: !!msg.tag,
      icon: "icon-192.png",
      badge: "icon-192.png",
      data: {url: self.registration.scope},
    });
  })());
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
