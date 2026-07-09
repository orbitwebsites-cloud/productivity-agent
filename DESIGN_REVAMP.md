# ScreenBuddy — Complete Design System & Visual Revamp Plan

> **Document purpose:** This is the single source of truth for the visual revamp of ScreenBuddy (website + app). Any agent picking this up should read the full document, then execute the per-file instructions in the order specified. Do not skip sections.
> 
> **Created:** 2026-07-08  
> **Brand:** ScreenBuddy / "Pesto" — warm, soft, "Claude-style" productivity companion  
> **Target user:** Non-technical (imagine a nursing student). Zero-terminal ethos.  
> **Mood:** Encouraging, playful, trustworthy. Never clinical, never dark/techy.

---

## Table of Contents

1. [Current State Diagnosis](#1-current-state-diagnosis)
2. [Design Philosophy](#2-design-philosophy)
3. [Color System](#3-color-system)
4. [Typography System](#4-typography-system)
5. [Spacing & Layout Grid](#5-spacing--layout-grid)
6. [Shadows & Elevation System](#6-shadows--elevation-system)
7. [Glassmorphism Spec](#7-glassmorphism-spec)
8. [Animation & Micro-Interaction Tokens](#8-animation--micro-interaction-tokens)
9. [Component Library](#9-component-library)
10. [Website Revamp Plan (screenbuddy-site/)](#10-website-revamp-plan)
11. [App Revamp Plan (renderer/)](#11-app-revamp-plan)
12. [Asset Requirements](#12-asset-requirements)
13. [Implementation Order & Checklist](#13-implementation-order--checklist)

---

## 1. Current State Diagnosis

### What's Actually Wrong (Not Opinions — Observable Facts)

#### A. Marketing Website (`screenbuddy-site/`)
| # | Problem | Where | Severity |
|---|---------|-------|----------|
| 1 | **Headings use Georgia (serif)** — clashes with friendly, soft brand | `styles.css` line 15 | High |
| 2 | **Hero title is comically oversized** (`clamp(54px, 11vw, 122px)`) — feels like a parody | `styles.css` line 30 | High |
| 3 | **Cards have zero depth** — flat white boxes, no glassmorphism, no elevation | All feature/FAQ cards | High |
| 4 | **Border-radius is inconsistent** — 8px on some cards, 8px on buttons, 22px on app but not here | Throughout | Medium |
| 5 | **No entrance animations** — page feels dead on load | Entire page | Medium |
| 6 | **Pesto mascot is invisible on mobile** (`opacity: .3` at <560px) | `styles.css` line 95 | Medium |
| 7 | **Trust band has no visual separation** — just text blocks with top borders | `styles.css` lines 65-68 | Medium |
| 8 | **Status strip is cramped and generic** — looks like a Bootstrap alert | `styles.css` lines 40-44 | Medium |
| 9 | **Color palette is close but inconsistent with app** — website uses `#d76743` vs app uses `#c96442` | `:root` variables | Medium |
| 10 | **No hover micro-interactions** — links/buttons just change color instantly | Throughout | Low |
| 11 | **The circular gradient behind hero (`#f1f7f5`) is cold blue-green** — contradicts warm coral brand | `styles.css` line 26 | High |
| 12 | **Support page has no visual connection to main brand** — sad Pesto is just a grayscale filter on the same PNG | `support.html` | Medium |

#### B. Desktop App (`renderer/`)
| # | Problem | Where | Severity |
|---|---------|-------|----------|
| 1 | **Main app (`app.css`) has ZERO glassmorphism** — plain white panel, no backdrop blur | `app.css` lines 7-10 | High |
| 2 | **Sidebar is a 230px plain gray strip** — no personality, no hover animations, active state is just a gradient | `app.css` lines 41-52 | High |
| 3 | **Pursuit cards are flat white boxes with thin borders** — no depth, no "card" feel | `app.css` lines 62-71 | High |
| 4 | **Privacy tier segmented controls look like a 2015 iOS mockup** — flat gray pill with a white button | `app.css` lines 106-108 | Medium |
| 5 | **Input fields have no focus glow** — just a border color change | `app.css` lines 116-118 | Medium |
| 6 | **Setup gate is a plain page with no visual warmth** — it's the first thing users see | `app.css` lines 14-36 | High |
| 7 | **No page transition animations** — switching between Life Pursuits / Privacy / Jarvis is instant and jarring | `app.js` (not in CSS) | Medium |
| 8 | **Chat panel (`panel.css`) has thin borders and no breathing room** — feels like a cheap widget | `panel.css` | Medium |
| 9 | **Buddy window (`buddy.css`) CSS mascot is a basic CSS starburst** — `buddy.css` lines 31-44 explicitly says "placeholder — swap for clay render" | `buddy.css` | High |
| 10 | **Progress bars in both app and panel are 6px thin lines** — no visual weight | `panel.css` line 90, `buddy.css` line 53 | Low |
| 11 | **Warden overlay is good but the card is too small** — `400px` wide on a full screen feels lost | `warden.html` line 12 | Medium |
| 12 | **No consistent spacing scale** — padding values are arbitrary (`14px`, `22px`, `34px`, `40px`) | Throughout | Medium |
| 13 | **The "Today by pursuit" panel in buddy has no max-height handling** — could overflow badly | `buddy.css` line 47 | Medium |
| 14 | **Orb (`orb.html`) has no idle animation variety** — just a bob, no personality states | `orb.html` | Low |
| 15 | **Premium page looks like a settings form** — no "premium" feel, no sparkle, no visual hierarchy | `app.css` lines 132-136 | Medium |

### The Root Cause
The current CSS was built functionally — it works, but it was never given a **coherent visual system**. There are no design tokens, no consistent spacing, no elevation language, and no animation grammar. The result is something that feels "generic Bootstrap but warm." The fix is to replace the entire visual layer with a **token-driven design system** that every file inherits from.

---

## 2. Design Philosophy

### The "Warm Glass" Identity

ScreenBuddy is not a utility app. It's a **companion**. The visual language must communicate:
1. **Warmth** — You are not being monitored; you are being helped.
2. **Clarity** — Everything is legible and calm, never information-dense.
3. **Playfulness** — Pesto has personality; the UI should too.
4. **Trust** — Privacy is the core promise; the UI must feel secure and human.

### The 3 Principles of Every Change
1. **Every surface either floats or rests.** No flat white boxes. Everything is either a glass panel (floating, blurred, with backdrop-filter) or a grounded surface (subtle gradient, warm shadow). This creates depth without skeuomorphism.
2. **Motion is information.** Animations don't just "look nice" — they communicate state changes. A card appearing = "something new happened." A button pressing = "your action was received."
3. **Coral is the heartbeat.** The coral accent (`#C96442`) is used sparingly but consistently: active states, primary actions, progress, the mascot. It should feel like the app's pulse, not its wallpaper.

### Variation Direction Chosen (from design-prompt.md)
> **"Variation B — Warm & data-rich"** — more information density, richer cards with mini charts/streaks, cozier warmer palette. For users who love their stats.

This was chosen because the current app already leans toward data density (pursuit lists, privacy tiers, chat + today panel). The revamp should **embrace the density** but make it feel premium and organized, not cramped.

---

## 3. Color System

### Primary Palette

```css
:root {
  /* === BRAND === */
  --coral: #C96442;           /* Primary action, mascot, heartbeat */
  --coral-light: #E0895F;     /* Gradients, hover states, warm accents */
  --coral-dark: #9F3D25;      /* Text on light coral, kicker text */
  --coral-glow: rgba(201, 100, 66, 0.28);  /* Box-shadows, focus rings */

  /* === NEUTRALS === */
  --ink: #2F2B25;             /* Primary text — warm near-black, not pure #000 */
  --ink-soft: #4A443C;        /* Secondary headings, emphasized body */
  --muted: #8A8377;           /* Descriptions, placeholders, meta text */
  --faint: #B7B0A4;           /* Disabled, empty states, subtle borders */
  --line: rgba(60, 50, 40, 0.10);  /* Borders, dividers — warm tint, not gray */
  --line-strong: rgba(60, 50, 40, 0.18);  /* Active borders, focus states */

  /* === SURFACES === */
  --paper: #FAF7F2;           /* Page background — warm cream, not white */
  --paper-gradient-start: #FFFDFA;  /* Top of page gradients */
  --paper-gradient-mid: #F4EFE6;    /* Middle of page gradients */
  --paper-gradient-end: #F9F8F4;    /* Bottom of page gradients */
  
  --surface: #FFFFFF;           /* Card backgrounds (opaque) */
  --surface-glass: rgba(255, 255, 255, 0.72);  /* Glass panels */
  --surface-glass-strong: rgba(255, 255, 255, 0.88);  /* Glass panels on dark backgrounds */
  --surface-elevated: #FFFFFF;  /* Floating cards, modals */
  --surface-warm: #FBF9F5;    /* Input backgrounds, subtle fills */

  /* === ACCENTS === */
  --sage: #7F9C8C;            /* Success, positive feedback, "saved" messages */
  --sage-soft: rgba(127, 156, 140, 0.14);  /* Sage backgrounds */
  --amber: #D8A84E;           /* Warnings, secondary highlights, streaks */
  --amber-soft: rgba(216, 168, 78, 0.14);  /* Amber backgrounds */
  --blue: #2D596F;            /* Info, links, tertiary accent (use sparingly) */
  --blue-soft: rgba(45, 89, 111, 0.10);  /* Blue backgrounds */

  /* === SEMANTIC === */
  --text-primary: var(--ink);
  --text-secondary: var(--muted);
  --text-tertiary: var(--faint);
  --text-on-coral: #FFFFFF;
  --text-on-sage: #3D5A4A;
  
  --bg-primary: var(--paper);
  --bg-card: var(--surface);
  --bg-glass: var(--surface-glass);
  --bg-input: var(--surface-warm);

  /* === SHADOWS (see §6 for full spec) === */
  --shadow-sm: 0 2px 8px rgba(47, 39, 31, 0.06);
  --shadow-md: 0 8px 24px rgba(47, 39, 31, 0.08);
  --shadow-lg: 0 18px 46px rgba(47, 39, 31, 0.12);
  --shadow-xl: 0 28px 70px rgba(47, 39, 31, 0.16);
  --shadow-coral: 0 14px 26px rgba(201, 100, 66, 0.24);
  --shadow-coral-lg: 0 18px 40px rgba(201, 100, 66, 0.32);
  --shadow-inset: inset 0 1px 2px rgba(255, 255, 255, 0.6);
}
```

### Usage Rules
1. **Coral gradient** (`linear-gradient(140deg, var(--coral), var(--coral-light))`) is the ONLY gradient used for primary actions. Never use solid coral for buttons.
2. **Page backgrounds** are always a gradient: `linear-gradient(165deg, var(--paper-gradient-start), var(--paper-gradient-mid))`.
3. **Cards** use `var(--surface)` with `var(--shadow-md)` and `border-radius: 18px` (app) or `22px` (website).
4. **Glass panels** use `var(--surface-glass)` with `backdrop-filter: blur(24px) saturate(150%)` and a warm `var(--line)` border.
5. **Success states** use `var(--sage)` text on `var(--sage-soft)` background. Never use green.
6. **Warning/attention** uses `var(--amber)` on `var(--amber-soft)`. Never use red.
7. **The warm taupe line** (`var(--line)`) is the only border color. No gray borders ever.

### Gradient Examples (Copy-Paste Ready)

```css
/* Primary button */
background: linear-gradient(140deg, var(--coral), var(--coral-light));
box-shadow: var(--shadow-coral);

/* Page background (app) */
background:
  radial-gradient(700px 340px at 88% -8%, rgba(201, 100, 66, 0.10), transparent 60%),
  linear-gradient(165deg, var(--paper-gradient-start), var(--paper-gradient-mid));

/* Page background (website) */
background: linear-gradient(180deg, var(--paper-gradient-start) 0%, var(--paper-gradient-mid) 58%, var(--paper-gradient-end) 100%);

/* Glass card (panel/buddy) */
background: var(--surface-glass);
backdrop-filter: blur(24px) saturate(150%);
-webkit-backdrop-filter: blur(24px) saturate(150%);
border: 1px solid var(--line);

/* Input focus glow */
box-shadow: 0 0 0 3px var(--coral-glow), var(--shadow-sm);
border-color: var(--coral-light);
```

---

## 4. Typography System

### Font Stack

```css
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
--font-display: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

> **Why Inter?** It's the modern standard for readable, friendly UI. It has excellent numerals (for time tracking), great legibility at small sizes (for chat), and feels warm but not playful. The design-prompt.md mentioned "Claude-style" — Claude uses a custom font but the closest open equivalent is Inter with slightly rounded characteristics.
>
> **Fallbacks:** The system stack is acceptable if Inter fails to load. NEVER use Georgia, Times New Roman, or any serif font.

### Type Scale

```css
:root {
  /* Display — Hero titles only */
  --text-display: clamp(2.5rem, 5vw, 4.5rem);    /* 40px–72px */
  --text-display-line: 1.05;
  --text-display-weight: 800;
  --text-display-letter: -0.03em;

  /* H1 — Page titles */
  --text-h1: clamp(1.75rem, 3vw, 2.5rem);        /* 28px–40px */
  --text-h1-line: 1.1;
  --text-h1-weight: 700;
  --text-h1-letter: -0.02em;

  /* H2 — Section titles */
  --text-h2: clamp(1.25rem, 2vw, 1.75rem);       /* 20px–28px */
  --text-h2-line: 1.15;
  --text-h2-weight: 700;
  --text-h2-letter: -0.01em;

  /* H3 — Card titles */
  --text-h3: 1.125rem;                           /* 18px */
  --text-h3-line: 1.25;
  --text-h3-weight: 600;

  /* Body — Primary text */
  --text-body: 0.9375rem;                        /* 15px */
  --text-body-line: 1.6;
  --text-body-weight: 400;

  /* Body-sm — Descriptions, secondary text */
  --text-body-sm: 0.8125rem;                     /* 13px */
  --text-body-sm-line: 1.5;
  --text-body-sm-weight: 400;

  /* Caption — Labels, meta, uppercase */
  --text-caption: 0.6875rem;                     /* 11px */
  --text-caption-line: 1.4;
  --text-caption-weight: 700;
  --text-caption-letter: 0.08em;
  --text-caption-transform: uppercase;

  /* Micro — Badges, tags */
  --text-micro: 0.625rem;                        /* 10px */
  --text-micro-line: 1.3;
  --text-micro-weight: 800;
}
```

### Typography Rules
1. **Headings use `font-weight: 700` or `800`**. Never use `850` or `760` (those are arbitrary and break the system).
2. **Body text is always `font-weight: 400`**. Never use `500` for body — it looks muddy.
3. **Labels and captions are always uppercase, letter-spaced, bold** (`--text-caption`).
4. **The "kicker" / "eyebrow" pattern** — a small uppercase coral label above a heading — is the primary way to add hierarchy. Use it on EVERY major section.
5. **Max line lengths:**
   - Headings: max 12–15 characters per line (use `max-width: 15ch` or similar)
   - Body: max 65 characters (use `max-width: 65ch`)
   - Hero description: max 60 characters
6. **Chat messages** use `--text-body-sm` at `12.5px` (keep existing size, it's good for density).
7. **The "Today by pursuit" panel** uses `--text-body-sm` for labels and `--text-micro` for the time values.

---

## 5. Spacing & Layout Grid

### Spacing Scale (8px base, 4px sub-unit)

```css
:root {
  --space-1: 0.25rem;   /* 4px  — micro gaps, icon padding */
  --space-2: 0.5rem;    /* 8px  — tight gaps, small padding */
  --space-3: 0.75rem;   /* 12px — button padding, card internal gaps */
  --space-4: 1rem;      /* 16px — standard gap, card padding */
  --space-5: 1.25rem;   /* 20px — section internal padding */
  --space-6: 1.5rem;    /* 24px — large card padding, section gaps */
  --space-8: 2rem;      /* 32px — section vertical spacing */
  --space-10: 2.5rem;   /* 40px — major section padding */
  --space-12: 3rem;     /* 48px — hero padding, page top */
  --space-16: 4rem;     /* 64px — section breaks */
  --space-20: 5rem;     /* 80px — major section breaks */
}
```

### Layout Grid

#### Website
- **Container:** `max-width: 1200px`, centered, `padding: 0 var(--space-6)`
- **Desktop:** 12-column grid, `gap: var(--space-6)`
- **Tablet:** 8-column grid
- **Mobile:** 4-column grid, single column stacking
- **Section vertical padding:** `var(--space-16)` to `var(--space-20)` between sections

#### App (Main Window)
- **Sidebar:** `240px` fixed (was 230px, bumped for breathing room)
- **Main content:** `flex: 1`, `max-width: 720px` for readability
- **Padding:** `var(--space-8)` horizontal, `var(--space-10)` vertical
- **Card internal padding:** `var(--space-5)` to `var(--space-6)`
- **Gap between cards:** `var(--space-4)`

#### App (Panel / Buddy)
- **Card border-radius:** `22px` (keep existing — it's good)
- **Card internal padding:** `var(--space-4)` to `var(--space-5)`
- **Chat padding:** `var(--space-3)` horizontal, `var(--space-2)` vertical between messages
- **Quick chips gap:** `var(--space-2)`

### Border Radius Scale

```css
:root {
  --radius-sm: 8px;     /* Small buttons, inputs, tags */
  --radius-md: 12px;    /* Cards, panels, modals */
  --radius-lg: 18px;    /* Large cards, feature sections */
  --radius-xl: 22px;    /* App windows, glass panels */
  --radius-full: 999px; /* Pills, chips, badges, progress bars */
}
```

### Usage Rules
1. **Buttons:** `radius-sm` (8px) for small actions, `radius-md` (12px) for primary CTAs
2. **Cards:** `radius-md` (12px) for app cards, `radius-lg` (18px) for website feature cards
3. **Windows/panels:** `radius-xl` (22px) — this is the signature ScreenBuddy roundedness
4. **Pills/chips:** `radius-full` (999px)
5. **Progress bars:** `radius-full` (999px) — always
6. **Never mix radius sizes within a component** — a card with 18px radius should not have 8px-radius children unless the child is a small button

---

## 6. Shadows & Elevation System

### The Shadow Language

```css
:root {
  /* Resting — grounded surfaces, inputs, small tags */
  --shadow-sm: 0 2px 8px rgba(47, 39, 31, 0.06);
  
  /* Elevated — cards, panels, dropdowns */
  --shadow-md: 0 8px 24px rgba(47, 39, 31, 0.08);
  
  /* Floating — feature cards, modals, tooltips */
  --shadow-lg: 0 18px 46px rgba(47, 39, 31, 0.12);
  
  /* Dramatic — hero elements, primary CTAs, toasts */
  --shadow-xl: 0 28px 70px rgba(47, 39, 31, 0.16);
  
  /* Coral glow — primary buttons, active states, mascot */
  --shadow-coral: 0 14px 26px rgba(201, 100, 66, 0.24);
  --shadow-coral-lg: 0 18px 40px rgba(201, 100, 66, 0.32);
  
  /* Inner highlight — for glass surfaces, gives that "light from above" feel */
  --shadow-inset: inset 0 1px 2px rgba(255, 255, 255, 0.6);
  
  /* Combined — glass panels always have both outer and inner shadow */
  --shadow-glass: var(--shadow-md), var(--shadow-inset);
}
```

### Elevation Levels (Visual Hierarchy)

| Level | Use | Shadow | Example |
|-------|-----|--------|---------|
| 0 (Ground) | Page background, empty areas | None | `body` background gradient |
| 1 (Rest) | Inputs, tags, small buttons | `--shadow-sm` | Text input, chip |
| 2 (Elevated) | Cards, panels, list items | `--shadow-md` | Pursuit card, tier row |
| 3 (Floating) | Feature cards, modals, tooltips | `--shadow-lg` | Website feature card, setup panel |
| 4 (Dramatic) | Hero CTAs, primary buttons, toasts | `--shadow-xl` | Download button, warden card |
| Glow (Special) | Primary actions, active states | `--shadow-coral` | Save button, active nav |

### Shadow Rules
1. **All shadows are warm-tinted** (`rgba(47, 39, 31, ...)`) — never pure gray/black. The warm tint makes shadows feel like they're cast on a cream surface, not a white void.
2. **Glass panels get BOTH an outer shadow AND an inset highlight.** The inset highlight (`--shadow-inset`) is what makes glass feel like glass — light catching the top edge.
3. **Primary buttons get `--shadow-coral` on resting, `--shadow-coral-lg` on hover.** This makes them feel like they're lifting off the page.
4. **Cards that are hovered get a slightly deeper shadow.** Use `transition: box-shadow 0.2s ease` for smooth elevation changes.
5. **No shadows on the page background.** The gradient is the depth.

---

## 7. Glassmorphism Spec

### The ScreenBuddy Glass Look

Glassmorphism is the **defining visual signature** of the app. The website should use it sparingly (for hero cards, feature callouts), but the app should use it everywhere.

```css
.glass {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  border: 1px solid rgba(60, 50, 40, 0.10);
  border-radius: var(--radius-xl);  /* 22px */
  box-shadow: 0 18px 46px rgba(47, 39, 31, 0.12), inset 0 1px 2px rgba(255, 255, 255, 0.6);
}

.glass-strong {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(32px) saturate(160%);
  -webkit-backdrop-filter: blur(32px) saturate(160%);
  border: 1px solid rgba(60, 50, 40, 0.12);
}

.glass-card {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid rgba(60, 50, 40, 0.08);
  border-radius: var(--radius-lg);  /* 18px */
  box-shadow: 0 8px 24px rgba(47, 39, 31, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.4);
}
```

### Glass Usage Rules
1. **The main app window (`app.html`)** gets a full glass treatment on the sidebar and main content area. The sidebar should be `glass` with a stronger blur, the main content should be `glass-card`.
2. **The panel (`panel.html`)** and buddy (`buddy.html`) already have glass — but the blur should be increased from `24px` to `32px` and the saturation from `150%` to `160%` for a more premium feel.
3. **The warden overlay (`warden.html`)** should be a `glass-strong` card on a semi-transparent dark overlay (not just a transparent background). The dark overlay should be `rgba(47, 39, 31, 0.45)` with a subtle warm tint.
4. **Website feature cards** should use `glass-card` on the cream background — the contrast between the glass and the gradient makes the cards feel like they're floating.
5. **The setup gate** should be a centered `glass` panel, not a plain white card.
6. **NEVER use glass on a white background** — glass only works on colored/gradient backgrounds or when layered over other content. On a plain white page, glass looks like a slightly frosted white box (boring).

### The Warm Blur Effect
The secret to ScreenBuddy's glass is the **warmth**. Most glassmorphism uses cool blue-white tints. ScreenBuddy uses warm cream-white. The background behind the glass should always have a warm coral-tinted radial gradient (`rgba(201, 100, 66, 0.10)`) so that the blur diffuses warm light, not cold light.

---

## 8. Animation & Micro-Interaction Tokens

### Timing Tokens

```css
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);      /* Primary easing — snappy start, smooth land */
  --ease-out-slow: cubic-bezier(0.22, 1, 0.36, 1); /* For larger movements */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);   /* For reversible states (hover) */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* For bouncy, playful interactions (mascot) */
  
  --duration-instant: 0.1s;   /* Color changes, opacity */
  --duration-fast: 0.15s;     /* Button presses, icon swaps */
  --duration-normal: 0.25s;   /* Hover states, card lifts */
  --duration-slow: 0.4s;      /* Page transitions, modal open */
  --duration-dramatic: 0.6s;  /* Hero entrance, major reveals */
}
```

### Global Animations (Add to every page)

```css
/* Fade-in-up for sections */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Fade-in for overlays */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Scale-in for cards */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

/* Slide-in from right for page transitions */
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Pulse for the mascot / orb */
@keyframes gentlePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}

/* Shimmer for progress bars */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Staggered entrance for lists */
.stagger-children > * {
  animation: fadeInUp 0.5s var(--ease-out) both;
}
.stagger-children > *:nth-child(1) { animation-delay: 0.05s; }
.stagger-children > *:nth-child(2) { animation-delay: 0.1s; }
.stagger-children > *:nth-child(3) { animation-delay: 0.15s; }
.stagger-children > *:nth-child(4) { animation-delay: 0.2s; }
.stagger-children > *:nth-child(5) { animation-delay: 0.25s; }
```

### Micro-Interaction Specs

#### Buttons
```css
.btn {
  transition: 
    transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-in-out),
    filter var(--duration-fast) var(--ease-out);
}
.btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-coral-lg);  /* deeper shadow on hover */
}
.btn:active {
  transform: translateY(0) scale(0.98);
  transition-duration: var(--duration-instant);
}
```

#### Cards
```css
.card {
  transition: 
    transform var(--duration-normal) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-in-out);
}
.card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);  /* elevate from md to lg */
}
```

#### Inputs
```css
.input {
  transition: 
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}
.input:focus {
  border-color: var(--coral-light);
  background-color: #fff;
  box-shadow: 0 0 0 3px var(--coral-glow), var(--shadow-sm);
  outline: none;
}
```

#### Navigation Items
```css
.navitem {
  transition: 
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}
.navitem:hover {
  background: rgba(201, 100, 66, 0.08);
  transform: translateX(2px);  /* subtle nudge toward the user */
}
.navitem.active {
  background: linear-gradient(135deg, var(--coral), var(--coral-light));
  color: #fff;
  font-weight: 600;
  box-shadow: var(--shadow-coral);
}
```

#### Chat Messages
```css
.msg {
  animation: fadeInUp 0.3s var(--ease-out) both;
}
.msg.pesto {
  /* Slight delay on Pesto's messages — feels like he's "typing" */
  animation-delay: 0.15s;
}
```

#### Progress Bars
```css
.progress-fill {
  background: linear-gradient(90deg, var(--coral), var(--coral-light));
  transition: width 0.4s var(--ease-out);
  /* Optional shimmer effect for active bars */
  background-size: 200% 100%;
  animation: shimmer 2s linear infinite;
}
```

### Orb Animation (Revamped)

The orb currently just bobs. It needs **personality states**:

```css
/* Idle — gentle bob + subtle glow pulse */
@keyframes orbIdle {
  0%, 100% { transform: translateY(0) scale(1); filter: drop-shadow(0 8px 14px rgba(120, 60, 30, 0.35)); }
  50% { transform: translateY(-4px) scale(1.02); filter: drop-shadow(0 12px 20px rgba(201, 100, 66, 0.45)); }
}

/* Hover — lifts up and brightens */
#orb:hover img {
  transform: translateY(-6px) scale(1.12);
  filter: drop-shadow(0 16px 28px rgba(201, 100, 66, 0.55));
  transition: transform 0.3s var(--ease-spring), filter 0.3s var(--ease-out);
}

/* Active/click — quick squish */
#orb:active img {
  transform: scale(0.95);
  transition: transform 0.1s var(--ease-out);
}
```

### Page Transition (App)

When switching between app pages (Life Pursuits → Privacy → Jarvis → Premium), add a crossfade:

```css
.page {
  opacity: 0;
  transform: translateX(8px);
  transition: opacity 0.25s var(--ease-out), transform 0.25s var(--ease-out);
  display: none;
}
.page.active {
  display: block;
  opacity: 1;
  transform: translateX(0);
}
```

**Note:** The app uses `hidden` attribute, not CSS classes. The JS needs to add/remove `active` class alongside `hidden`. See §11 for the JS change.

---

## 9. Component Library

### 9.1 Primary Button (`.btn-primary`)
```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 var(--space-6);  /* 0 24px */
  border: none;
  border-radius: var(--radius-md);  /* 12px */
  font-family: var(--font-sans);
  font-size: var(--text-body-sm);  /* 13px */
  font-weight: 600;
  color: #fff;
  background: linear-gradient(140deg, var(--coral), var(--coral-light));
  box-shadow: var(--shadow-coral);
  cursor: pointer;
  transition: 
    transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-in-out),
    filter var(--duration-fast) var(--ease-out);
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-coral-lg);
  filter: brightness(1.04);
}
.btn-primary:active {
  transform: translateY(0) scale(0.98);
  transition-duration: 0.1s;
}
```

### 9.2 Secondary Button (`.btn-secondary`)
```css
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 var(--space-5);  /* 0 20px */
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-body-sm);
  font-weight: 600;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.82);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}
