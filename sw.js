const VERSION='rupiah-pocket-v3-20261116-r1';
const ASSETS=['./','./index.html','./styles.css','./app.js','./amount.js','./rates.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('rupiah-pocket-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.origin!==self.location.origin||e.request.method!=='GET')return;
  // Navigation and modules always come from the same installed shell version.
  e.respondWith((async()=>{
    const cache=await caches.open(VERSION);
    const cached=await cache.match(e.request.mode==='navigate'?'./index.html':e.request);
    return cached||fetch(e.request);
  })());
});
