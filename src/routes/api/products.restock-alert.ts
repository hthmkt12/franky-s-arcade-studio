// POST /api/products/restock-alert
// Body: { productId: string, email: string }
// Registers a customer email for restock notification.

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const RestockSchema = z.object({
  productId: z.string().uuid(),
  email: z.string().email().max(200),
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const Route = createFileRoute("/api/products/restock-alert")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ code: "invalid_json", message: "Body must be JSON" }, 400);
        }

        const parsed = RestockSchema.safeParse(raw);
        if (!parsed.success) {
          return json(
            { code: "invalid_body", message: parsed.error.issues[0]?.message ?? "Invalid data" },
            400,
          );
        }

        const { productId, email } = parsed.data;
        const normalizedEmail = email.trim().toLowerCase();

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Verify product exists
        const { data: product, error: prodErr } = await supabaseAdmin
          .from("products")
          .select("id, name")
          .eq("id", productId)
          .maybeSingle();

        if (prodErr || !product) {
          return json({ code: "not_found", message: "Product not found" }, 404);
        }

        // Insert or update restock subscription
        const { error: insErr } = await supabaseAdmin.from("restock_subscriptions").insert({
          product_id: productId,
          email: normalizedEmail,
          notified: false,
        });

        if (insErr) {
          console.error("[api/products/restock-alert] insert error", insErr);
          return json({ code: "insert_failed", message: "Could not save alert request" }, 500);
        }

        return json({ success: true, message: `Alert confirmed for ${product.name}` }, 201);
      },
    },
  },
});
