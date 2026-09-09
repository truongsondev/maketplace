import type { UserAddressResult } from '../../applications/dto';
import type {
  IGetLastUsedAddressUseCase,
  IGetMyAddressesUseCase,
} from '../../applications/ports/input';

export class AddressController {
  constructor(
    private readonly getMyAddressesUseCase: IGetMyAddressesUseCase,
    private readonly getLastUsedAddressUseCase: IGetLastUsedAddressUseCase,
  ) {}

  getMyAddresses(userId: string): Promise<UserAddressResult[]> {
    return this.getMyAddressesUseCase.execute(userId);
  }

  getLastUsedAddress(userId: string): Promise<UserAddressResult | null> {
    return this.getLastUsedAddressUseCase.execute(userId);
  }
}
