# Build brief: ScreenBuddy "Liquid Glass" prototype

Reference package for building an isolated visual prototype of two ScreenBuddy
screens — **Life Pursuits** and **Jarvis Mode** — reskinned in a "Modern
Liquid Glass" style, while preserving ScreenBuddy's existing coral / cream /
sage / Pesto identity.

Scope: **isolated JavaScript prototype only.** Do not touch `renderer/`,
`electron/`, or backend code — this is a standalone HTML/CSS/JS mockup, not a
production replacement.

## 1. Brand tokens (must preserve)

```css
--coral:        #C96442;   /* primary accent */
--coral-light:  #E0895F;
--coral-dark:   #9F3D25;
--coral-glow:   rgba(201, 100, 66, 0.28);

--ink:          #2F2B25;   /* primary text */
--muted:        #8A8377;   /* secondary text */
--faint:        #B7B0A4;   /* tertiary text */

--paper:        #FAF7F2;   /* base cream surface */
--surface:      #FFFFFF;

--sage:         #7F9C8C;   /* secondary accent — success/streaks */
--amber:        #D8A84E;   /* warnings */
--blue:         #2D596F;   /* rarely used tertiary */

font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

Full existing token file for more context: `renderer/design-tokens.css`
(already has `.glass`, `.glass-card`, `.glass-strong` utility classes from a
previous "Warm Glass" pass — useful prior art, not to be copied verbatim).

Pesto mascot PNGs live at `assets/pesto/screenbuddy_mascot_idle.png` and
`..._celebrating.png` (~3-4MB each — too heavy to inline; either reference by
path or draw a simple circular/blob glyph stand-in, which is what this
prototype does).

## 2. Three directions considered

A comparison artifact was built showing three ways to express "liquid glass"
on these two screens. Screenshots aren't attached here, but the three
concepts, if you want to explore an alternative to what's built:

- **A · Daylight Frost** (built — see below): light, airy, sunlit glass on a
  cream/blush gradient mesh. Frosted panels (`blur(26-32px) saturate(160%)`
  over `rgba(255,255,255,.5-.7)`), a thin specular highlight line across the
  top edge of every card, pill-shaped active-nav highlight. Closest to
  Apple's restrained "Liquid Glass" reference.
- **B · Coral Melt**: dark canvas (`#201009`-ish), saturated glowing glass
  (`rgba(255,255,255,.07-.14)` on dark), slow-drifting blurred coral/sage
  radial-gradient "blobs" behind the panels for a literally liquid feel.
  Cream text (`#FBF1E6`), glowing coral edges.
- **C · Studio Frost**: light neutral with a faint hairline grid background
  (`repeating-linear-gradient` at ~4% opacity), glass used sparingly and
  precisely rather than decoratively, monospace numerics, sparkline +
  streak-chip stat elements. A denser, power-user "pro tool" feel.

**A · Daylight Frost was picked to build out** (see rationale in this
folder's `README.md`) — most versatile, closest to the current identity,
lowest risk. Swap the CSS custom properties to try B or C instead; the
component structure (`.pcard`, `.agentbox`, `.guardcard`, etc.) is shared.

## 3. What's already built (use as reference or starting point)

This folder (`prototype/liquid-glass/`) contains a working, browser-tested
Direction A prototype:

- `index.html` — page shell: sidebar nav (Life Pursuits / Privacy Tiers
  [inert] / Jarvis Mode / Premium [inert]) + two real content pages.
- `style.css` — full Daylight Frost token set and component styles.
- `app.js` — real interactivity: add/rename/remove pursuits and keywords,
  mocked app-scan that populates a recent-apps chip row (clicking a chip adds
  it as a keyword to the selected pursuit), and a working Jarvis "Warden"
  countdown (Simulate drift → countdown drains on a timer → Give me 5 min /
  Hide it now resolves it; a "drifts caught" counter persists via
  `localStorage`).

Open `index.html` directly in a browser, no build step needed.

## 4. Real screen content (source of truth — don't invent new copy)

Pulled directly from `renderer/app.html` and `renderer/warden.html`.

### Life Pursuits

- H1: "Life Pursuits"
- Lead: "Tell Pesto what counts as **your** work. Time is credited to a
  pursuit when the app or window title contains any of its keywords."
- Button: "🔍 Scan my PC for apps"
- Sample pursuits (name → keywords):
  - Learn to Cook → cooking, recipe, youtube, kitchen
  - Tech Job → code, github, claude, vscode, terminal
  - Fitness → workout, gym, run, health
- "+ Add a pursuit" (dashed ghost button)
- "Apps you've used recently" section, sample chips: Chrome, VS Code, Slack,
  Notion, Figma, Terminal, Spotify
- Save button: "Save pursuits"

### Jarvis Mode

- H1: "Jarvis Mode"
- Lead: "Pesto can actively guard your current pursuit. If you drift for too
  long, he shows a countdown, then safely minimizes the distraction and
  tries to bring your work back."
- Accountability mode `<select>`: Chill — just track / Nudge — gentle
  reminders / Drill — stronger reminders / Warden — hide hard distractions /
  Jarvis — guard active pursuit
- Active pursuit `<select>` (populated from Life Pursuits)
- Drift limit (minutes) number input, default 25 (range 1-120)
- Countdown (seconds) number input, default 10 (range 3-60)
- Hint: "Jarvis never closes apps. He only minimizes the current window, so
  the action is reversible."
- Save button: "Save Jarvis mode" / ghost button: "Clear active pursuit"

### Pesto Warden guard card (the in-action "focus screen" moment, from
`renderer/warden.html`)

- Tag: "Pesto Warden"
- Goal line: "Guarding · {pursuit name}"
- Head: "This looks like drift."
- Detail: "I can hide it safely. Nothing gets closed."
- Large countdown number (seconds remaining) + progress bar draining
- Hint: "Press ESC or ask for more time to cancel."
- Actions: "Give me 5 min" (ghost) / "Hide it now" (primary)

## 5. Layout shape (unchanged across all three directions)

- Left sidebar, ~250px: Pesto logo/wordmark, nav list (4 items), footer note.
  Active nav item gets the accent treatment.
- Main content area: kicker label → H1 → lead paragraph → primary action →
  content (card list for Pursuits; two-column config + live guard-card grid
  for Jarvis).
- Jarvis Mode specifically benefits from a **two-column layout**: config
  form on the left, a live/sticky "guard card" on the right showing the
  Warden countdown in action — this is what makes "Jarvis Mode" read as a
  focus *screen* rather than just a settings form.
