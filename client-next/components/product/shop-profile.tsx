export function ShopProfile() {
  return (
    <div className="bg-card dark:bg-card/50 rounded-xl shadow-sm p-4 lg:p-6 flex flex-col md:flex-row items-center gap-8 border border-border">
      {/* Shop Info */}
      <div className="flex items-center gap-4 pr-8 md:border-r border-border">
        <div
          className="w-16 h-16 rounded-full bg-cover bg-center border border-border shrink-0"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA-MOChixj8OJVvIU6Uc5GRndYS6tVCHBgN_hZc0pXN2LtqH8R85lwiyrGWwuYgZuLFOyna4GHntFGh63tzD_YqQ9Kx8z-LBeoo5sRtRf5S-Vjqx8_4vwkC4FxEypKAQYCeYMu3larXx7IHAj1d3LcetarrVpubaefyrE7NStivgKws5hp62TLrD8sCxsvp4lfQf_plwnSA7kbgSQvi-mVCY7oD7a-je69aDTvubz8C6LKgDs1oNMMvv8NueHbBgUQNg-cqEKspa9HT')",
          }}
          //   alt="TechGear Official shop logo"
        />
        <div>
          <h3 className="font-bold text-lg">TechGear Official</h3>
          <p className="text-xs text-muted-foreground">Active 12 minutes ago</p>
          <div className="flex gap-2 mt-2">
            <button
              suppressHydrationWarning
              className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded border border-primary/20 hover:bg-primary/20"
            >
              Chat Now
            </button>
            <button
              suppressHydrationWarning
              className="px-3 py-1 bg-muted text-xs font-bold rounded border border-border hover:bg-muted/80"
            >
              View Shop
            </button>
          </div>
        </div>
      </div>

      {/* Shop Stats */}
      <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8 text-sm w-full">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Ratings</span>
          <span className="text-primary font-medium">1.2M</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Response Rate</span>
          <span className="text-primary font-medium">99%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Joined</span>
          <span className="text-primary font-medium">4 years ago</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Products</span>
          <span className="text-primary font-medium">452</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Response Time</span>
          <span className="text-primary font-medium">within hours</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Followers</span>
          <span className="text-primary font-medium">854k</span>
        </div>
      </div>
    </div>
  );
}
