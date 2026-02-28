export interface ITokenRepository {
  saveToken(userId: string, token: string): Promise<void>;
  findTokenByUserId(userId: string): Promise<string | null>;
}
