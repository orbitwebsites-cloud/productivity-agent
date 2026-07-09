'use strict';

const http = require('http');
const crypto = require('crypto');
const { shell } = require('electron');

// Google sign-in via Supabase's OAuth + PKCE flow — no supabase-js SDK, matching this
// codebase's existing plain-REST approach to Supabase auth (see premium.js). Desktop
// apps can't receive a browser redirect directly, so:
//   1. Open the system browser to Supabase's /authorize (which bounces through Google)
//      with a PKCE code_challenge.
//   2. Supabase redirects back to a short-lived local HTTP server on 127.0.0.1, carrying
//      its own one-time authorization code (not Google's — Supabase completes the Google
//      leg itself server-side).
//   3. Exchange that code + our code_verifier for a real session via /token.
//
// Requires Google to be enabled as an Auth provider in the Supabase project's dashboard
// (Authentication > Providers > Google, with a real Google Cloud OAuth client) — that's a
// one-time external setup step this code can't do for you.

const CALLBACK_PORT = 53682; // fixed loopback port, only ever bound during an active sign-in

function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pkcePair() {
  const verifier = base64url(crypto.randomBytes(32));
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

function waitForCallback(port, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const server = http.createServer((req, res) => {
      let url;
      try { url = new URL(req.url, `http://127.0.0.1:${port}`); } catch { res.writeHead(400); res.end(); return; }
      if (url.pathname !== '/callback') { res.writeHead(404); res.end(); return; }

      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error_description') || url.searchParams.get('error');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<!doctype html><html><body style="font:15px system-ui;padding:40px;text-align:center">
        <h2>${error ? 'Sign-in failed' : 'Signed in ✅'}</h2>
        <p>${error ? String(error) : 'You can close this tab and go back to ScreenBuddy.'}</p>
        </body></html>`);

      if (settled) return;
      settled = true;
      clearTimeout(timer);
      server.close();
      if (error) reject(new Error(error));
      else if (code) resolve(code);
      else reject(new Error('No authorization code received.'));
    });

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { server.close(); } catch { /* ignore */ }
      reject(new Error('Google sign-in timed out — try again.'));
    }, timeoutMs);

    server.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err.code === 'EADDRINUSE'
        ? new Error('A sign-in is already in progress.')
        : err);
    });

    server.listen(port, '127.0.0.1');
  });
}

async function signInWithGoogle({ supabaseUrl, supabaseAnonKey }) {
  if (!supabaseUrl || !supabaseAnonKey) throw new Error('Premium is not configured yet.');
  const base = supabaseUrl.replace(/\/$/, '');
  const { verifier, challenge } = pkcePair();
  const redirectTo = `http://127.0.0.1:${CALLBACK_PORT}/callback`;

  const authUrl = new URL(`${base}/auth/v1/authorize`);
  authUrl.searchParams.set('provider', 'google');
  authUrl.searchParams.set('redirect_to', redirectTo);
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 's256');

  const callbackPromise = waitForCallback(CALLBACK_PORT);
  await shell.openExternal(authUrl.toString());
  const code = await callbackPromise;

  const r = await fetch(`${base}/auth/v1/token?grant_type=pkce`, {
    method: 'POST',
    headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ auth_code: code, code_verifier: verifier })
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = data.msg || data.error_description || data.message || `Google sign-in failed (${r.status})`;
    throw new Error(msg);
  }
  return data; // { access_token, refresh_token, expires_in, user, ... } — same shape as email/password
}

module.exports = { signInWithGoogle };
