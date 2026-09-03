# System Architecture — Franky's Arcade Studio

## Overview

Franky's Arcade Studio is architected as a modern, full-stack SSR application powered by TanStack Start (Nitro runtime), React 19, Supabase (PostgreSQL), and Stripe.

```
[ Browser / Client ]
       │
       ├─────────────────────────────────┐
       ▼                                 ▼
[ TanStack Router (SSR/Hydration) ]   [ Web Audio Synthesizer (Native Oscillators) ]
       │
       ▼
[ Server Endpoints & Handlers ] (src/routes/api/*)
       │
       ├───► [ HMAC Sign/Verify ] (src/lib/server-crypto.ts)
       ├───► [ Stripe API / Webhooks ] (src/lib/stripe.server.ts)
       └───► [ Supabase Admin / PostgreSQL RPC ] (create_order_tx)
```

---

## 1. Web Audio Synthesizer Architecture

Located in `src/lib/audio/arcade-audio.ts`.

- **Mechanism**: Pure browser `AudioContext` and `OscillatorNode` / `GainNode` synthesis.
- **Payload**: 0 KB external audio files or MP3 downloads.
- **Waveforms & Frequencies**:
  - `playBeep(freq, type, duration)`: Square wave at 440 Hz (default), 0.08s duration with exponential gain decay.
  - `playCoin()`: Double-tone frequency shift (`B5` 987.77 Hz -> `E6` 1318.51 Hz) over 0.35s.
  - `playAddCart()`: 4-note ascending chord arpeggio (`C5`, `E5`, `G5`, `C6`) with 50ms stagger.
  - `playVictory()`: Multi-note melody (`C5`, `E5`, `G5`, `C6`) using `triangle` waveform for fanfare.
- **State**: Mute state stored in `localStorage` (`frankys.audio.muted`).

---

## 2. Security & Guest Order Verification (HMAC)

Guest checkouts allow friction-free purchases without creating an account. Security is maintained via HMAC tokenization in `src/lib/server-crypto.ts`.

### Token Generation & Flow

1. User posts order draft to `POST /api/orders`.
2. Server executes `create_order_tx` in Supabase to insert order row and lock inventory.
3. Server generates guest token:
   $$\text{token} = \text{HMAC-SHA256}(K_{\text{secret}}, \text{orderId} + \text{":"} + \text{email}).\text{slice}(0, 32)$$
4. Order response returns `guestToken`. Client navigates to `/checkout/success/$id?token=<guestToken>`.
5. When accessing receipt at `GET /api/orders/:id`, server extracts `?token=` query param or `x-guest-token` header:
   - If user is Supabase admin with valid JWT, access is granted.
   - Otherwise, `verifyOrderToken` performs `crypto.timingSafeEqual` against the computed HMAC.
   - Unauthorized requests receive `401 Unauthorized`, preventing ID enumeration and PII leakage.
   - **Fail-Closed Policy**: In production (`NODE_ENV === "production"`), the server throws if `ORDER_TOKEN_SECRET` is unset, refusing to run with insecure fallbacks.

### Rate Limiting & Anti-Spam

- Implemented in `src/lib/rate-limit.server.ts` using sliding window memory counters.
- `POST /api/orders`: Max 10 attempts/min per IP to prevent stock-locking denial of service.
- `POST /api/arcade/scores`: Max 5 submissions/min per IP to safeguard the arcade leaderboard from script flooding.

---

## 3. Stripe & Promo Code Architecture

### Promo Code Flow

1. User clicks "INSERT COIN" on the landing page, triggering `playCoin()` audio and storing `frankys.promo.code = "COIN10"`.
2. On checkout (`src/routes/checkout.tsx`), user applies promo code (`COIN10` / `KONAMI`).
3. Total recomputes with 10% subtotal discount.
4. When order is submitted to `POST /api/orders`, the server re-validates the promo code independently and applies discount to database record.

### Stripe Payment & Webhook Lifecycle

1. `src/lib/stripe.server.ts` prepares line items including product lines and shipping (`700` cents).
2. Sets `client_reference_id` and metadata with `order_id` and `order_number`.
3. Webhook endpoint `POST /api/webhooks/stripe` (`src/routes/api/webhooks.stripe.ts`) verifies `stripe-signature` with `STRIPE_WEBHOOK_SECRET`.
4. On `checkout.session.completed`, server updates order status to `paid` in Supabase using the service role admin client.
