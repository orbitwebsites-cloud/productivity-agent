'use strict';

const http = require('http');
const { WebSocketServer } = require('ws');

// Loopback-only local bridge between the Electron app and the ScreenBuddy Jarvis
// browser extension (extension/). Lets a WhatsApp/desktop "fill this application"
// command reach whichever tab is active in the user's browser. Bound to 127.0.0.1
// only — nothing outside this machine can reach it, same trust boundary as the
// local Hermes gateway (electron/setup.js).
//
// This bridge only ever sends a "please fill the active tab" signal plus the user's
// own saved profile fields. The extension NEVER auto-submits anything it fills —
// see extension/content.js — the human still has to review and click Submit.

const PORT = 8643;
const REQUEST_TIMEOUT_MS = 15000;

let server = null;
let wss = null;
let sockets = new Set();
let getProfile = () => ({});
let pending = new Map(); // requestId -> { resolve, reject, timer }
let nextRequestId = 1;

function start({ profileProvider } = {}) {
  if (server) return;
  getProfile = typeof profileProvider === 'function' ? profileProvider : getProfile;

  server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/profile') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify(getProfile()));
      return;
    }
    res.writeHead(404);
    res.end();
  });
  server.listen(PORT, '127.0.0.1');

  wss = new WebSocketServer({ server });
  wss.on('connection', (ws) => {
    sockets.add(ws);
    ws.on('close', () => sockets.delete(ws));
    ws.on('error', () => sockets.delete(ws));
    ws.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }
      if (msg.requestId && pending.has(msg.requestId)) {
        const p = pending.get(msg.requestId);
        clearTimeout(p.timer);
        pending.delete(msg.requestId);
        p.resolve(msg);
      }
    });
  });
}

function stop() {
  for (const p of pending.values()) { clearTimeout(p.timer); p.reject(new Error('bridge stopped')); }
  pending = new Map();
  if (wss) {
    for (const ws of sockets) { try { ws.close(); } catch { /* ignore */ } }
    try { wss.close(); } catch { /* ignore */ }
    wss = null;
  }
  if (server) { try { server.close(); } catch { /* ignore */ } server = null; }
  sockets = new Set();
}

function anyConnected() {
  for (const ws of sockets) if (ws.readyState === ws.OPEN) return true;
  return false;
}

function broadcast(payload) {
  let sent = 0;
  const text = JSON.stringify(payload);
  for (const ws of sockets) {
    if (ws.readyState === ws.OPEN) { ws.send(text); sent += 1; }
  }
  return sent;
}

// Send a message to the (first) connected extension and wait for a reply carrying
// the same requestId. Used by browser-agent.js for the snapshot/act round trip —
// triggerFill() below stays fire-and-forget since it doesn't need a reply.
function request(type, extra = {}) {
  return new Promise((resolve, reject) => {
    if (!anyConnected()) {
      reject(new Error("The ScreenBuddy browser extension isn't connected — make sure it's installed and a browser window is open."));
      return;
    }
    const requestId = String(nextRequestId++);
    const timer = setTimeout(() => {
      pending.delete(requestId);
      reject(new Error('Browser extension took too long to respond.'));
    }, REQUEST_TIMEOUT_MS);
    pending.set(requestId, { resolve, reject, timer });
    broadcast({ type, requestId, ...extra });
  });
}

// Ask the extension to fill whatever tab is currently focused in the user's browser.
function triggerFill() {
  const sent = broadcast({ type: 'fill', profile: getProfile() });
  return sent > 0
    ? `Told the browser extension to fill the active tab (${sent} browser window${sent > 1 ? 's' : ''} connected). Review before submitting — it never auto-submits.`
    : "The ScreenBuddy browser extension isn't connected right now — make sure it's installed and a browser window is open.";
}

function isRunning() { return !!server; }

module.exports = { start, stop, triggerFill, isRunning, request, anyConnected, PORT };
