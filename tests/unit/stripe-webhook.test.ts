import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import crypto from "node:crypto";
import { Route } from "@/routes/api/webhooks.stripe";

// Helper to generate a valid Stripe HMAC signature for testing
function generateStripeSignature(
  payload: string,
  secret: string,
  timestamp = Math.floor(Date.now() / 1000),
) {
  const signedPayload = `${timestamp}.${payload}`;
  const hmac = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  return `t=${timestamp},v1=${hmac}`;
}

describe("POST /api/webhooks/stripe", () => {
  const secret = "whsec_test_secret_for_unit_tests_1234567890";
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, STRIPE_WEBHOOK_SECRET: secret };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  const handler = Route.options.server!.handlers!.POST!;

  it("returns 400 bad_signature when STRIPE_WEBHOOK_SECRET is missing", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const req = new Request("http://localhost:3000/api/webhooks/stripe", {
      method: "POST",
      headers: {
        "stripe-signature": "t=123,v1=fake",
      },
      body: JSON.stringify({ id: "evt_123" }),
    });

    const res = await handler({ request: req } as unknown as { request: Request });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string; message: string };
    expect(body.code).toBe("bad_signature");
    expect(body.message).toContain("Webhook signature required");
  });

  it("returns 400 bad_signature when stripe-signature header is missing", async () => {
    const req = new Request("http://localhost:3000/api/webhooks/stripe", {
      method: "POST",
      body: JSON.stringify({ id: "evt_123" }),
    });

    const res = await handler({ request: req } as unknown as { request: Request });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("bad_signature");
  });

  it("returns 400 bad_signature when HMAC signature is invalid", async () => {
    const rawPayload = JSON.stringify({ id: "evt_123", type: "charge.succeeded" });
    const req = new Request("http://localhost:3000/api/webhooks/stripe", {
      method: "POST",
      headers: {
        "stripe-signature": "t=1234567,v1=bad_signature_hash",
      },
      body: rawPayload,
    });

    const res = await handler({ request: req } as unknown as { request: Request });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("bad_signature");
  });

  it("safely ignores and returns received: true for non-checkout events with valid signature", async () => {
    const rawPayload = JSON.stringify({
      id: "evt_non_checkout_123",
      type: "payment_intent.created",
      data: { object: {} },
    });
    const sig = generateStripeSignature(rawPayload, secret);

    const req = new Request("http://localhost:3000/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": sig },
      body: rawPayload,
    });

    const res = await handler({ request: req } as unknown as { request: Request });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { received: boolean };
    expect(body.received).toBe(true);
  });

  it("handles duplicate delivery cleanly by returning duplicate: true", async () => {
    const rawPayload = JSON.stringify({
      id: "evt_duplicate_checkout_123",
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: "order_123",
          customer_details: { email: "player1@arcade.shop" },
        },
      },
    });
    const sig = generateStripeSignature(rawPayload, secret);

    vi.doMock("@/integrations/supabase/client.server", () => ({
      supabaseAdmin: {
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      },
    }));

    const req = new Request("http://localhost:3000/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": sig },
      body: rawPayload,
    });

    const res = await handler({ request: req } as unknown as { request: Request });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { received: boolean; duplicate: boolean };
    expect(body.received).toBe(true);
    expect(body.duplicate).toBe(true);
  });

  it("processes successful checkout.session.completed: marks order paid and triggers email", async () => {
    const rawPayload = JSON.stringify({
      id: "evt_success_checkout_456",
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: "order_456",
        },
      },
    });
    const sig = generateStripeSignature(rawPayload, secret);

    const mockSendEmail = vi.fn().mockResolvedValue({ success: true });
    vi.doMock("@/lib/email.server", () => ({
      sendOrderConfirmationEmail: mockSendEmail,
    }));

    vi.doMock("@/integrations/supabase/client.server", () => ({
      supabaseAdmin: {
        from: vi.fn((table: string) => {
          if (table === "stripe_events") {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { event_id: "evt_success_checkout_456" },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === "orders") {
            return {
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        id: "order_456",
                        number: "ORD-456",
                        customer_email: "buyer@arcade.shop",
                        customer_name: "Arcade Buyer",
                        currency: "EUR",
                        subtotal_cents: 9000,
                        shipping_cents: 500,
                        total_cents: 9500,
                        order_items: [
                          {
                            product_name: "Franky Cap",
                            size: "L",
                            qty: 2,
                            unit_price_cents: 4500,
                          },
                        ],
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          return {};
        }),
      },
    }));

    const req = new Request("http://localhost:3000/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": sig },
      body: rawPayload,
    });

    const res = await handler({ request: req } as unknown as { request: Request });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { received: boolean };
    expect(body.received).toBe(true);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "buyer@arcade.shop",
        orderNumber: "ORD-456",
        customerName: "Arcade Buyer",
      }),
    );
  });
});
