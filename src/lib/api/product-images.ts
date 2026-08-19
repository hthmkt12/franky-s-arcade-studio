// Bundled product images. The API returns an opaque `asset:<key>` URL
// (see src/routes/api/products.ts) that the client resolves to a hashed
// Vite asset URL. This keeps images bundled with the frontend while the
// DB stays lightweight and CDN-agnostic.

import hatBlack from "@/assets/hat-black.png";
import hatGreen from "@/assets/hat-green.png";
import hatOchre from "@/assets/hat-ochre.png";
import hatNavy from "@/assets/hat-navy.png";
import hatRed from "@/assets/hat-red.png";

const ASSETS: Record<string, string> = {
  black: hatBlack,
  green: hatGreen,
  ochre: hatOchre,
  navy: hatNavy,
  red: hatRed,
  "hoodie-black": hatBlack,
  "tote-cream": hatOchre,
  "pin-coin": hatRed,
};

const FALLBACK = hatBlack;

export function resolveProductImage(url: string): string {
  if (!url.startsWith("asset:")) return url;
  const key = url.slice("asset:".length);
  return ASSETS[key] ?? FALLBACK;
}
