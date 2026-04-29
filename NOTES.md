# Return/refund flow notes

## Current state

- Auth/module shape reviewed: project uses API/router -> interface-adapter controller -> application use case -> repository/Prisma wiring through `di.ts`.
- `Order.returnStatus` is the order-level return flow:
  - `REQUESTED`
  - `APPROVED`
  - `SHIPPING`
  - `COMPLETED`
  - `REJECTED`
- `Return.status` is the per-order-item return state and now uses prefixed values:
  - `RT_REQUESTED`
  - `RT_APPROVED`
  - `RT_SHIPPING`
  - `RT_COMPLETED`
  - `RT_REJECTED`

## Files changed for this task

- `server/prisma/schema.prisma`
  - Replaced `ReturnStatus` enum values with `RT_*`.
  - Removed legacy `WAITING_PICKUP` and `RETURNING` from `ReturnFlowStatus`.
  - Updated `Return.status` default to `RT_REQUESTED`.
  - Fix note: `Order.returnStatus` must be `ReturnFlowStatus?`, not `ReturnStatus?`. If it is `ReturnStatus?`, `/api/orders` can fail with `Value 'APPROVED' not found in enum 'ReturnStatus'`.
- `server/prisma/migrations/20260429131500_prefix_return_status_and_trim_flow/migration.sql`
  - Migrates old `returns.status` values to `RT_*`.
  - Maps legacy `orders.return_status` values:
    - `WAITING_PICKUP` -> `APPROVED`
    - `RETURNING` -> `SHIPPING`
- `server/src/module/order/infrastructure/repositories/prisma-order-return.repository.ts`
  - Creates/updates return rows with `RT_REQUESTED`.
- `server/src/module/admin/orders/infrastructure/repositories/prisma-admin-order-return.repository.ts`
  - Approve: `RT_REQUESTED` -> `RT_APPROVED`, order flow -> `APPROVED`.
  - Reject: `RT_REQUESTED` -> `RT_REJECTED`, order flow -> `REJECTED`.
  - Pickup: `RT_APPROVED` -> `RT_SHIPPING`, order flow -> `SHIPPING`.
  - Complete: `RT_APPROVED`/`RT_SHIPPING` -> `RT_COMPLETED`, order flow -> `COMPLETED`.
- `server/src/module/mock-orders/infrastructure/repositories/prisma-mock-orders.repository.ts`
  - Mock pickup and complete now update both order flow and return item status.
- `server/src/module/admin/orders/infrastructure/api/admin-orders.api.ts`
  - Return summary counts now read `RT_*` statuses and include `shipping`.
- `server/src/module/admin/dashboard/infrastructure/repositories/prisma-admin-dashboard.repository.ts`
  - Dashboard revenue/items sold exclude delivered orders whose return flow is `APPROVED`, `SHIPPING`, or `COMPLETED`.
  - Orders with no return, `REQUESTED`, or `REJECTED` still count toward revenue.
- `server/doc-api/order-return-refund.md`
  - Documents new mock APIs and `RT_*` statuses.
- `client-next/types/order.types.ts`
  - Removed legacy `WAITING_PICKUP` and `RETURNING` from `ReturnFlowStatus`.
- `client-seller/src/types/order.ts`
  - Return details now accept `RT_*` item statuses and optional `shipping` summary count.

## Mock APIs

- `POST /api/mock/orders/:orderId/returns/pickup`
  - Requires order `returnStatus = APPROVED`.
  - Sets order `returnStatus = SHIPPING`.
  - Sets matching return rows from `RT_APPROVED` to `RT_SHIPPING`.
- `POST /api/mock/orders/:orderId/returns/complete`
  - Requires order `status = DELIVERED` and `returnStatus = SHIPPING`.
  - Sets order `returnStatus = COMPLETED`.
  - Sets matching return rows from `RT_APPROVED`/`RT_SHIPPING` to `RT_COMPLETED`.

## Verification

- Ran `npm run prisma:generate` in `server`.
- Ran `npx tsup src/server.ts --format esm --clean` in `server`: success.
- Regenerated Prisma Client inside Docker containers `dev-backend` and `dev-payos-reconcile-worker`, then restarted both containers.
- Confirmed MySQL values:
  - `returns.status` contains `RT_REQUESTED`/`RT_APPROVED`.
  - `orders.return_status` enum contains `REQUESTED`, `APPROVED`, `SHIPPING`, `COMPLETED`, `REJECTED`.
- Ran `npx tsc --noEmit` in `server`: failed on existing unrelated test mock typing issues in:
  - `src/module/payment/applications/use-cases/__tests__/handle-payos-return.usecase.test.ts`
  - `src/module/product/applications/usecases/__tests__/get-category-showcases.usecase.test.ts`

## Pending tasks

- Apply database migration before testing the flow against a real database.
- Existing TypeScript test mock errors should be fixed separately if full `tsc --noEmit` is required as a gate.