.btn-secondary:hover {
  background: #fff;
  border-color: var(--line-strong);
  box-shadow: var(--shadow-sm);
}
```

### 9.3 Ghost Button (`.btn-ghost`)
```css
.btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 var(--space-4);
  border: 1px dashed rgba(201, 100, 66, 0.42);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: var(--text-body-sm);
  font-weight: 600;
  color: var(--coral);
  background: rgba(201, 100, 66, 0.06);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}
.btn-ghost:hover {
  background: rgba(201, 100, 66, 0.12);
  border-color: rgba(201, 100, 66, 0.6);
}
```

### 9.4 Card (`.card`)
```css
.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);  /* 18px */
  padding: var(--space-5);  /* 20px */
  box-shadow: var(--shadow-md);
  transition: 
    transform var(--duration-normal) var(--ease-out),
    box-shadow var(--duration-normal) var(--ease-in-out);
}
.card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}
```

### 9.5 Glass Card (`.glass-card`)
```css
.glass-card {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid rgba(60, 50, 40, 0.08);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: 0 8px 24px rgba(47, 39, 31, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.4);
}
```

### 9.6 Input (`.input`)
```css
.input {
  width: 100%;
  min-height: 44px;
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);  /* 8px */
  font-family: var(--font-sans);
  font-size: var(--text-body-sm);
  color: var(--ink);
  background: var(--surface-warm);  /* #FBF9F5 */
  outline: none;
  transition: 
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}
.input:focus {
  border-color: var(--coral-light);
  background-color: #fff;
  box-shadow: 0 0 0 3px var(--coral-glow), var(--shadow-sm);
}
.input::placeholder {
  color: var(--faint);
}
```

### 9.7 Segmented Control (`.seg-control`)
```css
.seg-control {
  display: flex;
  background: rgba(60, 50, 40, 0.06);  /* softer than #f1ece3 */
  border-radius: var(--radius-md);
  padding: 3px;
  gap: 2px;
}
.seg-control button {
  flex: 1;
  border: none;
  background: transparent;
  font-family: var(--font-sans);
  font-size: 0.75rem;  /* 12px */
  font-weight: 600;
  color: var(--muted);
  padding: 7px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}
