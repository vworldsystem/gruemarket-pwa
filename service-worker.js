const CACHE_NAME = 'gruemarket-v1';
const urlsToCache = [
  '/gruemarket-pwa/',
  '/gruemarket-pwa/index.html',
  '/gruemarket-pwa/manifest.json'
];

// Service Worker 설치
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('캐시 생성됨:', CACHE_NAME);
      return cache.addAll(urlsToCache);
    }).catch((error) => {
      console.log('캐시 생성 실패:', error);
    })
  );
  self.skipWaiting();
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('오래된 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim();
});

// 네트워크 요청 인터셉트
self.addEventListener('fetch', (event) => {
  // GET 요청만 처리
  if (event.request.method !== 'GET') {
    return;
  }

  // 외부 링크는 캐싱하지 않음
  if (!event.request.url.includes('/gruemarket-pwa/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // 캐시에 있으면 반환
      if (response) {
        return response;
      }

      // 캐시에 없으면 네트워크에서 가져오기
      return fetch(event.request).then((response) => {
        // 유효하지 않은 응답은 그대로 반환
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // 응답을 복제하여 캐시에 저장
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // 네트워크 실패 시 캐시된 버전 반환
        return caches.match(event.request);
      });
    })
  );
});
