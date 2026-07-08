'use strict';

const { app } = require('electron');
const fs = require('fs');
const path = require('path');

// v1 storage = append-only JSONL in the userData dir. No native modules, no
// compilation — the app just runs. Volumes are tiny (one line per sample), and
// we can migrate to SQLite later without changing callers much.
//
// Everything stays 100% local. Nothing here ever leaves the machine.

let ACTIVITY_PATH;
function activityPath() {
  if (!ACTIVITY_PATH) ACTIVITY_PATH = path.join(app.getPath('userData'), 'activity.jsonl');
  return ACTIVITY_PATH;
}

// row: { ts, app, title, category, productive, pursuit, durationMs }
function insertActivity(row) {
  fs.appendFileSync(activityPath(), JSON.stringify(row) + '\n', 'utf8');
}

function readAll() {
  let raw;
  try {
    raw = fs.readFileSync(activityPath(), 'utf8');
  } catch {
    return [];
  }
  const rows = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try { rows.push(JSON.parse(line)); } catch { /* skip corrupt line */ }
  }
  return rows;
}

function getActivityBetween(startMs, endMs) {
  return readAll().filter((r) => r.ts >= startMs && r.ts <= endMs);
}

// Overwrite the whole log (used to re-label history after pursuits change).
function rewriteAll(rows) {
  const body = rows.map((r) => JSON.stringify(r)).join('\n');
  fs.writeFileSync(activityPath(), rows.length ? body + '\n' : '', 'utf8');
}

module.exports = { insertActivity, readAll, getActivityBetween, rewriteAll, activityPath };