.seg-control button.on {
  background: #fff;
  color: var(--coral);
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(80, 60, 40, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.8);
}
.seg-control button:hover:not(.on) {
  background: rgba(255, 255, 255, 0.5);
  color: var(--ink-soft);
}
```

### 9.8 Progress Bar (`.progress-bar`)
```css
.progress-bar {
  height: 8px;  /* was 6px — bumped for visual weight */
  border-radius: var(--radius-full);
  background: rgba(60, 50, 40, 0.08);
  overflow: hidden;
}
.progress-bar .fill {
  height: 100%;
  border-radius: var(--radius-full);
  background: linear-gradient(90deg, var(--coral), var(--coral-light));
  transition: width 0.4s var(--ease-out);
}
```

### 9.9 Chat Message (`.msg`)
```css
.msg {
  display: block;
  width: fit-content;
  max-width: 88%;
  margin: 0 0 8px;
  font-size: 12.5px;
  line-height: 1.5;
  padding: 10px 14px;
  border-radius: 14px;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  animation: fadeInUp 0.3s var(--ease-out) both;
}
.msg.pesto {
  margin-right: auto;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid var(--line);
  color: #3a352d;
  box-shadow: var(--shadow-sm);
  border-bottom-left-radius: 4px;  /* speech bubble tail feel */
}
.msg.me {
  margin-left: auto;
  background: linear-gradient(160deg, var(--coral-light), var(--coral));
  color: #fff;
  box-shadow: 0 4px 12px rgba(201, 100, 66, 0.25);
  border-bottom-right-radius: 4px;
}
```

### 9.10 Badge / Pill (`.badge`)
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: var(--text-micro);  /* 10px */
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}
.badge.free {
  background: rgba(138, 131, 119, 0.14);
  color: var(--muted);
}
.badge.premium {
  background: linear-gradient(135deg, var(--coral), var(--coral-light));
  color: #fff;
  box-shadow: var(--shadow-coral);
}
```

