// Shop API surface. Wired to the real server routes:
//   GET  /api/products  → Product[]
//   POST /api/orders    → Order   (body: OrderDraft)
//
// Type signatures MUST stay identical to what the UI consumes today —
// swapping backends only touches the two fetch calls below.

import { apiFetch } from "./client";
import { resolveProductImage } from "./product-images";
import type { CartLine, Order, OrderDraft, Product } from "./types";

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
  return apiFetch<Order>("/orders", {
    method: "POST",
    body: JSON.stringify(draft),
  });
}

export async function getOrder(id: string): Promise<Order> {
  return apiFetch<Order>(`/orders/${id}`);
}


export function formatPrice(cents: number, currency: "EUR" | "USD" = "EUR"): string {
  const symbol = currency === "EUR" ? "€" : "$";
  return `${symbol}${(cents / 100).toFixed(0)}`;
}
