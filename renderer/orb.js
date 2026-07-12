'use strict';

// Click vs. drag detection for the floating orb:
// - press + release without moving  => open/close the chat panel
// - press + drag                     => move the orb around the screen
// (The window is just the orb, so screen coords + the press offset move it.)

const orb = document.getElementById('orb');
const mascot = document.getElementById('mascot');
let dragging = false;
let startX = 0, startY = 0;
let moved = false;

orb.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  dragging = true;
  moved = false;
  startX = e.screenX;
  startY = e.screenY;
  // Offset of the cursor within the window, so the orb doesn't jump on grab.
  window.buddy.dragStart(e.clientX, e.clientY);
  e.preventDefault();
});

window.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  if (Math.abs(e.screenX - startX) + Math.abs(e.screenY - startY) > 4) moved = true;
  if (moved) window.buddy.dragMove(e.screenX, e.screenY);
});

window.addEventListener('mouseup', () => {
  if (!dragging) return;
  dragging = false;
  if (!moved) window.buddy.orbToggle(); // it was a click, not a drag
});

// ---- sizing: initial value from the query string (avoids a flash at the
// wrong size), live updates pushed from main.js when Settings changes it ----
const initialSize = Number(new URLSearchParams(location.search).get('img')) || 84;
document.documentElement.style.setProperty('--img-size', `${initialSize}px`);
if (window.buddy.onOrbSize) {
  window.buddy.onOrbSize((size) => {
    document.documentElement.style.setProperty('--img-size', `${Number(size) || 84}px`);
  });
}

// ---- idle personality tics: every so often, play a little fidget instead
// of just bobbing forever. Inspired by desktop-pet apps, kept subtle. Only
// while genuinely idle — suppressed for every other mood below. ----
const TICS = ['tic-tilt-left', 'tic-tilt-right', 'tic-hop'];

function playTic() {
  if (restMood() !== 'idle' || flashTimer || dragging) return;
  const cls = TICS[Math.floor(Math.random() * TICS.length)];
  mascot.classList.add(cls);
  mascot.addEventListener('animationend', function done() {
    mascot.classList.remove(cls);
    mascot.removeEventListener('animationend', done);
  }, { once: true });
}

function scheduleTic() {
  const delay = 14000 + Math.random() * 16000; // every ~14-30s
  setTimeout(() => { playTic(); scheduleTic(); }, delay);
}
scheduleTic();

// ---- mood engine ----
// Three layers, low to high priority:
//   1. ambient  — 'idle' or 'sleepy' (chill mode / tracking paused). Persists.
//   2. hold     — 'alert' (Warden countdown open) or 'thinking' (awaiting an
//                 AI answer). Persists until explicitly cleared, then falls
//                 back to ambient.
//   3. flash    — 'celebrate' | 'nudge' | 'drill' | 'angry'. Shows for a few
//                 seconds then falls back to whatever hold/ambient was
//                 underneath it. 'celebrate' also gets a sparkle burst.
// All driven from main.js via the single 'orb:mood' push — nothing here
// decides to change mood on its own.

const MASCOT_SRC = {
  idle: '../assets/pesto/screenbuddy_mascot_idle.png',
  sleepy: '../assets/pesto/screenbuddy_mascot_sleepy.png',
  alert: '../assets/pesto/screenbuddy_mascot_alert.png',
  thinking: '../assets/pesto/screenbuddy_mascot_thinking.png',
  celebrate: '../assets/pesto/screenbuddy_mascot_celebrating.png',
  nudge: '../assets/pesto/screenbuddy_mascot_nudge.png',
  drill: '../assets/pesto/screenbuddy_mascot_drill.png',
  angry: '../assets/pesto/screenbuddy_mascot_angry.png'
};
const FLASH_CLASS = { celebrate: 'celebrating', nudge: 'flash-soft', drill: 'flash-firm', angry: 'flash-firm' };
const FLASH_MS = 2600;

let ambientMood = 'idle'; // 'idle' | 'sleepy'
let heldMood = null;      // 'alert' | 'thinking' | null
let flashTimer = null;
let sparkleTimer = null;

function restMood() { return heldMood || ambientMood; }

function render(mood) {
  mascot.src = MASCOT_SRC[mood] || MASCOT_SRC.idle;
}

function spawnSparkle() {
  const s = document.createElement('div');
  s.className = 'sparkle';
  s.textContent = ['✨', '🎉', '⭐'][Math.floor(Math.random() * 3)];
  s.style.left = `${40 + Math.random() * 20}%`;
  s.style.top = `${30 + Math.random() * 15}%`;
  s.style.animationDelay = `${Math.random() * 0.3}s`;
  orb.appendChild(s);
  setTimeout(() => s.remove(), 1200);
}

function endFlash(prevClass) {
  clearTimeout(flashTimer);
  flashTimer = null;
  if (sparkleTimer) { clearInterval(sparkleTimer); sparkleTimer = null; }
  if (prevClass) mascot.classList.remove(prevClass);
  render(restMood());
}

function setAmbient(mood) {
  ambientMood = mood === 'sleepy' ? 'sleepy' : 'idle';
  if (!flashTimer) render(restMood());
}

function setHold(mood) {
  // mood is 'alert' | 'thinking' | null (null clears the hold)
  heldMood = mood === 'alert' || mood === 'thinking' ? mood : null;
  if (!flashTimer) render(restMood());
}

function flash(mood) {
  if (!MASCOT_SRC[mood]) return;
  const prevClass = FLASH_CLASS[flash.activeClass];
  if (flashTimer) endFlash(prevClass);
  mascot.classList.remove(...TICS);
  render(mood);
  const cls = FLASH_CLASS[mood];
  if (cls) mascot.classList.add(cls);
  flash.activeClass = mood;
  if (mood === 'celebrate') sparkleTimer = setInterval(spawnSparkle, 220);
  flashTimer = setTimeout(() => endFlash(cls), FLASH_MS);
}

if (window.buddy.onOrbMood) {
  window.buddy.onOrbMood((msg) => {
    // Back-compat: earlier builds only ever sent the bare string 'celebrate'.
    const payload = typeof msg === 'string' ? { kind: 'flash', mood: msg } : (msg || {});
    if (payload.kind === 'ambient') setAmbient(payload.mood);
    else if (payload.kind === 'hold') setHold(payload.mood);
    else if (payload.kind === 'holdEnd') setHold(null);
    else if (payload.kind === 'flash') flash(payload.mood);
  });
}
