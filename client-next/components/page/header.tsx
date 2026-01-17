export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-primary px-4 md:px-40 py-4 shadow-md">
      <div className="max-w-300 mx-auto flex items-center gap-8">
        <div className="flex items-center gap-2 text-white shrink-0">
          <div className="size-8">
            <svg
              fill="none"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                clipRule="evenodd"
                d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z"
                fill="currentColor"
                fillRule="evenodd"
              ></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Marketplace</h1>
        </div>

        <div className="flex-1">
          <div className="flex flex-col gap-2">
            <div className="flex w-full h-11 bg-white rounded-sm p-1">
              <input
                suppressHydrationWarning
                className="flex-1 border-none focus:ring-0 text-sm text-foreground px-4"
                placeholder="Search for products, brands and shops"
                type="text"
              />
              <button
                suppressHydrationWarning
                className="bg-primary px-6 rounded-sm text-white flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined">search</span>
              </button>
            </div>
            <div className="flex gap-3 text-xs text-white/90">
              <a className="hover:underline" href="#">
                iPhone 15
              </a>
              <a className="hover:underline" href="#">
                Gaming Laptop
              </a>
              <a className="hover:underline" href="#">
                Wireless Earbuds
              </a>
              <a className="hover:underline" href="#">
                Mechanical Keyboard
              </a>
              <a className="hover:underline" href="#">
                Summer Dress
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-white shrink-0">
          <a className="relative p-2" href="#">
            <span className="material-symbols-outlined text-3xl">
              shopping_cart
            </span>
            <span className="absolute top-0 right-0 bg-white text-primary text-[10px] font-bold px-1.5 rounded-full border border-primary">
              3
            </span>
          </a>
          <div className="flex items-center gap-2">
            <div className="size-9 bg-white/20 rounded-full flex items-center justify-center border border-white/40 overflow-hidden">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div className="hidden lg:block text-xs">
              <p className="font-medium">Welcome,</p>
              <p className="font-bold">Sign In</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
