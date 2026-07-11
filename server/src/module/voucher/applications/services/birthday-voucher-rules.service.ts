import { BadRequestError } from '../../../../error-handlling/badRequestError';

export const BIRTHDAY_VOUCHER_CODE = 'BIRTHDAY';

export function getBirthdayYear(now = new Date()): number {
  return now.getFullYear();
}

export function isBirthdayToday(birthday: Date | null | undefined, now = new Date()): boolean {
  if (!birthday) return false;
  return birthday.getMonth() === now.getMonth() && birthday.getDate() === now.getDate();
}

export function assertBirthdayVoucherCanBeUsed(params: {
  birthday: Date | null | undefined;
  usageCountForYear: number;
  now?: Date;
}): void {
  const now = params.now ?? new Date();
  if (!isBirthdayToday(params.birthday, now)) {
    throw new BadRequestError('Voucher sinh nhật chỉ áp dụng đúng ngày sinh nhật của bạn');
  }

  if (params.usageCountForYear > 0) {
    throw new BadRequestError('Voucher sinh nhật năm nay đã được sử dụng');
  }
}
