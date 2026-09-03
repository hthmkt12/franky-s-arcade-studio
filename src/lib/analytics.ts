// Client-side lightweight telemetry for Franky's Arcade Studio.
// Zero-dependency, SSR-safe, compatible with GTM/GA4/Plausible/PostHog.
// Dispatches custom DOM event "arcade:telemetry" and pushes to window.dataLayer.

import type { Currency, ProductSize } from "./api/types";

export type FunnelEvent =
  | {
      name: "view_item_list";
      params: { category?: string; itemCount: number };
    }
  | {
      name: "select_item";
      params: { productId: string; slug: string; name: string };
    }
  | {
      name: "view_item";
      params: {
        productId: string;
        name: string;
        priceCents: number;
        currency: Currency;
        category?: string;
      };
    }
  | {
      name: "add_to_cart";
      params: {
        productId: string;
        name?: string;
        size: ProductSize;
        qty: number;
        priceCents?: number;
      };
    }
  | {
      name: "remove_from_cart";
      params: { productId: string; size: ProductSize };
    }
  | {
      name: "view_cart";
      params: { itemCount: number; subtotalCents: number };
    }
  | {
      name: "begin_checkout";
      params: { itemCount: number; totalCents: number };
    }
  | {
      name: "apply_promo";
      params: { promoCode: string; valid: boolean; discountPercent?: number };
    }
  | {
      name: "purchase";
      params: {
        orderId: string;
        orderNumber: string;
        totalCents: number;
        currency: Currency;
        itemsCount: number;
      };
    }
  | {
      name: "arcade_cheat_unlocked";
      params: { code: string; mechanism: "coin" | "konami" | "runner" };
    };

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function trackEvent<E extends FunnelEvent>(name: E["name"], params: E["params"]) {
  if (typeof window === "undefined") return;

  const payload = { event: name, ...params, timestamp: Date.now() };

  try {
    window.dispatchEvent(new CustomEvent("arcade:telemetry", { detail: payload }));

    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push(payload);
    }

    if (import.meta.env.DEV) {
      console.debug(`[arcade:telemetry] ${name}`, params);
    }
  } catch (err) {
    console.error("[arcade:telemetry] Dispatch failed", err);
  }
}
