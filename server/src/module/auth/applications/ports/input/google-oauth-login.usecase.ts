import { GoogleOAuthLoginCommand } from '../../dto/command/google-oauth-login.command';
import { LoginResult } from '../../dto/result/login.result';

export interface IGoogleOAuthLoginUseCase {
  execute(command: GoogleOAuthLoginCommand): Promise<LoginResult>;
}
