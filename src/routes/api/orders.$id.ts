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
      GET: async ({ params }) => {
        const id = params.id;
        if (!UUID_RE.test(id)) {
          return json({ code: "invalid_id", message: "Invalid order id" }, 400);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: row, error } = await supabaseAdmin
          .from("orders")
          .select(
            "id, number, customer_name, customer_email, address, city, postal_code, country, subtotal_cents, shipping_cents, total_cents, currency, status, created_at",
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
        };
        return json(order);
      },
    },
  },
});
