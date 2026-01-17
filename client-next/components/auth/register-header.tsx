import Link from "next/link";

const LOGO_SVG = (
  <svg
    fill="currentColor"
    viewBox="0 0 48 48"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z"
      fillRule="evenodd"
    />
  </svg>
);

export default function Header() {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#dbe0e6] dark:border-b-[#2c3e50] bg-white dark:bg-background-dark px-10 py-3 sticky top-0 z-50">
      <div className="flex items-center gap-4 text-[#137fec]">
        <div className="size-6">{LOGO_SVG}</div>
        <h2 className="text-[#111418] dark:text-white text-xl font-black leading-tight tracking-[-0.015em]">
          Marketplace
        </h2>
      </div>

      <div className="flex flex-1 justify-end gap-8">
        <div className="flex items-center gap-9">
          <Link
            href="#"
            className="text-[#111418] dark:text-gray-300 text-sm font-medium leading-normal hover:text-[#137fec] transition-colors"
          >
            Help Center
          </Link>
          <Link
            href="#"
            className="text-[#111418] dark:text-gray-300 text-sm font-medium leading-normal hover:text-[#137fec] transition-colors"
          >
            Support
          </Link>
        </div>
        <Link
          href="/login"
          className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-[#137fec]/10 text-[#137fec] text-sm font-bold hover:bg-[#137fec]/20 transition-all"
        >
          Login
        </Link>
      </div>
    </header>
  );
}
