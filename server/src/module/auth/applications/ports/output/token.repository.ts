export interface ITokenRepository {
  /**
   * Lưu refresh token mới cho user.
   * Nếu deviceInfo được cung cấp, sẽ thu hồi token cũ của thiết bị đó trước khi tạo mới.
   */
  saveToken(userId: string, hashedToken: string, deviceInfo?: string): Promise<void>;

  /**
   * Thu hồi tất cả token đang active của một thiết bị cụ thể.
   */
  revokeTokensByDevice(userId: string, deviceInfo: string): Promise<void>;

  /**
   * Thu hồi một refresh token cụ thể (dùng khi client gửi lại token lúc logout).
   */
  revokeTokenByHash(hashedToken: string): Promise<void>;

  /**
   * Thu hồi toàn bộ refresh token của user (dùng cho logout all devices).
   */
  revokeAllTokensByUserId(userId: string): Promise<void>;

  /**
   * Tìm token mới nhất của user (dùng cho backward compat).
   */
  findTokenByUserId(userId: string): Promise<string | null>;
}
