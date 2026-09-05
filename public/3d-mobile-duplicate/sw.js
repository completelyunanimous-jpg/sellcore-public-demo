'use strict';
const VERSION='mobile-builder-v18-flat-skyline';
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
  const skyCanvas=document.createElement('canvas');skyCanvas.width=2048;skyCanvas.height=1024;const skyCtx=skyCanvas.getContext('2d');
  const skyGrad=skyCtx.createLinearGradient(0,0,0,1024);skyGrad.addColorStop(0,'#63b9f3');skyGrad.addColorStop(.62,'#87ceeb');skyGrad.addColorStop(.82,'#9fd7ee');skyGrad.addColorStop(1,'#b8dfe9');skyCtx.fillStyle=skyGrad;skyCtx.fillRect(0,0,2048,1024);
  const drawCloud=(x,y,s)=>{skyCtx.save();skyCtx.fillStyle='rgba(255,255,255,.9)';skyCtx.beginPath();skyCtx.ellipse(x,y,s*1.7,s*.52,0,0,Math.PI*2);skyCtx.ellipse(x-s*.85,y+s*.05,s*.9,s*.42,0,0,Math.PI*2);skyCtx.ellipse(x+s*.2,y-s*.18,s*1.05,s*.5,0,0,Math.PI*2);skyCtx.ellipse(x+s*.95,y+s*.04,s*.78,s*.38,0,0,Math.PI*2);skyCtx.fill();skyCtx.restore()};
  [[90,620,42],[270,675,54],[470,600,46],[700,650,58],[940,575,40],[1160,660,55],[1390,610,48],[1610,675,60],[1840,600,44],[2040,650,50],[150,790,30],[540,760,34],[1010,745,32],[1490,770,36],[1870,760,30]].forEach(([x,y,s])=>drawCloud(x,y,s));
  const skyTexture=new THREE.CanvasTexture(skyCanvas);skyTexture.colorSpace=THREE.SRGBColorSpace;skyTexture.anisotropy=2;
  const skyDome=new THREE.Mesh(new THREE.SphereGeometry(600,64,32),new THREE.MeshBasicMaterial({map:skyTexture,side:THREE.BackSide,depthWrite:false,fog:false}));
  skyDome.position.set(0,0,0);scene.add(skyDome);
  `;
  html=html.replace('scene.add(sun);','scene.add(sun);'+sky);
  return new Response(html,{status:response.status,statusText:response.statusText,headers:response.headers});
}
async function networkFirst(request){try{const res=await fetch(request,{cache:'no-store'});if(!res.ok)return res;const transformed=request.mode==='navigate'?await patchHTML(res):res;const c=await caches.open(VERSION);c.put(request,transformed.clone()).catch(()=>{});return transformed}catch{const hit=await caches.match(request);return hit||new Response('',{status:504})}}
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;if(event.request.mode==='navigate'||event.request.url.includes('/3d-mobile-duplicate/'))event.respondWith(networkFirst(event.request))});