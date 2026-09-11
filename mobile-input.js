'use strict';
(() => {
  let axis=0,center=0,raw=0,ready=false;
  window.TowerTilt={
    sample(value){if(!Number.isFinite(value))return;raw=value;if(!ready){center=raw;ready=true;}const delta=raw-center;const target=Math.abs(delta)<.35?0:Math.max(-1,Math.min(1,(delta-Math.sign(delta)*.35)/3));axis+=(target-axis)*.28;},
    axis(){return axis;},
    calibrate(){center=raw;axis=0;}
  };
  document.getElementById('calibrate').onclick=()=>window.TowerTilt.calibrate();
})();
