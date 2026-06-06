import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FRANKY'S — BE RIGHT BACK" },
      { name: "description", content: "Franky's arcade is temporarily down for maintenance. Insert coin soon." },
      { property: "og:title", content: "FRANKY'S — BE RIGHT BACK" },
      { property: "og:description", content: "Franky's arcade is temporarily down for maintenance." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=VT323&family=Press+Start+2P&display=swap" },
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
  const marqueeText = "WIN STORE COUPONS  ★  BE RIGHT BACK  ★  MAINTENANCE MODE  ★  INSERT COIN SOON  ★  ";

  return (
    <main className="min-h-screen flex flex-col bg-cream text-ink" style={{ fontFamily: "VT323, monospace" }}>
      {/* Top orange marquee */}
      <div className="bg-marquee border-b-2 border-ink overflow-hidden h-7 flex items-center">
        <div className="flex whitespace-nowrap text-ink text-base tracking-widest" style={{ animation: "marquee 30s linear infinite" }}>
          <span className="px-6">{marqueeText.repeat(6)}</span>
          <span className="px-6">{marqueeText.repeat(6)}</span>
        </div>
      </div>

      {/* Header bar */}
      <header className="border-b-2 border-ink flex items-center justify-between px-4 h-14 bg-cream">
        <div className="w-9 h-9 rounded-full border-2 border-ink flex items-center justify-center">
          <span className="text-xl leading-none">⏻</span>
        </div>
        <div className="flex items-center gap-2">
          <PixelHorse size={5} />
          <span style={{ fontFamily: "VT323" }} className="text-3xl leading-none mt-1">franky's</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="block w-7 h-[2px] bg-ink" />
          <span className="block w-7 h-[2px] bg-ink" />
          <span className="block w-7 h-[2px] bg-ink" />
        </div>
      </header>

      {/* Body */}
      <section className="flex-1 grid lg:grid-cols-[2fr_1fr] gap-3 p-3">
        {/* Hero panel */}
        <div className="border-2 border-ink relative flex flex-col">
          <div className="checker-bg flex-1 relative flex items-center justify-center min-h-[420px] overflow-hidden">
            {/* Pixel mascot huge */}
            <div className="relative z-10 bg-cream border-2 border-ink p-8 sm:p-12">
              <PixelHorse size={14} />
            </div>
          </div>

          {/* 3D / AR pill */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 bg-ink text-cream rounded-full border-2 border-ink flex text-sm overflow-hidden">
            <span className="px-4 py-1.5 font-bold">3D</span>
            <span className="px-4 py-1.5 bg-cream text-ink border-l-2 border-ink">AR</span>
          </div>

          {/* Bottom strip — title + price */}
          <div className="border-t-2 border-ink bg-cream px-4 pt-3 pb-2 flex items-baseline justify-between text-2xl">
            <h1 className="font-bold tracking-wider">FRANKY'S * OFFLINE</h1>
            <span>—:—</span>
          </div>
          <div className="px-4 pb-3 text-lg tracking-widest border-b-2 border-ink border-dashed">
            SCHEDULED * MAINTENANCE * HIGH SCORES SAFE * SKATERS WELCOME * RESPAWN INCOMING
          </div>
          {/* Green CTA */}
          <a
            href="mailto:hello@frankys.arcade"
            className="block text-center bg-buy text-cream py-3 text-xl tracking-[0.4em] border-2 border-ink mt-0"
            style={{ boxShadow: "inset 0 0 0 2px var(--cream), inset 0 0 0 4px var(--buy)" }}
          >
            EMAIL US
          </a>
          <div className="flex justify-between px-3 py-1.5 text-base">
            <span>© FRANKY'S AMSTERDAM 2026</span>
            <span>MAINT MODE v1.0.4</span>
          </div>
        </div>

        {/* Right rail — status cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
          <StatusCard label="RESPAWN IN" big={`${pad(h)}:${pad(m)}:${pad(s)}`} sub="HRS : MIN : SEC" tone="cream" />
          <StatusCard label="SERVERS" big="REBOOT" sub="● IN PROGRESS" tone="orange" />
          <StatusCard label="HIGH SCORES" big="SAFE" sub="● BACKED UP" tone="green" />
          <StatusCard label="SHOP" big="OFFLINE" sub="● TRY AGAIN SOON" tone="ink" />
        </div>
      </section>

      {/* Bottom marquee */}
      <div className="bg-marquee border-t-2 border-ink overflow-hidden h-6 flex items-center">
        <div className="flex whitespace-nowrap text-ink text-sm tracking-widest" style={{ animation: "marquee 40s linear infinite reverse" }}>
          <span className="px-6">{marqueeText.repeat(6)}</span>
          <span className="px-6">{marqueeText.repeat(6)}</span>
        </div>
      </div>
    </main>
  );
}

function StatusCard({
  label,
  big,
  sub,
  tone,
}: {
  label: string;
  big: string;
  sub: string;
  tone: "cream" | "orange" | "green" | "ink";
}) {
  const bg = tone === "orange" ? "bg-marquee" : tone === "green" ? "bg-buy text-cream" : tone === "ink" ? "bg-ink text-cream" : "bg-cream";
  return (
    <div className={`border-2 border-ink ${bg} p-4 flex flex-col justify-between min-h-[160px]`}>
      <div className="flex items-center justify-between text-base tracking-widest">
        <span>{label}</span>
        <span className="border border-current px-1.5 text-xs">i</span>
      </div>
      <div className="text-4xl sm:text-5xl font-bold mt-2 tracking-wider">{big}</div>
      <div className="text-base tracking-widest border-t border-current border-dashed pt-2 mt-2">{sub}</div>
    </div>
  );
}

function PixelHorse({ size = 8 }: { size?: number }) {
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
              background: c === "#" ? "currentColor" : "transparent",
            }}
          />
        ))
      )}
    </div>
  );
}
