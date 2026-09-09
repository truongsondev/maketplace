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
    items: [
      {
        quantity: 1,
        price: 199_000,
        productName: 'Áo thun màu đỏ',
        product: { name: 'Áo thun màu đỏ' },
      },
    ],
  } as never;
}

function patternFillArgb(cell: ExcelJS.Cell): string | undefined {
  return cell.fill.type === 'pattern' ? cell.fill.fgColor?.argb : undefined;
}

describe('admin orders XLSX export', () => {
  it('queries every order grouped by email with newest orders first', () => {
    const query = getAdminOrdersExportQuery();

    expect(query).toEqual(
      expect.objectContaining({
        orderBy: [
          { user: { email: 'asc' } },
          { createdAt: 'desc' },
          { id: 'desc' },
        ],
      }),
    );
    expect(query).not.toHaveProperty('where');
    expect(query).not.toHaveProperty('take');
    expect(query).not.toHaveProperty('skip');
  });

  it('writes Vietnamese data and alternating fills by email group', async () => {
    const buffer = await buildAdminOrdersWorkbook([
      makeOrder({
        id: 'b-1',
        email: 'b@example.com',
        createdAt: '2026-07-15T10:00:00Z',
      }),
      makeOrder({
        id: 'a-old',
        email: 'a@example.com',
        createdAt: '2026-07-14T10:00:00Z',
      }),
      makeOrder({
        id: 'a-new',
        email: 'a@example.com',
        createdAt: '2026-07-16T10:00:00Z',
      }),
    ]);
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;
    await workbook.xlsx.load(arrayBuffer);
    const sheet = workbook.getWorksheet('Đơn hàng');

    expect(sheet).toBeDefined();
    expect(sheet!.getCell('A1').value).toBe('Mã đơn nội bộ');
    expect([2, 3, 4].map((row) => sheet!.getCell(`F${row}`).value)).toEqual([
      'a@example.com',
      'a@example.com',
      'b@example.com',
    ]);
    expect([2, 3, 4].map((row) => sheet!.getCell(`A${row}`).value)).toEqual([
      'a-new',
      'a-old',
      'b-1',
    ]);
    expect(sheet!.getCell('D2').value).toBe('Chờ xử lý');
    expect(sheet!.getCell('L2').value).toContain('Áo thun màu đỏ');
    expect(patternFillArgb(sheet!.getCell('A2'))).toBe('FFFFC7CE');
    expect(patternFillArgb(sheet!.getCell('A3'))).toBe('FFFFC7CE');
    expect(patternFillArgb(sheet!.getCell('A4'))).toBeUndefined();
  });
});
