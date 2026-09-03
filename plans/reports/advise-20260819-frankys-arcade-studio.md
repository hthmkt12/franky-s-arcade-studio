# Technical Advisory Report: Franky's Arcade Studio Evolution

**Date:** 2026-08-19  
**Status:** Accepted & Ready for Implementation Planning  
**Target:** Franky's Arcade Studio (`frankys-arcade-studio`)

---

## 1. Verdict

Franky's Arcade Studio sở hữu visual identity độc đáo (retro arcade-skate 1990s) và nền tảng công nghệ hiện đại (TanStack Start + Supabase + React 19). Tuy nhiên, hiện tại dự án đang ở trạng thái **nửa vời**: giao diện rất ấn tượng nhưng luồng thương mại điện tử chưa thể thu tiền thật (thiếu Stripe, thiếu webhook), bảo mật lộ dữ liệu PII khách qua order ID, và tính "Arcade" mới chỉ dừng ở mặt đồ họa tĩnh (thiếu âm thanh và tương tác vật lý).

Định hướng **Cân bằng Thực dụng (E-Commerce + Arcade Immersion)** là quyết định chính xác: hoàn thiện khả năng vận hành thanh toán thực tế đồng thời kích hoạt linh hồn game 8-bit bằng Web Audio API không tốn dung lượng tải trang.

---

## 2. Reframed Requirements & Scope

### A. Mục tiêu cốt lõi (Core Goals)

1. **Hoàn thiện thanh toán**: Tích hợp Stripe Checkout / Payment Intents cho thị trường quốc tế (EUR/USD) với Webhook tự động cập nhật trạng thái đơn hàng trong Supabase từ `pending` sang `paid`.
2. **Bảo mật PII & Authorization**: Khóa endpoint `GET /api/orders/$id` bằng HMAC Guest Access Token được tạo khi đặt hàng, ngăn chặn tấn công quét order UUID để lấy cắp thông tin cá nhân khách hàng.
3. **Chuẩn hóa UI/UX & WCAG AA**: Phân tách typography rõ ràng (dùng `Press Start 2P` cho Tiêu đề/Nút bấm, dùng `VT323` cho đoạn văn), sửa lỗi tương phản màu `#737373` và nút camera, mở rộng hit-target mobile lên 44px.
4. **Arcade Audio & Gamification**: Tạo Web Audio 8-bit Synthesizer (tiếng coin insert, click beep, add-to-cart jingle, purchase fanfare) với nút Mute/Unmute trên Header, và slot "INSERT COIN" thả xu nhận mã giảm giá Easter Egg.

### B. Non-Goals (Ngoài phạm vi giai đoạn này)

- Chưa dựng 3D WebGL Mesh phức tạp với Three.js (giữ nguyên AR/3D 2D projection hiện tại để tối ưu bundle size).
- Chưa làm hệ thống đăng ký tài khoản khách hàng (giữ Guest Checkout nhanh gọn).
- Chưa xây dựng mini-game độc lập nhiều màn chơi (chỉ làm tương tác Coin Drop & Easter egg discount).

---

## 3. What You Should Do (Hành động Cần Làm)

1. **Bảo mật & Server Route Hardening**:
   - Thêm HMAC Signature/Secret vào Order Payload khi tạo đơn (`createOrder`).
   - Cập nhật `GET /api/orders/$id` yêu cầu verify HMAC header/query token trước khi trả về dữ liệu PII.
   - Thêm Turnstile / Rate Limiting nhẹ trên `POST /api/orders` chống spam cạn kiệt tồn kho.
2. **Tích hợp Cổng thanh toán Stripe**:
   - Cài đặt `@stripe/stripe-js` và `stripe` SDK phía server.
   - Viết API endpoint tạo Stripe Checkout Session / Payment Intent.
   - Viết webhook handler `POST /api/webhooks/stripe` xử lý sự kiện `checkout.session.completed` để cập nhật `status = 'paid'` trong Supabase `orders`.
