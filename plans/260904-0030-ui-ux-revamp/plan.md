# Plan: Comprehensive UI/UX Revamp (Retro-Arcade Polish)

## 1. Overview

- **Objective**: Implement the full UI/UX revamp checklist as specified in `DESIGN.md` and `plans/reports/advise-260904-0030-ui-ux-design-md.md`.
- **Aesthetic**: Retro-Arcade Polish (Neo-brutalist arcade, Cream `#f3e5df`, Ink `#000000`, Marquee `#faa21f`, Buy `#128e44`, hard shadows, arcade bevels, active press-down translation).
- **Core Strategy**:
  1. Define global design tokens & utilities in `src/styles.css` (Tailwind v4 `@theme inline` & `@utility`).
  2. Implement Hybrid Typography (`font-arcade` for headings/badges/buttons, clean readable sans for mobile body/form fields).
  3. Upgrade UI primitives across the Core Funnel: Header, Hero 3D Viewer, Shop Catalog, Product Detail, Cart Drawer, and Checkout.
  4. Preserve all existing business logic, server crypto, Stripe webhook, rate limiting, and cart storage.

---

## 2. Phases

### Phase 1: Global Tokens & Utilities (`src/styles.css`)

- Configure font stacks: `--font-arcade` and `--font-sans`.
- Add hard-shadow utilities:
  - `.arcade-box`: `3px 3px 0px 0px var(--ink)`
  - `.arcade-box-lg`: `6px 6px 0px 0px var(--ink)`
  - `.arcade-box-sm`: `2px 2px 0px 0px var(--ink)`
- Add arcade button interactive utilities:
  - `.arcade-btn-active`: `active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`
- Ensure WCAG AA color compliance.

### Phase 2: Navigation & Hero Area

- `src/components/frankys/Header.tsx`:
  - Cart counter bounce badge with arcade font.
  - Sound mute toggle with clear arcade status indicator (`MUTE` / `AUDIO ON`).
- `src/components/frankys/Cap3DViewer.tsx` & `src/routes/index.tsx`:
  - Touch interaction guide for mobile ("DRAG TO ROTATE 360°").
  - Tactile preset angle buttons with `.arcade-box` and press down state.
  - Smooth fallback image support.

### Phase 3: Shop Catalog & Product Detail (PDP)

- `src/components/frankys/VariantCard.tsx`:
  - Hard 2px border, `arcade-box` shadow, crisp hover lift.
  - Limited / In-stock pixel badges.
- `src/routes/shop.index.tsx` & `src/routes/shop.$slug.tsx`:
  - Clean responsive grid layout (`max-w-7xl`).
  - Size selector with tactile buttons.
  - Breadcrumb and sticky quick-add on mobile.

### Phase 4: Cart Drawer & Checkout Flow

- `src/components/frankys/CartDrawer.tsx`:
  - Fix ESLint warning on useEffect dependency.
  - Tactile quantity counters `[ - ]` and `[ + ]`.
  - Upsell cards with compact arcade frame.
  - Sticky checkout button on mobile with full 44px+ touch target.
- `src/routes/checkout.tsx`:
  - Hybrid typography: form labels in arcade font, form input text in clean sans-serif for 0% input error rate.
  - Order summary card with arcade ticket styling.

### Phase 5: Verification & Testing

- Run `vitest run` (ensure all 24 unit/integration tests pass).
- Run `eslint .` (ensure zero errors/warnings).
- Run `vite build` (ensure production bundle compiles cleanly).

---

## 3. Acceptance Criteria

- [x] `DESIGN.md` tokens fully reflected in `src/styles.css`.
- [x] No regression in tests (`npm run test` passes 100%).
- [x] Zero build or ESLint errors.
- [x] All interactive buttons have tactile press-down states (`active:translate-y-[2px]`).
- [x] Mobile form inputs legible with system sans.
- [x] Touch targets $\ge 44 \times 44\text{px}$.
