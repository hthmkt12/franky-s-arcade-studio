-- Migration: Add product categories and seed merchandise (Hoodie, Tote, Pin)
-- Ensures 100% backward compatibility with create_order_tx RPC

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'caps';

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- Insert new merchandise items
INSERT INTO public.products (slug, name, color_hex, price_cents, currency, sizes, in_stock, stock_qty, description, materials, image_key, image_alt, category)
VALUES
  (
    'arcade-heavy-hoodie',
    'Franky Arcade Heavy Hoodie',
    '#1a1a1a',
    8500,
    'EUR',
    ARRAY['S', 'M', 'L', 'XL'],
    true,
    15,
    'Heavyweight 450gsm organic cotton hoodie. Screenprinted pixel arcade artwork on back with embroidered signal-orange chest logo.',
    ARRAY['100% Organic Cotton', '450 GSM Heavyweight', 'Made in Portugal'],
    'hoodie-black',
    'Franky Arcade Heavy Hoodie',
    'hoodies'
  ),
  (
    'skate-shop-tote',
    'Skate Shop Canvas Tote',
    '#f3e5df',
    2500,
    'EUR',
    ARRAY['ONE'],
    true,
    30,
    'Durable 16oz raw canvas tote bag with reinforced handles and interior zipper pocket for skate tools and coins.',
    ARRAY['100% Cotton Canvas', '16oz Heavy Duck', 'Screenprinted in Lisbon'],
    'tote-cream',
    'Skate Shop Canvas Tote',
    'totes'
  ),
  (
    'pixel-coin-pin',
    '1-UP Pixel Coin Enamel Pin',
    '#faa21f',
    1200,
    'EUR',
    ARRAY['ONE'],
    true,
    50,
    'Hard enamel collector pin with double rubber clutch. Signal-orange gold plated 8-bit coin.',
    ARRAY['Hard Enamel', 'Gold Plated Zinc Alloy', '25mm x 25mm'],
    'pin-coin',
    '1-UP Pixel Coin Enamel Pin',
    'pins'
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price_cents = EXCLUDED.price_cents,
  sizes = EXCLUDED.sizes,
  in_stock = EXCLUDED.in_stock,
  stock_qty = EXCLUDED.stock_qty,
  description = EXCLUDED.description,
  materials = EXCLUDED.materials;
