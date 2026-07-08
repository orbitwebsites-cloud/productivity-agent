'use strict';

// Click vs. drag detection for the floating orb:
// - press + release without moving  => open/close the chat panel
// - press + drag                     => move the orb around the screen
// (The window is just the orb, so screen coords + the press offset move it.)

const orb = document.getElementById('orb');
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
