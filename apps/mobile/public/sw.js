// Service Worker - 비활성화됨
// 이 Service Worker는 아무 작업도 하지 않습니다.
// 기존 캐시를 정리하고 자체적으로 제거됩니다.

// Install Event - 즉시 활성화 (캐시 없음)
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install - no-op');
  self.skipWaiting();
});

// Activate Event - 모든 캐시 삭제 및 제거
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate - clearing all caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[Service Worker] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Service Worker 자체 제거
      return self.registration.unregister();
    }).then(() => {
      console.log('[Service Worker] Unregistered successfully');
    })
  );
});

// Fetch Event - 네트워크 직접 전달 (캐시 사용 안함)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

