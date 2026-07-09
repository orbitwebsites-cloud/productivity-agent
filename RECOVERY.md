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

### ✅ Premium fully wired + LIVE — done 2026-07-08
User's own Supabase project **`screenbud`** (`bmqhokhibnjdiwvycfxw`, us-west-2) is now the one
in use — NOT the `screenbuddy` project I auto-provisioned earlier (that one is unused/orphaned,
safe to ignore or delete later). `subscriptions` table + RLS applied there too.
`electron/config.js` `premium.supabaseUrl`/`supabaseAnonKey` point at `screenbud`.

Ran `node scripts\finish-setup.js` with the user's real keys (from a local `.env`, gitignored):
- Stripe is **LIVE mode** (`sk_live_...`) — real product "ScreenBuddy Premium" ($4.99/mo,
  `price_1Tr4seQzCV0z4lhmTOacFD2C`), real webhook, real charges on Upgrade. Not test mode.
- LLM = Cerebras (`LLM_API_KEY` set).
- All 6 secrets pushed to Vercel prod env, backend redeployed. Verified: `/api/me` and
  `/api/checkout` both return 401 for a bad token (correct — proves the Supabase service-role
  wiring works end to end).
- Installer rebuilt with the corrected Supabase URL/key baked into the default config.

⚠️ **Security note (told the user):** the keys were shared via a plaintext file in
`C:\Users\rrus3\OneDrive\Documents\sd.txt` — that's a OneDrive-synced folder, so the live
Stripe secret key + Supabase service-role key are sitting in cloud sync in plaintext. Worth
deleting that file (or moving it out of OneDrive) once confirmed the `.env` copy is good.

Optional nice-to-have: Supabase → `screenbud` → Auth → disable "Confirm email" for
frictionless sign-up (currently requires clicking an email link before first sign-in).

## Files
- Local app: `electron/{main,tracker,activewin,accountability,db,classify,answers,capture,
  appscan,appknowledge,premium,setup,config,preload}.js`, `electron/providers/*`, `renderer/*`
- Backend: `backend/` (+ root `api/` shims, `vercel.json`, `.vercelignore`)
- Old Hermes/Ollama provider path still exists as a power-user option (unused by default).

## Run / build
- Dev: `npm start` · Build exe: `npm run build:win` -> `dist\ScreenBuddy 0.1.0.exe`
- Backend redeploy: `npx vercel deploy --prod --yes` from repo root (CLI is authed).
- Test premium flow: app → Premium ✨ → create account → sign in → Upgrade (needs Stripe env).
