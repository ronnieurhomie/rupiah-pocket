const VERSION='rupiah-pocket-v4-20261116';
const ASSETS=['./','./styles.css','./app.js','./amount.js','./rates.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('rupiah-pocket-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.origin!==self.location.origin||e.request.method!=='GET')return;
  // Pages redirects index.html to /. Cache the canonical document to avoid
  // returning a redirected response to a navigation request.
  // Navigation and modules still share one installed shell version.
  e.respondWith((async()=>{
    const cache=await caches.open(VERSION);
    const cached=await cache.match(e.request.mode==='navigate'?'./':e.request);
    return cached||fetch(e.request);
  })());
});
