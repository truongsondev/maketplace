import {
  PrismaClient,
  User as PrismaUser,
  UserProfile as PrismaUserProfile,
  UserStatus as PrismaUserStatus,
  Gender as PrismaGender,
} from '@/generated/prisma/client';
import { IUserRepository } from '../../applications/ports/output/user.repository';
import { User, UserStatus } from '../../entities/user/user.entity';
import { UserProfile, Gender } from '../../entities/user/user-profile.entity';
import { Email } from '../../entities/value-object/email.vo';

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    return user ? this.toDomain(user) : null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { phone },
      include: { profile: true },
    });

    return user ? this.toDomain(user) : null;
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    return user ? this.toDomain(user) : null;
  }

  async save(user: User): Promise<User> {
    const data = {
      email: user.email?.getValue() ?? null,
      passwordHash: user.passwordHash ?? null,
      emailVerified: user.emailVerified,
      status: user.status as PrismaUserStatus,
    };

    if (user.id) {
      const updated = await this.prisma.user.update({
        where: { id: user.id },
        data,
      });
      return this.toDomain(updated);
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data,
      });

      const buyerRole = await tx.role.findUnique({
        where: { code: 'BUYER' },
      });

      if (!buyerRole) {
        throw new Error('BUYER role not found in database');
      }

      // 3. Assign BUYER role to new user
      await tx.userRole.create({
        data: {
          userId: newUser.id,
          roleId: buyerRole.id,
        },
      });

      return newUser;
    });

    return this.toDomain(created);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email },
    });
    return count > 0;
  }

  async existsByPhone(phone: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { phone },
    });
    return count > 0;
  }

  /**
   * Map Prisma User to Domain User
   */
  private toDomain(prismaUser: PrismaUser & { profile?: PrismaUserProfile | null }): User {
    return User.fromPersistence({
      id: prismaUser.id,
      email: prismaUser.email ? new Email(prismaUser.email) : undefined,
      passwordHash: prismaUser.passwordHash ?? undefined,
      emailVerified: prismaUser.emailVerified,
      status: prismaUser.status as UserStatus,
      profile: prismaUser.profile ? this.toProfileDomain(prismaUser.profile) : undefined,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    });
  }

  /**
   * Map Prisma UserProfile to Domain UserProfile
   */
  private toProfileDomain(prismaProfile: PrismaUserProfile): UserProfile {
    return UserProfile.fromPersistence({
      userId: prismaProfile.userId,
      fullName: prismaProfile.fullName ?? undefined,
      avatarUrl: prismaProfile.avatarUrl ?? undefined,
      gender: prismaProfile.gender ? (prismaProfile.gender as Gender) : undefined,
      birthday: prismaProfile.birthday ?? undefined,
      createdAt: prismaProfile.createdAt,
      updatedAt: prismaProfile.updatedAt,
    });
  }
}
