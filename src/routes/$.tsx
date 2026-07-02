import { createFileRoute, Link } from "@tanstack/react-router";

import { PixelHorse } from "@/components/frankys/PixelHorse";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "Game Over — Franky's" },
      { name: "description", content: "That page does not exist." },
    ],
  }),
  component: () => (
    <div
      className="flex-1 flex flex-col items-center justify-center gap-4 py-16 px-4 text-center checker-bg"
      style={{ fontFamily: "var(--font-arcade)" }}
    >
      <div className="bg-cream border border-ink rounded-card p-6 flex flex-col items-center gap-4 arcade-bevel">
        <PixelHorse size={10} />
        <h1 style={{ fontSize: 22, letterSpacing: 2 }}>GAME OVER</h1>
        <p style={{ fontSize: 12 }}>THIS PAGE DOES NOT EXIST — INSERT COIN</p>
        <Link
          to="/"
          className="bg-ink text-cream px-4 py-3 rounded-btn border border-ink arcade-bevel"
          style={{ fontSize: 12, letterSpacing: 2 }}
        >
          RETURN HOME
        </Link>
      </div>
    </div>
  ),
});
