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
  let productiveMs = 0;
  let totalMs = 0;

  for (const r of rows) {
    totalMs += r.durationMs;
    if (r.productive) productiveMs += r.durationMs;
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
    productiveMs,
    totalMs
  };
}

function summarize(startMs, endMs) {
  return aggregate(getActivityBetween(startMs, endMs));
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

function looksLikeActivityQuestion(question) {
  const q = (question || '').trim().toLowerCase();
  if (q.length < 4) return false;
  return [
    'today', 'yesterday', 'week', 'productive', 'productivity', 'working',
    'work on', 'what did i', 'what was i', 'time', 'app', 'apps',
    'pursuit', 'tracked', 'focus', 'distract'
  ].some((term) => q.includes(term));
}

function deterministicAnswer(question, a, label) {
  const q = (question || '').toLowerCase();

  if (!looksLikeActivityQuestion(question)) {
    return 'I can answer questions about your tracked activity, like "what was I working on today?" or "how productive was I this week?"';
  }

  if (a.totalMs === 0) {
    return `I don't have anything logged for ${label} yet. Give me a little time watching your screen and I'll have plenty to say.`;
  }

  if (q.includes('working on') || q.includes('what did i') || q.includes('what was i')) {
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

  if (!looksLikeActivityQuestion(question)) {
    return deterministicAnswer(question, a, label);
  }

  try {
    const ai = await providers.answerQuestion(config, question, summaryText(label, a));
    if (ai && ai.trim()) return ai.trim();
  } catch {
    // Local-first fallback when Ollama/cloud config is not available.
  }

  return deterministicAnswer(question, a, label);
}

module.exports = { answer, summarize, rangeFor, fmt, startOfDay };
