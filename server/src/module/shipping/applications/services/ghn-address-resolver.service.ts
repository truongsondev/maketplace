import { BadRequestError } from '../../../../error-handlling/badRequestError';
import type { GhnClient } from '../../infrastructure/ghn/ghn.client';

type MasterDataRow = Record<string, unknown>;

const ADMIN_PREFIX = /^(tinh|thanh pho|tp|quan|huyen|thi xa|thi tran|phuong|xa)\s+/;

export function normalizeAdministrativeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(ADMIN_PREFIX, '')
    .trim();
}

function findUnique(rows: unknown[], name: string, nameKey: string, label: string): MasterDataRow {
  const expected = normalizeAdministrativeName(name);
  const matches = rows
    .filter((row): row is MasterDataRow => Boolean(row) && typeof row === 'object')
    .filter(row => typeof row[nameKey] === 'string' && normalizeAdministrativeName(String(row[nameKey])) === expected);
  if (matches.length !== 1) {
    const reason = matches.length === 0 ? 'không tìm thấy' : 'có nhiều kết quả trùng';
    throw new BadRequestError(`Không thể xác định ${label} GHN từ "${name}" (${reason}). Vui lòng cập nhật địa chỉ giao hàng.`);
  }
  return matches[0];
}

function requiredNumber(row: MasterDataRow, key: string, label: string): number {
  const value = Number(row[key]);
  if (!Number.isInteger(value) || value <= 0) throw new BadRequestError(`GHN không trả về ${label} hợp lệ`);
  return value;
}

export class GhnAddressResolverService {
  constructor(private readonly client: GhnClient) {}

  async resolve(address: { city: string; district: string; ward: string }) {
    const province = findUnique(await this.client.provinces(), address.city, 'ProvinceName', 'tỉnh/thành phố');
    const provinceId = requiredNumber(province, 'ProvinceID', 'ProvinceID');
    const district = findUnique(await this.client.districts(provinceId), address.district, 'DistrictName', 'quận/huyện');
    const districtId = requiredNumber(district, 'DistrictID', 'DistrictID');
    const ward = findUnique(await this.client.wards(districtId), address.ward, 'WardName', 'phường/xã');
    const wardCode = typeof ward.WardCode === 'string' ? ward.WardCode.trim() : String(ward.WardCode || '').trim();
    if (!wardCode) throw new BadRequestError('GHN không trả về WardCode hợp lệ');
    return { provinceId, districtId, wardCode };
  }
}
