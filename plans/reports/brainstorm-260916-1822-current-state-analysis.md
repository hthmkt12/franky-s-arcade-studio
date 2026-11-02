# Báo Cáo Phân Tích Hiện Trạng & Đề Xuất Phương Án Phát Triển

**Dự án:** Franky's Arcade Studio  
**Ngày:** 16/09/2026  
**Trạng thái:** Hoàn thành kiểm toán toàn diện

---

## 1. Tổng Quan Hiện Trạng Dự Án

Franky's Arcade Studio là ứng dụng thương mại điện tử phong cách retro-arcade (kết hợp arcade 1990s và skate shop culture). Dự án đang ở giai đoạn hoàn thiện core funnel và đã tích hợp các tính năng thương mại cốt lõi.

### 1.1. Kiến Trúc & Công Nghệ

- **Framework:** TanStack Start (SSR với Nitro preset Vercel), TanStack Router (file-based routing trong `src/routes/`), TanStack Query v5.
- **Frontend & UI:** React 19, Tailwind CSS v4 (`@tailwindcss/vite`), Neo-brutalism design system (`src/styles.css`).
- **3D & Audio:** Three.js procedural beanie mesh viewer (`src/components/frankys/Cap3DViewer.tsx`), Web Audio API oscillator synthesizer (`src/lib/audio/arcade-audio.ts`) không dùng file audio ngoài.
- **Backend & Database:** Supabase PostgreSQL, Row Level Security (RLS), atomic stored procedure `create_order_tx` kiểm soát tồn kho chống overselling.
- **Thanh toán & Giao dịch:** Stripe Checkout Sessions & Stripe Webhooks HMAC verification, bảng `stripe_events` chống duplicate/replay attack.
- **Email & Notification:** Resend SDK gửi email xác nhận đơn hàng (`src/lib/email.server.ts`), fallback an toàn khi thiếu key.

### 1.2. Đánh Giá Bảo Mật & Độ Tin Cậy

- **Token Guest Order:** Ký HMAC-SHA256 (`src/lib/server-crypto.ts`), so sánh an toàn `crypto.timingSafeEqual`, fail-closed khi thiếu key trong môi trường production.
- **Bảo toàn Giá:** Endpoint `POST /api/orders` re-fetch toàn bộ giá sản phẩm từ Supabase, không tin tưởng giá client gửi lên.
- **Chống Brute Force:** Rate limiter in-memory sliding window (`src/lib/rate-limit.server.ts`) giới hạn 10 checkout/phút/IP.
- **Kiểm thử tự động:** 33/33 unit tests pass (`vitest run`) bao phủ crypto, shipping progress, rate limit, webhook signature, leaderboard validation.

### 1.3. Các Vấn Đề & Điểm Nghẽn Kỹ Thuật (Issues & Bottlenecks)

1. **ESLint / Prettier CRLF Line Ending Mismatch:**
   - Lệnh `npm run lint` bị fail do quy tắc `prettier/prettier` yêu cầu `Delete ␍`. Thiếu cấu hình `"endOfLine": "auto"` trong `.prettierrc`.
   - Cảnh báo Fast Refresh: `ArModal.tsx` và `CartContext.tsx` xuất cả components và functions/constants (`react-refresh/only-export-components`).
2. **Kích Thước Bundle Lớn (>500 kB):**
   - Chunk Three.js (`Cap3DViewer`): 471.86 kB (gzip 118.91 kB).
   - Chunk vendor/app index: 655.51 kB (gzip 193.49 kB). Cần tách manual chunks hoặc lazy loading Three.js.
3. **Lỗi UI/UX & Design System (Audit từ Agent):**
   - **Chưa load Google Fonts:** Dự án dùng font `Press Start 2P` và `VT323` trong CSS nhưng thiếu link nạp font từ Google Fonts hoặc local font file, khiến giao diện fallback về monospace thường trên các thiết bị chưa cài font.
   - **Bẫy cuộn `touch-none` trên Mobile:** `Cap3DViewer.tsx` dùng `touch-none` trên canvas khiến người dùng mobile vuốt trúng vùng 3D bị chặn scroll toàn trang. Thiếu fallback an toàn khi thiết bị không hỗ trợ WebGL.
   - **Touch Target < 44px:** Nút đổi tiền tệ (h-10) và một số nút đóng modal (w-8 h-8) dưới chuẩn 44x44px của WCAG.
4. **Chưa có E2E Test tự động cho luồng thanh toán:**
   - Đã có unit test mock Stripe và Webhook, nhưng chưa có Playwright E2E test cho toàn bộ hành trình giỏ hàng -> checkout -> success.
