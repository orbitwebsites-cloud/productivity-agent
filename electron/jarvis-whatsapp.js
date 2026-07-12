'use strict';

const path = require('path');
const { spawn } = require('child_process');

// Jarvis WhatsApp remote-agent — OPT-IN, off by default (see config.js `jarvisWhatsapp`).
//
// Lets the account owner text Pesto from their own phone and get things done without
// opening the laptop: activity Q&A, Jarvis pursuit switching, workspace restore (all
// reused from the exact same brain the desktop chat panel uses), plus a couple of
// explicit dev-ops commands.
//
// Uses `@whiskeysockets/baileys`, an unofficial client that speaks the WhatsApp Web
// multi-device protocol directly over a WebSocket (QR-paired, session persisted
// locally) — NOT the official WhatsApp Business API, and NOT whatsapp-web.js (which
// drives this the same way but through a bundled headless Chromium via Puppeteer;
// Baileys needs no browser at all, which matters here since this is an Electron app
// already shipping one Chromium — a second one just for messaging was pure bloat).
// That protocol-level tradeoff is deliberate (zero per-message cost, no Meta account
// needed) but it means:
//   - It's against WhatsApp's Terms of Service to automate a personal account this way.
//     Meta can ban the linked number for automated behavior. That's the user's own
//     account and their call to make — the Settings UI must disclose this before pairing,
//     never hide it.
//   - Trust boundary: we only ever act on messages where the key is `fromMe` — sent
//     from a device already logged into the *same* WhatsApp account (the phone that
//     scanned the pairing QR). Never react to messages from other contacts, and don't
//     loosen the fromMe check without a real reason.
//
// Explicitly NOT built here, on purpose, not just missing:
//   - Auto-completing courses/quizzes/certifications to fraudulently claim credentials.
//   - Blind autonomous submission of forms/applications with personal data. Nothing here
//     submits anything the user didn't explicitly, narrowly configure ahead of time
//     (git push to a project directory they set up) — never "fill out this link with my
//     info" on request.

let sock = null;
let ready = false;
let lastQr = '';
let selfJid = '';
let askFn = null;
let fillActiveTabFn = null;
let browserTaskFn = null;
let projectDir = '';
let notifyFn = null;
let stopping = false;

function isEnabled(config) {
  return !!(config && config.jarvisWhatsapp && config.jarvisWhatsapp.enabled);
}

function status() {
  return { running: !!sock, ready, hasQr: !!lastQr };
}

async function qrToDataUrl(qr) {
  try {
    const QRCode = require('qrcode');
    return await QRCode.toDataURL(qr, { margin: 1, scale: 6 });
  } catch {
    return null; // qrcode not installed — caller falls back to the raw string.
  }
}

// Baileys logs through a pino-shaped logger; we don't want its (very chatty)
// default output, and don't need a real pino dependency just for that — a
// silent shim with the methods Baileys actually calls is enough.
function silentLogger() {
  const noop = () => {};
  const logger = { trace: noop, debug: noop, info: noop, warn: noop, error: noop, fatal: noop };
  logger.child = () => logger;
  return logger;
}

function authDir() {
  const { app } = require('electron');
  return path.join(app.getPath('userData'), 'jarvis-whatsapp-auth');
}

