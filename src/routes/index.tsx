import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { CartProvider, useCart } from "@/lib/cart/CartContext";
import { createOrder, computeTotals, formatPrice, getProducts } from "@/lib/api/shop";
import type { Customer, Product, ProductSize } from "@/lib/api/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FRANKY'S — HAT SHOP" },
      { name: "description", content: "Franky's Amsterdam — handmade merino wool 5-panel caps. Order online." },
      { property: "og:title", content: "FRANKY'S — HAT SHOP" },
      { property: "og:description", content: "Handmade merino wool 5-panel caps from Amsterdam." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap",
      },
    ],
  }),
  component: () => (
    <CartProvider>
      <Shop />
    </CartProvider>
  ),
});

function Shop() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [size, setSize] = useState<ProductSize>("M");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const cart = useCart();

  useEffect(() => {
    if (!selectedId && products && products.length) {
      const first = products.find((p) => p.inStock) ?? products[0];
      setSelectedId(first.id);
    }
  }, [products, selectedId]);

  const selected = useMemo(
    () => products?.find((p) => p.id === selectedId) ?? null,
    [products, selectedId],
  );

  const variants = useMemo(
    () => (products ?? []).filter((p) => p.id !== selectedId).slice(0, 4),
    [products, selectedId],
  );

  const marqueeText = "WIN  STORE  COUPONS   ★   FREE  SHIPPING  OVER  €100   ★   HANDMADE  IN  PORTUGAL   ★   ";

  return (
    <main className="min-h-screen flex flex-col bg-cream text-ink">
      <TopMarquee text={marqueeText} />
      <Header onCartClick={cart.open} cartCount={cart.itemCount} />

      {isLoading || !selected ? (
        <div className="flex-1 flex items-center justify-center" style={{ fontSize: 10 }}>
          LOADING...
        </div>
      ) : (
        <section className="flex-1 grid lg:grid-cols-[3fr_2fr] gap-1 p-1">
          {/* Left — selected product hero */}
          <article className="border border-ink rounded-card overflow-hidden flex flex-col bg-cream">
            <div className="checker-bg relative flex-1 min-h-[440px] flex items-center justify-center p-6">
              <img
                src={selected.image.url}
                alt={selected.image.alt}
                width={768}
                height={768}
                className="max-h-[60vh] w-auto object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.25)]"
              />
              <div
                className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-ink text-cream border border-ink flex overflow-hidden"
                style={{ borderRadius: 9999, fontSize: 10 }}
              >
                <span className="px-3 py-1.5" style={{ fontWeight: 700 }}>3D</span>
                <span className="px-3 py-1.5 bg-cream text-ink border-l border-ink">AR</span>
              </div>
            </div>

            <div className="border-t border-ink px-3 pt-2.5 pb-1 flex items-baseline justify-between" style={{ fontSize: 16 }}>
              <h1 style={{ fontWeight: 700 }}>{selected.name}</h1>
              <span>{formatPrice(selected.priceCents, selected.currency)}</span>
            </div>
            <div className="px-3 pb-2 border-b border-pixel truncate" style={{ fontSize: 10, lineHeight: 1.5 }}>
              * {selected.materials.join(" * ")} *
            </div>

            {/* Size selector */}
            <div className="px-3 pt-3 flex items-center gap-2" style={{ fontSize: 10 }}>
              <span style={{ fontWeight: 700 }}>SIZE</span>
              <div className="flex gap-1">
                {selected.sizes.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSize(sz)}
                    className={`min-w-9 px-2 py-1.5 border rounded-btn arcade-bevel ${
                      size === sz ? "bg-ink text-cream border-ink" : "bg-cream border-pixel"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={!selected.inStock}
              onClick={() => cart.addItem(selected.id, size, 1)}
              className="block w-auto text-center bg-buy text-cream py-3 rounded-btn arcade-bevel mx-3 my-3 border border-ink disabled:bg-muted disabled:cursor-not-allowed"
              style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2 }}
            >
              {selected.inStock ? "ADD TO CART" : "OUT OF STOCK"}
            </button>

            <div className="flex justify-between px-3 py-1.5 border-t border-pixel" style={{ fontSize: 10 }}>
              <span>© FRANKY'S AMSTERDAM 2026</span>
              <span className="text-muted">SUBSCRIBE  SHIPPING</span>
            </div>
          </article>

          {/* Right — variant grid 2x2 */}
          <aside className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {variants.map((p) => (
              <VariantCard
                key={p.id}
                product={p}
                onSelect={() => setSelectedId(p.id)}
                onAdd={() => cart.addItem(p.id, p.sizes[0] ?? "ONE", 1)}
              />
            ))}
          </aside>
        </section>
      )}

      <BottomMarquee text={marqueeText} />

      {products && (
        <CartDrawer
          products={products}
          onCheckout={() => {
            cart.close();
            setCheckoutOpen(true);
          }}
        />
      )}
      {products && checkoutOpen && (
        <CheckoutModal
          products={products}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </main>
  );
}

function TopMarquee({ text }: { text: string }) {
  return (
    <div className="marquee-sheen border-b border-ink overflow-hidden h-7 flex items-center">
      <div
        className="flex whitespace-nowrap text-ink"
        style={{ fontFamily: "var(--font-arcade)", fontSize: 10, lineHeight: 1, animation: "marquee 40s linear infinite" }}
      >
        <span className="px-6">{text.repeat(8)}</span>
        <span className="px-6">{text.repeat(8)}</span>
      </div>
    </div>
  );
}

function BottomMarquee({ text }: { text: string }) {
  return (
    <div className="border-t border-ink overflow-hidden h-6 flex items-center bg-cream">
      <div
        className="flex whitespace-nowrap text-muted"
        style={{ fontFamily: "var(--font-arcade)", fontSize: 9, lineHeight: 1, animation: "marquee 60s linear infinite" }}
      >
        <span className="px-6">{text.repeat(8)}</span>
        <span className="px-6">{text.repeat(8)}</span>
      </div>
    </div>
  );
}

function Header({ onCartClick, cartCount }: { onCartClick: () => void; cartCount: number }) {
  return (
    <header className="border-b border-ink flex items-center justify-between px-4 h-14 bg-cream">
      <button
        aria-label="Clock"
        className="w-9 h-9 rounded-full border border-pixel flex items-center justify-center bg-cream arcade-bevel"
        style={{ fontSize: 14 }}
      >
        ◷
      </button>
      <div className="flex items-center gap-2">
        <PixelHorse size={4} color="var(--ink)" />
        <span style={{ fontFamily: "VT323, monospace", fontSize: 28, lineHeight: 1 }} className="mt-1">
          franky's
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onCartClick}
          aria-label="Cart"
          className="relative px-3 h-9 border border-ink rounded-btn bg-cream arcade-bevel"
          style={{ fontFamily: "var(--font-arcade)", fontSize: 10, letterSpacing: 1 }}
        >
          CART [{cartCount}]
        </button>
        <button aria-label="Menu" className="flex flex-col gap-1.5 p-2 rounded-btn border border-pixel arcade-bevel">
          <span className="block w-5 h-px bg-ink" />
          <span className="block w-5 h-px bg-ink" />
          <span className="block w-5 h-px bg-ink" />
        </button>
      </div>
    </header>
  );
}

function VariantCard({
  product,
  onSelect,
  onAdd,
}: {
  product: Product;
  onSelect: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="border border-ink rounded-card overflow-hidden flex flex-col bg-cream">
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 min-h-[180px] flex items-center justify-center p-3 bg-cream"
        aria-label={`Select ${product.name}`}
      >
        <img
          src={product.image.url}
          alt={product.image.alt}
          width={768}
          height={768}
          loading="lazy"
          className="max-h-[160px] w-auto object-contain"
        />
      </button>
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
        onClick={onAdd}
        className="border-t border-dashed border-ink py-2 text-center disabled:text-muted disabled:cursor-not-allowed"
        style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1 }}
      >
        {product.inStock ? "ADD TO CART" : "OUT OF STOCK"}
      </button>
    </div>
  );
}

function CartDrawer({
  products,
  onCheckout,
}: {
  products: Product[];
  onCheckout: () => void;
}) {
  const cart = useCart();
  const items = cart.buildView(products);
  const totals = computeTotals(cart.lines, products);

  if (!cart.isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex" onClick={cart.close}>
      <div className="flex-1" style={{ background: "rgba(0,0,0,0.55)" }} />
      <aside
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-cream border-l border-ink flex flex-col"
        style={{ fontFamily: "var(--font-arcade)" }}
      >
        <div className="marquee-sheen border-b border-ink flex items-center justify-between px-3 h-9">
          <span style={{ fontSize: 10, fontWeight: 700 }}>YOUR  CART  [{cart.itemCount}]</span>
          <button onClick={cart.close} aria-label="Close cart" style={{ fontSize: 10, fontWeight: 700 }}>
            X
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6" style={{ fontSize: 10 }}>
            <PixelHorse size={6} color="var(--ink)" />
            <p>EMPTY  CART  —  INSERT  COIN</p>
            <button
              onClick={cart.close}
              className="bg-ink text-cream py-2 px-4 rounded-btn arcade-bevel border border-ink"
              style={{ fontSize: 10 }}
            >
              KEEP  SHOPPING
            </button>
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
                        onClick={() => cart.updateQty(it.productId, it.size, Math.min(9, it.qty + 1))}
                        className="w-6 h-6 border border-pixel rounded-btn arcade-bevel"
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

            <div className="border-t border-ink p-3 flex flex-col gap-1.5" style={{ fontSize: 10 }}>
              <Row label="SUBTOTAL" value={formatPrice(totals.subtotalCents)} />
              <Row label="SHIPPING" value={formatPrice(totals.shippingCents)} />
              <div className="border-t border-pixel border-dashed my-1" />
              <Row label="TOTAL" value={formatPrice(totals.totalCents)} bold />
              <button
                onClick={onCheckout}
                className="mt-2 bg-buy text-cream py-3 rounded-btn arcade-bevel border border-ink"
                style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2 }}
              >
                CHECKOUT
              </button>
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

function CheckoutModal({
  products,
  onClose,
}: {
  products: Product[];
  onClose: () => void;
}) {
  const cart = useCart();
  const items = cart.buildView(products);
  const totals = computeTotals(cart.lines, products);
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [customer, setCustomer] = useState<Customer>({
    name: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    country: "NL",
  });

  const set = <K extends keyof Customer>(k: K, v: Customer[K]) =>
    setCustomer((c) => ({ ...c, [k]: v }));

  const valid =
    customer.name.trim() &&
    /.+@.+\..+/.test(customer.email) &&
    customer.address.trim() &&
    customer.city.trim() &&
    customer.postalCode.trim();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || items.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const order = await createOrder({ items: cart.lines, customer });
      setOrderNumber(order.number);
      cart.clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ORDER FAILED");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-auto bg-cream border border-ink rounded-card"
        style={{ fontFamily: "var(--font-arcade)" }}
      >
        <div className="marquee-sheen border-b border-ink flex items-center justify-between px-3 h-9 sticky top-0">
          <span style={{ fontSize: 10, fontWeight: 700 }}>CHECKOUT</span>
          <button onClick={onClose} aria-label="Close" style={{ fontSize: 10, fontWeight: 700 }}>
            X
          </button>
        </div>

        {orderNumber ? (
          <div className="p-5 flex flex-col gap-3 text-center" style={{ fontSize: 10, lineHeight: 1.6 }}>
            <div className="checker-bg border border-ink rounded-btn p-6" style={{ fontSize: 14 }}>
              ★ ORDER  CONFIRMED ★
            </div>
            <p style={{ fontSize: 12, fontWeight: 700 }}>{orderNumber}</p>
            <p className="text-muted">A RECEIPT WILL ARRIVE AT {customer.email.toUpperCase()}</p>
            <button
              onClick={onClose}
              className="bg-ink text-cream py-2 rounded-btn arcade-bevel border border-ink"
              style={{ fontSize: 10 }}
            >
              CLOSE
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-3 flex flex-col gap-3" style={{ fontSize: 10 }}>
            {items.length === 0 ? (
              <p className="text-center py-6">CART IS EMPTY</p>
            ) : (
              <>
                <ul className="flex flex-col gap-1">
                  {items.map((it) => (
                    <li
                      key={`${it.productId}-${it.size}`}
                      className="flex justify-between border border-pixel rounded-btn px-2 py-1.5 arcade-bevel"
                    >
                      <span>
                        {it.product.name}  ×{it.qty}  ({it.size})
                      </span>
                      <span>{formatPrice(it.lineTotalCents)}</span>
                    </li>
                  ))}
                </ul>

                <div className="grid grid-cols-1 gap-2">
                  <Field label="NAME" value={customer.name} onChange={(v) => set("name", v)} maxLength={80} />
                  <Field label="EMAIL" type="email" value={customer.email} onChange={(v) => set("email", v)} maxLength={120} />
                  <Field label="ADDRESS" value={customer.address} onChange={(v) => set("address", v)} maxLength={200} />
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="CITY" value={customer.city} onChange={(v) => set("city", v)} maxLength={80} />
                    <Field label="POSTAL" value={customer.postalCode} onChange={(v) => set("postalCode", v)} maxLength={20} />
                  </div>
                  <Field label="COUNTRY" value={customer.country} onChange={(v) => set("country", v)} maxLength={2} />
                </div>

                <div className="border-t border-pixel border-dashed pt-2 flex flex-col gap-1">
                  <Row label="SUBTOTAL" value={formatPrice(totals.subtotalCents)} />
                  <Row label="SHIPPING" value={formatPrice(totals.shippingCents)} />
                  <Row label="TOTAL" value={formatPrice(totals.totalCents)} bold />
                </div>

                {error && (
                  <p className="border border-ink bg-marquee text-ink p-2 rounded-btn" style={{ fontSize: 10 }}>
                    ! {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!valid || submitting}
                  className="bg-buy text-cream py-3 rounded-btn arcade-bevel border border-ink disabled:bg-muted disabled:cursor-not-allowed"
                  style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2 }}
                >
                  {submitting ? "SENDING..." : "PLACE  ORDER"}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  maxLength?: number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span style={{ fontSize: 10, fontWeight: 700 }}>{label}</span>
      <input
        required
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="border border-pixel rounded-btn px-2 py-1.5 bg-cream"
        style={{ fontFamily: "VT323, monospace", fontSize: 16 }}
      />
    </label>
  );
}

function PixelHorse({ size = 8, color = "var(--ink)" }: { size?: number; color?: string }) {
  const grid = [
    "................",
    "......##.##.....",
    ".....####.##....",
    "....######.##...",
    "...########.#...",
    "...##.######....",
    "...#############",
    "...#############",
    "...##....##..##.",
    "...##....##..##.",
    "................",
    "................",
  ];
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(16, ${size}px)`,
        gridTemplateRows: `repeat(12, ${size}px)`,
      }}
    >
      {grid.flatMap((row, y) =>
        row.split("").map((c, x) => (
          <div
            key={`${x}-${y}`}
            style={{
              width: size,
              height: size,
              background: c === "#" ? color : "transparent",
            }}
          />
        )),
      )}
    </div>
  );
}
