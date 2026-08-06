// GET /sitemap.xml — static pages plus one entry per product slug.

import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

const SITE = "https://frankys.lovable.app";

export const Route = createFileRoute("/sitemap/xml" as never)({
  server: {
    handlers: {
      GET: async () => {
        const urls: { loc: string; priority: string }[] = [
          { loc: `${SITE}/`, priority: "1.0" },
          { loc: `${SITE}/shop`, priority: "0.9" },
          { loc: `${SITE}/about`, priority: "0.5" },
        ];

        try {
          const supabase = createClient<Database>(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_PUBLISHABLE_KEY!,
            { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
          );
          const { data } = await supabase
            .from("products")
            .select("slug")
            .order("sort_order", { ascending: true });
          for (const row of data ?? []) {
            urls.push({ loc: `${SITE}/shop/${row.slug}`, priority: "0.8" });
          }
        } catch (err) {
          console.error("[sitemap] product lookup failed", err);
        }

        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url><loc>${u.loc}</loc><priority>${u.priority}</priority></url>`)
  .join("\n")}
</urlset>
`;
        return new Response(body, {
          headers: { "content-type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
