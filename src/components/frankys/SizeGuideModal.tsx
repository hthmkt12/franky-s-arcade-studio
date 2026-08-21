import { useEffect, useRef, useState } from "react";

import type { ProductCategory } from "@/lib/api/types";

const SIZE_TABLES: Record<
  "caps" | "hoodies",
  { label: string; rows: { size: string; cols: string[] }[] }
> = {
  caps: {
    label: "CAPS — HEAD CIRCUMFERENCE",
    rows: [
      { size: "S", cols: ["54 cm", "21.3 in"] },
      { size: "M", cols: ["56 cm", "22.0 in"] },
      { size: "L", cols: ["58 cm", "22.8 in"] },
      { size: "ONE", cols: ["56–60 cm", "22–23.6 in"] },
    ],
  },
  hoodies: {
    label: "HOODIES — CHEST × LENGTH",
    rows: [
      { size: "S", cols: ["108 × 68 cm", "42.5 × 26.8 in"] },
      { size: "M", cols: ["116 × 70 cm", "45.7 × 27.6 in"] },
      { size: "L", cols: ["124 × 72 cm", "48.8 × 28.3 in"] },
      { size: "XL", cols: ["132 × 74 cm", "52.0 × 29.1 in"] },
    ],
  },
};

export function openSizeGuide(category: ProductCategory = "caps") {
  window.dispatchEvent(new CustomEvent("frankys:open-size-guide", { detail: { category } }));
}

export function SizeGuideModal() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<"caps" | "hoodies">("caps");
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ category?: ProductCategory }>).detail;
      setCategory(
        detail?.category === "hoodies" || detail?.category === "totes" ? "hoodies" : "caps",
      );
      setOpen(true);
    };
    window.addEventListener("frankys:open-size-guide", handler);
    return () => window.removeEventListener("frankys:open-size-guide", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => !el.hasAttribute("disabled"));

    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !panel?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prevFocus?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const table = SIZE_TABLES[category];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Size guide"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.7)", fontFamily: "var(--font-arcade)" }}
      onClick={() => setOpen(false)}
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-md bg-cream border-2 border-ink rounded-card arcade-bevel animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between border-b-2 border-ink px-3 py-2"
          style={{ fontSize: 10, letterSpacing: 2 }}
        >
          <span>◉ SIZE GUIDE</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="w-7 h-7 border border-ink rounded-btn arcade-bevel hover:bg-ink hover:text-cream transition-colors"
            style={{ fontSize: 10 }}
          >
            ×
          </button>
        </div>

        <div
          className="border-b-2 border-ink px-3 py-2 flex gap-2"
          style={{ fontSize: 9, letterSpacing: 1 }}
        >
          {(Object.keys(SIZE_TABLES) as Array<keyof typeof SIZE_TABLES>).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              aria-pressed={category === key}
              className={`px-3 py-1 rounded-btn border border-ink arcade-bevel transition-colors ${
                category === key ? "bg-ink text-cream" : "bg-cream hover:bg-marquee"
              }`}
              style={{ fontSize: 9, letterSpacing: 1 }}
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="p-4 flex flex-col gap-3">
          <p className="font-bold text-center" style={{ fontSize: 11, letterSpacing: 2 }}>
            {table.label}
          </p>
          <div className="border border-pixel rounded-btn overflow-hidden">
            <table className="w-full text-center" style={{ fontSize: 10 }}>
              <thead>
                <tr className="bg-ink text-cream">
                  <th className="py-2 px-2 border-r border-pixel" style={{ fontWeight: 700 }}>
                    SIZE
                  </th>
                  <th className="py-2 px-2" style={{ fontWeight: 700 }}>
                    MEASUREMENT
                  </th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, i) => (
                  <tr key={row.size} className={i % 2 === 1 ? "checker-bg" : undefined}>
                    <td
                      className="py-2 px-2 border-r border-pixel font-bold"
                      style={{ fontWeight: 700 }}
                    >
                      {row.size}
                    </td>
                    <td
                      className="py-2 px-2"
                      style={{ fontFamily: "VT323, monospace", fontSize: 15 }}
                    >
                      {row.cols[0]}
                      <span className="text-muted" style={{ fontSize: 10 }}>
                        {" "}
                        / {row.cols[1]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-muted" style={{ fontSize: 8, letterSpacing: 0.5, lineHeight: 1.5 }}>
            MEASURE AROUND THE WIDEST PART OF YOUR HEAD (FOR CAPS) OR ACROSS THE CHEST UNDER THE
            ARMS (FOR HOODIES). HANDMADE KNIT STRETCHES FOR A COMFORTABLE FIT.
          </p>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="bg-ink text-cream py-3 rounded-btn border border-ink arcade-bevel"
            style={{ fontSize: 11, letterSpacing: 2 }}
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
}