### 9.11 Kicker / Eyebrow (`.kicker`)
```css
.kicker {
  font-size: var(--text-caption);  /* 11px */
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--coral-dark);
  margin-bottom: var(--space-2);
  font-family: var(--font-sans);
}
```

---

## 10. Website Revamp Plan

### File: `screenbuddy-site/styles.css`

#### Phase 1: Foundation (Replace the entire `:root`)
Replace the current `:root` block (lines 1-13) with the complete color system from §3, spacing system from §5, shadow system from §6, and radius system from §5. This is the foundation everything else builds on.

#### Phase 2: Typography Overhaul
1. Replace `font-family: Georgia, "Times New Roman", serif` (line 15) with `var(--font-sans)`.
2. Replace the `h1` declaration (line 30) with:
   ```css
   h1 {
     font-size: var(--text-display);
     line-height: var(--text-display-line);
     font-weight: var(--text-display-weight);
     letter-spacing: var(--text-display-letter);
     max-width: 12ch;
     margin: 0 0 var(--space-3);
   }
   ```
3. Replace `h2` (line 31) with the `--text-h2` scale.
4. Replace `h3` (line 32) with `--text-h3` scale.
5. Replace `.kicker` (line 29) with the `.kicker` component from §9.11.
6. Replace `.lede` (line 33) to use `--text-body` with `max-width: 60ch`.

