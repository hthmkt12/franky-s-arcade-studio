import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { PixelHorse } from "@/components/frankys/PixelHorse";
import { formatPrice } from "@/lib/api/shop";
import type { Order } from "@/lib/api/types";

export const Route = createFileRoute("/checkout/success/$id")({
  head: () => ({
    meta: [
      { title: "Order Confirmed — Franky's" },
      { name: "description", content: "Your Franky's order is in the queue." },
      { property: "og:title", content: "Order Confirmed — Franky's" },
      { property: "og:description", content: "Your Franky's order is in the queue." },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(`frankys.order.${id}`);
    if (raw) {
      try {
        setOrder(JSON.parse(raw) as Order);
      } catch {
        // ignore
      }
    }
  }, [id]);

  return (
    <div className="flex-1 checker-bg">
      <div className="max-w-lg mx-auto px-4 py-12">
        <div
          className="bg-cream border border-ink rounded-card p-6 flex flex-col items-center gap-4 text-center arcade-bevel"
          style={{ fontFamily: "var(--font-arcade)" }}
        >
          <PixelHorse size={8} />
          <h1 style={{ fontSize: 18, letterSpacing: 2 }}>★ ORDER CONFIRMED ★</h1>
          <p style={{ fontSize: 12 }}>{order?.number ?? id.toUpperCase()}</p>
          {order && (
            <>
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
              </div>
            </>
          )}
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
