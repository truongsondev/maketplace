export interface ITokenGenerator {
  generateRandomToken(bytes?: number): string;

  hashToken(token: string): string;
}
