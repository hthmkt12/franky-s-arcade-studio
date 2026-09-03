# Franky's Arcade Studio — Design System Spec (DESIGN.md)

> Based on the 9-part design system specification from `awesome-design-md` (VoltAgent).
> Single Source of Truth (SSoT) for UI/UX, Component Styling, and AI Generation.

---

## 1. Visual Theme & Atmosphere

- **Archetype**: Retro-Arcade Polish / Neo-Brutalist Arcade.
- **Core Aesthetic**: 90s coin-op cabinet nostalgia meets modern responsive e-commerce.
- **Mood**: Tactile, punchy, playful yet premium. Clean warm cream ground balanced by high-contrast black ink, energetic arcade amber/orange accents, and arcade bevels.
- **Visual Signatures**:
  - Crisp 1px - 2px solid borders (`var(--ink)` or `var(--pixel)`).
  - Offset hard drop-shadows without blur (`3px 3px 0px 0px var(--ink)`).
  - Arcade button bevels (inset 1px highlight).
  - Subtle pixel art motifs, marquee ticker banners, and arcade coin/credit micro-copy.

---

## 2. Color Palette & Roles

### Semantic Palette (Tokens)

| Token                | Variable        | Hex       | Role & Usage                                       | WCAG AA Contrast          |
| :------------------- | :-------------- | :-------- | :------------------------------------------------- | :------------------------ |
| **Cream (Ground)**   | `--cream`       | `#f3e5df` | Canvas & page background, card surfaces            | SSoT Ground               |
| **Ink (Base)**       | `--ink`         | `#000000` | Primary text, primary button ground, solid borders | 15.2:1 on Cream           |
| **Carbon (Dark)**    | `--carbon`      | `#151515` | Dark modal overlays, header accents, dark cards    | 12.8:1 on Cream           |
| **Charcoal**         | `--charcoal`    | `#333333` | Secondary dark elements, subheadings               | 9.5:1 on Cream            |
| **Muted**            | `--muted`       | `#525252` | Tertiary text, helper hints, disabled borders      | 5.8:1 on Cream (Pass)     |
| **Pixel (Border)**   | `--pixel`       | `#e5e7eb` | Subtle dividers, secondary card frames             | Divider only              |
| **Marquee (Accent)** | `--marquee`     | `#faa21f` | Coin slots, highlight badges, primary callouts     | 2.1:1 (Use with Ink text) |
| **Buy (Success)**    | `--buy`         | `#128e44` | Add to Cart, Checkout CTA, In-stock pill           | 4.8:1 on Cream (Pass)     |
| **Destructive**      | `--destructive` | `#b00020` | Cart item removal, errors, alerts                  | 5.2:1 on Cream (Pass)     |

---

## 3. Typography Rules

### Font Stacks

- **Arcade / Heading Stack**: `"Press Start 2P", "VT323", monospace`
  - Used for: Brand logo, Main Hero Headings, Product Titles, Pricing, Badges, Game HUD.
- **Body & Form Stack (Hybrid System)**:
  - **Desktop**: `"VT323", monospace` (large font-size default, min 18px for legibility).
  - **Mobile**: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  - Used for: Checkout inputs, address forms, legal disclaimers, size charts, descriptions.

### Type Scale

- **Display 1**: `text-4xl md:text-6xl font-arcade uppercase tracking-wider`
- **Heading 2**: `text-2xl md:text-3xl font-arcade uppercase`
- **Subheading / Label**: `text-lg md:text-xl font-arcade tracking-wide`
- **Body Regular**: `text-base md:text-lg leading-relaxed`
- **Micro-copy / Badge**: `text-xs font-arcade uppercase tracking-widest`

---

## 4. Component Stylings

### Primary Action Button (`Buy / Checkout`)

- **Base**: `bg-[var(--buy)] text-white font-arcade uppercase px-6 py-3 rounded-[6px]`
- **Border & Shadow**: `border-2 border-[var(--ink)] shadow-[3px_3px_0px_0px_var(--ink)]`
- **Interaction**: `hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_var(--ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_var(--ink)]`
- **Bevel**: `inset 0 1px 0 0 rgba(255,255,255,0.3)`

### Secondary Action Button (`View / Select`)

- **Base**: `bg-[var(--cream)] text-[var(--ink)] font-arcade uppercase px-5 py-2.5 rounded-[6px]`
- **Border & Shadow**: `border-2 border-[var(--ink)] shadow-[2px_2px_0px_0px_var(--ink)]`
- **Interaction**: `hover:bg-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`

### Product & Variant Cards

