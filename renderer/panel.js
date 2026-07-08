'use strict';

const chat = document.getElementById('chat');
const input = document.getElementById('q');
const statusline = document.getElementById('statusline');

function addMsg(text, who) {
  const el = document.createElement('div');
  el.className = `msg ${who}`;
  el.textContent = text;
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
  return el;
}

function addActions(actions) {
  if (!actions || !actions.length) return;
  const row = document.createElement('div');
  row.className = 'actions';
  actions.forEach((action) => {
    const btn = document.createElement('button');
    btn.className = 'actionbtn';
    btn.textContent = action.label || 'Run action';
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const thinking = addMsg('Working on that...', 'pesto');
      try {
        const result = await window.buddy.runAction(action.id);
        thinking.textContent = result && result.text ? result.text : 'Done.';
        refreshStatus();
      } catch {
        thinking.textContent = "I couldn't run that action just now.";
      }
      chat.scrollTop = chat.scrollHeight;
    });
    row.appendChild(btn);
  });
  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;
}

async function ask(question) {
  if (!question || !question.trim()) return;
  addMsg(question, 'me');
  input.value = '';
  const thinking = addMsg('...', 'pesto');
  try {
    const reply = await window.buddy.ask(question);
    if (reply && typeof reply === 'object') {
      thinking.textContent = reply.text || '';
      addActions(reply.actions || []);
    } else {
      thinking.textContent = reply;
    }
  } catch {
    thinking.textContent = "Hmm, I couldn't check that just now.";
  }
  chat.scrollTop = chat.scrollHeight;
}

async function refreshToday() {
  try {
    const t = await window.buddy.today();
    const host = document.getElementById('pursuits');
    if (!t || !t.byPursuit || t.byPursuit.length === 0) {
      host.innerHTML = '<div class="empty">Nothing tracked yet - give me a few minutes.</div>';
      return;
    }
    const max = Math.max(...t.byPursuit.map((p) => p.ms), 1);
    host.innerHTML = t.byPursuit.map((p) => `
      <div class="prow">
        <div class="lbl">${escapeHtml(p.name)}</div>
        <div class="track"><div class="fill" style="width:${Math.round((p.ms / max) * 100)}%"></div></div>
        <div class="t">${escapeHtml(p.label)}</div>
      </div>`).join('');
  } catch { /* ignore */ }
}

async function refreshStatus() {
  try {
    const s = await window.buddy.status();
    if (s && s.error) statusline.textContent = 'needs screen permission';
    else if (s && !s.tracking) statusline.textContent = 'tracking paused';
    else if (s && s.mode === 'jarvis' && s.activePursuit) statusline.textContent = `Jarvis guarding ${s.activePursuit}.`;
    else if (s && s.mode === 'jarvis') statusline.textContent = 'Jarvis mode is on.';
    else statusline.textContent = 'here to help you find balance.';
  } catch { /* ignore */ }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

document.getElementById('send').addEventListener('click', () => ask(input.value));
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') ask(input.value); });
document.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => ask(c.dataset.q)));
document.getElementById('closeBtn').addEventListener('click', () => window.buddy.hidePanel());
document.getElementById('gearBtn').addEventListener('click', () => window.buddy.openApp());
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.buddy.hidePanel(); });

addMsg("Hey! I'm Pesto. Ask where you were yesterday, or tell me: switching to Tech Job for the next hour.", 'pesto');
refreshToday();
refreshStatus();
setInterval(refreshToday, 30000);
setInterval(refreshStatus, 10000);
