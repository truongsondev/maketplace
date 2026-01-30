/**
 * Result DTO for authentication operations
 */
export interface AuthResult {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
  readonly user: UserDto;
}

export interface UserDto {
  readonly id: string;
  readonly email?: string;
  readonly phone?: string;
  readonly emailVerified: boolean;
  readonly phoneVerified: boolean;
  readonly status: string;
}

export interface OTPResult {
  readonly status: boolean;
  readonly message: string;
}
