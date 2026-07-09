'use strict';

const { spawn } = require('child_process');

// Hermes Agent integration.
// Newer Hermes installs expose a first-class CLI (`hermes -z`) and a desktop
// backend (`hermes serve`). Older builds also exposed an OpenAI-compatible API.
// Prefer the API when available, but fall back to the CLI so Pesto can answer
// without asking the user to touch a terminal.

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true,
      shell: false,
      env: { ...process.env, HERMES_ACCEPT_HOOKS: '1', NO_COLOR: '1' },
      ...options
    });

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`${command} timed out`));
    }, options.timeoutMs || 90000);

    child.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || stdout || `${command} exited with ${code}`));
    });
  });
}

async function httpChat({ baseUrl, apiKey, model, system, user, imageBase64, sessionKey }) {
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });

  let content;
  if (imageBase64) {
    content = [
      { type: 'text', text: user || '' },
      { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
    ];
  } else {
    content = user || '';
  }
  messages.push({ role: 'user', content });

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`
  };
  if (sessionKey) headers['X-Hermes-Session-Key'] = sessionKey;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({ model, messages, stream: false })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Hermes API error ${res.status}: ${text}`);
    }
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? '';
  } finally {
    clearTimeout(timeout);
  }
}

async function cliChat({ system, user, imageBase64 }) {
  if (imageBase64) {
    throw new Error('Hermes CLI fallback does not support image prompts.');
  }
  const prompt = [
    system ? `System instructions:\n${system}` : '',
    `User request:\n${user || ''}`
  ].filter(Boolean).join('\n\n');
  const { stdout } = await run('hermes', ['-z', prompt]);
  return stdout.trim();
}

async function chat(args) {
  if (args.baseUrl) {
    try {
      return await httpChat(args);
    } catch (err) {
      if (args.imageBase64) throw err;
    }
  }
  return cliChat(args);
}

// Checks whether the local Hermes gateway is actually up and accepting
// connections. Prefer a direct HTTP probe over shelling out to `hermes version`:
// spawn() resolves bare command names against *this process's* PATH, which is a
// stale snapshot from whenever Electron itself launched — right after a fresh
// install, that snapshot predates the installer's PATH update, so a CLI-based
// check fails even though the gateway (started via an absolute resolved path in
// setup.js) is genuinely running. Any HTTP response at all, even an error
// status, proves the port is listening, which is all this actually needs to know.
async function health({ baseUrl, apiKey } = {}) {
  if (baseUrl) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(baseUrl.replace(/\/$/, ''), {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
        signal: controller.signal
      });
      return { ok: true, version: `http ${res.status}` };
    } catch {
      // Gateway isn't listening yet (or baseUrl is wrong) — fall through to the
      // CLI check, which at least works once PATH is no longer stale.
    } finally {
      clearTimeout(timeout);
    }
  }
  const { stdout } = await run('hermes', ['version'], { timeoutMs: 30000 });
  return { ok: true, version: stdout.trim() };
}

module.exports = { chat, health };
