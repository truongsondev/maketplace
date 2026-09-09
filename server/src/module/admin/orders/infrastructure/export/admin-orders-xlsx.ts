import ExcelJS from 'exceljs';
import type { Prisma } from '@/generated/prisma/client';

export interface AdminOrderExportRow {
  id: string;
  createdAt: Date;
  status: string;
  totalPrice: unknown;
  user: { email: string | null; phone: string | null };
  payment: {
    method: string;
    status: string;
    paidAt: Date | null;
  } | null;
  paymentTransaction: {
    orderCode: string | null;
    status: string;
    paidAt: Date | null;
  } | null;
  items: Array<{
    quantity: number;
    price: unknown;
    productName: string;
    product: { name: string };
  }>;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đã xác nhận',
  PAID: 'Đã thanh toán',
  PACKING: 'Đang đóng gói',
  AWAITING_PICKUP: 'Chờ lấy hàng',
  SHIPPED: 'Đã giao cho đơn vị vận chuyển',
  DELIVERING: 'Đang giao hàng',
  DELIVERY_FAILED: 'Giao hàng thất bại',
  LOST: 'Thất lạc',
  RETURN_TO_STORE: 'Đang hoàn về cửa hàng',
  DELIVERED: 'Đã giao hàng',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
  RETURNED: 'Đã trả hàng',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: 'Thanh toán khi nhận hàng',
  PAYOS: 'Thanh toán PayOS',
  BANK_TRANSFER: 'Chuyển khoản',
  CASH: 'Tiền mặt',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  SUCCESS: 'Thành công',
  FAILED: 'Thất bại',
  EXPIRED: 'Đã hết hạn',
  REFUNDED: 'Đã hoàn tiền',
  CANCELLED: 'Đã hủy',
};

function translate(value: string | null | undefined, labels: Record<string, string>): string {
  if (!value) return '';
  return labels[value] ?? `Không xác định (${value})`;
}

function compareOrders(a: AdminOrderExportRow, b: AdminOrderExportRow): number {
  const emailComparison = (a.user.email ?? '').localeCompare(b.user.email ?? '', 'vi', {
    sensitivity: 'base',
  });
  if (emailComparison !== 0) return emailComparison;

  const createdAtComparison = b.createdAt.getTime() - a.createdAt.getTime();
  if (createdAtComparison !== 0) return createdAtComparison;
  return b.id.localeCompare(a.id);
}

const ADMIN_ORDERS_EXPORT_QUERY = {
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
  } satisfies Prisma.OrderFindManyArgs;

export function getAdminOrdersExportQuery(): typeof ADMIN_ORDERS_EXPORT_QUERY {
  return ADMIN_ORDERS_EXPORT_QUERY;
}

export async function buildAdminOrdersWorkbook(
  orders: AdminOrderExportRow[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Aura Fashion Marketplace';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Đơn hàng', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Mã đơn nội bộ', key: 'id', width: 38 },
    { header: 'Mã thanh toán', key: 'orderCode', width: 20 },
    { header: 'Ngày đặt', key: 'createdAt', width: 22 },
    { header: 'Trạng thái đơn', key: 'status', width: 30 },
    { header: 'Tổng tiền', key: 'totalPrice', width: 18 },
    { header: 'Email khách hàng', key: 'email', width: 32 },
    { header: 'Số điện thoại', key: 'phone', width: 18 },
    { header: 'Phương thức thanh toán', key: 'paymentMethod', width: 28 },
    { header: 'Trạng thái thanh toán', key: 'paymentStatus', width: 24 },
    { header: 'Trạng thái giao dịch', key: 'transactionStatus', width: 24 },
    { header: 'Số loại sản phẩm', key: 'itemsCount', width: 18 },
    { header: 'Chi tiết sản phẩm', key: 'itemsSummary', width: 60 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF9C0006' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 24;
  sheet.autoFilter = { from: 'A1', to: 'L1' };

  const sortedOrders = orders.slice().sort(compareOrders);
  let previousEmail: string | null = null;
  let groupIndex = -1;

  for (const order of sortedOrders) {
    const normalizedEmail = (order.user.email ?? '').trim().toLocaleLowerCase('vi');
    if (normalizedEmail !== previousEmail) {
      groupIndex += 1;
      previousEmail = normalizedEmail;
    }

    const itemsSummary = order.items
      .map((item) => `${item.productName || item.product.name} x${item.quantity}`)
      .join(' | ');
    const row = sheet.addRow({
      id: order.id,
      orderCode: order.paymentTransaction?.orderCode ?? '',
      createdAt: order.createdAt,
      status: translate(order.status, ORDER_STATUS_LABELS),
      totalPrice: Number(order.totalPrice ?? 0),
      email: order.user.email ?? '',
      phone: order.user.phone ?? '',
      paymentMethod: translate(order.payment?.method, PAYMENT_METHOD_LABELS),
      paymentStatus: translate(order.payment?.status, PAYMENT_STATUS_LABELS),
      transactionStatus: translate(
        order.paymentTransaction?.status,
        PAYMENT_STATUS_LABELS,
      ),
      itemsCount: order.items.length,
      itemsSummary,
    });

    row.getCell('createdAt').numFmt = 'dd/mm/yyyy hh:mm:ss';
    row.getCell('totalPrice').numFmt = '#,##0';
    row.alignment = { vertical: 'top', wrapText: true };

    if (groupIndex % 2 === 0) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC7CE' },
        };
      });
    }
  }

  const excelBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(excelBuffer);
}
