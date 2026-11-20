const C='kompres-pdf-v2',F=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
async function cleanResponse(response){
  if(!response || !response.ok) return response;
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html')) return response;
  const html=await response.text();
  const patch=`<script>
  (() => {
    const removeInstallLabel = () => {
      document.querySelectorAll('body *').forEach(el => {
        if (el.children.length === 0 && (el.textContent || '').trim() === 'Pasang di layar utama') {
          const target = el.closest('button') || el.closest('[role="button"]') || el;
          target.remove();
        }
      });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', removeInstallLabel, { once: true });
    else removeInstallLabel();
    new MutationObserver(removeInstallLabel).observe(document.documentElement, { childList: true, subtree: true });
  })();
  </script>`;
  return new Response(html.replace('</body>', patch + '</body>'), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  e.respondWith((async()=>{
    let response=await caches.match(e.request);
    if(!response){
      try {
        response=await fetch(e.request);
        if(response && response.ok) caches.open(C).then(c=>c.put(e.request,response.clone()));
      } catch(err) {
        response=await caches.match('./index.html');
      }
    }
    if(e.request.mode==='navigate' || (e.request.destination==='document')) return cleanResponse(response);
    return response;
  })());
});
