// POST /api/orders/lookup
// Body: { number: string, email: string }
// Returns: { id: string, token: string }
// Allows guest users to retrieve an HMAC access token to view their receipt.

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { checkRateLimit, getClientIp } from "@/lib/rate-limit.server";

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
        // Rate limit guest lookups: this endpoint mints an access token, so it
        // must not be brute-forceable by order-number/email guessing.
        const clientIp = getClientIp(request);
        const rl = checkRateLimit(clientIp, {
          prefix: "orders-lookup",
          windowMs: 60 * 1000, // 1 minute
          maxRequests: 5, // max 5 lookup attempts/min per IP
        });
        if (!rl.success) {
          return json(
            {
              code: "rate_limited",
              message: `Too many lookup attempts. Please retry in ${rl.resetInSeconds}s.`,
            },
            429,
          );
        }

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
        // Exact match on the order number only — never a LIKE pattern. Using
        // `.ilike()` with raw input let callers pass `%`/`_` wildcards and match
        // arbitrary orders (a PII + access-token oracle). The number is exact and
        // case-normalized; the email is compared case-insensitively in code below
        // so stored emails do not need to be pre-lowercased.
        const { data: order, error } = await supabaseAdmin
          .from("orders")
          .select("id, number, customer_email")
          .eq("number", normalizedNumber)
          .maybeSingle();

        if (error) {
          console.error("[api/orders/lookup] lookup error", error);
          return json({ code: "lookup_failed", message: "Could not query orders" }, 500);
        }

        if (!order || order.customer_email.trim().toLowerCase() !== normalizedEmail) {
          // Generic response for both "no such number" and "email mismatch" so the
          // endpoint does not confirm which orders exist.
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
