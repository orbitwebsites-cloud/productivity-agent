'use strict';

(function () {
  const canvas = document.getElementById('bgCanvas');
  const grain = document.getElementById('bgGrain');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

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

  function draw(t) {
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

  if (grain) {
    const size = 140;
    const gc = document.createElement('canvas');
    gc.width = size;
    gc.height = size;
    const gx2 = gc.getContext('2d');
    const img = gx2.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (Math.random() - 0.5) * 180;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    gx2.putImageData(img, 0, 0);
    grain.style.backgroundImage = `url(${gc.toDataURL()})`;
  }
})();
