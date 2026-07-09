'use strict';

// One-shot production setup. Reads secrets from D:\productivity-agent\.env, then:
//   1. Creates the Stripe product "ScreenBuddy Premium" + monthly price (idempotent).
//   2. Creates the Stripe webhook endpoint for the backend (recreates to get a fresh secret).
//   3. Pushes all env vars to the Vercel project (screenbuddy-backend) via the authed CLI.
//   4. Redeploys production.
// Run:  node scripts\finish-setup.js
// Zero dependencies. Secrets never leave this machine except to Stripe/Vercel APIs.

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BACKEND_URL = 'https://screenbuddy-backend.vercel.app';
const WEBHOOK_URL = `${BACKEND_URL}/api/stripe-webhook`;
const PRODUCT_NAME = 'ScreenBuddy Premium';
const WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted'
];

// ---- .env loader ----
function loadEnvFile() {
  const p = path.join(ROOT, '.env');
  if (!fs.existsSync(p)) {
    console.error(`\nNo .env file found at ${p}`);
    console.error('Copy .env.template to .env and paste your keys in first.');
    process.exit(1);
  }
  const out = {};
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

const env = loadEnvFile();
const need = ['STRIPE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'LLM_API_KEY'];
const missing = need.filter((k) => !env[k] || env[k].includes('paste-'));
if (missing.length) {
  console.error(`\n.env is missing: ${missing.join(', ')}`);
  process.exit(1);
}
const priceUsd = Number(env.PREMIUM_PRICE_USD || '4.99');

// ---- Stripe API (form-encoded fetch) ----
async function stripe(method, pathName, params) {
  const opts = {
    method,
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` }
  };
  if (params) {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (Array.isArray(v)) v.forEach((x, i) => p.append(`${k}[${i}]`, x));
      else p.append(k, v);
    }
    opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    opts.body = p.toString();
  }
  const r = await fetch(`https://api.stripe.com/v1/${pathName}`, opts);
  const data = await r.json();
  if (!r.ok) throw new Error(`Stripe ${method} ${pathName}: ${data.error ? data.error.message : r.status}`);
  return data;
}

async function ensureProductAndPrice() {
  const products = await stripe('GET', 'products?active=true&limit=100');
  let product = (products.data || []).find((p) => p.name === PRODUCT_NAME);
  if (product) {
    console.log(`✓ Product exists: ${product.id}`);
  } else {
    product = await stripe('POST', 'products', {
      name: PRODUCT_NAME,
      description: 'AI answers and coaching from Pesto — natural-language insights about your day.'
    });
    console.log(`✓ Created product: ${product.id}`);
  }

  const unitAmount = Math.round(priceUsd * 100);
  const prices = await stripe('GET', `prices?product=${product.id}&active=true&limit=100`);
  let price = (prices.data || []).find(
    (p) => p.recurring && p.recurring.interval === 'month' && p.unit_amount === unitAmount && p.currency === 'usd'
  );
  if (price) {
    console.log(`✓ Price exists: ${price.id} ($${priceUsd}/mo)`);
  } else {
    price = await stripe('POST', 'prices', {
      product: product.id,
      unit_amount: String(unitAmount),
      currency: 'usd',
      'recurring[interval]': 'month'
    });
    console.log(`✓ Created price: ${price.id} ($${priceUsd}/mo)`);
  }
  return price.id;
}

async function ensureWebhook() {
  // The signing secret is only revealed on creation — recreate to get a fresh one.
  const hooks = await stripe('GET', 'webhook_endpoints?limit=100');
  for (const h of hooks.data || []) {
    if (h.url === WEBHOOK_URL) {
      await stripe('DELETE', `webhook_endpoints/${h.id}`);
      console.log(`✓ Removed old webhook ${h.id} (need a fresh secret)`);
    }
  }
  const hook = await stripe('POST', 'webhook_endpoints', {
    url: WEBHOOK_URL,
    enabled_events: WEBHOOK_EVENTS
  });
  console.log(`✓ Created webhook: ${hook.id}`);
  return hook.secret;
}

// ---- Vercel CLI ----
function vercel(args, input) {
  const r = spawnSync('npx', ['--yes', 'vercel', ...args], {
    cwd: ROOT,
    input,
    encoding: 'utf8',
    shell: true
  });
  return r;
}

function pushEnv(name, value) {
  vercel(['env', 'rm', name, 'production', '--yes']); // ok if it didn't exist
  const r = vercel(['env', 'add', name, 'production'], value);
  if (r.status !== 0) {
    const detail = r.error ? r.error.message : (r.stderr || r.stdout || 'unknown error');
    throw new Error(`vercel env add ${name} failed:\n${detail}`);
  }
  console.log(`✓ Vercel env set: ${name}`);
}

(async () => {
  console.log(`\n— Stripe setup (${env.STRIPE_SECRET_KEY.startsWith('sk_live') ? 'LIVE' : 'TEST'} mode) —`);
  const priceId = await ensureProductAndPrice();
  const webhookSecret = await ensureWebhook();

  console.log('\n— Pushing env vars to Vercel —');
  if (env.SUPABASE_URL) pushEnv('SUPABASE_URL', env.SUPABASE_URL);
  pushEnv('SUPABASE_SERVICE_ROLE_KEY', env.SUPABASE_SERVICE_ROLE_KEY);
  pushEnv('LLM_API_KEY', env.LLM_API_KEY);
  if (env.LLM_BASE_URL) pushEnv('LLM_BASE_URL', env.LLM_BASE_URL);
  if (env.LLM_MODEL) pushEnv('LLM_MODEL', env.LLM_MODEL);
  pushEnv('STRIPE_SECRET_KEY', env.STRIPE_SECRET_KEY);
  pushEnv('STRIPE_PRICE_ID', priceId);
  pushEnv('STRIPE_WEBHOOK_SECRET', webhookSecret);

  console.log('\n— Redeploying production —');
  const d = vercel(['deploy', '--prod', '--yes']);
  if (d.status !== 0) throw new Error(`deploy failed:\n${d.stderr || d.stdout}`);
  const m = (d.stdout + d.stderr).match(/https:\/\/[^\s]*vercel\.app/);
  console.log(`✓ Deployed${m ? ': ' + m[0] : ''}`);

  console.log(`\nALL DONE ✅  Premium is live at ${BACKEND_URL}`);
  console.log('Test it: open ScreenBuddy → Premium ✨ → create account → Upgrade.');
})().catch((e) => { console.error(`\nFAILED: ${e.message}`); process.exit(1); });
