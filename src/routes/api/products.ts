// GET /api/products
// Returns the public catalog as Product[] (see src/lib/api/types.ts).
// Reads from the `products` table via a publishable-key client — the
// "Products are publicly readable" RLS policy allows anon SELECT.

import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

import type { Product, ProductSize } from "@/lib/api/types";
import type { Database } from "@/integrations/supabase/types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

function rowToProduct(row: ProductRow & { category?: string }): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: (row.category as Product["category"]) ?? "caps",
    colorHex: row.color_hex,
    priceCents: row.price_cents,
    currency: row.currency as Product["currency"],
    sizes: (row.sizes ?? []) as ProductSize[],
    inStock: row.in_stock,
    stockQty: row.stock_qty,

    description: row.description ?? "",
    materials: row.materials ?? [],
    // Assets are bundled on the client. The API returns an opaque key;
    // the browser resolves it to a hashed URL via src/lib/api/product-images.ts.
    image: { url: `asset:${row.image_key}`, alt: row.image_alt ?? row.name },
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const Route = createFileRoute("/api/products")({
  server: {
    handlers: {
      GET: async () => {
        const supabase = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );

        const { data, error } = await supabase
          .from("products")
          .select(
            "id, slug, name, color_hex, price_cents, currency, sizes, in_stock, stock_qty, description, materials, image_key, image_alt, sort_order, created_at",
          )
          .order("sort_order", { ascending: true });

        if (error) {
          console.error("[api/products] read failed", error);
          return json({ code: "read_failed", message: error.message }, 500);
        }
        return json((data ?? []).map(rowToProduct));
      },
    },
  },
});
