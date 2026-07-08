'use strict';

// The "push" side of ScreenBuddy. Watches for sustained time on a distraction and,
// depending on the user's chosen MODE, reacts:
//   chill  -> do nothing (silent tracking only)
//   nudge  -> gentle notification
//   drill  -> blunt / profane call-out
//   warden -> a cancelable countdown, then REVERSIBLY minimizes the distraction
//
// Never destructive: warden only minimizes (never closes), so no unsaved work is lost.

const NUDGE_LINES = [
  "You've been on {app} a while — still on a break? 🙂",
  "Hey, {app}'s been open a bit. Want to get back to it?",
  "Gentle nudge: {app} is eating your afternoon. All good?",
  "Quick check-in — {app} for a while now. Ready to refocus?"
];

const DRILL_LINES = [
  "Enough {app}. Stop being a bitch and do your shit. 🪖",
  "{app} again?! Close it and get back to work. Now.",
  "You're slacking on {app}. Move it. Do the thing you said mattered.",
  "Drop {app}. Future-you is watching and they're not impressed."
];

let handlers = {};          // { onNudge(msg, app), onDrill(msg, app), onWarden(app) }
let streakMs = 0;
let streakApp = null;
let cooldownUntil = 0;
let counter = 0;

function configure(h) { handlers = h || {}; }
function reset() { streakMs = 0; streakApp = null; }

function pick(lines, app) {
  const line = lines[counter % lines.length];
  counter += 1;
  return line.replace(/\{app\}/g, app);
}

// Fed one sample per tracker tick: { app, title, category, productive, pursuit }.
function onSample(config, sample) {
  const mode = (config && config.mode) || 'nudge';
  if (mode === 'chill' || !sample) { reset(); return; }

  const isDistraction = sample.category === 'Distraction';
  if (!isDistraction) { reset(); return; }

  // Accumulate consecutive time on the same distraction app.
  if (streakApp && streakApp !== sample.app) reset();
  streakApp = sample.app;
  streakMs += (config.trackIntervalMs || 5000);

  const acct = config.accountability || {};
  // Sane shipping default: 15 min on a distraction before Pesto reacts.
  // Adjustable from the tray ("Distraction limit") — testers can drop it to 5.
  const limitMs = Math.max(20000, (acct.distractionLimitMin != null ? acct.distractionLimitMin : 15) * 60000);
  const cooldownMs = Math.max(30000, (acct.cooldownMin != null ? acct.cooldownMin : 5) * 60000);
  const now = Date.now();

  if (streakMs < limitMs || now < cooldownUntil) return;

  // Threshold hit — act for the current mode, then cool down.
  const app = sample.app;
  cooldownUntil = now + cooldownMs;
  streakMs = 0;

  if (mode === 'nudge' && handlers.onNudge) handlers.onNudge(pick(NUDGE_LINES, app), app);
  else if (mode === 'drill' && handlers.onDrill) handlers.onDrill(pick(DRILL_LINES, app), app);
  else if (mode === 'warden' && handlers.onWarden) handlers.onWarden(app);
}

module.exports = { configure, onSample, reset };
