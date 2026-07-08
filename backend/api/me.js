'use strict';

// GET /api/me — who am I + premium status. Auth: Supabase access token (Bearer).
// The desktop app polls this to decide whether to show "Premium active".

const { send, bearerToken, getUser, getSubscription, isPremium } = require('../lib/util');

module.exports = async (req, res) => {
  let user;
  try {
    user = await getUser(bearerToken(req));
  } catch {
    return send(res, 500, { error: 'auth check failed' });
  }
  if (!user) return send(res, 401, { error: 'not signed in' });

  const sub = await getSubscription(user.id).catch(() => null);
  return send(res, 200, {
    email: user.email,
    userId: user.id,
    premium: isPremium(sub),
    status: sub ? sub.status : 'none',
    currentPeriodEnd: sub ? sub.current_period_end : null
  });
};
