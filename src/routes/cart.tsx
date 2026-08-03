import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { ErrorState } from "@/components/frankys/ErrorState";
import { PixelHorse } from "@/components/frankys/PixelHorse";

import { computeTotals, formatPrice, getProducts } from "@/lib/api/shop";
import { useCart } from "@/lib/cart/CartContext";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Cart — Franky's" },
      { name: "description", content: "Review the caps in your cart." },
      { property: "og:title", content: "Cart — Franky's" },
      { property: "og:description", content: "Review the caps in your cart." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const {
    data: products,
    isError,
    isPending,
    refetch,
  } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const items = products ? cart.buildView(products) : [];
  const totals = products ? computeTotals(cart.lines, products) : null;

  return (
    <div className="flex-1 bg-cream">
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-5">
        <h1
          className="border-b border-ink pb-3"
          style={{ fontFamily: "var(--font-arcade)", fontSize: 18, letterSpacing: 2 }}
        >
          ★ YOUR CART
        </h1>

        {isError ? (
          <ErrorState message="COULD NOT LOAD YOUR CART." onRetry={() => void refetch()} />
        ) : isPending ? (
          <div className="flex flex-col gap-2" aria-busy="true" aria-live="polite">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="border border-ink rounded-card h-24 checker-bg opacity-40 animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (

          <div
            className="border border-ink rounded-card p-10 flex flex-col items-center gap-4 checker-bg"
          >
            <div className="bg-cream border border-ink rounded-card p-6 flex flex-col items-center gap-3 arcade-bevel">
              <PixelHorse size={8} />
              <p style={{ fontFamily: "var(--font-arcade)", fontSize: 12 }}>
                CART EMPTY — INSERT COIN
              </p>
              <Link
                to="/shop"
                className="bg-ink text-cream px-4 py-2 rounded-btn border border-ink arcade-bevel"
                style={{ fontFamily: "var(--font-arcade)", fontSize: 10, letterSpacing: 2 }}
              >
                SHOP NOW
              </Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-2">
              {items.map((it) => (
                <li
                  key={`${it.productId}-${it.size}`}
                  className="border border-ink rounded-card p-3 flex items-center gap-3 bg-cream arcade-bevel"
                >
                  <img
                    src={it.product.image.url}
                    alt={it.product.image.alt}
                    width={72}
                    height={72}
                    className="w-16 h-16 md:w-20 md:h-20 object-contain border border-pixel rounded-btn"
                    loading="lazy"
                  />
                  <div
                    className="flex-1 flex flex-col gap-1"
                    style={{ fontFamily: "var(--font-arcade)", fontSize: 10 }}
                  >
                    <Link
                      to="/shop/$slug"
                      params={{ slug: it.product.slug }}
                      style={{ fontWeight: 700 }}
                    >
                      {it.product.name}
                    </Link>
                    <span className="text-muted">SIZE {it.size}</span>
                    <div className="flex items-center gap-1 mt-1">
                      <button
                        onClick={() => cart.updateQty(it.productId, it.size, it.qty - 1)}
                        className="w-7 h-7 border border-pixel rounded-btn arcade-bevel"
                        aria-label="Decrease"
                      >
                        −
                      </button>
                      <span
                        className="w-8 text-center"
                        style={{ fontFamily: "VT323, monospace", fontSize: 16 }}
                      >
                        {it.qty}
                      </span>
                      <button
                        onClick={() =>
                          cart.updateQty(it.productId, it.size, Math.min(9, it.qty + 1))
                        }
                        className="w-7 h-7 border border-pixel rounded-btn arcade-bevel"
                        aria-label="Increase"
                      >
                        +
                      </button>
                      <button
                        onClick={() => cart.removeItem(it.productId, it.size)}
                        className="ml-2 px-2 h-7 border border-pixel rounded-btn arcade-bevel"
                        style={{ fontSize: 9 }}
                      >
                        REMOVE
                      </button>
                    </div>
                  </div>
                  <span
                    style={{ fontFamily: "var(--font-arcade)", fontSize: 12, fontWeight: 700 }}
                  >
                    {formatPrice(it.lineTotalCents)}
                  </span>
                </li>
              ))}
            </ul>

            {totals && (
              <div
                className="border border-ink rounded-card p-4 flex flex-col gap-1.5 self-end w-full max-w-sm arcade-bevel"
                style={{ fontFamily: "var(--font-arcade)", fontSize: 11 }}
              >
                <Row label="SUBTOTAL" value={formatPrice(totals.subtotalCents)} />
                <Row label="SHIPPING" value={formatPrice(totals.shippingCents)} />
                <div className="border-t border-pixel border-dashed my-1" />
                <Row label="TOTAL" value={formatPrice(totals.totalCents)} bold />
                <Link
                  to="/checkout"
                  className="mt-3 bg-buy text-cream py-3 rounded-btn border border-ink arcade-bevel text-center"
                  style={{ fontSize: 12, letterSpacing: 2 }}
                >
                  CHECKOUT
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between" style={{ fontWeight: bold ? 700 : 400 }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
