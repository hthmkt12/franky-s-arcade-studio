# Báo Cáo Tư Vấn: Chuẩn Hóa DESIGN.md & Lộ Trình Nâng Cấp Toàn Diện UI/UX Cho Franky's Arcade Studio

## 1. Verdict (Đánh giá thực tế)

Franky's Arcade Studio có bộ nhận diện cốt lõi (bảng màu Cream, Ink, Marquee, Pixel font, 3D cap viewer) rất độc đáo, giàu cá tính nhưng chưa có Design System làm mỏ neo kỹ thuật. Việc tham khảo format `DESIGN.md` chuẩn 9 phần từ `VoltAgent/awesome-design-md` là nước đi chính xác để biến ngôn ngữ thiết kế từ cảm tính thành đặc tả chuẩn cho AI và con người cùng làm việc. Tuy nhiên, rủi ro lớn nhất là sa vào bẫy "SaaS hóa" hoặc "lạm dụng pixel font" khiến mobile không thể đọc nổi và tụt giảm tỷ lệ chuyển đổi giỏ hàng. Hướng đi **Retro-Arcade Polish + Hybrid Typography** giải quyết triệt để vấn đề thẩm mỹ lẫn thương mại.

---

## 2. Việc Nên Làm (What You Should Do)

1. **Tạo `DESIGN.md` SSoT ở thư mục gốc**: Tuân thủ chuẩn 9 phần của `awesome-design-md` (Theme, Color Tokens, Typography Hierarchy, Component Anatomy, Layout Grid, Elevation & Shadows, Do's & Don'ts, Responsive Rules, Agent Prompt Guide).
2. **Chuẩn hóa Design Tokens trong Tailwind CSS v4 (`src/styles.css`)**:
   - Khai báo rõ vai trò semantic: surface, surface-elevated, text-primary, text-muted, border-pixel, brand-accent, status-buy, status-danger.
   - Thêm token hard-shadow: `box-shadow: 4px 4px 0px 0px var(--ink)` (chữ ký của phong cách Neo-brutalism / Retro Arcade).
3. **Áp dụng Hybrid Typography**:
   - Desktop: Giữ `VT323` / `Press Start 2P` cho hero, headers, big numbers, badges.
   - Mobile & Text Body: Sử dụng font Sans hệ thống clean (Inter, SF Pro, System UI) cho form input, bảng chọn size, description chi tiết, shipping info trên mobile để giảm tải thị giác và tăng khả năng quét nội dung.
4. **Nâng cấp Component System theo thứ tự Core Funnel**:
   - **Header & Navigation**: Thêm badge giỏ hàng có animation pixel bounce khi add item, audio toggle trực quan hơn.
   - **Hero & 3D Cap Viewer**: Bổ sung indicator xoay 360°, fallback sang WebP tối ưu trên thiết bị yếu / low power mode.
   - **Catalog & Filter**: Thẻ sản phẩm với hard-border, quick-view, status badge (LIMITED, IN-STOCK).
   - **Cart Drawer & Checkout**: Layout tối giản ma sát, CTA buy to rõ, micro-copy arcade rõ ràng, tương thích chuẩn WCAG AA.
5. **Đồng bộ hóa Audio Feedback**: Giữ hiệu ứng âm thanh arcade khi tương tác nút bấm, nhưng có trạng thái tắt/mở ghi nhớ qua `localStorage`.

---

## 3. Việc Không Nên Làm (What You Shouldn't Do)

- **Không SaaS-hóa giao diện**: Không dùng góc bo lớn (`rounded-2xl`, `rounded-3xl`), không lạm dụng blur/glassmorphism mờ mịt làm mất chất arcade thô mộc.
- **Không ép dùng 100% pixel font cho toàn bộ checkout flow**: Font pixel ở cỡ chữ nhỏ (12px-14px) trên mobile khiến người dùng nhập sai email, địa chỉ hoặc số thẻ.
- **Không đập đi xây lại toàn bộ codebase**: Tránh viết lại cấu trúc routing hay rewrite state management; chỉ can thiệp vào styling layer, component tokens và visual feedback.
- **Không tải thêm thư viện UI cồng kềnh**: Tránh cài các bộ UI như MUI hay Chakra UI gây xung đột với Tailwind v4 và làm phình bundle. Dùng CVA (`class-variance-authority`) đã có sẵn trong dự án.

---

## 4. Giải Pháp Tối Ưu Hóa & Đơn Giản Hóa (What Could Be Better / Efficient)

- **Xếp hạng theo Effort / Impact**:
  1. _High Impact / Low Effort_: Viết xong `DESIGN.md` và gắn token chuẩn vào `src/styles.css`. Mọi trang tự động thừa hưởng màu sắc và shadow đồng nhất.
  2. _High Impact / Medium Effort_: Tối ưu `CartDrawer.tsx` và `VariantCard.tsx` theo chuẩn card & button mới (hard shadow, active click offset 2px).
  3. _Medium Impact / Low Effort_: Thêm chế độ hiển thị Fallback tĩnh cho 3D Viewer trên mobile viewport (`< 640px`) giúp tăng tốc độ tải trang (LCP < 1.2s).
  4. _High Impact / High Effort_: Refactor toàn bộ Shop PDP và trang Checkout, tinh chỉnh micro-interactions với `tw-animate-css`.

