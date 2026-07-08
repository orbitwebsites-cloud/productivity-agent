'use strict';

// GET /api/done — friendly landing page after Stripe checkout (success or cancel).

module.exports = (req, res) => {
  const url = new URL(req.url, 'http://x');
  const success = url.searchParams.get('state') === 'success';
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>ScreenBuddy</title>
<style>
  body { font-family: -apple-system, "Segoe UI", sans-serif; background:#faf7f2; color:#3d3733;
         display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }
  .card { background:#fff; border-radius:20px; padding:44px 52px; text-align:center;
          box-shadow:0 10px 40px rgba(0,0,0,.08); max-width:440px; }
  h1 { margin:0 0 10px; font-size:26px; }
  p { color:#7a726b; line-height:1.5; margin:0; }
  .emoji { font-size:52px; margin-bottom:14px; }
</style></head>
<body><div class="card">
  <div class="emoji">${success ? '🎉' : '🙂'}</div>
  <h1>${success ? "You're Premium!" : 'No worries'}</h1>
  <p>${success
    ? 'Head back to Pesto and hit “Refresh status” — AI answers are unlocked. You can close this tab.'
    : 'Checkout was cancelled. Pesto keeps working free and local — upgrade anytime from the app.'}</p>
</div></body></html>`);
};
