-- Add tracking_number, carrier, and shipped_at to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS tracking_number text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS carrier text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS shipped_at timestamptz DEFAULT NULL;
