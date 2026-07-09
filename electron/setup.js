'use strict';

const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

function findPowerShell() {
  const candidates = [
    'pwsh.exe',
    'powershell.exe',
    path.join(process.env.WINDIR || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'),
    path.join(process.env.WINDIR || 'C:\\Windows', 'SysWOW64', 'WindowsPowerShell', 'v1.0', 'powershell.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WindowsApps', 'pwsh.exe'),
    path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'PowerShell', '7', 'pwsh.exe'),
  ];
  for (const c of candidates) {
    try {
      const result = spawnSync(c, ['-Command', 'exit'], { windowsHide: true, timeout: 3000 });
      if (result.status === 0) return c;
    } catch { /* try next */ }
  }
  throw new Error(
    'PowerShell is not installed or not on PATH.\n\n' +
    'ScreenBuddy needs PowerShell to set up its local AI helper.\n\n' +
    'Fix options:\n' +
    '1. Enable Windows PowerShell: Settings > Apps > Optional features > Add a feature > Windows PowerShell\n' +
    '2. Or install PowerShell 7: https://aka.ms/powershell\n' +
    '3. Or skip setup and use the free tracking features (no AI answers).'
  );
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true,
      shell: false,
      ...options
    });

    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || stdout || `${command} exited with ${code}`));
    });
  });
}

async function installHermes() {
  if (process.platform === 'win32') {
    const ps = findPowerShell();
    const script = [
      "$ErrorActionPreference = 'Stop'",
      "iex (irm https://hermes-agent.nousresearch.com/install.ps1)",
      "$hermesDir = Join-Path $env:USERPROFILE '.hermes'",
      'New-Item -ItemType Directory -Force -Path $hermesDir | Out-Null',
      "$envPath = Join-Path $hermesDir '.env'",
      "$lines = @('API_SERVER_ENABLED=true','API_SERVER_KEY=change-me-local-dev','API_SERVER_HOST=127.0.0.1','API_SERVER_PORT=8642')",
      '$lines | Set-Content -Path $envPath -Encoding UTF8'
    ].join('; ');
    return run(ps, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script]);
  }

  const home = os.homedir().replace(/'/g, "'\\''");
  const script = [
    'set -e',
    'curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash',
    `mkdir -p '${home}/.hermes'`,
    `cat > '${home}/.hermes/.env' <<'EOF'`,
    'API_SERVER_ENABLED=true',
    'API_SERVER_KEY=change-me-local-dev',
    'API_SERVER_HOST=127.0.0.1',
    'API_SERVER_PORT=8642',
    'EOF'
  ].join('\n');
  return run('/bin/sh', ['-lc', script]);
}

async function startHermesGateway() {
  if (process.platform === 'win32') {
    const ps = findPowerShell();
    const script = [
      "$ErrorActionPreference = 'Stop'",
      // The installer (installHermes, above) updates PATH in the registry, but
      // this process's own $env:Path is a stale snapshot inherited from whatever
      // launched ScreenBuddy.exe *before* that happened — Get-Command would miss
      // a hermes.exe that's genuinely on PATH. Re-read PATH from the registry
      // (Machine + User) before searching, same fix as Chocolatey's `refreshenv`.
      "$env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')",
      '$cmd = Get-Command hermes -ErrorAction SilentlyContinue',
      '$candidates = @()',
      'if ($cmd) { $candidates += $cmd.Source }',
      '$candidates += (Join-Path $env:USERPROFILE ".hermes\\bin\\hermes.exe")',
      '$candidates += (Join-Path $env:USERPROFILE ".hermes\\hermes.exe")',
      '$candidates += (Join-Path $env:LOCALAPPDATA "Programs\\Hermes\\hermes.exe")',
      '$candidates += (Join-Path $env:LOCALAPPDATA "hermes\\hermes.exe")',
      '$candidates += (Join-Path $env:LOCALAPPDATA "hermes-agent\\hermes.exe")',
      '$candidates += (Join-Path $env:USERPROFILE ".local\\bin\\hermes.exe")',
      '$candidates += (Join-Path ${env:ProgramFiles} "Hermes\\hermes.exe")',
      '$candidates = $candidates | Where-Object { $_ -and (Test-Path $_) }',
      '$exe = $candidates | Select-Object -First 1',
      'if (-not $exe) {',
      '  $found = Get-ChildItem -Path $env:USERPROFILE,$env:LOCALAPPDATA -Filter hermes.exe -Recurse -ErrorAction SilentlyContinue -Depth 4 | Select-Object -First 3 -ExpandProperty FullName',
      '  if ($found) { $hint = "Found via search instead: " + ($found -join "; ") + " -- update setup.js with this real path." }',
      '  else { $hint = "No hermes.exe found anywhere under USERPROFILE or LOCALAPPDATA -- the install step likely failed silently." }',
      '  throw "Hermes installed, but hermes.exe was not found on PATH or common install paths. $hint"',
      '}',
      'Start-Process -FilePath $exe -ArgumentList "serve --skip-build --host 127.0.0.1 --port 8642" -WindowStyle Hidden'
    ].join('\n');
    return run(ps, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script]);
  }
  const script = 'if command -v hermes >/dev/null 2>&1; then nohup hermes serve --skip-build --host 127.0.0.1 --port 8642 >/tmp/screenbuddy-hermes.log 2>&1 & else echo "Hermes installed, but hermes was not found on PATH." >&2; exit 1; fi';
  return run('/bin/sh', ['-lc', script]);
}

module.exports = { installHermes, startHermesGateway, findPowerShell };
