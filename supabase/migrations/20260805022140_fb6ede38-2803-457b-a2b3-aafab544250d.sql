DELETE FROM public.order_items WHERE order_id IN (SELECT id FROM public.orders WHERE customer_email = 't@t.com');
DELETE FROM public.orders WHERE customer_email = 't@t.com';
UPDATE public.products SET stock_qty = 25, in_stock = true;