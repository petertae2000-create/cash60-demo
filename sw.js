const CACHE_NAME = 'xgis-cash60-v2-4-5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// v2.4.3: WebLLM 라이브러리(esm.run·jsdelivr)를 최초 온라인 실행 시 저장해 오프라인 재실행 지원
// 모델 가중치는 WebLLM이 자체 캐시에 저장하므로 여기서 중복 저장하지 않음
const RUNTIME_HOSTS = ['esm.run', 'cdn.jsdelivr.net'];

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (RUNTIME_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((hit) => hit || fetch(event.request).then((res) => {
          if (res && res.ok) cache.put(event.request, res.clone());
          return res;
        }))
      )
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
