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
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="border border-ink rounded-card checker-bg min-h-[320px] md:min-h-[500px] flex flex-col items-center justify-center gap-3 p-6 md:sticky md:top-20 self-start">
          <div className="bg-cream border border-ink rounded-card p-4 arcade-bevel w-full flex items-center justify-center min-h-[320px]">
            {view3D && (product.category ?? "caps") === "caps" ? (
              <Suspense
                fallback={
                  <div
                    className="h-[300px] w-full checker-bg animate-pulse"
                    aria-label="Loading 3D model"
                  />
                }
              >
                <Cap3DViewer colorHex={product.colorHex} className="h-[300px]" />
              </Suspense>
            ) : (
              <img
                src={product.image.url}
                alt={product.image.alt}
                width={512}
                height={512}
                loading="eager"
                fetchPriority="high"
                className="max-h-[380px] w-auto object-contain"
              />
            )}
          </div>

          <div className="flex gap-2">
            {(product.category ?? "caps") === "caps" && (
              <button
                type="button"
                onClick={() => setView3D((v) => !v)}
                className={`border border-ink rounded-btn px-3 py-2 arcade-bevel transition-colors ${
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
              className="bg-cream border border-ink rounded-btn px-3 py-2 arcade-bevel hover:bg-marquee transition-colors"
              style={{ fontFamily: "var(--font-arcade)", fontSize: 10, letterSpacing: 2 }}
              aria-label={`Try ${product.name} in AR`}
            >
              TRY IN [AR]
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4" style={{ fontFamily: "var(--font-arcade)" }}>
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
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 10, letterSpacing: 1 }}>SIZE</span>
              <button
                type="button"
                onClick={() => openSizeGuide(product.category ?? "caps")}
                className="text-muted underline underline-offset-4 hover:text-ink transition-colors"
                style={{ fontSize: 9, letterSpacing: 1 }}
              >
                SIZE GUIDE [?]
              </button>
            </div>
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
            className="w-full bg-buy text-cream py-4 rounded-btn border border-ink arcade-bevel disabled:bg-muted disabled:cursor-not-allowed cursor-pointer"
            style={{ fontSize: 14, letterSpacing: 2 }}
          >
            {product.inStock ? "ADD TO CART" : "SOLD OUT"}
          </button>

          {!product.inStock && (
            <RestockAlertBox productId={product.id} productName={product.name} />
          )}

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

      <MoreCaps slug={product.slug} />

      {/* Mobile sticky buy bar */}
      <div
        className="md:hidden sticky bottom-0 z-20 border-t-2 border-ink bg-cream px-4 py-2 flex items-center gap-3"
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
          className="flex-1 bg-buy text-cream py-3 rounded-btn border border-ink arcade-bevel disabled:bg-muted disabled:cursor-not-allowed"
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
