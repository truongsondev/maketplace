import { OAuthProvider } from '@/generated/prisma/client';

export interface IOAuthAccountRepository {
  findUserIdByProvider(provider: OAuthProvider, providerUserId: string): Promise<string | null>;

  linkProviderToUser(params: {
    userId: string;
    provider: OAuthProvider;
    providerUserId: string;
  }): Promise<void>;
}