#### Phase 3: Hero Section Revamp
1. Replace the hero background gradient (line 16) with the warm paper gradient from §3.
2. Replace the cold blue-green circle (`#f1f7f5`, line 26) with a warm coral-tinted circle: `rgba(201, 100, 66, 0.06)`.
3. The `.hero-pesto` position is fine but add a **gentle float animation**:
   ```css
   @keyframes heroFloat {
     0%, 100% { transform: rotate(5deg) translateY(0); }
     50% { transform: rotate(5deg) translateY(-12px); }
   }
   .hero-pesto {
     animation: heroFloat 6s ease-in-out infinite;
   }
   ```
4. Replace `.actions` (line 34) with proper flex gap using `--space-3`.
5. Replace `.download` (line 36) with the `.btn-primary` component from §9.1.
6. Replace `.secondary` (line 38) with the `.btn-secondary` component from §9.2.
7. Add an entrance animation to the hero:
   ```css
   .hero-copy {
     animation: fadeInUp 0.8s var(--ease-out-slow) both;
   }
   .hero-pesto {
     animation: heroFloat 6s ease-in-out infinite, fadeIn 0.6s var(--ease-out) 0.3s both;
   }
   .status-strip {
     animation: scaleIn 0.5s var(--ease-out) 0.5s both;
   }
   ```

#### Phase 4: Feature Bands (`.feature-band`, `.setup-band`, `.problem-band`)
1. Replace all card styling (line 47) with the `.card` component from §9.4.
2. Add staggered entrance animations to `.feature-grid`, `.setup-steps`, `.problem-list` using `.stagger-children` from §8.
3. Replace `.status-strip` (line 40) with a glass card treatment:
   ```css
   .status-strip {
     background: rgba(255, 255, 255, 0.72);
     backdrop-filter: blur(12px) saturate(140%);
     border: 1px solid var(--line);
     border-radius: var(--radius-lg);  /* 18px */
     box-shadow: var(--shadow-lg);
     /* ... rest of existing grid styles ... */
   }
   ```
4. The `.num` styling (line 48) is fine but add `font-weight: 800` and reduce the font size slightly.

#### Phase 5: Trust Band (`.trust-band`)
1. Give each trust item a glass-card treatment instead of just a top border.
2. Add an icon to each trust item (use emoji or SVG: 🏠 for local, 🧪 for beta, 🧑 for human).
3. Add `text-align: center` and center the content vertically.

#### Phase 6: Privacy FAQ Band
1. Apply the same card treatment as feature bands.
2. The `.num` with `?` should be styled as a circle badge, not just a colored number.

#### Phase 7: Responsive & Mobile
1. Keep the existing `@media` queries but adjust the hero title size for mobile — it's still too large at `clamp(52px, 18vw, 76px)`. Use `var(--text-display)` which caps at a reasonable size.
2. On mobile, the `.hero-pesto` should NOT be invisible. Instead, scale it down and position it as a subtle background element (`opacity: 0.15`, `width: 200px`, centered behind the text). The current `opacity: 0.3` at `bottom: 150px` is too stark.

#### Phase 8: Support Page (`support.html`)
1. The `.support-card` should use the `.glass-card` treatment, not a flat white card.
2. The `.sad-pesto` should be larger and more expressive — the `:(` badge should pulse gently.
3. The form inputs should use the `.input` component from §9.6.
4. The submit button should use `.btn-primary`.

### File: `screenbuddy-site/index.html`

**No structural changes needed** — the HTML structure is good. The revamp is 100% CSS-driven. However, add these classes to enable animations:
1. Add `class="stagger-children"` to `.feature-grid`, `.setup-steps`, `.problem-list`, `.trust-band`.
2. Add `class="card"` to all `<article>` elements inside grids.

### New File: `screenbuddy-site/animations.css` (Optional but Recommended)
If the CSS file gets too large, split the animation keyframes into a separate file. Otherwise, keep them at the bottom of `styles.css`.

---

## 11. App Revamp Plan

### File: `renderer/app.css` (Main App Window — HIGHEST IMPACT)

This is the most important file to fix. The main app is what users spend the most time in.

#### Phase 1: Foundation
Replace the entire `:root` block (lines 1-5) with the complete design system from §3-§6. This is the single most impactful change.

