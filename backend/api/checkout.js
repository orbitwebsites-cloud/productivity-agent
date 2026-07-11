'use strict';

// POST /api/checkout — create a Stripe Checkout session for the Premium subscription.
// Auth: Supabase access token (Bearer). Body: { plan: 'monthly' | 'annual' } (default monthly).
// Returns { url } to open in the browser. Every new subscription starts with a free trial
// (TRIAL_DAYS, default 7) via Stripe's native trial support — isPremium() in lib/util.js
// already treats Stripe's "trialing" status as premium, no other code needed for that part.

const { env, send, readJson, bearerToken, getUser, getSubscription, isPremium } = require('../lib/util');

function form(params) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) p.append(k, v);
  return p.toString();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });

  let user;
  try {
    user = await getUser(bearerToken(req));
  } catch {
    return send(res, 500, { error: 'auth check failed' });
  }
  if (!user) return send(res, 401, { error: 'Sign in first.' });

  const sub = await getSubscription(user.id).catch(() => null);
  if (isPremium(sub)) return send(res, 200, { alreadyPremium: true });

  let body = {};
  try { body = await readJson(req); } catch { /* default to monthly below */ }
  const plan = body.plan === 'annual' ? 'annual' : 'monthly';

  // Resolve config up front so a missing key/price returns a clear message
  // instead of crashing the function (env() throws on a missing required var).
  let secretKey, priceId;
  try {
    secretKey = env('STRIPE_SECRET_KEY');
    priceId = plan === 'annual' ? env('STRIPE_PRICE_ID_ANNUAL', env('STRIPE_PRICE_ID')) : env('STRIPE_PRICE_ID');
  } catch (err) {
    console.error('checkout config error', err.message);
    return send(res, 500, { error: `Payments aren't configured yet (${err.message}).`, code: 'not_configured' });
  }
  const trialDays = Number(env('TRIAL_DAYS', '7'));

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const base = `${proto}://${host}`;

  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form({
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      client_reference_id: user.id,
      customer_email: user.email || '',
      'subscription_data[metadata][user_id]': user.id,
      ...(trialDays > 0 ? { 'subscription_data[trial_period_days]': String(trialDays) } : {}),
      success_url: `${base}/api/done?state=success`,
      cancel_url: `${base}/api/done?state=cancelled`
    })
  });

  if (!r.ok) {
    const detail = await r.text().catch(() => '');
    console.error('stripe checkout error', r.status, detail.slice(0, 500));
    // Surface Stripe's own reason (e.g. "No such price", test/live mismatch,
    // invalid key) so the failure is diagnosable from the app instead of opaque.
    let reason = '';
    try { reason = (JSON.parse(detail).error || {}).message || ''; } catch { /* not JSON */ }
    return send(res, 502, {
      error: reason ? `Stripe couldn't start checkout: ${reason}` : "Couldn't start checkout — try again shortly.",
      code: 'stripe_error'
    });
  }
  const session = await r.json();
  return send(res, 200, { url: session.url });
};
