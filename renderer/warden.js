'use strict';

const params = new URLSearchParams(location.search);
const appName = params.get('app') || 'this app';
const pursuit = params.get('pursuit') || '';
const reason = params.get('reason') || 'distraction';
const currentPursuit = params.get('currentPursuit') || '';
let n = Math.max(3, parseInt(params.get('secs') || '10', 10));
const total = n;

const head = document.getElementById('head');
const detail = document.getElementById('detail');
const goal = document.getElementById('goal');
const nEl = document.getElementById('n');
const fill = document.getElementById('fill');

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
function stay() { if (done) return; done = true; window.buddy.wardenCancel(); }
function hide() { if (done) return; done = true; window.buddy.wardenHide(); }

const timer = setInterval(() => {
  n -= 1;
  nEl.textContent = String(Math.max(0, n));
  fill.style.width = `${Math.max(0, (n / total) * 100)}%`;
  if (n <= 0) { clearInterval(timer); hide(); }
}, 1000);

document.getElementById('stay').addEventListener('click', () => { clearInterval(timer); stay(); });
document.getElementById('hide').addEventListener('click', () => { clearInterval(timer); hide(); });
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { clearInterval(timer); stay(); }
});
