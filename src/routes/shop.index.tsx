import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { ErrorState } from "@/components/frankys/ErrorState";
import { VariantCard } from "@/components/frankys/VariantCard";
import { arcadeAudio } from "@/lib/audio/arcade-audio";
import { getProducts } from "@/lib/api/shop";
import type { ProductCategory } from "@/lib/api/types";

export const Route = createFileRoute("/shop/")({
  head: () => ({
    meta: [
      { title: "Shop — Franky's Arcade Merchandise & Caps" },
      {
        name: "description",
        content:
          "Browse Franky's arcade shop: handmade merino caps, heavyweight hoodies, skate totes, and enamel pins.",
      },
      { property: "og:title", content: "Shop — Franky's Merchandise & Caps" },
      {
        property: "og:description",
        content: "Browse Franky's arcade catalog: caps, hoodies, totes, pins.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "canonical", href: `${process.env.VITE_APP_URL || "http://localhost:3000"}/shop` },
    ],
  }),

  component: ShopPage,
});

type SortKey = "default" | "price-asc" | "price-desc" | "name";
type CategoryFilter = "all" | ProductCategory;

const CATEGORIES: { key: CategoryFilter; label: string; icon: string }[] = [
  { key: "all", label: "ALL MERCH", icon: "★" },
  { key: "caps", label: "CAPS", icon: "🧢" },
  { key: "hoodies", label: "HOODIES", icon: "🧥" },
  { key: "totes", label: "TOTES", icon: "👜" },
  { key: "pins", label: "PINS", icon: "🪙" },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "default", label: "FEATURED" },
  { key: "price-asc", label: "PRICE ↑" },
  { key: "price-desc", label: "PRICE ↓" },
  { key: "name", label: "A-Z" },
];

function ShopPage() {
  const {
    data: products,
    isError,
    isPending,
    refetch,
  } = useQuery({ queryKey: ["products"], queryFn: getProducts });

  const [category, setCategory] = useState<CategoryFilter>("all");
  const [sort, setSort] = useState<SortKey>("default");
  const [inStockOnly, setInStockOnly] = useState(false);

  const visible = useMemo(() => {
    let list = products ?? [];
    if (category !== "all") {
      list = list.filter((p) => (p.category ?? "caps") === category);
    }
    if (inStockOnly) {
      list = list.filter((p) => p.inStock);
    }

    switch (sort) {
      case "price-asc":
        return [...list].sort((a, b) => a.priceCents - b.priceCents);
      case "price-desc":
        return [...list].sort((a, b) => b.priceCents - a.priceCents);
      case "name":
        return [...list].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return list;
    }
  }, [products, category, sort, inStockOnly]);

  const handleCategoryChange = (key: CategoryFilter) => {
    arcadeAudio.playBeep(520);
    setCategory(key);
  };

  return (
    <div className="flex-1 bg-cream">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
        <header className="flex items-end justify-between border-b border-ink pb-3">
          <h1 style={{ fontFamily: "var(--font-arcade)", fontSize: 18, letterSpacing: 2 }}>
            ★ THE ARCADE SHOP
          </h1>
          <span className="text-muted" style={{ fontFamily: "var(--font-arcade)", fontSize: 10 }}>
            {products ? `${visible.length} ITEMS` : isError ? "OFFLINE" : "LOADING..."}
          </span>
        </header>

        {/* Category Tabs */}
        <div
          className="flex flex-wrap items-center gap-2"
          style={{ fontFamily: "var(--font-arcade)", fontSize: 10, letterSpacing: 1 }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              aria-pressed={category === cat.key}
              onClick={() => handleCategoryChange(cat.key)}
              className={`px-4 py-2 rounded-btn border border-ink arcade-bevel flex items-center gap-1.5 transition-all ${
                category === cat.key
                  ? "bg-marquee text-ink font-bold scale-105"
                  : "bg-cream text-ink hover:bg-ink hover:text-cream"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Sort & Stock Filters */}
        {products && products.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-2"
            style={{ fontFamily: "var(--font-arcade)", fontSize: 9, letterSpacing: 1 }}
          >
            {SORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                aria-pressed={sort === s.key}
                onClick={() => setSort(s.key)}
                className={`px-3 py-1.5 rounded-pill border border-ink arcade-bevel transition-colors ${
                  sort === s.key ? "bg-ink text-cream" : "bg-cream hover:bg-ink hover:text-cream"
                }`}
              >
                {s.label}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={inStockOnly}
              onClick={() => setInStockOnly((v: boolean) => !v)}
              className={`px-3 py-1.5 rounded-pill border border-ink arcade-bevel ml-auto transition-colors ${
                inStockOnly ? "bg-buy text-cream" : "bg-cream hover:bg-ink hover:text-cream"
              }`}
            >
              IN STOCK ONLY
            </button>
          </div>
        )}

        {isError ? (
          <ErrorState message="COULD NOT LOAD THE CATALOG." onRetry={() => void refetch()} />
        ) : isPending ? (
          <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
            aria-busy="true"
            aria-live="polite"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="border border-ink rounded-card h-64 checker-bg opacity-40 animate-pulse"
              />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p
            className="border border-ink rounded-card p-6 text-center"
            style={{ fontFamily: "var(--font-arcade)", fontSize: 12 }}
          >
            {inStockOnly
              ? "NO ITEMS IN STOCK RIGHT NOW."
              : "NO ITEMS FOUND IN THIS CATEGORY. CHECK BACK SOON."}
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {visible.map((p) => (
              <VariantCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
