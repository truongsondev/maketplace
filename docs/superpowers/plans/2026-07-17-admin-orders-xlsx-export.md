# Admin Orders XLSX Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xuất toàn bộ đơn hàng trong database thành XLSX tiếng Việt, gom theo email, xếp đơn mới trước trong từng nhóm và tô nền xen kẽ theo nhóm email.

**Architecture:** Một module export riêng định nghĩa truy vấn toàn bộ đơn và dựng workbook bằng ExcelJS. Admin API chỉ lấy dữ liệu qua query builder, tạo buffer XLSX và trả đúng MIME type; client seller gọi endpoint không kèm bộ lọc và tải file `.xlsx`.

**Tech Stack:** TypeScript, Express 5, Prisma 7, ExcelJS, Jest 30, React/Vite.

## Global Constraints

- Mỗi lần xuất phải lấy toàn bộ đơn trong database; không dùng filter, pagination, `take` hoặc giới hạn 10.000.
- Sắp email A-Z; trong cùng email sắp `createdAt` mới-cũ và `id` giảm dần.
- Nhóm email đầu tô hồng nhạt, nhóm kế tiếp không tô, rồi xen kẽ.
- Tiêu đề và dữ liệu diễn giải phải là tiếng Việt có dấu.
- Danh sách/filter trên màn hình admin không thay đổi.

---

### Task 1: XLSX query and workbook builder

**Files:**
- Modify: `server/package.json`
- Modify: `server/package-lock.json`
- Create: `server/src/module/admin/orders/infrastructure/export/admin-orders-xlsx.ts`
- Create: `server/src/module/admin/orders/infrastructure/export/__tests__/admin-orders-xlsx.test.ts`

**Interfaces:**
- Produces: `getAdminOrdersExportQuery(): Prisma.OrderFindManyArgs`.
- Produces: `buildAdminOrdersWorkbook(orders: AdminOrderExportRow[]): Promise<Buffer>`.
- Consumes: ExcelJS `Workbook`.

- [ ] **Step 1: Install the workbook dependency**

Run from `server`: `npm install exceljs`.

Expected: `exceljs` is added to dependencies and the lockfile updates.

- [ ] **Step 2: Write failing query/workbook tests**

```ts
import { describe, expect, it } from '@jest/globals';
import ExcelJS from 'exceljs';
import {
  buildAdminOrdersWorkbook,
  getAdminOrdersExportQuery,
} from '../admin-orders-xlsx';

function makeOrder(input: { id: string; email: string; createdAt: string }) {
  return {
    id: input.id,
    createdAt: new Date(input.createdAt),
    status: 'PENDING',
    totalPrice: 199_000,
    user: { email: input.email, phone: '0900000000' },
    payment: { method: 'COD', status: 'PENDING', paidAt: null },
    paymentTransaction: null,
    items: [{
      quantity: 1,
      price: 199_000,
      productName: 'Áo thun màu đỏ',
      product: { name: 'Áo thun màu đỏ' },
    }],
  } as never;
}

function patternFillArgb(cell: ExcelJS.Cell): string | undefined {
  return cell.fill.type === 'pattern' ? cell.fill.fgColor?.argb : undefined;
}

describe('admin orders XLSX export', () => {
  it('queries every order grouped by email with newest orders first', () => {
    expect(getAdminOrdersExportQuery()).toEqual(expect.objectContaining({
      orderBy: [
        { user: { email: 'asc' } },
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
    }));
    expect(getAdminOrdersExportQuery()).not.toHaveProperty('where');
    expect(getAdminOrdersExportQuery()).not.toHaveProperty('take');
    expect(getAdminOrdersExportQuery()).not.toHaveProperty('skip');
  });

  it('writes Vietnamese data and alternating fills by email group', async () => {
    const buffer = await buildAdminOrdersWorkbook([
      makeOrder({ id: 'b-1', email: 'b@example.com', createdAt: '2026-07-15T10:00:00Z' }),
      makeOrder({ id: 'a-old', email: 'a@example.com', createdAt: '2026-07-14T10:00:00Z' }),
      makeOrder({ id: 'a-new', email: 'a@example.com', createdAt: '2026-07-16T10:00:00Z' }),
    ]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.getWorksheet('Đơn hàng')!;

    expect(sheet.getCell('A1').value).toBe('Mã đơn nội bộ');
    expect([2, 3, 4].map((row) => sheet.getCell(`F${row}`).value)).toEqual([
      'a@example.com', 'a@example.com', 'b@example.com',
    ]);
    expect([2, 3, 4].map((row) => sheet.getCell(`A${row}`).value)).toEqual([
      'a-new', 'a-old', 'b-1',
    ]);
    expect(sheet.getCell('L2').value).toContain('Áo thun màu đỏ');
    expect(patternFillArgb(sheet.getCell('A2'))).toBe('FFFFC7CE');
    expect(patternFillArgb(sheet.getCell('A3'))).toBe('FFFFC7CE');
    expect(patternFillArgb(sheet.getCell('A4'))).toBeUndefined();
  });
});
```

