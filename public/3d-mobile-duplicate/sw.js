'use strict';
const VERSION='mobile-builder-v17-flat-sky';
const CACHE_PREFIX='mobile-builder-';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).catch(()=>{}).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n.startsWith(CACHE_PREFIX)&&n!==VERSION).map(n=>caches.delete(n)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
async function patchHTML(response){
  const type=response.headers.get('content-type')||'';
  if(!type.includes('text/html'))return response;
  let html=await response.text();
  html=html.replace(/pitch=THREE\.MathUtils\.clamp\(pitch\+dy\*\.009,-1\.25,1\.25\)/g,'pitch=THREE.MathUtils.clamp(pitch-dy*.009,-1.25,1.25)');
  html=html.replace(/pitch=THREE\.MathUtils\.clamp\(pitch\+e\.movementY\*\.006,-1\.25,1\.25\)/g,'pitch=THREE.MathUtils.clamp(pitch-e.movementY*.006,-1.25,1.25)');
  html=html.replace('let px=0,py=1.68,pz=6,yaw=0,pitch=.12,moveX=0,moveY=0,velX=0,velZ=0,camDown=false,lastX=0,lastY=0;','let px=0,py=1.68,pz=6,yaw=0,pitch=.12,moveX=0,moveY=0,velX=0,velZ=0,camDown=false,lastX=0,lastY=0;');
  html=html.replace('const raw=Math.hypot(ix,iy);if(raw>1){ix/=raw;iy/=raw}const mag=Math.min(1,raw),fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw),speed=9.5;const targetX=(fx*iy+rx*ix)*speed*mag,targetZ=(fz*iy+rz*ix)*speed*mag;velX+=(targetX-velX)*.24;velZ+=(targetZ-velZ)*.24;if(mag<.01){velX*=.82;velZ*=.82}px+=velX/60;pz+=velZ/60;','const raw=Math.hypot(ix,iy);if(raw>1){ix/=raw;iy/=raw}const mag=Math.min(1,raw),fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw),speed=9.5;const targetX=(fx*iy+rx*ix)*speed*mag,targetZ=(fz*iy+rz*ix)*speed*mag;velX+=(targetX-velX)*.24;velZ+=(targetZ-velZ)*.24;if(mag<.01){velX*=.82;velZ*=.82}px+=velX/60;pz+=velZ/60;');
  html=html.replace('velocity:{x:+(moveX*5.5).toFixed(4),z:+(moveY*5.5).toFixed(4)}','velocity:{x:+velX.toFixed(4),z:+velZ.toFixed(4)}');
  html=html.replace('</head>','<style>html,body{background:#87ceeb!important}.joystick{left:22px!important;right:auto!important;top:auto!important;bottom:calc(env(safe-area-inset-bottom) + 28px)!important;position:absolute!important;display:block!important;z-index:20!important}.stick{position:absolute!important;transition:transform .04s linear!important}.agent-window,.live-monitor,.build-banner{display:none!important}</style></head>');
  html=html.replace('new THREE.PerspectiveCamera(78,innerWidth/innerHeight,.05,220)','new THREE.PerspectiveCamera(78,innerWidth/innerHeight,.05,700)');
  html=html.replace('scene.background=new THREE.Color(0xb9c1c6);scene.fog=new THREE.Fog(0xb9c1c6,70,180);','scene.background=new THREE.Color(0x87ceeb);scene.fog=new THREE.Fog(0x87ceeb,320,680);');
  const sky=`
  const skySun=new THREE.Mesh(new THREE.SphereGeometry(7,24,24),new THREE.MeshBasicMaterial({color:0xfff4b0}));
  skySun.position.set(-180,120,-360);scene.add(skySun);
  const cloudCanvas=document.createElement('canvas');cloudCanvas.width=256;cloudCanvas.height=128;const cloudCtx=cloudCanvas.getContext('2d');cloudCtx.fillStyle='rgba(255,255,255,.92)';[[58,68,42],[92,54,34],[126,66,38],[160,70,30],[78,78,28],[137,80,27]].forEach(([x,y,r])=>{cloudCtx.beginPath();cloudCtx.arc(x,y,r,0,Math.PI*2);cloudCtx.fill()});
  const cloudTexture=new THREE.CanvasTexture(cloudCanvas);cloudTexture.colorSpace=THREE.SRGBColorSpace;
  const cloudMat=new THREE.SpriteMaterial({map:cloudTexture,transparent:true,depthWrite:false,opacity:.9});
  const cloudPositions=[[-220,72,-360,42],[ -130,48,-430,32],[-35,86,-390,46],[70,58,-470,38],[170,78,-400,44],[265,52,-350,34],[-300,105,-500,48],[-70,118,-520,40],[120,105,-540,52],[310,96,-510,43],[-430,68,-470,38],[430,82,-460,45],[-520,115,-560,50],[500,125,-600,48],[-180,145,-620,42],[230,138,-650,46]];
  for(const [x,y,z,size] of cloudPositions){const s=new THREE.Sprite(cloudMat);s.position.set(x,y,z);s.scale.set(size,size*.5,1);scene.add(s)}
  `;
  html=html.replace('scene.add(sun);','scene.add(sun);'+sky);
  return new Response(html,{status:response.status,statusText:response.statusText,headers:response.headers});
}
async function networkFirst(request){try{const res=await fetch(request,{cache:'no-store'});if(!res.ok)return res;const transformed=request.mode==='navigate'?await patchHTML(res):res;const c=await caches.open(VERSION);c.put(request,transformed.clone()).catch(()=>{});return transformed}catch{const hit=await caches.match(request);return hit||new Response('',{status:504})}}
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;if(event.request.mode==='navigate'||event.request.url.includes('/3d-mobile-duplicate/'))event.respondWith(networkFirst(event.request))});