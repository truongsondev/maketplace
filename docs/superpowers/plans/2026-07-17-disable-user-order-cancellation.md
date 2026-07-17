# Disable User Order Cancellation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khóa toàn bộ thao tác hủy đơn phía user bằng một hằng số backend và đưa giảm giá theo hạng tại checkout về 0, trong khi tích điểm, voucher, khuyến mãi và thao tác admin giữ nguyên.

**Architecture:** Một policy nhỏ trong order module là nguồn duy nhất cho trạng thái khóa. Orders API dùng policy để chặn hai endpoint và gắn capability vào dữ liệu đơn; hai UI user dùng capability để ẩn thao tác. Hàm loyalty checkout giữ tier/label nhưng trả mức giảm bằng 0.

**Tech Stack:** TypeScript, Express 5, Jest 30, Next.js 16, React 19, Node test runner.

## Global Constraints

- Không dùng `.env`, migration hoặc cấu hình database.
- Nguồn bật/tắt duy nhất là `USER_ORDER_CANCELLATION_ENABLED = false` ở backend.
- Admin/seller, yêu cầu hủy cũ, đổi/trả hàng, voucher và khuyến mãi không đổi.
- Tích điểm, lịch sử điểm và nâng hạng không đổi.
- Backend phải từ chối request hủy trực tiếp trước khi thay đổi dữ liệu.

---

### Task 1: Backend cancellation policy

**Files:**
- Create: `server/src/module/order/order-cancellation.policy.ts`
- Create: `server/src/module/order/__tests__/order-cancellation.policy.test.ts`
- Modify: `server/src/module/order/infrastructure/api/orders.api.ts`

**Interfaces:**
- Produces: `USER_ORDER_CANCELLATION_ENABLED`, `assertUserOrderCancellationEnabled(): void`, `withUserOrderCancellationCapability<T extends object>(value: T)`.
- Consumes: `BadRequestError`.

- [ ] **Step 1: Write failing policy tests**

```ts
import { describe, expect, it } from '@jest/globals';
import {
  assertUserOrderCancellationEnabled,
  withUserOrderCancellationCapability,
} from '../order-cancellation.policy';

describe('user order cancellation policy', () => {
  it('rejects cancellation while locked', () => {
    expect(() => assertUserOrderCancellationEnabled()).toThrow(
      'Chức năng hủy đơn hiện đang tạm khóa',
    );
  });

  it('adds disabled capability to an order response', () => {
    expect(withUserOrderCancellationCapability({ id: 'order-1' })).toEqual({
      id: 'order-1',
      userOrderCancellationEnabled: false,
    });
  });
});
```

- [ ] **Step 2: Verify RED**

Run from `server`: `npm test -- --runInBand src/module/order/__tests__/order-cancellation.policy.test.ts`

Expected: FAIL because the policy module is missing.

- [ ] **Step 3: Implement the minimal policy**

```ts
import { BadRequestError } from '../../error-handlling/badRequestError';

export const USER_ORDER_CANCELLATION_ENABLED = false;

export function assertUserOrderCancellationEnabled(): void {
  if (!USER_ORDER_CANCELLATION_ENABLED) {
    throw new BadRequestError('Chức năng hủy đơn hiện đang tạm khóa');
  }
}

export function withUserOrderCancellationCapability<T extends object>(value: T) {
  return { ...value, userOrderCancellationEnabled: USER_ORDER_CANCELLATION_ENABLED };
}
```

- [ ] **Step 4: Apply policy in OrdersAPI**

Import the two helpers. Call the guard in `requestPaidCancel` and `cancelMyOrder` after user/orderId validation and before body parsing/controller calls. For list responses map every item through the capability helper; for detail responses wrap the returned DTO.

```ts
const response = {
  ...result,
  items: result.items.map(withUserOrderCancellationCapability),
};

const response = withUserOrderCancellationCapability(dto);
```

- [ ] **Step 5: Verify GREEN and commit**

Run the focused Jest command again; expect 2 PASS.

```powershell
git add server/src/module/order/order-cancellation.policy.ts server/src/module/order/__tests__/order-cancellation.policy.test.ts server/src/module/order/infrastructure/api/orders.api.ts
git commit -m "feat: lock user order cancellation"
```

### Task 2: Frontend cancellation visibility

**Files:**
- Create: `client-next/lib/order-cancellation.mjs`
- Create: `client-next/lib/order-cancellation.test.mjs`
- Modify: `client-next/types/order.types.ts`
- Modify: `client-next/app/(page)/orders/orders-list-client.tsx`
- Modify: `client-next/app/(page)/orders/order-detail-client.tsx`

**Interfaces:**
- Consumes: `MyOrderListItem.userOrderCancellationEnabled: boolean`.
- Produces: `getUserOrderCancellationActions(order): { canCancel: boolean; canRequestPaidCancel: boolean }`.

- [ ] **Step 1: Write failing Node tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { getUserOrderCancellationActions } from './order-cancellation.mjs';

test('hides both actions when backend capability is false', () => {
  assert.deepEqual(getUserOrderCancellationActions({
    status: 'PENDING',
    userOrderCancellationEnabled: false,
    payment: { status: 'PENDING', transactionStatus: 'PENDING' },
    cancelRequest: null,
  }), { canCancel: false, canRequestPaidCancel: false });
});

