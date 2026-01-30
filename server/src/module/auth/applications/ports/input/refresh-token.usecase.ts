import { RefreshTokenCommand } from '../../dto/command/refresh-token.command';
import { AuthResult } from '../../dto/result/auth.result';

/**
 * Input Port - Refresh Token Use Case
 * Defines the contract for refreshing access token using refresh token
 */
export interface IRefreshTokenUseCase {
  execute(command: RefreshTokenCommand): Promise<AuthResult>;
}
