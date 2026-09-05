(()=>{
  const boot=()=>{
    if(window.__mobileLiveControls)return; window.__mobileLiveControls=true;
    const ui=document.querySelector('#ui'); if(!ui)return;
    const panel=document.createElement('div'); panel.id='liveControls';
    panel.innerHTML='<div class="tick-head"><span>TICK LIVE</span><b id="tickRate">60 Hz</b></div><div id="tickFeed">BOOTING TICK STREAM…</div><label class="sens-row"><span>SENSITIVITY</span><input id="sensitivity" type="range" min="0.5" max="3" step="0.05" value="1"><b id="sensValue">1.00×</b></label>';
    ui.appendChild(panel);
    const style=document.createElement('style'); style.textContent=`#liveControls{position:absolute;right:max(12px,env(safe-area-inset-right) + 8px);top:calc(env(safe-area-inset-top) + 48px);width:min(210px,34vw);padding:10px 11px;border:1px solid rgba(255,255,255,.13);border-radius:14px;background:rgba(5,9,14,.72);backdrop-filter:blur(12px);pointer-events:auto;color:#dce5ef;font:10px ui-monospace,SFMono-Regular,Menlo,monospace;box-shadow:0 10px 30px rgba(0,0,0,.22)}#liveControls .tick-head{display:flex;justify-content:space-between;gap:8px;letter-spacing:.12em;font-weight:800;margin-bottom:6px}#liveControls .tick-head b{color:#7cf7c4}#tickFeed{height:42px;overflow:hidden;color:#8290a0;line-height:14px;white-space:pre}#tickFeed .live{color:#b9c7d6}.sens-row{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:7px;border-top:1px solid rgba(255,255,255,.09);padding-top:8px;letter-spacing:.08em}.sens-row input{width:100%;accent-color:#7cf7c4}.sens-row b{min-width:36px;text-align:right;color:#fff}@media(max-width:599px) and (orientation:portrait){#liveControls{width:172px;right:10px;top:calc(env(safe-area-inset-top) + 45px)}}@media(min-width:600px){#liveControls{width:230px}}`; document.head.appendChild(style);
    const range=document.querySelector('#sensitivity'),out=document.querySelector('#sensValue'); let sensitivity=1;
    range.addEventListener('input',()=>{sensitivity=+range.value;out.textContent=sensitivity.toFixed(2)+'×';window.dispatchEvent(new CustomEvent('player-sensitivity',{detail:sensitivity}))});
    window.addEventListener('player-sensitivity',e=>{sensitivity=e.detail||1});
    // Scale the original camera look delta without replacing the original control system.
    let touchActive=false,lastX=0,lastY=0,mouseActive=false,lastMX=0,lastMY=0;
    const cam=document.querySelector('#camZone');
    cam.addEventListener('touchstart',e=>{const t=e.changedTouches[0];touchActive=true;lastX=t.clientX;lastY=t.clientY},{capture:true,passive:true});
    cam.addEventListener('touchmove',e=>{if(!touchActive)return;const t=e.changedTouches[0],dx=t.clientX-lastX,dy=t.clientY-lastY;lastX=t.clientX;lastY=t.clientY;if(sensitivity!==1){window.dispatchEvent(new CustomEvent('camera-sensitivity-delta',{detail:{dx:dx*(sensitivity-1),dy:dy*(sensitivity-1)}}))}},{capture:true,passive:true});
    cam.addEventListener('touchend',()=>touchActive=false,{capture:true,passive:true});
    addEventListener('mousemove',e=>{if(!e.buttons)return;if(!mouseActive){mouseActive=true;lastMX=e.clientX;lastMY=e.clientY;return}const dx=e.clientX-lastMX,dy=e.clientY-lastMY;lastMX=e.clientX;lastMY=e.clientY;if(sensitivity!==1)window.dispatchEvent(new CustomEvent('camera-sensitivity-delta',{detail:{dx:dx*(sensitivity-1),dy:dy*(sensitivity-1)}}))});
    addEventListener('mouseup',()=>mouseActive=false);
    let ticks=0,last=performance.now(),samples=[]; const feed=document.querySelector('#tickFeed');
    const tick=()=>{const now=performance.now(),dt=now-last;last=now;samples.push(dt);if(samples.length>30)samples.shift();const hz=1000/(samples.reduce((a,b)=>a+b,0)/samples.length||16.67);document.querySelector('#tickRate').textContent=Math.round(hz)+' Hz';const stamp=new Date().toLocaleTimeString([], {hour12:false});const lines=[`[${stamp}] TICK ${String(++ticks).padStart(6,'0')}  ${hz.toFixed(1)}Hz`,`[${stamp}] INPUT   sens=${sensitivity.toFixed(2)}x`,`[${stamp}] WORLD   LIVE / LOCAL`];feed.innerHTML=lines.map((x,i)=>i===0?`<span class="live">${x}</span>`:x).join('\n');requestAnimationFrame(tick)};requestAnimationFrame(tick);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
