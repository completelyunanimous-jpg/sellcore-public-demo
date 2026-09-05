'use strict';
const VERSION='mobile-builder-v10-core';
const CACHE_PREFIX='mobile-builder-';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).catch(()=>{}).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n.startsWith(CACHE_PREFIX)&&n!==VERSION).map(n=>caches.delete(n)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
async function patchHTML(response){
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html'))return response;
  let html=await response.text();
  html=html.replace(/pitch=THREE\.MathUtils\.clamp\(pitch-dy\*\.009,-1\.25,1\.25\)/g,'pitch=THREE.MathUtils.clamp(pitch+dy*.009,-1.25,1.25)');
  html=html.replace(/pitch=THREE\.MathUtils\.clamp\(pitch-e\.movementY\*\.006,-1\.25,1\.25\)/g,'pitch=THREE.MathUtils.clamp(pitch+e.movementY*.006,-1.25,1.25)');
  html=html.replace(/tick\(now\);renderObserver\(\);renderer\.render/g,'tick(now);renderer.render');
  html=html.replace('</head>','<style>.agent-window,.live-monitor,.build-banner{display:none!important}</style></head>');
  return new Response(html,{status:response.status,statusText:response.statusText,headers:response.headers});
}
async function networkFirst(request){
  try{
    const res=await fetch(request,{cache:'no-store'});
    if(!res.ok)return res;
    const transformed=request.mode==='navigate'?await patchHTML(res):res;
    const c=await caches.open(VERSION);c.put(request,transformed.clone()).catch(()=>{});
    return transformed;
  }catch{
    const hit=await caches.match(request);return hit||new Response('',{status:504});
  }
}
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;if(event.request.mode==='navigate'||event.request.url.includes('/3d-mobile-duplicate/'))event.respondWith(networkFirst(event.request))});