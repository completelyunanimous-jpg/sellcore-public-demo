'use strict';
const VERSION='3dmobile-duplicate-v2-landscape';
const CACHE_PREFIX='3dmobile-duplicate-';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon.svg','./landscape-fix.css'];
self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL)).catch(()=>{}).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n.startsWith(CACHE_PREFIX)&&n!==VERSION).map(n=>caches.delete(n)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});
async function networkFirst(request){try{let res=await fetch(request,{cache:'no-store'});if(res.ok){if(request.mode==='navigate'){const text=await res.text();if(!text.includes('landscape-fix.css')){const patched=text.replace('</head>','<link rel="stylesheet" href="./landscape-fix.css"></head>');res=new Response(patched,{status:res.status,statusText:res.statusText,headers:{'Content-Type':'text/html; charset=utf-8'}})}}const c=await caches.open(VERSION);c.put(request,res.clone()).catch(()=>{})}return res}catch{const hit=await caches.match(request);return hit||new Response('',{status:504})}}
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;if(event.request.mode==='navigate'){event.respondWith(networkFirst(event.request));return}if(event.request.url.includes('/3d-mobile-duplicate/'))event.respondWith(networkFirst(event.request))});
