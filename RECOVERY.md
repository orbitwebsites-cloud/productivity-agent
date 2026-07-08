# RECOVERY — ScreenBuddy

**Last updated:** 2026-07-08

## Product model (decided — see SPEC.md §13)
- Free tier = local (tracking, deterministic answers, accountability modes). No account.
- Premium = AI on a **hosted backend** (Vercel + Supabase auth + Stripe). Account + subscription.

## Build status
### ✅ Free local app (v1) — built, running, packaged
- Electron, Mac + Windows. Active-window tracking via OS tools (no native modules).
- **One-button setup:** "Start Pesto" scans the PC's installed apps (registry / /Applications),
  auto-builds Life Pursuits + distractions from `electron/appknowledge.js`. Manual
  "🔍 Scan my PC for apps" re-scan button on the Pursuits page (keeps custom pursuits).
- **Widget:** Pesto orb → glance-card chat. Drag to move, Alt+Space toggle.
- **Desktop app:** Life Pursuits + Privacy Tiers + **Premium** pages, setup gate.
- **Accountability:** Chill / Nudge / Drill / Warden (reversible minimize + ESC countdown),
  mode + distraction limit from tray. Re-label history on pursuit save.
- Storage: local JSONL (`activity.jsonl` in userData). Deterministic Q&A needs no AI/account.

### ✅ Hosted backend (Phase B) — BUILT + DEPLOYED 2026-07-08
- **Live:** `https://screenbuddy-backend.vercel.app` (Vercel project `screenbuddy-backend`,
  account `orbitboyzz-4697`). Source: `backend/` (zero-dep serverless); root `api/*.js` are
  thin shims so Vercel routes them; `.vercelignore` keeps the Electron app out of deploys.
- Endpoints: `POST /api/ask` (premium AI answer), `GET /api/me`, `POST /api/checkout`
  (Stripe Checkout), `POST /api/stripe-webhook`, `GET /api/done`.
- **Supabase:** project `screenbuddy` (`vipextcidorcauhlviig`, us-east-1, free tier).
  `subscriptions` table + RLS applied (migration `create_subscriptions`).
- **Desktop app wired:** `electron/premium.js` (Supabase email auth from main process, token
  refresh, checkout, /api/ask). Provider `backend` is the default; deterministic answers remain
  the offline/signed-out fallback. Premium page = sign in/up, status badge, Upgrade button.

### ⚠️ REMAINING MANUAL STEPS (needs the user's secret keys — never in chat)
In Vercel → `screenbuddy-backend` → Settings → Environment Variables, add (then **Redeploy**):
1. `SUPABASE_SERVICE_ROLE_KEY` — Supabase dashboard → screenbuddy → Settings → API keys.
   (`SUPABASE_URL` is already set.)
2. `ANTHROPIC_API_KEY` — the user's LLM key. (Optional `ANTHROPIC_MODEL`, default claude-sonnet-5.)
3. `STRIPE_SECRET_KEY` — Stripe dashboard → Developers → API keys.
4. `STRIPE_PRICE_ID` — create Product "ScreenBuddy Premium" + recurring price → copy `price_...`.
5. `STRIPE_WEBHOOK_SECRET` — Stripe → Webhooks → add endpoint
   `https://screenbuddy-backend.vercel.app/api/stripe-webhook` with events
   `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
Optional: Supabase → Auth → disable "Confirm email" for frictionless sign-up.

## Files
- Local app: `electron/{main,tracker,activewin,accountability,db,classify,answers,capture,
  appscan,appknowledge,premium,setup,config,preload}.js`, `electron/providers/*`, `renderer/*`
- Backend: `backend/` (+ root `api/` shims, `vercel.json`, `.vercelignore`)
- Old Hermes/Ollama provider path still exists as a power-user option (unused by default).

## Run / build
- Dev: `npm start` · Build exe: `npm run build:win` → `dist\ScreenBuddy Setup 0.1.0.exe`
- Backend redeploy: `npx vercel deploy --prod --yes` from repo root (CLI is authed).
- Test premium flow: app → Premium ✨ → create account → sign in → Upgrade (needs Stripe env).
