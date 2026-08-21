// POST /api/orders/lookup
// Body: { number: string, email: string }
// Returns: { id: string, token: string }
// Allows guest users to retrieve an HMAC access token to view their receipt.

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const LookupSchema = z.object({
  number: z.string().min(1).max(60),
  email: z.string().email().max(200),
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const Route = createFileRoute("/api/orders/lookup")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ code: "invalid_json", message: "Body must be JSON" }, 400);
        }

        const parsed = LookupSchema.safeParse(raw);
        if (!parsed.success) {
          return json(
            {
              code: "invalid_body",
              message: parsed.error.issues[0]?.message ?? "Invalid lookup details",
            },
            400,
          );
        }

        const { number, email } = parsed.data;
        const normalizedNumber = number.trim().toUpperCase();
        const normalizedEmail = email.trim().toLowerCase();

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: order, error } = await supabaseAdmin
          .from("orders")
          .select("id, number, customer_email")
          .ilike("number", normalizedNumber)
          .ilike("customer_email", normalizedEmail)
          .maybeSingle();

        if (error) {
          console.error("[api/orders/lookup] lookup error", error);
          return json({ code: "lookup_failed", message: "Could not query orders" }, 500);
        }

        if (!order) {
          return json(
            { code: "not_found", message: "No order found matching this number and email." },
            404,
          );
        }

        const { signOrderToken } = await import("@/lib/server-crypto");
        const token = signOrderToken(order.id, order.customer_email);

        return json({ id: order.id, token });
      },
    },
  },
});
