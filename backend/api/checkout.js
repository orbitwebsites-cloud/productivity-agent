'use strict';

// POST /api/checkout — create a Stripe Checkout session for the Premium subscription.
// Auth: Supabase access token (Bearer). Returns { url } to open in the browser.

const { env, send, bearerToken, getUser, getSubscription, isPremium } = require('../lib/util');

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

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const base = `${proto}://${host}`;

  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env('STRIPE_SECRET_KEY')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form({
      mode: 'subscription',
      'line_items[0][price]': env('STRIPE_PRICE_ID'),
      'line_items[0][quantity]': '1',
      client_reference_id: user.id,
      customer_email: user.email || '',
      'subscription_data[metadata][user_id]': user.id,
      success_url: `${base}/api/done?state=success`,
      cancel_url: `${base}/api/done?state=cancelled`
    })
  });

  if (!r.ok) {
    const detail = await r.text().catch(() => '');
    console.error('stripe checkout error', r.status, detail.slice(0, 500));
    return send(res, 502, { error: "Couldn't start checkout — try again shortly." });
  }
  const session = await r.json();
  return send(res, 200, { url: session.url });
};
