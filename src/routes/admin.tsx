import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ErrorState } from "@/components/frankys/ErrorState";
import { supabase } from "@/integrations/supabase/client";
import {
  claimAdmin,
  getAdminSession,
  listOrders,
  listStock,
  updateOrderStatus,
  updateStock,
} from "@/lib/admin.functions";
import { formatPrice } from "@/lib/api/shop";

const STATUSES = ["pending", "paid", "shipped", "cancelled"] as const;

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Franky's" },
      { name: "description", content: "Franky's staff order and stock console." },
      { property: "og:title", content: "Admin — Franky's" },
      { property: "og:description", content: "Franky's staff order and stock console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
      setChecked(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      setChecked(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (checked && !signedIn) void navigate({ to: "/auth" });
  }, [checked, signedIn, navigate]);

  if (!checked || !signedIn) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ fontSize: 10 }}>
        <span style={{ fontFamily: "var(--font-arcade)" }}>LOADING CONSOLE…</span>
      </div>
    );
  }
  return <AdminConsole />;
}

function AdminConsole() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const session = useServerFn(getAdminSession);
  const claim = useServerFn(claimAdmin);

  const sessionQuery = useQuery({ queryKey: ["admin", "session"], queryFn: () => session() });

  const claimMutation = useMutation({
    mutationFn: () => claim(),
    onSuccess: (res) => {
      if (res.granted) {
        toast.success("ADMIN ACCESS GRANTED");
        void qc.invalidateQueries({ queryKey: ["admin"] });
      } else {
        toast.error((res.reason ?? "NOT ALLOWED").toUpperCase());
      }
    },
    onError: (e) => toast.error((e as Error).message.toUpperCase()),
  });

  async function signOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/auth" });
  }

  return (
    <div className="flex-1 bg-cream">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-5">
        <header
          className="flex items-center justify-between gap-3 flex-wrap"
          style={{ fontFamily: "var(--font-arcade)" }}
        >
          <h1 style={{ fontSize: 16, letterSpacing: 2 }}>STAFF CONSOLE</h1>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="border border-pixel rounded-btn px-3 py-2 arcade-bevel"
              style={{ fontSize: 9, letterSpacing: 1 }}
            >
              SHOP
            </Link>
            <button
              onClick={() => void signOut()}
              className="bg-ink text-cream rounded-btn px-3 py-2 border border-ink arcade-bevel"
              style={{ fontSize: 9, letterSpacing: 1 }}
            >
              SIGN OUT
            </button>
          </div>
        </header>

        {sessionQuery.isError ? (
          <ErrorState
            message="COULD NOT VERIFY YOUR ACCESS."
            onRetry={() => void sessionQuery.refetch()}
          />
        ) : sessionQuery.isPending ? (
          <div className="border border-pixel rounded-card h-24 checker-bg opacity-40 animate-pulse" />
        ) : !sessionQuery.data.isAdmin ? (
          <div
            className="border border-ink rounded-card bg-cream arcade-bevel p-6 flex flex-col items-center gap-3 text-center"
            style={{ fontFamily: "var(--font-arcade)" }}
          >
            <span style={{ fontSize: 12, letterSpacing: 2 }}>ACCESS DENIED</span>
            <p className="text-muted" style={{ fontSize: 10, lineHeight: 1.8 }}>
              {sessionQuery.data.email ?? "THIS ACCOUNT"} IS NOT AN ADMIN.
              <br />
              IF THIS SHOP HAS NO ADMIN YET, CLAIM IT NOW.
            </p>
            <button
              onClick={() => claimMutation.mutate()}
              disabled={claimMutation.isPending}
              className="bg-buy text-cream px-4 py-3 rounded-btn border border-ink arcade-bevel disabled:opacity-50"
              style={{ fontSize: 10, letterSpacing: 2 }}
            >
              {claimMutation.isPending ? "..." : "CLAIM ADMIN"}
            </button>
          </div>
        ) : (
          <>
            <OrdersPanel />
            <StockPanel />
          </>
        )}
      </div>
    </div>
  );
}