3. **Tối ưu Typography & Accessibility**:
   - Chỉnh sửa `src/styles.css`: bỏ `font-family: var(--font-arcade)` trên thẻ `body`, thay bằng font `VT323` hoặc font monospace dễ đọc cho text dài.
   - Tăng độ tương phản `--muted` từ `#737373` lên `#525252`.
   - Sửa text nút `RETRY CAMERA` trong `ArModal.tsx` thành `text-ink`.
   - Thêm padding vô hình hoặc class touch target cho nút tăng giảm số lượng trong `CartDrawer.tsx`.
4. **Web Audio 8-Bit Chiptune Engine**:
   - Viết module gọn nhẹ `src/lib/audio/arcade-audio.ts` sử dụng native `AudioContext` với các dạng sóng `square` và `triangle` (tạo âm thanh retro mà không cần tải bất kỳ file mp3/wav nào).
   - Gắn âm thanh vào các sự kiện: Click nút, Đổi màu mũ, Thêm giỏ hàng, Mở giỏ hàng, Thanh toán thành công.
   - Thêm nút Toggle Âm thanh (Loa bật/tắt phong cách 8-bit) trên `Header.tsx` và lưu preference vào `localStorage`.
5. **Interactive Coin Slot & Cheat Code**:
   - Biến nút "INSERT COIN" trên Hero thành hoạt ảnh thả đồng xu (coin drop animation).
   - Thả xu thành công sẽ phát âm thanh 8-bit "1-UP" và tự động điền mã giảm giá `COIN10` vào giỏ hàng.

---

## 4. What You Shouldn't Do (Những việc Cần Tránh)

- **Không nhồi nhét file âm thanh MP3/WAV dung lượng lớn**: Sẽ làm chậm tốc độ tải trang và gây giật lag khi phát nhiều hiệu ứng liên tục. Phải dùng Web Audio oscillator.
- **Không ép người dùng đăng ký tài khoản để mua hàng**: Trải nghiệm Arcade cần "Insert Coin & Go", ép đăng nhập sẽ giảm tỉ lệ chuyển đổi checkout.
- **Không lạm dụng font pixel cho toàn bộ văn bản**: Font `Press Start 2P` ở kích thước nhỏ hoặc đoạn dài gây mỏi mắt nghiêm trọng cho người dùng.

---

## 5. Work Checklist & Success Metrics

### Work Checklist

- [ ] `src/lib/audio/arcade-audio.ts`: Tạo Web Audio synth (bip, coin, add, win) + hook `useArcadeAudio()`.
- [ ] `src/components/frankys/Header.tsx`: Thêm nút toggle âm thanh SFX (Mute/Unmute).
- [ ] `src/styles.css` & `src/components/frankys/ArModal.tsx`: Chỉnh typography toàn trang, tăng contrast WCAG AA, chỉnh hit-target mobile 44px.
- [ ] `src/routes/api/orders.ts` & `src/routes/api/orders.$id.ts`: Thêm HMAC token xác thực quyền truy cập receipt đơn hàng.
- [ ] `src/lib/stripe/`: Tích hợp Stripe Checkout session server function & webhook đồng bộ Supabase.
- [ ] `src/routes/checkout.tsx`: Thêm ô nhập mã giảm giá (Cheat Code) và chuyển hướng tới Stripe Checkout.
- [ ] `src/routes/index.tsx`: Thêm tương tác Click Coin Slot nhận mã giảm giá Easter Egg.

### Success Metrics

1. **Lighthouse Accessibility Score**: Đạt **≥ 98/100** (không còn cảnh báo tương phản hay touch-target).
2. **Audio Performance**: Bundle size audio tăng **0 KB** (hoàn toàn thuần Web Audio API), độ trễ âm thanh **< 10ms**.
3. **Security Audit**: Thử gọi `GET /api/orders/<uuid>` không kèm token phải trả về HTTP `401/403`.
4. **End-to-End Checkout**: Hoàn tất 1 luồng mua hàng qua Stripe Test Mode -> webhook kích hoạt -> trạng thái đơn hàng chuyển sang `paid` trong Supabase -> trang cảm ơn hiển thị đúng thông tin.
