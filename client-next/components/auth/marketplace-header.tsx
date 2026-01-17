export function MarketplaceHeader() {
  return (
    <header className=" flex items-center justify-between whitespace-nowrap border-b border-solid border-[#e6dedb] dark:border-[#3d2a24] bg-white dark:bg-[#1a0e0b] px-10 py-3 lg:px-40">
      <div className="flex items-center gap-4 text-[#f45925] ">
        <div className="size-6">
          <svg
            fill="currentColor"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              clipRule="evenodd"
              d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z"
              fillRule="evenodd"
            ></path>
          </svg>
        </div>
        <h2 className="text-[#181311] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
          Marketplace
        </h2>
      </div>
      <div className="flex flex-1 justify-end gap-8">
        <div className="hidden md:flex items-center gap-9">
          <a
            className="text-[#181311] dark:text-[#d1c2bc] text-sm font-medium leading-normal hover:text-[#f45925] transition-colors"
            href="#"
          >
            Help Center
          </a>
          <a
            className="text-[#181311] dark:text-[#d1c2bc] text-sm font-medium leading-normal hover:text-[#f45925] transition-colors"
            href="#"
          >
            Privacy Policy
          </a>
        </div>
        <button className="flex min-w-21 max-w-120 cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#f45925] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-opacity-90 transition-all">
          <span className="truncate">Register</span>
        </button>
      </div>
    </header>
  );
}
