import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

import { computeTotals, formatPrice, getProducts } from "@/lib/api/shop";
import { useCart } from "@/lib/cart/CartContext";
import { useQuery } from "@tanstack/react-query";

import { ErrorState } from "./ErrorState";
import { PixelHorse } from "./PixelHorse";

export function CartDrawer() {
  const cart = useCart();
  const panelRef = useRef<HTMLElement | null>(null);
  const {
    data: products,
    isError,
    isPending,
    refetch,
  } = useQuery({ queryKey: ["products"], queryFn: getProducts });

  // Escape closes; focus moves into the drawer so keyboard users are not stranded.
  useEffect(() => {
    if (!cart.isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cart.close();
      if (e.key !== "Tab" || !panelRef.current) return;
      const nodes = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [cart.isOpen, cart.close]);

  if (!cart.isOpen) return null;

  const items = products ? cart.buildView(products) : [];
  const totals = products ? computeTotals(cart.lines, products) : null;


  return (
    <div className="fixed inset-0 z-40 flex" onClick={cart.close}>
      <div className="flex-1" style={{ background: "rgba(0,0,0,0.55)" }} />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-cream border-l border-ink flex flex-col"
        style={{ fontFamily: "var(--font-arcade)" }}
      >

        <div className="marquee-sheen border-b border-ink flex items-center justify-between px-3 h-9">
          <span style={{ fontSize: 10, fontWeight: 700 }}>YOUR CART [{cart.itemCount}]</span>
          <button
            onClick={cart.close}
            aria-label="Close cart"
            style={{ fontSize: 10, fontWeight: 700 }}
          >
            X
          </button>
        </div>

        {isError ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <ErrorState
              compact
              message="COULD NOT LOAD YOUR CART ITEMS."
              onRetry={() => void refetch()}
            />
          </div>
        ) : isPending ? (
          <div
            className="flex-1 flex flex-col gap-2 p-3"
            aria-busy="true"
            aria-live="polite"
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="border border-pixel rounded-btn h-20 checker-bg opacity-40 animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (

          <div
            className="flex-1 flex flex-col items-center justify-center gap-3 p-6"
            style={{ fontSize: 10 }}
          >
            <PixelHorse size={6} />
            <p>EMPTY CART — INSERT COIN</p>
            <Link
              to="/shop"
              onClick={cart.close}
              className="bg-ink text-cream py-2 px-4 rounded-btn arcade-bevel border border-ink"
              style={{ fontSize: 10 }}
            >
              KEEP SHOPPING
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-auto p-3 flex flex-col gap-2">
              {items.map((it) => (
                <li
                  key={`${it.productId}-${it.size}`}
                  className="border border-pixel rounded-btn p-2 flex items-center gap-2 bg-cream arcade-bevel"
                >
                  <img
                    src={it.product.image.url}
                    alt={it.product.image.alt}
                    width={56}
                    height={56}
                    className="w-14 h-14 object-contain border border-pixel rounded-btn bg-cream"
                    loading="lazy"
                  />
                  <div className="flex-1 flex flex-col gap-1" style={{ fontSize: 10 }}>
                    <span style={{ fontWeight: 700 }}>{it.product.name}</span>
                    <span className="text-muted">SIZE {it.size}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => cart.updateQty(it.productId, it.size, it.qty - 1)}
                        className="w-6 h-6 border border-pixel rounded-btn arcade-bevel"
                        aria-label="Decrease"
                      >
                        −
                      </button>
                      <span
                        className="w-7 text-center"
                        style={{ fontFamily: "VT323, monospace", fontSize: 16 }}
                      >
                        {it.qty}
                      </span>
                      <button
                        onClick={() =>
                          cart.updateQty(it.productId, it.size, Math.min(9, it.qty + 1))
                        }
                        className="w-6 h-6 border border-pixel rounded-btn arcade-bevel"
                        aria-label="Increase"
                      >
                        +
                      </button>
                      <button
                        onClick={() => cart.removeItem(it.productId, it.size)}
                        className="ml-auto px-2 h-6 border border-pixel rounded-btn arcade-bevel"
                        style={{ fontSize: 9 }}
                      >
                        REMOVE
                      </button>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700 }}>
                    {formatPrice(it.lineTotalCents)}
                  </span>
                </li>
              ))}
            </ul>

            <div
              className="border-t border-ink p-3 flex flex-col gap-1.5"
              style={{ fontSize: 10 }}
            >
              <Row label="SUBTOTAL" value={formatPrice(totals?.subtotalCents ?? 0)} />
              <Row label="SHIPPING" value={formatPrice(totals?.shippingCents ?? 0)} />
              <div className="border-t border-pixel border-dashed my-1" />
              <Row label="TOTAL" value={formatPrice(totals?.totalCents ?? 0)} bold />

              <Link
                to="/checkout"
                onClick={cart.close}
                className="mt-2 bg-buy text-cream py-3 rounded-btn arcade-bevel border border-ink text-center"
                style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2 }}
              >
                CHECKOUT
              </Link>
            </div>
          </>
        )}
      </aside>
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
