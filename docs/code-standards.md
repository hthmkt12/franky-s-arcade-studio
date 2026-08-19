# Code Standards & Guidelines — Franky's Arcade Studio

## 1. Architectural Conventions

- **Framework**: TanStack Start with TanStack Router file-based routing in `src/routes/`.
- **Component Design**: Functional components with strict TypeScript typings.
- **State Management**:
  - Global server state: TanStack Query.
  - Local client cart state: React Context with LocalStorage persistence.
  - Form validation: Zod schemas shared across client forms and server endpoints.

---

## 2. Audio Engine Standards (`src/lib/audio/arcade-audio.ts`)

- **Synthesizer Implementation**: Always use native browser `AudioContext` and Web Audio oscillators.
- **No External Audio Files**: Do not import `.mp3`, `.wav`, or `.ogg` files.
- **Error Resilience**: Wrap all Web Audio graph executions in `try/catch` to prevent unmuted autoplay policy rejections from breaking the UI.
- **Mute Persistence**: All audio triggers must check `this.isMuted` before instantiating or playing oscillators.

---

## 3. Security & Cryptography Guidelines (`src/lib/server-crypto.ts`)

- **Guest Security**: Use `signOrderToken(orderId, email)` for guest order confirmations.
- **Verification**: Always use `crypto.timingSafeEqual` in `verifyOrderToken` to defend against timing attacks.
- **Price Integrity**: Never trust client-sent subtotal or total amounts. Always re-fetch product prices in `POST /api/orders` from the Supabase database.
- **Secrets Management**: Read secrets (`SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) exclusively from environment variables on the server.

---

## 4. Design & Styling Rules

- **Palette**:
  - Cream Paper: `#f3e5df` (`var(--cream)`)
  - Ink / Pixel Black: `#0f0f11` (`var(--ink)`)
  - Signal Orange Marquee: `#faa21f` (`var(--marquee)`)
  - Buy Green: `#128e44` (`var(--buy)`)
- **Borders & Shadows**: Strict 1px / 2px pixel borders (`arcade-bevel`, `border-ink`), no soft blur dropshadows.
- **Typography**: Header text in `var(--font-arcade)`, body numeric / tabular text in `VT323, monospace`.
