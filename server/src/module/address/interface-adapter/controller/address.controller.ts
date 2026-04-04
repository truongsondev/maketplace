import type { UserAddressResult } from '../../applications/dto';
import type { IGetMyAddressesUseCase } from '../../applications/ports/input';

export class AddressController {
  constructor(private readonly getMyAddressesUseCase: IGetMyAddressesUseCase) {}

  getMyAddresses(userId: string): Promise<UserAddressResult[]> {
    return this.getMyAddressesUseCase.execute(userId);
  }
}
