-- Migration: Create stripe_events table for webhook idempotency
-- Stripe can deliver the same event more than once (retries, network). This
-- table records event ids we already processed so duplicates are no-ops and
-- never double-mark an order paid or double-send confirmation email.

CREATE TABLE IF NOT EXISTS public.stripe_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Service-role writes only; no public policies needed.
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;