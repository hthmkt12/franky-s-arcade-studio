# Kế hoạch hoàn thiện Franky's Hat Shop

## Hiện trạng (đã có)
- **Design system** đúng token refero: cream #f3e5df, ink, pixel border #e5e7eb, marquee #faa21f, buy #128e44, radius 6/12/9999, Press Start 2P + VT323.
- **UI shop end-to-end** trên `/`: hero trái + 4 variant, cart drawer, checkout modal, 5 sản phẩm mũ (ảnh generated).
- **API layer** tách bạch trong `src/lib/api/` (types.ts, client.ts, shop.ts) — hiện mock, mọi hàm đã có sẵn dòng `apiFetch(...)` comment để đổi 1 dòng.
- **Cart context** với localStorage persistence.

## Còn thiếu để "hoàn thiện dự án"
1. Tất cả trên 1 route `/` → không SEO-able, không share được /product/xxx.
2. Không có backend thật — order gửi đi mất, không có tồn kho, không có admin.
3. Chưa có: trang chi tiết sản phẩm, trang order thành công, trang about/shipping, trang 404.
4. Chưa có auth admin, chưa có DB schema, chưa có server routes /api/*.
5. UX gaps: chưa có toast "added to cart", chưa có loading skeleton, chưa có empty state cho shop, cart chưa nhớ mở/đóng qua reload, chưa có mobile menu thật, chưa có form validation inline.

---

## Plan (chia 4 phase, ship được sau mỗi phase)

### Phase 1 — Kiến trúc route + polish UX (frontend-only, không cần backend)
Tách trang, thêm state feedback, chuẩn SEO cho từng route. Vẫn dùng mock API.

**Routes mới:**
```
src/routes/
  index.tsx              → landing: marquee + hero mascot + "SHOP NOW"
  shop.tsx               → grid tất cả mũ (thay UI shop hiện tại ở /)
  shop.$slug.tsx         → chi tiết 1 mũ: ảnh lớn + variants + size + add-to-cart
  cart.tsx               → cart full page (drawer vẫn giữ cho quick view)
  checkout.tsx           → form checkout full page
  checkout.success.$id.tsx → confirmation (số đơn, tổng, mail đã gửi)
  about.tsx              → story arcade + shipping + contact
  $.tsx                  → 404 arcade "GAME OVER — INSERT COIN"
```
Mỗi route có `head()` riêng với title/description/og:*. Root layout dùng chung header + top/bottom marquee + `<CartProvider>`.

**UX polish:**
- `sonner` toast khi add/remove cart (đã có sẵn shadcn).
- Loading skeleton cho grid + product page.
- Inline field validation ở checkout (email, postal code theo country).
- Mobile hamburger menu mở drawer nav thật.
- `<Link>` preload trên hover cho tất cả nav.
- Route errorComponent + notFoundComponent + defaultErrorComponent ở router.

### Phase 2 — Backend thật (Lovable Cloud)
Bật Cloud → tự động có Postgres + Auth + Storage.

**DB schema (migration):**
```
products (id, slug, name, color_hex, price_cents, currency, description,
          materials text[], image_url, in_stock, sort_order, created_at)
product_sizes (product_id, size, stock_qty)          -- tồn kho theo size
orders (id, number, email, name, address, city, postal_code, country,
        subtotal_cents, shipping_cents, total_cents, currency,
        status, created_at)
order_items (order_id, product_id, size, qty, unit_price_cents)
user_roles (user_id, role app_role)                  -- pattern chuẩn
```
Kèm GRANT + RLS:
- `products`, `product_sizes`: SELECT cho anon (public catalog).
- `orders`, `order_items`: INSERT cho anon (guest checkout); SELECT chỉ admin (`has_role(auth.uid(),'admin')`).
- `user_roles`: SELECT authenticated, dùng `has_role` security definer.

**Server layer:**
- Server functions (`src/lib/*.functions.ts`) cho: `listProducts`, `getProductBySlug`, `createOrder` (validate Zod, tính tổng server-side chống tamper, giảm tồn kho trong transaction).
- Client `src/lib/api/shop.ts` đổi từ mock sang gọi server functions — signature giữ nguyên, UI không đổi.
- Seed 5 mũ hiện tại qua migration.

### Phase 3 — Admin + email
- Route `/_authenticated/admin` (auth gate) gồm:
  - Bảng orders (filter theo status, mark paid/shipped).
  - Bảng products + edit tồn kho theo size.
- Sign in bằng email/password của Cloud Auth; user đầu tiên tự grant `admin` qua migration (hoặc UI whitelist theo email).
- Email đơn hàng: dùng Lovable AI Gateway hoặc Resend qua server function `sendOrderEmail` (gửi cho khách + admin).

### Phase 4 — Payments + production polish
- Stripe Checkout qua server function `createCheckoutSession` (redirect flow, không cần PCI).
- Webhook `/api/public/stripe-webhook` verify signature → cập nhật `orders.status = paid`.
- Structured data JSON-LD `Product` + `Offer` cho SEO.
- Sitemap.xml + robots.txt qua server route.
- Publish.

---

## Chi tiết kỹ thuật (phần cho dev)

**Cart persistence:** giữ `frankys.cart.v1` localStorage; khi user login (Phase 3+) merge với `cart_lines` server-side.

**Contract API sau Phase 2** (server functions, không phải REST):
```ts
listProducts(): Product[]
getProductBySlug(slug): Product | null
createOrder(draft: OrderDraft): Order   // server tính lại totals, kiểm tồn kho
listOrders(): Order[]                    // admin only, requireSupabaseAuth + has_role
updateOrderStatus(id, status): Order     // admin only
```
`src/lib/api/types.ts` đã match — không đổi.

**Router config bổ sung:**
- `defaultErrorComponent` arcade style ở `src/router.tsx`.
- Mỗi route loader: `queryClient.ensureQueryData(productsQuery)` + `useSuspenseQuery` trong component.

**File thay đổi Phase 1:**
- Tạo: `shop.tsx`, `shop.$slug.tsx`, `cart.tsx`, `checkout.tsx`, `checkout.success.$id.tsx`, `about.tsx`, `$.tsx`.
- Refactor: `__root.tsx` (chung header/marquee/CartProvider), `index.tsx` (thu gọn thành landing).
- Tách components dùng chung: `src/components/frankys/{Header,Marquee,VariantCard,CartDrawer,PixelHorse}.tsx`.

---

## Đề xuất tiếp theo
Bắt đầu Phase 1 ngay (không cần bật gì, không cần key). Sau khi bạn duyệt Phase 1 xong sẽ hỏi trước khi bật Lovable Cloud cho Phase 2. Bạn có muốn tôi làm luôn Phase 1 không, hay điều chỉnh phạm vi trước?
