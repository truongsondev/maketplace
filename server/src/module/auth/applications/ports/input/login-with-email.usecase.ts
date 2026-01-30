import { LoginWithEmailCommand } from '../../dto/command/login-with-email.command';
import { AuthResult } from '../../dto/result/auth.result';

/**
 * Input Port - Login with Email Use Case
 * Defines the contract for authenticating a user with email and password
 */
export interface ILoginWithEmailUseCase {
  execute(command: LoginWithEmailCommand): Promise<AuthResult>;
}
