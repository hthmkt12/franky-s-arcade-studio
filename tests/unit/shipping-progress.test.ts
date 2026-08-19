import { describe, expect, it } from "vitest";
import { getFreeShippingProgress } from "@/lib/api/shop";

describe("getFreeShippingProgress", () => {
  it("reports the full remaining amount on an empty cart (€100 threshold)", () => {
    const p = getFreeShippingProgress(0, "EUR");

    expect(p.thresholdCents).toBe(10000);
    expect(p.remainingCents).toBe(10000);
    expect(p.progressPercent).toBe(0);
    expect(p.unlocked).toBe(false);
  });

  it("reports partial progress below the threshold", () => {
    const p = getFreeShippingProgress(4500, "EUR"); // €45 cap

    expect(p.thresholdCents).toBe(10000);
    expect(p.remainingCents).toBe(5500);
    expect(p.progressPercent).toBe(45);
    expect(p.unlocked).toBe(false);
  });

  it("unlocks at exactly the threshold", () => {
    const p = getFreeShippingProgress(10000, "EUR");

    expect(p.remainingCents).toBe(0);
    expect(p.progressPercent).toBe(100);
    expect(p.unlocked).toBe(true);
  });

  it("clamps progress to 100 once the threshold is passed", () => {
    const p = getFreeShippingProgress(14900, "EUR"); // over €100

    expect(p.remainingCents).toBe(0);
    expect(p.progressPercent).toBe(100);
    expect(p.unlocked).toBe(true);
  });

  it("converts the threshold into the target currency", () => {
    const p = getFreeShippingProgress(10800, "USD"); // 108% of €100

    expect(p.thresholdCents).toBe(10800);
    expect(p.progressPercent).toBe(100);
    expect(p.unlocked).toBe(true);
  });
});
