import Link from "next/link";

export function AuthFooter() {
  return (
    <footer className="bg-white border-t border-border-color py-6 text-center">
      <p className="text-text-muted text-xs">
        © 2024 VibeFashion. Tất cả quyền được bảo lưu.
      </p>
      <div className="flex justify-center gap-4 mt-2">
        <Link
          href="#"
          className="text-text-muted text-xs hover:text-primary transition-colors"
        >
          Chính sách bảo mật
        </Link>
        <Link
          href="#"
          className="text-text-muted text-xs hover:text-primary transition-colors"
        >
          Điều khoản dịch vụ
        </Link>
      </div>
    </footer>
  );
}
