
const CACHE = 'rrs-cache-v2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json'
];
self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('fetch', (e)=>{
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request).then(resp=>{
      const respClone = resp.clone();
      caches.open(CACHE).then(c=>c.put(e.request, respClone));
      return resp;
    }).catch(()=> caches.match('./index.html')))
  );
});