---

## 5. Đề Xuất Lộ Trình Triển Khai (Roadmap to Goal)

- **Giai đoạn 1: SSoT Spec (Hiện tại)**:
  - Tạo `DESIGN.md` tại root dự án theo mẫu chuẩn của VoltAgent/awesome-design-md.
  - Cập nhật `src/styles.css` đồng bộ hóa biến CSS, font variables và utility classes.
- **Giai đoạn 2: Refactor Components Cơ Bản (Nền tảng)**:
  - Nâng cấp Button (arcade bevel, hard shadow, click press down effect).
  - Nâng cấp Badge, Modal, Tooltip theo phong cách Pixel & Neo-arcade.
- **Giai đoạn 3: Core Funnel Polish (Nâng cao trải nghiệm)**:
  - Tối ưu trang chủ (Hero + 3D Cap Viewer controls + Game Modal).
  - Tối ưu Shop index & Product detail (`src/routes/shop.*.tsx`).
  - Hoàn thiện Cart Drawer và Checkout flow mượt mà trên mobile.
- **Giai đoạn 4: Quality Gate & Verification**:
  - Chạy audit độ tương phản WCAG AA bằng axe/Lighthouse.
  - Chạy test e2e hiện có (`npm run test`) đảm bảo không hỏng logic giỏ hàng/thanh toán.

---

## 6. Lợi Ích Cụ Thể (Benefits)

- **Tính nhất quán tuyệt đối (Consistency)**: Mọi subagent hoặc lập trình viên khi code chỉ cần đọc `DESIGN.md` là viết đúng style, không phát sinh CSS rác.
- **Cải thiện tỷ lệ chuyển đổi (CRO)**: Form thanh toán và giỏ hàng dễ đọc hơn trên điện thoại nhờ Hybrid Typography.
- **Giữ trọn vẹn bản sắc (Identity)**: Phong cách Retro Arcade trở nên sắc sảo, cao cấp hơn mà không bị rẻ tiền hay hoài cổ nửa mùa.

---

## 7. Đánh Đổi & Chi Phí (Trade-offs)

- **Gia tăng nhẹ kích thước CSS**: Việc định nghĩa thêm token và utility cho typography/shadow sẽ tăng thêm khoảng 2-3KB CSS.
- **Công sức rà soát component**: Cần duyệt qua từng route (`shop`, `cart`, `checkout`, `about`, `track`) để thay thế các class inline tùy tiện bằng token mới.
- **Điều kiện hủy bỏ/đổi hướng**: Nếu dữ liệu analytics cho thấy người dùng trên 40 tuổi gặp khó khăn khi đọc tiêu đề arcade, hệ thống phải cho phép toggle fallback toàn bộ font về System Sans.

---

## 8. Danh Sách Công Việc & Chỉ Số Thành Công (Checklist & Metrics)

### Work Checklist

- [ ] **Khởi tạo `DESIGN.md`**: Viết đặc tả 9 phần chuẩn format tại root repository.
- [ ] **Refactor `src/styles.css`**: Khai báo font stack (VT323/Press Start 2P + Inter/System Sans), shadow tokens (`arcade-box`, `arcade-box-sm`), WCAG AA colors.
- [ ] **Chuẩn hóa Button & UI Primitives**: Tạo CVA variants cho arcade buttons (Primary Marquee, Secondary Cream, Destructive Red) với click press-down (`translate-y-[2px]`).
- [ ] **Nâng cấp Hero & 3D Viewer**: Thêm touch controls rõ ràng, 360 spin hint, mobile fallback toggle.
- [ ] **Nâng cấp Catalog & Product Card**: Thêm border 2px ink, hard shadow 4px, nhãn trạng thái pixel.
- [ ] **Nâng cấp Cart Drawer & Checkout**: Thiết kế lại hierarchy giá, coupon input, CTA button to rõ trên mobile, bảo đảm touch target >= 44x44px.
- [ ] **Mobile Typography Switch**: Thiết lập class utility `font-arcade` cho heading/actions, `font-sans` cho body text/input.
- [ ] **Verification**: Chạy `npm run test` và `npm run build` xác nhận không lỗi compile.

### Success Metrics

- **Lighthouse Performance Score**: Đạt $\ge 90$ trên cả Mobile và Desktop.
- **Accessibility Score (WCAG AA)**: Đạt $100$ điểm trên Lighthouse Accessibility.
- **Touch Target Size**: 100% các nút và link có diện tích bấm $\ge 44 \times 44\text{px}$.
- **Zero Console Errors / Zero Regressions**: Toàn bộ unit tests và test luồng thanh toán giỏ hàng chạy xanh (`vitest run`).