- **Container**: `bg-[var(--cream)] border-2 border-[var(--ink)] rounded-[12px] p-4 shadow-[4px_4px_0px_0px_var(--ink)]`
- **Hover State**: Lift effect with 1px border shift or marquee border highlight.
- **Image Frame**: Crisp background with subtle checkerboard pattern (`checker-bg`) for transparent cap assets.

### Status Badges & Pills

- **In-Stock**: `bg-[var(--buy)] text-white text-xs font-arcade px-2.5 py-1 rounded-full border border-[var(--ink)]`
- **Limited / Marquee**: `bg-[var(--marquee)] text-[var(--ink)] text-xs font-arcade px-2.5 py-1 rounded-full border border-[var(--ink)] font-bold`

### Modals & Drawers

- **Overlay**: `bg-[var(--carbon)]/80 backdrop-blur-xs`
- **Content Box**: `bg-[var(--cream)] border-4 border-[var(--ink)] rounded-[12px] shadow-[8px_8px_0px_0px_var(--ink)]`
- **Header**: Arcade title bar with close button `[X]` shaped as arcade coin eject.

---

## 5. Layout Principles

- **Container Widths**:
  - App Content: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
  - Text / Story / About: `max-w-3xl mx-auto`
- **Grid Systems**:
  - Catalog: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`
  - Product Detail (PDP): Two-column split on desktop (`lg:grid-cols-12`, with 7 cols for 3D/Gallery and 5 cols for Purchase Action).
- **Spacing Rhythms**: Multiples of 4px (`p-2`, `p-4`, `p-6`, `p-8`, `gap-6`).

---

## 6. Depth & Elevation

- **Level 0 (Ground)**: Flat canvas, zero shadow.
- **Level 1 (Cards, Modules)**: Hard offset shadow `3px 3px 0px 0px var(--ink)`.
- **Level 2 (Active Cards, Popovers)**: Hard offset shadow `5px 5px 0px 0px var(--ink)`.
- **Level 3 (Floating Drawers, Modals)**: Hard offset shadow `8px 8px 0px 0px var(--ink)`.
- **Level 4 (Pressed Buttons)**: Offset reduced to `0px 0px` or `1px 1px` with translation down/right `translate-y-[2px] translate-x-[2px]`.

---

## 7. Do's and Don'ts

### Do

- **Do** keep hard borders and shadows crisp; pixel art requires clean edge definitions.
- **Do** use uppercase for headings, labels, and buttons in the arcade font.
- **Do** preserve audio feedback on interactive triggers (with mute option saved in localStorage).
- **Do** provide smooth fallback images (WebP) for the 3D Cap Viewer on low-end devices.
- **Do** maintain a minimum touch target size of 44x44px on mobile devices.

### Don't

- **Don't** use soft Gaussian blur shadows (`shadow-lg`, `shadow-2xl`) or glassmorphism gradients.
- **Don't** use tiny pixel fonts (<16px) for address forms and checkout inputs on mobile.
- **Don't** introduce pastel or neon tech colors that clash with the warm Cream/Ink/Marquee palette.
- **Don't** use pill buttons with smooth circular borders for primary arcade actions (prefer `rounded-[6px]`).

---

## 8. Responsive Behavior

| Breakpoint                    | Key UX Adjustments                                                                                                                                                                                                                                 |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mobile (`< 640px`)**        | - Body typography switches to legible System Sans for forms/descriptions.<br>- 3D Viewer shows touch-to-rotate guide or swipe carousel.<br>- Cart Drawer docks fixed at bottom with full-width CTA button.<br>- Spacing reduced from 24px to 16px. |
| **Tablet (`640px - 1024px`)** | - Catalog transforms to 2-column grid.<br>- 3D Cap viewer and details stack cleanly.<br>- Header collapse to hamburger arcade menu.                                                                                                                |
| **Desktop (`> 1024px`)**      | - Full arcade layout with persistent Marquee ticker.<br>- Interactive 3D Canvas with drag, zoom, and preset angle buttons.<br>- Full desktop pixel-art immersion.                                                                                  |

---

## 9. Agent Prompt Guide

When asking an AI agent to build or modify any component for Franky's Arcade Studio, prepend or inject the following prompt instruction:

> _"You are building UI for Franky's Arcade Studio. Follow DESIGN.md strictly. The aesthetic is Retro-Arcade Polish (Neo-brutalist arcade). Use the palette of Cream (`#f3e5df`), Ink (`#000000`), Marquee (`#faa21f`), and Buy (`#128e44`). Borders must be solid 2px ink with hard offset shadows (e.g., `shadow-[3px_3px_0px_0px_var(--ink)]`). Buttons must have active press-down translation. Use `font-arcade` for headings and buttons; use clean readable sans-serif for mobile body and form fields. Do not use soft blurred shadows or rounded-3xl corners."_
