import { RegisterWithPhoneCommand } from '../../dto/command/register-with-phone.command';
import { AuthResult } from '../../dto/result/auth.result';

/**
 * Input Port - Register with Phone Use Case
 * Defines the contract for registering a new user with phone and password
 */
export interface IRegisterWithPhoneUseCase {
  execute(command: RegisterWithPhoneCommand): Promise<AuthResult>;
}
