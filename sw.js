const CACHE_NAME='adineh-v2.1';
const ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c=>Promise.allSettled(ASSETS.map(url=>c.add(url).catch(err=>console.warn('کش نشد:',url,err)))))
  );
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  
  // CDN: اول شبکه، بعد کش
  if(e.request.url.includes('cdn.jsdelivr.net')){
    e.respondWith(
      fetch(e.request).then(r=>{
        if(r&&r.status===200){
          const clone=r.clone();
          caches.open(CACHE_NAME).then(c=>c.put(e.request,clone));
        }
        return r;
      }).catch(()=>caches.match(e.request))
    );
    return;
  }
  
  // بقیه: اول کش، بعد شبکه
  e.respondWith(
    caches.match(e.request).then(cached=>{
      const fetchPromise=fetch(e.request).then(r=>{
        if(r&&r.status===200){
          const clone=r.clone();
          caches.open(CACHE_NAME).then(c=>c.put(e.request,clone));
        }
        return r;
      }).catch(()=>cached);
      return cached||fetchPromise;
    })
  );
});
