import { RefreshTokenCommand, RefreshTokenResult } from '../../dto';

export interface IRefreshTokenUseCase {
  execute(command: RefreshTokenCommand): Promise<RefreshTokenResult>;
}
