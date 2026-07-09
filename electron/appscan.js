'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { findPowerShell } = require('./pwsh');

// Scans the PC for INSTALLED applications (no native modules).
// Windows: registry uninstall keys (HKLM + HKCU, 32/64-bit).
// macOS:   /Applications, ~/Applications, /System/Applications.
// Returns an array of display names.

function run(cmd, args, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    let out = '';
    const child = spawn(cmd, args, { windowsHide: true });
    const t = setTimeout(() => { child.kill(); reject(new Error('scan timeout')); }, timeoutMs);
    child.stdout.on('data', (d) => { out += d.toString(); });
    child.on('error', (e) => { clearTimeout(t); reject(e); });
    child.on('close', () => { clearTimeout(t); resolve(out); });
  });
}

const WIN_PS = `
$keys = @(
  'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
  'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
  'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'
)
Get-ItemProperty $keys -ErrorAction SilentlyContinue |
  Where-Object { $_.DisplayName -and -not $_.SystemComponent } |
  Select-Object -ExpandProperty DisplayName |
  Sort-Object -Unique
`;

async function getInstalledApps() {
  try {
    if (process.platform === 'win32') {
      const script = path.join(require('electron').app.getPath('temp'), 'screenbuddy-appscan.ps1');
      fs.writeFileSync(script, WIN_PS, 'utf8');
      const out = await run(findPowerShell(), ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script]);
      return dedupe(out.split(/\r?\n/));
    }
    if (process.platform === 'darwin') {
      const dirs = ['/Applications', `${process.env.HOME}/Applications`, '/System/Applications'];
      const names = [];
      for (const dir of dirs) {
        try {
          for (const f of fs.readdirSync(dir)) {
            if (f.endsWith('.app')) names.push(f.replace(/\.app$/, ''));
          }
        } catch { /* dir may not exist */ }
      }
      return dedupe(names);
    }
  } catch {
    /* fall through */
  }
  return [];
}

function dedupe(list) {
  const seen = new Set();
  const out = [];
  for (const raw of list) {
    const name = String(raw || '').trim();
    if (!name) continue;
    const k = name.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(name);
  }
  return out;
}

module.exports = { getInstalledApps };
