import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { ErrorState } from "@/components/frankys/ErrorState";
import { PixelHorse } from "@/components/frankys/PixelHorse";

import { ViewModeToggle, type ViewMode } from "@/components/frankys/ViewModeToggle";
import { formatPrice, getProducts } from "@/lib/api/shop";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Franky's — Handmade Wool Caps from Portugal" },
      {
        name: "description",
        content:
          "Arcade-shop for handmade merino wool caps. Insert coin, browse the shop, and pick your color.",
      },
      { property: "og:title", content: "Franky's — Handmade Wool Caps" },
      {
        property: "og:description",
        content: "Handmade merino wool caps. Cream paper, pixel rules, one warm orange call.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://frankys.lovable.app/" }],
  }),

  component: LandingPage,
});

function LandingPage() {
  const {
    data: products,
    isError,
    refetch,
  } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const featured = products?.filter((p) => p.inStock).slice(0, 3) ?? [];

  const [viewMode, setViewMode] = useState<ViewMode>("3D");


  return (
    <div className="flex-1 flex flex-col">
      {/* HERO */}
      <section className="border-b border-ink checker-warp">
        <div className="checker-warp-floor" aria-hidden />
        <div className="checker-warp-fade" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-4 py-10 md:py-16 flex flex-col items-center gap-6 text-center">

          <div className="bg-cream border border-ink rounded-card p-6 md:p-10 flex flex-col items-center gap-5 arcade-bevel">
            <ViewModeToggle mode={viewMode} onChange={setViewMode} productName="FRANKY'S CAP" />
            <PixelHorse size={12} />

            <h1
              style={{
                fontFamily: "var(--font-arcade)",
                fontSize: "clamp(20px, 4vw, 40px)",
                letterSpacing: 3,
                lineHeight: 1.2,
              }}
            >
              INSERT COIN
              <br />
              PRESS START
            </h1>
            <p
              className="max-w-md text-muted"
              style={{ fontFamily: "VT323, monospace", fontSize: 20, lineHeight: 1.3 }}
            >
              Handmade merino wool caps from Portugal. Arcade-shop energy, none of the chrome.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link
                to="/shop"
                preload="intent"
                className="bg-buy text-cream px-6 py-3 rounded-btn border border-ink arcade-bevel"
                style={{ fontFamily: "var(--font-arcade)", fontSize: 12, letterSpacing: 2 }}
              >
                SHOP NOW
              </Link>
              <Link
                to="/about"
                preload="intent"
                className="bg-cream text-ink px-6 py-3 rounded-btn border border-ink arcade-bevel"
                style={{ fontFamily: "var(--font-arcade)", fontSize: 12, letterSpacing: 2 }}
              >
                OUR STORY
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="border-b border-ink bg-cream">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ fontFamily: "var(--font-arcade)", fontSize: 14, letterSpacing: 2 }}>
              ★ FEATURED
            </h2>
            <Link
              to="/shop"
              preload="intent"
              style={{ fontFamily: "var(--font-arcade)", fontSize: 10, letterSpacing: 1 }}
              className="underline underline-offset-4"
            >
              SEE ALL →
            </Link>
          </div>
          {isError ? (
            <ErrorState message="COULD NOT LOAD FEATURED CAPS." onRetry={() => void refetch()} />
          ) : !products ? (

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="border border-ink rounded-card h-56 checker-bg opacity-40 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featured.map((p) => (
                <Link
                  key={p.id}
                  to="/shop/$slug"
                  params={{ slug: p.slug }}
                  preload="intent"
                  className="border border-ink rounded-card overflow-hidden bg-cream flex flex-col arcade-bevel"
                >
                  <div className="flex-1 min-h-[180px] flex items-center justify-center p-4">
                    <img
                      src={p.image.url}
                      alt={p.image.alt}
                      width={512}
                      height={512}
                      loading="lazy"
                      className="max-h-[180px] w-auto object-contain"
                    />
                  </div>
                  <div
                    className="border-t border-pixel px-3 py-2 flex justify-between"
                    style={{ fontSize: 10 }}
                  >
                    <span style={{ fontWeight: 700 }}>{p.name}</span>
                    <span>{formatPrice(p.priceCents, p.currency)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* BADGES */}
      <section className="bg-cream">
        <div
          className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-3"
          style={{ fontFamily: "var(--font-arcade)", fontSize: 10, letterSpacing: 1 }}
        >
          {[
            "★ HANDMADE IN PORTUGAL",
            "★ 100% MERINO WOOL",
            "★ FREE SHIPPING OVER €100",
          ].map((t) => (
            <div
              key={t}
              className="border border-ink rounded-btn arcade-bevel px-4 py-4 text-center"
            >
              {t}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
