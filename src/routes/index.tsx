import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

import { ErrorState } from "@/components/frankys/ErrorState";
import { PixelHorse } from "@/components/frankys/PixelHorse";
const Cap3DViewer = lazy(() =>
  import("@/components/frankys/Cap3DViewer").then(({ Cap3DViewer }) => ({ default: Cap3DViewer })),
);
const PixelRunnerModal = lazy(() =>
  import("@/components/frankys/PixelRunnerModal").then(({ PixelRunnerModal }) => ({
    default: PixelRunnerModal,
  })),
);
import { arcadeAudio } from "@/lib/audio/arcade-audio";

import { ViewModeToggle, type ViewMode } from "@/components/frankys/ViewModeToggle";
import { formatPrice, getProducts } from "@/lib/api/shop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Franky's — Handmade Wool Caps from Portugal" },
      {
        name: "description",
        content:
          "Arcade-shop for handmade merino wool caps. Insert coin, browse the shop, and pick your color.",
      },
      { property: "og:title", content: "Franky's — Handmade Wool Caps" },
      {
        property: "og:description",
        content: "Handmade merino wool caps. Cream paper, pixel rules, one warm orange call.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),

  component: LandingPage,
});

function LandingPage() {
  const {
    data: products,
    isError,
    refetch,
  } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const featured = products?.filter((p) => p.inStock).slice(0, 3) ?? [];

  const [viewMode, setViewMode] = useState<ViewMode>("3D");
  const [coinInserted, setCoinInserted] = useState(false);
  const [runnerOpen, setRunnerOpen] = useState(false);

  // Konami Code sequence detection
  useEffect(() => {
    const konamiSequence = [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowLeft",
      "ArrowRight",
      "KeyB",
      "KeyA",
    ];
    let currentIndex = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const targetKey = konamiSequence[currentIndex];
      if (e.code === targetKey || e.key === targetKey) {
        currentIndex++;
        if (currentIndex === konamiSequence.length) {
          currentIndex = 0;
          arcadeAudio.playKonamiFanfare();
          toast.success(
            "★ 30 LIVES GRANTED! KONAMI SECRET CODE ACTIVATED: 'KONAMI' FOR 10% OFF ★",
            {
              duration: 6000,
            },
          );
          try {
            localStorage.setItem("frankys.promo.code", "KONAMI");
          } catch {
            // localStorage may be unavailable; ignore.
          }
        }
      } else {
        currentIndex = 0;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleInsertCoin = () => {
    arcadeAudio.playCoin();
    setCoinInserted(true);
    toast.success("1-UP! CHEAT CODE UNLOCKED: 'COIN10' FOR 10% OFF", {
      duration: 5000,
    });
    try {
      localStorage.setItem("frankys.promo.code", "COIN10");
    } catch {
      // localStorage may be unavailable; ignore.
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* HERO */}
      <section className="border-b border-ink checker-warp">
        <div className="checker-warp-floor" aria-hidden />
        <div className="checker-warp-fade" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-4 py-10 md:py-16 flex flex-col items-center gap-6 text-center">
          <div className="bg-cream border-2 border-ink rounded-card p-6 md:p-10 flex flex-col items-center gap-5 shadow-arcade-modal max-w-xl w-full">
            <ViewModeToggle mode={viewMode} onChange={setViewMode} productName="FRANKY'S CAP" />

            {viewMode === "3D" ? (
              <Suspense
                fallback={
                  <div
                    className="h-[220px] w-full checker-bg animate-pulse rounded-card border border-ink"
                    aria-label="Loading 3D model"
                  />
                }
              >
                <Cap3DViewer colorHex="#faa21f" />
              </Suspense>
            ) : (
              <PixelHorse size={12} />
            )}

            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-2 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={handleInsertCoin}
                  className={`px-4 py-2 rounded-pill border-2 border-ink shadow-arcade-sm arcade-btn-active flex items-center gap-2 cursor-pointer transition-all duration-300 ${
                    coinInserted
                      ? "bg-buy text-cream animate-pulse"
                      : "bg-marquee text-ink hover:scale-105"
                  }`}
                  style={{ fontFamily: "var(--font-arcade)", fontSize: 11, letterSpacing: 2 }}
                >
                  <span>🪙</span>
                  <span>{coinInserted ? "COIN INSERTED: 1-UP!" : "INSERT COIN [CLICK]"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    arcadeAudio.playBeep(480);
                    setRunnerOpen(true);
                  }}
                  className="px-4 py-2 rounded-pill border-2 border-ink bg-cream hover:bg-ink hover:text-cream shadow-arcade-sm arcade-btn-active flex items-center gap-2 cursor-pointer transition-all duration-300"
                  style={{ fontFamily: "var(--font-arcade)", fontSize: 11, letterSpacing: 2 }}
                >
                  <span>🎮</span>
                  <span>PLAY RUNNER</span>
                </button>
              </div>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-arcade)",
                fontSize: "clamp(24px, 5vw, 42px)",
                letterSpacing: 3,
                lineHeight: 1.2,
              }}
              className="text-ink font-bold drop-shadow-sm"
            >
              PRESS START
            </h1>
            <p
              className="max-w-md text-charcoal font-medium"
              style={{ fontFamily: "VT323, monospace", fontSize: 22, lineHeight: 1.4 }}
            >
              Handmade merino wool caps from Portugal. Arcade-shop energy, none of the chrome.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              <Link
                to="/shop"
                preload="intent"
                onClick={() => arcadeAudio.playBeep(440)}
                className="bg-buy text-white px-7 py-3.5 rounded-btn border-2 border-ink shadow-arcade arcade-btn-active hover:bg-buy/90 font-bold"
                style={{ fontFamily: "var(--font-arcade)", fontSize: 12, letterSpacing: 2 }}
              >
                SHOP NOW
              </Link>
              <Link
                to="/about"
                preload="intent"
                onClick={() => arcadeAudio.playBeep(520)}
                className="bg-cream text-ink px-7 py-3.5 rounded-btn border-2 border-ink shadow-arcade arcade-btn-active hover:bg-marquee font-bold"
                style={{ fontFamily: "var(--font-arcade)", fontSize: 12, letterSpacing: 2 }}
              >
                OUR STORY
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="border-b border-ink bg-cream">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ fontFamily: "var(--font-arcade)", fontSize: 14, letterSpacing: 2 }}>
              ★ FEATURED
            </h2>
            <Link
              to="/shop"
              preload="intent"
              style={{ fontFamily: "var(--font-arcade)", fontSize: 10, letterSpacing: 1 }}
              className="underline underline-offset-4"
            >
              SEE ALL →
            </Link>
          </div>
          {isError ? (
            <ErrorState message="COULD NOT LOAD FEATURED CAPS." onRetry={() => void refetch()} />
          ) : !products ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="border border-ink rounded-card h-56 checker-bg opacity-40 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featured.map((p) => (
                <Link
                  key={p.id}
                  to="/shop/$slug"
                  params={{ slug: p.slug }}
                  preload="intent"
                  className="border border-ink rounded-card overflow-hidden bg-cream flex flex-col arcade-bevel transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex-1 min-h-[180px] flex items-center justify-center p-4">
                    <img
                      src={p.image.url}
                      alt={p.image.alt}
                      width={512}
                      height={512}
                      loading="lazy"
                      className="max-h-[180px] w-auto object-contain"
                    />
                  </div>
                  <div
                    className="border-t border-pixel px-3 py-2 flex justify-between"
                    style={{ fontSize: 10 }}
                  >
                    <span style={{ fontWeight: 700 }}>{p.name}</span>
                    <span>{formatPrice(p.priceCents, p.currency)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* BADGES */}
      <section className="bg-cream">
        <div
          className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-3"
          style={{ fontFamily: "var(--font-arcade)", fontSize: 10, letterSpacing: 1 }}
        >
          {["★ HANDMADE IN PORTUGAL", "★ 100% MERINO WOOL", "★ FREE SHIPPING OVER €100"].map(
            (t) => (
              <div
                key={t}
                className="border border-ink rounded-btn arcade-bevel px-4 py-4 text-center"
              >
                {t}
              </div>
            ),
          )}
        </div>
      </section>
      {/* PIXEL RUNNER MODAL */}
      <Suspense fallback={null}>
        <PixelRunnerModal isOpen={runnerOpen} onClose={() => setRunnerOpen(false)} />
      </Suspense>
    </div>
  );
}
