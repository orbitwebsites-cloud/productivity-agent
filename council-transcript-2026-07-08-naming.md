# LLM Council Transcript — Rename to Pesto?
**Date:** 2026-07-08

## Original Question
Should the product be renamed from "ScreenBuddy" to "Pesto", or stay "ScreenBuddy" (with Pesto
remaining just the mascot character's name, as it is today)? Weighed against ~6 pieces of
already-live infrastructure named "screenbuddy" (live Stripe product, two Supabase projects,
Vercel backend, appId/config file, marketing site, hardcoded support domain) and a 2-day
launch deadline.

---

## Advisor Responses

### The Expansionist (A) — rename_to_pesto
*You have zero customers and a two-day-old Stripe product — this is the cheapest a rename will
ever be, and "ScreenBuddy" is a name you'll regret the day you get your first 10,000 users.*
Every piece of "live infrastructure" is two days old and trivially cheap to fix. "ScreenBuddy"
is a category description, not a brand — you can't build a cult product or merch on it. Pesto
already has personality, dialogue, and art. Distinctive names are a feature; fix the
self-explanatory problem with a tagline, not by neutering the name.

### The Contrarian (B) — keep_screenbuddy
*You don't renovate the foundation two days before the open house.*
Every argument for Pesto is a taste argument; every argument against it is a ship-or-don't
argument, and those win two days out. "Rename" touches a live Stripe product real customers see
on their statement, an appId change that orphans local config, two Supabase projects, a Vercel
URL, and a hardcoded support domain — while a "public beta marketing queue" commit means launch
is already in motion. Pesto isn't even validated — nobody's checked domain availability or the
competing dev tool with the same name. Let the mascot be the mascot; keep the plumbing boring.

### The Executor (C) — hybrid
*Ship on ScreenBuddy in 48 hours — Pesto is a marketing headline, not a find-and-replace job.*
Renaming touches a live payment system and requires a config migration — that's not 48 hours of
work, it's 48 hours of nothing else. But Pesto is the better brand asset and it's already built
and free to use. So: zero backend/infra changes. Front-load Pesto in every not-yet-shipped
user-facing surface — marketing site headline ("Meet Pesto, your screen buddy"), onboarding,
tray copy, README framing. If Pesto earns its keep, do the full infra rename later as a
deliberate v2 migration, not a launch-week fire drill.

### The First Principles Thinker (D) — hybrid
*You're not being asked to pick a name, you're being asked to pay a migration tax for an
untested hypothesis — don't.*
Nothing shows Pesto vs ScreenBuddy was ever tested with a user; this is taste dressed as
strategy. ScreenBuddy does the job of being found/understood/trusted for free; Pesto would
require paid explanation to do the same. The rename cost isn't "editing text" — it's
re-touching a live payment object, two Supabase projects, and an appId tied to an on-disk
config file, on a domain that doesn't even exist yet. Ship what's wired to money; revisit the
name after usage data says it's actually costing conversions.

### The Outsider (E) — keep_screenbuddy
*I'd install something called "ScreenBuddy" without a second thought; "Pesto" would make me ask
"wait, what does this app actually do?"*
Scrolling a landing page for two seconds, "ScreenBuddy" tells me what it does instantly; "Pesto"
makes me pause and Google it — and find a pasta sauce, which is the wrong instinct to trigger
for an app requesting screen access. Let Pesto stay the charming personality inside ScreenBuddy,
the way Duolingo's owl or Mailchimp's chimp work. Revisit a full rebrand in six months with a
real trademark search, not as a scramble two days out.

---

## Peer Reviews (5 rounds)

Consistent pattern across all 5 reviews: **D and C were rated strongest** (reframing the
question as "untested taste preference vs. concrete deadline-incompatible migration cost," and
giving the most concrete, executable plan, respectively). **A was rated the universal blind
spot** in every single review — its claim that the Stripe/appId rename is "a 30-second dashboard
edit, not a migration" was flagged as directly contradicting the given facts (the prompt
explicitly states the config/appId change orphans existing installs without a migration, and
the Stripe product is real/live).

**What all five advisors missed, per the reviewers:**
- Nobody actually checked (or proposed checking) pesto.app/.com domain availability or the
  trademark collision with the existing "Pesto" dev tool — a 15-30 minute task that would have
  resolved much of the disagreement with data instead of narrative.
- The hybrid answer (C/D) has a hidden cost nobody weighed: shipping "Meet Pesto" marketing
  copy while the installer, appId, and billing descriptor still say ScreenBuddy creates a
  customer-facing inconsistency right at first install/first charge — the exact moment trust
  matters most.
- Nobody separated the risk tiers within "the infrastructure" — Stripe (real billing, real
  card statements) is categorically higher-stakes than Supabase/Vercel project names (purely
  cosmetic, freely renameable without user impact).
- Nobody flagged that Stripe *product display names* are typically just metadata, separate
  from the billing descriptor — meaning both "30-second edit" (A) and "touching a live payment
  system" (B/C/D/E) may be overstating or understating the real mechanical risk without anyone
  checking the actual Stripe behavior.
- The current README title, "ScreenBuddy (Pesto) — v1," already encodes a hybrid convention —
  none of the five advisors cited this as a low-cost existing anchor point.
- Nobody proposed a concrete trigger condition for revisiting the decision later (e.g., "at
  1,000 users" or "if churn survey mentions confusion") — "revisit later" was left as a platitude.

---

## Chairman's Verdict

**Decision: Hybrid — keep ScreenBuddy as the shipped product/legal name, lead marketing with Pesto.**

Renaming touches at least six live or half-live systems in the next 48 hours — an `sk_live_`
Stripe product, an appId tied to a local config file with no migration written, two Supabase
projects, a Vercel backend URL, and a hardcoded support domain — while the git log shows a
public beta launch already queued. That's a distributed-systems migration dressed as a
find-and-replace, and "zero customers so it's a 30-second edit" isn't credible: the config
change orphans existing installs unless someone writes a migration, and a portable `.exe` is
already built. Against that concrete, deadline-incompatible cost, the case for Pesto is pure
taste with no data behind it — no domain check, no trademark check, no user test — so the
burden of proof sits on the side proposing change, and it hasn't met that burden in a 2-day
window.

But the brand critique isn't wrong: ScreenBuddy is generic and Pesto is the more distinctive,
ownable asset, already fully built (dialogue, art, personality) and completely decoupled from
the risky infrastructure. So: split the technical/legal name from the marketing voice. Keep
package.json, appId, config file, Stripe product, Supabase, and the Vercel backend exactly as
"ScreenBuddy." Front-load Pesto in every user-facing surface that hasn't shipped yet — the
README already half-does this today ("ScreenBuddy (Pesto)").

**First step:** Today, make zero backend/infra changes. Update only not-yet-shipped
user-facing copy (marketing site headline/hero, onboarding flow, tray tooltip framing, README
lead) to foreground "Pesto" as the character brand while ScreenBuddy stays the technical name
underneath. In parallel, spend 15-30 minutes checking pesto.app/.com domain availability and
searching for the competing "Pesto" dev tool, so any future full rename decision is data-backed.

**Risk if wrong:** If ScreenBuddy actually needed to die now — you launch with a forgettable
name and redo marketing/SEO/backlinks later, plus live with mild "Pesto vs ScreenBuddy" dual
identity for a while. Annoying but recoverable. Compare that to the alternative failure mode —
attempting a full rename in 48 hours and shipping with a broken Stripe checkout, orphaned local
configs, or a rushed unregistered domain — which risks the launch itself.

See `council-report-2026-07-08-naming.html` for the full formatted synthesis.
