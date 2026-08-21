import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { formatPrice } from "@/lib/api/shop";
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
    toast(`ADDED — ${product.name} (${size})`);
  };

  return (
    <div className="border border-ink rounded-card overflow-hidden flex flex-col bg-cream transition-transform duration-200 hover:-translate-y-0.5">
      <Link
        to="/shop/$slug"
        params={{ slug: product.slug }}
        preload="intent"
        className="flex-1 min-h-[180px] flex items-center justify-center p-3 bg-cream group"
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
      </Link>
      <div
        className="border-t border-pixel px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
        style={{ fontSize: 10 }}
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <span style={{ fontWeight: 700 }} className="truncate">
            {product.name}
          </span>
          <span>{formatPrice(product.priceCents, product.currency)}</span>
          {product.inStock && product.stockQty <= 5 && (
            <span className="text-muted" style={{ fontSize: 8 }}>
              ONLY {product.stockQty} LEFT
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => openArModal({ name: product.name, image: product.image.url })}
          className="border border-ink rounded-btn px-2 py-1 arcade-bevel hover:bg-marquee transition-colors shrink-0"
          style={{ fontSize: 9 }}
          aria-label={`Try ${product.name} in AR`}
        >
          TRY IN [AR]
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
                className={`min-w-[26px] h-7 px-1 rounded-btn border border-ink arcade-bevel transition-colors ${
                  s === size ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-marquee"
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
            className="text-muted underline underline-offset-2 hover:text-ink transition-colors"
            style={{ fontSize: 8 }}
          >
            [?]
          </button>
        </div>
      )}

      <button
        type="button"
        disabled={!product.inStock}
        onClick={add}
        className="border-t border-dashed border-ink py-2 text-center disabled:text-muted disabled:cursor-not-allowed hover:bg-ink hover:text-cream transition-colors"
        style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1 }}
      >
        {product.inStock ? "ADD TO CART" : "OUT OF STOCK"}
      </button>
    </div>
  );
}
