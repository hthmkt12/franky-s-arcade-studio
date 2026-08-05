import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ErrorState } from "@/components/frankys/ErrorState";
import { computeTotals, createOrder, formatPrice, getProducts } from "@/lib/api/shop";

import { useCart } from "@/lib/cart/CartContext";
import type { Customer } from "@/lib/api/types";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Franky's" },
      { name: "description", content: "Ship your Franky's cap. Guest checkout." },
      { property: "og:title", content: "Checkout — Franky's" },
      { property: "og:description", content: "Guest checkout for handmade wool caps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],

  }),
  component: CheckoutPage,
});

const EMPTY: Customer = {
  name: "",
  email: "",
  address: "",
  city: "",
  postalCode: "",
  country: "PT",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const {
    data: products,
    isPending: productsPending,
    isError: productsError,
    refetch,
  } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const [customer, setCustomer] = useState<Customer>(EMPTY);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(
    () => (products ? computeTotals(cart.lines, products) : null),
    [cart.lines, products],
  );
  const items = products ? cart.buildView(products) : [];


  const errors = useMemo(() => {
    const e: Partial<Record<keyof Customer, string>> = {};
    if (!customer.name.trim()) e.name = "REQUIRED";
    if (!EMAIL_RE.test(customer.email)) e.email = "INVALID EMAIL";
    if (!customer.address.trim()) e.address = "REQUIRED";
    if (!customer.city.trim()) e.city = "REQUIRED";
    if (customer.postalCode.trim().length < 3) e.postalCode = "TOO SHORT";
    if (customer.country.trim().length !== 2) e.country = "2 LETTERS (E.G. PT)";
    return e;
  }, [customer]);

  const valid = Object.keys(errors).length === 0 && items.length > 0;

  const set = <K extends keyof Customer>(k: K, v: Customer[K]) =>
    setCustomer((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      address: true,
      city: true,
      postalCode: true,
      country: true,
    });
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    try {
      const order = await createOrder({ items: cart.lines, customer });
      cart.clear();
      toast(`ORDER PLACED — ${order.number}`);
      navigate({ to: "/checkout/success/$id", params: { id: order.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "ORDER FAILED");
      setSubmitting(false);
    }
  };

  if (productsError) {
    return (
      <div className="flex-1 flex items-center justify-center p-10">
        <ErrorState
          message="COULD NOT LOAD CHECKOUT DATA."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (productsPending) {
    return (
      <div className="flex-1 p-10 max-w-4xl mx-auto w-full" aria-busy="true" aria-live="polite">
        <div className="border border-ink rounded-card h-80 checker-bg opacity-40 animate-pulse" />
      </div>
    );
  }

  if (items.length === 0) {

    return (
      <div
        className="flex-1 flex flex-col items-center justify-center gap-4 p-10 text-center"
        style={{ fontFamily: "var(--font-arcade)" }}
      >
        <h1 style={{ fontSize: 16 }}>NOTHING TO CHECKOUT</h1>
        <Link
          to="/shop"
          className="bg-ink text-cream px-4 py-2 rounded-btn border border-ink arcade-bevel"
          style={{ fontSize: 10 }}
        >
          SHOP NOW
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-cream">
      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <h1
            className="border-b border-ink pb-3"
            style={{ fontFamily: "var(--font-arcade)", fontSize: 18, letterSpacing: 2 }}
          >
            ★ CHECKOUT
          </h1>

          <Field
            label="NAME"
            value={customer.name}
            onChange={(v) => set("name", v)}
            error={touched.name ? errors.name : undefined}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            maxLength={80}
          />
          <Field
            label="EMAIL"
            type="email"
            value={customer.email}
            onChange={(v) => set("email", v)}
            error={touched.email ? errors.email : undefined}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            maxLength={120}
          />
          <Field
            label="ADDRESS"
            value={customer.address}
            onChange={(v) => set("address", v)}
            error={touched.address ? errors.address : undefined}
            onBlur={() => setTouched((t) => ({ ...t, address: true }))}
            maxLength={200}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="CITY"
              value={customer.city}
              onChange={(v) => set("city", v)}
              error={touched.city ? errors.city : undefined}
              onBlur={() => setTouched((t) => ({ ...t, city: true }))}
              maxLength={80}
            />
            <Field
              label="POSTAL"
              value={customer.postalCode}
              onChange={(v) => set("postalCode", v)}
              error={touched.postalCode ? errors.postalCode : undefined}
              onBlur={() => setTouched((t) => ({ ...t, postalCode: true }))}
              maxLength={20}
            />
          </div>
          <Field
            label="COUNTRY (2)"
            value={customer.country}
            onChange={(v) => set("country", v.toUpperCase())}
            error={touched.country ? errors.country : undefined}
            onBlur={() => setTouched((t) => ({ ...t, country: true }))}
            maxLength={2}
          />

          {error && (
            <p
              className="border border-ink bg-marquee text-ink p-2 rounded-btn"
              style={{ fontFamily: "var(--font-arcade)", fontSize: 10 }}
            >
              ! {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!valid || submitting}
            className="bg-buy text-cream py-4 rounded-btn border border-ink arcade-bevel disabled:bg-muted disabled:cursor-not-allowed"
            style={{ fontFamily: "var(--font-arcade)", fontSize: 14, letterSpacing: 2 }}
          >
            {submitting ? "SENDING..." : "PLACE ORDER"}
          </button>
        </form>

        <aside
          className="border border-ink rounded-card p-4 bg-cream arcade-bevel h-fit flex flex-col gap-2 md:sticky md:top-4"
          style={{ fontFamily: "var(--font-arcade)", fontSize: 10 }}
        >
          <h2 style={{ fontSize: 12, letterSpacing: 2 }} className="border-b border-pixel pb-2">
            ORDER
          </h2>
          <ul className="flex flex-col gap-1.5">
            {items.map((it) => (
              <li key={`${it.productId}-${it.size}`} className="flex justify-between">
                <span>
                  {it.product.name} ×{it.qty} ({it.size})
                </span>
                <span>{formatPrice(it.lineTotalCents)}</span>
              </li>
            ))}
          </ul>
          {totals && (
            <div className="border-t border-pixel border-dashed pt-2 flex flex-col gap-1">
              <Row label="SUBTOTAL" value={formatPrice(totals.subtotalCents)} />
              <Row label="SHIPPING" value={formatPrice(totals.shippingCents)} />
              <Row label="TOTAL" value={formatPrice(totals.totalCents)} bold />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  error,
  type = "text",
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  type?: string;
  maxLength?: number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span style={{ fontFamily: "var(--font-arcade)", fontSize: 10, fontWeight: 700 }}>
        {label}
      </span>
      <input
        required
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`border rounded-btn px-3 py-2 bg-cream ${
          error ? "border-ink" : "border-pixel"
        }`}
        style={{ fontFamily: "VT323, monospace", fontSize: 18 }}
      />
      {error && (
        <span style={{ fontFamily: "var(--font-arcade)", fontSize: 9 }} className="text-ink">
          ! {error}
        </span>
      )}
    </label>
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
