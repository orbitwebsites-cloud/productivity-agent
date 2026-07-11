# ScreenBuddy Design System

**Version:** 1.0.0  
**Theme:** Dark Glass (Default)  
**Last Updated:** 2025-07-10

---

## 1. Design Tokens

### Colors

```css
/* Brand */
--coral: #E8845C;
--coral-light: #F2A078;
--coral-dark: #C96442;
--coral-glow: rgba(232, 132, 92, 0.3);
--coral-soft: rgba(232, 132, 92, 0.10);

/* Accents */
--sage: #7F9C8C;
--sage-soft: rgba(127, 156, 140, 0.14);
--amber: #D8A84E;
--amber-soft: rgba(216, 168, 78, 0.14);
--blue: #2D596F;
--blue-soft: rgba(45, 89, 111, 0.10);

/* Backgrounds (Dark) */
--bg-deep: #060810;
--bg-mid: #0b0e18;

/* Glass System */
--glass-ultra-thin: rgba(255, 255, 255, 0.03);
--glass-thin: rgba(255, 255, 255, 0.05);
--glass-bg: rgba(255, 255, 255, 0.07);
--glass-bg-hover: rgba(255, 255, 255, 0.12);
--glass-bg-active: rgba(255, 255, 255, 0.16);
--glass-border: rgba(255, 255, 255, 0.10);
--glass-border-strong: rgba(255, 255, 255, 0.16);
--glass-border-accent: rgba(232, 132, 92, 0.22);

/* Glass Effects */
--glass-blur: blur(24px) saturate(180%);
--glass-blur-strong: blur(40px) saturate(200%);
--glass-blur-light: blur(12px) saturate(150%);
--glass-highlight: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 50%, transparent 100%);
--glass-highlight-strong: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 40%, transparent 100%);

/* Text */
--text-primary: rgba(255, 255, 255, 0.93);
--text-secondary: rgba(255, 255, 255, 0.62);
--text-tertiary: rgba(255, 255, 255, 0.38);
--text-on-coral: #FFFFFF;

/* Shadows (Layered for Depth) */
--shadow-sm: 0 2px 8px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.15);
--shadow-md: 0 8px 24px rgba(0,0,0,0.30), 0 2px 6px rgba(0,0,0,0.15);
--shadow-lg: 0 18px 46px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.18);
--shadow-xl: 0 28px 70px rgba(0,0,0,0.45), 0 8px 20px rgba(0,0,0,0.20);
--shadow-coral: 0 8px 24px rgba(232,132,92,0.28), 0 2px 8px rgba(232,132,92,0.15);
--shadow-coral-lg: 0 14px 36px rgba(232,132,92,0.35), 0 4px 12px rgba(232,132,92,0.20);
--shadow-inset: inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.12);

/* Radius */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 18px;
--radius-xl: 22px;
--radius-full: 999px;

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
```

### Typography

```css
--font-display: 'Fraunces Variable', Georgia, serif;
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;

--text-display: clamp(2.5rem, 5vw, 4.5rem);
--text-h1: clamp(1.75rem, 3vw, 2.5rem);
--text-h2: clamp(1.25rem, 2vw, 1.75rem);
--text-h3: 1.125rem;
--text-body: 0.9375rem;
--text-body-sm: 0.8125rem;
--text-caption: 0.6875rem;
--text-micro: 0.625rem;
```

### Spacing

```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
```

---

## 2. Component Primitives

### Glass Card
```css
.glass-card {
  position: relative;
  overflow: hidden;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md), var(--shadow-inset);
}
.glass-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 40%;
  background: var(--glass-highlight);
  pointer-events: none;
  border-radius: inherit;
}
```

### Glass Surface (lighter)
```css
.glass-surface {
  background: var(--glass-thin);
  backdrop-filter: var(--glass-blur-light);
  -webkit-backdrop-filter: var(--glass-blur-light);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
}
```

### Buttons

```css
.btn-primary {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 44px; padding: 0 var(--space-6);
  border: none; border-radius: var(--radius-md);
  font-family: var(--font-sans); font-size: var(--text-body-sm);
  font-weight: 600; color: #fff;
  background: linear-gradient(135deg, var(--coral), var(--coral-light));
  box-shadow: var(--shadow-coral);
  position: relative; overflow: hidden;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}
.btn-primary::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 60%, transparent 100%);
  pointer-events: none; border-radius: inherit;
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: var(--shadow-coral-lg); filter: brightness(1.08); }
.btn-primary:active { transform: translateY(0) scale(0.97); transition-duration: var(--duration-instant); }

.btn-secondary {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 44px; padding: 0 var(--space-5);
  border: 1px solid var(--glass-border-strong); border-radius: var(--radius-md);
  font-family: var(--font-sans); font-size: var(--text-body-sm);
  font-weight: 600; color: var(--text-primary);
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur-light); -webkit-backdrop-filter: var(--glass-blur-light);
  cursor: pointer; transition: all var(--duration-fast) var(--ease-out);
}
.btn-secondary:hover { background: var(--glass-bg-hover); border-color: var(--glass-border-accent); box-shadow: var(--shadow-sm); }

.btn-ghost {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 40px; padding: 0 var(--space-4);
  border: 1px dashed var(--glass-border-accent); border-radius: var(--radius-md);
  font-family: var(--font-sans); font-size: var(--text-body-sm);
  font-weight: 600; color: var(--coral);
  background: var(--coral-soft);
  cursor: pointer; transition: all var(--duration-fast) var(--ease-out);
}
.btn-ghost:hover { background: rgba(232,132,92,0.16); border-color: rgba(232,132,92,0.45); transform: translateY(-1px); }
```

