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
const { minimizeActiveWindow } = require('./activewin');

const ASSET = (f) => path.join(__dirname, '..', 'assets', 'pesto', f);
const IDLE_PNG = ASSET('screenbuddy_mascot_idle.png');

let orb = null;      // the little clickable icon
let panel = null;    // the glance-card chat
let appWin = null;   // the full desktop app (settings / pursuits)
let wardenWin = null; // the Warden countdown overlay
let tray = null;
let dragOffset = { x: 0, y: 0 };
let buddyStarted = false;

// Only one instance — a second launch just shows the buddy.
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

// The full desktop app window — normal chrome, resizable, scrollable.
function showApp() {
  if (appWin) { appWin.show(); appWin.focus(); return; }
  appWin = new BrowserWindow({
    width: 880, height: 620, minWidth: 680, minHeight: 480,
    title: 'ScreenBuddy',
    backgroundColor: '#faf7f2',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  appWin.setMenuBarVisibility(false);
  appWin.loadFile(path.join(__dirname, '..', 'renderer', 'app.html'));
  appWin.on('closed', () => { appWin = null; });
}

const MODES = [
  { id: 'chill', label: '🧊 Chill — just track, stay quiet' },
  { id: 'nudge', label: '👋 Nudge — gentle reminders' },
  { id: 'drill', label: '🪖 Drill Sergeant — call me out' },
  { id: 'warden', label: '🚔 Warden — hide distractions' }
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
    { label: 'Quit ScreenBuddy', click: () => app.quit() }
  ]);
}

function refreshTray() { if (tray) tray.setContextMenu(trayMenu()); }

function buildTray() {
  let img = nativeImage.createFromPath(IDLE_PNG);
  if (!img.isEmpty()) img = img.resize({ width: 18, height: 18 });
  tray = new Tray(img);
  tray.setToolTip('ScreenBuddy — Pesto');
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

function showWarden(appName) {
  if (wardenWin) return; // one at a time
  const secs = loadConfig().accountability?.wardenSeconds ?? 10;
  const { workArea } = screen.getPrimaryDisplay();
  const W = 420, H = 260;
  wardenWin = new BrowserWindow({
    width: W, height: H,
    x: Math.round(workArea.x + (workArea.width - W) / 2),
    y: Math.round(workArea.y + (workArea.height - H) / 2),
    frame: false, transparent: true, resizable: false, alwaysOnTop: true,
    skipTaskbar: true, hasShadow: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  wardenWin.setAlwaysOnTop(true, 'screen-saver');
  const q = `?app=${encodeURIComponent(appName)}&secs=${encodeURIComponent(secs)}`;
  wardenWin.loadFile(path.join(__dirname, '..', 'renderer', 'warden.html'), { search: q });
  wardenWin.on('closed', () => { wardenWin = null; });
}
function closeWarden() { if (wardenWin) { wardenWin.close(); wardenWin = null; } }

function startBuddyRuntime() {
  if (buddyStarted) return;
  createOrb();
  createPanel();
  accountability.configure({
    onNudge: (msg) => notify('Pesto 👋', msg),
    onDrill: (msg) => notify('Pesto 🪖', msg),
    onWarden: (appName) => showWarden(appName)
  });
  tracker.start(() => loadConfig(), (sample) => accountability.onSample(loadConfig(), sample));
  buddyStarted = true;
}

app.whenReady().then(() => {
  // Required for Windows toast notifications (Nudge / Drill) to actually appear.
  if (process.platform === 'win32') app.setAppUserModelId('com.orbitboyzz.screenbuddy');
  buildTray();
  if (setupIsReady()) startBuddyRuntime();
  else showApp();
  globalShortcut.register('Alt+Space', togglePanel);
  app.on('activate', () => { if (setupIsReady() && !orb) createOrb(); else showApp(); });
});

app.on('window-all-closed', () => { /* stay resident in the tray */ });
app.on('will-quit', () => { globalShortcut.unregisterAll(); tracker.stop(); });

// ---- orb IPC (custom click-vs-drag handling) ----
ipcMain.handle('orb:toggle', () => togglePanel());
ipcMain.on('orb:dragStart', (_e, { x, y }) => { dragOffset = { x, y }; });
ipcMain.on('orb:dragMove', (_e, { x, y }) => {
  if (!orb) return;
  orb.setPosition(Math.round(x - dragOffset.x), Math.round(y - dragOffset.y));
  if (panel && panel.isVisible()) positionPanelNearOrb();
});

// ---- panel IPC ----
ipcMain.handle('buddy:ask', (_e, question) => answers.answer(question, loadConfig()));
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
ipcMain.handle('buddy:status', () => ({ tracking: loadConfig().trackingEnabled, error: tracker.getLastError() }));
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
  const base = cfg.setup?.supportUrl || 'https://screenbuddy.app/support/setup';
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

// "Start Pesto" — free local setup. No Hermes install. We DO scan the PC for apps so
// pursuits are pre-built. AI is a hosted Premium feature added later (sign-in).
ipcMain.handle('buddy:installSetup', async (event) => {
  requireAppWindow(event);
  try { await buildProfileFromScan(true); } catch { /* scan is best-effort */ }
  const cfg = saveConfig({
    setup: { status: 'ready', lastError: '', completedAt: new Date().toISOString() }
  });
  startBuddyRuntime();
  return cfg;
});

// Manual "Scan my PC" button from the app window.
ipcMain.handle('buddy:scanApps', async (event) => {
  requireAppWindow(event);
  return buildProfileFromScan(false);
});
ipcMain.handle('buddy:openApp', () => showApp());

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
  return { ok: true };
});
ipcMain.handle('warden:cancel', () => { closeWarden(); return { ok: true }; });

// Set the accountability mode + thresholds from the app window.
ipcMain.handle('buddy:setMode', (event, mode) => {
  requireAppWindow(event);
  const id = ['chill', 'nudge', 'drill', 'warden'].includes(mode) ? mode : 'nudge';
  const cfg = saveConfig({ mode: id });
  accountability.reset();
  refreshTray();
  return cfg;
});
ipcMain.handle('buddy:saveAccountability', (event, settings) => {
  requireAppWindow(event);
  const cur = loadConfig();
  const id = ['chill', 'nudge', 'drill', 'warden'].includes(settings?.mode) ? settings.mode : cur.mode;
  const cfg = saveConfig({
    mode: id,
    accountability: { ...(cur.accountability || {}), ...(settings?.accountability || {}) }
  });
  accountability.reset();
  refreshTray();
  return cfg;
});

// Apps the user has actually used recently — helps them pick keywords when
// building pursuits (so "Other" becomes "Tech Job", etc.).
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
