-- Migration: 20260830160000_seed_merchandise_expansion.sql
-- Description: Seeds expanded merchandise catalog (Hoodies, Totes, Pins) and updates existing cap categories.

-- Ensure category column exists
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'caps';

-- Update existing 5 caps to have category = 'caps'
UPDATE public.products
SET category = 'caps'
WHERE slug IN ('classic-red', 'classic-ochre', 'classic-navy', 'classic-green', 'classic-black');

-- Insert Hoodies
INSERT INTO public.products (
  slug, name, category, color_hex, price_cents, currency, sizes, in_stock, stock_qty, description, materials, image_key, image_alt, sort_order
) VALUES (
  'arcade-heavy-hoodie',
  'Franky Arcade Heavy Hoodie',
  'hoodies',
  '#1a1a1a',
  8500,
  'EUR',
  ARRAY['S', 'M', 'L', 'XL']::text[],
  true,
  25,
  'Heavyweight 450gsm brushed organic cotton fleece with pixelated Franky chest badge and custom arcade coin zipper pull.',
  ARRAY['100% Organic Cotton', '450gsm Heavyweight Fleece', 'Custom Metal Coin Pull']::text[],
  'hoodie-black',
  'Franky Arcade Heavy Hoodie - Vintage Black',
  10
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price_cents = EXCLUDED.price_cents,
  sizes = EXCLUDED.sizes,
  in_stock = EXCLUDED.in_stock,
  stock_qty = EXCLUDED.stock_qty,
  description = EXCLUDED.description,
  materials = EXCLUDED.materials,
  image_key = EXCLUDED.image_key,
  image_alt = EXCLUDED.image_alt,
  sort_order = EXCLUDED.sort_order;

-- Insert Skate Tote
INSERT INTO public.products (
  slug, name, category, color_hex, price_cents, currency, sizes, in_stock, stock_qty, description, materials, image_key, image_alt, sort_order
) VALUES (
  'pixel-skate-tote',
  'Franky Canvas Skate Tote Bag',
  'totes',
  '#e5d5c5',
  2800,
  'EUR',
  ARRAY['ONE']::text[],
  true,
  40,
  'Heavy-duty 16oz raw natural cotton canvas tote bag with reinforced cross-stitching and inner zipped coin pocket.',
  ARRAY['100% Raw Cotton Canvas', '16oz Heavy-Duty', 'Reinforced Straps']::text[],
  'tote-cream',
  'Franky Canvas Skate Tote Bag - Natural Cream',
  20
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price_cents = EXCLUDED.price_cents,
  sizes = EXCLUDED.sizes,
  in_stock = EXCLUDED.in_stock,
  stock_qty = EXCLUDED.stock_qty,
  description = EXCLUDED.description,
  materials = EXCLUDED.materials,
  image_key = EXCLUDED.image_key,
  image_alt = EXCLUDED.image_alt,
  sort_order = EXCLUDED.sort_order;

-- Insert Enamel Pin
INSERT INTO public.products (
  slug, name, category, color_hex, price_cents, currency, sizes, in_stock, stock_qty, description, materials, image_key, image_alt, sort_order
) VALUES (
  'pixel-coin-pin',
  '1-UP Pixel Coin Enamel Pin',
  'pins',
  '#faa21f',
  1200,
  'EUR',
  ARRAY['ONE']::text[],
  true,
  100,
  'Hard enamel collectible pin with gold electroplated plating and double rubber clutch back. Perfect for caps & tote bags.',
  ARRAY['Hard Enamel', 'Gold Electroplated Brass', 'Double Rubber Clutch']::text[],
  'pin-coin',
  '1-UP Pixel Coin Enamel Pin - Gold & Orange',
  30
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price_cents = EXCLUDED.price_cents,
  sizes = EXCLUDED.sizes,
  in_stock = EXCLUDED.in_stock,
  stock_qty = EXCLUDED.stock_qty,
  description = EXCLUDED.description,
  materials = EXCLUDED.materials,
  image_key = EXCLUDED.image_key,
  image_alt = EXCLUDED.image_alt,
  sort_order = EXCLUDED.sort_order;
