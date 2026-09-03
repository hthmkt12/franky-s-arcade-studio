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

- [x] Email order confirmation dispatch via transactional email service (Resend).
- [x] Tracking number and shipment status updates in the Admin dashboard.
- [x] Self-service guest order status lookup portal (`/track`) with email verification and HMAC receipt access.

### Milestone 2.2: Enhanced Audio & Interactive Mini-Games

- [x] Konami Code Easter Egg (`↑ ↑ ↓ ↓ ← → ← → B A`) listener on home page unlocking `KONAMI` discount & 8-bit victory fanfare.
- [x] Pixel Horse arcade mini-runner game modal with jump physics and collision detection, unlocking `RUNNER15` (15% off at 100 points).
- [x] Enhanced Web Audio Synthesizer with jump, hit, and fanfare sound synthesis.

### Milestone 2.3: Internationalization & Multi-Currency

- [x] Dynamic currency switching (`EUR` / `USD` / `GBP`) with localized pricing tiers and header switcher.
- [x] Multi-language dictionary support for Portuguese (`pt-PT`) and English (`en-US`).
- [x] Automated international shipping calculation based on destination country (PT: €5, EU: €7, UK: £8, US: $12, Int'l: €15).

---

## Long-Term Goals (Phase 3 — Future Horizons)

- [x] **Automated Restock Alerts**: Email notifications via Resend when sold-out cap variants return to stock, with single-click subscriber notifications on Admin stock updates.
- [x] **Web3 / Arcade Token Loyalty & Leaderboard**: Global high-score leaderboard (`arcade_leaderboard` table & `/api/arcade/scores`) unlocking store discounts (`RUNNER15`, `CHAMP20`).
- [x] **Production Security Hardening**: Endpoint rate limiting & fail-closed crypto validation.
- [ ] **Merchandise Expansion**: Add hoodies, tote bags, and enamel arcade pins to the inventory engine.
- [ ] **Physical Arcade Machine Integration**: QR code kiosks at pop-up skate events syncing orders to the web backend.
