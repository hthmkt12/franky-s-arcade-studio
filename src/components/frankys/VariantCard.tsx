import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { formatPrice } from "@/lib/api/shop";
import { trackEvent } from "@/lib/analytics";
import { useCart } from "@/lib/cart/CartContext";
import { openArModal } from "@/components/frankys/ArModal";
import { openSizeGuide } from "@/components/frankys/SizeGuideModal";
import type { Product, ProductSize } from "@/lib/api/types";

export function VariantCard({ product }: { product: Product }) {
  const cart = useCart();
  const defaultSize = product.sizes[0] ?? "ONE";
  const [size, setSize] = useState<ProductSize>(defaultSize);

  const add = () => {
    cart.addItem(product.id, size, 1);
    trackEvent("add_to_cart", {
      productId: product.id,
      name: product.name,
      size,
      qty: 1,
      priceCents: product.priceCents,
    });
    toast(`ADDED — ${product.name} (${size})`);
  };

  const handleSelect = () => {
    trackEvent("select_item", {
      productId: product.id,
      slug: product.slug,
      name: product.name,
    });
  };

  return (
    <div className="border-2 border-ink rounded-card overflow-hidden flex flex-col bg-cream shadow-arcade transition-all duration-150 hover:-translate-y-1 hover:shadow-arcade-lg">
      <Link
        to="/shop/$slug"
        params={{ slug: product.slug }}
        preload="intent"
        onClick={handleSelect}
        className="flex-1 min-h-[180px] flex items-center justify-center p-3 bg-cream group relative"
        aria-label={`View ${product.name}`}
      >
        <img
          src={product.image.url}
          alt={product.image.alt}
          width={512}
          height={512}
          loading="lazy"
          className="max-h-[160px] w-auto object-contain transition-transform duration-200 group-hover:scale-105"
        />
        {product.inStock && product.stockQty <= 5 && (
          <span
            className="absolute top-2 left-2 bg-marquee text-ink font-arcade px-2 py-0.5 rounded-btn border border-ink shadow-arcade-sm font-bold"
            style={{ fontSize: 8 }}
          >
            LIMITED: {product.stockQty}
          </span>
        )}
      </Link>
      <div
        className="border-t-2 border-ink px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-cream"
        style={{ fontSize: 10 }}
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <span style={{ fontWeight: 700 }} className="truncate">
            {product.name}
          </span>
          <span className="font-bold">{formatPrice(product.priceCents, product.currency)}</span>
        </div>

        <button
          type="button"
          onClick={() => openArModal({ name: product.name, image: product.image.url })}
          className="border-2 border-ink rounded-btn px-2 py-1 arcade-bevel shadow-arcade-sm arcade-btn-active hover:bg-marquee transition-colors shrink-0 font-arcade"
          style={{ fontSize: 9 }}
          aria-label={`Try ${product.name} in AR`}
        >
          TRY [AR]
        </button>
      </div>

      {product.sizes.length > 1 && (
        <div
          className="border-t border-dashed border-ink px-3 py-2 flex items-center justify-between gap-2"
          style={{ fontSize: 8 }}
        >
          <div className="flex items-center gap-1">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                aria-pressed={s === size}
                className={`min-w-[28px] h-7 px-1.5 rounded-btn border-2 border-ink arcade-btn-active transition-all ${
                  s === size
                    ? "bg-ink text-cream shadow-none"
                    : "bg-cream text-ink shadow-arcade-sm hover:bg-marquee"
                }`}
                style={{ fontSize: 8 }}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => openSizeGuide(product.category ?? "caps")}
            className="text-muted underline underline-offset-2 hover:text-ink transition-colors font-arcade"
            style={{ fontSize: 8 }}
          >
            [SIZE ?]
          </button>
        </div>
      )}

      <button
        type="button"
        disabled={!product.inStock}
        onClick={add}
        className="border-t-2 border-ink py-2.5 px-3 text-center disabled:text-muted disabled:cursor-not-allowed hover:bg-ink hover:text-cream active:bg-charcoal arcade-btn-active transition-colors font-arcade font-bold"
        style={{ fontSize: 10, letterSpacing: 1 }}
      >
        {product.inStock ? "ADD TO CART" : "OUT OF STOCK"}
      </button>
    </div>
  );
}
