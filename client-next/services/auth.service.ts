// services/auth.service.js
export async function loginApi(payload: { password: string }) {
  // MOCK – thay bằng fetch thật sau
  await new Promise((r) => setTimeout(r, 800));

  if (payload.password !== "123456") {
    throw new Error("Sai thông tin đăng nhập");
  }

  return {
    accessToken: "fake-jwt-token",
    user: {
      id: 1,
      role: "BUYER",
      name: "Demo User",
    },
  };
}
