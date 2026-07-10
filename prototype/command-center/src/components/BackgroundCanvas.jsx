import { useEffect, useRef } from 'react';

// Soft color field: each cloud drifts on its own slow sine orbit. Drawn at
// low resolution and blurred/upscaled by CSS, so it reads as an out-of-focus
// render rather than stacked CSS gradients.
const CLOUDS = [
  { x: 0.1, y: 0.05, r: 0.62, rgb: '224, 137, 95', a: 0.8, ax: 0.06, ay: 0.05, s: 0.11, p: 0.0 },
  { x: 0.9, y: 0.1, r: 0.55, rgb: '216, 168, 78', a: 0.55, ax: 0.05, ay: 0.06, s: 0.08, p: 2.1 },
  { x: 0.82, y: 0.92, r: 0.68, rgb: '127, 156, 140', a: 0.62, ax: 0.06, ay: 0.05, s: 0.07, p: 4.2 },
  { x: 0.22, y: 0.98, r: 0.58, rgb: '201, 100, 66', a: 0.42, ax: 0.07, ay: 0.04, s: 0.09, p: 1.3 },
  { x: 0.48, y: 0.35, r: 0.52, rgb: '255, 248, 240', a: 0.9, ax: 0.04, ay: 0.04, s: 0.06, p: 3.4 },
  { x: 0.62, y: 0.7, r: 0.4, rgb: '234, 178, 130', a: 0.38, ax: 0.05, ay: 0.06, s: 0.1, p: 5.1 },
];

function drawField(ctx, width, height, t) {
  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, '#f9f0e6');
  base.addColorStop(1, '#eddcc6');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  const span = Math.max(width, height);
  for (const c of CLOUDS) {
    const cx = (c.x + c.ax * Math.sin(t * c.s + c.p)) * width;
    const cy = (c.y + c.ay * Math.cos(t * c.s * 0.9 + c.p)) * height;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, c.r * span);
    g.addColorStop(0, `rgba(${c.rgb}, ${c.a})`);
    g.addColorStop(1, `rgba(${c.rgb}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }
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
      drawField(ctx, canvas.width, canvas.height, now / 1000);
      frame = requestAnimationFrame(tick);
    }

    if (reduceMotion.matches) {
      drawField(ctx, canvas.width, canvas.height, 0);
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
