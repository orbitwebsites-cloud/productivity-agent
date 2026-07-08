'use strict';

// POST /api/stripe-webhook — Stripe events keep the subscriptions table in sync.
// Signature verified by hand (HMAC-SHA256 over `${timestamp}.${rawBody}`) — no SDK needed.
// Events handled:
//   checkout.session.completed              → mark user active
//   customer.subscription.updated / deleted → sync status + period end

const crypto = require('crypto');
const {
  env, send, readRawBody, upsertSubscription, updateSubscriptionByStripeId
} = require('../lib/util');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });

  const raw = await readRawBody(req);
  const sigHeader = req.headers['stripe-signature'] || '';
  const parts = Object.fromEntries(
    sigHeader.split(',').map((kv) => kv.split('=').map((s) => s.trim())).filter((a) => a.length === 2)
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return send(res, 400, { error: 'missing signature' });

  const expected = crypto
    .createHmac('sha256', env('STRIPE_WEBHOOK_SECRET'))
    .update(`${timestamp}.${raw.toString('utf8')}`)
    .digest('hex');
  const ok = signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
  if (!ok) return send(res, 400, { error: 'bad signature' });
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 600) {
    return send(res, 400, { error: 'stale event' });
  }

  let event;
  try { event = JSON.parse(raw.toString('utf8')); } catch { return send(res, 400, { error: 'bad JSON' }); }
  const obj = event.data && event.data.object;

  try {
    if (event.type === 'checkout.session.completed' && obj && obj.client_reference_id) {
      await upsertSubscription({
        user_id: obj.client_reference_id,
        status: 'active',
        stripe_customer_id: obj.customer || null,
        stripe_subscription_id: obj.subscription || null,
        updated_at: new Date().toISOString()
      });
    } else if (
      (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') &&
      obj && obj.id
    ) {
      const status = event.type === 'customer.subscription.deleted' ? 'canceled' : obj.status;
      const periodEnd = obj.current_period_end
        ? new Date(obj.current_period_end * 1000).toISOString()
        : null;
      const patch = { status, current_period_end: periodEnd, updated_at: new Date().toISOString() };
      const userId = obj.metadata && obj.metadata.user_id;
      if (userId) {
        await upsertSubscription({
          user_id: userId,
          stripe_subscription_id: obj.id,
          stripe_customer_id: typeof obj.customer === 'string' ? obj.customer : null,
          ...patch
        });
      } else {
        await updateSubscriptionByStripeId(obj.id, patch);
      }
    }
  } catch (e) {
    console.error('webhook handling failed', event.type, e.message);
    return send(res, 500, { error: 'handler failed' }); // Stripe will retry
  }

  return send(res, 200, { received: true });
};

module.exports.config = { api: { bodyParser: false } };
