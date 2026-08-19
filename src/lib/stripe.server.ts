// Server-side Stripe client & helpers

import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_mock_arcade_key";

export const stripe = new Stripe(stripeKey, {
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
  // If no live Stripe key is configured in env, fallback to simulated checkout URL
  if (!process.env.STRIPE_SECRET_KEY) {
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
