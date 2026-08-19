// GET /robots.txt — allow the catalog, keep cart/checkout out of the index.

import { createFileRoute } from "@tanstack/react-router";

const SITE = process.env.VITE_APP_URL || "http://localhost:3000";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () =>
        new Response(
          [
            "User-agent: *",
            "Allow: /",
            "Disallow: /cart",
            "Disallow: /checkout",
            "",
            `Sitemap: ${SITE}/sitemap.xml`,
            "",
          ].join("\n"),
          { headers: { "content-type": "text/plain; charset=utf-8" } },
        ),
    },
  },
});
