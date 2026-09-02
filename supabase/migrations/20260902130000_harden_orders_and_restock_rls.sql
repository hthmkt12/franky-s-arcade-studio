-- Hardening: remove the direct anon INSERT path into orders/order_items and
-- enable RLS on restock_subscriptions.
--
-- Rationale:
--   * All order creation goes through the SECURITY DEFINER RPC `create_order_tx`
--     (called with the service-role key in src/routes/api/orders.ts). The anon
--     INSERT grant + permissive policy added in 20260705135321 are unused by the
--     app and let anyone holding the public key insert arbitrary order rows
--     (bogus totals/PII, no stock reservation). Remove them.
--   * restock_subscriptions (added in 20260819130000) shipped without RLS, so the
--     customer emails it stores are reachable with the public key. Only the
--     service-role client touches this table (admin.functions.ts / restock-alert),
--     and service_role bypasses RLS, so enabling RLS with no anon/auth policy is
--     safe and closes the exposure.

-- 1) Orders: drop the guest direct-insert path (the service-role RPC is the only writer).
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
REVOKE INSERT ON public.orders FROM anon;
REVOKE INSERT ON public.order_items FROM anon;

-- 2) Restock subscriptions: enable RLS. No anon/authenticated policy is granted,
--    so those roles are default-denied; the service-role client bypasses RLS.
ALTER TABLE public.restock_subscriptions ENABLE ROW LEVEL SECURITY;
