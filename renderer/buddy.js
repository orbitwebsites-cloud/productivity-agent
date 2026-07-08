'use strict';

const chat = document.getElementById('chat');
const input = document.getElementById('q');
const pesto = document.getElementById('pesto');
const statusline = document.getElementById('statusline');

function addMsg(text, who) {
  const el = document.createElement('div');
  el.className = `msg ${who}`;
  el.textContent = text;
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
  return el;
}

async function ask(question) {
  if (!question || !question.trim()) return;
  addMsg(question, 'me');
  input.value = '';
  pesto.classList.add('think');
  statusline.textContent = 'thinking…';
  const thinking = addMsg('…', 'pesto');
  try {
    const reply = await window.buddy.ask(question);
    thinking.textContent = reply;
  } catch (err) {
    thinking.textContent = "Hmm, I couldn't check that just now.";
  } finally {
    pesto.classList.remove('think');
    statusline.textContent = 'watching your screen…';
    chat.scrollTop = chat.scrollHeight;
  }
}

async function refreshToday() {
  try {
    const t = await window.buddy.today();
    const host = document.getElementById('pursuits');
    if (!t || !t.byPursuit || t.byPursuit.length === 0) {
      host.innerHTML = '<div class="empty">Nothing tracked yet — give me a few minutes. 🙂</div>';
      return;
    }
    const max = Math.max(...t.byPursuit.map((p) => p.ms), 1);
    host.innerHTML = t.byPursuit.map((p) => `
      <div class="prow">
        <div class="lbl">${p.name}</div>
        <div class="track"><div class="fill" style="width:${Math.round((p.ms / max) * 100)}%"></div></div>
        <div class="t">${p.label}</div>
      </div>`).join('');
  } catch { /* ignore */ }
}

async function refreshStatus() {
  try {
    const s = await window.buddy.status();
    if (s && s.error) {
      statusline.textContent = '⚠ needs screen permission';
    } else if (s && !s.tracking) {
      statusline.textContent = 'tracking paused';
    } else {
      statusline.textContent = 'watching your screen…';
    }
  } catch { /* ignore */ }
}

// wiring
document.getElementById('send').addEventListener('click', () => ask(input.value));
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') ask(input.value); });
document.querySelectorAll('.chip').forEach((c) =>
  c.addEventListener('click', () => ask(c.dataset.q)));
document.getElementById('hideBtn').addEventListener('click', () => window.buddy.hide());
document.getElementById('quitBtn').addEventListener('click', () => window.buddy.quit());

// greeting + first paint
addMsg("Hey, I'm Pesto 👋 I'm watching what you work on so I can tell you how your day went. Ask me anything — try the buttons below.", 'pesto');
refreshToday();
refreshStatus();
setInterval(refreshToday, 30000);
setInterval(refreshStatus, 10000);