- [ ] **Step 3: Verify RED**

Run: `npm test -- --runInBand src/module/admin/orders/infrastructure/export/__tests__/admin-orders-xlsx.test.ts`

Expected: FAIL because `admin-orders-xlsx.ts` is missing.

- [ ] **Step 4: Implement query, sorting, translations and styling**

The query contains only:

```ts
return {
  orderBy: [
    { user: { email: 'asc' } },
    { createdAt: 'desc' },
    { id: 'desc' },
  ],
  include: {
    user: { select: { email: true, phone: true } },
    payment: { select: { method: true, status: true, paidAt: true } },
    paymentTransaction: { select: { orderCode: true, status: true, paidAt: true } },
    items: {
      select: {
        quantity: true,
        price: true,
        productName: true,
        product: { select: { name: true } },
      },
    },
  },
};
```

The builder sorts defensively using email ascending, timestamp descending and id descending. It creates worksheet `Đơn hàng`, Vietnamese columns, native Date/number cells, Vietnamese status/payment labels, bold header, and applies fill `FFFFC7CE` to every odd-indexed email group.

- [ ] **Step 5: Verify GREEN and commit**

Run the focused Jest test and `npx tsc --noEmit`; expect exit 0.

```powershell
git add server/package.json server/package-lock.json server/src/module/admin/orders/infrastructure/export
git commit -m "feat: build grouped admin orders xlsx"
```

### Task 2: Serve XLSX for every database order

**Files:**
- Modify: `server/src/module/admin/orders/infrastructure/api/admin-orders.api.ts`

**Interfaces:**
- Consumes: `getAdminOrdersExportQuery` and `buildAdminOrdersWorkbook`.
- Produces: `GET /api/admin/orders/export` response with XLSX MIME type and buffer.

- [ ] **Step 1: Replace the CSV export implementation**

Remove query parsing/filter construction, CSV headers, CSV escaping and the 10.000-row limit from `exportOrders`. Use:

```ts
const orders = await this.prisma.order.findMany(getAdminOrdersExportQuery());
const workbook = await buildAdminOrdersWorkbook(orders);
const filename = `danh-sach-don-hang-${new Date().toISOString().slice(0, 10)}.xlsx`;
res.setHeader(
  'Content-Type',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
);
res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
res.status(200).send(workbook);
```

Delete `escapeCsvValue` if it has no remaining callers.

- [ ] **Step 2: Run server checks and commit**

Run the XLSX test and `npx tsc --noEmit`; expect exit 0.

```powershell
git add server/src/module/admin/orders/infrastructure/api/admin-orders.api.ts
git commit -m "feat: export all admin orders as xlsx"
```

### Task 3: Update seller download behavior

**Files:**
- Modify: `client-seller/src/services/api.ts`
- Modify: `client-seller/src/page/order/orders.tsx`

**Interfaces:**
- Produces: `orderService.exportOrders(): Promise<Blob>` without params.
- Consumes: XLSX blob from the existing endpoint.

- [ ] **Step 1: Remove export filter parameters**

```ts
exportOrders: async (): Promise<Blob> => {
  const response = await apiClient.get('/admin/orders/export', {
    responseType: 'blob',
  });
  return response.data;
},
```

- [ ] **Step 2: Change the downloaded filename and messages**

```ts
const blob = await orderService.exportOrders();
a.download = `danh-sach-don-hang-${new Date().toISOString().slice(0, 10)}.xlsx`;
toast.success('Xuất file Excel thành công');
```

Use `Xuất file Excel thất bại` for the error message. Keep the button loading state unchanged.

- [ ] **Step 3: Build and commit**

Run from `client-seller`: `npm run build`. Expected: exit 0.

```powershell
git add client-seller/src/services/api.ts client-seller/src/page/order/orders.tsx
git commit -m "feat: download admin orders xlsx"
```

### Task 4: Full verification

**Files:** Verify only.

- [ ] **Step 1: Server**

Run from `server`: `npm test -- --runInBand`, `npx tsc --noEmit`, and `npm run build --if-present`. Expect all exit 0.

- [ ] **Step 2: Seller client**

Run from `client-seller`: `npm run lint --if-present` and `npm run build`. Expect build exit 0; record any pre-existing lint warnings separately.

- [ ] **Step 3: Artifact-level XLSX verification**

Use the focused Jest test to serialize and reload the workbook, verifying Unicode strings and fills. Run `git diff --check` and `git status --short`; expect no whitespace errors or unintended files.
