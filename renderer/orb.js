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
// of just bobbing forever. Inspired by desktop-pet apps, kept subtle. ----
const TICS = ['tic-tilt-left', 'tic-tilt-right', 'tic-hop'];
let celebrating = false;

function playTic() {
  if (celebrating || dragging) return;
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

// ---- celebration: swap in the celebrating mascot for a few seconds on a
// real win (Warden successfully avoided, a new day-streak), pushed from
// main.js. Never triggered from inside the renderer itself. ----
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

function celebrate() {
  if (celebrating) return;
  celebrating = true;
  mascot.classList.remove(...TICS);
  mascot.src = '../assets/pesto/screenbuddy_mascot_celebrating.png';
  mascot.classList.add('celebrating');
  const sparkleTimer = setInterval(spawnSparkle, 220);
  setTimeout(() => {
    clearInterval(sparkleTimer);
    mascot.classList.remove('celebrating');
    mascot.src = '../assets/pesto/screenbuddy_mascot_idle.png';
    celebrating = false;
  }, 2600);
}

if (window.buddy.onOrbMood) {
  window.buddy.onOrbMood((mood) => { if (mood === 'celebrate') celebrate(); });
}
