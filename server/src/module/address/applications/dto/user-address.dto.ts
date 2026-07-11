export interface UserAddressResult {
  id: string;
  recipient: string;
  phone: string;
  addressLine: string;
  ward: string;
  district: string;
  city: string;
  ghnProvinceId: number | null;
  ghnDistrictId: number | null;
  ghnWardCode: string | null;
  isDefault: boolean;
  createdAt: Date;
}
