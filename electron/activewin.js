'use strict';

const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Get the foreground window's app name + title WITHOUT any native/compiled module.
// Windows: a tiny PowerShell script using user32.dll (GetForegroundWindow, etc.).
// macOS:   osascript / System Events.
// This keeps the app free of native addons, so it packages into a plain .exe with
// no Visual Studio / node-gyp step. Metadata only — no pixels are ever read.

let winScriptPath = null;

const PS_SCRIPT = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class SBWin {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint procId);
}
"@
$h = [SBWin]::GetForegroundWindow()
$sb = New-Object System.Text.StringBuilder 1024
[void][SBWin]::GetWindowText($h, $sb, 1024)
$procId = 0
[void][SBWin]::GetWindowThreadProcessId($h, [ref]$procId)
$p = Get-Process -Id $procId -ErrorAction SilentlyContinue
$name = if ($p) { $p.ProcessName } else { "Unknown" }
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Output ($name + "|||" + $sb.ToString() + "|||" + $procId)
`;

function ensureWinScript() {
  if (winScriptPath && fs.existsSync(winScriptPath)) return winScriptPath;
  winScriptPath = path.join(app.getPath('temp'), 'screenbuddy-activewin.ps1');
  fs.writeFileSync(winScriptPath, PS_SCRIPT, 'utf8');
  return winScriptPath;
}

// Warden action: minimize the CURRENT foreground window. Reversible (SW_MINIMIZE),
// so nothing is closed and no unsaved work can be lost — the user just re-opens it.
let minScriptPath = null;
const MIN_PS = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class SBMin {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@
$h = [SBMin]::GetForegroundWindow()
[void][SBMin]::ShowWindow($h, 6)  # 6 = SW_MINIMIZE
Write-Output "ok"
`;

function ensureMinScript() {
  if (minScriptPath && fs.existsSync(minScriptPath)) return minScriptPath;
  minScriptPath = path.join(app.getPath('temp'), 'screenbuddy-minimize.ps1');
  fs.writeFileSync(minScriptPath, MIN_PS, 'utf8');
  return minScriptPath;
}

const MAC_HIDE = [
  '-e', 'tell application "System Events" to set visible of (first application process whose frontmost is true) to false'
];

async function minimizeActiveWindow() {
  if (process.platform === 'win32') {
    await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', ensureMinScript()]);
  } else if (process.platform === 'darwin') {
    await run('osascript', MAC_HIDE);
  }
}

async function activateWindow(target) {
  if (!target) return;
  const pid = target.pid ? String(target.pid) : '';
  const appName = target.app ? String(target.app) : '';
  if (process.platform === 'win32') {
    const script = `
Add-Type -AssemblyName Microsoft.VisualBasic
$pidText = '${pid.replace(/'/g, "''")}'
$appName = '${appName.replace(/'/g, "''")}'
$ok = $false
if ($pidText) {
  try { $ok = [Microsoft.VisualBasic.Interaction]::AppActivate([int]$pidText) } catch { $ok = $false }
}
if (-not $ok -and $appName) {
  $p = Get-Process -Name $appName -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($p) { try { $ok = [Microsoft.VisualBasic.Interaction]::AppActivate([int]$p.Id) } catch { $ok = $false } }
}
Write-Output $(if ($ok) { 'ok' } else { 'miss' })
`;
    await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', script], 2500);
  } else if (process.platform === 'darwin' && appName) {
    await run('osascript', ['-e', `tell application "${appName.replace(/"/g, '\\"')}" to activate`], 2500);
  }
}

async function launchOrActivateApp(appName) {
  if (!appName) return false;
  try {
    await activateWindow({ app: appName });
    return true;
  } catch {
    // Fall through and attempt to launch by process/app name.
  }
  if (process.platform === 'win32') {
    await run('powershell.exe', [
      '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-Command', `Start-Process '${String(appName).replace(/'/g, "''")}'`
    ], 2500);
    return true;
  }
  if (process.platform === 'darwin') {
    await run('open', ['-a', appName], 2500);
    return true;
  }
  return false;
}

// Run a command, resolve its trimmed stdout, reject on error/timeout.
function run(cmd, args, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    let out = '', err = '';
    const child = spawn(cmd, args, { windowsHide: true });
    const timer = setTimeout(() => { child.kill(); reject(new Error('timeout')); }, timeoutMs);
    child.stdout.on('data', (d) => { out += d.toString(); });
    child.stderr.on('data', (d) => { err += d.toString(); });
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(out.trim());
      else reject(new Error(err.trim() || `exit ${code}`));
    });
  });
}

const MAC_OSA = [
  '-e', 'tell application "System Events" to set frontApp to name of first application process whose frontmost is true',
  '-e', 'set winTitle to ""',
  '-e', 'try',
  '-e', 'tell application "System Events" to tell process frontApp to set winTitle to name of front window',
  '-e', 'end try',
  '-e', 'return frontApp & "|||" & winTitle'
];

// Returns { app, title } or null.
async function getActiveWindow() {
  let raw;
  if (process.platform === 'win32') {
    raw = await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', ensureWinScript()]);
  } else if (process.platform === 'darwin') {
    raw = await run('osascript', MAC_OSA);
  } else {
    return null; // Linux not supported in v1
  }
  const idx = raw.indexOf('|||');
  if (idx === -1) return { app: raw || 'Unknown', title: '' };
  const parts = raw.split('|||');
  return {
    app: parts[0] || 'Unknown',
    title: parts[1] || '',
    pid: parts[2] ? Number(parts[2]) : null
  };
}

module.exports = { getActiveWindow, minimizeActiveWindow, activateWindow, launchOrActivateApp };