#### Phase 2: Body & Background
Replace the body background (lines 8-10) with:
```css
body {
  background:
    radial-gradient(800px 400px at 90% -10%, rgba(201, 100, 66, 0.12), transparent 60%),
    radial-gradient(600px 300px at 10% 100%, rgba(216, 168, 78, 0.06), transparent 60%),
    linear-gradient(165deg, var(--paper-gradient-start), var(--paper-gradient-mid));
}
```
The second radial gradient adds a subtle amber warmth to the bottom-left, creating a more dynamic background.

#### Phase 3: Setup Gate (Lines 14-36)
The setup gate is the **first impression**. Currently it's a plain grid with a plain card. Transform it:

1. `.setup-gate` — add a centered flex with the warm gradient background.
2. `.setup-panel` — make it a `.glass` panel (§7):
   ```css
   .setup-panel {
     background: rgba(255, 255, 255, 0.82);
     backdrop-filter: blur(28px) saturate(150%);
     -webkit-backdrop-filter: blur(28px) saturate(150%);
     border: 1px solid var(--line);
     border-radius: var(--radius-xl);  /* 22px */
     box-shadow: var(--shadow-xl), inset 0 1px 2px rgba(255, 255, 255, 0.6);
     padding: var(--space-8);
   }
   ```
3. `.setup-mascot` — add the gentle float animation from the website hero.
4. `.setup-list > div` — replace with `.card` component. Add staggered animation on entrance.
5. `.setup-actions button` — replace with `.btn-primary` and `.btn-secondary` / `.btn-ghost`.
6. `.progress-track` — style with the progress bar component from §9.8.
7. `.progress-fill` — add the shimmer animation from §8.

#### Phase 4: Sidebar (Lines 41-52)
The sidebar is currently a 230px plain strip. Make it a **glass navigation**:

```css
.side {
  width: 240px;  /* bumped from 230px for breathing room */
  flex: none;
  padding: var(--space-6) var(--space-5);
  border-right: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
```

The `.brand` section should be more prominent:
```css
.brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--line);
}
.brand img {
  width: 48px;  /* bumped from 44px */
  height: 48px;
  filter: drop-shadow(0 6px 12px rgba(201, 100, 66, 0.35));
}
.bname {
  font-weight: 700;
  font-size: var(--text-h3);
  color: var(--coral);
}
.btag {
  font-size: var(--text-caption);
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
```

Replace `.navitem` styling with the navigation component from §8 (with the translateX hover nudge).

#### Phase 5: Main Content Area (Lines 56-59)
```css
.main {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-10) var(--space-8);
  overscroll-behavior: contain;
}
.page {
  max-width: 720px;
  /* Add page transition animation */
  opacity: 0;
  transform: translateX(8px);
  transition: opacity 0.25s var(--ease-out), transform 0.25s var(--ease-out);
  display: none;
}
.page:not([hidden]) {
  display: block;
  opacity: 1;
  transform: translateX(0);
}
```

#### Phase 6: Pursuit Editor (Lines 62-83)
1. `.prow-edit` — replace with `.card` component from §9.4. Add `animation: scaleIn 0.3s var(--ease-out) both;` when a new pursuit is added.
2. `.prow-edit input.name` — replace with `.input` component.
3. `.prow-edit input.kw` — replace with `.input` component.
4. `.ghostbtn` — replace with `.btn-ghost` component.
5. `.recent-apps .app` — add hover animation: `transform: translateY(-1px); box-shadow: var(--shadow-sm);`.

#### Phase 7: Privacy Tiers (Lines 98-108)
1. `.tierlegend > div` — use `.card` component.
2. `.tierrow` — use `.card` component but with reduced padding (`padding: 12px 16px`).
3. `.seg` — replace with `.seg-control` component from §9.7. This is a CRITICAL fix — the current segmented control looks like a 2015 iOS mockup. The new one has depth, shadow on the active pill, and smooth transitions.

#### Phase 8: Agent Settings (Jarvis) (Lines 111-121)
1. `.agentbox` — use `.card` component.
2. `.field` — use `.input` component.
3. `.fieldlabel` — add `text-transform: uppercase; letter-spacing: 0.06em;` (already there, good).
4. `.jarvis-grid` — bump gap to `var(--space-4)`.

#### Phase 9: Premium Page (Lines 132-136)
1. `.prem-status` — add more visual hierarchy. The email should be `--text-body` size, the badge should use `.badge` component.
2. `#premUpgrade` button — this is the PRIMARY CTA. Style it with `.btn-primary` and add a subtle sparkle animation or gradient shimmer on hover to communicate "premium."
3. Add a `.premium-card` visual treatment — a border with `rgba(201, 100, 66, 0.25)` and a subtle inner glow.

#### Phase 10: Buttons Global (Lines 86-91)
Replace ALL button styles with the component library from §9:
- `.save` → `.btn-primary`
- `.ghostsave` → `.btn-secondary` (or keep `.ghostsave` for tertiary actions but with the `.btn-ghost` style)

### File: `renderer/app.js` (Page Transition Logic)

The app currently uses `hidden` attribute to toggle pages. To enable the CSS page transitions, add an `active` class:

```javascript
// In the page-switching logic (look for where navitems are clicked):
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => {
    p.hidden = true;
    p.classList.remove('active');
  });
  // Show target page
  const target = document.getElementById('page-' + pageId);
  if (target) {
    target.hidden = false;
    // Small delay to allow the display:block to apply before the opacity transition
    requestAnimationFrame(() => {
      target.classList.add('active');
    });
  }
}
```

### File: `renderer/panel.css` (Chat Panel)

#### Phase 1: Foundation
Replace `:root` with the full design system.

#### Phase 2: Glass Enhancement
The panel already has glass but it's not strong enough. Bump it:
```css
.card {
  background:
    radial-gradient(600px 300px at 85% -10%, rgba(201, 100, 66, 0.16), transparent 60%),
    linear-gradient(165deg, rgba(252, 249, 245, 0.94), rgba(244, 238, 229, 0.94));
  backdrop-filter: blur(32px) saturate(160%);  /* was 24px/150% */
  -webkit-backdrop-filter: blur(32px) saturate(160%);
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);  /* 22px, keep existing */
  box-shadow: 0 28px 70px rgba(80, 60, 40, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.6);
}
```

#### Phase 3: Header
1. `.header` — add `padding: var(--space-4) var(--space-5) var(--space-3);`.
2. `.avatar` — bump to `44px` and add the gentle float animation.
3. `.icobtn` — add hover animation with translate and the coral color transition.

#### Phase 4: Chat Messages
Replace `.msg` with the component from §9.9. Add the `border-bottom-left-radius: 4px` and `border-bottom-right-radius: 4px` for the speech bubble tail effect.

#### Phase 5: Progress Bars (`.prow .track`)
Replace with `.progress-bar` component from §9.8. Bump height from `6px` to `8px`.

#### Phase 6: Input Bar
```css
.inputbar {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5) var(--space-5);
}
#q {
  flex: 1;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.8);
  border-radius: var(--radius-md);  /* 12px, was 12px */
  padding: 10px 14px;
  font-size: 13px;
  color: var(--ink);
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
}
#q:focus {
  border-color: var(--coral-light);
  background-color: #fff;
  box-shadow: 0 0 0 3px var(--coral-glow), 0 2px 8px rgba(47, 39, 31, 0.06);
}
#send {
  width: 44px;  /* was 40px */
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: #fff;
  font-size: 14px;
  background: linear-gradient(140deg, var(--coral), var(--coral-light));
  box-shadow: 0 4px 12px rgba(201, 100, 66, 0.25);
  transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.15s ease;
}
#send:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(201, 100, 66, 0.35);
  filter: brightness(1.04);
}
#send:active {
  transform: scale(0.95);
}
```

### File: `renderer/buddy.css` (Buddy Window)

#### Phase 1: Foundation
Replace `:root` with the full design system.

#### Phase 2: Glass Enhancement
Same as panel — bump blur to `32px` and saturation to `160%`. Add the inset shadow.

