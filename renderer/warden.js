'use strict';

// Reads the distraction app name + countdown seconds from the URL query.
const params = new URLSearchParams(location.search);
const appName = params.get('app') || 'this';
let n = Math.max(3, parseInt(params.get('secs') || '10', 10));

document.getElementById('head').textContent = `Hiding ${appName} in…`;
const nEl = document.getElementById('n');
nEl.textContent = String(n);

let done = false;
function stay() { if (done) return; done = true; window.buddy.wardenCancel(); }
function hide() { if (done) return; done = true; window.buddy.wardenHide(); }

const timer = setInterval(() => {
  n -= 1;
  nEl.textContent = String(Math.max(0, n));
  if (n <= 0) { clearInterval(timer); hide(); }
}, 1000);

document.getElementById('stay').addEventListener('click', () => { clearInterval(timer); stay(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') { clearInterval(timer); stay(); } });
