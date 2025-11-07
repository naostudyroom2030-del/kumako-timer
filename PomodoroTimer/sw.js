// sw.js — くまこPWA
const CACHE = 'kumako-pwa-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './kumako.png',
  './icons/icon-180.png',
  './icons/icon-512.png'
];

// インストール：静的アセットをキャッシュ
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// アクティベート：古いキャッシュ削除
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k === CACHE ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

// フェッチ：HTMLはネット優先、その他はキャッシュ優先
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const accept = req.headers.get('accept') || '';
  const isHTML = accept.includes('text/html');

  if (isHTML) {
    // ネット → ダメならキャッシュ
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(cache => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
  } else {
    // キャッシュ → ないならネット
    e.respondWith(
      caches.match(req).then(r => r || fetch(req).then(res => {
        // 取得できたら静的ファイルはキャッシュ
        if (res.ok && req.method === 'GET' && req.url.startsWith(self.location.origin)) {
          const copy = res.clone();
          caches
