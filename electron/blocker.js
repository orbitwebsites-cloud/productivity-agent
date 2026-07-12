'use strict';

// The "hard block" side of ScreenBuddy, distinct from Warden. Warden is a
// countdown you can cancel — this is not. If an app or site is on the
// blocklist, ScreenBuddy just keeps yanking focus off it, every couple
// seconds, forever, with no button and no key combo that stops it. The only
// way off the list is turning it off in Settings (the app window).
//
// Site blocking is title-based (no browser URL access without the opt-in
// extension), so it matches the blocked term against the foreground window's
// app name AND title — good enough for "reddit", "youtube", "twitter", etc.,
// which browsers put in the tab/window title.

const { getActiveWindow } = require('./activewin');

const CHECK_MS = 1500;

let timer = null;
let minimizeFn = null;

function configure(minimize) { minimizeFn = minimize; }

function blockedTerms(config) {
  const bl = config.blocklist || {};
  if (!bl.enabled) return [];
  return [...(bl.apps || []), ...(bl.sites || [])]
    .map((t) => String(t || '').trim().toLowerCase())
    .filter(Boolean);
}

function matches(win, terms) {
  if (!win || !terms.length) return false;
  const hay = `${win.app || ''} ${win.title || ''}`.toLowerCase();
  return terms.some((t) => hay.includes(t));
}

async function tick(getConfig) {
  const config = getConfig();
  const terms = blockedTerms(config);
  if (!terms.length || !minimizeFn) return;
  try {
    const win = await getActiveWindow();
    if (matches(win, terms)) await minimizeFn();
  } catch { /* best-effort */ }
}

function start(getConfig) {
  stop();
  timer = setInterval(() => tick(getConfig), CHECK_MS);
}

function stop() { if (timer) { clearInterval(timer); timer = null; } }

module.exports = { start, stop, configure, matches, blockedTerms };
