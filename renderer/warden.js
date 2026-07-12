'use strict';

const params = new URLSearchParams(location.search);
const appName = params.get('app') || 'this app';
const pursuit = params.get('pursuit') || '';
const reason = params.get('reason') || 'distraction';
const currentPursuit = params.get('currentPursuit') || '';
const serverLocked = params.get('locked') === '1';
let n = Math.max(3, parseInt(params.get('secs') || '10', 10));
const total = n;

// Anti-impulse friction: for the first slice of the countdown, cancel is not
// even offered, and once it is, it takes a deliberate hold (not a tap or a
// single Escape press) to actually fire it. This is the direct fix for
// "I can just press Esc within 2 secs" — a reflex can't beat either gate.
const LOCK_SECS = Math.min(total - 1, Math.max(2, Math.round(total * 0.4)));
const HOLD_MS = 650;

const head = document.getElementById('head');
const detail = document.getElementById('detail');
const goal = document.getElementById('goal');
const nEl = document.getElementById('n');
const fill = document.getElementById('fill');
const hint = document.getElementById('hint');
const stayBtn = document.getElementById('stay');
const stayFill = document.getElementById('stayfill');
const stayLabel = document.getElementById('stayLabel');

if (pursuit) goal.textContent = `Guarding ${pursuit}`;

if (reason === 'off-pursuit' && pursuit) {
  head.textContent = `${appName} is outside ${pursuit}.`;
  detail.textContent = currentPursuit
    ? `This looks like ${currentPursuit}, not ${pursuit}. I will hide it safely unless you cancel.`
    : `This does not match your active pursuit. I will hide it safely unless you cancel.`;
} else {
  head.textContent = `${appName} looks like a distraction.`;
  detail.textContent = 'I will minimize it safely unless you cancel. Nothing gets closed.';
}

nEl.textContent = String(n);

let done = false;
function stay() {
  if (done) return;
  done = true;
  clearInterval(timer);
  window.buddy.wardenCancel().then((res) => {
    if (res && res.ok === false && res.locked) {
      // Lost the race with the server-side lock: stop pretending cancel works.
      done = false;
      lockOut();
    }
  });
}
function hide() { if (done) return; done = true; clearInterval(timer); window.buddy.wardenHide(); }

function unlocked() { return !serverLocked && n <= total - LOCK_SECS; }

function lockOut() {
  stayBtn.disabled = true;
  stayLabel.textContent = 'Locked in';
  hint.textContent = `You've bailed on ${appName} too many times already — this one's non-negotiable.`;
}

function updateHint() {
  if (serverLocked) { lockOut(); return; }
  if (!unlocked()) {
    const waitSecs = n - (total - LOCK_SECS);
    stayBtn.disabled = true;
    stayLabel.textContent = 'Give me 5 min';
    hint.textContent = `Hold on — you can ask for more time in ${waitSecs}s.`;
  } else {
    stayBtn.disabled = false;
    hint.innerHTML = `Hold <span class="kbd">ESC</span> or the button for a beat to cancel.`;
  }
}

const timer = setInterval(() => {
  n -= 1;
  nEl.textContent = String(Math.max(0, n));
  fill.style.width = `${Math.max(0, (n / total) * 100)}%`;
  updateHint();
  if (n <= 0) { clearInterval(timer); hide(); }
}, 1000);

if (serverLocked) lockOut(); else updateHint();

// --- Hold-to-confirm controller, shared by the Stay button and Escape ---
let holdRaf = null;
let holdStartedAt = 0;

function holdStart() {
  if (done || holdRaf || !unlocked()) return;
  holdStartedAt = Date.now();
  const tick = () => {
    const elapsed = Date.now() - holdStartedAt;
    const pct = Math.min(100, (elapsed / HOLD_MS) * 100);
    stayFill.style.width = `${pct}%`;
    if (elapsed >= HOLD_MS) { holdRaf = null; stayFill.style.width = '0%'; stay(); return; }
    holdRaf = requestAnimationFrame(tick);
  };
  holdRaf = requestAnimationFrame(tick);
}
function holdCancel() {
  if (holdRaf) cancelAnimationFrame(holdRaf);
  holdRaf = null;
  stayFill.style.width = '0%';
}

stayBtn.addEventListener('mousedown', holdStart);
stayBtn.addEventListener('touchstart', (e) => { e.preventDefault(); holdStart(); });
['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach((evt) => stayBtn.addEventListener(evt, holdCancel));

document.getElementById('hide').addEventListener('click', hide);

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !e.repeat) holdStart();
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'Escape') holdCancel();
});
window.addEventListener('blur', holdCancel);
