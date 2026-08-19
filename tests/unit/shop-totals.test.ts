import { describe, expect, it } from "vitest";
import { computeTotals, formatPrice } from "@/lib/api/shop";
import type { CartLine, Product } from "@/lib/api/types";

const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    slug: "classic-red",
    name: "Classic Red Cap",
    colorHex: "#e63946",
    priceCents: 4500, // €45
    currency: "EUR",
    sizes: ["S", "M", "L", "ONE"],
    inStock: true,
    stockQty: 10,
    description: "Merino wool red cap",
    materials: ["100% Merino Wool"],
    image: { url: "/assets/hat-red.png", alt: "Red Cap" },
  },
  {
    id: "prod-2",
    slug: "classic-black",
    name: "Classic Black Cap",
    category: "caps",
    colorHex: "#111111",
    priceCents: 5000, // €50
    currency: "EUR",
    sizes: ["ONE"],
    inStock: true,
    stockQty: 2,
    description: "Merino wool black cap",
    materials: ["100% Merino Wool"],
    image: { url: "/assets/hat-black.png", alt: "Black Cap" },
  },
  {
    id: "prod-3",
    slug: "arcade-heavy-hoodie",
    name: "Franky Arcade Heavy Hoodie",
    category: "hoodies",
    colorHex: "#1a1a1a",
    priceCents: 8500, // €85
    currency: "EUR",
    sizes: ["S", "M", "L", "XL"],
    inStock: true,
    stockQty: 15,
    description: "Heavyweight 450gsm hoodie",
    materials: ["100% Organic Cotton"],
    image: { url: "/assets/hat-black.png", alt: "Arcade Hoodie" },
  },
  {
    id: "prod-4",
    slug: "pixel-coin-pin",
    name: "1-UP Pixel Coin Enamel Pin",
    category: "pins",
    colorHex: "#faa21f",
    priceCents: 1200, // €12
    currency: "EUR",
    sizes: ["ONE"],
    inStock: true,
    stockQty: 50,
    description: "Hard enamel pin",
    materials: ["Hard Enamel"],
    image: { url: "/assets/hat-red.png", alt: "Coin Pin" },
  },
];

describe("computeTotals & shop calculations", () => {
  it("returns zero totals when cart is empty", () => {
    const lines: CartLine[] = [];
    const totals = computeTotals(lines, MOCK_PRODUCTS, "PT", "EUR");

    expect(totals.subtotalCents).toBe(0);
    expect(totals.shippingCents).toBe(0);
    expect(totals.totalCents).toBe(0);
  });

  it("computes single item subtotal with PT shipping (€5)", () => {
    const lines: CartLine[] = [{ productId: "prod-1", size: "M", qty: 1 }];
    const totals = computeTotals(lines, MOCK_PRODUCTS, "PT", "EUR");

    expect(totals.subtotalCents).toBe(4500);
    expect(totals.shippingCents).toBe(500); // €5 in PT
    expect(totals.totalCents).toBe(5000);
  });

  it("applies free shipping when subtotal >= €100 (in PT / EU)", () => {
    const lines: CartLine[] = [
      { productId: "prod-1", size: "M", qty: 2 }, // €90
      { productId: "prod-2", size: "ONE", qty: 1 }, // €50 -> €140 total
    ];
    const totals = computeTotals(lines, MOCK_PRODUCTS, "PT", "EUR");

    expect(totals.subtotalCents).toBe(14000);
    expect(totals.shippingCents).toBe(0); // Free shipping over €100
    expect(totals.totalCents).toBe(14000);
  });

  it("calculates EU international shipping (€7) below threshold", () => {
    const lines: CartLine[] = [{ productId: "prod-1", size: "L", qty: 1 }];
    const totals = computeTotals(lines, MOCK_PRODUCTS, "FR", "EUR");

    expect(totals.subtotalCents).toBe(4500);
    expect(totals.shippingCents).toBe(700); // €7 flat rate EU
    expect(totals.totalCents).toBe(5200);
  });

  it("computes multi-category merchandise order totals accurately", () => {
    const lines: CartLine[] = [
      { productId: "prod-3", size: "L", qty: 1 }, // Hoodie: €85
      { productId: "prod-4", size: "ONE", qty: 2 }, // Pin: 2 x €12 = €24 -> Subtotal = €109
    ];
    const totals = computeTotals(lines, MOCK_PRODUCTS, "PT", "EUR");

    expect(totals.subtotalCents).toBe(10900);
    expect(totals.shippingCents).toBe(0); // Free shipping over €100
    expect(totals.totalCents).toBe(10900);
  });

  it("formats prices correctly with currency symbols", () => {
    expect(formatPrice(4500, "EUR")).toBe("€45");
    expect(formatPrice(5000, "USD")).toBe("$50");
    expect(formatPrice(6500, "GBP")).toBe("£65");
  });
});
