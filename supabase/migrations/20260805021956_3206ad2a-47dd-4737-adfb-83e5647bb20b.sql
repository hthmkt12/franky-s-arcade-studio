ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_qty integer NOT NULL DEFAULT 25;

CREATE OR REPLACE FUNCTION public.create_order_tx(p_customer jsonb, p_subtotal_cents integer, p_shipping_cents integer, p_total_cents integer, p_currency text, p_items jsonb)
 RETURNS TABLE(id uuid, number text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_number text;
  v_id uuid;
  v_created timestamptz;
  v_attempt integer := 0;
  v_it jsonb;
  v_updated integer;
BEGIN
  -- Reserve stock first so an oversell aborts before any order row exists.
  FOR v_it IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    UPDATE public.products
       SET stock_qty = stock_qty - (v_it->>'qty')::int,
           in_stock  = (stock_qty - (v_it->>'qty')::int) > 0
     WHERE products.id = (v_it->>'product_id')::uuid
       AND stock_qty >= (v_it->>'qty')::int;
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    IF v_updated = 0 THEN
      RAISE EXCEPTION 'out_of_stock:%', v_it->>'product_name';
    END IF;
  END LOOP;

  LOOP
    v_attempt := v_attempt + 1;
    v_number := 'FRK-' || lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');
    BEGIN
      INSERT INTO public.orders (
        number, customer_name, customer_email, address, city, postal_code, country,
        subtotal_cents, shipping_cents, total_cents, currency, status
      ) VALUES (
        v_number,
        p_customer->>'name',
        p_customer->>'email',
        p_customer->>'address',
        p_customer->>'city',
        p_customer->>'postalCode',
        p_customer->>'country',
        p_subtotal_cents, p_shipping_cents, p_total_cents, p_currency, 'pending'
      )
      RETURNING orders.id, orders.created_at INTO v_id, v_created;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempt >= 5 THEN
        RAISE EXCEPTION 'could not allocate order number';
      END IF;
    END;
  END LOOP;

  INSERT INTO public.order_items (
    order_id, product_id, product_slug, product_name, size, qty, unit_price_cents
  )
  SELECT
    v_id,
    (it->>'product_id')::uuid,
    it->>'product_slug',
    it->>'product_name',
    it->>'size',
    (it->>'qty')::int,
    (it->>'unit_price_cents')::int
  FROM jsonb_array_elements(p_items) AS it;

  RETURN QUERY SELECT v_id, v_number, v_created;
END;
$function$;