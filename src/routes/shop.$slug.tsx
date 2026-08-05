import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { ErrorState } from "@/components/frankys/ErrorState";
import { formatPrice, getProductBySlug } from "@/lib/api/shop";

import { useCart } from "@/lib/cart/CartContext";
import type { ProductSize } from "@/lib/api/types";

export const Route = createFileRoute("/shop/$slug")({
  head: ({ params }) => {
    const name = params.slug.replace(/-/g, " ").toUpperCase();
    const title = `${name} — Franky's Handmade Wool Cap`;
    const description = `${name}: a handmade merino wool cap from Franky's, knit in Portugal. Flat shipping, arcade-shop energy.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: `https://frankys.lovable.app/shop/${params.slug}` }],
    };
  },

  notFoundComponent: () => (
    <div
      className="flex-1 flex flex-col items-center justify-center gap-3 p-10 text-center"
      style={{ fontFamily: "var(--font-arcade)" }}
    >
      <h1 style={{ fontSize: 18 }}>CAP NOT FOUND</h1>
      <Link
        to="/shop"
        className="bg-ink text-cream px-4 py-2 rounded-btn border border-ink arcade-bevel"
        style={{ fontSize: 10 }}
      >
        BACK TO SHOP
      </Link>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const {
    data: product,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug(slug),
  });
  const cart = useCart();
  const [size, setSize] = useState<ProductSize>("ONE");
  const [qty, setQty] = useState(1);

  if (isError) {
    return (
      <div className="flex-1 bg-cream flex items-center justify-center p-10">
        <ErrorState message="COULD NOT LOAD THIS CAP." onRetry={() => void refetch()} />
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="flex-1 bg-cream flex items-center justify-center p-10">
        <div className="border border-ink rounded-card h-64 w-full max-w-4xl checker-bg opacity-40 animate-pulse" />
      </div>
    );
  }

  if (!product) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center gap-3 p-10 text-center"
        style={{ fontFamily: "var(--font-arcade)" }}
      >
        <h1 style={{ fontSize: 18 }}>CAP NOT FOUND</h1>
        <Link
          to="/shop"
          className="bg-ink text-cream px-4 py-2 rounded-btn border border-ink arcade-bevel"
          style={{ fontSize: 10 }}
        >
          BACK TO SHOP
        </Link>
      </div>
    );
  }

  const activeSize: ProductSize = product.sizes.includes(size) ? size : product.sizes[0] ?? "ONE";
  const add = () => {
    cart.addItem(product.id, activeSize, qty);
    toast(`ADDED — ${product.name} (${activeSize}) ×${qty}`);
  };

  return (
    <div className="flex-1 bg-cream">
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div
          className="border border-ink rounded-card checker-bg min-h-[320px] md:min-h-[500px] flex items-center justify-center p-6"
        >
          <div className="bg-cream border border-ink rounded-card p-4 arcade-bevel">
            <img
              src={product.image.url}
              alt={product.image.alt}
              width={512}
              height={512}
              className="max-h-[380px] w-auto object-contain"
            />
          </div>
        </div>

        <div
          className="flex flex-col gap-4"
          style={{ fontFamily: "var(--font-arcade)" }}
        >
          <div className="flex flex-col gap-1">
            <Link
              to="/shop"
              preload="intent"
              style={{ fontSize: 9 }}
              className="text-muted underline underline-offset-4 w-fit"
            >
              ← BACK TO SHOP
            </Link>
            <h1 style={{ fontSize: 20, letterSpacing: 2 }}>{product.name}</h1>
            <p style={{ fontSize: 14 }}>{formatPrice(product.priceCents, product.currency)}</p>
          </div>

          <p
            className="text-muted"
            style={{ fontFamily: "VT323, monospace", fontSize: 18, lineHeight: 1.3 }}
          >
            {product.description}
          </p>

          <div className="flex flex-col gap-2">
            <span style={{ fontSize: 10, letterSpacing: 1 }}>SIZE</span>
            <div className="flex gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  aria-pressed={s === size}
                  className={`px-3 h-10 rounded-btn border border-ink arcade-bevel ${
                    s === activeSize ? "bg-ink text-cream" : "bg-cream text-ink"
                  }`}
                  style={{ fontSize: 10, minWidth: 44 }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span style={{ fontSize: 10, letterSpacing: 1 }}>QTY</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQty((v) => Math.max(1, v - 1))}
                className="w-10 h-10 border border-ink rounded-btn arcade-bevel"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span
                className="w-10 text-center"
                style={{ fontFamily: "VT323, monospace", fontSize: 20 }}
              >
                {qty}
              </span>
              <button
                onClick={() => setQty((v) => Math.min(9, v + 1))}
                className="w-10 h-10 border border-ink rounded-btn arcade-bevel"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            disabled={!product.inStock}
            onClick={add}
            className="bg-buy text-cream py-4 rounded-btn border border-ink arcade-bevel disabled:bg-muted disabled:cursor-not-allowed"
            style={{ fontSize: 14, letterSpacing: 2 }}
          >
            {product.inStock ? "ADD TO CART" : "SOLD OUT"}
          </button>

          {product.inStock && product.stockQty <= 5 && (
            <p className="text-muted text-center" style={{ fontSize: 10, letterSpacing: 1 }}>
              LOW STOCK — ONLY {product.stockQty} LEFT
            </p>
          )}


          <ul
            className="border border-pixel rounded-card p-3 flex flex-col gap-1"
            style={{ fontSize: 10 }}
          >
            {product.materials.map((m) => (
              <li key={m}>★ {m}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
