# Deployment Guide: Franky's Arcade Studio

Hướng dẫn triển khai **Franky's Arcade Studio** lên **Vercel** (Production).

---

## 1. Yêu cầu & Chuẩn bị
- Repository GitHub: `https://github.com/hthmkt12/franky-s-arcade-studio.git` (đã cập nhật nhánh `main`).
- Tài khoản [Vercel](https://vercel.com).
- Tài khoản [Supabase](https://supabase.com) (Database + Auth).
- Tài khoản [Stripe](https://stripe.com) (Thanh toán).

---

## 2. Các bước triển khai lên Vercel (1-Click Git Integration)

1. **Đăng nhập Vercel** ➔ Chọn **Add New...** ➔ **Project**.
2. **Import Git Repository**: Chọn repo `hthmkt12/franky-s-arcade-studio`.
3. **Cấu hình Framework & Build**:
   - **Framework Preset**: Chọn `Vite` (hoặc `Other`).
   - **Build Command**: `npm run build`
   - **Output Directory**: `.output` (hoặc mặc định của Nitro/Vinxi cho TanStack Start).
   - **Install Command**: `npm install`
4. **Cấu hình Environment Variables (Biến môi trường)**:
   Thêm toàn bộ các biến sau vào mục **Environment Variables** trên Vercel:

   | Tên Biến | Giá trị / Ý nghĩa |
   | :--- | :--- |
   | `SUPABASE_URL` | URL project Supabase (`https://<project-ref>.supabase.co`) |
   | `SUPABASE_PUBLISHABLE_KEY` | Supabase Anon/Publishable Key |
   | `SUPABASE_PROJECT_ID` | Project ID Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (dùng cho server HMAC & Admin) |
   | `VITE_SUPABASE_URL` | Giống `SUPABASE_URL` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Giống `SUPABASE_PUBLISHABLE_KEY` |
   | `VITE_SUPABASE_PROJECT_ID` | Giống `SUPABASE_PROJECT_ID` |
   | `STRIPE_SECRET_KEY` | Stripe Secret Key (`sk_live_...` hoặc `sk_test_...`) |
   | `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Signing Secret (`whsec_...`) |

5. **Bấm Deploy**: Chờ Vercel hoàn tất quá trình build và khởi chạy.

---

## 3. Cấu hình Stripe Webhook trên Production

Sau khi có Domain trên Vercel (ví dụ `https://frankys-arcade.vercel.app`):
1. Vào **Stripe Dashboard** ➔ **Developers** ➔ **Webhooks**.
2. Chọn **Add endpoint**:
   - **Endpoint URL**: `https://<your-domain>/api/webhooks/stripe`
   - **Select events**: `checkout.session.completed`
3. Lấy **Signing secret** (`whsec_...`) và điền vào biến `STRIPE_WEBHOOK_SECRET` trên Vercel.

---

## 4. Kiểm tra sau khi Deploy
- [ ] Mở trang chủ, kiểm tra âm thanh chiptune 8-bit và click thử nút `INSERT COIN`.
- [ ] Thêm sản phẩm vào giỏ hàng, điền thông tin và áp mã `COIN10`.
- [ ] Thử nghiệm đặt đơn hàng ➔ xác nhận receipt hiển thị đúng và URL chứa token HMAC an toàn.
