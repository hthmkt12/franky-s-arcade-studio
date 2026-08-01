import { useEffect, useRef, useState } from "react";

import { PixelHorse } from "./PixelHorse";

type ArDetail = { name?: string; image?: string };
type Phase = "idle" | "init" | "scan" | "done" | "error";
type ErrorKind = "denied" | "notfound" | "unsupported" | "insecure" | "unknown";

const ERROR_COPY: Record<ErrorKind, { title: string; steps: string[] }> = {
  denied: {
    title: "CAMERA ACCESS DENIED",
    steps: [
      "1. CLICK THE 🔒 / CAMERA ICON IN THE ADDRESS BAR",
      "2. SET CAMERA TO \"ALLOW\" FOR THIS SITE",
      "3. RELOAD THE PAGE, THEN PRESS RETRY",
    ],
  },
  notfound: {
    title: "NO CAMERA DETECTED",
    steps: [
      "1. CONNECT A WEBCAM OR USE A PHONE",
      "2. CLOSE OTHER APPS USING THE CAMERA",
      "3. PRESS RETRY",
    ],
  },
  unsupported: {
    title: "AR NOT SUPPORTED HERE",
    steps: [
      "1. THIS BROWSER HAS NO CAMERA API",
      "2. TRY CHROME / SAFARI ON MOBILE",
      "3. OR CONTINUE IN 3D MODE",
    ],
  },
  insecure: {
    title: "INSECURE CONNECTION",
    steps: [
      "1. CAMERA NEEDS HTTPS",
      "2. OPEN THE SITE OVER HTTPS",
      "3. PRESS RETRY",
    ],
  },
  unknown: {
    title: "AR FAILED TO START",
    steps: [
      "1. CLOSE OTHER APPS USING THE CAMERA",
      "2. RELOAD THE PAGE",
      "3. PRESS RETRY",
    ],
  },
};

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
  const [anchorLocked, setAnchorLocked] = useState(false);
  const [errorKind, setErrorKind] = useState<ErrorKind>("unknown");
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
      setAnchorLocked(false);
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
      let cancelled = false;
      const fail = (kind: ErrorKind) => {
        if (cancelled) return;
        setErrorKind(kind);
        setPhase("error");
      };
      const t1 = setTimeout(async () => {
        if (cancelled) return;
        const md = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
        if (!md?.getUserMedia) {
          fail(typeof window !== "undefined" && !window.isSecureContext ? "insecure" : "unsupported");
          return;
        }
        try {
          const stream = await md.getUserMedia({ video: { facingMode: "user" } });
          stream.getTracks().forEach((t) => t.stop());
          if (!cancelled) setPhase("scan");
        } catch (err) {
          const name = (err as { name?: string } | null)?.name ?? "";
          if (name === "NotAllowedError" || name === "SecurityError") fail("denied");
          else if (name === "NotFoundError" || name === "DevicesNotFoundError") fail("notfound");
          else fail("unknown");
        }
      }, 900);
      return () => {
        cancelled = true;
        clearTimeout(t1);
      };
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
      setAnchorLocked(false);
    }
  }, [phase]);

  // Flip anchor to "locked" after the snap transition finishes
  useEffect(() => {
    if (!snapped) return;
    const t = setTimeout(() => setAnchorLocked(true), 480);
    return () => clearTimeout(t);
  }, [snapped]);

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

  // Face anchor sits at the forehead of the silhouette (percent of stage)
  const FACE_ANCHOR = { xPct: 50, yPct: 38 };
  const showFace = phase === "scan" || phase === "done";
  const showReticle = phase === "idle" && reticlePos !== null;
  const errorCopy = ERROR_COPY[errorKind];

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

        {/* AR status timeline */}
        {(() => {
          const steps = [
            { key: "init", label: "INIT" },
            { key: "scan", label: "SCAN" },
            { key: "placed", label: "PLACED" },
            { key: "anchor", label: "ANCHOR" },
          ] as const;
          const activeIdx =
            phase === "idle" ? -1 :
            phase === "init" ? 0 :
            phase === "scan" ? 1 :
            !snapped ? 2 :
            !anchorLocked ? 3 : 3;
          const statusLabel =
            phase === "idle" ? "AWAITING TAP" :
            phase === "init" ? "INITIALIZING…" :
            phase === "scan" ? "SCANNING FACE MESH…" :
            !snapped ? "CAP PLACED" :
            !anchorLocked ? "ANCHORING…" : "ANCHOR LOCKED";
          return (
            <div className="border-b-2 border-ink px-3 py-2 flex items-center gap-2 bg-cream" style={{ fontSize: 9, letterSpacing: 1 }}>
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{
                  background: anchorLocked ? "var(--buy)" : phase === "idle" ? "var(--muted)" : "var(--marquee)",
                  animation: phase !== "idle" && !anchorLocked ? "blink 0.8s steps(1) infinite" : "none",
                }}
                aria-hidden
              />
              <div className="flex items-center gap-1 flex-1 min-w-0">
                {steps.map((s, i) => {
                  const done = i < activeIdx || (i === 3 && anchorLocked);
                  const active = i === activeIdx && !(i === 3 && anchorLocked);
                  return (
                    <div key={s.key} className="flex items-center gap-1 flex-1 min-w-0">
                      <span
                        style={{
                          color: done || active ? "var(--ink)" : "var(--muted)",
                          fontWeight: active ? 700 : 400,
                          opacity: done && !active ? 0.7 : 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {done && !active ? "▣" : active ? "▶" : "□"} {s.label}
                      </span>
                      {i < steps.length - 1 && (
                        <span
                          className="flex-1 h-[2px]"
                          style={{
                            background: done ? "var(--ink)" : "var(--pixel)",
                            transition: "background 200ms ease-out",
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <span
                aria-live="polite"
                style={{ fontFamily: "VT323, monospace", fontSize: 13, letterSpacing: 1, whiteSpace: "nowrap" }}
              >
                {statusLabel}
              </span>
            </div>
          );
        })()}



        <div
          ref={stageRef}
          className="checker-bg border-b-2 border-ink relative flex items-center justify-center min-h-[260px] p-6 overflow-hidden select-none"
          style={{
            touchAction: phase === "done" ? "none" : "auto",
            cursor: phase === "idle" ? "crosshair" : phase === "done" ? (dragState.current ? "grabbing" : "grab") : "default",
          }}
          onClick={onStageClick}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onWheel={onWheel}
        >
          {/* Face anchor silhouette (visible from scan onward) */}
          {showFace && (
            <svg
              viewBox="0 0 100 120"
              className="absolute pointer-events-none"
              style={{
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -42%)",
                width: 160,
                height: 192,
                opacity: phase === "done" ? 0.55 : 0.85,
                transition: "opacity 300ms ease-out",
              }}
              aria-hidden
            >
              {/* Head silhouette */}
              <ellipse
                cx="50" cy="55" rx="28" ry="34"
                fill="none" stroke="var(--ink)" strokeWidth="1.2"
                strokeDasharray={phase === "done" ? "0" : "3 3"}
              />
              {/* Face mesh grid */}
              <g stroke="var(--ink)" strokeWidth="0.4" opacity="0.55">
                <path d="M28 45 Q50 40 72 45" fill="none" />
                <path d="M26 60 Q50 58 74 60" fill="none" />
                <path d="M30 75 Q50 78 70 75" fill="none" />
                <path d="M50 22 L50 88" fill="none" />
                <path d="M38 25 L38 85" fill="none" />
                <path d="M62 25 L62 85" fill="none" />
              </g>
              {/* Forehead anchor crosshair */}
              <g stroke="var(--marquee)" strokeWidth="1.4" opacity={phase === "done" ? 1 : 0.9}>
                <circle cx={FACE_ANCHOR.xPct} cy={FACE_ANCHOR.yPct} r="3" fill="none" />
                <line x1={FACE_ANCHOR.xPct - 6} y1={FACE_ANCHOR.yPct} x2={FACE_ANCHOR.xPct - 3} y2={FACE_ANCHOR.yPct} />
                <line x1={FACE_ANCHOR.xPct + 3} y1={FACE_ANCHOR.yPct} x2={FACE_ANCHOR.xPct + 6} y2={FACE_ANCHOR.yPct} />
                <line x1={FACE_ANCHOR.xPct} y1={FACE_ANCHOR.yPct - 6} x2={FACE_ANCHOR.xPct} y2={FACE_ANCHOR.yPct - 3} />
                <line x1={FACE_ANCHOR.xPct} y1={FACE_ANCHOR.yPct + 3} x2={FACE_ANCHOR.xPct} y2={FACE_ANCHOR.yPct + 6} />
              </g>
            </svg>
          )}

          {/* Idle: floating reticle follows the pointer */}
          {phase === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 pointer-events-none">
              <span
                className="bg-cream border border-ink rounded-btn px-2 py-1 arcade-bevel"
                style={{ fontSize: 9, letterSpacing: 2 }}
              >
                TAP TO PLACE CAP
              </span>
            </div>
          )}
          {showReticle && reticlePos && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: reticlePos.x,
                top: reticlePos.y,
                transform: "translate(-50%, -50%)",
              }}
              aria-hidden
            >
              <div
                className="relative w-20 h-20 rounded-full border-2 border-ink flex items-center justify-center"
                style={{
                  background: "rgba(250,162,31,0.18)",
                  animation: "blink 1.2s steps(1) infinite",
                }}
              >
                <span
                  className="absolute inset-2 rounded-full border border-ink"
                  style={{ borderStyle: "dashed" }}
                />
                <span style={{ fontSize: 18 }}>◎</span>
              </div>
            </div>
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
              {/* Locking reticle animates toward face anchor */}
              <div
                className="absolute w-16 h-16 rounded-full border-2 border-marquee"
                style={{
                  left: `${FACE_ANCHOR.xPct}%`,
                  top: `${FACE_ANCHOR.yPct}%`,
                  transform: "translate(-50%, -50%)",
                  animation: "blink 0.6s steps(1) infinite",
                }}
              />
            </div>
          )}

          {/* Cap — snaps to face anchor on done */}
          {phase !== "idle" && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: phase === "done" ? `${FACE_ANCHOR.xPct}%` : (reticlePos ? reticlePos.x : "50%"),
                top: phase === "done" ? `${FACE_ANCHOR.yPct}%` : (reticlePos ? reticlePos.y : "50%"),
                transform: `translate(-50%, -85%) ${
                  phase === "done" && snapped ? capTransform : "scale(1.15)"
                }`,
                opacity: phase === "done" ? 1 : 0.5,
                transition: dragState.current || pinchState.current
                  ? "none"
                  : "left 420ms cubic-bezier(0.22,1,0.36,1), top 420ms cubic-bezier(0.22,1,0.36,1), transform 420ms cubic-bezier(0.22,1,0.36,1), opacity 300ms ease-out",
                filter: phase === "done" && snapped ? "drop-shadow(4px 4px 0 rgba(0,0,0,0.35))" : "none",
              }}
            >
              {detail.image ? (
                <img
                  src={detail.image}
                  alt={detail.name ?? "Cap preview"}
                  width={220}
                  height={220}
                  className="max-h-[150px] w-auto object-contain"
                  draggable={false}
                />
              ) : (
                <PixelHorse size={8} />
              )}
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
