/**
 * Port: ISessionVerifier
 *
 * Cross-cutting concern — used by AuthMiddleware (infrastructure layer)
 * to verify access tokens without coupling to a specific storage mechanism.
 */
export interface ISessionVerifier {
  /**
   * Given a raw access token, returns the associated userId
   * or null if the session does not exist / has expired.
   */
  verifySession(token: string): Promise<string | null>;
}
