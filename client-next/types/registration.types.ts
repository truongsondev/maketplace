/**
 * Shared Types for Registration Flow
 */

export type RegistrationStep = "email" | "verify";
export type UserRole = "buyer" | "seller";

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  status: string;
  role: UserRole;
}

export interface OTPError {
  code: string;
  message: string;
}

export interface SendOTPRequest {
  email: string;
}

export interface SendOTPResponse {
  status: boolean;
  message: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
  password: string;
  userRole?: UserRole;
}

export interface VerifyOTPResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface ApiError {
  code: string;
  message: string;
  status?: number;
}
