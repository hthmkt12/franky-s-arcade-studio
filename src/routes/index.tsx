import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FRANKY'S — BE RIGHT BACK" },
      { name: "description", content: "Franky's is offline for scheduled maintenance. Respawn soon." },
      { property: "og:title", content: "FRANKY'S — BE RIGHT BACK" },
      { property: "og:description", content: "Franky's is offline for scheduled maintenance. Respawn soon." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap",
      },
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
  const marqueeText = "WIN  STORE  COUPONS   ★   BE  RIGHT  BACK   ★   MAINTENANCE  MODE   ★   HIGH  SCORES  SAFE   ★   ";

  return (
    <main className="min-h-screen flex flex-col bg-cream text-ink">
      {/* Top marquee orange */}
      <div className="marquee-sheen border-b border-pixel overflow-hidden h-6 flex items-center">
        <div
          className="flex whitespace-nowrap text-ink"
          style={{ fontFamily: "var(--font-arcade)", fontSize: 10, lineHeight: 1, animation: "marquee 35s linear infinite" }}
        >
          <span className="px-6">{marqueeText.repeat(8)}</span>
          <span className="px-6">{marqueeText.repeat(8)}</span>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-pixel flex items-center justify-between px-4 h-14 bg-cream">
        <button
          aria-label="Power"
          className="w-9 h-9 rounded-full border border-pixel flex items-center justify-center bg-cream arcade-bevel"
          style={{ fontSize: 14 }}
        >
          ⏻
        </button>
        <div className="flex items-center gap-2">
          <PixelHorse size={4} color="var(--ink)" />
          <span style={{ fontFamily: "VT323, monospace", fontSize: 28, lineHeight: 1 }} className="mt-1">
            franky's
          </span>
        </div>
        <button aria-label="Menu" className="flex flex-col gap-1.5 p-2 rounded-btn border border-pixel arcade-bevel">
          <span className="block w-5 h-px bg-ink" />
          <span className="block w-5 h-px bg-ink" />
          <span className="block w-5 h-px bg-ink" />
        </button>
      </header>

      {/* Body grid */}
      <section className="flex-1 grid lg:grid-cols-[2fr_1fr] gap-1 p-1">
        {/* Hero panel */}
        <div className="border border-pixel rounded-card overflow-hidden flex flex-col bg-cream">
          <div className="checker-bg relative flex-1 min-h-[420px] flex items-center justify-center">
            <div className="relative bg-cream border border-pixel rounded-card px-10 py-8 arcade-bevel">
              <PixelHorse size={12} color="var(--ink)" />
            </div>

            {/* 3D / AR pill */}
            <div
              className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-ink text-cream border border-ink flex overflow-hidden"
              style={{ borderRadius: 9999, fontSize: 10 }}
            >
              <span className="px-3 py-1.5" style={{ fontWeight: 700 }}>3D</span>
              <span className="px-3 py-1.5 bg-cream text-ink border-l border-ink">AR</span>
            </div>
          </div>

          {/* Title strip */}
          <div className="border-t border-pixel px-3 pt-2.5 pb-1 flex items-baseline justify-between" style={{ fontSize: 18 }}>
            <h1 style={{ fontWeight: 700 }}>FRANKY'S * OFFLINE</h1>
            <span style={{ fontSize: 14 }}>—:—</span>
          </div>
          <div className="px-3 pb-2 border-b border-pixel" style={{ fontSize: 10, lineHeight: 1.5 }}>
            SCHEDULED * MAINTENANCE * HIGH SCORES SAFE * SKATERS WELCOME * RESPAWN INCOMING
          </div>

          {/* Buy-green CTA — the only green action */}
          <a
            href="mailto:hello@frankys.arcade"
            className="block text-center bg-buy text-cream py-3 rounded-btn arcade-bevel mx-3 my-3 border border-ink"
            style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2 }}
          >
            EMAIL US
          </a>

          <div className="flex justify-between px-3 py-1.5 border-t border-pixel" style={{ fontSize: 10 }}>
            <span>© FRANKY'S AMSTERDAM 2026</span>
            <span className="text-muted">SUBSCRIBE  SHIPPING</span>
          </div>
        </div>

        {/* Right column — status cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1">
          <CountdownCard label="RESPAWN  IN" h={pad(h)} m={pad(m)} s={pad(s)} />
          <StatusCard label="SERVERS" value="REBOOT" sub="● IN  PROGRESS" />
          <StatusCard label="HIGH  SCORES" value="SAFE" sub="● BACKED  UP" />
          <StatusCard label="SHOP" value="OFFLINE" sub="● TRY  AGAIN  SOON" disabled />
        </div>
      </section>
    </main>
  );
}

function CountdownCard({ label, h, m, s }: { label: string; h: string; m: string; s: string }) {
  return (
    <div className="border border-pixel rounded-card bg-cream p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between" style={{ fontSize: 10 }}>
        <span style={{ fontWeight: 700 }}>{label}</span>
        <span className="border border-pixel rounded-btn px-1.5 arcade-bevel" style={{ fontSize: 10 }}>
          AR
        </span>
      </div>
      <div className="flex items-baseline gap-1.5" style={{ fontFamily: "VT323, monospace" }}>
        <TimeBox v={h} />
        <span style={{ fontSize: 28, lineHeight: 1 }}>:</span>
        <TimeBox v={m} />
        <span style={{ fontSize: 28, lineHeight: 1 }}>:</span>
        <TimeBox v={s} />
      </div>
      <div className="flex justify-between text-muted-foreground" style={{ fontSize: 10 }}>
        <span>HRS</span><span>MIN</span><span>SEC</span>
      </div>
    </div>
  );
}

function TimeBox({ v }: { v: string }) {
  return (
    <span
      className="flex-1 text-center border border-pixel rounded-btn py-1.5 bg-cream arcade-bevel"
      style={{ fontSize: 28, lineHeight: 1 }}
    >
      {v}
    </span>
  );
}

function StatusCard({
  label,
  value,
  sub,
  disabled,
}: {
  label: string;
  value: string;
  sub: string;
  disabled?: boolean;
}) {
  return (
    <div className="border border-pixel rounded-card bg-cream p-3 flex flex-col gap-2 min-h-[120px]">
      <div className="flex items-center justify-between" style={{ fontSize: 10 }}>
        <span style={{ fontWeight: 700 }}>{label}</span>
        <span
          className="inline-block"
          style={{ width: 6, height: 6, background: disabled ? "var(--muted)" : "var(--ink)", animation: "blink 1.2s steps(1) infinite" }}
        />
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1 }} className={disabled ? "text-muted-foreground" : ""}>
        {value}
      </div>
      <div className="mt-auto border-t border-pixel border-dashed pt-2 text-muted-foreground" style={{ fontSize: 10 }}>
        {sub}
      </div>
    </div>
  );
}

function PixelHorse({ size = 8, color = "var(--ink)" }: { size?: number; color?: string }) {
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
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(16, ${size}px)`,
        gridTemplateRows: `repeat(12, ${size}px)`,
      }}
    >
      {grid.flatMap((row, y) =>
        row.split("").map((c, x) => (
          <div
            key={`${x}-${y}`}
            style={{
              width: size,
              height: size,
              background: c === "#" ? color : "transparent",
            }}
          />
        ))
      )}
    </div>
  );
}
