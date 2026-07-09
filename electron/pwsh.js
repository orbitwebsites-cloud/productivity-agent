'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

// Resolve a working PowerShell executable. Bare 'powershell.exe' relies on PATH,
// which isn't guaranteed — a stripped/non-interactive launch environment (a locked-down
// corporate machine, an odd shortcut, a restricted service context) can leave PATH without
// System32 in it, causing spawn('powershell.exe', ...) to fail with ENOENT even though
// PowerShell is actually installed. Try several known-good absolute locations too.
let cached = null;

function findPowerShell() {
  if (cached) return cached;
  const candidates = [
    path.join(process.env.WINDIR || process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'),
    path.join(process.env.WINDIR || process.env.SystemRoot || 'C:\\Windows', 'SysWOW64', 'WindowsPowerShell', 'v1.0', 'powershell.exe'),
    'powershell.exe', // last resort: PATH-based, in case the above ever move
    'pwsh.exe',
    path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'PowerShell', '7', 'pwsh.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WindowsApps', 'pwsh.exe')
  ];
  for (const c of candidates) {
    try {
      const result = spawnSync(c, ['-NoProfile', '-NonInteractive', '-Command', 'exit'], { windowsHide: true, timeout: 3000 });
      if (result.status === 0) { cached = c; return c; }
    } catch { /* try next */ }
  }
  throw new Error(
    'PowerShell is not installed or not reachable.\n\n' +
    'ScreenBuddy needs PowerShell for activity tracking on Windows.\n\n' +
    'Fix options:\n' +
    '1. Enable Windows PowerShell: Settings > Apps > Optional features > Add a feature > Windows PowerShell\n' +
    '2. Or install PowerShell 7: https://aka.ms/powershell'
  );
}

module.exports = { findPowerShell };
