import {
  PrismaClient,
  User as PrismaUser,
  UserStatus as PrismaUserStatus,
} from '@/generated/prisma/client';
import { IUserRepository } from '../../applications/ports/output/user.repository';
import { User, UserStatus } from '../../entities/user/user.entity';
import { Email } from '../../entities/value-object/email.vo';
import { Phone } from '../../entities/value-object/phone.vo';

/**
 * Prisma implementation of User Repository
 */
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user ? this.toDomain(user) : null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { phone },
    });

    return user ? this.toDomain(user) : null;
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user ? this.toDomain(user) : null;
  }

  async save(user: User): Promise<User> {
    const data = {
      email: user.email?.getValue() ?? null,
      phone: user.phone?.getValue() ?? null,
      passwordHash: user.passwordHash ?? null,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      status: user.status as PrismaUserStatus,
    };

    // If user has ID, update; otherwise create
    if (user.id) {
      const updated = await this.prisma.user.update({
        where: { id: user.id },
        data,
      });
      return this.toDomain(updated);
    }

    const created = await this.prisma.user.create({
      data,
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
  private toDomain(prismaUser: PrismaUser): User {
    return User.fromPersistence({
      id: prismaUser.id,
      email: prismaUser.email ? new Email(prismaUser.email) : undefined,
      phone: prismaUser.phone ? new Phone(prismaUser.phone) : undefined,
      passwordHash: prismaUser.passwordHash ?? undefined,
      emailVerified: prismaUser.emailVerified,
      phoneVerified: prismaUser.phoneVerified,
      status: prismaUser.status as UserStatus,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    });
  }
}
