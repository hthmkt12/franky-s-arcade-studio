import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createStripeSession } from "@/lib/stripe.server";
import { stripe } from "@/lib/stripe.server";

describe("createStripeSession", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  const sampleOpts = {
    orderId: "ord_12345678",
    orderNumber: "FAS-260901-001",
    customerEmail: "player1@arcade.shop",
    items: [
      {
        name: "Classic Red Cap",
        unitPriceCents: 4500,
        qty: 2,
        size: "ONE",
      },
    ],
    shippingCents: 700,
    discountCents: 900,
    currency: "EUR",
    successUrl: "http://localhost:3000/checkout/success/ord_12345678",
    cancelUrl: "http://localhost:3000/checkout",
  };

  it("returns simulated session in non-production when STRIPE_SECRET_KEY is missing", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    process.env.NODE_ENV = "development";

    const res = await createStripeSession(sampleOpts);
    expect(res.id).toMatch(/^sim_cs_/);
    expect(res.url).toBe(sampleOpts.successUrl);
  });

  it("throws fail-closed error in production when STRIPE_SECRET_KEY is missing", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    process.env.NODE_ENV = "production";

    await expect(createStripeSession(sampleOpts)).rejects.toThrow(
      /STRIPE_SECRET_KEY is not configured/,
    );
  });

  it("creates real Stripe checkout session with line items, shipping, and discount coupon", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_mock_valid_key";
    process.env.NODE_ENV = "development";

    const mockCoupon = { id: "cou_arcade_test_123" };
    const mockSession = {
      id: "cs_test_mock_session_456",
      url: "https://checkout.stripe.com/c/pay/cs_test_mock_session_456",
    };

    const couponSpy = vi
      .spyOn(stripe.coupons, "create")
      .mockResolvedValue(
        mockCoupon as unknown as Awaited<ReturnType<typeof stripe.coupons.create>>,
      );

    const sessionSpy = vi
      .spyOn(stripe.checkout.sessions, "create")
      .mockResolvedValue(
        mockSession as unknown as Awaited<ReturnType<typeof stripe.checkout.sessions.create>>,
      );

    const res = await createStripeSession(sampleOpts);

    expect(couponSpy).toHaveBeenCalledWith({
      amount_off: 900,
      currency: "eur",
      duration: "once",
      name: "Arcade Cheat Code Discount",
    });

    expect(sessionSpy).toHaveBeenCalledWith({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: "player1@arcade.shop",
      client_reference_id: "ord_12345678",
      metadata: {
        order_id: "ord_12345678",
        order_number: "FAS-260901-001",
      },
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Classic Red Cap [ONE]",
            },
            unit_amount: 4500,
          },
          quantity: 2,
        },
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Standard Shipping (Portugal / Worldwide)",
            },
            unit_amount: 700,
          },
          quantity: 1,
        },
      ],
      discounts: [{ coupon: "cou_arcade_test_123" }],
      success_url: sampleOpts.successUrl,
      cancel_url: sampleOpts.cancelUrl,
    });

    expect(res.id).toBe("cs_test_mock_session_456");
    expect(res.url).toBe("https://checkout.stripe.com/c/pay/cs_test_mock_session_456");
  });

  it("handles coupon creation failure without crashing the checkout session", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_mock_valid_key";

    vi.spyOn(stripe.coupons, "create").mockRejectedValue(new Error("Stripe rate limit on coupons"));

    const mockSession = {
      id: "cs_test_mock_session_fallback",
      url: "https://checkout.stripe.com/c/pay/cs_test_mock_session_fallback",
    };

    vi.spyOn(stripe.checkout.sessions, "create").mockResolvedValue(
      mockSession as unknown as Awaited<ReturnType<typeof stripe.checkout.sessions.create>>,
    );

    const res = await createStripeSession(sampleOpts);
    expect(res.id).toBe("cs_test_mock_session_fallback");
  });
});
