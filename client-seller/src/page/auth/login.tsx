import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Mail, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await login({ email, password });
      navigate("/products");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <main className="flex flex-col md:flex-row min-h-screen overflow-hidden">
      <section className="hidden md:flex md:w-1/2 relative overflow-hidden bg-[#F5F5DC]">
        <img
          alt="Mẫu thời trang chất lượng cao"
          className="absolute inset-0 w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxl762Bk_kcod5mgxiAzghFxrIFcQkOznl7F3lker5w578fJl0FkqzHBRCvEMYk42h0Vyqx34sLA8LpoR1WT2HJbeimeuUKrf9CQdeFyvU-UKzgya6ccx50youx3zn_B9g29lhsGPMuAPQ1PXu1HXsIW6c7KvKnoy7JjVeeL1_C4pqcy-eurpFMENkBdi_fFVlucS_OyOIwo16wE4KjFwbA9yCu-o4mPeCRyKiMppcYnQcDQmqw6d78xOsxtntP13Ctpqk6fqQPZM"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(245,245,220,0.4)] to-[rgba(245,245,220,0.4)]"></div>
        <div className="relative z-10 flex items-center justify-center w-full h-full p-12 text-center">
          <h1 className="font-serif text-5xl lg:text-7xl text-[#1A1A1A] tracking-[0.15em] uppercase leading-tight">
            Khám phá <br /> <span className="italic">phong cách</span> của bạn
          </h1>
        </div>
      </section>

      <section className="flex flex-col justify-center items-center w-full md:w-1/2 p-8 md:p-16 lg:p-24 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-bold tracking-[0.3em] uppercase">
              AURA
            </h2>
          </div>

          <div className="mb-10">
            <h3 className="text-2xl font-light mb-2">Chào mừng trở lại</h3>
            <p className="text-gray-500 text-sm">
              Vui lòng nhập thông tin đăng nhập để truy cập trang quản trị.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <label
                className="block text-xs uppercase tracking-widest text-gray-400 mb-2"
                htmlFor="email"
              >
                Địa chỉ email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  className="w-full pl-10 pr-4 py-3 border-b border-gray-200 focus:outline-none focus:border-[#D4AF37] focus:ring-0 transition-all placeholder-gray-300 bg-transparent"
                  id="email"
                  name="email"
                  placeholder="admin@luxurybrand.com"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="relative">
              <label
                className="block text-xs uppercase tracking-widest text-gray-400 mb-2"
                htmlFor="password"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  className="w-full pl-10 pr-4 py-3 border-b border-gray-200 focus:outline-none focus:border-[#D4AF37] focus:ring-0 transition-all placeholder-gray-300 bg-transparent"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input
                  className="h-4 w-4 text-[#1A1A1A] focus:ring-[#D4AF37] border-gray-300 rounded"
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <label
                  className="ml-2 block text-gray-600"
                  htmlFor="remember-me"
                >
                  Ghi nhớ đăng nhập
                </label>
              </div>
              <div className="text-sm">
                <a
                  className="font-medium text-[#D4AF37] hover:text-yellow-700 transition-colors"
                  href="#"
                >
                  Quên mật khẩu?
                </a>
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <button
                className="w-full flex justify-center items-center py-4 px-4 border border-transparent text-sm font-semibold text-white bg-[#1A1A1A] hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A1A1A] transition-all tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </button>

              <div className="relative my-6">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center"
                >
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-400">Hoặc</span>
                </div>
              </div>

              <button
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
                type="button"
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Tiếp tục với Google
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-xs text-gray-400 uppercase tracking-widest">
            © 2024 Luxury Fashion Group. Bảo lưu mọi quyền.
          </p>
        </div>
      </section>
    </main>
  );
}
