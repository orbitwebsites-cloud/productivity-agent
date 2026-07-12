'use strict';

// The "push" side of ScreenBuddy.
// chill  -> silent tracking
// nudge  -> gentle notification
// drill  -> blunt notification
// warden -> countdown, then reversible minimize for hard distractions
// jarvis -> goal-aware warden for hard distractions or sustained drift from the active pursuit

const NUDGE_LINES = [
  "You've been on {app} a while. Still on a break?",
  "Hey, {app}'s been open a bit. Want to get back to it?",
  "Gentle nudge: {app} is eating your afternoon. All good?",
  "Quick check-in: {app} for a while now. Ready to refocus?"
];

const DRILL_LINES = [
  'Enough {app}. Back to the thing you said mattered.',
  '{app} again? Close it and get back to work.',
  "You're drifting on {app}. Move it.",
  "Drop {app}. Future-you is waiting."
];

let handlers = {};
let streakMs = 0;
let streakKey = null;
let cooldownUntil = 0;
let counter = 0;

// Warden cancel-abuse tracking: bailing on the same app's Warden repeatedly
// in a short window means the countdown isn't doing its job, so the next
// one for that app locks out cancel entirely (see isWardenLocked).
const CANCEL_WINDOW_MS = 20 * 60000;
const CANCEL_LOCK_THRESHOLD = 2;
const cancelHistory = new Map(); // app -> [timestamps]

function configure(h) { handlers = h || {}; }
function reset() { streakMs = 0; streakKey = null; }

function recordWardenCancel(app) {
  const key = app || 'Unknown';
  const now = Date.now();
  const hist = (cancelHistory.get(key) || []).filter((t) => now - t < CANCEL_WINDOW_MS);
  hist.push(now);
  cancelHistory.set(key, hist);
}

function isWardenLocked(app) {
  const key = app || 'Unknown';
  const now = Date.now();
  const hist = (cancelHistory.get(key) || []).filter((t) => now - t < CANCEL_WINDOW_MS);
  return hist.length >= CANCEL_LOCK_THRESHOLD;
}

// Letting the Warden actually hide the app (instead of bailing) is the
// behavior we want, so it forgives past cancels for that app.
function clearWardenCancels(app) {
  cancelHistory.delete(app || 'Unknown');
}

function pick(lines, app) {
  const line = lines[counter % lines.length];
  counter += 1;
  return line.replace(/\{app\}/g, app || 'this');
}

function activePursuit(config) {
  const j = (config && config.jarvis) || {};
  if (!j.activePursuit) return '';
  if (j.activeUntil && Date.now() > Number(j.activeUntil)) return '';
  return j.activePursuit;
}

// Fed one sample per tracker tick: { app, title, category, productive, pursuit, pid }.
function onSample(config, sample) {
  const mode = (config && config.mode) || 'nudge';
  if (mode === 'chill' || !sample) { reset(); return; }

  const app = sample.app || 'Unknown';
  const goal = activePursuit(config);
  // `distraction` covers both user-typed distraction strings (category
  // 'Distraction') and the built-in time-sinks flagged by the knowledge base
  // (YouTube, games, social). Fall back to the category check for samples
  // logged before the flag existed.
  const isDistraction = sample.distraction === true || sample.category === 'Distraction';
  const offPursuit = mode === 'jarvis' && goal && sample.pursuit !== goal;

  if (!isDistraction && !offPursuit) { reset(); return; }

  const key = `${app}::${goal || 'distraction'}`;
  if (streakKey && streakKey !== key) reset();
  streakKey = key;
  streakMs += (config.trackIntervalMs || 5000);

  const acct = config.accountability || {};
  const limitMin = offPursuit
    ? (acct.focusDriftLimitMin != null ? acct.focusDriftLimitMin : 15)
    : (acct.distractionLimitMin != null ? acct.distractionLimitMin : 15);
  const limitMs = Math.max(20000, limitMin * 60000);
  const cooldownMs = Math.max(30000, (acct.cooldownMin != null ? acct.cooldownMin : 5) * 60000);
  const now = Date.now();

  if (streakMs < limitMs || now < cooldownUntil) return;

  cooldownUntil = now + cooldownMs;
  streakMs = 0;

  const context = {
    app,
    pid: sample.pid || null,
    title: sample.title || '',
    pursuit: goal,
    currentPursuit: sample.pursuit || '',
    category: sample.category || '',
    reason: isDistraction ? 'distraction' : 'off-pursuit'
  };

  if (mode === 'nudge' && handlers.onNudge) handlers.onNudge(pick(NUDGE_LINES, app), app);
  else if (mode === 'drill' && handlers.onDrill) handlers.onDrill(pick(DRILL_LINES, app), app);
  else if ((mode === 'warden' || mode === 'jarvis') && handlers.onWarden) handlers.onWarden(app, context);
}

module.exports = { configure, onSample, reset, recordWardenCancel, isWardenLocked, clearWardenCancels };
