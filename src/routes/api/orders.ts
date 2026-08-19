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
  promoCode: z.string().optional(),
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
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
          return json({ code: "read_failed", message: "Could not read catalog" }, 500);
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
        let discountCents = 0;
        if (draft.promoCode && (draft.promoCode.toUpperCase() === "COIN10" || draft.promoCode.toUpperCase() === "KONAMI")) {
          discountCents = Math.round(subtotalCents * 0.1);
        }

        const shippingCents = subtotalCents > 0 ? SHIPPING_FLAT_CENTS : 0;
        const totalCents = Math.max(0, subtotalCents - discountCents + shippingCents);
        const currency = products[0].currency as Order["currency"];

        const itemsPayload = draft.items.map((line) => {
          const p = productById.get(line.productId)!;
          return {
            product_id: p.id,
            product_slug: p.slug,
            product_name: p.name,
            size: line.size,
            qty: line.qty,
            unit_price_cents: p.price_cents,
          };
        });

        // Single DB transaction: order + items, or nothing at all.
        const { data: created, error: rpcErr } = await supabaseAdmin
          .rpc("create_order_tx", {
            p_customer: draft.customer,
            p_subtotal_cents: subtotalCents,
            p_shipping_cents: shippingCents,
            p_total_cents: totalCents,
            p_currency: currency,
            p_items: itemsPayload,
          })
          .single();

        if (rpcErr || !created) {
          console.error("[api/orders] create_order_tx failed", rpcErr);
          // The RPC reserves stock atomically and raises `out_of_stock:<name>`
          // when someone else took the last unit mid-checkout.
          const oversell = rpcErr?.message?.match(/out_of_stock:(.*)/);
          if (oversell) {
            return json(
              {
                code: "out_of_stock",
                message: `${oversell[1].trim()} just sold out — remove it to continue`,
              },
              409,
            );
          }
          return json({ code: "insert_failed", message: "Could not create order" }, 500);
        }


        const { signOrderToken } = await import("@/lib/server-crypto");
        const guestToken = signOrderToken(created.id, draft.customer.email);

        const order: Order = {
          id: created.id,
          number: created.number,
          items: draft.items,
          customer: draft.customer,
          subtotalCents,
          shippingCents,
          totalCents,
          currency,
          status: "pending",
          createdAt: created.created_at,
          guestToken,
        };
        return json(order, 201);

      },
    },
  },
});
