// POST /api/orders
// Body: OrderDraft (see src/lib/api/types.ts). Returns Order.
// Server recomputes totals from the DB — never trust client prices.

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import type { Order } from "@/lib/api/types";

const SHIPPING_FLAT_CENTS = 700;

const OrderDraftSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        size: z.enum(["S", "M", "L", "ONE"]),
        qty: z.number().int().positive().max(20),
      }),
    )
    .min(1)
    .max(50),
  customer: z.object({
    name: z.string().min(1).max(120),
    email: z.string().email().max(200),
    address: z.string().min(1).max(200),
    city: z.string().min(1).max(120),
    postalCode: z.string().min(1).max(20),
    country: z.string().min(2).max(80),
  }),
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function generateOrderNumber(): string {
  return `FRK-${Math.floor(100000 + Math.random() * 900000)}`;
}

export const Route = createFileRoute("/api/orders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ code: "invalid_json", message: "Body must be JSON" }, 400);
        }

        const parsed = OrderDraftSchema.safeParse(raw);
        if (!parsed.success) {
          return json(
            { code: "invalid_body", message: parsed.error.issues[0]?.message ?? "Invalid draft" },
            400,
          );
        }
        const draft = parsed.data;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Fetch the referenced products server-side so totals cannot be tampered.
        const productIds = Array.from(new Set(draft.items.map((i) => i.productId)));
        const { data: products, error: prodErr } = await supabaseAdmin
          .from("products")
          .select("id, slug, name, price_cents, currency, in_stock, sizes")
          .in("id", productIds);

        if (prodErr) {
          console.error("[api/orders] product lookup failed", prodErr);
          return json({ code: "read_failed", message: prodErr.message }, 500);
        }
        if (!products || products.length !== productIds.length) {
          return json({ code: "unknown_product", message: "Unknown product in cart" }, 400);
        }

        const productById = new Map(products.map((p) => [p.id, p]));
        let subtotalCents = 0;
        for (const line of draft.items) {
          const p = productById.get(line.productId)!;
          if (!p.in_stock) {
            return json({ code: "out_of_stock", message: `${p.name} is out of stock` }, 409);
          }
          if (!(p.sizes ?? []).includes(line.size)) {
            return json({ code: "invalid_size", message: `Invalid size for ${p.name}` }, 400);
          }
          subtotalCents += p.price_cents * line.qty;
        }
        const shippingCents = subtotalCents > 0 ? SHIPPING_FLAT_CENTS : 0;
        const totalCents = subtotalCents + shippingCents;
        const currency = products[0].currency as Order["currency"];

        // Retry a few times in case the random number collides.
        let inserted: { id: string; number: string; created_at: string } | null = null;
        let insertErr: unknown = null;
        for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
          const number = generateOrderNumber();
          const { data, error } = await supabaseAdmin
            .from("orders")
            .insert({
              number,
              customer_name: draft.customer.name,
              customer_email: draft.customer.email,
              address: draft.customer.address,
              city: draft.customer.city,
              postal_code: draft.customer.postalCode,
              country: draft.customer.country,
              subtotal_cents: subtotalCents,
              shipping_cents: shippingCents,
              total_cents: totalCents,
              currency,
              status: "pending",
            })
            .select("id, number, created_at")
            .single();
          if (!error && data) {
            inserted = data;
          } else if (error?.code === "23505") {
            insertErr = error;
            continue; // number collision → retry
          } else {
            insertErr = error;
            break;
          }
        }
        if (!inserted) {
          console.error("[api/orders] insert failed", insertErr);
          return json({ code: "insert_failed", message: "Could not create order" }, 500);
        }

        const itemsPayload = draft.items.map((line) => {
          const p = productById.get(line.productId)!;
          return {
            order_id: inserted!.id,
            product_id: p.id,
            product_slug: p.slug,
            product_name: p.name,
            size: line.size,
            qty: line.qty,
            unit_price_cents: p.price_cents,
          };
        });
        const { error: itemsErr } = await supabaseAdmin.from("order_items").insert(itemsPayload);
        if (itemsErr) {
          console.error("[api/orders] item insert failed", itemsErr);
          // Best-effort cleanup so we don't leave a total without lines.
          await supabaseAdmin.from("orders").delete().eq("id", inserted.id);
          return json({ code: "insert_failed", message: itemsErr.message }, 500);
        }

        const order: Order = {
          id: inserted.id,
          number: inserted.number,
          items: draft.items,
          customer: draft.customer,
          subtotalCents,
          shippingCents,
          totalCents,
          currency,
          status: "pending",
          createdAt: inserted.created_at,
        };
        return json(order, 201);
      },
    },
  },
});
