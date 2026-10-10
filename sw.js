/* LUGHAH PWA 0.7.3. Only public shell and hashed local assets; no API or account data. */
const CACHE = "lughah-public-shell-0.7.3-8abdab6ebf";
const PRECACHE = ["./index.html","./offline.html","./manifest.webmanifest","./icon.svg","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./apple-touch-icon.png","./assets/index-BOA5S-_7.js","./assets/index-DUkNJ_er.css"];
const OPTIONAL_ASSETS = ["./assets/AccountPage-BXTWTmAw.js","./assets/AdminPage-BMLpeZ0R.js","./assets/CollectionPage-BmhrCHo6.js","./assets/collectionService-Dybe-8sZ.js","./assets/ConfirmDialog-CgmR1hxW.js","./assets/DictionaryDraftManager-D7N8KjSB.js","./assets/dictionaryWordResolver-CSAJz7Mo.js","./assets/dictionaryXlsx-C0BzDwQr.js","./assets/HistoryPage-DAgTH1WB.js","./assets/LearnPage-CWVyJ_Qt.js","./assets/QuickDictionaryPreview-C1qCNeWr.js","./assets/SavedPage-no8YLq2L.js","./assets/speech-Db_-3vji.js","./assets/UserSettingsPage-KrmEK71o.js","./assets/wordActivityService-DD7Cr_zB.js","./assets/WordDetailPage-Clq_fYOV.js"];
const PRECACHE_PATHS = new Set(PRECACHE.map(p => new URL(p,self.registration.scope).pathname));
const OPTIONAL_PATHS = new Set(OPTIONAL_ASSETS.map(p => new URL(p,self.registration.scope).pathname));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)));
});
self.addEventListener('message', event => {
  if (['LUGHAH_APPLY_UPDATE','LUGHA_APPLY_UPDATE'].includes(event.data?.type) && event.source) self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(n => (n.startsWith('lughah-public-shell-') || n.startsWith('lugha-public-shell-')) && n !== CACHE).map(n => caches.delete(n)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const url = new URL(req.url);
  // Navigation needs network-first. Never cache a dynamic HTML response.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try { return await fetch(req, { cache: 'no-store' }); }
      catch {
        const cache = await caches.open(CACHE);
        return (await cache.match(new URL('./index.html', self.registration.scope))) ||
          (await cache.match(new URL('./offline.html', self.registration.scope))) || Response.error();
      }
    })());
    return;
  }
  // No Supabase calls, RPCs, auth routes, uploads, source maps or unknown URLs.
  if (PRECACHE_PATHS.has(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      return (await cache.match(req, {ignoreSearch: true})) || fetch(req);
    })());
    return;
  }
  if (!OPTIONAL_PATHS.has(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, {ignoreSearch: true});
    if (hit) return hit;
    const response = await fetch(req);
    if (response.ok && response.type === 'basic') {
      await cache.put(req, response.clone()).catch(() => {});
    }
    return response;
  })());
});
