import { useEffect, useState } from "react";

import { PixelHorse } from "./PixelHorse";

type ArDetail = { name?: string; image?: string };
type Phase = "idle" | "init" | "scan" | "done";

export function openArModal(detail: ArDetail = {}) {
  window.dispatchEvent(new CustomEvent<ArDetail>("frankys:open-ar", { detail }));
}

export function ArModal() {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ArDetail>({});
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<ArDetail>;
      setDetail(ce.detail ?? {});
      setPhase("idle");
      setOpen(true);
    };
    window.addEventListener("frankys:open-ar", handler);
    return () => window.removeEventListener("frankys:open-ar", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (phase === "init") {
      const t1 = setTimeout(() => setPhase("scan"), 1500);
      return () => clearTimeout(t1);
    }
    if (phase === "scan") {
      const t2 = setTimeout(() => setPhase("done"), 2000);
      return () => clearTimeout(t2);
    }
  }, [phase]);

  const handleClose = () => {
    setOpen(false);
    setPhase("idle");
  };

  if (!open) return null;

  const variantName = detail.name ? detail.name.toUpperCase() : "AR PREVIEW";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Try in AR"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.7)", fontFamily: "var(--font-arcade)" }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md bg-cream border-2 border-ink rounded-card arcade-bevel animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between border-b-2 border-ink px-3 py-2"
          style={{ fontSize: 10, letterSpacing: 2 }}
        >
          <span>◉ AR VIEWER — BETA</span>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="w-7 h-7 border border-ink rounded-btn arcade-bevel hover:bg-ink hover:text-cream transition-colors"
            style={{ fontSize: 10 }}
          >
            ×
          </button>
        </div>

        <div className="checker-bg border-b-2 border-ink flex items-center justify-center min-h-[220px] p-6">
          {detail.image ? (
            <div className="bg-cream border border-ink rounded-card p-3 arcade-bevel">
              <img
                src={detail.image}
                alt={detail.name ?? "Cap preview"}
                width={220}
                height={220}
                className="max-h-[180px] w-auto object-contain"
                style={{ filter: "drop-shadow(4px 4px 0 rgba(0,0,0,0.35))" }}
              />
            </div>
          ) : (
            <PixelHorse size={10} />
          )}
        </div>

        <div className="p-4 flex flex-col gap-3 text-center">
          <p className="font-bold" style={{ fontSize: 13, letterSpacing: 2 }}>
            {variantName}
          </p>

          {phase === "idle" && (
            <>
              <div className="flex flex-col gap-1.5 text-left bg-cream border border-ink rounded-card p-3 arcade-bevel">
                <p style={{ fontSize: 9, letterSpacing: 1, marginBottom: 2 }}>
                  HOW TO TRY ON:
                </p>
                <p style={{ fontSize: 10, letterSpacing: 1 }}>
                  1. ALLOW CAMERA ACCESS
                </p>
                <p style={{ fontSize: 10, letterSpacing: 1 }}>
                  2. POINT CAMERA AT YOUR HEAD
                </p>
                <p style={{ fontSize: 10, letterSpacing: 1 }}>
                  3. KEEP STILL & TAP START
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPhase("init")}
                className="w-full py-3 rounded-btn border-2 border-ink arcade-bevel transition-colors hover:brightness-110"
                style={{
                  fontSize: 11,
                  letterSpacing: 2,
                  background: "var(--marquee)",
                  color: "var(--ink)",
                }}
              >
                START AR TRY-ON
              </button>
            </>
          )}

          {phase === "init" && (
            <p
              className="text-muted"
              style={{ fontFamily: "VT323, monospace", fontSize: 18, lineHeight: 1.3 }}
            >
              INITIALIZING CAMERA...{" "}
              <span style={{ animation: "blink 1s steps(1) infinite" }}>▊</span>
            </p>
          )}

          {phase === "scan" && (
            <p
              className="text-muted"
              style={{ fontFamily: "VT323, monospace", fontSize: 18, lineHeight: 1.3 }}
            >
              SCANNING FACE MESH...{" "}
              <span style={{ animation: "blink 1s steps(1) infinite" }}>▊</span>
            </p>
          )}

          {phase === "done" && (
            <>
              <p
                style={{ fontFamily: "VT323, monospace", fontSize: 18, lineHeight: 1.3 }}
              >
                CAP MAPPED TO FACE MESH
              </p>
              <p className="text-muted" style={{ fontSize: 9, letterSpacing: 1 }}>
                DRAG TO ROTATE · PINCH TO ZOOM
              </p>
            </>
          )}

          <p className="text-muted" style={{ fontSize: 9, letterSpacing: 1 }}>
            AR TRY-ON COMING SOON — INSERT COIN TO CONTINUE
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="bg-ink text-cream py-3 rounded-btn border border-ink arcade-bevel"
            style={{ fontSize: 11, letterSpacing: 2 }}
          >
            EJECT CARTRIDGE
          </button>
        </div>
      </div>
    </div>
  );
}
