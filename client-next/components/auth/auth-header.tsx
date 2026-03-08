import Link from "next/link";
import { Search, ShoppingCart, Shirt, User } from "lucide-react";

const NAV_LINKS = [
  { label: "Cửa hàng", href: "#" },
  { label: "Bộ sưu tập", href: "#" },
  { label: "Khuyến mãi", href: "#" },
  { label: "Giới thiệu", href: "#" },
];

export function AuthHeader() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-border-color bg-white px-6 py-3 lg:px-10">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-3 text-text-main">
          <Shirt className="size-8 text-primary" />
          <span className="text-xl font-bold leading-tight tracking-[-0.015em]">
            VibeFashion
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-9">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-text-main text-sm font-medium leading-normal hover:text-primary transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Right: Search + Actions */}
      <div className="flex flex-1 justify-end items-center gap-6">
        {/* Search — desktop only */}
        <div className="hidden lg:flex items-stretch h-10 min-w-40 max-w-64 w-full rounded-lg bg-background-light border border-transparent focus-within:border-primary/50 transition-colors">
          <div className="flex items-center justify-center pl-4 text-text-muted">
            <Search className="size-5" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            className="flex-1 min-w-0 bg-transparent pl-2 pr-4 text-sm text-text-main placeholder:text-text-muted focus:outline-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            aria-label="Cart"
            className="flex items-center justify-center rounded-lg h-10 w-10 bg-background-light hover:bg-primary/10 hover:text-primary text-text-main transition-all"
          >
            <ShoppingCart className="size-5" />
          </button>

          <button
            aria-label="Account"
            className="flex items-center justify-center rounded-lg h-10 w-10 bg-primary text-white shadow-md hover:bg-primary-dark transition-all"
          >
            <User className="size-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
