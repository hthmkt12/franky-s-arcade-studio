// POST /api/webhooks/stripe
// Syncs Stripe payment status with Supabase `orders` table.
//
// Fail-closed: the Stripe signature is always required. Without a configured
// STRIPE_WEBHOOK_SECRET the endpoint refuses to run rather than trusting an
// unsigned body. Event ids are recorded in `stripe_events` so duplicate
// deliveries (Stripe retries / double-send) are no-ops.

import { createFileRoute } from "@tanstack/react-router";
import { stripe } from "@/lib/stripe.server";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const Route = createFileRoute("/api/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const sig = request.headers.get("stripe-signature");
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret || !sig) {
          console.error(
            "[api/webhooks/stripe] Missing STRIPE_WEBHOOK_SECRET or stripe-signature header",
          );
          return json({ code: "bad_signature", message: "Webhook signature required" }, 400);
        }

        let event;
        const rawBody = await request.text();

        try {
          event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
        } catch (err) {
          console.error("[api/webhooks/stripe] Signature error", err);
          return json({ code: "bad_signature", message: (err as Error).message }, 400);
        }

        if (event.type === "checkout.session.completed") {
          const session = event.data.object;
          const orderId = session.client_reference_id || session.metadata?.order_id;

          if (orderId) {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

            // Idempotency: claim the event first. A prior (or concurrent)
            // delivery already processed it, so return early as received.
            const { data: claimed } = await supabaseAdmin
              .from("stripe_events")
              .insert({ event_id: event.id, event_type: event.type })
              .select("event_id")
              .maybeSingle();

            if (!claimed) {
              return json({ received: true, duplicate: true });
            }

            const { data: updatedOrder, error } = await supabaseAdmin
              .from("orders")
              .update({ status: "paid" })
              .eq("id", orderId)
              .select("*, order_items(*)")
              .single();

            if (error) {
              console.error("[api/webhooks/stripe] DB update error", error);
              return json({ code: "update_failed" }, 500);
            }

            // Dispatch confirmation email upon successful payment
            if (updatedOrder) {
              const { signOrderToken } = await import("@/lib/server-crypto");
              const { sendOrderConfirmationEmail } = await import("@/lib/email.server");
              const guestToken = signOrderToken(updatedOrder.id, updatedOrder.customer_email);
              const origin = new URL(request.url).origin;
              const trackingUrl = `${origin}/checkout/success/${updatedOrder.id}?token=${guestToken}`;

              const currencySym = updatedOrder.currency === "EUR" ? "€" : "$";
              try {
                await sendOrderConfirmationEmail({
                  to: updatedOrder.customer_email,
                  customerName: updatedOrder.customer_name,
                  orderNumber: updatedOrder.number,
                  orderId: updatedOrder.id,
                  guestToken,
                  items: (updatedOrder.order_items ?? []).map((it: { product_name: string; size: string; qty: number; unit_price_cents: number }) => ({
                    name: it.product_name,
                    size: it.size,
                    qty: it.qty,
                    price: `${currencySym}${(it.unit_price_cents / 100).toFixed(0)}`,
                  })),
                  subtotal: `${currencySym}${(updatedOrder.subtotal_cents / 100).toFixed(0)}`,
                  shipping: `${currencySym}${(updatedOrder.shipping_cents / 100).toFixed(0)}`,
                  total: `${currencySym}${(updatedOrder.total_cents / 100).toFixed(0)}`,
                  trackingUrl,
                });
              } catch (emailErr) {
                console.error("[api/webhooks/stripe] Confirmation email failed", emailErr);
              }
            }
          }
        }

        return json({ received: true });
      },
    },
  },
});
