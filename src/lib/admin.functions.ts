// Admin server functions. Every call runs through requireSupabaseAuth and
// queries with the caller's own token, so RLS ("admins only") is the real gate —
// these functions never use the service-role client for reads or writes.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const StatusSchema = z.enum(["pending", "paid", "shipped", "cancelled"]);

export const getAdminSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roles = (data ?? []).map((r) => r.role);
    return {
      userId: context.userId,
      email: (context.claims.email as string | undefined) ?? null,
      isAdmin: roles.includes("admin"),
    };
  });

/** Bootstrap: the very first signed-in account may claim admin. No-op after that. */
export const claimAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (error) throw new Error("Could not read roles");
    if ((count ?? 0) > 0) {
      return { granted: false as const, reason: "An admin already exists" };
    }
    const { error: insErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (insErr) throw new Error("Could not grant admin");
    return { granted: true as const, reason: null };
  });

export const listOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: orders, error } = await context.supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error("Could not read orders");

    const ids = (orders ?? []).map((o) => o.id);
    const { data: items } = ids.length
      ? await context.supabase.from("order_items").select("*").in("order_id", ids)
      : { data: [] as never[] };

    return (orders ?? []).map((o) => ({
      id: o.id,
      number: o.number,
      status: o.status,
      createdAt: o.created_at,
      currency: o.currency,
      totalCents: o.total_cents,
      customerName: o.customer_name,
      customerEmail: o.customer_email,
      city: o.city,
      country: o.country,
      trackingNumber: o.tracking_number ?? null,
      carrier: o.carrier ?? null,
      shippedAt: o.shipped_at ?? null,
      items: (items ?? [])
        .filter((i) => i.order_id === o.id)
        .map((i) => ({
          id: i.id,
          name: i.product_name,
          size: i.size,
          qty: i.qty,
          unitPriceCents: i.unit_price_cents,
        })),
    }));
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      status: StatusSchema,
      trackingNumber: z.string().optional(),
      carrier: z.string().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const updatePayload: Record<string, unknown> = { status: data.status };
    if (data.status === "shipped") {
      updatePayload.tracking_number = data.trackingNumber ?? null;
      updatePayload.carrier = data.carrier ?? "CTT Express";
      updatePayload.shipped_at = new Date().toISOString();
    }

    const { data: row, error } = await context.supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", data.id)
      .select("id, number, status, customer_name, customer_email, tracking_number, carrier")
      .maybeSingle();

    if (error) throw new Error("Could not update order");
    if (!row) throw new Error("Order not found or not permitted");

    // Dispatch shipped email when order is marked shipped and tracking is present
    if (data.status === "shipped" && row.tracking_number && row.customer_email) {
      import("@/lib/email.server").then(({ sendOrderShippedEmail }) => {
        const { signOrderToken } = require("@/lib/server-crypto");
        const guestToken = signOrderToken(row.id, row.customer_email);
        const origin = process.env.VITE_APP_URL || "https://frankys.lovable.app";
        const trackingUrl = `${origin}/checkout/success/${row.id}?token=${guestToken}`;

        void sendOrderShippedEmail({
          to: row.customer_email,
          customerName: row.customer_name,
          orderNumber: row.number,
          trackingNumber: row.tracking_number!,
          carrier: row.carrier || "CTT Express",
          trackingUrl,
        });
      }).catch((err) => console.error("[Admin Order Dispatch Error]", err));
    }

    return row;
  });

export const listStock = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("products")
      .select("id, name, slug, stock_qty, in_stock, price_cents, currency")
      .order("sort_order");
    if (error) throw new Error("Could not read products");
    return (data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      stockQty: p.stock_qty,
      inStock: p.in_stock,
      priceCents: p.price_cents,
      currency: p.currency,
    }));
  });

export const updateStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid(), stockQty: z.number().int().min(0).max(9999) }))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("products")
      .update({ stock_qty: data.stockQty, in_stock: data.stockQty > 0 })
      .eq("id", data.id)
      .select("id, stock_qty, in_stock")
      .maybeSingle();
    if (error) throw new Error("Could not update stock");
    if (!row) throw new Error("Product not found or not permitted");
    return row;
  });
