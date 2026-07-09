'use strict';

// GET / — friendly landing page. This backend only serves the ScreenBuddy desktop
// app's Premium API; there's nothing to browse, but a bare 404 looks broken.

module.exports = (req, res) => {
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
  <div class="emoji">🍃</div>
  <h1>ScreenBuddy backend</h1>
  <p>This is Pesto's Premium API — there's nothing to see here in a browser.
  Open the ScreenBuddy desktop app to use it.</p>
</div></body></html>`);
};
