// Shop API surface. Wired to the real server routes:
//   GET  /api/products  → Product[]
//   POST /api/orders    → Order   (body: OrderDraft)
//
// Type signatures MUST stay identical to what the UI consumes today —
// swapping backends only touches the two fetch calls below.

import { apiFetch } from "./client";
import { resolveProductImage } from "./product-images";
import type { CartLine, Currency, Order, OrderDraft, Product } from "./types";
import { convertPrice, CURRENCY_SYMBOLS, getShippingRate } from "../i18n";

const SHIPPING_FLAT_CENTS = 700;

function hydrate(p: Product): Product {
  return { ...p, image: { ...p.image, url: resolveProductImage(p.image.url) } };
}

export async function getProducts(): Promise<Product[]> {
  const products = await apiFetch<Product[]>("/products");
  return products.map(hydrate);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  // Small catalog → filter client-side rather than shipping a per-slug route.
  const products = await getProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

export interface PriceBreakdown {
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
}

export function computeTotals(
  lines: CartLine[],
  products: Product[],
  countryCode = "PT",
  currency: Currency = "EUR",
): PriceBreakdown {
  const subtotalCents = lines.reduce((sum, line) => {
    const product = products.find((p) => p.id === line.productId);
    if (!product) return sum;
    return sum + convertPrice(product.priceCents, currency) * line.qty;
  }, 0);
  // Free shipping on orders over €100 (10000 cents in base EUR currency)
  const freeShippingThreshold = convertPrice(10000, currency);
  const isFreeShipping = subtotalCents >= freeShippingThreshold;
  const shippingCents = subtotalCents > 0 && !isFreeShipping ? getShippingRate(countryCode, currency) : 0;
  return { subtotalCents, shippingCents, totalCents: subtotalCents + shippingCents };
}

export interface FreeShippingProgress {
  thresholdCents: number;
  remainingCents: number;
  progressPercent: number;
  unlocked: boolean;
}

export function getFreeShippingProgress(
  subtotalCents: number,
  currency: Currency = "EUR",
): FreeShippingProgress {
  const thresholdCents = convertPrice(10000, currency);
  const remainingCents = Math.max(0, thresholdCents - subtotalCents);
  const unlocked = subtotalCents >= thresholdCents;
  const progressPercent = thresholdCents > 0
    ? Math.min(100, Math.round((subtotalCents / thresholdCents) * 100))
    : 0;
  return { thresholdCents, remainingCents, progressPercent, unlocked };
}

export async function createOrder(draft: OrderDraft): Promise<Order> {
  return apiFetch<Order>("/orders", {
    method: "POST",
    body: JSON.stringify(draft),
  });
}

export async function getOrder(id: string, token?: string): Promise<Order> {
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  return apiFetch<Order>(`/orders/${id}${query}`);
}

export function formatPrice(cents: number, currency: Currency = "EUR"): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? "€";
  return `${symbol}${(cents / 100).toFixed(0)}`;
}
