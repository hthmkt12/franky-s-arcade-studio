# Báo cáo Tư vấn: Tích hợp Google Analytics 4 & Google Tag Manager Collector

## 1. Verdict (Đánh giá chuyên gia)

Việc bổ sung GA4 / GTM Collector vào `__root.tsx` là bước đi đúng thời điểm và có ROI cao nhất sau khi hoàn thành instrumentation đo lường phễu (PR #3). Hệ thống đã có sẵn `dataLayer.push()` và CustomEvent, việc đưa collector vào sẽ biến các sự kiện nội bộ thành số liệu kinh doanh thực tế trên Google Analytics Dashboard mà không tốn công viết lại tracking logic.

## 2. Việc nên làm (What you should do)

- **Tích hợp thẻ script điều kiện**: Inject GTM / GA4 script trong `head` của `src/routes/__root.tsx` dựa trên các biến môi trường:
  - `VITE_GTM_ID`: Nếu có, inject GTM inline snippet + noscript iframe.
  - `VITE_GA_MEASUREMENT_ID`: Nếu có (và không có GTM), inject `gtag.js` script.
- **SSR & Dev Safety**:
  - Không ném lỗi hoặc in warning rác nếu biến môi trường chưa được set ở local.
  - Kiểm tra `import.meta.env.PROD` hoặc cờ bật tắt để tránh gửi test data lên dashboard sản xuất khi dev.
- **Cấu hình GA4 Ecommerce Event Schema**:
  - Đảm bảo mapping các sự kiện trong `src/lib/analytics.ts` khớp với GA4 standard ecommerce event parameters:
    - `view_item_list` -> `items: [...]`
    - `view_item` -> `items: [{ item_id, item_name, price, currency }]`
    - `add_to_cart` -> `items: [...]`
    - `begin_checkout` -> `value, currency, items`
    - `purchase` -> `transaction_id, value, currency, items`

## 3. Việc KHÔNG nên làm (What you shouldn't do)

- **Không cài đặt các package npm bên thứ ba**: Tránh dùng các thư viện như `react-ga4`, `next-gtm`, hay wrapper nặng nề. Cơ chế HTML script tag kết hợp native `window.dataLayer` là nhanh nhất, chuẩn nhất và zero-dependency.
- **Không hardcode ID đo lường**: Luôn đưa `VITE_GTM_ID` và `VITE_GA_MEASUREMENT_ID` vào `.env.example` và biến môi trường production.
- **Không chặn luồng render (Render-blocking)**: Script analytics phải luôn có thuộc tính `async` để không ảnh hưởng đến FCP (First Contentful Paint) và LCP của giao diện retro paper.

## 4. Giải pháp thay thế & So sánh (Alternatives)

- **Phương án A (Khuyên dùng)**: Script tag thuần trong `__root.tsx` đọc từ `import.meta.env`.
  - _Ưu điểm_: Zero bundle size, chuẩn quốc tế, kiểm soát tuyệt đối.
  - _Nhược điểm_: Phải tự viết 15 dòng code inject HTML.
- **Phương án B**: Dùng thư viện wrapper (`react-ga4` hoặc `@tanstack/react-query` analytics plugin).
  - _Ưu điểm_: Có hook gọi sẵn.
  - _Nhược điểm_: Tăng bundle size, khó tương thích SSR TanStack Start, dễ đụng độ hook rules.

## 5. Lộ trình thực hiện (How to get there)

1. Cập nhật `src/routes/__root.tsx`:
   - Thêm component `<AnalyticsScripts />` đặt trong thẻ `<head>` của `RootComponent`.
   - Script đọc `import.meta.env.VITE_GTM_ID` hoặc `import.meta.env.VITE_GA_MEASUREMENT_ID`.
2. Kiểm thử và xác nhận:
   - Chạy dev server không set env: Trang hoạt động bình thường, không lỗi.
   - Thử set test ID giả lập: Kiểm tra thẻ script được inject chính xác vào DOM.
   - Gõ lệnh kiểm tra `window.dataLayer` trên DevTools console.
3. Tạo Pull Request theo quy chuẩn:
   - Branch: `feat/analytics-ga4-gtm-collector`
   - Chạy format, lint, test, build.
   - Mở PR, đợi CI và merge vào `main`.

## 6. Lợi ích (Benefits)

- Thu thập tức thì các chỉ số phễu: Cart abandonment rate, checkout drop-off, tỷ lệ áp dụng mã cheat arcade.
- Sẵn sàng liên kết Google Ads hoặc Meta Ads khi chạy chiến dịch bán hàng thực tế.
- Tương thích 100% với hạ tầng server-side rendering hiện có.

## 7. Đánh đổi (Trade-offs)

- Cần người dùng chấp nhận chính sách Cookie / Privacy nếu bán hàng ở thị trường Châu Âu (EU GDPR) khi bật GA4 cookie tracking.
- Giải pháp: Có thể cấu hình `gtag('consent', 'default', { ... })` nếu muốn tuân thủ triệt để GDPR.

## 8. Kế hoạch công việc & Tiêu chí thành công (Checklist & Metrics)

### Work Checklist

- [ ] Bổ sung khai báo `VITE_GTM_ID` và `VITE_GA_MEASUREMENT_ID` vào `.env.example`.
- [ ] Thêm inject script conditional trong `src/routes/__root.tsx`.
- [ ] Bổ sung script noscript cho GTM ngay sau thẻ mở `<body>` nếu dùng GTM.
- [ ] Viết unit test xác nhận script tag được render đúng khi có env.
- [ ] Kiểm tra toàn bộ test suite và build pass 100%.
- [ ] Mở PR và merge vào `main`.

### Success Metrics

- **Zero bundle overhead**: Script chèn qua async CDN, dung lượng JS bundle ứng dụng không tăng quá 1KB.
- **Clean fallback**: Khi cả 2 env đều rỗng, trang không xuất hiện lỗi runtime console nào.
- **DOM Event Bridge**: Khi kích hoạt sự kiện mua hàng, `window.dataLayer` chứa đúng payload chuẩn GA4 ecommerce.