function OrdersPanel() {
  const qc = useQueryClient();
  const fetchOrders = useServerFn(listOrders);
  const setStatus = useServerFn(updateOrderStatus);
  const [shippingForm, setShippingForm] = useState<{ id: string; trackingNumber: string; carrier: string } | null>(null);

  const ordersQuery = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => fetchOrders(),
  });

  const statusMutation = useMutation({
    mutationFn: (v: { id: string; status: (typeof STATUSES)[number]; trackingNumber?: string; carrier?: string }) =>
      setStatus({ data: v }),
    onSuccess: () => {
      toast.success("ORDER UPDATED");
      setShippingForm(null);
      void qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: (e) => toast.error((e as Error).message.toUpperCase()),
  });

  const handleStatusClick = (orderId: string, currentStatus: string, targetStatus: (typeof STATUSES)[number]) => {
    if (targetStatus === "shipped") {
      setShippingForm({ id: orderId, trackingNumber: "", carrier: "CTT Express" });
    } else {
      statusMutation.mutate({ id: orderId, status: targetStatus });
    }
  };

  return (
    <section className="flex flex-col gap-2" style={{ fontFamily: "var(--font-arcade)" }}>
      <h2 style={{ fontSize: 12, letterSpacing: 2 }}>ORDERS</h2>

      {ordersQuery.isError ? (
        <ErrorState
          compact
          message="COULD NOT LOAD ORDERS."
          onRetry={() => void ordersQuery.refetch()}
        />
      ) : ordersQuery.isPending ? (
        <div className="border border-pixel rounded-card h-32 checker-bg opacity-40 animate-pulse" />
      ) : ordersQuery.data.length === 0 ? (
        <p className="text-muted" style={{ fontSize: 10 }}>
          NO ORDERS YET — INSERT COIN
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {ordersQuery.data.map((o) => (
            <li
              key={o.id}
              className="border border-pixel rounded-card bg-cream arcade-bevel p-3 flex flex-col gap-2"
            >
              <div className="flex justify-between items-center gap-2 flex-wrap">
                <span style={{ fontSize: 10, fontWeight: 700 }}>{o.number}</span>
                <span style={{ fontSize: 10, fontWeight: 700 }}>
                  {formatPrice(o.totalCents, o.currency === "USD" ? "USD" : "EUR")}
                </span>
              </div>
              <div className="text-muted" style={{ fontFamily: "VT323, monospace", fontSize: 16 }}>
                {o.customerName} · {o.customerEmail} · {o.city}, {o.country} ·{" "}
                {new Date(o.createdAt).toLocaleString()}
              </div>

              {o.trackingNumber && (
                <div className="bg-ink text-cream p-2 rounded-btn flex items-center justify-between text-xs">
                  <span>TRACKING [{o.carrier ?? "CARRIER"}]: {o.trackingNumber}</span>
                  <span className="text-buy font-bold">DISPATCHED</span>
                </div>
              )}

              <ul style={{ fontFamily: "VT323, monospace", fontSize: 16 }}>
                {o.items.map((i) => (
                  <li key={i.id}>
                    {i.qty}× {i.name} [{i.size}] — {formatPrice(i.unitPriceCents)}
                  </li>
                ))}
              </ul>

              {shippingForm?.id === o.id ? (
                <div className="border-2 border-dashed border-ink p-3 rounded-card bg-white flex flex-col gap-2">
                  <span style={{ fontSize: 9, letterSpacing: 1, fontWeight: 700 }}>ENTER SHIPMENT DETAILS</span>
                  <div className="flex gap-2 flex-wrap">
                    <input
                      type="text"
                      placeholder="CARRIER (e.g. CTT / DHL)"
                      value={shippingForm.carrier}
                      onChange={(e) => setShippingForm({ ...shippingForm, carrier: e.target.value })}
                      className="border border-pixel rounded-btn px-2 py-1 bg-cream flex-1 text-xs"
                      style={{ fontFamily: "VT323, monospace", fontSize: 16 }}
                    />
                    <input
                      type="text"
                      placeholder="TRACKING NUMBER"
                      value={shippingForm.trackingNumber}
                      onChange={(e) => setShippingForm({ ...shippingForm, trackingNumber: e.target.value })}
                      className="border border-pixel rounded-btn px-2 py-1 bg-cream flex-1 text-xs"
                      style={{ fontFamily: "VT323, monospace", fontSize: 16 }}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShippingForm(null)}
                      className="px-3 py-1 border border-pixel rounded-btn text-xs"
                    >
                      CANCEL
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        statusMutation.mutate({
                          id: o.id,
                          status: "shipped",
                          carrier: shippingForm.carrier,
                          trackingNumber: shippingForm.trackingNumber,
                        })
                      }
                      disabled={statusMutation.isPending || !shippingForm.trackingNumber.trim()}
                      className="bg-buy text-cream px-3 py-1 border border-ink rounded-btn text-xs arcade-bevel disabled:opacity-50"
                    >
                      {statusMutation.isPending ? "SAVING..." : "DISPATCH & NOTIFY"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-1 flex-wrap">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusClick(o.id, o.status, s)}
                      disabled={statusMutation.isPending || o.status === s}
                      className={`px-2 py-1.5 rounded-pill border arcade-bevel ${
                        o.status === s ? "bg-ink text-cream border-ink" : "border-pixel"
                      }`}
                      style={{ fontSize: 9, letterSpacing: 1 }}
                    >
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StockPanel() {
  const qc = useQueryClient();
  const fetchStock = useServerFn(listStock);
  const saveStock = useServerFn(updateStock);
  const [draft, setDraft] = useState<Record<string, number>>({});

  const stockQuery = useQuery({ queryKey: ["admin", "stock"], queryFn: () => fetchStock() });

  const stockMutation = useMutation({
    mutationFn: (v: { id: string; stockQty: number }) => saveStock({ data: v }),
    onSuccess: () => {
      toast.success("STOCK SAVED");
      void qc.invalidateQueries({ queryKey: ["admin", "stock"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) => toast.error((e as Error).message.toUpperCase()),
  });

  return (
    <section className="flex flex-col gap-2" style={{ fontFamily: "var(--font-arcade)" }}>
      <h2 style={{ fontSize: 12, letterSpacing: 2 }}>STOCK</h2>

      {stockQuery.isError ? (
        <ErrorState
          compact
          message="COULD NOT LOAD STOCK."
          onRetry={() => void stockQuery.refetch()}
        />
      ) : stockQuery.isPending ? (
        <div className="border border-pixel rounded-card h-24 checker-bg opacity-40 animate-pulse" />
      ) : (
        <ul className="flex flex-col gap-2">
          {stockQuery.data.map((p) => {
            const value = draft[p.id] ?? p.stockQty;
            return (
              <li
                key={p.id}
                className="border border-pixel rounded-card bg-cream arcade-bevel p-3 flex items-center gap-2 flex-wrap"
              >
                <span className="flex-1" style={{ fontSize: 10 }}>
                  {p.name}
                </span>
                <input
                  type="number"
                  min={0}
                  max={9999}
                  value={value}
                  onChange={(e) =>
                    setDraft({ ...draft, [p.id]: Math.max(0, Number(e.target.value) || 0) })
                  }
                  className="w-20 border border-pixel rounded-btn px-2 py-1 bg-cream"
                  style={{ fontFamily: "VT323, monospace", fontSize: 18 }}
                  aria-label={`Stock for ${p.name}`}
                />
                <button
                  onClick={() => stockMutation.mutate({ id: p.id, stockQty: value })}
                  disabled={stockMutation.isPending || value === p.stockQty}
                  className="bg-buy text-cream px-3 py-2 rounded-btn border border-ink arcade-bevel disabled:opacity-40"
                  style={{ fontSize: 9, letterSpacing: 1 }}
                >
                  SAVE
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
