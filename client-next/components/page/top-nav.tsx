export function TopNav() {
  return (
    <nav className="bg-primary text-white text-xs py-1.5 px-4 md:px-40 flex justify-between items-center border-b border-primary/20">
      <div className="flex gap-4">
        <a className="hover:opacity-80" href="#">
          Seller Centre
        </a>
        <span className="opacity-40">|</span>
        <a className="hover:opacity-80" href="#">
          Download
        </a>
        <span className="opacity-40">|</span>
        <a className="hover:opacity-80" href="#">
          Follow us on social
        </a>
      </div>
      <div className="flex gap-4 items-center">
        <a className="flex items-center gap-1 hover:opacity-80" href="#">
          <span className="material-symbols-outlined text-[14px]">
            notifications
          </span>{" "}
          Notifications
        </a>
        <a className="flex items-center gap-1 hover:opacity-80" href="#">
          <span className="material-symbols-outlined text-[14px]">help</span>{" "}
          Help
        </a>
        <a
          className="flex items-center gap-1 hover:opacity-80 font-bold"
          href="#"
        >
          <span className="material-symbols-outlined text-[14px]">
            language
          </span>{" "}
          EN
        </a>
      </div>
    </nav>
  );
}
