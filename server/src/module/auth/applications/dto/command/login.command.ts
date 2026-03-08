export interface LoginCommand {
  email: string;
  password: string;
  /** User-Agent hoặc tên thiết bị để nhận diện phiên đăng nhập */
  deviceInfo?: string;
}
