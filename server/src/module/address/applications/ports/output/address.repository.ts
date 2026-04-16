import type { UserAddressResult } from '../../dto';

export interface IUserAddressRepository {
  findByUserId(userId: string): Promise<UserAddressResult[]>;

  findById(userId: string, id: string): Promise<UserAddressResult | null>;

  findDefaultOrLatestByUserId(userId: string): Promise<UserAddressResult | null>;

  findMatchingByUserId(
    userId: string,
    input: {
      recipient: string;
      phone: string;
      addressLine: string;
      ward: string;
      district: string;
      city: string;
    },
  ): Promise<UserAddressResult | null>;

  countByUserId(userId: string): Promise<number>;

  createForUser(
    userId: string,
    input: {
      recipient: string;
      phone: string;
      addressLine: string;
      ward: string;
      district: string;
      city: string;
      isDefault: boolean;
    },
  ): Promise<UserAddressResult>;
}
