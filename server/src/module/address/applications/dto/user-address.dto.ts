export interface UserAddressResult {
  id: string;
  recipient: string;
  phone: string;
  addressLine: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
  createdAt: Date;
}
