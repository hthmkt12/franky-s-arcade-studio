
-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  color_hex text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR','USD')),
  sizes text[] NOT NULL DEFAULT ARRAY['S','M','L']::text[],
  in_stock boolean NOT NULL DEFAULT true,
  description text NOT NULL DEFAULT '',
  materials text[] NOT NULL DEFAULT ARRAY[]::text[],
  image_key text NOT NULL,
  image_alt text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are publicly readable"
  ON public.products FOR SELECT
  USING (true);

-- ORDERS
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL,
  subtotal_cents integer NOT NULL CHECK (subtotal_cents >= 0),
  shipping_cents integer NOT NULL CHECK (shipping_cents >= 0),
  total_cents integer NOT NULL CHECK (total_cents >= 0),
  currency text NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR','USD')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','shipped','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
-- Guest checkout: anyone can insert. No SELECT policy = nobody can read via anon/auth key
-- (server routes use service_role for reads).
CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

-- ORDER ITEMS
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  product_slug text NOT NULL,
  product_name text NOT NULL,
  size text NOT NULL,
  qty integer NOT NULL CHECK (qty > 0),
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.order_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create order items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_products_sort_order ON public.products(sort_order);

-- SEED products (image_key resolved client-side to bundled asset)
INSERT INTO public.products (slug, name, color_hex, price_cents, sizes, in_stock, description, materials, image_key, image_alt, sort_order) VALUES
('frankys-black', 'FRANKY''S BLACK', '#0a0a0a', 6500, ARRAY['S','M','L'], true,
  'Classic fit. 100% fine merino wool. Satin lining. Handmade in Portugal.',
  ARRAY['100% MERINO WOOL','SATIN LINING','HANDMADE IN PORTUGAL'],
  'black', 'Franky''s black 5-panel cap', 1),
('frankys-ochre', 'FRANKY''S OCHRE', '#faa21f', 6500, ARRAY['S','M','L'], true,
  'Warm ochre wool. The arcade marquee on your head.',
  ARRAY['100% MERINO WOOL','SATIN LINING','HANDMADE IN PORTUGAL'],
  'ochre', 'Franky''s ochre 5-panel cap', 2),
('frankys-green', 'FRANKY''S GREEN', '#1f6f3a', 6500, ARRAY['S','M','L'], false,
  'Forest green wool cap. Limited run, currently sold out.',
  ARRAY['100% MERINO WOOL','SATIN LINING','HANDMADE IN PORTUGAL'],
  'green', 'Franky''s green 5-panel cap', 3),
('frankys-navy', 'FRANKY''S NAVY', '#1d2c5b', 6500, ARRAY['S','M','L'], true,
  'Navy blue wool cap. Skate-shop staple.',
  ARRAY['100% MERINO WOOL','SATIN LINING','HANDMADE IN PORTUGAL'],
  'navy', 'Franky''s navy 5-panel cap', 4),
('frankys-red', 'FRANKY''S RED', '#c8222b', 6500, ARRAY['S','M','L'], true,
  'Crimson red wool cap. Insert coin, press start.',
  ARRAY['100% MERINO WOOL','SATIN LINING','HANDMADE IN PORTUGAL'],
  'red', 'Franky''s red 5-panel cap', 5);
