# Phase 1: Security Hardening & UI/UX / WCAG AA

## Goals:

- Bảo vệ dữ liệu cá nhân khách hàng ở `GET /api/orders/$id`.
- Tối ưu Typography, màu tương phản đạt chuẩn WCAG AA và hit-targets mobile.

## Changes:

- `src/lib/api/types.ts`: Thêm `guestToken` vào Order Response/Draft.
- `src/routes/api/orders.ts` & `src/routes/api/orders.$id.ts`: Tạo và kiểm tra HMAC signature token.
- `src/styles.css`: Chuyển font `body` sang `VT323, monospace`, cập nhật `--muted: #525252`.
- `src/components/frankys/ArModal.tsx`: Đổi text button retry thành `text-ink`.
- `src/components/frankys/CartDrawer.tsx`: Mở rộng vùng bấm +/- lên 44px.
