'use strict';

// Procedural "blurred landscape" backdrop for the app window — hazy sunlit sky
// over layered rolling-hill ridges, painted low-res on a fixed canvas and
// blurred by CSS so it reads like an out-of-focus photo. Kept lighter/hazier
// than the marketing prototype so dark UI text stays legible over it. Vanilla
// (no build step) so it runs in the packaged Electron renderer as-is.

(function () {
  const canvas = document.getElementById('bgCanvas');
  const grain = document.getElementById('bgGrain');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

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

  function draw(t) {
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
