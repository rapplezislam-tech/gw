/* Golden Wolf — عامل الخدمة: يحفظ الصفحة ليعمل دون إنترنت بعد أول تحميل */
const V = 'gw-site-v2';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'data.gwdat'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  const isData = /\.gwdat$/.test(url.pathname);
  e.respondWith((async () => {
    const cache = await caches.open(V);
    if (isData) { // البيانات: الشبكة أولًا (أحدث نسخة)، ثم المحفوظة عند انقطاع الإنترنت
      try { const r = await fetch(req, { cache: 'no-cache' }); if (r.ok) cache.put(req, r.clone()); return r; } catch (err) { const c = await cache.match(req); if (c) return c; throw err; }
    }
    if (req.mode === 'navigate' || /(^|\/)(index\.html)?$/.test(url.pathname)) { // الصفحة نفسها: الشبكة أولًا حتى يصل كل تحديث فورًا، ثم المحفوظة دون إنترنت
      try { const r = await fetch(req, { cache: 'no-cache' }); if (r.ok) { cache.put('index.html', r.clone()); return r; } } catch (err) { /* دون إنترنت */ }
      const c0 = await cache.match('index.html') || await cache.match(req, { ignoreSearch: true }); if (c0) return c0;
    }
    const c = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then((r) => { if (r.ok) cache.put(req, r.clone()); return r; }).catch(() => null);
    return c || (await net) || Response.error();
  })());
});
