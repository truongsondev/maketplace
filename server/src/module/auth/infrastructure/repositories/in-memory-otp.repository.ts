import { IOtpRepository, OtpData } from '../../applications/ports';

/**
 * In-memory OTP Repository implementation
 * Useful for tests or local development without DB.
 */
export class InMemoryOtpRepository implements IOtpRepository {
  private readonly otpStore = new Map<string, OtpData>();

  async save(data: OtpData): Promise<void> {
    this.otpStore.set(data.email.toLowerCase(), data);
  }

  async findByEmail(email: string): Promise<OtpData | null> {
    return this.otpStore.get(email.toLowerCase()) ?? null;
  }

  async deleteByEmail(email: string): Promise<void> {
    this.otpStore.delete(email.toLowerCase());
  }

  async incrementAttempts(email: string): Promise<void> {
    const key = email.toLowerCase();
    const current = this.otpStore.get(key);
    if (!current) return;

    this.otpStore.set(key, {
      ...current,
      attempts: current.attempts + 1,
    });
  }
}
