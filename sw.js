/* 직구 계산기 서비스워커 — 앱 셸 캐시(오프라인 + 빠른 실행) */
var CACHE = 'jikgu-buy-v1';
var SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(SHELL); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if(k!==CACHE) return caches.delete(k);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  var url = new URL(e.request.url);
  // 노션 저장 함수는 항상 네트워크 (캐시 금지)
  if(url.pathname.indexOf('/.netlify/functions/') === 0){
    return; // 브라우저 기본 동작
  }
  // 그 외 정적 파일: 캐시 우선, 없으면 네트워크
  e.respondWith(
    caches.match(e.request).then(function(hit){
      return hit || fetch(e.request).then(function(res){
        return res;
      }).catch(function(){ return caches.match('./index.html'); });
    })
  );
});
