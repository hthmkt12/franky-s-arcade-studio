# Project Roadmap — Franky's Arcade Studio

## Overview
Franky's Arcade Studio roadmap outlines past achievements, current architectural status, and future planned enhancements for the retro arcade e-commerce platform.

---

## Current Status (Phase 1 — Shipped & Verified)

- [x] **Retro Arcade Design System**: Cream canvas `#f3e5df`, pixel-art borders, custom bevels, checkerboard backgrounds, VT323 & Arcade pixel fonts.
- [x] **Product Catalog & Variant Switcher**: 5 signature wool cap colors (Red, Ochre, Navy, Green, Black), live 3D/AR modal preview, size selector (`S`, `M`, `L`, `ONE`).
- [x] **Pure Web Audio Synthesizer**: Native oscillator chiptune sound effects for clicks, coin inserts, cart actions, and victory fanfare with local storage mute control.
- [x] **Guest Checkout & Cart**: LocalStorage cart persistence, order draft form validation with Zod, and subtotal calculation.
- [x] **Atomic Inventory & Order Placement**: PostgreSQL RPC `create_order_tx` guaranteeing atomic stock reservation and order creation.
- [x] **HMAC Guest Security**: Cryptographic HMAC-SHA256 signature tokens enabling safe guest order retrieval without requiring user account registration.
- [x] **Promo / Cheat Code Engine**: Interactive coin button on landing page unlocking `COIN10` (10% discount) with server-side validation.
- [x] **Stripe Integration & Webhooks**: Stripe checkout session generation and webhook handler for `checkout.session.completed` event status updates.

---

## Near-Term Milestones (Phase 2 — In Progress & Next Up)

### Milestone 2.1: Order Management & Tracking
- [ ] Email order confirmation dispatch via transactional email service (e.g., Cloudflare Email Service / Resend).
- [ ] Tracking number and shipment status updates in the Admin dashboard.
- [ ] Self-service guest order status lookup portal with email verification.

### Milestone 2.2: Enhanced Audio & Interactive Mini-Games
- [ ] Konami Code Easter Egg (`↑ ↑ ↓ ↓ ← → ← → B A`) listener on home page unlocking hidden pixel sound bites.
- [ ] Background 8-bit ambient track option with volume slider in header.
- [ ] Pixel Horse arcade mini-runner game modal for unlocking exclusive secret discounts.

### Milestone 2.3: Internationalization & Multi-Currency
- [ ] Dynamic currency switching (`EUR` / `USD` / `GBP`) with localized pricing tiers.
- [ ] Multi-language support for Portuguese (`pt-PT`) and English (`en-US`).
- [ ] Automated international shipping calculation based on destination country.

---

## Long-Term Goals (Phase 3 — Future Horizons)

- **Merchandise Expansion**: Add hoodies, tote bags, and enamel arcade pins to the inventory engine.
- **Physical Arcade Machine Integration**: QR code kiosks at pop-up skate events syncing orders to the web backend.
- **Web3 / Arcade Token Loyalty**: Optional arcade high-score leaderboard granting seasonal store discounts.
- **Automated Restock Alerts**: Email notifications when sold-out cap variants return to stock.
