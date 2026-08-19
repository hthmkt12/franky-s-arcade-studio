# Codebase Summary — Franky's Arcade Studio

## System Overview
Franky's Arcade Studio is a full-stack e-commerce web application inspired by retro arcade aesthetics (cream paper background `#f3e5df`, thick pixel borders, black-and-white checkerboard patterns, signal-orange `#faa21f` marquee, and punchy green `#128e44` buy accents). It sells handmade merino wool caps from Portugal.

The application runs on TanStack Start (Nitro server runtime) with React 19, TypeScript, TanStack Router (file-based routing), TanStack Query, Tailwind CSS v4, and Supabase for database storage and transactions.

---

## Architecture & Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend Framework** | React 19 & TanStack Start | Server and client hydration via TanStack Start (`@tanstack/react-start`) |
| **Routing** | TanStack Router | File-based routes in `src/routes/` with automatic type-safe tree generation (`routeTree.gen.ts`) |
| **State & Data Fetching** | TanStack Query | Client cache for products, order verification, and admin analytics |
| **Styling & Theme** | Tailwind CSS v4 & Custom CSS | Retro arcade design tokens, custom bevel borders, VT323 & Arcade pixel fonts |
| **Audio Engine** | Web Audio API | Zero-download native oscillator chiptune synthesizer (`src/lib/audio/arcade-audio.ts`) |
| **Database & RPC** | Supabase (PostgreSQL) | Atomic order creation via `create_order_tx` stored procedure and inventory control |
| **Security & Auth** | Node.js Crypto HMAC | Guest token signing for order verification without mandatory user login |
| **Payments** | Stripe API | Server-side checkout session creation and webhook status synchronization |

---

## Directory Structure

```
franky-s-arcade-studio/
├── docs/                        # Project documentation
│   ├── codebase-summary.md      # Summary of codebase architecture & features
│   ├── project-roadmap.md       # Milestones and upcoming roadmap
│   ├── project-overview-pdr.md  # Product requirements and specification
│   ├── system-architecture.md   # Architectural details and data flow
│   └── code-standards.md        # Code guidelines and best practices
├── src/
│   ├── assets/                  # Product imagery & static assets
│   ├── components/
│   │   ├── frankys/             # Domain components (PixelHorse, ArModal, Header, CartDrawer, etc.)
│   │   └── ui/                  # Reusable UI primitives (Radix UI wrappers)
│   ├── hooks/                   # Custom React hooks (e.g. use-mobile)
│   ├── integrations/
│   │   └── supabase/            # Supabase client (client & server-admin instances)
│   ├── lib/
│   │   ├── api/                 # API client, types, and shop endpoints
│   │   ├── audio/               # Pure Web Audio 8-bit Synthesizer
│   │   ├── cart/                # LocalStorage-backed cart context
│   │   ├── server-crypto.ts     # HMAC token generation & verification for orders
│   │   ├── stripe.server.ts     # Stripe checkout session generator
│   │   └── utils.ts             # Style merging and formatting helpers
│   ├── routes/                  # File-based routes and API handlers
│   │   ├── api/                 # Server endpoints (orders, products, stripe webhooks)
│   │   ├── checkout.tsx         # Checkout form with cheat code / promo integration
│   │   ├── checkout.success.$id.tsx # Order confirmation with guest token verification
│   │   ├── shop.index.tsx       # Catalog browsing
│   │   ├── shop.$slug.tsx       # Product details & size selector
│   │   └── index.tsx            # Landing page with interactive hero and coin slot
│   ├── router.tsx               # TanStack router setup
│   ├── server.ts                # Server entry point
│   ├── start.ts                 # Start client setup
│   └── styles.css               # Arcade design system and typography rules
├── supabase/                    # DB migrations and schema definitions
└── package.json                 # Project dependencies and build scripts
```

---

## Key Modules & Implementations

### 1. Web Audio Synthesizer (`src/lib/audio/arcade-audio.ts`)
Zero-download 8-bit sound generator leveraging browser `AudioContext` and native oscillators:
- `playBeep(freq, type, duration)`: UI click and navigation sounds.
- `playCoin()`: Double-tone frequency shift (`B5` to `E6`) on Insert Coin button click.
- `playAddCart()`: 4-note ascending square wave chord (`C5`, `E5`, `G5`, `C6`).
- `playVictory()`: Multi-note victory jingle with triangle oscillators when cheat codes apply.
- State persisted to `localStorage` under `frankys.audio.muted`.

### 2. HMAC Guest Token Security (`src/lib/server-crypto.ts` & `src/routes/api/orders.*`)
- **Order Placement (`POST /api/orders`)**:
  - Re-computes prices and stock on server via database RPC `create_order_tx`.
  - Generates HMAC-SHA256 digest `signOrderToken(orderId, email)` using `SUPABASE_SERVICE_ROLE_KEY`.
  - Returns `guestToken` to the client.
- **Order Verification (`GET /api/orders/:id`)**:
  - Requires valid guest token in query params `?token=` or header `x-guest-token`, or Supabase admin JWT.
  - Validates token with `crypto.timingSafeEqual` in `verifyOrderToken`.
  - Prevents enumeration and unauthorized reading of guest customer addresses.

### 3. Stripe & Promo Code Integrations
- **Promo Codes (`COIN10` / `KONAMI`)**:
  - Discovered via "INSERT COIN" interaction on landing page or Konami code entry.
  - Validated client-side in `src/routes/checkout.tsx` and recalculated server-side in `src/routes/api/orders.ts`.
  - Grants a 10% discount off product subtotal before shipping calculation.
- **Stripe Checkout (`src/lib/stripe.server.ts`)**:
  - Creates checkout sessions with line items and flat shipping rate (`700` cents).
  - Falls back gracefully to simulated checkout if `STRIPE_SECRET_KEY` is not present.
- **Webhook Processing (`src/routes/api/webhooks.stripe.ts`)**:
  - Validates `stripe-signature` header via `stripe.webhooks.constructEvent`.
  - Updates order status in Supabase `orders` table to `paid` upon `checkout.session.completed`.
