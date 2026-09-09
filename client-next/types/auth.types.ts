import type { User } from "@/types/registration.types";

export interface SessionToken {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  userId?: string;
  fullName?: string;
  avatarUrl?: string | null;
  gender?: string | null;
  birthday?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface RefreshTokenResponseData {
  token: SessionToken;
  user: User;
  profile: UserProfile | null;
}
