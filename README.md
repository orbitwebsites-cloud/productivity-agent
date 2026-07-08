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
Pesto uses Hermes as the default local AI provider. First-run setup installs Hermes and starts
its headless service when possible. If Hermes is installed but no inference provider/model is
configured, Pesto falls back to deterministic local activity answers.

Premium hosted AI still exists as an optional backend path (`backend/`, live on Vercel) for
signed-in users with Stripe subscriptions. See `backend/README.md` for server setup.

## What's intentionally NOT here yet
Screenshots/AI vision, voice, cloud sync of activity data. See `SPEC.md` for the full plan
and `RECOVERY.md` for build state.

## Build installers
```bash
npm run build:mac    # .dmg
npm run build:win    # portable Windows .exe in dist/
```
