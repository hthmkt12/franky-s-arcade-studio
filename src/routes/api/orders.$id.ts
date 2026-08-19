// GET /api/orders/:id → Order (with items). Used by the confirmation page so
// a real receipt is shown instead of trusting client-side sessionStorage.

import { createFileRoute } from "@tanstack/react-router";

import type { Order, ProductSize } from "@/lib/api/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const Route = createFileRoute("/api/orders/$id")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const id = params.id;
        if (!UUID_RE.test(id)) {
          return json({ code: "invalid_id", message: "Invalid order id" }, 400);
        }

        const url = new URL(request.url);
        const token = url.searchParams.get("token") || request.headers.get("x-guest-token");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: row, error } = await supabaseAdmin
          .from("orders")
          .select(
            "id, number, customer_name, customer_email, address, city, postal_code, country, subtotal_cents, shipping_cents, total_cents, currency, status, created_at, tracking_number, carrier, shipped_at",
          )
          .eq("id", id)
          .maybeSingle();

        if (error) {
          console.error("[api/orders/:id] read failed", error);
          return json({ code: "read_failed", message: "Could not read order" }, 500);
        }
        if (!row) {
          return json({ code: "not_found", message: "Order not found" }, 404);
        }

        // Verify token if not an authenticated admin request
        const authHeader = request.headers.get("authorization");
        let isAdmin = false;
        if (authHeader?.startsWith("Bearer ")) {
          const jwt = authHeader.slice(7);
          const { data: userData } = await supabaseAdmin.auth.getUser(jwt);
          if (userData.user) {
            const { data: roleRow } = await supabaseAdmin
              .from("user_roles")
              .select("role")
              .eq("user_id", userData.user.id)
              .eq("role", "admin")
              .maybeSingle();
            if (roleRow) isAdmin = true;
          }
        }

        if (!isAdmin) {
          const { verifyOrderToken } = await import("@/lib/server-crypto");
          if (!token || !verifyOrderToken(row.id, row.customer_email, token)) {
            return json({ code: "unauthorized", message: "Access token required to view order details" }, 401);
          }
        }

        const { data: items, error: itemsErr } = await supabaseAdmin
          .from("order_items")
          .select("product_id, size, qty")
          .eq("order_id", id);

        if (itemsErr) {
          console.error("[api/orders/:id] items read failed", itemsErr);
          return json({ code: "read_failed", message: "Could not read order" }, 500);
        }

        const order: Order = {
          id: row.id,
          number: row.number,
          items: (items ?? []).map((it) => ({
            productId: it.product_id,
            size: it.size as ProductSize,
            qty: it.qty,
          })),
          customer: {
            name: row.customer_name,
            email: row.customer_email,
            address: row.address,
            city: row.city,
            postalCode: row.postal_code,
            country: row.country,
          },
          subtotalCents: row.subtotal_cents,
          shippingCents: row.shipping_cents,
          totalCents: row.total_cents,
          currency: row.currency as Order["currency"],
          status: row.status as Order["status"],
          createdAt: row.created_at,
          trackingNumber: row.tracking_number ?? null,
          carrier: row.carrier ?? null,
          shippedAt: row.shipped_at ?? null,
        };
        return json(order);
      },
    },
  },
});
