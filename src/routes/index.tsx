import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

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

type Hat = { id: string; name: string; price: number; sizes: string[] };
const HATS: Hat[] = [
  { id: "pony-cap", name: "PONY CAP", price: 38, sizes: ["S", "M", "L"] },
  { id: "checker-trucker", name: "CHECKER TRUCKER", price: 42, sizes: ["ONE"] },
  { id: "marquee-beanie", name: "MARQUEE BEANIE", price: 30, sizes: ["ONE"] },
];

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
  const target = useMemo(() => new Date(Date.now() + 1000 * 60 * 60 * 6), []);
  const { h, m, s } = useCountdown(target);
  const pad = (n: number) => String(n).padStart(2, "0");
  const marqueeText = "ORDER  HATS  NOW   ★   FREE  STICKERS  ON  ORDERS  OVER  $50   ★   MAINTENANCE  MODE   ★   ";
  const [orderOpen, setOrderOpen] = useState(false);

  return (
    <main className="min-h-screen flex flex-col bg-cream text-ink">
      <div className="marquee-sheen border-b border-pixel overflow-hidden h-6 flex items-center">
        <div
          className="flex whitespace-nowrap text-ink"
          style={{ fontFamily: "var(--font-arcade)", fontSize: 10, lineHeight: 1, animation: "marquee 35s linear infinite" }}
        >
          <span className="px-6">{marqueeText.repeat(8)}</span>
          <span className="px-6">{marqueeText.repeat(8)}</span>
        </div>
      </div>

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
        <button
          onClick={() => setOrderOpen(true)}
          className="px-3 h-9 rounded-btn border border-ink bg-buy text-cream arcade-bevel"
          style={{ fontFamily: "var(--font-arcade)", fontSize: 10, letterSpacing: 1 }}
        >
          ORDER HAT
        </button>
      </header>

      <section className="flex-1 grid lg:grid-cols-[2fr_1fr] gap-1 p-1">
        <div className="border border-pixel rounded-card overflow-hidden flex flex-col bg-cream">
          <div className="checker-bg relative flex-1 min-h-[420px] flex items-center justify-center">
            <div className="relative bg-cream border border-pixel rounded-card px-10 py-8 arcade-bevel">
              <PixelHorse size={12} color="var(--ink)" />
            </div>
            <div
              className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-ink text-cream border border-ink flex overflow-hidden"
              style={{ borderRadius: 9999, fontSize: 10 }}
            >
              <span className="px-3 py-1.5" style={{ fontWeight: 700 }}>3D</span>
              <span className="px-3 py-1.5 bg-cream text-ink border-l border-ink">AR</span>
            </div>
          </div>

          <div className="border-t border-pixel px-3 pt-2.5 pb-1 flex items-baseline justify-between" style={{ fontSize: 18 }}>
            <h1 style={{ fontWeight: 700 }}>FRANKY'S * HAT DROP</h1>
            <span style={{ fontSize: 14 }}>{HATS.length} SKUS</span>
          </div>
          <div className="px-3 pb-2 border-b border-pixel" style={{ fontSize: 10, lineHeight: 1.5 }}>
            ORDER * AHEAD * SHOP REOPENS WHEN COUNTDOWN ENDS * HIGH SCORES SAFE
          </div>

          {/* Hat list */}
          <ul className="px-3 py-3 flex flex-col gap-1.5 border-b border-pixel">
            {HATS.map((hat) => (
              <li
                key={hat.id}
                className="flex items-center justify-between border border-pixel rounded-btn px-2.5 py-2 bg-cream arcade-bevel"
                style={{ fontSize: 10 }}
              >
                <span style={{ fontWeight: 700, letterSpacing: 1 }}>{hat.name}</span>
                <span className="flex items-center gap-3">
                  <span className="text-muted-foreground">{hat.sizes.join("/")}</span>
                  <span>${hat.price}</span>
                </span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => setOrderOpen(true)}
            className="block text-center bg-buy text-cream py-3 rounded-btn arcade-bevel mx-3 my-3 border border-ink"
            style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2 }}
          >
            PRESS  START → ORDER
          </button>

          <div className="flex justify-between px-3 py-1.5 border-t border-pixel" style={{ fontSize: 10 }}>
            <span>© FRANKY'S AMSTERDAM 2026</span>
            <span className="text-muted">SUBSCRIBE  SHIPPING</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1">
          <CountdownCard label="RESPAWN  IN" h={pad(h)} m={pad(m)} s={pad(s)} />
          <StatusCard label="SERVERS" value="REBOOT" sub="● IN  PROGRESS" />
          <StatusCard label="HIGH  SCORES" value="SAFE" sub="● BACKED  UP" />
          <button
            type="button"
            onClick={() => setOrderOpen(true)}
            className="text-left border border-pixel rounded-card bg-marquee p-3 flex flex-col gap-2 min-h-[120px] arcade-bevel"
          >
            <div className="flex items-center justify-between" style={{ fontSize: 10 }}>
              <span style={{ fontWeight: 700 }}>HAT  SHOP</span>
              <span
                className="inline-block"
                style={{ width: 6, height: 6, background: "var(--ink)", animation: "blink 1.2s steps(1) infinite" }}
              />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>PRE-ORDER</div>
            <div className="mt-auto border-t border-ink border-dashed pt-2" style={{ fontSize: 10 }}>
              ● TAP  TO  INSERT  COIN
            </div>
          </button>
        </div>
      </section>

      {orderOpen && <OrderModal onClose={() => setOrderOpen(false)} />}
    </main>
  );
}

