# Deployment Guide: Franky's Arcade Studio

Hướng dẫn triển khai **Franky's Arcade Studio** lên **Vercel** (Production), bán hàng tiền thật.

---

## 1. Yêu cầu & Chuẩn bị
- Repository GitHub: `https://github.com/hthmkt12/franky-s-arcade-studio.git` (nhánh `main`).
- Tài khoản [Vercel](https://vercel.com) (Hobby, miễn phí).
- Supabase hiện tại: project `atltdcdjwnweuptvxadz` (do Lovable quản lý, trên `lovable.cloud`) — **tái sử dụng**, không tạo mới.
- Tài khoản [Stripe](https://stripe.com) (Test → Live).
- **Email production: BỎ QUA** (không có domain riêng). Khi thiếu `RESEND_API_KEY`, email chỉ log ra console — đơn vẫn hoàn tất bình thường.

---

## 2. Cấu hình deploy đã có trong code (không cần sửa)
- **Nitro preset = `vercel`** đã hard-pin trong `vite.config.ts` (`nitro: { preset: "vercel" }`) — override preset `cloudflare-module` mặc định từ `@lovable.dev/vite-tanstack-config`. Build sẽ xuất ra `.vercel/output`.
- Stripe **fail-closed**: khi thiếu `STRIPE_SECRET_KEY` ở production, checkout ném lỗi — không bao giờ chạy "simulated checkout" khi bán thật.
- Email **log-only**: `email.server.ts` tự fallback console khi thiếu `RESEND_API_KEY`; `orders.ts` và webhook bọc try/catch — email lỗi không làm hỏng đơn hàng.

---

## 3. Các bước triển khai lên Vercel

1. **Commit + push** toàn bộ thay đổi lên `main`. Kiểm tra:
   - `git ls-files | findstr /i "^.env$"` → KHÔNG được có `.env` trong git.
   - `.env.example` không chứa `SUPABASE_SERVICE_ROLE_KEY` có giá trị.
2. **Đăng nhập Vercel** ➔ **Add New...** ➔ **Project** ➔ import repo `hthmkt12/franky-s-arcade-studio`.
3. **Framework Preset**: để Vercel auto-detect (Vite/Nitro). Build Command: `npm run build`. Output Directory: không cần set (Nitro `vercel` preset tự xuất `.vercel/output`).
4. **Environment Variables** — set đủ **9 biến** (Production):

   | Tên Biến | Giá trị |
   | :--- | :--- |
   | `SUPABASE_URL` | `https://<project-ref>.supabase.co` (hoặc URL lovable.cloud hiện tại) |
   | `SUPABASE_PUBLISHABLE_KEY` | Supabase Anon/Publishable Key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (server-only, KHÔNG commit) |
   | `VITE_SUPABASE_URL` | Giống `SUPABASE_URL` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Giống `SUPABASE_PUBLISHABLE_KEY` |
   | `STRIPE_SECRET_KEY` | Stripe Secret Key (`sk_test_...` trước, `sk_live_...` sau) — tên BẮT BUỘC có `_KEY` |
   | `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Signing Secret (`whsec_...`) |
   | `RESEND_API_KEY` | (Bỏ trống — đã quyết bỏ email production) |
   | `VITE_APP_URL` | `https://<your-project>.vercel.app` |

   Lưu ý: cả cặp `SUPABASE_*` (server, `process.env`) lẫn cặp `VITE_SUPABASE_*` (client, `import.meta.env`) đều bắt buộc.
5. **Bấm Deploy**. Sau khi có URL, đặt `VITE_APP_URL` = URL thật rồi **redeploy**.

---

## 4. Stripe: Test-mode trước, rồi Live

### Test mode
1. Stripe Dashboard ➔ **Developers** ➔ **API keys**: copy `sk_test_...` → set `STRIPE_SECRET_KEY` trên Vercel.
2. **Developers** ➔ **Webhooks** ➔ **Add endpoint**:
   - **Endpoint URL**: `https://<your-project>.vercel.app/api/webhooks/stripe`
   - **Select events**: `checkout.session.completed`
   - Copy **Signing secret** (`whsec_...`) → set `STRIPE_WEBHOOK_SECRET` trên Vercel → redeploy.
3. E2E: đặt 1 đơn trên site → thanh toán bằng card test `4242 4242 4242 4242` → kiểm tra order chuyển sang `paid` trong Supabase ≤60s và receipt hiển thị đúng.

### Live mode
1. Stripe Dashboard ➔ **Activate account** (KYC: định danh + tài khoản ngân hàng).
2. Đổi `STRIPE_SECRET_KEY` = `sk_live_...`; tạo **webhook endpoint mới** (hoặc đổi URL) trỏ cùng URL với signing secret live.
3. E2E thật: đặt đơn nhỏ nhất → thanh toán tiền thật → xác nhận tiền vào Stripe balance, order `paid` ≤60s → **refund** đơn test.

---

## 5. Kiểm tra sau khi Deploy
- [ ] `/`, `/shop`, `/checkout` trả 200; không lỗi 500 trong Vercel function logs.
- [ ] `/robots.txt` và `/sitemap.xml` dùng `VITE_APP_URL` thật (không phải `localhost:3000`).
- [ ] `/api/checkout` trả Stripe session thật (không phải `sim_cs_...`).
- [ ] Stripe webhook: event `checkout.session.completed` → order `paid` ≤60s; gửi trùng event là no-op.
- [ ] Không có secret nào trong git (`git ls-files`).

---

## 6. Vận hành
- **Backup DB định kỳ** (DB hiện do Lovable quản lý): `supabase db dump` → lưu ngoài repo.
- **Theo dõi 7 ngày đầu**: Vercel → Functions → logs, tìm 500/exception.
- Nếu sau này có domain: mua domain (~10-15$/năm) + verify trong Resend → set `RESEND_API_KEY` và đổi `VITE_APP_URL` → bật lại email production.
- Nếu Lovable ngừng project: chuyển sang Supabase tự quản + migrate dữ liệu (viết seed script từ DB cũ).
