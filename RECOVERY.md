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
- Local chat is now a real general assistant, not just activity Q&A: `answers.js` tries the AI
  for every question (not only activity-shaped ones), and the local `CHAT_SYSTEM_PROMPT`
  (`electron/providers/prompts.js`) explicitly covers "help with whatever else they ask." The
  premium backend (`backend/api/ask.js`) is untouched — still scoped to activity coaching by
  design, a general question there just degrades to an honest "no data for that."
- **Copy-paste-loop nudge** (`electron/loopnudge.js`): watches tracker samples for someone
  bouncing between an AI-chat tab (ChatGPT/Claude/Gemini/Copilot) and a code editor over and
  over. After ~3 round trips it fires a notification offering to draft it directly; clicking
  opens the panel and asks Pesto to take over via the same `buddyAsk()` pipeline above. Skipped
  mode `chill`. This does *not* reach into the editor and type for the user — that would need
  real editor integration (a VS Code extension or similar), out of scope here; it opens a chat
  the AI can actually answer in.
- **Browser autofill (`extension/` + `electron/autofill-bridge.js`)**: opt-in, off by default.
  A loopback-only HTTP+WS bridge (127.0.0.1:8643) plus a WebExtension (MV3, `manifest.json` for
  Chrome/Edge/Chromium — Kimi's browser included, most are Chromium-based — and
  `manifest.firefox.json` for Firefox, only the background-script manifest key differs) that
  fills form fields on the active tab from a profile saved in Settings > Jarvis Mode > Browser
  Autofill. **Never auto-submits** — highlights filled fields + shows a review banner, the human
  clicks Submit. Triggered via the extension popup (always works) or WhatsApp `!autofill`
  (best-effort — MV3 background pages suspend when idle in both browsers). Verified end-to-end
  in this session with Playwright against the pre-installed headless Chromium: loaded the
  unpacked extension, pushed a fill over the WS bridge, confirmed 6/6 fields filled correctly
  and the test form's submit handler never fired. Not verified in a real desktop browser or in
  Firefox specifically — do that before relying on it.
- **General browser-task agent** (`electron/browser-agent.js`, `!browser <instruction>` on
  WhatsApp): a bounded (max 6 steps) snapshot → AI-decides-next-action → act loop, built on the
  same bridge/extension as autofill. `extension/content.js`'s `agentSnapshot` lists visible
  interactive elements on the active tab; `agentAct` executes exactly one click/type/navigate,
  blocking (not just discouraging) anything that reads as submit/buy/pay/subscribe/delete/
  confirm-order — same non-negotiable boundary as autofill, enforced in the content script
  itself so it holds regardless of what the model decides. Local engine only
  (`providers.rawChat` in `electron/providers/index.js` throws a clear error on the `backend`
  provider — the premium backend's `/api/ask` has its own fixed narrower prompt by design, not
  meant to run arbitrary structured prompts). Verified end-to-end this session with Playwright:
  real snapshot → decide → act loop completed a genuine 2-step task (open FAQ tab, report the
  refund policy text) using the real prompt-building/JSON-parsing code (model calls stubbed,
  since no live Hermes/LLM in this sandbox); separately confirmed the denylist blocks a
  "Buy Now" and a "Submit Application" button both directly and through the full task loop
  ("buy this for me" → refused, nothing clicked). Caught and fixed a real bug in this process:
  the AI-facing decision schema uses `"action"` as the verb field name, the extension's
  executor used `"type"` — every action was silently failing closed until `browser-agent.js`
  translated between the two. **Not yet run against a real Hermes/local model's actual output**
  (only the prompt/parse/act plumbing was verified, not real model judgment) — try it for real
  before trusting it unsupervised.
- **Pricing changed** (user decision, 2026-07-09): $14.99/mo or $9.99/mo billed annually
  ($119.88/yr), both starting with a **7-day free trial** — hard paywall (no AI) once it ends,
  2 options only, no third tier. `backend/api/checkout.js` takes `{ plan: 'monthly'|'annual' }`
  and adds `subscription_data[trial_period_days]`; Stripe's native "trialing" status already
  counted as premium in `isPremium()` (`backend/lib/util.js`), so no other backend change was
  needed for the trial itself. `scripts/finish-setup.js` now provisions **both** prices under
  the same "ScreenBuddy Premium" product and pushes `STRIPE_PRICE_ID_ANNUAL` + `TRIAL_DAYS` to
  Vercel — **it does not touch the existing live $4.99/mo price** (Stripe prices are immutable
  once created; old one is left alone, unreferenced once `STRIPE_PRICE_ID` is repointed).
  **I did not run this against live Stripe** — no secret key in this environment, and it
  shouldn't be pasted into chat either. To go live: `node scripts/finish-setup.js` locally with
  your real `.env`, same as the original setup.

## Run / build
- Dev: `npm start` · Build exe: `npm run build:win` -> `dist\ScreenBuddy 0.1.0.exe`
- Backend redeploy: `npx vercel deploy --prod --yes` from repo root (CLI is authed).
- Test premium flow: app → Premium ✨ → create account → sign in → pick a plan (needs Stripe env).
