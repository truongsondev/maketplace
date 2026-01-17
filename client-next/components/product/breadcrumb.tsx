export function ProductBreadcrumb() {
  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
      <a className="hover:text-primary transition-colors" href="/">
        Home
      </a>
      <span className="material-symbols-outlined text-sm">chevron_right</span>
      <a className="hover:text-primary transition-colors" href="#category">
        Audio & Headphones
      </a>
      <span className="material-symbols-outlined text-sm">chevron_right</span>
      <span className="text-foreground font-medium">Wireless Headphones</span>
    </nav>
  );
}
