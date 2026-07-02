import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { formatPrice } from "@/lib/api/shop";
import { useCart } from "@/lib/cart/CartContext";
import type { Product } from "@/lib/api/types";

export function VariantCard({ product }: { product: Product }) {
  const cart = useCart();
  const defaultSize = product.sizes[0] ?? "ONE";

  const add = () => {
    cart.addItem(product.id, defaultSize, 1);
    toast(`ADDED — ${product.name} (${defaultSize})`);
  };

  return (
    <div className="border border-ink rounded-card overflow-hidden flex flex-col bg-cream">
      <Link
        to="/shop/$slug"
        params={{ slug: product.slug }}
        preload="intent"
        className="flex-1 min-h-[180px] flex items-center justify-center p-3 bg-cream"
        aria-label={`View ${product.name}`}
      >
        <img
          src={product.image.url}
          alt={product.image.alt}
          width={512}
          height={512}
          loading="lazy"
          className="max-h-[160px] w-auto object-contain"
        />
      </Link>
      <div
        className="border-t border-pixel px-3 py-2 flex items-center justify-between"
        style={{ fontSize: 10 }}
      >
        <div className="flex flex-col gap-0.5">
          <span style={{ fontWeight: 700 }}>{product.name}</span>
          <span>{formatPrice(product.priceCents, product.currency)}</span>
        </div>
        <span
          className="border border-ink rounded-btn px-2 py-1 arcade-bevel"
          style={{ fontSize: 9 }}
        >
          TRY IN [AR]
        </span>
      </div>
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
