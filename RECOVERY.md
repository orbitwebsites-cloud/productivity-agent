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
  refresh, checkout, /api/ask). `provider` starts as `hermes` on every fresh install (free tier,
  no account — see `electron/config.js` DEFAULTS); `electron/premium.js` flips it to `backend`
  only once the user signs in **and** subscribes. Deterministic answers remain the offline/
  signed-out/Hermes-unavailable fallback either way. Premium page = sign in/up, status badge,
  Upgrade button.
- **2026-07-09 — Hermes-core-engine decision closed:** reopened the "should Hermes be the core
  engine" question and rejected a rewrite — the hosted backend is live and charging real Stripe
  subscriptions, ripping it out for a CLI-dependent engine buys nothing the existing hybrid
  doesn't already give. Instead found and fixed a real bug: `electron/setup.js` was starting the
  Hermes gateway on port `9119` while `config.js`/the Hermes `.env` both point the app at `8642`,
  so free-tier AI answers were silently falling back to the slower `hermes -z` CLI path every
  time. Also bumped `hermes.js`'s HTTP timeout from 2.5s → 25s (was discarding valid slow local
  responses). `README.md`/`SPEC.md` §13 reconciled to describe the real hybrid instead of
  contradicting it.

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
- Hermes is the free-tier default (not a legacy/unused path — see 2026-07-09 note above); Ollama
  and generic OpenAI-compatible providers remain manual power-user options in Settings.
- WhatsApp Jarvis remote-agent: `electron/jarvis-whatsapp.js`, wired via IPC
  (`buddy:jarvisWhatsapp*`) + Settings > Jarvis Mode > "WhatsApp Remote (beta)". Off by default.
  Shares the exact same `buddyAsk()` brain as the in-app chat panel (main.js), plus scoped
  `!git status` / `!git push` dev-ops commands (spawn with argv arrays, never shell strings).
  Only ever acts on `message.fromMe` — i.e. messages sent from the phone that scanned the
  pairing QR — and refuses (doesn't attempt) requests to auto-complete courses/quizzes or
  blind-submit forms with personal data.
  **Deliberately NOT wired into `build.files`/the installer yet:** `npm install` pulled in
  `whatsapp-web.js` → `puppeteer`, which downloaded **~626MB of bundled Chromium** to
  `~/.cache/puppeteer`. Bundling that into the NSIS installer would roughly triple its size, and
  I have no Windows/Mac box here to verify the packaged (asar) build actually launches Puppeteer
  correctly or that QR pairing works end-to-end with a real phone. Works today via `npm start`
  (dev). Before shipping it in a real build: test pairing + a round-trip command on a real
  machine, then add the needed `node_modules/{whatsapp-web.js,puppeteer,puppeteer-core,...}`
  paths to `package.json`'s `build.files`.
- Also fixed while working on the above: `electron/setup.js` hardcoded `hermes serve --port 9119`
  while `config.js`/the Hermes `.env` point at `8642` — free-tier Hermes answers were silently
  falling back to the slow CLI path every time. And `hermes.js`'s HTTP timeout was 2.5s, too
  short for genuine local inference — bumped to 25s.

## Run / build
- Dev: `npm start` · Build exe: `npm run build:win` -> `dist\ScreenBuddy 0.1.0.exe`
- Backend redeploy: `npx vercel deploy --prod --yes` from repo root (CLI is authed).
- Test premium flow: app → Premium ✨ → create account → sign in → Upgrade (needs Stripe env).
