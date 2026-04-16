import type Redis from 'ioredis';
import type { UserAddressResult } from '../dto';
import type { IUserAddressRepository } from '../ports/output';

export interface ShippingInfoInput {
  recipient: string;
  phone: string;
  addressLine: string;
  ward: string;
  district: string;
  city: string;
}

type CachedShippingInfo = ShippingInfoInput & {
  addressId: string;
};

const REDIS_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

function cacheKey(userId: string): string {
  return `user:${userId}:shipping:last`;
}

function normalizePhone(value: string): string {
  return value.replace(/\s+/g, '').trim();
}

function normalizeInput(input: ShippingInfoInput): ShippingInfoInput {
  return {
    recipient: input.recipient.trim(),
    phone: normalizePhone(input.phone),
    addressLine: input.addressLine.trim(),
    ward: input.ward.trim(),
    district: input.district.trim(),
    city: input.city.trim(),
  };
}

function isValidCached(payload: unknown): payload is CachedShippingInfo {
  if (!payload || typeof payload !== 'object') return false;
  const obj = payload as Record<string, unknown>;
  return (
    typeof obj.addressId === 'string' &&
    typeof obj.recipient === 'string' &&
    typeof obj.phone === 'string' &&
    typeof obj.addressLine === 'string' &&
    typeof obj.ward === 'string' &&
    typeof obj.district === 'string' &&
    typeof obj.city === 'string'
  );
}

export class UserShippingInfoService {
  constructor(
    private readonly addressRepository: IUserAddressRepository,
    private readonly redis: Redis,
  ) {}

  async getLastUsedAddress(userId: string): Promise<UserAddressResult | null> {
    const raw = await this.redis.get(cacheKey(userId));
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (isValidCached(parsed)) {
          const fromDb = await this.addressRepository.findById(userId, parsed.addressId);
          if (fromDb) {
            return fromDb;
          }
        }
      } catch {
        // ignore invalid cache
      }
    }

    const fallback = await this.addressRepository.findDefaultOrLatestByUserId(userId);
    if (fallback) {
      await this.rememberAddress(userId, {
        recipient: fallback.recipient,
        phone: fallback.phone,
        addressLine: fallback.addressLine,
        ward: fallback.ward,
        district: fallback.district,
        city: fallback.city,
      });
    }

    return fallback;
  }

  async rememberAddress(userId: string, input: ShippingInfoInput): Promise<UserAddressResult> {
    const normalized = normalizeInput(input);

    const existing = await this.addressRepository.findMatchingByUserId(userId, normalized);
    const address =
      existing ??
      (await this.addressRepository.createForUser(userId, {
        ...normalized,
        isDefault: (await this.addressRepository.countByUserId(userId)) === 0,
      }));

    const payload: CachedShippingInfo = {
      addressId: address.id,
      ...normalized,
    };

    await this.redis.set(cacheKey(userId), JSON.stringify(payload), 'EX', REDIS_TTL_SECONDS);

    return address;
  }
}
