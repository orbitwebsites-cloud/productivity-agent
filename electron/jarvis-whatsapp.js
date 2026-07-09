'use strict';

const { spawn } = require('child_process');

// Jarvis WhatsApp remote-agent — OPT-IN, off by default (see config.js `jarvisWhatsapp`).
//
// Lets the account owner text Pesto from their own phone and get things done without
// opening the laptop: activity Q&A, Jarvis pursuit switching, workspace restore (all
// reused from the exact same brain the desktop chat panel uses), plus a couple of
// explicit dev-ops commands.
//
// Uses `whatsapp-web.js`, an unofficial client that drives a real WhatsApp Web session
// (QR-paired, session persisted locally) — NOT the official WhatsApp Business API. That
// tradeoff is deliberate (zero per-message cost, no Meta account needed) but it means:
//   - It's against WhatsApp's Terms of Service to automate a personal account this way.
//     Meta can ban the linked number for automated behavior. That's the user's own
//     account and their call to make — the Settings UI must disclose this before pairing,
//     never hide it.
//   - Trust boundary: we only ever act on messages where `message.fromMe` is true — sent
//     from a device already logged into the *same* WhatsApp account (the phone that
//     scanned the pairing QR). We listen on the `message` event, not `message_create`,
//     specifically because `message_create` also fires for replies *we* send, which would
//     make the bot re-process its own replies as new commands. Never react to messages
//     from other contacts, and don't loosen the fromMe check without a real reason.
//
// Explicitly NOT built here, on purpose, not just missing:
//   - Auto-completing courses/quizzes/certifications to fraudulently claim credentials.
//   - Blind autonomous submission of forms/applications with personal data. Nothing here
//     submits anything the user didn't explicitly, narrowly configure ahead of time
//     (git push to a project directory they set up) — never "fill out this link with my
//     info" on request.

let client = null;
let ready = false;
let lastQr = '';
let askFn = null;
let fillActiveTabFn = null;
let projectDir = '';
let notifyFn = null;

function isEnabled(config) {
  return !!(config && config.jarvisWhatsapp && config.jarvisWhatsapp.enabled);
}

function status() {
  return { running: !!client, ready, hasQr: !!lastQr };
}

async function qrToDataUrl(qr) {
  try {
    const QRCode = require('qrcode');
    return await QRCode.toDataURL(qr, { margin: 1, scale: 6 });
  } catch {
    return null; // qrcode not installed — caller falls back to the raw string.
  }
}

async function start(config, { ask, fillActiveTab, notify } = {}) {
  if (client) return status();

  let Client, LocalAuth;
  try {
    ({ Client, LocalAuth } = require('whatsapp-web.js'));
  } catch {
    throw new Error(
      "whatsapp-web.js isn't installed in this build. Run `npm install` after pulling the " +
      'jarvis-whatsapp changes, or ask a builder to add it before shipping this feature.'
    );
  }

  askFn = typeof ask === 'function' ? ask : null;
  fillActiveTabFn = typeof fillActiveTab === 'function' ? fillActiveTab : null;
  notifyFn = typeof notify === 'function' ? notify : null;
  projectDir = config?.jarvisWhatsapp?.projectDir || '';

  client = new Client({
    authStrategy: new LocalAuth({ clientId: 'screenbuddy-jarvis' }),
    puppeteer: { headless: true }
  });

  client.on('qr', async (qr) => {
    ready = false;
    const dataUrl = await qrToDataUrl(qr);
    lastQr = dataUrl || qr;
    notifyFn && notifyFn({ type: 'qr', dataUrl, raw: qr });
  });

  client.on('ready', () => {
    ready = true;
    lastQr = '';
    notifyFn && notifyFn({ type: 'ready' });
  });

  client.on('disconnected', (reason) => {
    ready = false;
    notifyFn && notifyFn({ type: 'disconnected', reason: String(reason || '') });
  });

  client.on('auth_failure', (msg) => {
    notifyFn && notifyFn({ type: 'error', message: String(msg || 'Authentication failed.') });
  });

  // Deliberately `message`, not `message_create` — see header comment.
  client.on('message', async (message) => {
    if (!message.fromMe) return;
    try {
      const reply = await route(message.body);
      if (reply) await message.reply(reply);
    } catch (err) {
      try {
        await message.reply(`Jarvis hit an error: ${String(err && err.message || err).slice(0, 300)}`);
      } catch { /* best effort — don't let a reply failure crash the listener */ }
    }
  });

  await client.initialize();
  return status();
}

async function stop() {
  const c = client;
  client = null;
  ready = false;
  lastQr = '';
  if (c) {
    try { await c.destroy(); } catch { /* best effort */ }
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
    '',
    'Dev-ops (needs a project dir set in Settings > Jarvis > WhatsApp Remote):',
    '  !git status',
    '  !git push [commit message]',
    '  !deploy — latest Vercel deployment status',
    '  !autofill — fill the active browser tab from your saved profile (review before submitting)',
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

  if (askFn) {
    const result = await askFn(text);
    if (result && typeof result === 'object') return result.text || null;
    if (typeof result === 'string') return result;
  }
  return "I didn't have an answer for that. Send `!help` for what I can do from here.";
}

module.exports = { start, stop, status, isEnabled, route };
