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

  // Promo code state
  const [promoCode, setPromoCode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("frankys.promo.code") || "";
    }
    return "";
  });
  const [appliedPromo, setAppliedPromo] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("frankys.promo.code") === "COIN10" ? "COIN10" : null;
    }
    return null;
  });

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (code === "COIN10" || code === "KONAMI") {
      setAppliedPromo("COIN10");
      toast.success("CHEAT CODE ACCEPTED: 10% OFF APPLIED!");
      import("@/lib/audio/arcade-audio").then(({ arcadeAudio }) => arcadeAudio.playVictory());
    } else if (code === "RUNNER15") {
      setAppliedPromo("RUNNER15");
      toast.success("ARCADE RUNNER BONUS: 15% OFF APPLIED!");
      import("@/lib/audio/arcade-audio").then(({ arcadeAudio }) => arcadeAudio.playVictory());
    } else if (code === "CHAMP20") {
      setAppliedPromo("CHAMP20");
      toast.success("★ TOP RANK CHAMPION REWARD: 20% OFF APPLIED! ★");
      import("@/lib/audio/arcade-audio").then(({ arcadeAudio }) => arcadeAudio.playVictory());
    } else {
      toast.error("INVALID CHEAT CODE. PLAY RUNNER OR CLICK INSERT COIN!");
    }
  };

  const totals = useMemo(() => {
    if (!products) return null;
    const base = computeTotals(cart.lines, products);
    if (appliedPromo === "COIN10" || appliedPromo === "KONAMI") {
      const discount = Math.round(base.subtotalCents * 0.1);
      return {
        ...base,
        discountCents: discount,
        totalCents: Math.max(0, base.totalCents - discount),
      };
    }
    if (appliedPromo === "RUNNER15") {
      const discount = Math.round(base.subtotalCents * 0.15);
      return {
        ...base,
        discountCents: discount,
        totalCents: Math.max(0, base.totalCents - discount),
      };
    }
    if (appliedPromo === "CHAMP20") {
      const discount = Math.round(base.subtotalCents * 0.2);
      return {
        ...base,
        discountCents: discount,
        totalCents: Math.max(0, base.totalCents - discount),
      };
    }
    return { ...base, discountCents: 0 };
  }, [cart.lines, products, appliedPromo]);
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
      const order = await createOrder({
        items: cart.lines,
        customer,
        promoCode: appliedPromo ?? undefined,
      });
      cart.clear();
      toast(`ORDER PLACED — ${order.number}`);
      if (order.stripeSessionUrl && order.stripeSessionUrl.startsWith("http")) {
        window.location.href = order.stripeSessionUrl;
        return;
      }
      navigate({
        to: "/checkout/success/$id",
        params: { id: order.id },
        search: order.guestToken ? { token: order.guestToken } : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "ORDER FAILED");
      setSubmitting(false);
    }
  };

  if (productsError) {
    return (
      <div className="flex-1 flex items-center justify-center p-10">
        <ErrorState message="COULD NOT LOAD CHECKOUT DATA." onRetry={() => void refetch()} />
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
            autoComplete="name"
          />
          <Field
            label="EMAIL"
            type="email"
            value={customer.email}
            onChange={(v) => set("email", v)}
            error={touched.email ? errors.email : undefined}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            maxLength={120}
            autoComplete="email"
            inputMode="email"
          />
          <Field
            label="ADDRESS"
            value={customer.address}
            onChange={(v) => set("address", v)}
            error={touched.address ? errors.address : undefined}
            onBlur={() => setTouched((t) => ({ ...t, address: true }))}
            maxLength={200}
            autoComplete="street-address"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="CITY"
              value={customer.city}
              onChange={(v) => set("city", v)}
              error={touched.city ? errors.city : undefined}
              onBlur={() => setTouched((t) => ({ ...t, city: true }))}
              maxLength={80}
              autoComplete="address-level2"
            />
            <Field
              label="POSTAL"
              value={customer.postalCode}
              onChange={(v) => set("postalCode", v)}
              error={touched.postalCode ? errors.postalCode : undefined}
              onBlur={() => setTouched((t) => ({ ...t, postalCode: true }))}
              maxLength={20}
              autoComplete="postal-code"
            />
          </div>
          <Field
            label="COUNTRY (2)"
            value={customer.country}
            onChange={(v) => set("country", v.toUpperCase())}
            error={touched.country ? errors.country : undefined}
            onBlur={() => setTouched((t) => ({ ...t, country: true }))}
            maxLength={2}
            autoComplete="country"
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
            className="bg-buy text-white py-4 rounded-btn border-2 border-ink shadow-arcade arcade-btn-active disabled:bg-muted disabled:shadow-none disabled:cursor-not-allowed font-bold transition-all min-h-[48px]"
            style={{ fontFamily: "var(--font-arcade)", fontSize: 14, letterSpacing: 2 }}
          >
            {submitting ? "PROCESSING ORDER..." : "PLACE ORDER →"}
          </button>
        </form>

        <aside
          className="border-2 border-ink rounded-card p-5 bg-cream shadow-arcade h-fit flex flex-col gap-3 md:sticky md:top-20"
          style={{ fontFamily: "var(--font-arcade)", fontSize: 10 }}
        >
          <div className="flex items-center justify-between border-b-2 border-ink pb-2">
            <h2 style={{ fontSize: 12, letterSpacing: 2 }} className="font-bold">
              ★ ORDER SUMMARY
            </h2>
            <span className="text-[9px] text-muted font-bold">{items.length} ITEMS</span>
          </div>
          <ul className="flex flex-col gap-2">
            {items.map((it) => (
              <li
                key={`${it.productId}-${it.size}`}
                className="flex justify-between items-center text-[10px]"
              >
                <span className="truncate max-w-[200px]">
                  {it.product.name} ×{it.qty} <span className="text-muted">({it.size})</span>
                </span>
                <span className="font-bold">{formatPrice(it.lineTotalCents)}</span>
              </li>
            ))}
          </ul>
          {totals && (
            <div className="border-t-2 border-ink border-dashed pt-3 flex flex-col gap-1.5">
              <Row label="SUBTOTAL" value={formatPrice(totals.subtotalCents)} />
              {totals.discountCents ? (
                <Row
                  label={`ARCADE DISCOUNT (${appliedPromo === "RUNNER15" ? "15" : appliedPromo === "CHAMP20" ? "20" : "10"}%)`}
                  value={`-${formatPrice(totals.discountCents)}`}
                />
              ) : null}
              <Row label="SHIPPING" value={formatPrice(totals.shippingCents)} />
              <div className="border-t border-ink border-dashed my-1" />
              <Row label="TOTAL" value={formatPrice(totals.totalCents)} bold />
            </div>
          )}

          <div className="border-t-2 border-ink pt-3 flex flex-col gap-2 mt-1">
            <span style={{ fontSize: 9, fontWeight: 700 }} className="text-muted tracking-wider">
              ARCADE CHEAT CODE
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="E.G. COIN10 / KONAMI"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="flex-1 border-2 border-ink rounded-btn px-3 py-2 bg-white text-ink text-sm uppercase shadow-arcade-sm focus:outline-hidden"
                style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700 }}
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                className="px-4 py-2 bg-ink text-cream rounded-btn border-2 border-ink shadow-arcade-sm arcade-btn-active font-bold hover:bg-marquee hover:text-ink transition-colors"
                style={{ fontSize: 10 }}
              >
                APPLY
              </button>
            </div>
          </div>
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
  autoComplete,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  type?: string;
  maxLength?: number;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span style={{ fontFamily: "var(--font-arcade)", fontSize: 10, fontWeight: 700 }}>
        {label}
      </span>
      <input
        required
        type={type}
        value={value}
        maxLength={maxLength}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`border-2 rounded-btn px-3 py-2.5 bg-white text-ink transition-colors focus:outline-hidden focus:border-ink shadow-arcade-sm ${
          error ? "border-destructive bg-destructive/5" : "border-ink"
        }`}
        style={{ fontFamily: "var(--font-sans)", fontSize: 15 }}
      />
      {error && (
        <span
          style={{ fontFamily: "var(--font-arcade)", fontSize: 9 }}
          className="text-destructive font-bold"
        >
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
