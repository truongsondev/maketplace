import { RegisterWithEmailCommand } from '../../dto/command/register-with-email.command';
import { AuthResult } from '../../dto/result/auth.result';

/**
 * Input Port - Register with Email Use Case
 * Defines the contract for registering a new user with email and password
 */
export interface IRegisterWithEmailUseCase {
  execute(command: RegisterWithEmailCommand): Promise<AuthResult>;
}
