import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useCart } from "@/lib/cart/CartContext";

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
  useEffect(() => setMounted(true), []);

  return (
    <header className="border-b border-ink bg-cream sticky top-0 z-30">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] md:flex items-center justify-between gap-2 px-4 h-14">
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
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
          className="flex items-center gap-2"
          aria-label="Franky's home"
          preload="intent"
        >
          <PixelHorse size={4} color="var(--ink)" />
          <span
            style={{ fontFamily: "VT323, monospace", fontSize: 28, lineHeight: 1 }}
            className="mt-1"
          >
            franky's
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={cart.toggle}
            aria-label="Open cart"
            className="relative px-3 h-9 border border-ink rounded-btn bg-cream arcade-bevel"
            style={{ fontFamily: "var(--font-arcade)", fontSize: 10, letterSpacing: 1 }}
          >
            CART [{mounted ? cart.itemCount : 0}]
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
              onClick={() => setMenuOpen(false)}
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
