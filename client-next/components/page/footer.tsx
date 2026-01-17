export function Footer() {
  return (
    <footer className="bg-white dark:bg-background-dark/80 border-t border-[#e6dedb] dark:border-white/10 pt-16 pb-8">
      <div className="max-w-[1200px] mx-auto px-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
        {/* Customer Service */}
        <div>
          <h5 className="text-xs font-bold uppercase mb-4">Customer Service</h5>
          <ul className="text-xs space-y-2 opacity-70">
            <li>
              <a className="hover:text-primary transition-colors" href="#">
                Help Centre
              </a>
            </li>
            <li>
              <a className="hover:text-primary transition-colors" href="#">
                How to Buy
              </a>
            </li>
            <li>
              <a className="hover:text-primary transition-colors" href="#">
                Shipping &amp; Delivery
              </a>
            </li>
            <li>
              <a className="hover:text-primary transition-colors" href="#">
                Return &amp; Refund
              </a>
            </li>
            <li>
              <a className="hover:text-primary transition-colors" href="#">
                Contact Us
              </a>
            </li>
          </ul>
        </div>

        {/* About Marketplace */}
        <div>
          <h5 className="text-xs font-bold uppercase mb-4">
            About Marketplace
          </h5>
          <ul className="text-xs space-y-2 opacity-70">
            <li>
              <a className="hover:text-primary transition-colors" href="#">
                About Us
              </a>
            </li>
            <li>
              <a className="hover:text-primary transition-colors" href="#">
                Careers
              </a>
            </li>
            <li>
              <a className="hover:text-primary transition-colors" href="#">
                Privacy Policy
              </a>
            </li>
            <li>
              <a className="hover:text-primary transition-colors" href="#">
                Seller Centre
              </a>
            </li>
            <li>
              <a className="hover:text-primary transition-colors" href="#">
                Flash Deals
              </a>
            </li>
          </ul>
        </div>

        {/* Payment Methods */}
        <div>
          <h5 className="text-xs font-bold uppercase mb-4">Payment Methods</h5>
          <div className="grid grid-cols-3 gap-2 pr-4">
            <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-[8px] font-bold">
              VISA
            </div>
            <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-[8px] font-bold">
              MASTER
            </div>
            <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-[8px] font-bold">
              PAYPAL
            </div>
            <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-[8px] font-bold">
              APPLE
            </div>
            <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-[8px] font-bold">
              G-PAY
            </div>
          </div>
        </div>

        {/* Follow Us */}
        <div>
          <h5 className="text-xs font-bold uppercase mb-4">Follow Us</h5>
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-xl opacity-60 cursor-pointer hover:text-primary transition-colors">
              public
            </span>
            <span className="material-symbols-outlined text-xl opacity-60 cursor-pointer hover:text-primary transition-colors">
              share
            </span>
            <span className="material-symbols-outlined text-xl opacity-60 cursor-pointer hover:text-primary transition-colors">
              group
            </span>
          </div>
        </div>

        {/* Marketplace App */}
        <div className="col-span-2 md:col-span-4 lg:col-span-1">
          <h5 className="text-xs font-bold uppercase mb-4">Marketplace App</h5>
          <div className="flex lg:flex-col gap-2">
            <div className="h-10 w-28 bg-black dark:bg-white rounded flex items-center justify-center text-white dark:text-black text-[10px] font-bold">
              App Store
            </div>
            <div className="h-10 w-28 bg-black dark:bg-white rounded flex items-center justify-center text-white dark:text-black text-[10px] font-bold">
              Play Store
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="max-w-[1200px] mx-auto px-4 pt-8 border-t border-[#e6dedb] dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs opacity-60">
        <p>© 2026 Marketplace Inc. All rights reserved.</p>
        <div className="flex gap-6">
          <span>
            Country &amp; Region: Singapore | Indonesia | Malaysia | Thailand |
            Vietnam | Philippines
          </span>
        </div>
      </div>
    </footer>
  );
}
