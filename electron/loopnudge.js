'use strict';

// Detects the "copy-paste loop": bouncing back and forth between an AI-chat surface
// (ChatGPT/Claude/Gemini/Copilot in a browser) and a code editor over and over, instead
// of just letting Pesto draft it directly. Feeds off the same per-tick tracker samples
// accountability.js uses — see electron/tracker.js's sampleCb.

const SOURCE_RE = /chatgpt|claude\.ai|gemini|copilot|perplexity|chat\.openai/i;
const DEST_RE = /visual studio code|vs code|\bvscode\b|cursor|sublime text|webstorm|intellij|android studio|pycharm/i;

const WINDOW_MS = 20 * 60 * 1000;   // only look at switches within the last 20 minutes
const ALTERNATIONS_NEEDED = 6;      // ~3 round trips
const COOLDOWN_MS = 20 * 60 * 1000; // don't re-nag more than once per 20 min

let history = []; // [{ bucket: 'source'|'dest', app, title, ts }]
let lastBucket = null;
let lastNudgeAt = 0;

function bucketFor(sample) {
  const hay = `${sample.app || ''} ${sample.title || ''}`;
  if (DEST_RE.test(hay)) return 'dest';
  if (SOURCE_RE.test(hay)) return 'source';
  return null;
}

// Called once per tracker tick. Fires onLoopDetected({ sourceApp, destApp, minutes })
// at most once per cooldown window once a genuine alternating pattern shows up.
function onSample(sample, onLoopDetected) {
  const bucket = bucketFor(sample);
  const now = Date.now();
  history = history.filter((h) => now - h.ts < WINDOW_MS);

  if (!bucket || bucket === lastBucket) return; // neutral window, or same bucket again
  lastBucket = bucket;
  history.push({ bucket, app: sample.app, title: sample.title, ts: now });

  if (history.length < ALTERNATIONS_NEEDED || now - lastNudgeAt < COOLDOWN_MS) return;

  // Require the *last* ALTERNATIONS_NEEDED switches to strictly alternate — a couple
  // of stray flips shouldn't be enough, this should feel like a real loop.
  const recent = history.slice(-ALTERNATIONS_NEEDED);
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].bucket === recent[i - 1].bucket) return;
  }

  lastNudgeAt = now;
  const sourceApp = [...recent].reverse().find((h) => h.bucket === 'source')?.app || 'that AI chat';
  const destApp = [...recent].reverse().find((h) => h.bucket === 'dest')?.app || 'your editor';
  const minutes = Math.max(1, Math.round((recent[recent.length - 1].ts - recent[0].ts) / 60000));
  onLoopDetected({ sourceApp, destApp, minutes });
}

function reset() { history = []; lastBucket = null; }

module.exports = { onSample, reset };
