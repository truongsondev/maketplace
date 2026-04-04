import type { UserAddressResult } from '../../dto';

export interface IGetMyAddressesUseCase {
  execute(userId: string): Promise<UserAddressResult[]>;
}
