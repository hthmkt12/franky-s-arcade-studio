import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useState } from "react";
import { toast } from "sonner";

import { ErrorState } from "@/components/frankys/ErrorState";
import { openArModal } from "@/components/frankys/ArModal";
import { openSizeGuide } from "@/components/frankys/SizeGuideModal";
const Cap3DViewer = lazy(() =>
  import("@/components/frankys/Cap3DViewer").then(({ Cap3DViewer }) => ({ default: Cap3DViewer })),
);
import { formatPrice, getProductBySlug, getProducts } from "@/lib/api/shop";

import { useCart } from "@/lib/cart/CartContext";
import { trackEvent } from "@/lib/analytics";
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
      links: [{ rel: "canonical", href: `/shop/${params.slug}` }],
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
  const [view3D, setView3D] = useState(false);

  useEffect(() => {
    if (product) {
      trackEvent("view_item", {
        productId: product.id,
        name: product.name,
        priceCents: product.priceCents,
        currency: product.currency,
        category: product.category,
      });
    }
  }, [product]);

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

  const activeSize: ProductSize = product.sizes.includes(size) ? size : (product.sizes[0] ?? "ONE");
  const add = () => {
    cart.addItem(product.id, activeSize, qty);
    trackEvent("add_to_cart", {
      productId: product.id,
      name: product.name,
      size: activeSize,
      qty,
      priceCents: product.priceCents,
    });
    toast(`ADDED — ${product.name} (${activeSize}) ×${qty}`);
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    color: product.colorHex,
    material: product.materials.join(", "),
    brand: { "@type": "Brand", name: "Franky's" },
    offers: {
      "@type": "Offer",
      price: (product.priceCents / 100).toFixed(2),
      priceCurrency: product.currency,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="flex-1 bg-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Media & 3D Viewer */}
        <div className="lg:col-span-7 border-2 border-ink rounded-card checker-bg min-h-[360px] md:min-h-[520px] flex flex-col items-center justify-center gap-4 p-6 shadow-arcade-card lg:sticky lg:top-20 self-start">
          <div className="bg-cream border-2 border-ink rounded-card p-4 shadow-arcade-sm w-full flex items-center justify-center min-h-[320px]">
            {view3D && (product.category ?? "caps") === "caps" ? (
              <Suspense
                fallback={
                  <div
                    className="h-[300px] w-full checker-bg animate-pulse rounded-card"
                    aria-label="Loading 3D model"
                  />
                }
              >
                <Cap3DViewer colorHex={product.colorHex} className="h-[320px]" />
              </Suspense>
            ) : (
              <img
                src={product.image.url}
                alt={product.image.alt}
                width={512}
                height={512}
                loading="eager"
                fetchPriority="high"
                className="max-h-[380px] w-auto object-contain transition-transform duration-300 hover:scale-105"
              />
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {(product.category ?? "caps") === "caps" && (
              <button
                type="button"
                onClick={() => setView3D((v) => !v)}
                className={`border-2 border-ink rounded-btn px-4 py-2 shadow-arcade-sm arcade-btn-active transition-all ${
                  view3D ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-marquee"
                }`}
                style={{ fontFamily: "var(--font-arcade)", fontSize: 10, letterSpacing: 2 }}
                aria-label="Toggle 3D View"
              >
                {view3D ? "2D PHOTO" : "3D MODEL [360°]"}
              </button>
            )}

            <button
              type="button"
              onClick={() => openArModal({ name: product.name, image: product.image.url })}
              className="bg-cream border-2 border-ink rounded-btn px-4 py-2 shadow-arcade-sm arcade-btn-active hover:bg-marquee transition-all"
              style={{ fontFamily: "var(--font-arcade)", fontSize: 10, letterSpacing: 2 }}
              aria-label={`Try ${product.name} in AR`}
            >
              TRY IN [AR]
            </button>
          </div>
        </div>

        {/* Right Column: Details & Actions */}
        <div
          className="lg:col-span-5 flex flex-col gap-5 bg-cream border-2 border-ink rounded-card p-6 shadow-arcade-card"
          style={{ fontFamily: "var(--font-arcade)" }}
        >
          <div className="flex flex-col gap-1.5 border-b border-dashed border-ink/40 pb-4">
            <Link
              to="/shop"
              preload="intent"
              style={{ fontSize: 10 }}
              className="text-muted hover:text-ink transition-colors w-fit font-bold"
            >
              ← BACK TO SHOP
            </Link>
            <h1
              style={{ fontSize: "clamp(20px, 3vw, 26px)", letterSpacing: 2 }}
              className="font-bold"
            >
              {product.name}
            </h1>
            <p className="text-xl font-bold text-ink">
              {formatPrice(product.priceCents, product.currency)}
            </p>
          </div>

          <p
            className="text-charcoal font-medium"
            style={{ fontFamily: "VT323, monospace", fontSize: 20, lineHeight: 1.4 }}
          >
            {product.description}
          </p>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 10, letterSpacing: 1 }} className="font-bold">
                SIZE
              </span>
              <button
                type="button"
                onClick={() => openSizeGuide(product.category ?? "caps")}
                className="text-muted underline underline-offset-4 hover:text-ink transition-colors font-bold"
                style={{ fontSize: 9, letterSpacing: 1 }}
              >
                SIZE GUIDE [?]
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  aria-pressed={s === size}
                  className={`px-4 h-11 rounded-btn border-2 border-ink arcade-btn-active font-bold transition-all ${
                    s === activeSize
                      ? "bg-ink text-cream shadow-none"
                      : "bg-cream text-ink shadow-arcade-sm hover:bg-marquee"
                  }`}
                  style={{ fontSize: 10, minWidth: 48 }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span style={{ fontSize: 10, letterSpacing: 1 }} className="font-bold">
              QUANTITY
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQty((v) => Math.max(1, v - 1))}
                className="w-11 h-11 border-2 border-ink rounded-btn shadow-arcade-sm arcade-btn-active bg-cream hover:bg-marquee text-lg font-bold flex items-center justify-center"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span
                className="w-12 text-center font-bold"
                style={{ fontFamily: "VT323, monospace", fontSize: 24 }}
              >
                {qty}
              </span>
              <button
                onClick={() => setQty((v) => Math.min(9, v + 1))}
                className="w-11 h-11 border-2 border-ink rounded-btn shadow-arcade-sm arcade-btn-active bg-cream hover:bg-marquee text-lg font-bold flex items-center justify-center"
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
            className="w-full bg-buy text-white py-4 rounded-btn border-2 border-ink shadow-arcade arcade-btn-active disabled:bg-muted disabled:shadow-none disabled:cursor-not-allowed cursor-pointer font-bold transition-all"
            style={{ fontSize: 14, letterSpacing: 2 }}
          >
            {product.inStock ? "ADD TO CART" : "SOLD OUT"}
          </button>

          {!product.inStock && (
            <RestockAlertBox productId={product.id} productName={product.name} />
          )}

          {product.inStock && product.stockQty <= 5 && (
            <p
              className="bg-marquee text-ink px-3 py-1.5 rounded-btn border border-ink text-center font-bold shadow-arcade-sm"
              style={{ fontSize: 9, letterSpacing: 1 }}
            >
              ★ LOW STOCK — ONLY {product.stockQty} LEFT IN VAULT ★
            </p>
          )}

          <ul
            className="border-2 border-pixel rounded-card p-4 flex flex-col gap-1.5 bg-white/40"
            style={{ fontSize: 10 }}
          >
            {product.materials.map((m) => (
              <li key={m} className="flex items-center gap-1.5">
                <span className="text-marquee">★</span> {m}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <MoreCaps slug={product.slug} />

      {/* Mobile sticky buy bar */}
      <div
        className="md:hidden sticky bottom-0 z-20 border-t-2 border-ink bg-cream px-4 py-2 flex items-center gap-3 shadow-arcade-modal"
        style={{ fontFamily: "var(--font-arcade)" }}
      >
        <div className="flex flex-col min-w-0">
          <span className="truncate" style={{ fontSize: 10 }}>
            {product.name}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700 }}>
            {formatPrice(product.priceCents * qty, product.currency)}
          </span>
        </div>
        <button
          type="button"
          disabled={!product.inStock}
          onClick={add}
          className="flex-1 bg-buy text-white py-3 rounded-btn border-2 border-ink shadow-arcade-sm arcade-btn-active disabled:bg-muted disabled:shadow-none disabled:cursor-not-allowed font-bold min-h-[44px]"
          style={{ fontSize: 11, letterSpacing: 2 }}
        >
          {product.inStock ? `ADD ${activeSize}` : "SOLD OUT"}
        </button>
      </div>
    </div>
  );
}

function RestockAlertBox({ productId, productName }: { productId: string; productName: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/products/restock-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, email: email.trim() }),
      });

      if (!res.ok) throw new Error("Failed to register");

      setSubscribed(true);
      toast.success(`RESTOCK ALERT SET FOR ${productName.toUpperCase()}`);
    } catch {
      toast.error("COULD NOT SET RESTOCK ALERT");
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="border border-ink bg-white p-3 rounded-card text-center flex flex-col gap-1">
        <span className="text-buy font-bold" style={{ fontSize: 10 }}>
          ★ 1-UP! YOU'RE ON THE LIST ★
        </span>
        <span className="text-muted" style={{ fontSize: 8 }}>
          WE'LL EMAIL {email.toUpperCase()} WHEN THIS CAP IS KNITTED.
        </span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-ink bg-white p-3 rounded-card flex flex-col gap-2"
    >
      <div className="flex flex-col gap-0.5">
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>
          NOTIFY ME WHEN RESTOCKED
        </span>
        <span className="text-muted" style={{ fontSize: 8 }}>
          GET AN 8-BIT EMAIL ONCE RESTOCKED
        </span>
      </div>
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="player1@arcade.shop"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-pixel rounded-btn px-2 py-1 bg-cream flex-1 text-xs"
          style={{ fontFamily: "VT323, monospace", fontSize: 16 }}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-ink text-cream px-3 py-1 rounded-btn text-xs arcade-bevel disabled:opacity-50"
          style={{ fontSize: 9, letterSpacing: 1 }}
        >
          {loading ? "SAVING..." : "NOTIFY ME"}
        </button>
      </div>
    </form>
  );
}

