/* Dori Yums — atelier service worker (scope /admin).
   Keeps the atelier's own page and scripts available to open the installed app
   without a connection; never caches data: orders, flavors and settings always
   come from Supabase. Everything is network-first (bypassing the HTTP cache), so
   a new deployment is picked up at the next open.
   When admin.html / js/admin.js / js/dy-data.js change: bump their ?v= here and VERSION. */
var VERSION = 'dy-atelier-v3';
var SHELL = [
  '/admin', '/admin.html', '/admin.webmanifest',
  '/js/admin-lang.js?v=1', '/js/admin.js?v=3', '/js/dy-data.js?v=3',
  '/assets/logo.webp', '/icons/icon-192.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(VERSION).then(function(cache){
    /* one by one and straight from the network: a missing URL (e.g. /admin on a plain
       local server) must not abort the install, and a stale HTTP-cached copy must not be stored */
    return Promise.all(SHELL.map(function(u){
      return fetch(u, { cache:'reload' }).then(function(res){ if(res.ok && !res.redirected) return cache.put(u, res); }).catch(function(){});
    }));
  }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k.indexOf('dy-atelier-') === 0 && k !== VERSION; })
      .map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

function fromNetwork(req, init){
  return fetch(req, init).then(function(res){
    if(res.ok && !res.redirected){ var copy = res.clone(); caches.open(VERSION).then(function(c){ c.put(req, copy); }); }
    return res;
  });
}

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return;            /* Supabase, fonts, CDN: straight to the network */
  if(url.pathname.indexOf('/api/') === 0) return;

  if(req.mode === 'navigate'){
    e.respondWith(fromNetwork(req).catch(function(){
      return caches.match(req)
        .then(function(hit){ return hit || caches.match('/admin'); })
        .then(function(hit){ return hit || caches.match('/admin.html'); })
        .then(function(hit){ return hit || new Response('Offline', { status:503, headers:{ 'Content-Type':'text/plain' } }); });
    }));
    return;
  }
  if(SHELL.indexOf(url.pathname + url.search) >= 0){
    e.respondWith(fromNetwork(req, { cache:'no-cache' }).catch(function(){ return caches.match(req); }));
  }
});

/* tap on a "new order" notification → open (or focus) the atelier */
self.addEventListener('notificationclick', function(e){
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type:'window', includeUncontrolled:true }).then(function(list){
    for(var i = 0; i < list.length; i++){ if(list[i].url.indexOf('/admin') >= 0 && 'focus' in list[i]) return list[i].focus(); }
    return self.clients.openWindow('/admin');
  }));
});
