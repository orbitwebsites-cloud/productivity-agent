# Liquid Glass prototype (Direction A — "Daylight Frost")

Isolated, standalone visual prototype of two ScreenBuddy screens re-skinned in a
"Liquid Glass" style. It is plain HTML/CSS/JS with no build step and no
dependency on `renderer/`, `electron/`, or the backend — nothing here replaces
production code.

## Run it

Open `index.html` directly in a browser, or serve the folder:

```
cd prototype/liquid-glass
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## What's in it

- **Life Pursuits** — add/rename/remove pursuits, add/remove keywords, a
  mocked "Scan my PC for apps" that populates a recent-apps chip row, and
  clicking a chip adds it as a keyword to the selected pursuit.
- **Jarvis Mode** — the accountability-mode config form plus a live "Pesto
  Warden" guard card. Click **Simulate drift** to run the real countdown
  (drains on a timer, driven by the "Countdown (seconds)" field), then
  **Give me 5 min** or **Hide it now** to resolve it. A "drifts caught"
  counter persists across simulations.
- Privacy Tiers / Premium nav items are present for layout fidelity but are
  intentionally inert (a toast explains they're out of scope for this
  prototype).

State is kept in `localStorage` only, scoped to this page.

## Why "Daylight Frost"

Three directions were sketched for this — Daylight Frost (light, airy,
Apple-style restrained glass), Coral Melt (dark, saturated, literally liquid),
and Studio Frost (light, dense, hairline-grid data tool). Daylight Frost was
picked as the one to build out: it's the most versatile for the rest of the
app to grow into, stays closest to the current cream/coral/sage identity, and
is the safest bet given no direct sign-off was available in this session —
swap the token values in `style.css` to explore Coral Melt or Studio Frost
instead.
