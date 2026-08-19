# Product Development Requirements (PDR) — Franky's Arcade Studio

## 1. Product Overview
Franky's Arcade Studio is an e-commerce platform blending retro arcade cabinet nostalgia with premium apparel retail (handmade merino wool caps crafted in Portugal).

## 2. Core Functional Requirements

### 2.1 Visual & Audio Experience
- **Retro Theme**: Strict adherence to cream paper `#f3e5df` canvas, black pixel rules, checkerboard patterns, signal-orange `#faa21f` marquee accents, and green `#128e44` buy CTAs.
- **Audio Synthesizer**: 0 KB chiptune sound synthesis for user interactions (beeps, coin insert, add to cart, and victory jingle). User mute preference persisted across sessions.
- **3D & AR Cap Preview**: Interactive 3D model / AR preview modal for inspected cap colorways.

### 2.2 Catalog & Product Selection
- Color variants: Red, Ochre, Navy, Green, Black.
- Size selector: `S`, `M`, `L`, `ONE`.
- Real-time stock indicators with low-stock warnings when inventory $\le 5$.

### 2.3 Cart & Checkout
- Persistent cart drawer accessible across all routes.
- Guest checkout with client-side and server-side Zod validation.
- Promo / Cheat code engine accepting `COIN10` and `KONAMI` for a 10% discount.
- Flat shipping calculation (`€7` flat rate, free over `€100`).

### 2.4 Security & Order Integrity
- Server-side total calculation: Client prices are never trusted.
- Database RPC `create_order_tx` guaranteeing atomic stock reservation.
- HMAC-SHA256 guest access tokens required to view order receipts, preventing unauthorized PII access.

### 2.5 Payments & Fulfillment
- Stripe Checkout integration with webhook-driven order state transition (`pending` -> `paid`).

---

## 3. Non-Functional Requirements

- **Performance**: Zero external audio asset network requests; instantaneous UI sound feedback.
- **Security**: Timing-safe HMAC token comparison; admin-only route protection via Supabase JWT roles.
- **Responsiveness**: Mobile-optimized layouts with arcade-styled burger navigation and touch targets $\ge 44\text{px}$.
