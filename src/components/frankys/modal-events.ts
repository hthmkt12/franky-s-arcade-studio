import type { ProductCategory } from "@/lib/api/types";

export type ArDetail = { name?: string; image?: string };

export function openArModal(detail: ArDetail = {}) {
  window.dispatchEvent(new CustomEvent<ArDetail>("frankys:open-ar", { detail }));
}

export function openSizeGuide(category: ProductCategory = "caps") {
  window.dispatchEvent(new CustomEvent("frankys:open-size-guide", { detail: { category } }));
}
