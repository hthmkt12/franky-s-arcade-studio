// POST /api/webhooks/stripe
// Syncs Stripe payment status with Supabase `orders` table.

import { createFileRoute } from "@tanstack/react-router";
import { stripe } from "@/lib/stripe.server";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const Route = createFileRoute("/api/webhooks/stripe" as unknown as "/api/products")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const sig = request.headers.get("stripe-signature");
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        let event;
        const rawBody = await request.text();

        if (webhookSecret && sig) {
          try {
            event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
          } catch (err) {
            console.error("[api/webhooks/stripe] Signature error", err);
            return json({ code: "bad_signature", message: (err as Error).message }, 400);
          }
        } else {
          try {
            event = JSON.parse(rawBody);
          } catch {
            return json({ code: "invalid_body" }, 400);
          }
        }

        if (event.type === "checkout.session.completed") {
          const session = event.data.object;
          const orderId = session.client_reference_id || session.metadata?.order_id;

          if (orderId) {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { error } = await supabaseAdmin
              .from("orders")
              .update({ status: "paid" })
              .eq("id", orderId);

            if (error) {
              console.error("[api/webhooks/stripe] DB update error", error);
              return json({ code: "update_failed" }, 500);
            }
          }
        }

        return json({ received: true });
      },
    },
  },
});