#### Phase 3: CSS Mascot (Lines 31-44)
The current CSS mascot is a placeholder. Even before we get the clay render, we can make it MUCH better:

```css
.pesto {
  position: relative;
  width: 40px;  /* was 38px */
  height: 40px;
  flex: none;
  animation: gentlePulse 4s ease-in-out infinite;
}
.pesto .core {
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #f0b49c, var(--coral) 66%, #b0512f);
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.6), 0 4px 12px rgba(201, 100, 66, 0.3);
  z-index: 2;
}
.pesto .ray {
  position: absolute;
  left: 16px;
  top: 0;
  width: 8px;
  height: 40px;
  border-radius: 4px;
  background: linear-gradient(var(--coral-light), var(--coral));
  z-index: 1;
  box-shadow: 0 2px 6px rgba(201, 100, 66, 0.2);
}
/* ... ray rotations stay the same ... */
.pesto .eye {
  position: absolute;
  top: 15px;
  width: 5px;  /* was 4px */
  height: 6px;  /* was 5px */
  border-radius: 50%;
  background: #3a2a22;
  z-index: 3;
}
.pesto .eye.l { left: 14px; }
.pesto .eye.r { left: 23px; }
.pesto .mouth {
  position: absolute;
  top: 24px;
  left: 15px;
  width: 10px;  /* was 9px */
  height: 5px;  /* was 4px */
  border-radius: 0 0 7px 7px;
  background: #7a3a24;
  z-index: 3;
}
```

#### Phase 4: Today Panel (Lines 47-55)
1. `.today` — make it a `.glass-card` instead of plain rgba.
2. Add `max-height: 180px` with smooth scrollbar styling.
3. `.prow .track` — use `.progress-bar` component (8px height).

#### Phase 5: Chat & Input
Same changes as panel.css §11 Phase 4-6.

### File: `renderer/warden.html` (Warden Overlay)

#### Phase 1: Card Size
Increase the card width from `400px` to `480px` and add more padding:
```css
.card {
  width: 480px;
  padding: 28px 32px;
  border-radius: var(--radius-xl);  /* 22px, keep */
  background: rgba(255, 255, 255, 0.92);  /* stronger opacity */
  backdrop-filter: blur(32px) saturate(160%);
  -webkit-backdrop-filter: blur(32px) saturate(160%);
  border: 1px solid rgba(201, 100, 66, 0.3);  /* coral-tinted border */
  box-shadow: 0 28px 70px rgba(80, 60, 40, 0.55), inset 0 1px 2px rgba(255, 255, 255, 0.6);
}
```

#### Phase 2: Dark Overlay
Add a warm dark overlay behind the card:
```css
.wrap {
  height: 100vh;
  display: grid;
  place-items: center;
  background: rgba(47, 39, 31, 0.45);  /* warm dark overlay */
  backdrop-filter: blur(4px);  /* slight blur on the screen behind */
}
```

#### Phase 3: Countdown Timer
1. `.count` — increase to `96px` width/height, `56px` font size. Add a subtle pulse animation when the countdown is active (under 5 seconds).
2. `.bar` — use `.progress-bar` component (8px height).
3. `.fill` — add a `transition: width 0.25s linear` and a warm glow.

#### Phase 4: Buttons
Replace with `.btn-primary` and `.btn-secondary` components.

### File: `renderer/orb.html` (Floating Orb)

#### Phase 1: Animation
Replace the simple bob with the enhanced orb animation from §8. Add the hover lift and active squish.

#### Phase 2: Glow
Enhance the drop-shadow on hover to use the coral glow. The current filter is good but could be more dramatic on hover:
```css
#orb:hover img {
  transform: translateY(-6px) scale(1.12);
  filter: drop-shadow(0 16px 28px rgba(201, 100, 66, 0.55));
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease;
}
```

---

## 12. Asset Requirements

### Immediate (Can be done with CSS/code)
- ✅ The design system is 100% CSS-implementable. No new image assets needed for the revamp itself.

### Future (Not blocking the revamp, but noted)
- 🔄 **Pesto clay mascot renders** — The design-prompt.md specifies a 3D clay-style coral starburst character. The current `screenbuddy_mascot_idle.png` is a flat PNG. The CSS placeholder in `buddy.css` should be replaced with the actual image when available. The revamp makes the placeholder look better, but the real asset will be a major upgrade.
- 🔄 **Pesto state renders** — idle, thinking, drill-sergeant, celebrating. These should be in a sprite sheet or individual PNGs for the app to swap between.
- 🔄 **Rive/Lottie animations** — For the mascot's emotional states (SPEC.md §9 mentions this). The CSS animations in this revamp are a stopgap until Rive/Lottie is integrated.
- 🔄 **Website hero illustration** — The hero could use a more dynamic composition with Pesto, not just a floating PNG. Consider a small scene with Pesto "guarding" a laptop.

---

## 13. Implementation Order & Checklist

### The Order Matters
Do NOT jump around. Each phase builds on the previous. If an agent runs out of tokens, they should finish their current phase and note where they stopped.

### Phase A: Foundation (ALL files)
- [ ] Create `renderer/design-tokens.css` — a single file containing ALL the `:root` CSS variables from §3-§6.
- [ ] Create `screenbuddy-site/design-tokens.css` — same tokens, but with website-specific additions (larger display sizes, wider spacing).
- [ ] **Website:** Update `styles.css` to import the tokens and replace the `:root` block.
- [ ] **App:** Update `app.css` to import the tokens and replace the `:root` block.
- [ ] **Panel:** Update `panel.css` to import the tokens and replace the `:root` block.
- [ ] **Buddy:** Update `buddy.css` to import the tokens and replace the `:root` block.
- [ ] **Warden:** Update `warden.html` inline `<style>` to use the tokens (or extract to a shared CSS file).
- [ ] **Orb:** Update `orb.html` inline `<style>` to use the tokens.

> **Agent checkpoint:** If you stop here, the next agent should verify all files have the new tokens and then proceed to Phase B.

### Phase B: Global Components (ALL files)
- [ ] **Website:** Replace `.download` with `.btn-primary`, `.secondary` with `.btn-secondary`.
- [ ] **App:** Replace `.save` with `.btn-primary`, `.ghostsave` with `.btn-secondary` or `.btn-ghost`.
- [ ] **All:** Replace input fields with `.input` component.
- [ ] **All:** Replace progress bars with `.progress-bar` component.
- [ ] **All:** Add animation keyframes to all CSS files.
- [ ] **All:** Add hover/active states to all interactive elements.

> **Agent checkpoint:** If you stop here, the next agent should verify buttons, inputs, and progress bars look correct across all files, then proceed to Phase C.

### Phase C: Website Sections (screenbuddy-site/)
- [ ] **Hero:** Typography overhaul, warm gradient background, mascot float animation, entrance animations.
- [ ] **Status strip:** Glass treatment, enhanced shadows.
- [ ] **Feature bands:** Card treatment, staggered entrance animations.
- [ ] **Setup band:** Card treatment, staggered animations.
- [ ] **Problem band:** Card treatment, left-border accents (keep existing but enhance).
- [ ] **Trust band:** Glass cards, centered layout, icons.
- [ ] **Privacy FAQ:** Card treatment, numbered badges become circle badges.
- [ ] **Support page:** Glass card, form input styling, enhanced sad Pesto.
- [ ] **Responsive:** Mobile hero adjustments, mascot visibility fix.

> **Agent checkpoint:** If you stop here, the next agent should verify the website looks correct on desktop and mobile, then proceed to Phase D.