function OrderModal({ onClose }: { onClose: () => void }) {
  const [hatId, setHatId] = useState(HATS[0].id);
  const hat = HATS.find((h) => h.id === hatId)!;
  const [size, setSize] = useState(hat.sizes[0]);
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setSize(hat.sizes[0]);
  }, [hatId, hat.sizes]);

  const total = hat.price * qty;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !address.trim()) return;
    const subject = encodeURIComponent(`FRANKY'S ORDER — ${hat.name}`);
    const body = encodeURIComponent(
      [
        `>> NEW ORDER`,
        `ITEM: ${hat.name}`,
        `SIZE: ${size}`,
        `QTY:  ${qty}`,
        `TOTAL: $${total}`,
        `--`,
        `NAME: ${name}`,
        `EMAIL: ${email}`,
        `SHIP TO:`,
        address,
      ].join("\n")
    );
    window.location.href = `mailto:hello@frankys.arcade?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-cream border border-ink rounded-card overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "var(--font-arcade)" }}
      >
        <div className="marquee-sheen border-b border-ink flex items-center justify-between px-3 h-8">
          <span style={{ fontSize: 10, fontWeight: 700 }}>INSERT  COIN  —  ORDER  HAT</span>
          <button onClick={onClose} aria-label="Close" style={{ fontSize: 10, fontWeight: 700 }}>
            X
          </button>
        </div>

        {submitted ? (
          <div className="p-4 flex flex-col gap-3" style={{ fontSize: 10, lineHeight: 1.6 }}>
            <div className="checker-bg border border-pixel rounded-btn p-4 text-center" style={{ fontSize: 14 }}>
              ★ ORDER  SENT ★
            </div>
            <p>WE OPENED YOUR MAIL APP WITH THE ORDER. SEND IT TO LOCK IT IN.</p>
            <button
              onClick={onClose}
              className="bg-ink text-cream py-2 rounded-btn arcade-bevel border border-ink"
              style={{ fontSize: 10 }}
            >
              CLOSE
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-3 flex flex-col gap-3" style={{ fontSize: 10 }}>
            <label className="flex flex-col gap-1.5">
              <span style={{ fontWeight: 700 }}>SELECT HAT</span>
              <div className="grid grid-cols-1 gap-1">
                {HATS.map((h) => (
                  <button
                    type="button"
                    key={h.id}
                    onClick={() => setHatId(h.id)}
                    className={`flex items-center justify-between border rounded-btn px-2.5 py-2 arcade-bevel ${
                      hatId === h.id ? "bg-ink text-cream border-ink" : "bg-cream border-pixel"
                    }`}
                  >
                    <span style={{ fontWeight: 700 }}>{h.name}</span>
                    <span>${h.price}</span>
                  </button>
                ))}
              </div>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1.5">
                <span style={{ fontWeight: 700 }}>SIZE</span>
                <div className="flex gap-1">
                  {hat.sizes.map((sz) => (
                    <button
                      type="button"
                      key={sz}
                      onClick={() => setSize(sz)}
                      className={`flex-1 border rounded-btn py-1.5 arcade-bevel ${
                        size === sz ? "bg-ink text-cream border-ink" : "bg-cream border-pixel"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </label>
              <label className="flex flex-col gap-1.5">
                <span style={{ fontWeight: 700 }}>QTY</span>
                <div className="flex items-center border border-pixel rounded-btn arcade-bevel">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="px-2.5 py-1.5 border-r border-pixel"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center" style={{ fontFamily: "VT323, monospace", fontSize: 18 }}>
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(9, q + 1))}
                    className="px-2.5 py-1.5 border-l border-pixel"
                  >
                    +
                  </button>
                </div>
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span style={{ fontWeight: 700 }}>NAME</span>
              <input
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-pixel rounded-btn px-2 py-1.5 bg-cream"
                style={{ fontFamily: "VT323, monospace", fontSize: 16 }}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span style={{ fontWeight: 700 }}>EMAIL</span>
              <input
                required
                type="email"
                maxLength={120}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border border-pixel rounded-btn px-2 py-1.5 bg-cream"
                style={{ fontFamily: "VT323, monospace", fontSize: 16 }}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span style={{ fontWeight: 700 }}>SHIP TO</span>
              <textarea
                required
                rows={3}
                maxLength={400}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="border border-pixel rounded-btn px-2 py-1.5 bg-cream"
                style={{ fontFamily: "VT323, monospace", fontSize: 16 }}
              />
            </label>

            <div
              className="flex items-center justify-between border-t border-pixel border-dashed pt-2"
              style={{ fontSize: 10 }}
            >
              <span>TOTAL</span>
              <span style={{ fontFamily: "VT323, monospace", fontSize: 22 }}>${total}</span>
            </div>

            <button
              type="submit"
              className="bg-buy text-cream py-3 rounded-btn arcade-bevel border border-ink"
              style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2 }}
            >
              PRESS  START → SEND  ORDER
            </button>
          </form>
        )}
      </div>
    </div>
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
