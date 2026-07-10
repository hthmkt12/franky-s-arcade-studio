import { useEffect, useRef, useState } from "react";

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

  // Micro-interaction state for the "done" phase
  const [rotation, setRotation] = useState(0); // deg, Y-axis feel
  const [zoom, setZoom] = useState(1); // 0.6 – 1.8
  const [hint, setHint] = useState<"drag" | "pinch" | null>("drag");
  const [reticlePos, setReticlePos] = useState<{ x: number; y: number } | null>(null);
  const [snapped, setSnapped] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{ startX: number; startRot: number } | null>(null);
  const pinchState = useRef<{ startDist: number; startZoom: number } | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<ArDetail>;
      setDetail(ce.detail ?? {});
      setPhase("idle");
      setRotation(0);
      setZoom(1);
      setHint("drag");
      setReticlePos(null);
      setSnapped(false);
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
      const t1 = setTimeout(() => setPhase("scan"), 1400);
      return () => clearTimeout(t1);
    }
    if (phase === "scan") {
      const t2 = setTimeout(() => {
        setPhase("done");
        // snap after brief settle so users see the transition
        setTimeout(() => setSnapped(true), 60);
      }, 1800);
      return () => clearTimeout(t2);
    }
    if (phase === "idle") {
      setSnapped(false);
    }
  }, [phase]);

  // Auto-cycle hint after done, so users see both affordances
  useEffect(() => {
    if (phase !== "done") return;
    setHint("drag");
    const t = setTimeout(() => setHint("pinch"), 2200);
    return () => clearTimeout(t);
  }, [phase]);

  const handleClose = () => {
    setOpen(false);
    setPhase("idle");
  };

  const clampZoom = (z: number) => Math.max(0.6, Math.min(1.8, z));
  const clampRot = (r: number) => Math.max(-60, Math.min(60, r));

  const updateReticleFromEvent = (e: React.PointerEvent) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setReticlePos({
      x: Math.max(24, Math.min(rect.width - 24, e.clientX - rect.left)),
      y: Math.max(24, Math.min(rect.height - 24, e.clientY - rect.top)),
    });
  };

  const onStageClick = (e: React.MouseEvent) => {
    if (phase !== "idle") return;
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setReticlePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setPhase("init");
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (phase === "idle") {
      updateReticleFromEvent(e);
      return;
    }
    if (phase !== "done") return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragState.current = { startX: e.clientX, startRot: rotation };
    setHint(null);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (phase === "idle") {
      updateReticleFromEvent(e);
      return;
    }
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    setRotation(clampRot(dragState.current.startRot + dx * 0.4));
  };
  const onPointerUp = () => {
    dragState.current = null;
  };

  const dist = (a: React.Touch, b: React.Touch) =>
    Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

  const onTouchStart = (e: React.TouchEvent) => {
    if (phase !== "done" || e.touches.length !== 2) return;
    pinchState.current = {
      startDist: dist(e.touches[0], e.touches[1]),
      startZoom: zoom,
    };
    setHint(null);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!pinchState.current || e.touches.length !== 2) return;
    const d = dist(e.touches[0], e.touches[1]);
    const ratio = d / pinchState.current.startDist;
    setZoom(clampZoom(pinchState.current.startZoom * ratio));
  };
  const onTouchEnd = () => {
    pinchState.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    if (phase !== "done") return;
    e.preventDefault();
    setZoom((z) => clampZoom(z - e.deltaY * 0.002));
    setHint(null);
  };

  if (!open) return null;

  const variantName = detail.name ? detail.name.toUpperCase() : "AR PREVIEW";
  const capTransform =
    phase === "done"
      ? `perspective(600px) rotateY(${rotation}deg) scale(${zoom})`
      : "none";

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

        <div
          className="checker-bg border-b-2 border-ink relative flex items-center justify-center min-h-[240px] p-6 overflow-hidden select-none"
          style={{ touchAction: phase === "done" ? "none" : "auto", cursor: phase === "done" ? (dragState.current ? "grabbing" : "grab") : "default" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onWheel={onWheel}
        >
          {/* Idle: tap-to-place reticle replacing the START button */}
          {phase === "idle" && (
            <button
              type="button"
              onClick={() => setPhase("init")}
              aria-label="Tap to place cap"
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 group"
              style={{ fontFamily: "var(--font-arcade)" }}
            >
              <div
                className="relative w-24 h-24 rounded-full border-2 border-ink flex items-center justify-center"
                style={{
                  background: "rgba(250,162,31,0.15)",
                  animation: "blink 1.2s steps(1) infinite",
                }}
              >
                <span
                  className="absolute inset-2 rounded-full border border-ink"
                  style={{ borderStyle: "dashed" }}
                />
                <span style={{ fontSize: 22 }}>◎</span>
              </div>
              <span style={{ fontSize: 10, letterSpacing: 2 }}>
                TAP TO PLACE CAP
              </span>
            </button>
          )}

          {/* Scanning overlay lines during init/scan */}
          {(phase === "init" || phase === "scan") && (
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute left-0 right-0 h-[2px] bg-ink"
                style={{
                  top: 0,
                  animation: "scanline 1.4s linear infinite",
                  opacity: 0.7,
                }}
              />
            </div>
          )}

          {/* Cap preview (interactive in done phase) */}
          {detail.image ? (
            <div
              className="bg-cream border border-ink rounded-card p-3 arcade-bevel pointer-events-none"
              style={{
                transform: capTransform,
                transition: dragState.current || pinchState.current
                  ? "none"
                  : "transform 200ms ease-out",
                opacity: phase === "idle" ? 0.35 : 1,
              }}
            >
              <img
                src={detail.image}
                alt={detail.name ?? "Cap preview"}
                width={220}
                height={220}
                className="max-h-[180px] w-auto object-contain"
                style={{ filter: "drop-shadow(4px 4px 0 rgba(0,0,0,0.35))" }}
                draggable={false}
              />
            </div>
          ) : (
            <div
              className="pointer-events-none"
              style={{
                transform: capTransform,
                transition: "transform 200ms ease-out",
                opacity: phase === "idle" ? 0.35 : 1,
              }}
            >
              <PixelHorse size={10} />
            </div>
          )}

          {/* Micro-interaction hint chips (done phase) */}
          {phase === "done" && hint && (
            <div
              className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-cream border border-ink rounded-btn px-2 py-1 arcade-bevel pointer-events-none"
              style={{ fontSize: 9, letterSpacing: 1, animation: "fade-in 200ms ease-out" }}
            >
              {hint === "drag" ? "← DRAG TO ROTATE →" : "⇱ PINCH / SCROLL TO ZOOM ⇲"}
            </div>
          )}

          {/* Live transform readout */}
          {phase === "done" && (
            <div
              className="absolute top-2 right-2 bg-ink text-cream rounded-btn px-2 py-1 pointer-events-none"
              style={{ fontFamily: "VT323, monospace", fontSize: 12, letterSpacing: 1 }}
            >
              ROT {Math.round(rotation)}° · ZOOM {zoom.toFixed(2)}×
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col gap-3 text-center">
          <p className="font-bold" style={{ fontSize: 13, letterSpacing: 2 }}>
            {variantName}
          </p>

          {phase === "idle" && (
            <div className="flex flex-col gap-1.5 text-left bg-cream border border-ink rounded-card p-3 arcade-bevel">
              <p style={{ fontSize: 9, letterSpacing: 1, marginBottom: 2 }}>
                HOW TO TRY ON:
              </p>
              <p style={{ fontSize: 10, letterSpacing: 1 }}>1. ALLOW CAMERA ACCESS</p>
              <p style={{ fontSize: 10, letterSpacing: 1 }}>2. TAP THE RETICLE TO PLACE</p>
              <p style={{ fontSize: 10, letterSpacing: 1 }}>3. DRAG & PINCH TO ADJUST</p>
            </div>
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
              <p style={{ fontFamily: "VT323, monospace", fontSize: 18, lineHeight: 1.3 }}>
                CAP MAPPED TO FACE MESH
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRotation(0);
                    setZoom(1);
                    setHint("drag");
                  }}
                  className="px-3 py-2 rounded-btn border border-ink arcade-bevel bg-cream hover:bg-ink hover:text-cream transition-colors"
                  style={{ fontSize: 10, letterSpacing: 1 }}
                >
                  RECENTER
                </button>
                <button
                  type="button"
                  onClick={() => setPhase("idle")}
                  className="px-3 py-2 rounded-btn border border-ink arcade-bevel bg-cream hover:bg-ink hover:text-cream transition-colors"
                  style={{ fontSize: 10, letterSpacing: 1 }}
                >
                  RE-SCAN
                </button>
              </div>
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