### Phase D: App Shell (renderer/app.css + app.html)
- [ ] **Body background:** Enhanced warm gradient with dual radial accents.
- [ ] **Setup gate:** Glass panel, mascot float, card styling for list items, progress bar shimmer.
- [ ] **Sidebar:** Glass navigation, enhanced brand section, hover nudge on nav items.
- [ ] **Main content:** Page transition animations, proper spacing.
- [ ] **Pursuit editor:** Card treatment, input styling, ghost button styling.
- [ ] **Privacy tiers:** Card treatment, NEW segmented control (CRITICAL fix).
- [ ] **Jarvis settings:** Card treatment, input styling, grid spacing.
- [ ] **Premium page:** Premium visual treatment, badge styling, enhanced CTA button.
- [ ] **app.js:** Add `active` class logic for page transitions.

> **Agent checkpoint:** If you stop here, the next agent should verify the app navigation and all four pages look correct, then proceed to Phase E.

### Phase E: Panel & Buddy (renderer/panel.css + buddy.css)
- [ ] **Panel:** Enhanced glass (blur 32px), header styling, chat bubble speech-tail effect, progress bars, input focus glow, send button hover.
- [ ] **Buddy:** Enhanced glass, CSS mascot improvements (even as placeholder), today panel glass treatment, progress bars, chat improvements, input improvements.
- [ ] **Warden:** Card enlargement, dark overlay, enhanced countdown, button components.
- [ ] **Orb:** Enhanced hover/active animations, glow effects.

> **Agent checkpoint:** If you stop here, the next agent should verify all floating windows look correct, then proceed to Phase F.

### Phase F: Polish & Bug Fixes
- [ ] **Scrollbars:** Style custom scrollbars for all scrollable areas (`::-webkit-scrollbar`) with warm colors.
- [ ] **Focus states:** Ensure all interactive elements have visible focus rings (for accessibility).
- [ ] **Reduced motion:** Add `@media (prefers-reduced-motion: reduce)` to disable animations for users who need it.
- [ ] **Dark mode consideration:** The app is explicitly light-mode. Add a note that dark mode is NOT in scope for this revamp.
- [ ] **Cross-browser:** Verify `-webkit-backdrop-filter` is present everywhere `backdrop-filter` is used.
- [ ] **Test the build:** Run the website and app locally to verify nothing is broken.

---

## Appendix: Quick Reference — What Changes in Each File

| File | Lines Changed | Key Changes |
|------|--------------|-------------|
| `screenbuddy-site/styles.css` | ~90% rewritten | Full design system, new components, animations, glassmorphism |
| `screenbuddy-site/index.html` | ~5 lines | Add `class="card"` and `class="stagger-children"` to elements |
| `screenbuddy-site/support.html` | ~5 lines | Add `class="card"` to support card |
| `renderer/app.css` | ~85% rewritten | Full design system, glass sidebar, new segmented control, page transitions, card styling |
| `renderer/app.html` | ~2 lines | Add `class="active"` logic hook (JS handles it) |
| `renderer/app.js` | ~10 lines | Add `active` class alongside `hidden` removal |
| `renderer/panel.css` | ~70% rewritten | Enhanced glass, speech-tail chat bubbles, progress bars, input focus glow |
| `renderer/buddy.css` | ~70% rewritten | Enhanced glass, CSS mascot polish, today panel, progress bars |
| `renderer/warden.html` | ~30 lines | Larger card, dark overlay, enhanced countdown, button components |
| `renderer/orb.html` | ~10 lines | Enhanced hover/active animations |

---

## Appendix: CSS-Only Token Files (Copy-Paste Ready)

### `renderer/design-tokens.css`
```css
/* ScreenBuddy App — Design Tokens */
/* Paste this at the top of app.css, panel.css, buddy.css OR import as a separate file */

:root {
  /* Colors */
  --coral: #C96442;
  --coral-light: #E0895F;
  --coral-dark: #9F3D25;
  --coral-glow: rgba(201, 100, 66, 0.28);
  --ink: #2F2B25;
  --ink-soft: #4A443C;
  --muted: #8A8377;
  --faint: #B7B0A4;
  --line: rgba(60, 50, 40, 0.10);
  --line-strong: rgba(60, 50, 40, 0.18);
  --paper: #FAF7F2;
  --paper-gradient-start: #FFFDFA;
  --paper-gradient-mid: #F4EFE6;
  --paper-gradient-end: #F9F8F4;
  --surface: #FFFFFF;
  --surface-glass: rgba(255, 255, 255, 0.72);
  --surface-glass-strong: rgba(255, 255, 255, 0.88);
  --surface-elevated: #FFFFFF;
  --surface-warm: #FBF9F5;
  --sage: #7F9C8C;
  --sage-soft: rgba(127, 156, 140, 0.14);
  --amber: #D8A84E;
  --amber-soft: rgba(216, 168, 78, 0.14);
  --blue: #2D596F;
  --blue-soft: rgba(45, 89, 111, 0.10);

  /* Typography */
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
  --text-display: clamp(2.5rem, 5vw, 4.5rem);
  --text-display-line: 1.05;
  --text-display-weight: 800;
  --text-display-letter: -0.03em;
  --text-h1: clamp(1.75rem, 3vw, 2.5rem);
  --text-h1-line: 1.1;
  --text-h1-weight: 700;
  --text-h1-letter: -0.02em;
  --text-h2: clamp(1.25rem, 2vw, 1.75rem);
  --text-h2-line: 1.15;
  --text-h2-weight: 700;
  --text-h2-letter: -0.01em;
  --text-h3: 1.125rem;
  --text-h3-line: 1.25;
  --text-h3-weight: 600;
  --text-body: 0.9375rem;
  --text-body-line: 1.6;
  --text-body-weight: 400;
  --text-body-sm: 0.8125rem;
  --text-body-sm-line: 1.5;
  --text-body-sm-weight: 400;
  --text-caption: 0.6875rem;
  --text-caption-line: 1.4;
  --text-caption-weight: 700;
  --text-caption-letter: 0.08em;
  --text-micro: 0.625rem;
  --text-micro-line: 1.3;
  --text-micro-weight: 800;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-xl: 22px;
  --radius-full: 999px;

  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(47, 39, 31, 0.06);
  --shadow-md: 0 8px 24px rgba(47, 39, 31, 0.08);
  --shadow-lg: 0 18px 46px rgba(47, 39, 31, 0.12);
  --shadow-xl: 0 28px 70px rgba(47, 39, 31, 0.16);
  --shadow-coral: 0 14px 26px rgba(201, 100, 66, 0.24);
  --shadow-coral-lg: 0 18px 40px rgba(201, 100, 66, 0.32);
  --shadow-inset: inset 0 1px 2px rgba(255, 255, 255, 0.6);
  --shadow-glass: var(--shadow-md), var(--shadow-inset);

  /* Animation */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-slow: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-instant: 0.1s;
  --duration-fast: 0.15s;
  --duration-normal: 0.25s;
  --duration-slow: 0.4s;
  --duration-dramatic: 0.6s;
}
```

### `screenbuddy-site/design-tokens.css`
```css
/* ScreenBuddy Website — Design Tokens */
/* Same as app tokens but with larger display sizes for the hero */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* Use the same :root as above, but override these: */
:root {
  /* ... all app tokens ... */
  
  /* Website overrides */
  --text-display: clamp(3rem, 7vw, 5.5rem);  /* Larger hero title */
  --text-h1: clamp(2rem, 4vw, 3.5rem);
  --space-section: var(--space-20);  /* 80px between sections */
}
```

> **Note:** The Google Fonts import for Inter is optional. If offline loading is a concern, use the system font stack fallback. The app already uses system fonts, which is correct for a desktop app.

---

> **END OF DOCUMENT.** This is the complete design system and revamp plan for ScreenBuddy. Any agent picking this up should start at Phase A (Foundation) and work through to Phase F (Polish). Do not skip phases. If you run out of tokens, document exactly which phase and which file you were working on.
