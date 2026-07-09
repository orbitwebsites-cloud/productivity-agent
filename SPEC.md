# ScreenBuddy — Product Spec (v1 draft)

> A cute little guy who lives in the corner of your screen, remembers everything you did,
> and — if you let him — pushes you to actually do your work.

**Status:** planning / spec only. No code yet.
**Last updated:** 2026-07-03

---

## 1. The one-line pitch

A desktop buddy (Mac + Windows) that quietly tracks what you do all day, so it can both
**answer questions about your work** ("what was I working on yesterday?") and **hold you
accountable** ("you've been on YouTube 25 min — do your shit"). It gets more personal over time.

---

## 2. The core insight (this shapes everything)

Most of the value does **not** require recording your screen. Your operating system already
knows the **active app + window title** at every moment — for free, with no screenshots.

- `"Q3 forecast – Google Sheets"` → obviously work
- `"MrBeast $1,000,000 challenge – YouTube"` → obviously not
- `"useEffect – React docs – Chrome"` → research, not slacking
- `"orbit-agent — src/main.js — VS Code"` → tells you the exact folder + file

So the **base layer is metadata-only** (app + window title + time). It's cheaper, far more
private, dodges most legal/app-store risk, and is often *more accurate* than a blurry screenshot.
**Screenshots become an optional premium layer** you switch on only for apps you choose.

> This is the same approach proven by tools like ActivityWatch — years old, open source, no legal drama.

---

## 3. What it's actually for — two sides of the same data

Everything below runs on one activity log. The two modes are just *pull* vs *push*.

