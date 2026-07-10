# CommandCenter prototype

Isolated React + Vite prototype: a three-column "CommandCenter" layout
(`PursuitRail` / `ActivePursuitDrawer` / `SignalRail`) with a slide-over
drawer, a collapsible telemetry rail, and a "breathing" active state.
Scope: standalone prototype only, does not touch `renderer/`, `electron/`,
or any production code.

```
npm install
npm run dev      # http://localhost:5173
npm run build && npm run preview   # http://127.0.0.1:4173
```

## Interaction model

- Clicking a pursuit in `PursuitRail` opens `ActivePursuitDrawer` for that
  pursuit and stores the trigger button in a ref.
- The drawer closes via Escape, a backdrop click, or its close button.
- Focus follows the drawer's own CSS transition via `onTransitionEnd`
  (filtered to the `transform` property) rather than a fixed timeout, so it
  stays correct if the transition duration changes or `prefers-reduced-motion`
  shortens it:
  - opening → focuses the drawer heading (`tabIndex={-1}`, falls back to the
    close button)
  - closing → returns focus to the trigger button
- `isDrawerOpen` is ephemeral UI state and always resets to closed on load.
  `selectedId` (last-viewed pursuit) and `signalsExpanded` (telemetry rail
  state) persist to `localStorage`.

## Motion utilities (`src/elegance.css`)

- `.motion-drawer` / `.motion-backdrop` — slide-over transform + backdrop fade
- `.motion-breathe` — pulses `border-color` and an inset box-shadow on the
  active pursuit; border-width stays constant so it never shifts layout
- `.motion-collapse` — grid-template-rows based smooth collapse for the
  telemetry rail
- All of the above degrade to a near-zero transition duration (not `none`)
  under `prefers-reduced-motion: reduce`, so `transitionend` still fires and
  focus management keeps working

## Z-index hierarchy

`PursuitRail` / `SignalRail` (10) < `.motion-backdrop` (20) < `.motion-drawer` (30).

Brand tokens (coral / cream / sage) carried over from
`prototype/liquid-glass/BRIEF.md` for visual consistency with the rest of
the ScreenBuddy prototypes.
