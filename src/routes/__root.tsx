import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "../lib/cart/CartContext";
import { Header } from "../components/frankys/Header";
import { TopMarquee, BottomMarquee } from "../components/frankys/Marquee";
import { CartDrawer } from "../components/frankys/CartDrawer";
import { PixelHorse } from "../components/frankys/PixelHorse";
import { ArModal } from "../components/frankys/ArModal";
import { SizeGuideModal } from "../components/frankys/SizeGuideModal";

function NotFoundComponent() {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center gap-4 py-16 px-4 text-center checker-bg"
      style={{ fontFamily: "var(--font-arcade)" }}
    >
      <PixelHorse size={10} />
      <h1 style={{ fontSize: 22, letterSpacing: 2 }}>GAME OVER</h1>
      <p style={{ fontSize: 12 }}>THIS PAGE DOES NOT EXIST — INSERT COIN</p>
      <Link
        to="/"
        className="bg-ink text-cream px-4 py-3 rounded-btn border border-ink arcade-bevel"
        style={{ fontSize: 12, letterSpacing: 2 }}
      >
        RETURN HOME
      </Link>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center gap-4 py-16 px-4 text-center"
      style={{ fontFamily: "var(--font-arcade)" }}
    >
      <h1 style={{ fontSize: 18, letterSpacing: 2 }}>SYSTEM ERROR</h1>
      <p style={{ fontSize: 11 }}>SOMETHING BROKE. TRY AGAIN OR RETURN HOME.</p>
      <div className="flex gap-2">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="bg-ink text-cream px-4 py-3 rounded-btn border border-ink arcade-bevel"
          style={{ fontSize: 10, letterSpacing: 2 }}
        >
          RETRY
        </button>
        <Link
          to="/"
          className="border border-ink px-4 py-3 rounded-btn arcade-bevel"
          style={{ fontSize: 10, letterSpacing: 2 }}
        >
          HOME
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Franky's — Handmade Wool Caps" },
      {
        name: "description",
        content:
          "Franky's makes handmade merino wool caps in Portugal. Arcade-shop energy, one warm orange call, cream paper and pixel rules.",
      },
      { property: "og:title", content: "Franky's — Handmade Wool Caps" },
      {
        property: "og:description",
        content: "Handmade merino wool caps from Portugal. Insert coin. Press start.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <div className="min-h-screen flex flex-col bg-cream text-ink">
          <TopMarquee />
          <Header />
          <main className="flex-1 flex flex-col">
            <Outlet />
          </main>
          <BottomMarquee />
          <CartDrawer />
          <ArModal />
          <SizeGuideModal />

          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                fontFamily: "var(--font-arcade)",
                fontSize: 10,
                background: "var(--ink)",
                color: "var(--cream)",
                border: "1px solid var(--ink)",
                borderRadius: 6,
                letterSpacing: 1,
              },
            }}
          />
        </div>
      </CartProvider>
    </QueryClientProvider>
  );
}
