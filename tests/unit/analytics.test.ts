import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { trackEvent } from "@/lib/analytics";

describe("analytics telemetry", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it("safely ignores calls when window is undefined (SSR)", () => {
    // @ts-expect-error - simulating SSR
    delete globalThis.window;

    expect(() => {
      trackEvent("view_cart", { itemCount: 2, subtotalCents: 9000 });
    }).not.toThrow();
  });

  it("dispatches CustomEvent arcade:telemetry with payload", () => {
    const dispatchSpy = vi.fn();
    // @ts-expect-error - mock window
    globalThis.window = {
      dispatchEvent: dispatchSpy,
    };

    trackEvent("add_to_cart", {
      productId: "prod_1",
      name: "Classic Cap",
      size: "M",
      qty: 1,
      priceCents: 4500,
    });

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const event = dispatchSpy.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe("arcade:telemetry");
    expect(event.detail.event).toBe("add_to_cart");
    expect(event.detail.productId).toBe("prod_1");
    expect(event.detail.size).toBe("M");
    expect(typeof event.detail.timestamp).toBe("number");
  });

  it("pushes to dataLayer if present", () => {
    const dataLayer: unknown[] = [];
    // @ts-expect-error - mock window with dataLayer
    globalThis.window = {
      dispatchEvent: vi.fn(),
      dataLayer,
    };

    trackEvent("apply_promo", {
      promoCode: "COIN10",
      valid: true,
      discountPercent: 10,
    });

    expect(dataLayer).toHaveLength(1);
    const item = dataLayer[0] as { event: string; promoCode: string; valid: boolean };
    expect(item.event).toBe("apply_promo");
    expect(item.promoCode).toBe("COIN10");
    expect(item.valid).toBe(true);
  });
});
