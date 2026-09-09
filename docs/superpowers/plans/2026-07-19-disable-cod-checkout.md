# Disable COD Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tạm khóa tạo đơn COD mới và ẩn COD khỏi checkout trong khi giữ nguyên xử lý đơn COD cũ.

**Architecture:** Một policy trong backend là nguồn cấu hình duy nhất. Backend vừa chặn use case tạo COD vừa công khai capability để checkout quyết định render.

**Tech Stack:** TypeScript, Express, Jest, Next.js, TanStack Query

## Global Constraints

- `COD_PAYMENT_ENABLED` phải là biến trong code và có giá trị `false`, không đọc từ environment.
- Không thay đổi luồng xử lý đơn COD đã tồn tại.
- Checkout phải mặc định ẩn COD nếu capability chưa tải hoặc tải lỗi.

---

### Task 1: Chính sách khóa COD phía server

**Files:**
- Create: `server/src/module/payment/payment-method.policy.ts`
- Create: `server/src/module/payment/__tests__/payment-method.policy.test.ts`
- Modify: `server/src/module/payment/applications/use-cases/create-cod-order.usecase.ts`
- Modify: `server/src/module/payment/applications/use-cases/__tests__/create-cod-order.usecase.test.ts`

**Interfaces:**
- Produces: `COD_PAYMENT_ENABLED: boolean`, `assertCodPaymentEnabled(): void`, `getPaymentMethodCapabilities(): { codEnabled: boolean }`.

- [ ] Viết test policy và test use case bị từ chối mà không gọi dependency.
- [ ] Chạy test tập trung và xác nhận thất bại vì policy chưa tồn tại.
- [ ] Thêm policy với `COD_PAYMENT_ENABLED = false` và guard ở đầu `execute()`.
- [ ] Chạy lại test tập trung và xác nhận pass.

### Task 2: API capability và checkout

**Files:**
- Modify: `server/src/module/payment/infrastructure/api/payment.api.ts`
- Modify: `client-next/services/payos-payment.service.ts`
- Modify: `client-next/app/(page)/checkout/confirm/checkout-confirm-client.tsx`

**Interfaces:**
- Consumes: `getPaymentMethodCapabilities()`.
- Produces: `GET /api/payments/methods` và `getPaymentMethods(): Promise<{ codEnabled: boolean }>`.

- [ ] Thêm route trả capability qua `ResponseFormatter.success`.
- [ ] Thêm service client đọc capability.
- [ ] Thêm query với giá trị an toàn mặc định `false` và chỉ render COD khi `codEnabled === true`.
- [ ] Chạy toàn bộ test/typecheck server và lint/build client.