function MoreCaps({ slug }: { slug: string }) {
  const { data: products } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const others = (products ?? []).filter((p) => p.slug !== slug).slice(0, 4);
  if (others.length === 0) return null;

  return (
    <section
      className="max-w-6xl mx-auto w-full px-4 pb-10 flex flex-col gap-3"
      style={{ fontFamily: "var(--font-arcade)" }}
    >
      <h2 className="border-b border-ink pb-2" style={{ fontSize: 14, letterSpacing: 2 }}>
        ★ MORE CAPS
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {others.map((p) => (
          <Link
            key={p.id}
            to="/shop/$slug"
            params={{ slug: p.slug }}
            preload="intent"
            className="border border-ink rounded-card overflow-hidden bg-cream arcade-bevel transition-transform hover:-translate-y-0.5"
          >
            <img
              src={p.image.url}
              alt={p.image.alt}
              width={512}
              height={512}
              loading="lazy"
              decoding="async"
              className="w-full aspect-square object-cover border-b border-ink"
            />
            <div className="p-2 flex items-center justify-between gap-2">
              <span className="truncate" style={{ fontSize: 9 }}>
                {p.name}
              </span>
              <span style={{ fontSize: 9, fontWeight: 700 }}>
                {formatPrice(p.priceCents, p.currency)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
