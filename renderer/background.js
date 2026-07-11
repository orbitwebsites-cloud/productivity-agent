'use strict';

// Procedural backdrop for the app window — two scenes, picked at draw time by
// reading document.documentElement.dataset.theme (set at launch by preload.js
// from the saved config, and live-updatable by the theme picker/switch with
// no reload needed):
//   light: hazy daylight sky over layered rolling-hill ridges ("Daylight")
//   dark:  aurora bands + twinkling stars over a near-black night sky ("Midnight")
// Both painted low-res on a fixed canvas and blurred by CSS so they read like
// an out-of-focus photo. Vanilla (no build step) so it runs in the packaged
// Electron renderer as-is.

(function () {
  const canvas = document.getElementById('bgCanvas');
  const grain = document.getElementById('bgGrain');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function isDark() {
    return document.documentElement.dataset.theme === 'dark';
  }

  // ---- Light scene: "Daylight" rolling hills ----
  // Back-to-front ridges: [baseline y, amplitude, frequency, phase, color].
  // Foreground kept a muted mid-green (not near-black) so scrolled content over
  // the lower viewport still has enough contrast for dark text.
  const HILLS = [
    [0.42, 0.045, 2.1, 0.4, '#c7d49a'],
    [0.52, 0.06, 1.7, 2.2, '#b2c77f'],
    [0.62, 0.07, 1.4, 4.1, '#9bb968'],
    [0.74, 0.085, 1.2, 1.1, '#86a955'],
    [0.88, 0.1, 1.0, 3.3, '#749a47']
  ];

  function ridgeY(x, base, amp, freq, phase, h) {
    return h * (base
      + amp * Math.sin(x * freq * Math.PI * 2 + phase)
      + amp * 0.45 * Math.sin(x * freq * Math.PI * 4.7 + phase * 1.7));
  }

  function drawLight(t) {
    const w = canvas.width;
    const h = canvas.height;

    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    sky.addColorStop(0, '#e9efcf');
    sky.addColorStop(1, '#d5e2ac');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    const gx = w * (0.32 + 0.05 * Math.sin(t * 0.05));
    const gy = h * (0.2 + 0.03 * Math.cos(t * 0.04));
    const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, w * 0.55);
    glow.addColorStop(0, 'rgba(250, 247, 214, 0.8)');
    glow.addColorStop(1, 'rgba(250, 247, 214, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    const steps = 64;
    HILLS.forEach(([base, amp, freq, phase, color], i) => {
      const sway = 0.01 * Math.sin(t * 0.03 + i * 1.9);
      ctx.beginPath();
      ctx.moveTo(0, ridgeY(0, base + sway, amp, freq, phase, h));
      for (let s = 1; s <= steps; s++) {
        const x = s / steps;
        ctx.lineTo(x * w, ridgeY(x, base + sway, amp, freq, phase, h));
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      if (i < 3) {
        ctx.fillStyle = `rgba(224, 232, 188, ${0.3 - i * 0.09})`;
        ctx.fill();
      }
    });
  }

  // ---- Dark scene: "Midnight" aurora ----
  const AURORA = [
    { r: 60, g: 190, b: 165, peak: 0.12, speed: 0.012, freq: 3.2, width: 0.06 },
    { r: 100, g: 130, b: 230, peak: 0.22, speed: 0.009, freq: 2.5, width: 0.05 },
    { r: 180, g: 90, b: 180, peak: 0.34, speed: 0.015, freq: 2.8, width: 0.04 },
    { r: 45, g: 200, b: 150, peak: 0.46, speed: 0.008, freq: 3.6, width: 0.05 },
    { r: 140, g: 100, b: 220, peak: 0.58, speed: 0.011, freq: 2.2, width: 0.035 }
  ];

  const stars = [];
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: (i * 137.5 + i * i * 0.08) % 1,
      y: (i * 89.3 + i * i * 0.04) % 0.68,
      size: 0.4 + 1.8 * ((i * 47 + 13) % 100) / 100,
      phase: i * 3.7,
      speed: 0.3 + 0.5 * ((i * 23) % 100) / 100
    });
  }

  function drawDark(t) {
    const w = canvas.width;
    const h = canvas.height;

    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#050710');
    sky.addColorStop(0.25, '#0a0e1a');
    sky.addColorStop(0.5, '#0e1424');
    sky.addColorStop(0.75, '#0b1018');
    sky.addColorStop(1, '#060810');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    const nebulaX = w * (0.3 + 0.08 * Math.sin(t * 0.005));
    const nebulaY = h * (0.25 + 0.05 * Math.cos(t * 0.004));
    const nebula = ctx.createRadialGradient(nebulaX, nebulaY, 0, nebulaX, nebulaY, w * 0.4);
    nebula.addColorStop(0, 'rgba(80, 60, 140, 0.04)');
    nebula.addColorStop(0.5, 'rgba(40, 80, 120, 0.02)');
    nebula.addColorStop(1, 'transparent');
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, w, h);

    for (const band of AURORA) {
      const phase = t * band.speed;
      const yBase = h * band.peak;
      for (let x = 0; x < w; x++) {
        const nx = x / w;
        const yOff = h * band.width * Math.sin(nx * Math.PI * band.freq + phase);
        const amp = 0.10 + 0.07 * Math.sin(nx * Math.PI * band.freq * 0.6 + phase * 1.4);
        const fade = Math.sin(nx * Math.PI);
        const alpha = Math.max(0, amp * fade);
        ctx.fillStyle = `rgba(${band.r},${band.g},${band.b},${alpha})`;
        ctx.fillRect(x, yBase + yOff - 1.5, 1, 3);
      }
    }

    for (const star of stars) {
      const sx = star.x * w;
      const sy = star.y * h;
      const twinkle = 0.15 + 0.85 * Math.sin(t * star.speed + star.phase);
      ctx.beginPath();
      ctx.arc(sx, sy, star.size * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.12 * twinkle})`;
      ctx.fill();
    }

    const mx = w * (0.8 + 0.025 * Math.sin(t * 0.006));
    const my = h * (0.08 + 0.015 * Math.cos(t * 0.005));
    const moonGlow = ctx.createRadialGradient(mx, my, 0, mx, my, w * 0.3);
    moonGlow.addColorStop(0, 'rgba(180, 200, 255, 0.05)');
    moonGlow.addColorStop(0.3, 'rgba(140, 170, 255, 0.025)');
    moonGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = moonGlow;
    ctx.fillRect(0, 0, w, h);
  }

  function draw(t) {
    if (isDark()) drawDark(t); else drawLight(t);
  }

  function resize() {
    canvas.width = Math.max(320, Math.floor(window.innerWidth / 4));
    canvas.height = Math.max(180, Math.floor(window.innerHeight / 4));
  }
  resize();
  window.addEventListener('resize', resize);

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = null;
  function tick(now) {
    draw(now / 1000);
    frame = requestAnimationFrame(tick);
  }
  if (reduce.matches) {
    draw(0);
  } else {
    frame = requestAnimationFrame(tick);
  }
  window.addEventListener('beforeunload', () => { if (frame) cancelAnimationFrame(frame); });

  // Film grain to kill the flat-gradient look.
  if (grain) {
    const size = 140;
    const gc = document.createElement('canvas');
    gc.width = size;
    gc.height = size;
    const gx2 = gc.getContext('2d');
    const img = gx2.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (Math.random() - 0.5) * 240;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    gx2.putImageData(img, 0, 0);
    grain.style.backgroundImage = `url(${gc.toDataURL()})`;
  }
})();