### Input Field
```css
.input {
  width: 100%; min-height: 44px;
  padding: 10px 14px;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-sans); font-size: var(--text-body-sm);
  color: var(--text-primary);
  background: rgba(255,255,255,0.04);
  outline: none;
  transition: all var(--duration-fast) var(--ease-out);
}
.input::placeholder { color: var(--text-tertiary); }
.input:focus {
  border-color: var(--coral);
  background: rgba(255,255,255,0.08);
  box-shadow: 0 0 0 3px var(--coral-glow), var(--shadow-sm);
}
```

### Segmented Control
```css
.seg-control {
  display: flex;
  background: rgba(255,255,255,0.06);
  border-radius: var(--radius-md);
  padding: 3px; gap: 2px;
}
.seg-control button {
  flex: 1; border: none; background: transparent;
  font-family: var(--font-sans); font-size: 0.75rem; font-weight: 600;
  color: var(--text-secondary); padding: 7px 12px;
  border-radius: 10px; cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}
.seg-control button.on {
  background: var(--glass-bg-active);
  color: var(--coral); font-weight: 700;
  box-shadow: var(--shadow-sm), var(--shadow-inset);
}
.seg-control button:hover:not(.on) {
  background: rgba(255,255,255,0.08);
  color: var(--text-primary);
}
```

---

## 3. Patterns

### Page Entrance
```css
.page-enter {
  animation: fadeInUp 0.4s var(--ease-out) both;
}
.stagger-children > * {
  animation: fadeInUp 0.5s var(--ease-out) both;
}
.stagger-children > *:nth-child(1) { animation-delay: 0.05s; }
.stagger-children > *:nth-child(2) { animation-delay: 0.1s; }
.stagger-children > *:nth-child(3) { animation-delay: 0.15s; }
.stagger-children > *:nth-child(4) { animation-delay: 0.2s; }
.stagger-children > *:nth-child(5) { animation-delay: 0.25s; }
```

### Focus Ring (Accessibility)
```css
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--coral-glow), var(--shadow-sm);
  border-color: var(--coral);
}
```

### Loading State
```css
.loading {
  position: relative; overflow: hidden; color: transparent;
}
.loading::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  animation: shimmer 1.5s infinite;
}
```

### Success Ripple
```css
@keyframes ripple {
  0% { transform: scale(0); opacity: 0.5; }
  100% { transform: scale(4); opacity: 0; }
}
.ripple {
  position: relative; overflow: hidden;
}
.ripple::after {
  content: '';
  position: absolute; inset: -50%;
  background: radial-gradient(circle, var(--coral) 0%, transparent 70%);
  animation: ripple 0.6s var(--ease-out);
  pointer-events: none;
}
```

---

## 4. Motion Guidelines

| Motion Type | Duration | Easing | Use Case |
|-------------|----------|--------|----------|
| Instant | 0.1s | ease-out | Button press, toggle |
| Fast | 0.15s | ease-out | Hover, focus |
| Normal | 0.25s | ease-out | Panel open, tooltip |
| Slow | 0.4s | ease-out-slow | Page transition, modal |
| Dramatic | 0.6s | ease-out-slow | Hero entrance, onboarding |
| Spring | 0.5s | ease-spring | Bouncy feedback, success |

**Reduced Motion:** All animations respect `prefers-reduced-motion: reduce` → 0.01ms duration.

---

## 5. Accessibility Checklist

- [ ] All interactive elements have `:focus-visible` styles
- [ ] Color contrast ≥ 4.5:1 for text, 3:1 for UI elements
- [ ] ARIA labels on icon-only buttons
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Focus trap in modals/panels
- [ ] Skip link for main content
- [ ] Live regions for dynamic updates
- [ ] Keyboard navigation for all custom controls

---

## 6. Performance Budget

| Metric | Target |
|--------|--------|
| CSS (gzipped) | < 15 KB |
| First paint | < 800ms |
| Animation FPS | 60fps (no jank) |
| Paint area per frame | < 20% viewport |
| Layout shifts | 0 (CLS = 0) |

---

## 7. Usage Rules

1. **Always import** `design-tokens.css` first in any renderer CSS
2. **Use tokens**, never hardcode colors/spacing
3. **Glass cards** get `::before` highlight automatically via `.glass-card`
3. **Buttons** use `.btn-primary`, `.btn-secondary`, `.btn-ghost`
4. **Inputs** use `.input` class
5. **Lists** use `.stagger-children` for entrance
6. **New components** must be documented here before merging
7. **Breaking token changes** require version bump and migration guide

---

## 8. Changelog

### v1.0.0 (2025-07-10)
- Initial dark glass theme
- Glass card system with highlight overlays
- Button/input/segment primitives
- Motion tokens and reduced-motion support
- Accessibility baseline