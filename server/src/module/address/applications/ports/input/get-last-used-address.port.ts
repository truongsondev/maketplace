import type { UserAddressResult } from '../../dto';

export interface IGetLastUsedAddressUseCase {
  execute(userId: string): Promise<UserAddressResult | null>;
}
