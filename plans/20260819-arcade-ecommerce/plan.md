# Implementation Plan: Franky's Arcade Studio Evolution

## Status: COMPLETED

## Strategy: Cân bằng E-Commerce & Arcade Immersion

### Phases:

1. [Phase 1: Security Hardening & UI/UX / WCAG AA](./phase-01-security-and-a11y.md)
2. [Phase 2: Web Audio 8-Bit Engine & Coin Drop Easter Egg](./phase-02-audio-and-gamification.md)
3. [Phase 3: Stripe Checkout, Webhook & Promo Code](./phase-03-stripe-and-promos.md)

### Acceptance Criteria:

- `GET /api/orders/$id` trả về 401 nếu thiếu signature token.
- Typography đọc dễ dàng (VT323/monospace chuẩn cho text dài, Press Start 2P cho tiêu đề).
- Tương phản WCAG AA (`--muted` đạt >= 4.5:1). Touch target >= 44px trên mobile.
- Web Audio SFX synth hoạt động 0 KB external file, có nút mute trên Header.
- Nút "INSERT COIN" thả xu hoạt ảnh và tặng mã `COIN10`.
- Stripe Checkout & Webhook test flow thành công.