async function start(config, { ask, fillActiveTab, browserTask, notify } = {}) {
  if (sock) return status();

  let makeWASocket, useMultiFileAuthState, DisconnectReason, jidNormalizedUser;
  try {
    ({ default: makeWASocket, useMultiFileAuthState, DisconnectReason, jidNormalizedUser } = require('@whiskeysockets/baileys'));
  } catch {
    throw new Error(
      "@whiskeysockets/baileys isn't installed in this build. Run `npm install` after pulling " +
      'the jarvis-whatsapp changes, or ask a builder to add it before shipping this feature.'
    );
  }

  askFn = typeof ask === 'function' ? ask : null;
  fillActiveTabFn = typeof fillActiveTab === 'function' ? fillActiveTab : null;
  browserTaskFn = typeof browserTask === 'function' ? browserTask : null;
  notifyFn = typeof notify === 'function' ? notify : null;
  projectDir = config?.jarvisWhatsapp?.projectDir || '';
  stopping = false;

  const { state, saveCreds } = await useMultiFileAuthState(authDir());

  sock = makeWASocket({ auth: state, logger: silentLogger() });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      ready = false;
      const dataUrl = await qrToDataUrl(qr);
      lastQr = dataUrl || qr;
      notifyFn && notifyFn({ type: 'qr', dataUrl, raw: qr });
    }

    if (connection === 'open') {
      ready = true;
      lastQr = '';
      selfJid = sock.user?.id ? jidNormalizedUser(sock.user.id) : '';
      notifyFn && notifyFn({ type: 'ready' });
    }

    if (connection === 'close') {
      ready = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      const wasSock = sock;
      sock = null;
      if (loggedOut || stopping) {
        notifyFn && notifyFn({ type: 'disconnected', reason: loggedOut ? 'logged out' : 'stopped' });
      } else {
        // Any other close (network blip, restart) — Baileys expects the caller
        // to reconnect; the auth state on disk survives so this is silent.
        notifyFn && notifyFn({ type: 'disconnected', reason: 'reconnecting' });
        const cfg = { jarvisWhatsapp: { projectDir } };
        start(cfg, { ask: askFn, fillActiveTab: fillActiveTabFn, browserTask: browserTaskFn, notify: notifyFn }).catch(() => {});
      }
      void wasSock;
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const message of messages) {
      if (!message.key?.fromMe) continue;
      // Scoped to your own self-chat ("Message yourself" / Note to Self) only.
      // fromMe alone doesn't say WHICH chat the message was sent in — without
      // this, texting a command to a real contact or group would have Pesto
      // reply in that thread, visibly leaking your tracked activity to them.
      if (selfJid && message.key.remoteJid !== selfJid) continue;
      const text = message.message?.conversation
        || message.message?.extendedTextMessage?.text
        || '';
      if (!text) continue;
      try {
        const reply = await route(text);
        if (reply) await sock.sendMessage(message.key.remoteJid, { text: reply });
      } catch (err) {
        try {
          await sock.sendMessage(message.key.remoteJid, {
            text: `Jarvis hit an error: ${String(err && err.message || err).slice(0, 300)}`
          });
        } catch { /* best effort — don't let a reply failure crash the listener */ }
      }
    }
  });

  return status();
}

async function stop() {
  stopping = true;
  const s = sock;
  sock = null;
  ready = false;
  lastQr = '';
  selfJid = '';
  if (s) {
    try { s.end(undefined); } catch { /* best effort */ }
  }
}

// Requests that read as "do this dishonest/risky thing for me" — decline instead of
// attempting them, regardless of how the rest of the router is scoped.
const DECLINE_PATTERNS = [
  /\b(quiz(zes)?|course|module|certificat\w*|exam)\b[\s\S]{0,40}\b(complete|finish|pass|do (it|them) for me|take it)\b/i,
  /\b(complete|finish|pass|take)\b[\s\S]{0,40}\b(quiz(zes)?|course|module|exam)\b[\s\S]{0,40}\bfor me\b/i,
  /\bsubmit\b[\s\S]{0,30}\b(application|form)\b[\s\S]{0,30}\b(automatically|for me|without (me )?(checking|reviewing))\b/i
];

function declineReason(text) {
  return DECLINE_PATTERNS.some((re) => re.test(text));
}

function helpText() {
  return [
    'Jarvis (WhatsApp) — I only act on messages sent from your own linked phone.',
    '',
    'Anything you\'d ask Pesto in the app works here too, e.g.:',
    '  "what was I working on today?"',
    '  "focus on Tech Job for 45 min"',
    '  "restore my workspace"',
    '  "open Spotify" / "launch Discord" / "switch to Notepad" — actually opens/',
    '    focuses it on your machine',
    '',
    'Dev-ops (needs a project dir set in Settings > Jarvis > WhatsApp Remote):',
    '  !git status',
    '  !git push [commit message]',
    '  !deploy — latest Vercel deployment status',
    '  !autofill — fill the active browser tab from your saved profile (review before submitting)',
    '  !browser <instruction> — do something in your active browser tab, e.g.',
    '    "!browser open the FAQ page and tell me the refund policy"',
    '    (never buys/pays/submits/deletes/subscribes on its own — you still do that step)',
    '',
    '!help — this list'
  ].join('\n');
}

