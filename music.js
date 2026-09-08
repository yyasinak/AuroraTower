'use strict';
(() => {
  const audio = new Audio();
  audio.loop = true;
  audio.preload = 'metadata';
  let source = 'assets/audio/stayin-alive.mp3', active = false, enabled = true, volume = .18;
  let fadeId = null, fadeGeneration = 0;
  audio.src = source;
  const status = document.getElementById('musicStatus');
  const toggle = document.getElementById('musicToggle');
  const slider = document.getElementById('musicVolume');
  status.textContent = 'Stayin’ Alive · Neon 1986 turunda otomatik çalar';
  function stopFade() {
    fadeGeneration++;
    if (fadeId !== null) cancelAnimationFrame(fadeId);
    fadeId = null;
  }
  try {
    const saved = Number(localStorage.getItem('auroraMusicVolume') ?? .18);
    if (Number.isFinite(saved)) volume = Math.max(0, Math.min(.5, saved));
    enabled = localStorage.getItem('auroraMusicEnabled') !== 'false';
  } catch {}
  function sync() {
    stopFade();
    audio.volume = volume;
    slider.value = String(Math.round(volume * 100));
    document.getElementById('musicPercent').textContent = Math.round(volume * 100) + '%';
    toggle.textContent = enabled ? 'MÜZİK AÇIK' : 'MÜZİK KAPALI';
    if (active && enabled && source) {
      audio.play().catch(() => { status.textContent = 'Çalmak için MÜZİK AÇIK düğmesine bas.'; });
    } else audio.pause();
  }
  toggle.onclick = () => {
    enabled = !enabled;
    try { localStorage.setItem('auroraMusicEnabled', String(enabled)); } catch {}
    sync();
  };
  slider.oninput = () => {
    volume = Math.max(0, Math.min(.5, Number(slider.value) / 100));
    try { localStorage.setItem('auroraMusicVolume', String(volume)); } catch {}
    sync();
  };
  audio.onerror = () => { status.textContent = 'Şarkı açılamadı. Oyunu assets klasörüyle birlikte yeniden indir.'; };
  window.TowerMusic = {
    setPlaying(value) { active = value; sync(); },
    fadeOut() {
      active = false;
      stopFade();
      if (audio.paused || !enabled) { audio.pause(); return; }
      const generation = fadeGeneration, initialVolume = audio.volume;
      let started = null;
      function tick(now) {
        if (generation !== fadeGeneration) return;
        if (started === null) started = now;
        const progress = Math.min(1, (now - started) / 1200);
        audio.volume = initialVolume * (1 - progress) ** 2;
        if (progress < 1) fadeId = requestAnimationFrame(tick);
        else { audio.pause(); audio.volume = volume; fadeId = null; }
      }
      fadeId = requestAnimationFrame(tick);
    }
  };
  sync();
})();
