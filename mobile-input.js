'use strict';
(() => {
  let axis=0,center=0,raw=0,ready=false,enabled=true;
  try{enabled=localStorage.getItem('auroraTiltEnabled')!=='false';}catch{}
  window.TowerTilt={
    sample(value){if(!Number.isFinite(value))return;raw=value;if(!ready){center=raw;ready=true;}const delta=raw-center;const target=Math.abs(delta)<.18?0:Math.max(-1,Math.min(1,(delta-Math.sign(delta)*.18)/1.8));axis=target===0?0:axis+(target-axis)*.72;},
    axis(){return enabled?axis:0;},
    calibrate(){center=raw;axis=0;}
  };
  document.getElementById('calibrate').onclick=()=>window.TowerTilt.calibrate();
  const toggle=document.getElementById('tiltMode');
  function label(){toggle.textContent=enabled?'EĞME':'TUŞ';}
  toggle.onclick=()=>{enabled=!enabled;window.TowerTilt.calibrate();try{localStorage.setItem('auroraTiltEnabled',String(enabled));}catch{}label();};label();
})();
