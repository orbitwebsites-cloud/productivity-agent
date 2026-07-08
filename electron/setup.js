'use strict';

const { spawn } = require('child_process');
const os = require('os');

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
    const script = [
      "$ErrorActionPreference = 'Stop'",
      "iex (irm https://hermes-agent.nousresearch.com/install.ps1)",
      "$hermesDir = Join-Path $env:USERPROFILE '.hermes'",
      'New-Item -ItemType Directory -Force -Path $hermesDir | Out-Null',
      "$envPath = Join-Path $hermesDir '.env'",
      "$lines = @('API_SERVER_ENABLED=true','API_SERVER_KEY=change-me-local-dev','API_SERVER_HOST=127.0.0.1','API_SERVER_PORT=8642')",
      '$lines | Set-Content -Path $envPath -Encoding UTF8'
    ].join('; ');
    return run('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script]);
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
  const command = process.platform === 'win32' ? 'powershell.exe' : '/bin/sh';
  const script = process.platform === 'win32'
    ? [
      "$ErrorActionPreference = 'Stop'",
      '$cmd = Get-Command hermes -ErrorAction SilentlyContinue',
      '$candidates = @()',
      'if ($cmd) { $candidates += $cmd.Source }',
      '$candidates += (Join-Path $env:USERPROFILE ".hermes\\bin\\hermes.exe")',
      '$candidates += (Join-Path $env:LOCALAPPDATA "Programs\\Hermes\\hermes.exe")',
      '$candidates += (Join-Path $env:LOCALAPPDATA "hermes\\hermes.exe")',
      '$candidates = $candidates | Where-Object { $_ -and (Test-Path $_) }',
      '$exe = $candidates | Select-Object -First 1',
      'if (-not $exe) { throw "Hermes installed, but hermes.exe was not found on PATH or common install paths." }',
      'Start-Process -FilePath $exe -ArgumentList "serve --skip-build --host 127.0.0.1 --port 9119" -WindowStyle Hidden'
    ].join('\n')
    : 'if command -v hermes >/dev/null 2>&1; then nohup hermes serve --skip-build --host 127.0.0.1 --port 9119 >/tmp/screenbuddy-hermes.log 2>&1 & else echo "Hermes installed, but hermes was not found on PATH." >&2; exit 1; fi';
  const args = process.platform === 'win32'
    ? ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script]
    : ['-lc', script];
  return run(command, args);
}

module.exports = { installHermes, startHermesGateway };
