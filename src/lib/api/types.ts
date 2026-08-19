// Domain types shared between frontend and (future) backend.
// Keep this file backend-agnostic — no React, no fetch.

export type Currency = "EUR" | "USD";

export type ProductSize = "S" | "M" | "L" | "ONE";

export interface ProductImage {
  url: string;
  alt: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  colorHex: string;
  priceCents: number;
  currency: Currency;
  sizes: ProductSize[];
  inStock: boolean;
  /** Remaining units. 0 = sold out; <= 5 shows a low-stock warning. */
  stockQty: number;

  description: string;
  materials: string[];
  image: ProductImage;
}

export interface CartLine {
  productId: string;
  size: ProductSize;
  qty: number;
}

export interface CartItemView extends CartLine {
  product: Product;
  lineTotalCents: number;
}

export interface Customer {
  name: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface OrderDraft {
  items: CartLine[];
  customer: Customer;
  promoCode?: string;
}

export interface Order {
  id: string;
  number: string;
  items: CartLine[];
  customer: Customer;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  currency: Currency;
  status: "pending" | "paid" | "shipped" | "cancelled";
  createdAt: string;
  guestToken?: string;
}

export interface ApiError {
  code: string;
  message: string;
}
