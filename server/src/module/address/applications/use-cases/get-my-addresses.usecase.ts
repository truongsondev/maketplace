import type { UserAddressResult } from '../dto';
import type { IGetMyAddressesUseCase } from '../ports/input';
import type { IUserAddressRepository } from '../ports/output';

export class GetMyAddressesUseCase implements IGetMyAddressesUseCase {
  constructor(private readonly addressRepository: IUserAddressRepository) {}

  execute(userId: string): Promise<UserAddressResult[]> {
    return this.addressRepository.findByUserId(userId);
  }
}
