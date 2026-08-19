import { createFileRoute, Link } from "@tanstack/react-router";

import { PixelHorse } from "@/components/frankys/PixelHorse";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Franky's" },
      {
        name: "description",
        content: "Franky's is an arcade-shop for handmade merino wool caps made in Portugal.",
      },
      { property: "og:title", content: "About — Franky's" },
      {
        property: "og:description",
        content: "An arcade-shop for handmade merino wool caps made in Portugal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: `${process.env.VITE_APP_URL || "http://localhost:3000"}/about` }],
  }),

  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="flex-1 bg-cream">
      <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-6">
        <header className="flex items-center gap-4 border-b border-ink pb-4">
          <PixelHorse size={6} />
          <h1 style={{ fontFamily: "var(--font-arcade)", fontSize: 18, letterSpacing: 2 }}>
            ★ OUR STORY
          </h1>
        </header>

        <section
          className="flex flex-col gap-3"
          style={{ fontFamily: "VT323, monospace", fontSize: 20, lineHeight: 1.35 }}
        >
          <p>
            Franky's is a one-man arcade dressed as a hat shop. We make merino wool caps by
            hand in a small workshop in Porto, one color at a time, in tiny runs.
          </p>
          <p>
            No trend cycles, no seasonal drops, no logos three inches tall. Cream paper. Pixel
            rules. One warm orange call. Insert coin.
          </p>
        </section>

        <section
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
          style={{ fontFamily: "var(--font-arcade)", fontSize: 10, letterSpacing: 1 }}
        >
          <Card title="SHIPPING">
            FLAT €7 IN EUROPE.<br />FREE OVER €100.<br />2–5 DAYS.
          </Card>
          <Card title="RETURNS">
            30 DAYS UNWORN.<br />EMAIL US FIRST.<br />NO QUESTIONS.
          </Card>
          <Card title="CONTACT">
            HELLO@FRANKYS.SHOP<br />PORTO, PT<br />MON–FRI 10–18
          </Card>
        </section>

        <div>
          <Link
            to="/shop"
            className="bg-buy text-cream px-6 py-3 rounded-btn border border-ink arcade-bevel inline-block"
            style={{ fontFamily: "var(--font-arcade)", fontSize: 12, letterSpacing: 2 }}
          >
            SEE THE CAPS →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-ink rounded-card p-4 arcade-bevel flex flex-col gap-2">
      <h3 style={{ fontSize: 11 }}>★ {title}</h3>
      <p style={{ fontSize: 10, lineHeight: 1.6 }}>{children}</p>
    </div>
  );
}
