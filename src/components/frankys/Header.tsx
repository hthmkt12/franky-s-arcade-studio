import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useCart } from "@/lib/cart/CartContext";
import { arcadeAudio } from "@/lib/audio/arcade-audio";

import { PixelHorse } from "./PixelHorse";

const NAV = [
  { to: "/", label: "HOME" },
  { to: "/shop", label: "SHOP" },
  { to: "/about", label: "ABOUT" },
  { to: "/cart", label: "CART" },
] as const;

export function Header() {
  const cart = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMuted(arcadeAudio.getMuted());
  }, []);

  const handleToggleAudio = () => {
    const muted = arcadeAudio.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="border-b border-ink bg-cream sticky top-0 z-30">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] md:flex items-center justify-between gap-2 px-4 h-14">
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => {
            arcadeAudio.playBeep(350);
            setMenuOpen((v) => !v);
          }}
          className="flex flex-col items-center justify-center gap-1.5 w-11 h-11 rounded-btn border border-pixel arcade-bevel md:hidden shrink-0"
        >
          <span className="block w-5 h-px bg-ink" />
          <span className="block w-5 h-px bg-ink" />
          <span className="block w-5 h-px bg-ink" />
        </button>


        <nav
          className="hidden md:flex items-center gap-3"
          style={{ fontFamily: "var(--font-arcade)", fontSize: 10, letterSpacing: 1 }}
        >
          {NAV.filter((n) => n.to !== "/cart").map((n) => (
            <Link
              key={n.to}
              to={n.to}
              preload="intent"
              onClick={() => arcadeAudio.playBeep(520)}
              activeOptions={{ exact: n.to === "/" }}
              className="px-2 py-1 rounded-btn hover:bg-ink hover:text-cream transition-colors"
              activeProps={{ className: "bg-ink text-cream px-2 py-1 rounded-btn" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <Link
          to="/"
          onClick={() => arcadeAudio.playBeep(587)}
          className="flex items-center justify-center md:justify-start gap-2 min-w-0"
          aria-label="Franky's home"
          preload="intent"
        >
          <PixelHorse size={4} color="var(--ink)" />
          <span
            style={{ fontFamily: "VT323, monospace", fontSize: 28, lineHeight: 1 }}
            className="mt-1 truncate"
          >
            franky's
          </span>
        </Link>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleToggleAudio}
            title={isMuted ? "Unmute 8-bit Audio" : "Mute 8-bit Audio"}
            aria-label={isMuted ? "Unmute sound" : "Mute sound"}
            className="px-2.5 h-11 md:h-9 border border-ink rounded-btn bg-cream arcade-bevel hover:bg-ink hover:text-cream transition-colors flex items-center justify-center text-xs"
            style={{ fontFamily: "var(--font-arcade)", fontSize: 10 }}
          >
            {isMuted ? "🔇" : "🔊"}
          </button>

          <button
            type="button"
            onClick={() => {
              arcadeAudio.playBeep(440);
              cart.toggle();
            }}
            aria-label={`Open cart, ${mounted ? cart.itemCount : 0} items`}
            className="relative px-3 h-11 md:h-9 border border-ink rounded-btn bg-cream arcade-bevel hover:bg-ink hover:text-cream transition-colors"
            style={{ fontFamily: "var(--font-arcade)", fontSize: 10, letterSpacing: 1 }}
          >
            <span aria-live="polite">CART [{mounted ? cart.itemCount : 0}]</span>
          </button>
        </div>

      </div>

      {menuOpen && (
        <nav
          className="md:hidden border-t border-ink flex flex-col bg-cream"
          style={{ fontFamily: "var(--font-arcade)", fontSize: 12 }}
        >
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              preload="intent"
              onClick={() => {
                arcadeAudio.playBeep(520);
                setMenuOpen(false);
              }}
              className="px-4 py-3 border-b border-pixel"
              activeProps={{ className: "px-4 py-3 border-b border-pixel bg-ink text-cream" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
