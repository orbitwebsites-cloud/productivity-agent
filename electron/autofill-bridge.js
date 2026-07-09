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

let server = null;
let wss = null;
let sockets = new Set();
let getProfile = () => ({});

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
  });
}

function stop() {
  if (wss) {
    for (const ws of sockets) { try { ws.close(); } catch { /* ignore */ } }
    try { wss.close(); } catch { /* ignore */ }
    wss = null;
  }
  if (server) { try { server.close(); } catch { /* ignore */ } server = null; }
  sockets = new Set();
}

// Ask the extension to fill whatever tab is currently focused in the user's browser.
function triggerFill() {
  const payload = JSON.stringify({ type: 'fill', profile: getProfile() });
  let sent = 0;
  for (const ws of sockets) {
    if (ws.readyState === ws.OPEN) { ws.send(payload); sent += 1; }
  }
  return sent > 0
    ? `Told the browser extension to fill the active tab (${sent} browser window${sent > 1 ? 's' : ''} connected). Review before submitting — it never auto-submits.`
    : "The ScreenBuddy browser extension isn't connected right now — make sure it's installed and a browser window is open.";
}

function isRunning() { return !!server; }

module.exports = { start, stop, triggerFill, isRunning, PORT };
