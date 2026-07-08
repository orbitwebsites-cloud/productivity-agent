# ScreenBuddy — UI Design Generation Prompt

> Paste this into your design model (Manus / GPT / Figma AI / image model).
> It is written to produce **3 distinct full variations** of the app's key screens.

---

## THE PROMPT (copy everything below)

You are a senior product designer. Design the desktop UI for **ScreenBuddy**, a cute
macOS productivity companion. Produce **3 complete, visually distinct variations** of the
screen set described below. All variations must share the same brand DNA but explore
different layout, density, and personality (see "Variation directions").

### Product in one line
A friendly desktop buddy named **Pesto** that quietly tracks what you work on, answers
questions about your day ("what was I working on yesterday?"), tracks your life goals, and
— if you let it — pushes you to stay focused.

### Brand & visual language (shared across ALL variations)
- **Aesthetic:** warm, soft, "Claude-style." Cream/off-white backgrounds, **frosted
  glassmorphism** panels, generous whitespace, large rounded corners (18–24px), soft shadows.
- **Primary color:** warm coral / terracotta (~#C96442 to #E0895F). **Accent:** muted sage
  green and warm amber, used sparingly. Text: warm near-black (#2F2B25) and muted taupe.
- **Mascot — Pesto:** a **3D clay-style coral starburst** character with a cute face and a
  little cream headband reading "Pesto." Expressive. Soft studio lighting, matte clay texture.
- **Platform:** native **macOS** app — show the traffic-light window controls, menu bar, and a
  Sonoma-style desktop wallpaper behind the frosted window.
- **Tone:** encouraging, playful, trustworthy. Never clinical, never dark/techy.

### Screens to design (each screen, in all 3 variations)

1. **Main Dashboard** — three regions:
   - Left: sidebar nav (Chat, Life Pursuits, Focus Timer, Breaks, Insights, Settings) + a Pesto
     avatar card at the bottom.
   - Center: a chat conversation with Pesto (friendly greeting + user reply + Pesto encouragement),
     and a message input bar "Message Pesto…".
   - Right: **"Life Pursuits"** panel — the user's goals as cards (e.g. *Tech Job — 75% — 3h 12m
     today*, *Learn to Cook — 50% — 1h 45m*, *Fitness — 60% — 50m*), each with an icon, subtitle,
     progress bar, and time-today. Include an "+ Add Pursuit" button and a small encouraging footer.

2. **Privacy Tiers (Settings)** — a settings screen with a left settings-nav and a per-app list.
   Each app row (Chrome, VS Code, Slack, Notion, Figma) has a **segmented control with three
   mutually-exclusive options: Full / Private / Off.** Include a header row explaining each tier
   with these EXACT definitions (this wording is critical for user trust):
   - **Full** — "Screenshots + AI classification."
   - **Private** — "Metadata only: app name + window title. No pixels are ever captured."
   - **Off** — "Completely invisible to ScreenBuddy."
   Add a reassuring "Privacy First — you're in control of what ScreenBuddy can see" note.

3. **Focus / Warden Mode overlay** — a full-screen focus overlay shown OVER a dimmed, coral-tinted
   YouTube page. A centered frosted card reads **"Hiding YouTube in 10s — hit ESC to stay."** with
   a big countdown number. A drill-sergeant version of Pesto (olive campaign hat + whistle, stern
   pointing pose) appears in the corner. Top bar: "ScreenBuddy is guarding your focus." The vibe is
   firm but not scary — this action is reversible.

4. **Onboarding — "Set up your Life Pursuits"** — a warm welcome screen where the user declares
   what their work/goals are (e.g. preset chips: Student, Developer, Streamer, Creator, + free text),
   with Pesto waving. Emphasize: "Tell Pesto what matters to you so it knows what counts as
   productive." One clean step, big friendly buttons, zero jargon.

5. **Pesto state sheet** — the mascot in 4 emotional states as separate clay renders:
   🙂 idle, 🤔 thinking (hand on chin, thought bubble), 🪖 drill-sergeant / calling-you-out (hat,
   whistle, pointing, stern), 🎉 celebrating (arms up, confetti). Consistent character across states.

### Hard requirements (all variations)
- **Zero-terminal ethos** — this app is for non-technical users (imagine a nursing student). Every
  control is a friendly GUI toggle/button. Nothing looks technical or developer-y.
- Keep the **exact privacy tier wording** above.
- Use "**Life Pursuits**", not "Goals" or "Tasks".
- Coral + cream + glass, consistently.

### Variation directions (make the 3 genuinely different)
- **Variation A — "Airy & minimal":** maximum whitespace, fewer elements per screen, large soft
  type, calm. Pesto small and subtle. For users who want a clean, quiet companion.
- **Variation B — "Warm & data-rich":** more information density — richer Life Pursuit cards with
  mini charts/streaks, insights surfaced, cozier warmer palette. For users who love their stats.
- **Variation C — "Character-forward & playful":** Pesto is bigger and more present, more
  personality in copy and micro-illustrations, bouncier shapes, more coral. For users who want the
  buddy to feel alive.

### Output
- Deliver each screen at high resolution, clearly **labeled by screen name and variation letter**
  (e.g. "Dashboard — Variation B").
- Keep all 5 screens internally consistent within each variation.
- Present the 3 variations side-by-side or grouped so they can be compared.

---

## Notes for whoever runs this
- If the model can only do one image at a time, run it 3× (once per variation letter) using the
  same shared brand section + one Variation direction each.
- After you pick a winning variation, we lock it into `SPEC.md` §9 and I start building v1 against it.
