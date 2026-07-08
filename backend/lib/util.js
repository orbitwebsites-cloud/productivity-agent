'use strict';

// Shared helpers for the ScreenBuddy hosted backend (Vercel serverless, zero deps).

const env = (name, fallback) => {
  const v = process.env[name];
  if (v === undefined || v === '') {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
};

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function readJson(req) {
  if (req.body !== undefined && req.body !== null) {
    // Vercel may have already parsed it.
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  }
  const raw = await readRawBody(req);
  return raw.length ? JSON.parse(raw.toString('utf8')) : {};
}

function bearerToken(req) {
  const h = req.headers.authorization || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

// ---- Supabase (REST, no SDK) ----

function supabaseUrl() { return env('SUPABASE_URL').replace(/\/$/, ''); }

// Resolve a Supabase access token to a user. Returns null if invalid/expired.
async function getUser(token) {
  if (!token) return null;
  const r = await fetch(`${supabaseUrl()}/auth/v1/user`, {
    headers: {
      apikey: env('SUPABASE_SERVICE_ROLE_KEY'),
      Authorization: `Bearer ${token}`
    }
  });
  if (!r.ok) return null;
  const u = await r.json();
  return u && u.id ? u : null;
}

// Read a user's subscription row (service role — bypasses RLS).
async function getSubscription(userId) {
  const r = await fetch(
    `${supabaseUrl()}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(userId)}&select=*`,
    {
      headers: {
        apikey: env('SUPABASE_SERVICE_ROLE_KEY'),
        Authorization: `Bearer ${env('SUPABASE_SERVICE_ROLE_KEY')}`
      }
    }
  );
  if (!r.ok) throw new Error(`subscription lookup failed: ${r.status}`);
  const rows = await r.json();
  return rows[0] || null;
}

function isPremium(sub) {
  if (!sub) return false;
  if (!['active', 'trialing'].includes(sub.status)) return false;
  if (sub.current_period_end && new Date(sub.current_period_end).getTime() < Date.now() - 24 * 3600 * 1000) {
    return false; // grace of 1 day past period end
  }
  return true;
}

async function upsertSubscription(row) {
  const r = await fetch(`${supabaseUrl()}/rest/v1/subscriptions?on_conflict=user_id`, {
    method: 'POST',
    headers: {
      apikey: env('SUPABASE_SERVICE_ROLE_KEY'),
      Authorization: `Bearer ${env('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify(row)
  });
  if (!r.ok) throw new Error(`subscription upsert failed: ${r.status} ${await r.text()}`);
}

async function updateSubscriptionByStripeId(stripeSubscriptionId, patch) {
  const r = await fetch(
    `${supabaseUrl()}/rest/v1/subscriptions?stripe_subscription_id=eq.${encodeURIComponent(stripeSubscriptionId)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: env('SUPABASE_SERVICE_ROLE_KEY'),
        Authorization: `Bearer ${env('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(patch)
    }
  );
  if (!r.ok) throw new Error(`subscription update failed: ${r.status} ${await r.text()}`);
}

module.exports = {
  env, send, readJson, readRawBody, bearerToken,
  getUser, getSubscription, isPremium, upsertSubscription, updateSubscriptionByStripeId
};
