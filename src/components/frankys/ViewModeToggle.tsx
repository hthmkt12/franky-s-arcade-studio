import { openArModal } from "./ArModal";

export type ViewMode = "3D" | "AR";

export function ViewModeToggle({
  mode,
  onChange,
  productName,
  productImage,
}: {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
  productName?: string;
  productImage?: string;
}) {
  const set = (m: ViewMode) => {
    onChange(m);
    if (m === "AR") openArModal({ name: productName, image: productImage });
  };
  return (
    <div
      className="inline-flex items-center border-2 border-ink rounded-btn overflow-hidden bg-cream arcade-bevel"
      role="group"
      aria-label="View mode"
      style={{ fontFamily: "var(--font-arcade)", fontSize: 10, letterSpacing: 2 }}
    >
      {(["3D", "AR"] as const).map((m) => {
        const active = m === mode;
        return (
          <button
            key={m}
            type="button"
            onClick={() => set(m)}
            aria-pressed={active}
            className={`px-3 h-8 border-r border-ink last:border-r-0 transition-colors ${
              active ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-marquee"
            }`}
          >
            {m}
          </button>
        );
      })}
    </div>
  );
}
