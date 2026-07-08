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
  const args = process.platform === 'win32'
    ? ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', 'Start-Process -WindowStyle Hidden hermes -ArgumentList gateway']
    : ['-lc', 'nohup hermes gateway >/tmp/screenbuddy-hermes.log 2>&1 &'];
  return run(command, args);
}

module.exports = { installHermes, startHermesGateway };
