# ScreenBuddy — Floating Icon + Chat Menu — Design Prompt

> Paste into your design model (Manus / GPT / image model).
> Goal: design the **small clickable Pesto icon** that floats on the desktop and the
> **chat menu that opens when you click it**. Produce **3 distinct variations**.

---

## THE PROMPT (copy everything below)

You are a senior product designer. Design the desktop "floating buddy" experience for
**ScreenBuddy**. The buddy is a small character named **Pesto** that sits in the corner of the
user's screen as a **tiny clickable icon**; clicking it opens a **compact chat menu**. Produce
**3 complete, visually distinct variations** of BOTH states (icon + open chat menu).

### The character (already designed — use as-is)
Pesto is a **3D clay-style coral starburst** with a cute face, in 4 emotional states:
🙂 idle, 🤔 thinking, 🪖 drill-sergeant (stern, hat + whistle), 🎉 celebrating. Use the **idle**
state for the resting icon; show the others where noted.

### Two states to design (for each of the 3 variations)

**STATE 1 — The resting icon (collapsed)**
- A small floating widget sitting in the bottom-right corner of a macOS/Windows desktop
  (show it over a real desktop wallpaper so scale is clear).
- It is basically just **Pesto's clay icon**, ~56–72px, with a soft drop shadow so it reads as
  floating above the screen. Optional: a tiny status dot or subtle glow.
- It must look **clickable and friendly**, not like a system tray blob. No window chrome, no
  border box — just the character floating.
- Show a subtle hover/active hint (e.g. slight lift or ring).

**STATE 2 — The open chat menu (expanded)**
- Clicking the icon opens a **compact chat panel** anchored to the icon (pops up from the
  corner). Frosted-glass, Claude-warm aesthetic.
- Contents: Pesto's face + name at top, a short greeting message bubble, 2–3 **quick-ask chips**
  ("yesterday?", "today?", "this week?"), a small "Today by pursuit" mini-readout, and a text
  input "Ask Pesto anything…".
- Keep it **small and glanceable** — this is a popover, not a full app window.

### Brand & visual language (shared across ALL variations)
- Warm, soft, **Claude-style**: cream/off-white, **frosted glassmorphism**, big rounded corners,
  soft shadows, generous whitespace.
- Primary color coral/terracotta (~#C96442–#E0895F); text warm near-black (#2F2B25); muted taupe.
- Clay-render Pesto, matte texture, soft studio lighting. Playful, trustworthy, never techy.

### Hard requirements
- The collapsed state is JUST the floating Pesto icon — clearly a character you tap, not a button.
- The expanded chat menu must feel like it **belongs to** the icon (anchored/popping from it).
- Non-technical friendly. Zero jargon, zero settings visible in this popover.

### Variation directions (make the 3 genuinely different)
- **Variation A — "Minimal bubble":** icon is tiny and clean; the chat menu is a slim rounded
  bubble popover, mostly the input + chips, very little chrome. Calm and unobtrusive.
- **Variation B — "Glance card":** icon has a subtle status ring; the chat menu is a small
  frosted card that also surfaces today's pursuits with mini progress bars. For users who want a
  quick dashboard-in-a-popover.
- **Variation C — "Character-forward speech bubble":** Pesto is bigger and more expressive; the
  chat menu looks like a speech bubble literally coming out of Pesto, with more personality and
  a peek of the drill-sergeant/celebrating states. Fun and alive.

### Output
- For each of the 3 variations, show **both** the collapsed icon and the expanded chat menu,
  ideally side by side, labeled (e.g. "Variation B — icon" and "Variation B — chat open").
- Show them over a desktop so the floating scale is obvious.
- Keep each variation internally consistent.

---

## Notes for whoever runs this
- If the model does one image at a time: run 3× (shared brand + one variation direction each),
  and ask for the collapsed + expanded state in each render.
- After you pick a winner, tell me and I'll build that icon→chat interaction into the app,
  then rebuild the `.exe`.
