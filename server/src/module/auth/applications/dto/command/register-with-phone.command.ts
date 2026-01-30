/**
 * Command DTO for registering with phone
 */
export interface RegisterWithPhoneCommand {
  readonly phone: string;
  readonly password: string;
}
