export function MarketplaceFooter() {
  return (
    <footer className="px-10 lg:px-40 py-8 border-t border-[#e6dedb] dark:border-[#3d2a24]">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-[#8a6b60] dark:text-[#d1c2bc]">
          © 2026 Marketplace Inc. All rights reserved.
        </p>
        <div className="flex gap-6 text-xs text-[#8a6b60] dark:text-[#d1c2bc]">
          <a className="hover:text-[#f45925] transition-colors" href="#">
            Terms of Service
          </a>
          <a className="hover:text-[#f45925] transition-colors" href="#">
            Privacy Policy
          </a>
          <a className="hover:text-[#f45925] transition-colors" href="#">
            Cookie Settings
          </a>
        </div>
      </div>
    </footer>
  );
}