5. **Phụ thuộc Client Storage cho Giỏ hàng & Cheat Code:**
   - Promo codes (`COIN10`, `RUNNER15`, `CHAMP20`) lưu trên `localStorage`. Cần kiểm tra chặt chẽ hạn mức và tính hợp lệ trên server để tránh lạm dụng mã giảm giá.

---

## 2. So Sánh Các Phương Án Phát Triển

| Tiêu chí              | Phương Án 1: Stabilization & Production Hardening (Khuyên dùng)                  | Phương Án 2: Conversion & Retention Scaling                                 | Phương Án 3: Deep Gamification & Arcade Ecosystem                      |
| :-------------------- | :------------------------------------------------------------------------------- | :-------------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| **Mục tiêu chính**    | Ổn định 100% CI/CD, tối ưu bundle, vá lỗi lint/CRLF, hoàn thiện test E2E         | Tăng AOV (Average Order Value) và tỷ lệ chốt đơn (CR), email abandoned cart | Mở rộng mini-game, hệ thống huy hiệu NFT/Token, bảng xếp hạng toàn cầu |
| **Phạm vi kỹ thuật**  | Tách chunk Three.js, sửa `.prettierrc`, tách helper khỏi context, thêm E2E suite | Thêm bundle discount (mua kèm pin/tote), luồng khôi phục giỏ hàng bỏ quên   | Xây dựng backend real-time game room, bảng xếp hạng Supabase Realtime  |
| **Ưu điểm**           | Nền tảng vững chắc, sẵn sàng deploy production, zero warning/error               | Tăng trưởng doanh thu trực tiếp, tận dụng data người dùng                   | Thu hút traffic viral, tăng time-on-site                               |
| **Nhược điểm**        | Chưa tạo thêm tính năng bán hàng mới                                             | Cần thiết lập cấu hình cron job và mẫu email mới                            | Chi phí server cao, phân tán nguồn lực khỏi core funnel                |
| **Rủi ro / Điểm gãy** | Thấp nhất. Dễ rollback                                                           | Rủi ro spam email nếu cron job tracking lỗi                                 | Phức tạp kiến trúc, nguy cơ gian lận điểm số game                      |

---

## 3. Đề Xuất Phương Án Tốt Nhất: Lộ Trình 2 Giai Đoạn (Hybrid Approach)

Kết hợp **Phương Án 1 (Cốt lõi ngay lập tức)** và chuyển tiếp sang **Phương Án 2 (Tăng trưởng doanh thu)**:

### Giai Đoạn 1: Dọn Dẹp Kỹ Thuật & Tối Ưu Hiệu Năng (Zero Debt)

1. **Sửa dứt điểm ESLint & Prettier:**
   - Cập nhật `.prettierrc`: thêm `"endOfLine": "auto"`.
   - Tách constants/helpers ra khỏi `CartContext.tsx` và `ArModal.tsx` để thỏa mãn rule `react-refresh/only-export-components`.
2. **Sửa lỗi Typography & Mobile UX:**
   - Nạp Google Fonts (`Press Start 2P`, `VT323`) qua `<link>` trong `src/routes/__root.tsx`.
   - Xử lý bẫy cuộn `touch-none` và thêm WebGL fallback cho `Cap3DViewer.tsx`.
   - Tăng touch targets lên tối thiểu 44x44px trên mobile (`Header.tsx`, modals).
3. **Tối ưu Bundle Chunks:**
   - Cấu hình `build.rollupOptions.output.manualChunks` trong `vite.config.ts` để bóc tách `three` ra vendor chunk riêng.
   - Dynamic `import()` cho `Cap3DViewer` để không chặn TTI (Time to Interactive) trên trang chủ mobile.
4. **Bổ sung E2E Testing:**
   - Tích hợp test suite Playwright mô phỏng luồng khách hàng từ thêm mũ vào giỏ -> áp mã giảm giá -> guest checkout.

### Giai Đoạn 2: Tối Ưu Chuyển Đổi & Doanh Thu (Growth)

1. **Dynamic Bundle Discounts:**
   - Tự động áp dụng giảm thêm khi mua combo Cap + Pin hoặc Cap + Tote.
2. **Abandoned Cart Recovery:**
   - Thu thập email ngay bước đầu checkout và gửi email nhắc nhở sau 2 giờ nếu đơn chưa thanh toán.
3. **Global Arcade Leaderboard:**
   - Kết nối bảng điểm PixelRunner với Supabase RLS để tạo động lực chơi game săn voucher thật.

---

## 4. Acceptance Criteria (Tiêu Chuẩn Nghiệm Thu)

- [ ] `npm run lint` chạy thành công (0 errors, 0 warnings).
- [ ] `npm run test` vượt qua 100% tests.
- [ ] `npm run build` không còn cảnh báo chunk size vượt 500 kB.
- [ ] Toàn bộ UI giữ nguyên 100% phong cách Retro-Arcade theo `DESIGN.md`.
