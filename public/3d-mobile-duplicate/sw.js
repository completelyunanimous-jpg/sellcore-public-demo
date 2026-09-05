'use strict';
const VERSION='mobile-builder-v12-sky-joystick';
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
  html=html.replace('</head>','<style>html,body{background:#87ceeb!important}.joystick{left:22px!important;right:auto!important;top:auto!important;bottom:calc(env(safe-area-inset-bottom) + 28px)!important;position:absolute!important;display:block!important;z-index:20!important}.stick{position:absolute!important}.agent-window,.live-monitor,.build-banner{display:none!important}</style></head>');
  html=html.replace('scene.background=new THREE.Color(0xb9c1c6);scene.fog=new THREE.Fog(0xb9c1c6,70,180);','scene.background=new THREE.Color(0x87ceeb);scene.fog=new THREE.Fog(0x87ceeb,100,220);');
  const sky=''';
  const skySun=new THREE.Mesh(new THREE.SphereGeometry(8,24,24),new THREE.MeshBasicMaterial({color:0xfff4b0}));
  skySun.position.set(-55,70,-90);scene.add(skySun);
  const cloudMat=new THREE.MeshLambertMaterial({color:0xffffff,transparent:true,opacity:.9});
  const cloudData=[[-55,48,-65,1.5],[20,42,-95,1.1],[70,55,-55,1.35],[-10,52,-150,1.25]];
  for(const [cx,cy,cz,s] of cloudData){const g=new THREE.Group();[[0,0,0,7],[8,1,1,5],[-8,1,0,5],[2,3,0,5]].forEach(([x,y,z,r])=>{const m=new THREE.Mesh(new THREE.SphereGeometry(r*s,16,12),cloudMat);m.position.set(x*s,y*s,z*s);g.add(m)});g.position.set(cx,cy,cz);scene.add(g)}
  ''';
  html=html.replace('scene.add(sun);','scene.add(sun);'+sky);
  return new Response(html,{status:response.status,statusText:response.statusText,headers:response.headers});
}
async function networkFirst(request){try{const res=await fetch(request,{cache:'no-store'});if(!res.ok)return res;const transformed=request.mode==='navigate'?await patchHTML(res):res;const c=await caches.open(VERSION);c.put(request,transformed.clone()).catch(()=>{});return transformed}catch{const hit=await caches.match(request);return hit||new Response('',{status:504})}}
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;if(event.request.mode==='navigate'||event.request.url.includes('/3d-mobile-duplicate/'))event.respondWith(networkFirst(event.request))});