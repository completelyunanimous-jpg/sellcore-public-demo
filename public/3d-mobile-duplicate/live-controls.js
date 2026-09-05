(()=>{
  const boot=()=>{
    if(window.__mobileLiveControls)return; window.__mobileLiveControls=true;
    const ui=document.querySelector('#ui'); if(!ui)return;
    const panel=document.createElement('div'); panel.id='liveControls';
    panel.innerHTML='<div class="tick-head"><span>TICK LIVE</span><b id="tickRate">60 Hz</b></div><div id="tickFeed">BOOTING TICK STREAM…</div><label class="sens-row"><span>CAM SENS</span><input id="sensitivity" type="range" min="0.5" max="3" step="0.05" value="1"><b id="sensValue">1.00×</b></label><label class="sens-row"><span>MOVE ACCEL</span><input id="moveAcceleration" type="range" min="0.5" max="3" step="0.05" value="1"><b id="moveAccelValue">1.00×</b></label>';
    ui.appendChild(panel);
    const style=document.createElement('style'); style.textContent=`#liveControls{position:absolute;right:max(12px,env(safe-area-inset-right) + 8px);top:calc(env(safe-area-inset-top) + 48px);width:min(210px,34vw);padding:10px 11px;border:1px solid rgba(255,255,255,.13);border-radius:14px;background:rgba(5,9,14,.72);backdrop-filter:blur(12px);pointer-events:auto;color:#dce5ef;font:10px ui-monospace,SFMono-Regular,Menlo,monospace;box-shadow:0 10px 30px rgba(0,0,0,.22)}#liveControls .tick-head{display:flex;justify-content:space-between;gap:8px;letter-spacing:.12em;font-weight:800;margin-bottom:6px}#liveControls .tick-head b{color:#7cf7c4}#tickFeed{height:42px;overflow:hidden;color:#8290a0;line-height:14px;white-space:pre}#tickFeed .live{color:#b9c7d6}.sens-row{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:7px;border-top:1px solid rgba(255,255,255,.09);padding-top:8px;margin-top:7px;letter-spacing:.08em}.sens-row input{width:100%;accent-color:#7cf7c4}.sens-row b{min-width:36px;text-align:right;color:#fff}@media(max-width:599px) and (orientation:portrait){#liveControls{width:184px;right:10px;top:calc(env(safe-area-inset-top) + 45px)}}@media(min-width:600px){#liveControls{width:230px}}`; document.head.appendChild(style);
    const range=document.querySelector('#sensitivity'),out=document.querySelector('#sensValue'); let sensitivity=1;
    range.addEventListener('input',()=>{sensitivity=+range.value;out.textContent=sensitivity.toFixed(2)+'×';window.dispatchEvent(new CustomEvent('player-sensitivity',{detail:sensitivity}))});
    const accelRange=document.querySelector('#moveAcceleration'),accelOut=document.querySelector('#moveAccelValue'); let moveAcceleration=1;
    accelRange.addEventListener('input',()=>{moveAcceleration=+accelRange.value;accelOut.textContent=moveAcceleration.toFixed(2)+'×';window.dispatchEvent(new CustomEvent('joystick-acceleration-sensitivity',{detail:moveAcceleration}))});

    // 360-degree joystick is owned by the original movement code. This layer only supplies
    // acceleration sensitivity as a scalar; it never intercepts or reshapes joystick coordinates.
    window.__joystickAccelerationSensitivity=1;
    window.addEventListener('joystick-acceleration-sensitivity',e=>{window.__joystickAccelerationSensitivity=e.detail});

    // Touch camera sensitivity: replace the original camera touch handler at capture phase.
    let touchActive=false,lastX=0,lastY=0;
    const cam=document.querySelector('#camZone');
    cam.addEventListener('touchstart',e=>{const t=e.changedTouches[0];touchActive=true;lastX=t.clientX;lastY=t.clientY;e.stopImmediatePropagation()},{capture:true,passive:false});
    cam.addEventListener('touchmove',e=>{if(!touchActive)return;e.stopImmediatePropagation();e.preventDefault();const t=e.changedTouches[0],dx=t.clientX-lastX,dy=t.clientY-lastY;lastX=t.clientX;lastY=t.clientY;window.dispatchEvent(new MouseEvent('mousemove',{bubbles:true,buttons:1,clientX:t.clientX,clientY:t.clientY,movementX:dx*sensitivity,movementY:dy*sensitivity}))},{capture:true,passive:false});
    cam.addEventListener('touchend',e=>{touchActive=false;e.stopImmediatePropagation()},{capture:true,passive:false});
    cam.addEventListener('touchcancel',e=>{touchActive=false;e.stopImmediatePropagation()},{capture:true,passive:false});

    let ticks=0,last=performance.now(),samples=[]; const feed=document.querySelector('#tickFeed');
    const tick=()=>{const now=performance.now(),dt=now-last;last=now;samples.push(dt);if(samples.length>30)samples.shift();const hz=1000/(samples.reduce((a,b)=>a+b,0)/samples.length||16.67);document.querySelector('#tickRate').textContent=Math.round(hz)+' Hz';const stamp=new Date().toLocaleTimeString([], {hour12:false});const lines=[`[${stamp}] TICK ${String(++ticks).padStart(6,'0')}  ${hz.toFixed(1)}Hz`,`[${stamp}] INPUT   cam=${sensitivity.toFixed(2)}x move=${moveAcceleration.toFixed(2)}x`,`[${stamp}] WORLD   LIVE / LOCAL`];feed.innerHTML=lines.map((x,i)=>i===0?`<span class="live">${x}</span>`:x).join('\n');requestAnimationFrame(tick)};requestAnimationFrame(tick);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
