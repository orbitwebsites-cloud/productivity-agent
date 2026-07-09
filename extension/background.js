'use strict';

// ScreenBuddy Jarvis Autofill — background service worker (Chrome/Edge) / event
// page (Firefox — see manifest.firefox.json, which uses "scripts" instead of
// "service_worker" since Firefox doesn't run MV3 background pages as real service
// workers). Same background.js runs under both: Firefox's native `browser.*` API
// is promise-based, Chrome's MV3 `chrome.*` is too when called without a callback,
// so a one-line namespace pick is all cross-browser compat needs here.
//
// Keeps a best-effort WebSocket open to the local ScreenBuddy app
// (ws://127.0.0.1:8643) so a WhatsApp/desktop "fill this application" command
// can reach whichever tab is active in the browser, without the user having to
// click the extension icon themselves.
//
// Known limitation: MV3 background pages get suspended after a short idle period
// in both browsers, which can drop this socket between reconnect attempts. The
// popup's "Fill this page" button (popup.js) doesn't depend on this and always
// works — treat the remote WhatsApp trigger as best-effort, the popup as the
// reliable path.

const api = typeof browser !== 'undefined' ? browser : chrome;

const BRIDGE_WS = 'ws://127.0.0.1:8643';
let socket = null;
let reconnectTimer = null;

async function activeTab() {
  const [tab] = await api.tabs.query({ active: true, lastFocusedWindow: true });
  return tab && tab.id ? tab : null;
}

async function fillActiveTab(profile) {
  const tab = await activeTab();
  if (!tab) return;
  try {
    await api.tabs.sendMessage(tab.id, { type: 'autofill', profile });
  } catch {
    // Content script isn't injected on this page (e.g. a chrome:// page) — ignore.
  }
}

function reply(requestId, extra) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({ requestId, ...extra }));
}

// Snapshot/act round trip for the browser-task agent (electron/browser-agent.js).
// content.js does the real work (element discovery + the click/type/navigate
// denylist) — this just relays to whichever tab is active and returns the result.
async function handleAgentRequest(msg) {
  const tab = await activeTab();
  if (!tab) { reply(msg.requestId, { error: 'No active browser tab.' }); return; }
  try {
    if (msg.type === 'snapshot') {
      const result = await api.tabs.sendMessage(tab.id, { type: 'agentSnapshot' });
      reply(msg.requestId, result);
    } else if (msg.type === 'act') {
      const result = await api.tabs.sendMessage(tab.id, { type: 'agentAct', action: msg.action });
      reply(msg.requestId, result);
    }
  } catch (err) {
    reply(msg.requestId, { error: String(err && err.message || err) });
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => { reconnectTimer = null; connect(); }, 5000);
}

function connect() {
  try {
    socket = new WebSocket(BRIDGE_WS);
  } catch {
    scheduleReconnect();
    return;
  }
  socket.onmessage = (event) => {
    let msg;
    try { msg = JSON.parse(event.data); } catch { return; }
    if (msg.type === 'fill') fillActiveTab(msg.profile);
    else if (msg.type === 'snapshot' || msg.type === 'act') handleAgentRequest(msg);
  };
  socket.onclose = scheduleReconnect;
  socket.onerror = () => { try { socket.close(); } catch { /* ignore */ } };
}

api.runtime.onStartup?.addListener(connect);
connect();
