/**
 * Command DTO for login with email
 */
export interface LoginWithEmailCommand {
  readonly email: string;
  readonly password: string;
}
