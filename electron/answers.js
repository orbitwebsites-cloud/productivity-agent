'use strict';

const { getActivityBetween } = require('./db');
const providers = require('./providers');

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function fmt(ms) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

function rangeFor(question) {
  const q = (question || '').toLowerCase();
  const now = Date.now();
  const todayStart = startOfDay(now);
  if (q.includes('yesterday')) {
    return { start: todayStart - 86400000, end: todayStart - 1, label: 'yesterday' };
  }
  if (q.includes('week')) {
    return { start: todayStart - 6 * 86400000, end: now, label: 'this week' };
  }
  return { start: todayStart, end: now, label: 'today' };
}

function aggregate(rows) {
  const byPursuit = new Map();
  const byApp = new Map();
  const byTitle = new Map();
  const byDistractionApp = new Map();
  let productiveMs = 0;
  let totalMs = 0;

  for (const r of rows) {
    totalMs += r.durationMs;
    if (r.productive) {
      productiveMs += r.durationMs;
    } else {
      byDistractionApp.set(r.app, (byDistractionApp.get(r.app) || 0) + r.durationMs);
    }
    const pk = r.pursuit || r.category || 'Other';
    byPursuit.set(pk, (byPursuit.get(pk) || 0) + r.durationMs);
    byApp.set(r.app, (byApp.get(r.app) || 0) + r.durationMs);
    if (r.title) byTitle.set(r.title, (byTitle.get(r.title) || 0) + r.durationMs);
  }

  const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
  return {
    byPursuit: top(byPursuit, 8),
    byApp: top(byApp, 6),
    byTitle: top(byTitle, 6),
    byDistractionApp: top(byDistractionApp, 5),
    productiveMs,
    totalMs
  };
}

function summarize(startMs, endMs) {
  return aggregate(getActivityBetween(startMs, endMs));
}

// How many days in a row (ending today) have any tracked productive time —
// a simple, honest "streak" built from the activity log itself, not a
// separate counter that could drift out of sync with it. Capped at 30 days
// back so a long-lived log never turns one question into a heavy scan.
function currentStreakDays() {
  const MAX_LOOKBACK = 30;
  let days = 0;
  for (let i = 0; i < MAX_LOOKBACK; i++) {
    const dayStart = startOfDay(Date.now()) - i * 86400000;
    const dayEnd = dayStart + 86399999;
    const rows = getActivityBetween(dayStart, Math.min(dayEnd, Date.now()));
    const hadProductiveTime = rows.some((r) => r.productive && r.durationMs > 0);
    if (!hadProductiveTime) break;
    days += 1;
  }
  return days;
}

function summaryText(label, a) {
  return [
    `Window: ${label}`,
    `Total tracked: ${fmt(a.totalMs)}`,
    `Productive tracked: ${fmt(a.productiveMs)}`,
    '',
    'By pursuit:',
    ...(a.byPursuit.length ? a.byPursuit.map(([p, ms]) => `- ${p}: ${fmt(ms)}`) : ['- none']),
    '',
    'Top apps:',
    ...(a.byApp.length ? a.byApp.map(([app, ms]) => `- ${app}: ${fmt(ms)}`) : ['- none']),
    '',
    'Top windows:',
    ...(a.byTitle.length ? a.byTitle.map(([title, ms]) => `- ${title}: ${fmt(ms)}`) : ['- none'])
  ].join('\n');
}

// The free/local floor: five genuinely distinct, useful things Pesto can tell
// you from your own tracked data with zero AI provider configured — greeting,
// what you worked on, distractions, streak, and overall productivity — plus a
// warm catch-all instead of a flat refusal for anything else. (When Hermes/a
// provider IS configured, `answer()` below tries that first for everything,
// including totally unrelated questions — this is only the offline floor.)
const GREETING_RE = /^(hi|hey|hello|yo|sup|what'?s up)\b/;

function looksLikeActivityQuestion(question) {
  const q = (question || '').trim().toLowerCase();
  if (q.length < 4) return false;
  return [
    'today', 'yesterday', 'week', 'productive', 'productivity', 'working',
    'work on', 'what did i', 'what was i', 'time', 'app', 'apps',
    'pursuit', 'tracked', 'focus', 'distract', 'wast', 'procrastinat',
    'streak', 'consisten', 'day', 'doing', 'how am i', 'how did i',
    'status', 'goal', 'progress', 'summary', 'overview'
  ].some((term) => q.includes(term));
}

function deterministicAnswer(question, a, label) {
  const q = (question || '').toLowerCase().trim();

  if (GREETING_RE.test(q)) {
    return "Hey! I can tell you what you worked on, how productive you've been, what's distracting you, or your daily streak — just ask.";
  }

  if (!looksLikeActivityQuestion(question)) {
    return "I'm scoped to your tracked activity for now, so I can't help with that one — but ask me what you worked on, how productive today was, what's distracting you, or your streak, and I've got real answers.";
  }

  if (a.totalMs === 0) {
    return `I don't have anything logged for ${label} yet. Give me a little time watching your screen and I'll have plenty to say.`;
  }

  if (q.includes('streak') || q.includes('consisten') || q.includes('days in a row')) {
    const days = currentStreakDays();
    if (days === 0) return "No active streak right now — get some productive time in today and you'll start one.";
    return `You're on a ${days}-day streak of logging productive time. ${days >= 3 ? 'Keep it going!' : "One more day and it's a real streak."}`;
  }

  if (q.includes('distract') || q.includes('wast') || q.includes('procrastinat')) {
    if (!a.byDistractionApp.length) {
      return `Nothing flagged as a distraction for ${label} — clean record so far.`;
    }
    const list = a.byDistractionApp.map(([app, ms]) => `- ${app}: ${fmt(ms)}`).join('\n');
    return `Here's what pulled you off track ${label}:\n\n${list}`;
  }

  if (q.includes('working on') || q.includes('what did i') || q.includes('what was i') || q.includes('doing')) {
    const apps = a.byApp.map(([app, ms]) => `${app} (${fmt(ms)})`).join(', ');
    const titles = a.byTitle.slice(0, 4).map(([title, ms]) => `- ${title} - ${fmt(ms)}`).join('\n');
    return `Here's what you were on ${label}:\n\nTop apps: ${apps || 'none'}\n\nSpecific windows:\n${titles || 'No window titles logged.'}`;
  }

  const pct = a.totalMs ? Math.round((a.productiveMs / a.totalMs) * 100) : 0;
  const pursuits = a.byPursuit.map(([p, ms]) => `- ${p} - ${fmt(ms)}`).join('\n');
  return `${label[0].toUpperCase()}${label.slice(1)} you were productive about ${pct}% of tracked time (${fmt(a.productiveMs)} of ${fmt(a.totalMs)}).\n\nBy pursuit:\n${pursuits}`;
}

async function answer(question, config) {
  const { start, end, label } = rangeFor(question);
  const a = aggregate(getActivityBetween(start, end));

  // Try the AI for everything, not just activity-shaped questions — the local
  // (Hermes) system prompt is a general assistant as well as an activity Q&A one,
  // so "take over and help me draft this" actually works, not just stats lookups.
  // The premium backend stays scoped to activity coaching per its own prompt; a
  // general question there just degrades to an honest "no data for that."
  try {
    const ai = await providers.answerQuestion(config, question, summaryText(label, a));
    if (ai && ai.trim()) return ai.trim();
  } catch {
    // No provider configured/reachable — fall back to the deterministic answer.
  }

  return deterministicAnswer(question, a, label);
}

module.exports = { answer, summarize, rangeFor, fmt, startOfDay, currentStreakDays };
