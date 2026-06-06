import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FRANKY'S — BE RIGHT BACK" },
      { name: "description", content: "Franky's arcade is temporarily down for maintenance. Insert coin soon." },
      { property: "og:title", content: "FRANKY'S — BE RIGHT BACK" },
      { property: "og:description", content: "Franky's arcade is temporarily down for maintenance. Insert coin soon." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" },
    ],
  }),
  component: Maintenance,
});

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const h = Math.floor(diff / 3.6e6);
  const m = Math.floor((diff % 3.6e6) / 6e4);
  const s = Math.floor((diff % 6e4) / 1000);
  return { h, m, s };
}

function Maintenance() {
  const target = new Date(Date.now() + 1000 * 60 * 60 * 6);
  const { h, m, s } = useCountdown(target);
  const pad = (n: number) => String(n).padStart(2, "0");

  const marqueeText = "★ FRANKY'S IS DOWN FOR MAINTENANCE ★ INSERT COIN SOON ★ HIGH SCORES SAFE ★ SKATERS WELCOME ★ ";

  return (
    <main className="min-h-screen flex flex-col bg-cream text-ink font-arcade">
      {/* Marquee */}
      <div className="bg-marquee border-y-4 border-ink overflow-hidden">
        <div
          className="flex whitespace-nowrap py-3 text-[10px] sm:text-xs text-ink"
          style={{ animation: "marquee 30s linear infinite" }}
        >
          <span className="px-4">{marqueeText.repeat(4)}</span>
          <span className="px-4">{marqueeText.repeat(4)}</span>
        </div>
      </div>

      {/* Checker bar */}
      <div className="checker-bg h-4 border-b-4 border-ink" />

      {/* Body */}
      <section className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl">
          <div className="border-4 border-ink bg-cream p-6 sm:p-10">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b-4 border-ink pb-3 mb-6 text-[8px] sm:text-[10px]">
              <span>FRANKY'S // SYS.404</span>
              <span className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-buy" style={{ animation: "blink 1s steps(1) infinite" }} />
                REC
              </span>
            </div>

            {/* Pixel mascot */}
            <div className="flex justify-center mb-6">
              <PixelHorse />
            </div>

            <h1 className="text-center text-2xl sm:text-4xl leading-[1.4] font-normal mb-4">
              BE RIGHT
              <br />
              BACK!
            </h1>

            <p className="text-center text-[10px] sm:text-xs leading-relaxed max-w-md mx-auto mb-8">
              THE ARCADE IS DOWN FOR SCHEDULED MAINTENANCE. OUR PIXEL JANITORS ARE WAXING THE RAMPS AND SWAPPING THE TOKEN HOPPER.
            </p>

            {/* Countdown */}
            <div className="border-4 border-ink p-4 sm:p-6 mb-8 bg-cream">
              <div className="text-center text-[8px] sm:text-[10px] mb-4 tracking-widest">RESPAWN IN</div>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {[
                  { v: pad(h), l: "HRS" },
                  { v: pad(m), l: "MIN" },
                  { v: pad(s), l: "SEC" },
                ].map((t) => (
                  <div key={t.l} className="border-4 border-ink bg-cream py-4 sm:py-6 text-center">
                    <div className="text-2xl sm:text-4xl">{t.v}</div>
                    <div className="text-[8px] sm:text-[10px] mt-2">{t.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Checker divider */}
            <div className="checker-bg h-3 mb-8 border-y-4 border-ink" />

            {/* Status list */}
            <ul className="text-[10px] sm:text-xs space-y-3 mb-8">
              <StatusRow label="SERVERS" status="REBOOTING" tone="marquee" />
              <StatusRow label="HIGH SCORES" status="SAFE" tone="buy" />
              <StatusRow label="SHOP" status="OFFLINE" tone="ink" />
              <StatusRow label="MASCOT" status="DANCING" tone="buy" />
            </ul>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="mailto:hello@frankys.arcade"
                className="border-4 border-ink bg-buy text-cream px-5 py-3 text-[10px] sm:text-xs text-center hover:translate-y-[2px] transition-transform"
                style={{ boxShadow: "inset 0 0 0 2px var(--cream)" }}
              >
                PRESS START → EMAIL US
              </a>
              <button
                onClick={() => location.reload()}
                className="border-4 border-ink bg-cream text-ink px-5 py-3 text-[10px] sm:text-xs hover:bg-ink hover:text-cream transition-colors"
              >
                INSERT COIN (RETRY)
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between text-[8px] sm:text-[10px]">
            <span>© FRANKY'S ARCADE</span>
            <span>v1.0.4 — MAINT MODE</span>
          </div>
        </div>
      </section>

      <div className="checker-bg h-4 border-t-4 border-ink" />
    </main>
  );
}

function StatusRow({ label, status, tone }: { label: string; status: string; tone: "marquee" | "buy" | "ink" }) {
  const toneClass = tone === "marquee" ? "bg-marquee text-ink" : tone === "buy" ? "bg-buy text-cream" : "bg-ink text-cream";
  return (
    <li className="flex items-center justify-between border-b-2 border-ink border-dashed pb-2">
      <span>● {label}</span>
      <span className={`${toneClass} px-2 py-1 border-2 border-ink`}>{status}</span>
    </li>
  );
}

function PixelHorse() {
  // 16x12 pixel horse in ink color
  const grid = [
    "................",
    "......##.##.....",
    ".....####.##....",
    "....######.##...",
    "...########.#...",
    "...##.######....",
    "...#############",
    "...#############",
    "...##....##..##.",
    "...##....##..##.",
    "................",
    "................",
  ];
  const px = 8;
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(16, ${px}px)`,
        gridTemplateRows: `repeat(12, ${px}px)`,
      }}
    >
      {grid.flatMap((row, y) =>
        row.split("").map((c, x) => (
          <div
            key={`${x}-${y}`}
            style={{
              width: px,
              height: px,
              background: c === "#" ? "var(--ink)" : "transparent",
            }}
          />
        ))
      )}
    </div>
  );
}
