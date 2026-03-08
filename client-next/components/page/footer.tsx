export function Footer() {
  return (
    <footer className="bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 py-6 text-center mt-auto transition-colors duration-200">
      <p className="text-neutral-500 dark:text-neutral-400 text-xs">
        © 2024 VIBE Fashion. Tất cả quyền được bảo lưu.
      </p>
      <div className="flex justify-center gap-4 mt-2">
        <a
          href="#"
          className="text-neutral-500 dark:text-neutral-400 text-xs hover:text-primary transition-colors"
        >
          Chính sách bảo mật
        </a>
        <a
          href="#"
          className="text-neutral-500 dark:text-neutral-400 text-xs hover:text-primary transition-colors"
        >
          Điều khoản dịch vụ
        </a>
      </div>
    </footer>
  );
}