test('allows paid cancellation request when capability is true', () => {
  assert.deepEqual(getUserOrderCancellationActions({
    status: 'PAID',
    userOrderCancellationEnabled: true,
    payment: { status: 'PAID', transactionStatus: 'PAID' },
    cancelRequest: null,
  }), { canCancel: false, canRequestPaidCancel: true });
});
```

- [ ] **Step 2: Verify RED**

Run from `client-next`: `node --test lib/order-cancellation.test.mjs`

Expected: FAIL because the helper module is missing.

- [ ] **Step 3: Implement the decision helper**

```js
/** @param {import('../types/order.types').MyOrderListItem} order */
export function getUserOrderCancellationActions(order) {
  if (!order.userOrderCancellationEnabled) {
    return { canCancel: false, canRequestPaidCancel: false };
  }
  const paymentSuccessful =
    ['PAID', 'SUCCESS'].includes(order.payment.status ?? '') ||
    ['PAID', 'SUCCESS'].includes(order.payment.transactionStatus ?? '');
  const paidFlow =
    ['PAID', 'CONFIRMED'].includes(order.status) && paymentSuccessful;
  return {
    canCancel: ['PENDING', 'CONFIRMED'].includes(order.status) && !paidFlow,
    canRequestPaidCancel:
      paidFlow &&
      order.cancelRequest?.status !== 'REQUESTED' &&
      order.cancelRequest?.status !== 'APPROVED',
  };
}
```

- [ ] **Step 4: Wire both UI surfaces**

Add `userOrderCancellationEnabled: boolean` to `MyOrderListItem`. Import the helper in the list and detail clients and replace their duplicate `canCancel` / `canRequestPaidCancel` calculations:

```ts
const { canCancel, canRequestPaidCancel } =
  getUserOrderCancellationActions(order);
```

Keep review, receive and return conditions unchanged.

- [ ] **Step 5: Verify and commit**

Run from `client-next`: `node --test lib/order-cancellation.test.mjs`, `npm run lint`, and `npm run build`. Expect all to exit 0.

```powershell
git add client-next/lib/order-cancellation.mjs client-next/lib/order-cancellation.test.mjs client-next/types/order.types.ts 'client-next/app/(page)/orders/orders-list-client.tsx' 'client-next/app/(page)/orders/order-detail-client.tsx'
git commit -m "feat: hide locked user cancellation actions"
```

### Task 3: Disable loyalty tier checkout discount

**Files:**
- Create: `server/src/module/user-profile/__tests__/loyalty-benefits.test.ts`
- Modify: `server/src/module/user-profile/loyalty-benefits.ts`
- Verify: `server/src/module/user-profile/__tests__/loyalty.service.test.ts`
- Verify: `server/src/module/voucher/applications/services/__tests__/voucher-checkout.service.test.ts`

**Interfaces:**
- Preserves the existing `calculateLoyaltyDiscount` signature and tier metadata.
- Returns `discountPercent: 0` and `discountAmount: 0` for every tier.

- [ ] **Step 1: Write the failing loyalty test**

```ts
import { describe, expect, it } from '@jest/globals';
import { calculateLoyaltyDiscount } from '../loyalty-benefits';

describe('calculateLoyaltyDiscount', () => {
  it.each([['SILVER', 'Bạc'], ['GOLD', 'Vàng']])(
    'keeps %s metadata but applies no checkout discount',
    (tier, tierLabel) => {
      expect(calculateLoyaltyDiscount({ tier, amount: 1_000_000 })).toEqual({
        tier,
        tierLabel,
        discountPercent: 0,
        discountAmount: 0,
      });
    },
  );
});
```

- [ ] **Step 2: Verify RED**

Run from `server`: `npm test -- --runInBand src/module/user-profile/__tests__/loyalty-benefits.test.ts`

Expected: FAIL because SILVER/GOLD currently return 2%/5%.

- [ ] **Step 3: Implement zero checkout discount**

Keep tier normalization and `benefit.label`, but return:

```ts
return {
  tier,
  tierLabel: benefit.label,
  discountPercent: 0,
  discountAmount: 0,
};
```

Do not modify benefit labels, point ledger, thresholds, expiry or `awardLoyaltyForOrder`.

- [ ] **Step 4: Verify and commit**

Run the new test plus `loyalty.service.test.ts` and `voucher-checkout.service.test.ts`; expect all PASS.

```powershell
git add server/src/module/user-profile/loyalty-benefits.ts server/src/module/user-profile/__tests__/loyalty-benefits.test.ts
git commit -m "feat: disable loyalty tier checkout discount"
```

### Task 4: Full verification

**Files:** Verify only.

- [ ] **Step 1: Server verification**

From `server`, run `npm test -- --runInBand`, `npx tsc --noEmit`, and `npm run build --if-present`. Expect exit 0.

- [ ] **Step 2: Client verification**

From `client-next`, run `node --test lib/order-cancellation.test.mjs`, `npm run lint`, and `npm run build`. Expect exit 0.

- [ ] **Step 3: Diff verification**

From repo root, run `git diff --check` and `git status --short`. Inspect every changed path and confirm no `.env`, admin cancellation, return flow or loyalty ledger file changed.
