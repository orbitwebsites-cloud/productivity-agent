'use strict';

const { shell } = require('electron');
const { loadConfig, saveConfig } = require('./config');

// Premium = the hosted AI. Sign in with a ScreenBuddy account (Supabase auth),
// subscribe via Stripe Checkout in the browser, and the app calls our backend's
// /api/ask with the user's access token. Free features never touch this file.

function pcfg() {
  return loadConfig().premium || {};
}

function backendUrl() {
  const u = (pcfg().backendUrl || '').replace(/\/$/, '');
  if (!u) throw new Error('Premium backend is not configured yet.');
  return u;
}

async function authCall(path, body) {
  const { supabaseUrl, supabaseAnonKey } = pcfg();
  if (!supabaseUrl || !supabaseAnonKey) throw new Error('Premium is not configured yet.');
  const r = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/${path}`, {
    method: 'POST',
    headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = data.msg || data.error_description || data.message || `auth failed (${r.status})`;
    throw new Error(msg);
  }
  return data;
}

function storeSession(data, email) {
  const session = data && data.access_token ? {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
    email: (data.user && data.user.email) || email || ''
  } : null;
  saveConfig({ premium: { ...pcfg(), session } });
  return session;
}

async function signIn(email, password) {
  const data = await authCall('token?grant_type=password', { email, password });
  storeSession(data, email);
  // AI answers should route to the hosted backend from now on.
  saveConfig({ provider: 'backend' });
  return status();
}

async function signUp(email, password) {
  const data = await authCall('signup', { email, password });
  if (data.access_token) {
    storeSession(data, email);
    saveConfig({ provider: 'backend' });
    return status();
  }
  // Email confirmation is on — no session until the user clicks the link.
  return { signedIn: false, needsEmailConfirm: true, email };
}

function signOut() {
  saveConfig({ premium: { ...pcfg(), session: null } });
  return { signedIn: false };
}

// Returns a fresh access token, refreshing if it expires within 60s.
async function getAccessToken() {
  const s = pcfg().session;
  if (!s || !s.access_token) return null;
  if (s.expires_at && s.expires_at - 60 > Date.now() / 1000) return s.access_token;
  if (!s.refresh_token) return null;
  try {
    const data = await authCall('token?grant_type=refresh_token', { refresh_token: s.refresh_token });
    const fresh = storeSession(data, s.email);
    return fresh ? fresh.access_token : null;
  } catch {
    return null;
  }
}

async function backendCall(method, path, body) {
  const token = await getAccessToken();
  if (!token) { const e = new Error('Sign in to use Premium.'); e.code = 'signed_out'; throw e; }
  const r = await fetch(`${backendUrl()}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(data.error || `backend error (${r.status})`);
    e.code = data.code || r.status;
    throw e;
  }
  return data;
}

async function status() {
  const s = pcfg().session;
  if (!s || !s.access_token) return { signedIn: false };
  try {
    const me = await backendCall('GET', '/api/me');
    return { signedIn: true, email: me.email, premium: !!me.premium, status: me.status };
  } catch (err) {
    if (err.code === 'signed_out' || err.code === 401) return { signedIn: false };
    // Backend unreachable / not configured — still signed in locally.
    return { signedIn: true, email: s.email, premium: false, error: err.message };
  }
}

// Opens Stripe Checkout in the user's browser. plan: 'monthly' | 'annual'.
async function upgrade(plan) {
  const r = await backendCall('POST', '/api/checkout', { plan: plan === 'annual' ? 'annual' : 'monthly' });
  if (r.alreadyPremium) return { alreadyPremium: true };
  if (r.url) { await shell.openExternal(r.url); return { opened: true }; }
  throw new Error('No checkout link returned.');
}

// Premium AI answer for the widget chat.
async function ask(question, summary) {
  const r = await backendCall('POST', '/api/ask', { question, summary });
  return r.answer || '';
}

module.exports = { signIn, signUp, signOut, status, upgrade, ask, getAccessToken };
