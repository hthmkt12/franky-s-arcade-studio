import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { ErrorState } from "@/components/frankys/ErrorState";
import { PixelHorse } from "@/components/frankys/PixelHorse";
import { formatPrice, getOrder } from "@/lib/api/shop";

export const Route = createFileRoute("/checkout/success/$id")({
  validateSearch: (search: Record<string, unknown>): { token?: string } => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Order Confirmed — Franky's" },
      { name: "description", content: "Your Franky's order is in the queue." },
      { property: "og:title", content: "Order Confirmed — Franky's" },
      { property: "og:description", content: "Your Franky's order is in the queue." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { id } = Route.useParams();
  const search = useSearch({ from: "/checkout/success/$id" });
  const {
    data: order,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["order", id, search.token],
    queryFn: () => getOrder(id, search.token),
    retry: 1,
  });

  const notFound = isError && (error as { status?: number } | null)?.status === 404;

  return (
    <div className="flex-1 checker-bg">
      <div className="max-w-lg mx-auto px-4 py-12">
        {isError ? (
          <ErrorState
            title={notFound ? "ORDER NOT FOUND" : "SIGNAL LOST"}
            message={
              notFound
                ? "WE COULD NOT FIND THIS ORDER. CHECK THE LINK OR CONTACT US."
                : "COULD NOT LOAD YOUR ORDER RECEIPT."
            }
            onRetry={notFound ? undefined : () => void refetch()}
          />
        ) : isPending ? (
          <div
            className="border border-ink rounded-card h-64 bg-cream opacity-40 animate-pulse"
            aria-busy="true"
            aria-live="polite"
          />
        ) : (
          <div
            className="bg-cream border border-ink rounded-card p-6 flex flex-col items-center gap-4 text-center arcade-bevel"
            style={{ fontFamily: "var(--font-arcade)" }}
          >
            <PixelHorse size={8} />
            <h1 style={{ fontSize: 18, letterSpacing: 2 }}>★ ORDER CONFIRMED ★</h1>
            <p style={{ fontSize: 12 }}>{order.number}</p>
            <p className="text-muted" style={{ fontSize: 10 }}>
              A RECEIPT WILL ARRIVE AT {order.customer.email.toUpperCase()}
            </p>
            <div
              className="w-full border-t border-pixel border-dashed pt-3 flex flex-col gap-1"
              style={{ fontSize: 10 }}
            >
              <Row label="SUBTOTAL" value={formatPrice(order.subtotalCents, order.currency)} />
              <Row label="SHIPPING" value={formatPrice(order.shippingCents, order.currency)} />
              <Row label="TOTAL" value={formatPrice(order.totalCents, order.currency)} bold />
              <Row label="STATUS" value={order.status.toUpperCase()} />
              {order.carrier && <Row label="CARRIER" value={order.carrier.toUpperCase()} />}
              {order.trackingNumber && (
                <div className="bg-black text-orange-400 p-2 rounded-btn font-bold text-center mt-1 border border-ink">
                  TRACKING: {order.trackingNumber}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <Link
                to="/shop"
                className="bg-ink text-cream px-4 py-2 rounded-btn border border-ink arcade-bevel"
                style={{ fontSize: 10, letterSpacing: 2 }}
              >
                KEEP SHOPPING
              </Link>
              <Link
                to="/"
                className="border border-ink px-4 py-2 rounded-btn arcade-bevel"
                style={{ fontSize: 10, letterSpacing: 2 }}
              >
                HOME
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between" style={{ fontWeight: bold ? 700 : 400 }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
