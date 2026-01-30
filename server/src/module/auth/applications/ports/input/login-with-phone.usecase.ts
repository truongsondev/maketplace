import { LoginWithPhoneCommand } from '../../dto/command/login-with-phone.command';
import { AuthResult } from '../../dto/result/auth.result';

/**
 * Input Port - Login with Phone Use Case
 * Defines the contract for authenticating a user with phone and password
 */
export interface ILoginWithPhoneUseCase {
  execute(command: LoginWithPhoneCommand): Promise<AuthResult>;
}
