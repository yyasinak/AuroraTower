'use strict';
(() => {
  const audio = new Audio();
  audio.loop = true;
  audio.preload = 'metadata';
  let source = null, active = false, enabled = true, volume = .18;
  const status = document.getElementById('musicStatus');
  const toggle = document.getElementById('musicToggle');
  const slider = document.getElementById('musicVolume');
  try {
    const saved = Number(localStorage.getItem('auroraMusicVolume') ?? .18);
    if (Number.isFinite(saved)) volume = Math.max(0, Math.min(.5, saved));
    enabled = localStorage.getItem('auroraMusicEnabled') !== 'false';
  } catch {}
  function sync() {
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
  document.getElementById('musicFile').onchange = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    audio.pause();
    if (source) URL.revokeObjectURL(source);
    source = URL.createObjectURL(file);
    audio.src = source;
    status.textContent = file.name + ' · Neon 1986 turunda çalar';
    sync();
  };
  audio.onerror = () => { status.textContent = 'Bu dosya oynatılamadı. MP3, OGG veya WAV seç.'; };
  window.TowerMusic = { setPlaying(value) { active = value; sync(); } };
  sync();
})();
