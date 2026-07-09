'use strict';

const { app, BrowserWindow, ipcMain, globalShortcut, screen, Tray, Menu, nativeImage, shell, Notification } = require('electron');
const path = require('path');
const { loadConfig, saveConfig } = require('./config');
const tracker = require('./tracker');
const answers = require('./answers');
const providers = require('./providers');
const setup = require('./setup');
const accountability = require('./accountability');
const premium = require('./premium');
const updater = require('./updater');
const jarvisWhatsapp = require('./jarvis-whatsapp');
const { minimizeActiveWindow, activateWindow, launchOrActivateApp } = require('./activewin');

const ASSET = (f) => path.join(__dirname, '..', 'assets', 'pesto', f);
const IDLE_PNG = ASSET('screenbuddy_mascot_idle.png');

let orb = null;      // the little clickable icon
let panel = null;    // the glance-card chat
let appWin = null;   // the full desktop app (settings / pursuits)
let wardenWin = null; // the Warden countdown overlay
let tray = null;
let dragOffset = { x: 0, y: 0 };
let buddyStarted = false;
let lastPrimaryWindow = null;

// Only one instance: a second launch just shows the buddy.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => showPanel());
}

const ORB_SIZE = 110;

function createOrb() {
  const { workArea } = screen.getPrimaryDisplay();
  orb = new BrowserWindow({
    width: ORB_SIZE,
    height: ORB_SIZE,
    x: workArea.x + workArea.width - ORB_SIZE - 24,
    y: workArea.y + workArea.height - ORB_SIZE - 24,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    focusable: false, // never steal focus when clicked
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  orb.setAlwaysOnTop(true, 'screen-saver');
  orb.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  orb.loadFile(path.join(__dirname, '..', 'renderer', 'orb.html'));
  orb.on('closed', () => { orb = null; });
}

function createPanel() {
  const W = 380, H = 520;
  panel = new BrowserWindow({
    width: W, height: H,
    frame: false, transparent: true, resizable: false,
    alwaysOnTop: true, skipTaskbar: true, show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  panel.setAlwaysOnTop(true, 'screen-saver');
  panel.loadFile(path.join(__dirname, '..', 'renderer', 'panel.html'));
  panel.on('closed', () => { panel = null; });
}

// Anchor the panel just above the orb, clamped to the screen work area.
function positionPanelNearOrb() {
  if (!panel || !orb) return;
  const o = orb.getBounds();
  const p = panel.getBounds();
  const wa = screen.getPrimaryDisplay().workArea;
  let x = o.x + o.width - p.width;         // right-align to the orb
  let y = o.y - p.height - 6;              // sit above the orb
  x = Math.max(wa.x + 8, Math.min(x, wa.x + wa.width - p.width - 8));
  y = Math.max(wa.y + 8, y);
  panel.setPosition(Math.round(x), Math.round(y));
}

function showPanel() {
  if (!setupIsReady()) { showApp(); return; }
  if (!panel) createPanel();
  positionPanelNearOrb();
  panel.show();
  panel.focus();
}

function togglePanel() {
  if (!setupIsReady()) { showApp(); return; }
  if (!panel) createPanel();
  if (panel.isVisible()) panel.hide();
  else showPanel();
}

// The full desktop app window: normal chrome, resizable, scrollable.
function showApp() {
  if (appWin) { appWin.show(); appWin.focus(); return; }
  appWin = new BrowserWindow({
    width: 880, height: 620, minWidth: 680, minHeight: 480,
    title: 'ScreenBuddy',
    backgroundColor: '#faf7f2',
    icon: IDLE_PNG,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  appWin.setMenuBarVisibility(false);
  appWin.loadFile(path.join(__dirname, '..', 'renderer', 'app.html'));
  appWin.on('closed', () => { appWin = null; });
}

const MODES = [
  { id: 'chill', label: 'Chill - just track, stay quiet' },
  { id: 'nudge', label: 'Nudge - gentle reminders' },
  { id: 'drill', label: 'Drill Sergeant - call me out' },
  { id: 'warden', label: 'Warden - hide distractions' },
  { id: 'jarvis', label: 'Jarvis - guard active pursuit' }
];

const LIMITS = [5, 10, 15, 30, 60];

function setMode(id) { saveConfig({ mode: id }); accountability.reset(); refreshTray(); }
function setLimit(min) {
  const cur = loadConfig();
  saveConfig({ accountability: { ...(cur.accountability || {}), distractionLimitMin: min } });
  accountability.reset();
  refreshTray();
}

function trayMenu() {
  const cfg = loadConfig();
  const cur = cfg.mode || 'nudge';
  const curLimit = cfg.accountability?.distractionLimitMin ?? 15;
  return Menu.buildFromTemplate([
    { label: 'Open ScreenBuddy app', click: showApp },
    { label: 'Show Pesto widget', click: showPanel },
    { type: 'separator' },
    {
      label: `Accountability: ${(MODES.find((m) => m.id === cur) || {}).label || cur}`,
      submenu: MODES.map((m) => ({
        label: m.label, type: 'radio', checked: cur === m.id, click: () => setMode(m.id)
      }))
    },
    {
      label: `Distraction limit: ${curLimit} min`,
      submenu: LIMITS.map((n) => ({
        label: `${n} minutes`, type: 'radio', checked: curLimit === n, click: () => setLimit(n)
      }))
    },
    { label: 'Pause / resume tracking', click: () => saveConfig({ trackingEnabled: !loadConfig().trackingEnabled }) },
    { type: 'separator' },
    { label: 'Visit our website', click: () => shell.openExternal('https://screenbudy.orbitboyzz.me/') },
    { type: 'separator' },
    { label: 'Quit ScreenBuddy', click: () => app.quit() }
  ]);
}

function refreshTray() { if (tray) tray.setContextMenu(trayMenu()); }

function buildTray() {
  let img = nativeImage.createFromPath(IDLE_PNG);
  if (!img.isEmpty()) img = img.resize({ width: 18, height: 18 });
  tray = new Tray(img);
  tray.setToolTip('ScreenBuddy - Pesto');
  tray.setContextMenu(trayMenu());
  tray.on('click', showPanel);
}

function setupIsReady() {
  return loadConfig().setup?.status === 'ready';
}

// ---- Accountability: notifications + Warden overlay ----
function notify(title, body) {
  try { new Notification({ title, body, silent: false }).show(); } catch { /* ignore */ }
}

function showWarden(appName, context = {}) {
  if (wardenWin) return; // one at a time
  const secs = loadConfig().accountability?.wardenSeconds ?? 10;
  const { workArea } = screen.getPrimaryDisplay();
  const W = 440, H = 320;
  wardenWin = new BrowserWindow({
    width: W, height: H,
    x: Math.round(workArea.x + (workArea.width - W) / 2),
    y: Math.round(workArea.y + (workArea.height - H) / 2),
    frame: false, transparent: true, resizable: false, alwaysOnTop: true,
    skipTaskbar: true, hasShadow: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  wardenWin.setAlwaysOnTop(true, 'screen-saver');
  const q = new URLSearchParams({
    app: appName || 'this app',
    secs: String(secs),
    pursuit: context.pursuit || '',
    reason: context.reason || 'distraction',
    category: context.category || '',
    currentPursuit: context.currentPursuit || ''
  }).toString();
  wardenWin.loadFile(path.join(__dirname, '..', 'renderer', 'warden.html'), { search: `?${q}` });
  wardenWin.on('closed', () => { wardenWin = null; });
}
function closeWarden() { if (wardenWin) { wardenWin.close(); wardenWin = null; } }

function jarvisActivePursuit(config) {
  const j = config.jarvis || {};
  if (!j.activePursuit) return '';
  if (j.activeUntil && Date.now() > Number(j.activeUntil)) return '';
  return j.activePursuit;
}

function rememberPrimaryWindow(config, sample) {
  if (!sample || !sample.app || sample.category === 'Distraction') return;
  const goal = jarvisActivePursuit(config);
  if (goal && sample.pursuit !== goal) return;
  if (!sample.productive && !sample.pursuit) return;
  lastPrimaryWindow = {
    app: sample.app,
    title: sample.title || '',
    pid: sample.pid || null,
    pursuit: sample.pursuit || '',
    ts: Date.now()
  };
}

function startBuddyRuntime() {
  if (buddyStarted) return;
  createOrb();
  createPanel();
  accountability.configure({
    onNudge: (msg) => notify('Pesto', msg),
    onDrill: (msg) => notify('Pesto', msg),
    onWarden: (appName, context) => showWarden(appName, context)
  });
  tracker.start(() => loadConfig(), (sample) => {
    const cfg = loadConfig();
    rememberPrimaryWindow(cfg, sample);
    accountability.onSample(cfg, sample);
  });
  buddyStarted = true;

  const cfg = loadConfig();
  if (jarvisWhatsapp.isEnabled(cfg)) {
    jarvisWhatsapp.start(cfg, { ask: buddyAsk, notify: forwardJarvisWhatsappEvent })
      .catch((err) => notify('Pesto', `Jarvis WhatsApp remote failed to start: ${err.message}`));
  }
}

app.whenReady().then(() => {
  // Required for Windows toast notifications (Nudge / Drill) to actually appear.
  if (process.platform === 'win32') app.setAppUserModelId('com.orbitboyzz.screenbuddy');
  buildTray();
  if (setupIsReady()) startBuddyRuntime();
  else showApp();
  globalShortcut.register('Alt+Space', togglePanel);
  updater.init();
  app.on('activate', () => { if (setupIsReady() && !orb) createOrb(); else showApp(); });
});

app.on('window-all-closed', () => { /* stay resident in the tray */ });
app.on('will-quit', () => { globalShortcut.unregisterAll(); tracker.stop(); jarvisWhatsapp.stop(); });

// ---- orb IPC (custom click-vs-drag handling) ----
ipcMain.handle('orb:toggle', () => togglePanel());
ipcMain.on('orb:dragStart', (_e, { x, y }) => { dragOffset = { x, y }; });
ipcMain.on('orb:dragMove', (_e, { x, y }) => {
  if (!orb) return;
  orb.setPosition(Math.round(x - dragOffset.x), Math.round(y - dragOffset.y));
  if (panel && panel.isVisible()) positionPanelNearOrb();
});

function findPursuit(config, text) {
  const hay = String(text || '').toLowerCase();
  let best = null;
  let score = 0;
  for (const p of config.pursuits || []) {
    const name = String(p.name || '').toLowerCase();
    let s = name && hay.includes(name) ? 100 : 0;
    for (const part of name.split(/\s+/).filter(Boolean)) {
      if (part.length > 2 && hay.includes(part)) s += 15;
    }
    for (const kw of p.keywords || []) {
      const k = String(kw || '').toLowerCase();
      if (k && hay.includes(k)) s += 10;
    }
    if (s > score) { score = s; best = p; }
  }
  return score ? best : null;
}

function parseDurationMs(text) {
  const q = String(text || '').toLowerCase();
  const min = q.match(/(?:for|next)\s+(\d+)\s*(?:m|min|minute|minutes)/);
  if (min) return Number(min[1]) * 60000;
  const hr = q.match(/(?:for|next)\s+(\d+)\s*(?:h|hr|hour|hours)/);
  if (hr) return Number(hr[1]) * 3600000;
  if (q.includes('next hour') || q.includes('for an hour')) return 3600000;
  return null;
}

function setJarvisPursuit(pursuitName, durationMs) {
  const cur = loadConfig();
  const activeUntil = durationMs ? Date.now() + durationMs : null;
  const cfg = saveConfig({
    mode: 'jarvis',
    jarvis: { ...(cur.jarvis || {}), activePursuit: pursuitName, activeUntil }
  });
  accountability.reset();
  refreshTray();
  return cfg;
}

async function handleJarvisQuestion(question) {
  const q = String(question || '').trim();
  const lower = q.toLowerCase();
  const config = loadConfig();

  if (/(switch|switching|focus|set).*(goal|pursuit|to)|^focus on /.test(lower)) {
    const pursuit = findPursuit(config, q);
    if (!pursuit) {
      return { text: "I couldn't match that to one of your Life Pursuits. Open the app and add it first." };
    }
    const durationMs = parseDurationMs(q);
    setJarvisPursuit(pursuit.name, durationMs);
    const suffix = durationMs ? ` for ${Math.round(durationMs / 60000)} minutes` : '';
    return { text: `Jarvis mode on. Active pursuit: ${pursuit.name}${suffix}. I'll guard against drift from that goal.` };
  }

  if (lower.includes('pause jarvis') || lower.includes('pause accountability') || lower.includes('chill mode')) {
    const cfg = saveConfig({ mode: 'chill' });
    accountability.reset();
    refreshTray();
    return { text: `Jarvis is paused. Current mode: ${cfg.mode}.` };
  }

  if (lower.includes('jarvis mode') || lower.includes('warden mode')) {
    const cfg = saveConfig({ mode: 'jarvis' });
    accountability.reset();
    refreshTray();
    const goal = jarvisActivePursuit(cfg);
    return { text: goal ? `Jarvis mode is on, guarding ${goal}.` : 'Jarvis mode is on. Set an active pursuit and I will guard it.' };
  }

  const wantsRecovery = lower.includes('where was i') ||
    lower.includes('restore yesterday') ||
    (lower.includes('working on') && lower.includes('yesterday'));
  if (wantsRecovery && lower.includes('yesterday')) {
    const text = await answers.answer(question, config);
    return {
      text,
      actions: [{ id: 'restore-workspace:yesterday', label: "Restore yesterday's workspace" }]
    };
  }

  return null;
}

// Shared brain behind both the in-app chat panel and the WhatsApp remote (below) —
// one place that owns "what does a question/command from the user actually do."
async function buddyAsk(question) {
  const jarvis = await handleJarvisQuestion(question);
  if (jarvis) return jarvis;
  return answers.answer(question, loadConfig());
}

// ---- panel IPC ----
ipcMain.handle('buddy:ask', (_e, question) => buddyAsk(question));
ipcMain.handle('buddy:today', () => {
  const start = answers.startOfDay(Date.now());
  const s = answers.summarize(start, Date.now());
  return {
    productiveMs: s.productiveMs,
    totalMs: s.totalMs,
    byPursuit: s.byPursuit.map(([name, ms]) => ({ name, ms, label: answers.fmt(ms) }))
  };
});
ipcMain.handle('buddy:getConfig', () => loadConfig());
ipcMain.handle('buddy:status', () => {
  const cfg = loadConfig();
  return {
    tracking: cfg.trackingEnabled,
    error: tracker.getLastError(),
    mode: cfg.mode || 'nudge',
    activePursuit: jarvisActivePursuit(cfg)
  };
});
ipcMain.handle('panel:hide', () => { if (panel) panel.hide(); });
ipcMain.handle('buddy:quit', () => app.quit());

function requireAppWindow(event) {
  if (!appWin || event.sender !== appWin.webContents) {
    throw new Error('This setting can only be changed from the ScreenBuddy app window.');
  }
}

// Save the user's edited Life Pursuits / privacy tiers. These are app-only:
// the widget is intentionally just a glance card plus chat.
// Re-classify all stored activity against the current pursuits/distractions, so
// changing your Life Pursuits updates today's numbers retroactively (not just going forward).
function relabelHistory(config) {
  const { readAll, rewriteAll } = require('./db');
  const { classify } = require('./classify');
  const rows = readAll();
  for (const r of rows) {
    const c = classify(r.app, r.title, config);
    r.category = c.category;
    r.productive = c.productive;
    r.pursuit = c.pursuit;
  }
  rewriteAll(rows);
}

ipcMain.handle('buddy:savePursuits', (event, pursuits) => {
  requireAppWindow(event);
  const cfg = saveConfig({ pursuits: Array.isArray(pursuits) ? pursuits : [] });
  try { relabelHistory(cfg); } catch { /* non-fatal */ }
  return cfg;
});
ipcMain.handle('buddy:saveTiers', (event, tiers) => {
  requireAppWindow(event);
  return saveConfig({ privacyTiers: tiers && typeof tiers === 'object' ? tiers : {} });
});
ipcMain.handle('buddy:saveAgentSettings', (event, settings) => {
  requireAppWindow(event);
  const current = loadConfig();
  const provider = ['hermes', 'ollama', 'openai-compat'].includes(settings?.provider)
    ? settings.provider
    : current.provider;
  return saveConfig({
    provider,
    hermes: { ...current.hermes, ...(settings?.hermes || {}) },
    ollama: { ...current.ollama, ...(settings?.ollama || {}) },
    openaiCompat: { ...current.openaiCompat, ...(settings?.openaiCompat || {}) }
  });
});
ipcMain.handle('buddy:testAgent', async (event, settings) => {
  requireAppWindow(event);
  const cfg = settings ? {
    ...loadConfig(),
    provider: settings.provider,
    hermes: { ...loadConfig().hermes, ...(settings.hermes || {}) },
    ollama: { ...loadConfig().ollama, ...(settings.ollama || {}) },
    openaiCompat: { ...loadConfig().openaiCompat, ...(settings.openaiCompat || {}) }
  } : loadConfig();
  return providers.testProvider(cfg);
});
ipcMain.handle('buddy:declineSetup', (event) => {
  requireAppWindow(event);
  return saveConfig({ setup: { status: 'declined', lastError: '', completedAt: null } });
});
ipcMain.handle('buddy:openSetupHelp', async (event, errorText) => {
  requireAppWindow(event);
  const cfg = loadConfig();
  const base = cfg.setup?.supportUrl || 'https://support.orbitboyzz.me/';
  const url = new URL(base);
  url.searchParams.set('product', 'ScreenBuddy');
  url.searchParams.set('screen', 'first-run-setup');
  url.searchParams.set('platform', process.platform);
  url.searchParams.set('version', app.getVersion());
  url.searchParams.set('error', String(errorText || cfg.setup?.lastError || 'Unknown setup error').slice(0, 1800));
  await shell.openExternal(url.toString());
  return { ok: true, url: url.toString() };
});
// Scan the PC for installed apps, categorize each via the built-in knowledge base,
// and auto-build Life Pursuits (productive categories) + distractions (games/streaming).
// So a dev with a thousand apps never hand-tags anything.
async function buildProfileFromScan(replaceAll) {
  const { getInstalledApps } = require('./appscan');
  const { categoryForApp, CATEGORIES } = require('./appknowledge');
  const emojiFor = {};
  const catNames = new Set();
  for (const c of CATEGORIES) { emojiFor[c.category] = c.emoji; catNames.add(c.category); }

  const apps = await getInstalledApps();
  const pursuitKw = new Map(); // category -> Set(keywords)
  const distractions = new Set();
  let recognized = 0;

  for (const name of apps) {
    const kb = categoryForApp(name);
    if (!kb) continue;
    recognized += 1;
    if (kb.distraction) distractions.add(kb.pattern);
    else if (kb.productive) {
      if (!pursuitKw.has(kb.category)) pursuitKw.set(kb.category, new Set());
      pursuitKw.get(kb.category).add(kb.pattern);
    }
    // Browsing / Music are neutral — left for live categorization, not a pursuit.
  }

  const scanned = [...pursuitKw.entries()].map(([cat, kws]) => ({
    name: cat, emoji: emojiFor[cat] || '🎯', keywords: [...kws]
  }));

  const cur = loadConfig();
  // First-run: replace placeholder pursuits. Manual re-scan: keep the user's custom
  // (non-category) pursuits and refresh the auto category ones.
  const kept = replaceAll ? [] : (cur.pursuits || []).filter((p) => !catNames.has(p.name));
  const pursuits = [...scanned, ...kept];
  const mergedDistractions = [...new Set([...(cur.distractions || []), ...distractions])];

  const cfg = saveConfig({ pursuits, distractions: mergedDistractions });
  try { relabelHistory(cfg); } catch { /* non-fatal */ }
  return {
    appsScanned: apps.length,
    recognized,
    categories: scanned.map((p) => ({ name: p.name, emoji: p.emoji, count: p.keywords.length }))
  };
}

function errorMessage(err) {
  return String(err && (err.stack || err.message) || err || 'Unknown setup error').slice(0, 1800);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHermes(config, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      await providers.testProvider(config);
      return true;
    } catch (err) {
      lastError = err;
      await sleep(1000);
    }
  }
  throw lastError || new Error('Hermes did not become ready in time.');
}

// "Start Pesto": install/start the local Hermes AI helper, scan local apps, and
// pre-build pursuits. If anything fails, the setup page can open support with
// the exact error already attached.
ipcMain.handle('buddy:installSetup', async (event) => {
  requireAppWindow(event);
  saveConfig({ setup: { status: 'installing', lastError: '', completedAt: null } });
  try {
    await setup.installHermes();
    await setup.startHermesGateway();
    try { await buildProfileFromScan(true); } catch { /* scan is best-effort */ }

    const cfg = saveConfig({
      provider: 'hermes',
      setup: { status: 'ready', lastError: '', completedAt: new Date().toISOString() }
    });
    await waitForHermes(cfg);
    startBuddyRuntime();
    return loadConfig();
  } catch (err) {
    const msg = errorMessage(err);
    saveConfig({ setup: { status: 'failed', lastError: msg, completedAt: null } });
    throw new Error(msg);
  }
});

// Manual "Scan my PC" button from the app window.
ipcMain.handle('buddy:scanApps', async (event) => {
  requireAppWindow(event);
  return buildProfileFromScan(false);
});
ipcMain.handle('buddy:openApp', () => showApp());
ipcMain.handle('buddy:openSite', () => shell.openExternal('https://screenbudy.orbitboyzz.me/'));

// ---- Premium (hosted AI: Supabase auth + Stripe sub) ----
ipcMain.handle('premium:status', () => premium.status());
ipcMain.handle('premium:signIn', (event, creds) => {
  requireAppWindow(event);
  return premium.signIn(String(creds?.email || '').trim(), String(creds?.password || ''));
});
ipcMain.handle('premium:signUp', (event, creds) => {
  requireAppWindow(event);
  return premium.signUp(String(creds?.email || '').trim(), String(creds?.password || ''));
});
ipcMain.handle('premium:signOut', (event) => { requireAppWindow(event); return premium.signOut(); });
ipcMain.handle('premium:upgrade', (event) => { requireAppWindow(event); return premium.upgrade(); });

// ---- Accountability IPC ----
// Warden overlay result: minimize (reversible) or cancel.
ipcMain.handle('warden:hide', async () => {
  closeWarden();
  try { await minimizeActiveWindow(); } catch { /* ignore */ }
  if (lastPrimaryWindow) {
    await new Promise((resolve) => setTimeout(resolve, 180));
    try { await activateWindow(lastPrimaryWindow); } catch { /* best-effort */ }
  }
  return { ok: true };
});
ipcMain.handle('warden:cancel', () => { closeWarden(); return { ok: true }; });

// Set the accountability mode + thresholds from the app window.
ipcMain.handle('buddy:setMode', (event, mode) => {
  requireAppWindow(event);
  const id = ['chill', 'nudge', 'drill', 'warden', 'jarvis'].includes(mode) ? mode : 'nudge';
  const cfg = saveConfig({ mode: id });
  accountability.reset();
  refreshTray();
  return cfg;
});
ipcMain.handle('buddy:saveAccountability', (event, settings) => {
  requireAppWindow(event);
  const cur = loadConfig();
  const id = ['chill', 'nudge', 'drill', 'warden', 'jarvis'].includes(settings?.mode) ? settings.mode : cur.mode;
  const cfg = saveConfig({
    mode: id,
    accountability: { ...(cur.accountability || {}), ...(settings?.accountability || {}) }
  });
  accountability.reset();
  refreshTray();
  return cfg;
});

// Save Jarvis settings and context-recovery actions.
ipcMain.handle('buddy:saveJarvis', (event, settings) => {
  requireAppWindow(event);
  const cur = loadConfig();
  const id = ['chill', 'nudge', 'drill', 'warden', 'jarvis'].includes(settings?.mode) ? settings.mode : cur.mode;
  const cfg = saveConfig({
    mode: id,
    accountability: { ...(cur.accountability || {}), ...(settings?.accountability || {}) },
    jarvis: { ...(cur.jarvis || {}), ...(settings?.jarvis || {}) }
  });
  accountability.reset();
  refreshTray();
  return cfg;
});

// ---- Jarvis WhatsApp remote (opt-in, off by default — see jarvis-whatsapp.js) ----
function forwardJarvisWhatsappEvent(evt) {
  if (appWin && !appWin.isDestroyed()) appWin.webContents.send('jarvis:whatsappEvent', evt);
}

ipcMain.handle('buddy:jarvisWhatsappStatus', () => jarvisWhatsapp.status());

ipcMain.handle('buddy:jarvisWhatsappSet', async (event, settings) => {
  requireAppWindow(event);
  const cur = loadConfig();
  const enabled = !!settings?.enabled;
  const cfg = saveConfig({
    jarvisWhatsapp: {
      ...(cur.jarvisWhatsapp || {}),
      enabled,
      projectDir: typeof settings?.projectDir === 'string' ? settings.projectDir : (cur.jarvisWhatsapp?.projectDir || '')
    }
  });

  if (enabled) {
    await jarvisWhatsapp.start(cfg, { ask: buddyAsk, notify: forwardJarvisWhatsappEvent });
  } else {
    await jarvisWhatsapp.stop();
  }
  return { config: cfg, status: jarvisWhatsapp.status() };
});

async function restoreWorkspace(label) {
  const { getActivityBetween } = require('./db');
  const range = answers.rangeFor(label === 'yesterday' ? 'yesterday' : 'today');
  const rows = getActivityBetween(range.start, range.end);
  if (!rows.length) return { text: `I don't have enough activity logged for ${range.label} to restore yet.` };

  const byApp = new Map();
  const byPursuit = new Map();
  for (const r of rows) {
    if (!r.app || r.app === 'Unknown' || r.category === 'Distraction') continue;
    byApp.set(r.app, (byApp.get(r.app) || 0) + (r.durationMs || 0));
    if (r.pursuit) byPursuit.set(r.pursuit, (byPursuit.get(r.pursuit) || 0) + (r.durationMs || 0));
  }

  const limit = loadConfig().jarvis?.restoreWindowLimit || 3;
  const apps = [...byApp.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  const pursuit = [...byPursuit.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  if (pursuit) setJarvisPursuit(pursuit, 3600000);

  const opened = [];
  for (const [appName] of apps) {
    try {
      await launchOrActivateApp(appName);
      opened.push(appName);
    } catch {
      // Some process names are not directly launchable. Best-effort only.
    }
  }

  const appText = opened.length
    ? `I reopened or focused: ${opened.join(', ')}.`
    : "I found the context, but couldn't reopen those apps automatically.";
  const goalText = pursuit ? ` Active pursuit is now ${pursuit} for the next hour.` : '';
  return { text: `${appText}${goalText}` };
}

ipcMain.handle('buddy:runAction', async (_event, actionId) => {
  if (actionId === 'restore-workspace:yesterday') return restoreWorkspace('yesterday');
  return { text: "I don't know how to run that action yet." };
});

// Apps the user has actually used recently; helps build pursuit keywords.
ipcMain.handle('buddy:recentApps', () => {
  const { getActivityBetween } = require('./db');
  const rows = getActivityBetween(Date.now() - 3 * 86400000, Date.now());
  const m = new Map();
  for (const r of rows) m.set(r.app, (m.get(r.app) || 0) + r.durationMs);
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
    .map(([appName, ms]) => ({ app: appName, label: answers.fmt(ms) }));
});
