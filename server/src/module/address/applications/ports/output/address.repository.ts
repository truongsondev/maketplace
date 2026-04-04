import type { UserAddressResult } from '../../dto';

export interface IUserAddressRepository {
  findByUserId(userId: string): Promise<UserAddressResult[]>;
}
