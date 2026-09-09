export interface ISessionVerifier {
  verifySession(token: string): Promise<string | null>;
}
