'use strict';

const { insertActivity } = require('./db');
const { classify } = require('./classify');
const { getActiveWindow } = require('./activewin');

// Polls the active window on an interval and logs metadata-only samples.
// Active-window reading is done with OS tools (PowerShell / osascript) via
// ./activewin — no native modules, so the app packages cleanly.
//
// Privacy: we only ever read the foreground app name + window title. No pixels,
// no screenshots in v1. Apps set to tier 'off' are dropped entirely.

let timer = null;
let lastError = null;
let sampleCb = null; // optional: called with each classified sample (for accountability)

function tierFor(appName, config) {
  const t = (config.privacyTiers || {})[appName];
  return t || config.defaultTier || 'private';
}

async function sampleOnce(config) {
  try {
    const win = await getActiveWindow();
    if (!win) return;

    const appName = win.app || 'Unknown';
    const tier = tierFor(appName, config);
    if (tier === 'off') return; // user asked us to be blind to this app

    // 'private' tier still gets tracked — it's metadata-only, which is all v1 does.
    const title = win.title || '';
    const { category, productive, pursuit, distraction } = classify(appName, title, config);

    insertActivity({
      ts: Date.now(),
      app: appName,
      title,
      pid: win.pid || null,
      category,
      productive,
      pursuit,
      distraction,
      durationMs: config.trackIntervalMs
    });
    if (sampleCb) { try { sampleCb({ app: appName, title, pid: win.pid || null, category, productive, pursuit, distraction }); } catch { /* ignore */ } }
    lastError = null;
  } catch (err) {
    // Most likely: missing macOS Screen Recording / Accessibility permission.
    lastError = String(err && err.message ? err.message : err);
  }
}

function start(getConfig, onSample) {
  stop();
  sampleCb = onSample || null;
  const tick = () => {
    const config = getConfig();
    if (config.trackingEnabled) sampleOnce(config);
  };
  // Sample immediately, then on the configured interval.
  tick();
  timer = setInterval(tick, Math.max(1000, getConfig().trackIntervalMs || 5000));
}

function stop() {
  if (timer) { clearInterval(timer); timer = null; }
}

function getLastError() { return lastError; }

module.exports = { start, stop, sampleOnce, getLastError };