function run(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, windowsHide: true, shell: false });
    let out = '';
    let err = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error(`${cmd} timed out`)); }, 60000);
    child.stdout?.on('data', (d) => { out += d.toString(); });
    child.stderr?.on('data', (d) => { err += d.toString(); });
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(out.trim());
      else reject(new Error((err || out || `${cmd} exited with ${code}`).trim()));
    });
  });
}

async function runGit(sub, arg) {
  if (!projectDir) {
    return 'No project directory configured for Jarvis git commands. Set one in Settings > Jarvis Mode > WhatsApp Remote.';
  }
  if (sub === 'status') {
    const out = await run('git', ['status', '--short', '--branch'], projectDir);
    return out ? `\`\`\`\n${out}\n\`\`\`` : 'Clean — nothing to commit.';
  }
  if (sub === 'push') {
    const message = arg || `Jarvis remote push ${new Date().toISOString()}`;
    await run('git', ['add', '-A'], projectDir);
    try {
      await run('git', ['commit', '-m', message], projectDir);
    } catch (err) {
      if (!/nothing to commit/i.test(String(err.message))) throw err;
    }
    const out = await run('git', ['push'], projectDir);
    return `Pushed to ${projectDir}.${out ? `\n${out}` : ''}`;
  }
  return 'Unknown git command. Try `!git status` or `!git push [message]`.';
}

// Uses whatever `vercel` CLI auth is already set up on this machine (see
// scripts/finish-setup.js) — we never hold or ship a Vercel token ourselves.
async function runDeployStatus() {
  if (!projectDir) {
    return 'No project directory configured for Jarvis. Set one in Settings > Jarvis Mode > WhatsApp Remote.';
  }
  try {
    const out = await run('npx', ['--yes', 'vercel', 'ls', '--yes'], projectDir);
    return out ? `\`\`\`\n${out.split('\n').slice(0, 8).join('\n')}\n\`\`\`` : 'No deployments found.';
  } catch (err) {
    return `Couldn't check deploy status: ${String(err.message || err).slice(0, 300)}. Is the Vercel CLI signed in on this machine?`;
  }
}

// The router is exported standalone (not just via WhatsApp events) so it can be unit
// tested without a live WhatsApp session.
async function route(rawText) {
  const text = String(rawText || '').trim();
  if (!text) return null;

  if (declineReason(text)) {
    return "I won't auto-complete courses/quizzes or blind-submit forms with your info — " +
      "that's fraud/academic-integrity territory, not productivity. Happy to help with real dev tasks though.";
  }

  if (/^!help\b/i.test(text)) return helpText();

  const gitMatch = text.match(/^!git\s+(status|push)\b\s*(.*)$/is);
  if (gitMatch) return runGit(gitMatch[1].toLowerCase(), gitMatch[2].trim());

  if (/^!deploy\b/i.test(text)) return runDeployStatus();

  if (/^!autofill\b/i.test(text)) {
    if (!fillActiveTabFn) return 'Browser autofill bridge is off. Enable it in Settings > Jarvis Mode > Browser Autofill.';
    return fillActiveTabFn();
  }

  const browserMatch = text.match(/^!browser\s+(.+)$/is);
  if (browserMatch) {
    if (!browserTaskFn) return 'Browser autofill bridge is off. Enable it in Settings > Jarvis Mode > Browser Autofill first.';
    return browserTaskFn(browserMatch[1].trim());
  }

  if (askFn) {
    const result = await askFn(text);
    if (result && typeof result === 'object') return result.text || null;
    if (typeof result === 'string') return result;
  }
  return "I didn't have an answer for that. Send `!help` for what I can do from here.";
}

module.exports = { start, stop, status, isEnabled, route };
