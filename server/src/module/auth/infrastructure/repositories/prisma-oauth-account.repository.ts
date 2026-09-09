import { PrismaClient, OAuthProvider } from '@/generated/prisma/client';
import { IOAuthAccountRepository } from '../../applications/ports/output/oauth-account.repository';

export class PrismaOAuthAccountRepository implements IOAuthAccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findUserIdByProvider(
    provider: OAuthProvider,
    providerUserId: string,
  ): Promise<string | null> {
    const row = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerUserId: {
          provider,
          providerUserId,
        },
      },
      select: {
        userId: true,
      },
    });

    return row?.userId ?? null;
  }

  async linkProviderToUser(params: {
    userId: string;
    provider: OAuthProvider;
    providerUserId: string;
  }): Promise<void> {
    try {
      await this.prisma.oAuthAccount.create({
        data: {
          userId: params.userId,
          provider: params.provider,
          providerUserId: params.providerUserId,
        },
      });
    } catch (error: any) {
      // Idempotent: ignore if the mapping already exists.
      const prismaCode = error?.code;
      if (prismaCode === 'P2002') {
        return;
      }
      throw error;
    }
  }
}