### 3a. You ask it (pull) — pure value, zero annoyance
- **"What was I working on yesterday?"** → *"You spent the afternoon in the `orbit-agent`
  folder in VS Code, mostly `main.js`, with the Supabase docs open."*  ← the "lost my context"
  rescue. (Real pain: even Codex couldn't recover this an hour ago because it has no session memory.)
- **"Where's that folder I had open Tuesday?"**
- **"How many hours was I actually productive this week?"**
- **"What was that article I read about Hermes?"**

### 3b. It tells you (push) — the accountability side
- Nudges, call-outs, and (opt-in) hiding distractions. See the **mode ladder** below.

---

## 4. Privacy model — per-app capture tiers

Each app gets a privacy level in settings. **Unknown/new apps default to Private** (privacy-by-default —
the buddy earns access to pixels, it doesn't take them).

| Tier | What's recorded | Typical use |
|---|---|---|
| 🟢 **Full** | Window title + time **+ screenshots + AI classification** | Browser, work apps you want detail on |
| 🟡 **Private** (default) | Window title + app + time only — **no pixels, ever** | Messages, banking, NSFW, client work |
| ⚫ **Off** | Nothing at all | Password manager, anything you want invisible |

**Rules:**
- Everything stays **100% local** for the MVP. Nothing leaves the machine.
- Screen never gets captured unless an app is explicitly set to **Full**.
- Plain-language promise in the UI: *"Your screen never leaves your computer."*

**Still-open risks (not fully solved by tiers):**
- **Work laptops** — even metadata tracking can violate employer MDM policy. Stance: *personal
  machines only* + a work-hours pause. Not a technical fix.
- **Trust on day one** — solved by the mode ladder (below) + an accuracy gate.

---

## 5. The mode ladder — user picks their intensity

The user dials in how hard the buddy pushes. This is the release valve: someone on Chill won't
rage-quit over a wrong call-out. Modes are tweakable in settings.

| Mode | Behavior | Acts on your machine? |
|---|---|---|
| 🧊 **Chill** | Tracks silently. Only speaks when you tap it. | No |
| 👋 **Nudge** | Gentle taps. *"20 min on YouTube — still on a break?"* | No |
| 🪖 **Drill Sergeant** | Blunt, profane call-outs. *"Stop being a bitch and open your work."* | No |
| 🚔 **Warden** | Hides the distraction after too long, brings your work forward. | **Yes — reversibly** |

### The Warden (action mode) — design rules
Actions must be **reversible** so a mistake is never a catastrophe:
- **Hides / minimizes** the distraction — never force-closes. (Un-minimize and it's right back →
  zero unsaved-work risk, and no need to guess whether you'd lose work.)
- **Cancelable countdown**, always: *"Hiding YouTube in 10s — hit ESC to stay."* Never yanks your
  screen mid-thought.
- **User-set trigger**: fires only after N minutes on a distraction (e.g. 15), and ideally only
  during focus blocks / work hours — not when you're chilling at 11pm.
- **Locked behind the accuracy gate** — Warden stays greyed out until the classifier has proven
  it judges *your* activity correctly often enough.

> Why reversible matters: a self-improving agent is only safe to let *act* when its actions can't
> do permanent damage. Make every action undoable and you can let Hermes be as bold as you want —
> worst case is "oops, un-minimize."

---

## 6. How it gets better over time (the "self-improving" part)

- **Memory** — builds a durable, personal picture of your habits, projects, and preferences.
- **Learns your patterns** — e.g. that your "research" reading isn't slacking, that Tuesdays 3pm
  is your slump. Adjusts what it flags and when.
- **Learns from your pushback** — every time you hit ESC on the Warden or thumbs-down a call-out,
  that's a correction it learns from.
- **Never rewrites its own core code** — improvement happens in memory + skill notes, not the engine.
  (This was a hard line: personalization yes, self-modifying core no.)

This is the layer where an agent framework (e.g. **Hermes Agent** by Nous Research) earns its
place — *taking real actions + learning from them.* It is **not** needed for the tracker itself.

---

## 7. What counts as "productive" — you define it, the AI infers around it

**Productivity is not universal — it's whatever the user says their work is.** 15 hours a day in
Minecraft is slacking for most people and *the actual job* for a Minecraft streamer. So the buddy
never judges against some abstract idea of "productivity" — it judges against **your declared work.**

Classification blends **three inputs**:
1. **Your Work Profile (you declare it)** — but it's **not one "work," it's a set of goals.**
   You can have several pursuits at once, each with its own signals:
   - *Goal: My tech job* → VS Code, GitHub, work Slack, the `orbit-agent` folder
   - *Goal: Learn to cook* → cooking tutorials, recipe sites, culinary course PDFs
   - *Goal: Fitness* → workout app, meal-plan spreadsheet

   The buddy credits your time to **whichever goal it matches** — so time on a cooking tutorial
   counts toward "Learn to cook," even though YouTube is a distraction for everything else.
   Goals can be per-project too (this folder = the client job).
2. **AI inference** — for everything you didn't explicitly declare, the model infers from the
   window title + context which goal (if any) it fits. Crucially, the **same app can be productive
   or not depending on what you're doing in it** — `"Knife skills – YouTube"` credits the chef
   goal; `"MrBeast – YouTube"` is a distraction. The window title carries that signal.
3. **Your corrections** — thumbs-down on a wrong call → it learns *your* exceptions over time.

**Reporting is per-goal**, not one blob: *"Today: 3h tech job, 1h learning to cook, 45m fitness —
and 2h that didn't go toward any goal."* You can also weight goals or set rough time targets
(e.g. "I want ~1h/day on cooking") so the buddy knows when you're neglecting one.

> This is also the biggest fix for the accuracy risk: most "wrong" call-outs come from the buddy
> not knowing what your goals *are*. Let the user tell it, and the guessing mostly disappears.

## 8. The accuracy gate (the biggest technical risk)

An LLM council flagged this as the load-bearing issue: **a tough-love buddy is more fragile to
being wrong than a passive dashboard.** A dashboard that miscategorizes is mildly annoying; a
buddy that calls you a bitch for doing research gets uninstalled instantly.

So accuracy is a **gate**, not a nice-to-have:
- The **Work Profile** (§7) removes most misfires up front — it knows *your* definition of work.
- Metadata (window titles) already gets us most of the way — more reliable than screenshots.
- Let the user **thumbs-down** a wrong call-out. That correction log is (a) the accuracy metric
  and (b) the seed for personalization.
- **Action modes (Warden) don't unlock until accuracy is proven.** It has to be a good judge
  before it gets to act.

---

## 9. UI

**Hard rule: never the terminal. Ever.** The target user is non-technical — a nursing student
downloads the app, double-clicks, clicks through settings, and uses it. They never type a command,
never install anything by hand, never see a console. Everything happens in the GUI.

Implications of the zero-terminal rule:
- **Installer bundles everything.** No separate downloads, no package managers.
- **Local model = one in-app button.** "Download local brain" downloads + runs a bundled model
  runtime behind the scenes (no Ollama CLI). If we can't make that clean, default to **cloud with
  an in-app API-key paste field** instead.
- **OS permission prompts are OK** (macOS Screen Recording / Accessibility) — those are guided
  system dialogs, not the terminal. The app walks the user through granting them with screenshots.
- Every setting — privacy tiers, modes, goals, model choice — is a toggle/field in the GUI.

### The visuals (direction — final art to be done separately)
- **Aesthetic:** light, warm, **Claude-style** — frosted **white glass** panels over a cream
  desktop, coral accent, soft rounded corners. Glassy but bright (not the dark Cluely look).
- **Glass panel:** a Cluely-style translucent panel summoned by hotkey (e.g. ⌥Space) for
  chat/answers, today's goals, and mode switching.
- **The buddy = a Claude-spark mascot** (the little starburst character with a face), not a
  generic blob or human. Coral-toned; possibly its own tint given the working name "Pesto."
- **Animated states** — the character reacts to what it's doing, not just idle-bobbing:
  🙂 idle · 🤔 thinking · ⌨️ typing/doing · 🔥 calling-you-out. Nice-to-have: 😴 sleeping (paused),
  🎉 celebrating (goal hit), 😏 smug (caught slacking).
- **Animation tech:** proper illustrated frames in **Rive or Lottie** (small file size, smooth
  state transitions) — not CSS hacks.
- **Voice (JARVIS):** later, not MVP.

> Visual/character design is being handed to a separate design pass — this section is the brief,
> not the final art.

---

## 10. Scope — MVP vs later

### MVP (the first slice to validate the idea) — all local, words only
1. Background **metadata tracker**: active app + window title + time → local storage.
2. Coarse **classification** into a few buckets (work / distraction / idle).
3. A short **Work Profile** setup so it knows what *your* work is (§7).
4. **Pull Q&A**: "what was I working on yesterday?" + "how productive was I this week?"
5. The **buddy + glass panel** UI.
6. Modes: **Chill / Nudge / Drill Sergeant** (words only).
7. Per-app privacy tiers.

### Explicitly NOT in the MVP (comes after the loop is proven)
- ❌ Warden / action-taking mode
- ❌ Hermes Agent, cloud VPS, self-improvement loop
- ❌ Screenshots as default (opt-in Full tier only, later)
- ❌ Voice
- ❌ Calendar-aware planning
- ❌ Any cloud / data leaving the device

---

## 11. How we'll know it worked (validation test)

Run the MVP on **yourself** for two weeks and watch two numbers:
1. **Does it hook you?** — do you keep it running (and keep *asking* it things) without muting it?
2. **How often is it wrong?** — the thumbs-down rate. If it's a trustworthy judge, the accountability
   layer earns the right to get louder (and later, to act).

If the honest weekly number makes you flinch **and** the "what was I working on" answers are
genuinely useful — the product works, and we scale up (Warden → Hermes → cloud opt-in).

---

## 12. Open questions to resolve next
- Which model runs the classification in the MVP — a **bundled local model** (one-click download,
  no CLI) or **cloud with in-app key paste**? (Whichever we pick must obey the zero-terminal rule.)
- Windows + Mac at once, or nail one platform first?
- Name / character design for the buddy.
- Work Profile: quick preset picker (Student / Developer / Streamer / …) plus free-text, or
  pure free-text description?

---

## 13. Business model & backend architecture (decided)

**AI is a paid feature. Free stuff is local. Accounts are required for premium.**

### The split
- **Free tier (no account):** all *local* value — tracking, "Today by pursuit", deterministic
  answers, nudges/accountability modes. Installs instantly, works offline, costs us nothing.
- **Premium (account + subscription):** the *AI* — natural-language answers, coaching, smart
  insights. Runs on **our hosted backend**, not the user's machine.

### Growth plan (phased)
- **Phase 1 (early / few users):** free-local + paid-AI, **no account needed for the free tier** —
  lowest friction, grow the base fast.
- **Phase 2 (onwards):** tighten to **account required for everything** once there's traction, so
  every user is known and emailable.

### Where the AI runs — HOSTED (decided)
User pays → **our server** runs the AI with **our** key → the desktop app calls our backend.
- Works on any laptop (no big local model download, no hardware floor).
- Payment is trivially enforceable: no active subscription → backend refuses.
- We pay per-use; the subscription covers it. Because tracking/answers are local and we only send
  a **tiny text summary** (never screenshots) to the AI, per-call cost is fractions of a cent.

> This supersedes the earlier "Hermes/Ollama is the *only* AI path" idea, not Hermes itself.
> **Resolved on `hermes-core-engine-decision` (2026-07-09):** the two aren't in conflict — the
> shipped architecture is a hybrid, and it's staying that way: **Hermes is the default free-tier
> engine** (installed + managed by the app, no account, no terminal), and the **hosted backend is
> the premium engine** (account + Stripe unlocks it, and it's what makes the subscription
> enforceable — a local model can't be metered). Reopening "should Hermes be the core engine" was
> considered and rejected: the hosted backend is already built, deployed, and live on Stripe: real
> money, not a hypothetical. Ripping it out to go all-in on Hermes would trade a working,
> monetizable system for a CLI dependency, for no product benefit the hybrid doesn't already give.

### Architecture
```
Pesto app (Electron, user PC)          Our backend (Vercel)           LLM
  • local tracking (free)   ──login──►  • Supabase Auth (accounts)
  • calls /api/ask (premium) ──────────► • checks Stripe subscription
                                         • if active → calls LLM ──────► Claude / OpenRouter
                                         • returns answer  ◄─────────────
```
- **Auth + user data:** Supabase (fits our stack)
- **Payments:** Stripe subscription → premium flag per user
- **AI endpoint:** a Vercel function `/api/ask` — verify sub, call LLM with our key, return answer
- **App gating:** free features never call the backend; AI features require login + active sub

### What we need to provision to build it
- A **Supabase** project (auth + a `subscriptions` table)
- A **Stripe** account (one subscription product/price)
- One **LLM API key** (Anthropic or OpenRouter) — held only on the server, never in the app
- A **domain / Vercel** deployment for the backend

---

## Build status (living)
- ✅ v1 thin slice built & running: Electron (Mac+Win), local metadata tracking, JSONL store,
  deterministic Q&A, clickable **Pesto orb → glance-card widget**, separate **desktop app**
  (Life Pursuits + Privacy Tiers editors), **accountability modes** (Chill/Nudge/Drill/Warden,
  Warden = reversible minimize), tray mode picker. Windows `.exe` packaged.
- ⚠️ AI mode: configured for local Hermes but NOT actually connected (gateway/model not wired).
  Superseded by the **hosted backend** decision above.
- ⬜ Next: hosted backend (Supabase auth + Stripe + `/api/ask`), app login + premium gate,
  in-app Accountability settings (threshold slider), swap CSS-placeholder Pesto for clay art,
  re-label-history-on-pursuit-save.

*Living spec — updated as decisions land.*
