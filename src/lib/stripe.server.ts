// Server-side Stripe client & helpers.
// Fail-closed: production MUST provide STRIPE_SECRET_KEY. Without it we refuse
// to create a checkout session instead of silently falling back to a simulated
// URL that would let customers "pay" without moving any money.

import Stripe from "stripe";

// The mock key only ever feeds the Stripe client constructor (used by the
// webhook's signature verification, which needs no real key). The checkout
// path below refuses to run without a real key in production.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock_arcade_key", {
  apiVersion: "2023-10-16" as unknown as Stripe.LatestApiVersion,
  typescript: true,
});

export interface CheckoutSessionOptions {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  items: Array<{
    name: string;
    unitPriceCents: number;
    qty: number;
    size: string;
  }>;
  shippingCents: number;
  discountCents?: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createStripeSession(opts: CheckoutSessionOptions): Promise<{ url: string; id: string }> {
  // Fail-closed: production refuses to run a simulated checkout. The simulated
  // URL is dev/demo only, where a local build has no real key on purpose.
  if (!process.env.STRIPE_SECRET_KEY) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[stripe] STRIPE_SECRET_KEY is not configured — refusing to create a simulated checkout session in production.",
      );
    }
    return {
      id: `sim_cs_${Math.random().toString(36).slice(2)}`,
      url: opts.successUrl,
    };
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = opts.items.map((it) => ({
    price_data: {
      currency: opts.currency.toLowerCase(),
      product_data: {
        name: `${it.name} [${it.size}]`,
      },
      unit_amount: it.unitPriceCents,
    },
    quantity: it.qty,
  }));

  if (opts.shippingCents > 0) {
    lineItems.push({
      price_data: {
        currency: opts.currency.toLowerCase(),
        product_data: {
          name: "Standard Shipping (Portugal / Worldwide)",
        },
        unit_amount: opts.shippingCents,
      },
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: opts.customerEmail,
    client_reference_id: opts.orderId,
    metadata: {
      order_id: opts.orderId,
      order_number: opts.orderNumber,
    },
    line_items: lineItems,
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
  });

  return {
    id: session.id,
    url: session.url || opts.successUrl,
  };
}
