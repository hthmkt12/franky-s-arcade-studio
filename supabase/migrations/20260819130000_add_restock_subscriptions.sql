-- Create restock_subscriptions table
CREATE TABLE IF NOT EXISTS public.restock_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  notified boolean NOT NULL DEFAULT false,
  notified_at timestamptz DEFAULT NULL
);

-- Index for quick lookup on stock replenish
CREATE INDEX IF NOT EXISTS idx_restock_sub_product ON public.restock_subscriptions(product_id, notified);
