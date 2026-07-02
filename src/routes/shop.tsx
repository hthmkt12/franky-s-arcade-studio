import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { VariantCard } from "@/components/frankys/VariantCard";
import { getProducts } from "@/lib/api/shop";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Franky's Wool Caps" },
      {
        name: "description",
        content: "Browse every Franky's cap. Handmade merino wool, five colors, one warm orange call.",
      },
      { property: "og:title", content: "Shop — Franky's Wool Caps" },
      {
        property: "og:description",
        content: "Browse every Franky's cap: black, ochre, green, navy, red.",
      },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({ queryKey: ["products"], queryFn: getProducts }),
  component: ShopPage,
});

function ShopPage() {
  const { data: products } = useQuery({ queryKey: ["products"], queryFn: getProducts });

  return (
    <div className="flex-1 bg-cream">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
        <header className="flex items-end justify-between border-b border-ink pb-3">
          <h1 style={{ fontFamily: "var(--font-arcade)", fontSize: 18, letterSpacing: 2 }}>
            ★ THE SHOP
          </h1>
          <span
            className="text-muted"
            style={{ fontFamily: "var(--font-arcade)", fontSize: 10 }}
          >
            {products ? `${products.length} CAPS` : "LOADING..."}
          </span>
        </header>

        {!products ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="border border-ink rounded-card h-64 checker-bg opacity-40 animate-pulse"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p
            className="border border-ink rounded-card p-6 text-center"
            style={{ fontFamily: "var(--font-arcade)", fontSize: 12 }}
          >
            NO CAPS AVAILABLE. CHECK BACK SOON.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((p) => (
              <VariantCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
