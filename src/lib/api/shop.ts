// Shop API surface. Mocked today, REST-ready tomorrow.
//
// To wire a real backend later, replace each function body with the
// commented `apiFetch(...)` call. Type signatures must NOT change.

import hatBlack from "@/assets/hat-black.png";
import hatGreen from "@/assets/hat-green.png";
import hatOchre from "@/assets/hat-ochre.png";
import hatNavy from "@/assets/hat-navy.png";
import hatRed from "@/assets/hat-red.png";

import { wait /*, apiFetch */ } from "./client";
import type { CartLine, Order, OrderDraft, Product } from "./types";

const SHIPPING_FLAT_CENTS = 700;

const PRODUCTS: Product[] = [
  {
    id: "p_black",
    slug: "frankys-black",
    name: "FRANKY'S BLACK",
    colorHex: "#0a0a0a",
    priceCents: 6500,
    currency: "EUR",
    sizes: ["S", "M", "L"],
    inStock: true,
    description: "Classic fit. 100% fine merino wool. Satin lining. Handmade in Portugal.",
    materials: ["100% MERINO WOOL", "SATIN LINING", "HANDMADE IN PORTUGAL"],
    image: { url: hatBlack, alt: "Franky's black 5-panel cap" },
  },
  {
    id: "p_green",
    slug: "frankys-green",
    name: "FRANKY'S GREEN",
    colorHex: "#1f6f3a",
    priceCents: 6500,
    currency: "EUR",
    sizes: ["S", "M", "L"],
    inStock: false,
    description: "Forest green wool cap. Limited run, currently sold out.",
    materials: ["100% MERINO WOOL", "SATIN LINING", "HANDMADE IN PORTUGAL"],
    image: { url: hatGreen, alt: "Franky's green 5-panel cap" },
  },
  {
    id: "p_ochre",
    slug: "frankys-ochre",
    name: "FRANKY'S OCHRE",
    colorHex: "#faa21f",
    priceCents: 6500,
    currency: "EUR",
    sizes: ["S", "M", "L"],
    inStock: true,
    description: "Warm ochre wool. The arcade marquee on your head.",
    materials: ["100% MERINO WOOL", "SATIN LINING", "HANDMADE IN PORTUGAL"],
    image: { url: hatOchre, alt: "Franky's ochre 5-panel cap" },
  },
  {
    id: "p_navy",
    slug: "frankys-navy",
    name: "FRANKY'S NAVY",
    colorHex: "#1d2c5b",
    priceCents: 6500,
    currency: "EUR",
    sizes: ["S", "M", "L"],
    inStock: true,
    description: "Navy blue wool cap. Skate-shop staple.",
    materials: ["100% MERINO WOOL", "SATIN LINING", "HANDMADE IN PORTUGAL"],
    image: { url: hatNavy, alt: "Franky's navy 5-panel cap" },
  },
  {
    id: "p_red",
    slug: "frankys-red",
    name: "FRANKY'S RED",
    colorHex: "#c8222b",
    priceCents: 6500,
    currency: "EUR",
    sizes: ["S", "M", "L"],
    inStock: true,
    description: "Crimson red wool cap. Insert coin, press start.",
    materials: ["100% MERINO WOOL", "SATIN LINING", "HANDMADE IN PORTUGAL"],
    image: { url: hatRed, alt: "Franky's red 5-panel cap" },
  },
];

export async function getProducts(): Promise<Product[]> {
  await wait(150);
  return PRODUCTS;
  // return apiFetch<Product[]>("/products");
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  await wait(120);
  return PRODUCTS.find((p) => p.slug === slug) ?? null;
  // return apiFetch<Product>(`/products/${encodeURIComponent(slug)}`);
}

export interface PriceBreakdown {
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
}

export function computeTotals(lines: CartLine[], products: Product[]): PriceBreakdown {
  const subtotalCents = lines.reduce((sum, line) => {
    const product = products.find((p) => p.id === line.productId);
    if (!product) return sum;
    return sum + product.priceCents * line.qty;
  }, 0);
  const shippingCents = subtotalCents > 0 ? SHIPPING_FLAT_CENTS : 0;
  return { subtotalCents, shippingCents, totalCents: subtotalCents + shippingCents };
}

export async function createOrder(draft: OrderDraft): Promise<Order> {
  await wait(400);
  const totals = computeTotals(draft.items, PRODUCTS);
  const id = `ord_${Math.random().toString(36).slice(2, 10)}`;
  const number = `FRK-${Math.floor(100000 + Math.random() * 900000)}`;
  return {
    id,
    number,
    items: draft.items,
    customer: draft.customer,
    subtotalCents: totals.subtotalCents,
    shippingCents: totals.shippingCents,
    totalCents: totals.totalCents,
    currency: "EUR",
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  // return apiFetch<Order>("/orders", {
  //   method: "POST",
  //   body: JSON.stringify(draft),
  // });
}

export function formatPrice(cents: number, currency: "EUR" | "USD" = "EUR"): string {
  const symbol = currency === "EUR" ? "€" : "$";
  return `${symbol}${(cents / 100).toFixed(0)}`;
}
