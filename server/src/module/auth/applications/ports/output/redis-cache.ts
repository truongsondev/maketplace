export interface IRedisCache {
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  get(key: string): Promise<string | null>;
  /** Xoá key khỏi Redis (dùng để xoá session khi logout). */
  delete(key: string): Promise<void>;
}
