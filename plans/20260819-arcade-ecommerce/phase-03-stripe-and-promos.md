# Phase 3: Stripe Checkout, Webhook & Promo Code

## Goals:
- Hỗ trợ thanh toán Stripe Checkout quốc tế.
- Webhook cập nhật đơn hàng Supabase.
- Giỏ hàng / Checkout hỗ trợ mã giảm giá "ARCADE CHEAT CODE".

## Changes:
- `src/lib/stripe/`: Server helpers tạo Stripe Session & Webhook signature verification.
- `src/routes/api/checkout-session.ts` & `src/routes/api/webhooks/stripe.ts`.
- `src/lib/cart/CartContext.tsx` & `src/routes/checkout.tsx`: Thêm logic giảm giá theo % hoặc cố định.
