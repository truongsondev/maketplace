import type { UserAddressResult } from '../dto';
import type { IGetLastUsedAddressUseCase } from '../ports/input';
import type { UserShippingInfoService } from '../services/user-shipping-info.service';

export class GetLastUsedAddressUseCase implements IGetLastUsedAddressUseCase {
  constructor(private readonly shippingInfoService: UserShippingInfoService) {}

  execute(userId: string): Promise<UserAddressResult | null> {
    return this.shippingInfoService.getLastUsedAddress(userId);
  }
}
