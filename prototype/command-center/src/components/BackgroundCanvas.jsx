import { useEffect, useRef } from 'react';

// Procedural stand-in for a blurred landscape photo: hazy sky, a warm sun
// glow, and layered hill ridges that get darker and more saturated as they
// come forward. Drawn at low resolution; the CSS blur upscale gives it the
// out-of-focus photographic feel.
const HILLS = [
  // [baseline y, amplitude, frequency, phase, color]
  [0.38, 0.045, 2.1, 0.4, '#b7c886'],
  [0.48, 0.06, 1.7, 2.2, '#93ac5e'],
  [0.58, 0.07, 1.4, 4.1, '#6f8f41'],
  [0.7, 0.085, 1.2, 1.1, '#4f7030'],
  [0.84, 0.1, 1.0, 3.3, '#375223'],
  [0.96, 0.11, 0.9, 5.2, '#263c18'],
];

function ridgeY(x, base, amp, freq, phase, height) {
  return (
    height *
    (base +
      amp * Math.sin(x * freq * Math.PI * 2 + phase) +
      amp * 0.45 * Math.sin(x * freq * Math.PI * 4.7 + phase * 1.7))
  );
}

function drawLandscape(ctx, width, height, t) {
  // Hazy sky, brightest just above the first ridge
  const sky = ctx.createLinearGradient(0, 0, 0, height * 0.55);
  sky.addColorStop(0, '#d8e0b4');
  sky.addColorStop(1, '#c2d194');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // Drifting warm sun glow
  const gx = width * (0.32 + 0.06 * Math.sin(t * 0.05));
  const gy = height * (0.22 + 0.03 * Math.cos(t * 0.04));
  const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, width * 0.55);
  glow.addColorStop(0, 'rgba(248, 244, 205, 0.85)');
  glow.addColorStop(1, 'rgba(248, 244, 205, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // Hill ridges, back to front
  const steps = 64;
  HILLS.forEach(([base, amp, freq, phase, color], i) => {
    const sway = 0.012 * Math.sin(t * 0.03 + i * 1.9);
    ctx.beginPath();
    ctx.moveTo(0, ridgeY(0, base + sway, amp, freq, phase, height));
    for (let s = 1; s <= steps; s++) {
      const x = s / steps;
      ctx.lineTo(x * width, ridgeY(x, base + sway, amp, freq, phase, height));
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Atmospheric haze on the far ridges
    if (i < 3) {
      ctx.fillStyle = `rgba(214, 224, 176, ${0.28 - i * 0.08})`;
      ctx.fill();
    }
  });

  // Soft vignette to pull focus center like a photo
  const vignette = ctx.createRadialGradient(
    width * 0.5, height * 0.45, height * 0.35,
    width * 0.5, height * 0.55, height * 1.1,
  );
  vignette.addColorStop(0, 'rgba(18, 30, 10, 0)');
  vignette.addColorStop(1, 'rgba(18, 30, 10, 0.38)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function makeGrainTexture() {
  const size = 160;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(size, size);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 256;
    image.data[i] = v;
    image.data[i + 1] = v;
    image.data[i + 2] = v;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL();
}

export default function BackgroundCanvas() {
  const canvasRef = useRef(null);
  const grainRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let frame;

    function resize() {
      // Quarter-ish resolution: the CSS blur hides it and keeps redraws cheap.
      canvas.width = Math.max(320, Math.floor(window.innerWidth / 4));
      canvas.height = Math.max(180, Math.floor(window.innerHeight / 4));
    }
    resize();
    window.addEventListener('resize', resize);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function tick(now) {
      drawLandscape(ctx, canvas.width, canvas.height, now / 1000);
      frame = requestAnimationFrame(tick);
    }

    if (reduceMotion.matches) {
      drawLandscape(ctx, canvas.width, canvas.height, 0);
    } else {
      frame = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    grainRef.current.style.backgroundImage = `url(${makeGrainTexture()})`;
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="bg-canvas" aria-hidden="true" />
      <div ref={grainRef} className="bg-grain" aria-hidden="true" />
    </>
  );
}
