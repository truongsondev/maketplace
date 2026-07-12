import { Prisma, type PrismaClient } from '@/generated/prisma/client';
import { createLogger } from '../../../../shared/util/logger';
import type { IEmailSender } from '../../../auth/applications/ports';
import { BIRTHDAY_VOUCHER_CODE } from './birthday-voucher-rules.service';

type Db = PrismaClient | Prisma.TransactionClient;

type BirthdayUserRow = {
  id: string;
  email: string;
  birthday: Date;
};

export type BirthdayVoucherCronResult = {
  checked: number;
  granted: number;
  emailed: number;
  skipped: number;
  failed: number;
};

export class BirthdayVoucherCronService {
  private readonly logger = createLogger('BirthdayVoucherCronService');

  constructor(
    private readonly prisma: PrismaClient,
    private readonly emailSender: IEmailSender,
  ) {}

  async ensureBirthdayVoucher(db: Db = this.prisma) {
    const now = new Date();
    const configured = await db.discount.findFirst({
      where: { isBirthdayVoucher: true, isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
    const year = now.getFullYear();
    if (configured) {
      return db.discount.update({
        where: { id: configured.id },
        data: {
          userUsageLimit: 1,
          startAt: new Date(year, 0, 1, 0, 0, 0, 0),
          endAt: new Date(year, 11, 30, 23, 59, 59, 999),
        },
      });
    }

    return db.discount.upsert({
      where: { code: BIRTHDAY_VOUCHER_CODE },
      create: {
        code: BIRTHDAY_VOUCHER_CODE,
        description: 'Voucher sinh nhật hằng năm',
        type: 'FIXED_AMOUNT',
        value: new Prisma.Decimal(50_000),
        maxDiscount: null,
        minOrderAmount: null,
        maxUsage: null,
        userUsageLimit: 1,
        usedCount: 0,
        startAt: new Date(year, 0, 1, 0, 0, 0, 0),
        endAt: new Date(year, 11, 30, 23, 59, 59, 999),
        isActive: true,
        isBirthdayVoucher: true,
        scopeType: 'ALL_PRODUCTS',
        includeDescendants: false,
        minAmountBasis: 'ELIGIBLE_SUBTOTAL',
      },
      update: {
        isBirthdayVoucher: true,
        isActive: true,
        userUsageLimit: 1,
        startAt: new Date(year, 0, 1, 0, 0, 0, 0),
        endAt: new Date(year, 11, 30, 23, 59, 59, 999),
      },
    });
  }

  async runOnce(now = new Date(), batchSize = 200): Promise<BirthdayVoucherCronResult> {
    const voucher = await this.ensureBirthdayVoucher();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    const users = await this.prisma.$queryRaw<BirthdayUserRow[]>`
      SELECT id, email, birthday
      FROM users
      WHERE birthday IS NOT NULL
        AND email IS NOT NULL
        AND email_verified = TRUE
        AND status = 'ACTIVE'
        AND MONTH(birthday) = ${month}
        AND DAY(birthday) = ${day}
      LIMIT ${batchSize}
    `;

    const result: BirthdayVoucherCronResult = {
      checked: users.length,
      granted: 0,
      emailed: 0,
      skipped: 0,
      failed: 0,
    };

    for (const user of users) {
      try {
        const idempotencyKey = `BIRTHDAY:${user.id}:${year}`;
        const grant = await this.prisma.birthdayVoucherGrant.upsert({
          where: { userId_year: { userId: user.id, year } },
          create: {
            userId: user.id,
            discountId: voucher.id,
            year,
            birthdayDate: user.birthday,
            email: user.email,
            idempotencyKey,
          },
          update: {
            discountId: voucher.id,
            birthdayDate: user.birthday,
            email: user.email,
          },
        });

        if (grant.emailSentAt) {
          result.skipped += 1;
          continue;
        }

        result.granted += 1;
        await this.sendBirthdayVoucherEmail({
          email: user.email,
          code: voucher.code,
          value: Number(voucher.value),
          type: voucher.type,
          endAt: voucher.endAt,
        });
        await this.prisma.birthdayVoucherGrant.update({
          where: { id: grant.id },
          data: { emailSentAt: new Date() },
        });
        result.emailed += 1;
      } catch (error) {
        result.failed += 1;
        this.logger.warn('Failed to grant birthday voucher', {
          userId: user.id,
          email: user.email,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return result;
  }

  private async sendBirthdayVoucherEmail(params: {
    email: string;
    code: string;
    value: number;
    type: string;
    endAt: Date;
  }): Promise<void> {
    const valueLabel =
      params.type === 'PERCENTAGE'
        ? `${params.value}%`
        : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
            params.value,
          );
    const expiry = params.endAt.toLocaleDateString('vi-VN');

    await this.emailSender.send({
      to: params.email,
      subject: 'Chúc mừng sinh nhật - AURA gửi bạn voucher đặc biệt',
      html: `
        <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#171717">
          <h2 style="margin:0 0 12px">Chúc mừng sinh nhật!</h2>
          <p>AURA gửi bạn voucher sinh nhật trị giá <strong>${valueLabel}</strong>.</p>
          <div style="margin:24px 0;padding:18px;border:1px solid #ddd;text-align:center">
            <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#666">Mã voucher</div>
            <div style="font-size:28px;font-weight:700;letter-spacing:3px;margin-top:8px">${params.code}</div>
          </div>
          <p>Mã chỉ áp dụng đúng ngày sinh nhật của bạn và mỗi tài khoản chỉ dùng một lần trong năm.</p>
          <p style="font-size:13px;color:#666">Voucher được cấu hình hiệu lực đến ${expiry}.</p>
        </div>
      `,
    });
  }
}
