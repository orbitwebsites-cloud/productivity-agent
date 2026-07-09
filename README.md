# ScreenBuddy (Pesto) — v1

A cute desktop buddy that tracks what you work on (metadata only - active app +
window title, **no screenshots** in v1), answers questions like *"what was I working on
yesterday?"*, and uses Jarvis Mode to guard your active pursuit.

This is the **thin end-to-end slice**: real tracking -> local store -> Pesto answers real
questions -> Warden/Jarvis can safely minimize distractions. No terminal for end users.

## Run it (developer)

> Requires Node.js 18+. First run needs `npm install` (installs Electron + `get-windows`).

```bash
npm install
npm start
```

- **macOS:** grant **Screen Recording** and **Accessibility** when prompted — required to read
  window titles. (App names work without it; titles need the permission.)
- **Windows:** first run opens the setup screen. Pesto can install/start Hermes and scan local apps from the GUI.

Summon / hide the buddy anytime with **Alt+Space**. It sits in the bottom-right corner.

## Try it
1. Leave it running and switch between a few apps for 5–10 minutes.
2. Click a quick chip or type: *"how productive was I today?"* / *"what was I working on?"*
3. The answer reflects your real activity, grouped by your **Life Pursuits**.

## Configure
Everything has a GUI: the desktop app window (⚙ from the widget) has **Life Pursuits**,
**Privacy Tiers**, **Jarvis Mode**, and **Premium** pages, plus a one-button "Scan my PC for apps" that builds
pursuits automatically. Raw settings live in `screenbuddy-config.json` in Electron's userData dir:
- **macOS:** `~/Library/Application Support/screenbuddy/`
- **Windows:** `%APPDATA%\screenbuddy\`

Edit `pursuits` (your goals + keywords), `distractions`, and per-app `privacyTiers`
(`full` / `private` / `off`). Activity is stored in `activity.jsonl` in the same folder.

## AI Answers
This is a **hybrid, decided architecture** (closed out on the `hermes-core-engine-decision` branch):

- **Free tier — Hermes (local, no account).** First-run setup installs Hermes Agent and starts
  its headless service (`hermes serve --port 8642`) in the background — no terminal, the app
  drives it. This is the default `provider` for every fresh install. If Hermes isn't installed/
  running or no model is configured, Pesto falls back to deterministic local activity answers,
  so the widget always answers something.
- **Premium — hosted backend (account + Stripe).** Signing in and subscribing flips `provider`
  to `backend` (see `electron/premium.js`): the app calls our Vercel API (`backend/`, see
  `backend/README.md`) instead of the local Hermes gateway. Only tiny text summaries are ever
  sent, never screenshots.

Hermes isn't a stopgap here — it's the load-bearing free-tier engine, which is why the Electron
app installs and manages it directly rather than requiring users to touch a CLI.

## What's intentionally NOT here yet
Screenshots/AI vision, voice, cloud sync of activity data. See `SPEC.md` for the full plan
and `RECOVERY.md` for build state.

## Build installers
```bash
npm run build:mac    # .dmg
npm run build:win    # portable Windows .exe in dist/
```
