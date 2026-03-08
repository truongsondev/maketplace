export interface LogoutCommand {
  /** Access token lấy từ Authorization header (đã bỏ prefix "Bearer ") */
  accessToken: string;
  /** Refresh token gửi từ client để thu hồi (optional) */
  refreshToken?: string;
}
