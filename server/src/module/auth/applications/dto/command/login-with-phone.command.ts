/**
 * Command DTO for login with phone
 */
export interface LoginWithPhoneCommand {
  readonly phone: string;
  readonly password: string;
}
